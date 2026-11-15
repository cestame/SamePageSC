// Thin DOM layer: finds section tables and hands plain text to the tested parsers in parse.js.
// It only reads text. It never reads form fields, inputs, cookies or anything outside the tables.
import { cleanText, headerKey, normalizeCourseCode, parseRow } from './parse.js';

const MAX_TABLES = 60;
const MAX_ROWS_PER_TABLE = 80;

function headerMap(table) {
  const headRow = table.tHead?.rows[0] ?? table.rows[0];
  if (!headRow) return null;
  const keys = [...headRow.cells].map((c) => headerKey(c.textContent));
  return keys.includes('section') || keys.includes('time') ? keys : null;
}

/** Looks above the table for the nearest course code: a caption, a heading, or an earlier sibling. */
function courseContext(table) {
  const caption = normalizeCourseCode(table.caption?.textContent);
  if (caption) return caption;
  for (let el = table, depth = 0; el && depth < 6; el = el.parentElement, depth++) {
    const label = el.getAttribute?.('aria-label') ?? el.dataset?.course;
    const fromLabel = normalizeCourseCode(label);
    if (fromLabel) return fromLabel;
    for (let sib = el.previousElementSibling, hops = 0; sib && hops < 4; sib = sib.previousElementSibling, hops++) {
      const code = normalizeCourseCode(cleanText(sib.textContent, 200));
      if (code) return code;
    }
  }
  return null;
}

/** Returns [{ row, section }] for every section row found under `root`. */
export function extractSections(root) {
  const out = [];
  const tables = [...root.querySelectorAll('table')].slice(0, MAX_TABLES);
  for (const table of tables) {
    const keys = headerMap(table);
    if (!keys) continue;
    const course = courseContext(table);
    const bodyRows = [...(table.tBodies[0]?.rows ?? table.rows)].slice(0, MAX_ROWS_PER_TABLE);
    for (const row of bodyRows) {
      if (row.closest('[data-same-page]')) continue;
      const cells = { all: cleanText(row.textContent, 400) };
      [...row.cells].forEach((cell, i) => {
        if (keys[i] && !cells[keys[i]]) cells[keys[i]] = cleanText(cell.textContent, 160);
      });
      const rowCourse = normalizeCourseCode(cells.title) ?? course;
      const section = parseRow(cells, rowCourse);
      if (section) out.push({ row, section });
    }
  }
  return out;
}
