import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderDemoPage, simulationHref, webregMeeting } from './demoPage.js';

test('meeting times are written the way webReg writes them', () => {
  assert.deepEqual(webregMeeting('MW 10:00-11:50'), { days: 'MW', time: '10:00am-11:50am' });
  assert.deepEqual(webregMeeting('TTh 14:00-15:20'), { days: 'TTh', time: '02:00pm-03:20pm' });
  assert.deepEqual(webregMeeting('TBA'), { days: '', time: 'TBA' });
});

test('the demo page uses the markup the extension reads, and escapes names', () => {
  const html = renderDemoPage([{ code: 'CSCI 103', title: 'Object Oriented Programming', sections: [{ section: '29901', schedule: 'MW 10:00-11:50', name: 'Dr. <Maya> Reyes' }] }]);
  assert.match(html, /id="courseBin_CSCI-103"/);
  assert.match(html, /id="section_29901" class="section"/);
  assert.match(html, /<span class="table-headers-xsmall">Instructor: <\/span><span>Dr. &lt;Maya&gt; Reyes<br><\/span>/);
  assert.match(html, /not a USC site/);
});

test('each section links to a synthetic Try this class simulation with its profile', () => {
  const profile = Object.fromEntries(['pace', 'format', 'structure', 'assessment', 'participation', 'guidance', 'workload'].map((k, i) => [k, { value: (i % 5) + 1 }]));
  const href = simulationHref({ section: '29901', schedule: 'MW 10:00-11:50', name: 'Dr. Maya Reyes', profile }, 'CSCI 103');
  const url = new URL(href, 'https://example.test');
  assert.equal(url.pathname, '/try-this-class/');
  assert.equal(url.searchParams.get('course'), 'CSCI 103');
  assert.equal(url.searchParams.get('synthetic'), '1');
  assert.equal(url.searchParams.get('profile'), '1,2,3,4,5,1,2');
  assert.equal(new URL(simulationHref({ section: '1', name: 'x' }, 'CSCI 103'), 'https://example.test').searchParams.get('profile'), null);
  const html = renderDemoPage([{ code: 'CSCI 103', title: 'Object Oriented Programming', sections: [{ section: '29901', schedule: 'MW 10:00-11:50', name: 'Dr. Maya Reyes', profile }] }]);
  assert.match(html, /class="try-button" href="\/try-this-class\/\?course=CSCI\+103&amp;section=29901/);
});
