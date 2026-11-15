// A demo class list for trying the Chrome extension without a USC login. It uses the same markup
// structure as USC Web Registration's course list (the element ids and classes the extension reads),
// with screenshot-matched registration styling and a visible demo notice. Every section on it
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
            ${cell('Session', ['001'])}
            ${cell('Type', [s.type || 'Lecture'])}
            ${cell('Units', [s.units ?? '—'])}
            ${cell('Registered', [s.registered ?? '—'])}
            ${cell('Time', [time], 2)}
            ${cell('Days', days ? [days] : [])}
            ${cell('Instructor', [s.name], 2)}
            ${cell('Location', [s.location || 'TBA'])}
            <button class="bin-button" type="button" data-section="${escapeHtml(s.section)}" aria-pressed="false">Add to myCourseBin</button>
            <a></a>
          </div>
        </div>
      </div>`;
}

function courseBlock(course) {
  const id = escapeHtml(course.code.replace(/\s+/g, '-'));
  return `
    <section class="course">
      <h2 class="course-header"><button class="course-toggle" type="button" aria-expanded="true" aria-controls="courseBin_${id}"><span class="chevron" aria-hidden="true"></span><span class="crsID">${escapeHtml(course.code.replace(/\s+/g, '-'))}:</span> <span class="crsTitl">${escapeHtml(course.title)}</span></button></h2>
      <div id="courseBin_${id}" class="accordion-content-area">
        ${course.description ? `<p class="description">${escapeHtml(course.description)}</p>` : ''}
        <div class="section-table">
          <div class="section_head">
            <span>Section</span><span>Session</span><span>Type</span><span>Units</span><span>Registered</span><span>Time</span><span>Days</span><span>Instructor</span><span>Location</span><span></span>
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
<title>Web Registration | Same Page Demo</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Lato:wght@400;700&display=swap">
<style>
:root { --cardinal:#990000; --gold:#ffcc00; --paper:#fff; --text:#252525; --line:#e8e7e7; --stripe:#f2f0f0; --muted:#6b6b6b; }
* { box-sizing:border-box; } body { margin:0; background:#e7e6e1; color:var(--text); font:16px/1.6 Lato,Arial,sans-serif; }
button,input { font:inherit; } button,a { -webkit-tap-highlight-color:transparent; } button { cursor:pointer; } a { color:var(--cardinal); } button:focus-visible,a:focus-visible,input:focus-visible { outline:3px solid var(--gold); outline-offset:3px; }
.masthead { background:var(--cardinal); color:white; border-top:7px solid #800000; }
.brand-row { padding:12px 2.5% 20px; display:flex; justify-content:space-between; align-items:center; }
.brand { font:40px/1.6 Georgia,serif; } .demo-label { font-size:14px; }
nav { display:flex; align-items:stretch; padding:0 2%; flex-wrap:wrap; } nav a,nav summary { display:block; padding:13px 16px; color:white; text-decoration:none; cursor:pointer; } nav details { position:relative; } nav summary { list-style:none; background:#850000; color:var(--gold); } nav summary::after { content:' ▾'; } .term-menu { position:absolute; background:#efeeea; min-width:220px; z-index:5; box-shadow:0 3px 6px #0002; } .term-menu button { display:block; width:100%; text-align:left; border:0; background:none; padding:16px; color:var(--cardinal); } .nav-end { margin-left:auto; }
main { margin:0 2%; padding:22px 2% 40px; background:var(--paper); min-height:70vh; box-shadow:0 3px 12px #0003; }
h1 { margin:0 0 10px; font-size:36px; line-height:1.5; } .notice { margin:0 0 20px; font-size:13px; color:var(--muted); } .search { display:flex; align-items:stretch; margin:12px 0 24px; max-width:480px; } .search input { min-width:0; flex:1; padding:10px; border:1px solid #ccc; box-shadow:inset 0 1px 3px #0001; } .search input::placeholder { font-style:italic; } .search button { border:0; padding:8px 20px; background:#e0e0e0; }
.list-heading { display:flex; gap:20px; align-items:center; justify-content:space-between; border-bottom:2px solid var(--line); margin-bottom:24px; padding-bottom:12px; } .list-heading h2 { margin:0; font-size:24px; } .expand-controls { display:flex; flex-shrink:0; } .expand-controls button { color:var(--muted); background:white; border:1px solid var(--cardinal); padding:2px 6px; font-size:12px; } .expand-controls button+button { border-left:0; }
.course-header { margin:0; font-size:16px; } .course-toggle { display:flex; align-items:baseline; gap:12px; padding:10px 22px; width:100%; border:0; background:transparent; text-align:left; color:inherit; font-weight:700; } .course:nth-child(odd) .course-header { background:var(--stripe); } .crsID { color:var(--cardinal); white-space:nowrap; } .chevron { display:inline-block; border-right:3px solid #111; border-bottom:3px solid #111; width:8px; height:8px; transform:rotate(45deg); align-self:center; margin-right:6px; flex-shrink:0; } [aria-expanded="false"] .chevron { transform:rotate(-45deg); }
.accordion-content-area { padding:12px 16px; border:1px solid #f0f0f0; } [hidden] { display:none!important; } .description { border:1px solid var(--line); border-left:5px solid #888; margin:0 0 22px; padding:12px; }
.section_head,.section_crsbin { display:grid; grid-template-columns:1fr 1fr 1fr 1fr 1fr 2fr 1fr 1fr 1fr 2fr; gap:8px; padding:4px 2px; align-items:start; font-size:14px; } .section_head { font-weight:700; border-bottom:2px solid #ddd; padding-top:12px; } .section:nth-child(even) { background:#f8f8f8; } .section_row { min-width:0; overflow-wrap:anywhere; } .section_row:nth-child(2) { color:var(--cardinal); } .section_row:nth-child(3) { color:#287d24; } .table-headers-xsmall { display:none; } .section_crsbin>div:not(.section_row) { grid-column:1/-1; } .section_crsbin>a { display:none; } .bin-button { background:transparent; color:var(--muted); border:1px solid var(--cardinal); border-radius:4px; line-height:1.3; padding:3px 6px; } .bin-button[aria-pressed="true"] { background:#f8f3df; color:var(--cardinal); }
.empty { padding:24px 0; } footer { text-align:center; padding:24px; } footer a { text-decoration:none; } footer p { margin:0; } footer a+a { margin-left:24px; }
@media(min-width:1600px) { body { font-size:20px; } .brand { font-size:48px; } h1 { font-size:44px; } .course-header { font-size:18px; } .section_head,.section_crsbin { font-size:16px; } }
@media(max-width:900px) { .nav-end { margin-left:0; } .section_head { display:none; } .section_crsbin { grid-template-columns:repeat(3,minmax(0,1fr)); gap:10px; padding:12px 4px; } .table-headers-xsmall { display:block; font-weight:700; color:var(--muted); } .bin-button { grid-column:1/-1; padding:8px; } .list-heading { align-items:flex-start; } }
@media(max-width:540px) { .brand { font-size:28px; } .brand-row { align-items:flex-start; flex-direction:column; } nav a,nav summary { padding:10px; font-size:14px; } h1 { font-size:28px; } .list-heading { flex-direction:column; gap:10px; } .list-heading h2 { font-size:21px; } .course-toggle { padding:10px; gap:8px; flex-wrap:wrap; } .crsTitl { flex-basis:100%; padding-left:24px; } .section_crsbin { grid-template-columns:repeat(2,minmax(0,1fr)); } }
@media print { .masthead, .notice, .search, .expand-controls, footer { display:none; } main { margin:0; padding:0; box-shadow:none; } }
</style>
</head>
<body>
<header class="masthead">
  <div class="brand-row"><span class="brand">Web Registration</span></div>
  <nav aria-label="Registration navigation">
    <details><summary>Spring 2027 Classes</summary><div class="term-menu"><button type="button">Spring 2027 Classes</button><p style="padding:0 16px;font-size:13px;color:#555">Demo contains Spring 2027 sample sections only.</p></div></details>
    <a href="/#/home">myInfo</a><a href="/#/home">myCourseBin</a><a href="/#/home">myCalendar</a><a class="nav-end" href="/#/home">Open ${escapeHtml(PRODUCT_NAME)}</a>
  </nav>
</header>
<main>
  <h1>Spring 2027 Classes</h1>
  <p class="notice">This is a ${escapeHtml(PRODUCT_NAME)} extension demo, not a USC site. All instructors are fictional samples. Course-bin selections stay on this page and do not register you for classes.</p>
  <form class="search" role="search"><input type="search" aria-label="Search courses" placeholder="Search Programs"><button type="submit">Find</button></form>
  <div class="list-heading"><h2>Courses with sample teaching profiles</h2><div class="expand-controls"><button type="button" data-expand="true">Expand All</button><button type="button" data-expand="false">Collapse All</button></div></div>
  <div id="courses">${courses.map(courseBlock).join('\n')}</div>
  <p class="empty" role="status" hidden>No courses match your search.</p>
  <p id="bin-status" role="status" aria-live="polite"></p>
</main>
<footer><a href="/#/privacy">Privacy Policy</a><a href="/#/home">Back to ${escapeHtml(PRODUCT_NAME)}</a><p>Independent student project. Registration interface recreated for demonstration.</p></footer>
<script>
const courseElements = [...document.querySelectorAll('.course')];
function setExpanded(course, expanded) {
  course.querySelector('.course-toggle').setAttribute('aria-expanded', String(expanded));
  course.querySelector('.accordion-content-area').hidden = !expanded;
}
document.querySelectorAll('.course-toggle').forEach(button => button.addEventListener('click', () => setExpanded(button.closest('.course'), button.getAttribute('aria-expanded') !== 'true')));
document.querySelectorAll('[data-expand]').forEach(button => button.addEventListener('click', () => courseElements.forEach(course => setExpanded(course, button.dataset.expand === 'true'))));
function searchCourses() {
  const query = document.querySelector('input[type="search"]').value.trim().toLowerCase();
  courseElements.forEach(course => { course.hidden = !course.textContent.toLowerCase().includes(query); });
  document.querySelector('.empty').hidden = courseElements.some(course => !course.hidden);
}
document.querySelector('.search').addEventListener('submit', event => { event.preventDefault(); searchCourses(); });
document.querySelector('input[type="search"]').addEventListener('input', searchCourses);
document.querySelector('.term-menu button').addEventListener('click', () => { document.querySelector('nav details').open = false; });
document.querySelectorAll('.bin-button').forEach(button => button.addEventListener('click', () => {
  const selected = button.getAttribute('aria-pressed') !== 'true';
  button.setAttribute('aria-pressed', String(selected));
  button.textContent = selected ? 'Remove from myCourseBin' : 'Add to myCourseBin';
  document.querySelector('#bin-status').textContent = document.querySelectorAll('.bin-button[aria-pressed="true"]').length + ' sections selected in this demo.';
}));
</script>
</body>
</html>`;
}
