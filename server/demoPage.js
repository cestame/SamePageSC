// A demo class list for trying the Chrome extension without a USC login. It uses the same markup
// structure as USC Web Registration's course list (the element ids and classes the extension reads),
// but none of USC's name, logo or styling, and it says plainly that it is a demo. Every section on it
// is a fictional sample professor from the seed data.

import { PRODUCT_NAME } from '../shared/content.js';

const escapeHtml = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/** "14:00" becomes "02:00pm", the way webReg writes times. */
function to12Hour(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  const suffix = h >= 12 ? 'pm' : 'am';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${String(hour).padStart(2, '0')}:${String(m).padStart(2, '0')}${suffix}`;
}

/** "MW 10:00-11:50" becomes { days: "MW", time: "10:00am-11:50am" }. */
export function webregMeeting(schedule) {
  const match = String(schedule || '').match(/^(\S+)\s+(\d{1,2}:\d{2})-(\d{1,2}:\d{2})$/);
  if (!match) return { days: '', time: 'TBA' };
  return { days: match[1], time: `${to12Hour(match[2])}-${to12Hour(match[3])}` };
}

function cell(label, values, width = 1) {
  const spans = values.map((v) => `<span>${escapeHtml(v)}<br></span>`).join('');
  return `<span class="section_row col-${width}"><span class="table-headers-xsmall">${label}: </span>${spans}</span>`;
}

function sectionRow(s) {
  const { days, time } = webregMeeting(s.schedule);
  return `
      <div id="section_${escapeHtml(s.section)}" class="section">
        <div class="section-row">
          <div class="section_crsbin">
            <span class="section_row col-1"><span class="table-headers-xsmall">Section: </span><b>${escapeHtml(s.section)} R</b></span>
            ${cell('Type', ['Lecture'])}
            ${cell('Time', [time], 2)}
            ${cell('Days', days ? [days] : [])}
            ${cell('Instructor', [s.name], 2)}
            <a></a>
          </div>
        </div>
      </div>`;
}

function courseBlock(course) {
  const id = escapeHtml(course.code.replace(/\s+/g, '-'));
  return `
    <section class="course">
      <h2 class="course-header"><span class="crsID">${escapeHtml(course.code.replace(/\s+/g, '-'))}:</span> <span class="crsTitl">${escapeHtml(course.title)}</span></h2>
      <div id="courseBin_${id}" class="accordion-content-area">
        <div class="section-table">
          <div class="section_head">
            <span class="col-1">Section</span><span class="col-1">Type</span><span class="col-2">Time</span><span class="col-1">Days</span><span class="col-2">Instructor</span>
          </div>${course.sections.map(sectionRow).join('')}
        </div>
      </div>
    </section>`;
}

/** The whole page. `courses`: [{ code, title, sections: [{ section, schedule, name }] }]. */
export function renderDemoPage(courses) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Demo class list</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible+Next:wght@400;700&display=swap">
<style>
  :root { --bg: #f4f4f2; --surface: #ffffff; --line: #dcdcd6; --text: #1d1d1b; --muted: #5b5b55; }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--bg); color: var(--text); font: 16px/1.5 "Atkinson Hyperlegible Next", "Segoe UI", system-ui, sans-serif; }
  main { max-width: 1040px; margin: 0 auto; padding: 24px max(16px, env(safe-area-inset-left, 0px)) 48px; display: grid; gap: 24px; }
  h1 { margin: 0; font-size: 1.75rem; line-height: 1.2; }
  .notice { margin: 8px 0 0; color: var(--muted); max-width: 65ch; }
  .course { background: var(--surface); box-shadow: 0 0 0 1px var(--line); }
  .course-header { margin: 0; padding: 12px 16px; font-size: 1.125rem; border-bottom: 1px solid var(--line); }
  .crsID { font-weight: 700; }
  .crsTitl { font-weight: 400; }
  .section_head, .section_crsbin { display: grid; grid-template-columns: 1fr 1fr 2fr 1fr 2fr; gap: 8px; padding: 10px 16px; }
  .section_head { font-weight: 700; font-size: 0.9375rem; color: var(--muted); border-bottom: 1px solid var(--line); }
  .section + .section .section_crsbin { border-top: 1px solid var(--line); }
  .section_row { display: flex; flex-direction: column; min-width: 0; }
  .table-headers-xsmall { display: none; }
  .section_crsbin > div:not(.section_row) { grid-column: 1 / -1; }
  .section_crsbin > a { display: none; }
  @media (max-width: 640px) {
    .section_head { display: none; }
    .section_crsbin { grid-template-columns: 1fr; gap: 2px; }
    .table-headers-xsmall { display: inline; color: var(--muted); }
    .section_row { flex-direction: row; flex-wrap: wrap; gap: 4px; }
  }
</style>
</head>
<body>
<main>
  <header>
    <h1>Demo class list</h1>
    <p class="notice">This page is a demo for the ${PRODUCT_NAME} Chrome extension. It is laid out like a university registration class list so you can try the extension without a student login. It is not a USC site, and every instructor here is a fictional sample professor.</p>
  </header>
${courses.map(courseBlock).join('\n')}
</main>
</body>
</html>`;
}
