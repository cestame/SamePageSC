// Runs the eval suite against the real AI model. Needs ANTHROPIC_API_KEY, and every run is billed.
//
//   npm run eval                       all cases, once each
//   npm run eval -- --task extraction  only one task (extraction or explanation)
//   npm run eval -- --trials 3         run each case 3 times to see how stable the answers are
//   npm run eval -- --min-pass 0.9     exit with an error when fewer than 90% of runs pass (default 1)
//
// Results are printed as a table and saved to evals/results/<time>.json (gitignored).
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EXTRACTION_CASES, EXPLANATION_CASES } from './cases.js';
import { casePassed, gradeExplanation, gradeExtraction, summarize } from './harness.js';
import { aiConfigured, explainMatch, extractProfile } from '../server/ai.js';

const here = path.dirname(fileURLToPath(import.meta.url));

function readArgs(argv) {
  const value = (flag, fallback) => {
    const i = argv.indexOf(flag);
    return i === -1 ? fallback : argv[i + 1];
  };
  return { task: value('--task', 'all'), trials: Number(value('--trials', 1)), minPass: Number(value('--min-pass', 1)) };
}

function jobsFor({ task, trials }) {
  const jobs = [];
  for (let trial = 1; trial <= trials; trial++) {
    if (task !== 'explanation') jobs.push(...EXTRACTION_CASES.map((c) => () => gradeExtraction(c, extractProfile).then((r) => ({ ...r, trial }))));
    if (task !== 'extraction') jobs.push(...EXPLANATION_CASES.map((c) => () => gradeExplanation(c, explainMatch).then((r) => ({ ...r, trial }))));
  }
  return jobs;
}

/** Runs jobs a few at a time so a full suite finishes quickly without tripping rate limits. */
async function runPool(jobs, size = 4) {
  const results = [];
  let next = 0;
  const worker = async () => {
    while (next < jobs.length) {
      const job = jobs[next++];
      results.push(await job().catch((e) => ({ id: 'error', task: 'error', checks: [{ name: 'request', pass: false, detail: e.message }] })));
    }
  };
  await Promise.all(Array.from({ length: size }, worker));
  return results;
}

function printResults(results, summary) {
  for (const r of results) {
    console.log(`${casePassed(r) ? 'PASS' : 'FAIL'}  ${r.task}/${r.id}${r.trial > 1 ? ` (trial ${r.trial})` : ''}`);
    for (const c of r.checks.filter((x) => !x.pass)) console.log(`      ${c.soft ? 'note' : 'fail'}: ${c.name}${c.detail ? ` (${c.detail})` : ''}`);
  }
  console.log('');
  for (const [task, t] of Object.entries(summary.byTask)) {
    console.log(`${task}: ${t.passed} of ${t.cases} runs passed, ${t.checksPassed} of ${t.checks} checks passed`);
  }
  console.log(`overall: ${summary.passed} of ${summary.total} runs passed (${Math.round(summary.passRate * 100)}%)`);
}

async function main() {
  if (!aiConfigured()) {
    console.error('Set ANTHROPIC_API_KEY to run the evals. They call the real model and are billed.');
    process.exit(2);
  }
  const args = readArgs(process.argv.slice(2));
  const results = await runPool(jobsFor(args));
  const summary = summarize(results);
  printResults(results, summary);
  const dir = path.join(here, 'results');
  mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  writeFileSync(file, JSON.stringify({ args, summary, results }, null, 2));
  console.log(`saved ${path.relative(process.cwd(), file)}`);
  if (summary.passRate < args.minPass) process.exit(1);
}

main();
