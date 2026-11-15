// Runs the production explainMatch prompt against every case, grades each output with the
// deterministic checks, and (unless --no-judge) with a Claude judge. Writes a JSON report to
// evals/results/ and exits non-zero when the pass rate drops below the threshold.
//
//   ANTHROPIC_API_KEY=... npm run eval:explanations            # 2 Claude calls per case
//   ANTHROPIC_API_KEY=... npm run eval:explanations -- --no-judge --case pace-mismatch
import { mkdirSync, writeFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import Anthropic from '@anthropic-ai/sdk';
import { answersToText, explainMatch } from '../../server/ai.js';
import { scoreProfile } from '../../server/scoring.js';
import { CASES } from './cases.js';
import { gradeExplanation } from './graders.js';
import { judgeExplanation } from './judge.js';

const { values: args } = parseArgs({
  options: {
    'no-judge': { type: 'boolean', default: false },
    case: { type: 'string' },
    threshold: { type: 'string', default: '1' },
  },
});

async function runCase(client, c) {
  const { score, breakdown } = scoreProfile(c.answers, c.profile);
  const ctx = { ...c, score, breakdown };
  const output = await explainMatch({ answersText: answersToText(c.answers), professorName: c.professorName, profile: c.profile, summary: c.summary, score, breakdown });
  const checks = gradeExplanation(output, ctx);
  const judge = args['no-judge'] ? null : await judgeExplanation(client, output, ctx);
  const pass = checks.every((k) => k.pass) && (judge ? judge.pass : true);
  return { id: c.id, stresses: c.checks, score, output, checks, judge, pass };
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.log('Skipped: set ANTHROPIC_API_KEY to run this eval. It makes 2 Claude calls per case (1 with --no-judge).');
    return;
  }
  const client = new Anthropic();
  const cases = args.case ? CASES.filter((c) => c.id === args.case) : CASES;
  if (!cases.length) throw new Error(`No case named ${args.case}`);

  const results = [];
  for (const c of cases) {
    const r = await runCase(client, c);
    results.push(r);
    const failed = r.checks.filter((k) => !k.pass).map((k) => k.name);
    if (r.judge && !r.judge.pass) failed.push(`judge: ${r.judge.verdict.reason}`);
    console.log(`${r.pass ? 'PASS' : 'FAIL'}  ${c.id} (score ${r.score})${failed.length ? `\n      ${failed.join('\n      ')}` : ''}`);
  }

  const passRate = results.filter((r) => r.pass).length / results.length;
  const dir = new URL('../results/', import.meta.url);
  mkdirSync(dir, { recursive: true });
  const file = new URL(`explanations-${new Date().toISOString().replace(/[:.]/g, '-')}.json`, dir);
  writeFileSync(file, JSON.stringify({ passRate, judged: !args['no-judge'], results }, null, 2));
  console.log(`\n${Math.round(passRate * 100)}% of ${results.length} cases passed. Report: ${file.pathname}`);
  if (passRate < Number(args.threshold)) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
