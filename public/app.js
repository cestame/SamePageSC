// Trojan Fit frontend: a tiny hash-routed single-page app with no build step.
const app = document.getElementById('app');
const state = { meta: null, courses: null };

// ---------- utilities ----------

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

async function api(path, body) {
  const res = await fetch('/api' + path, body === undefined ? {} : {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

const store = {
  get(key, fallback = null) {
    try { return JSON.parse(localStorage.getItem('tf:' + key)) ?? fallback; } catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem('tf:' + key, JSON.stringify(value)); } catch { /* private mode: keep going */ }
  },
};

async function meta() {
  state.meta ??= await api('/meta');
  return state.meta;
}
async function courses() {
  state.courses ??= await api('/courses');
  return state.courses;
}

function render(html) {
  app.innerHTML = html;
  window.scrollTo(0, 0);
}

function showError(e, where = app) {
  const div = document.createElement('div');
  div.className = 'error';
  div.textContent = e.message || String(e);
  where.prepend(div);
}

// ---------- shared components ----------

function sampleBadge(p) {
  return p.is_sample ? ' <span class="badge sample" title="Fictional professor used for the demo">Sample data</span>' : '';
}

function confirmLine(fb) {
  if (!fb || !fb.total) return '<div class="confirm muted" style="color:var(--muted)">No confirmations yet</div>';
  return `<div class="confirm">✓ ${fb.confirmed} of ${fb.total} student${fb.total === 1 ? '' : 's'} confirmed this profile</div>`;
}

function profileBars(fields, profile, breakdown) {
  return `<div class="bars">${fields.map((f) => {
    const v = profile[f.key]?.value ?? 3;
    const b = breakdown?.find((x) => x.key === f.key);
    const pos = ((v - 1) / 4) * 100;
    const want = b ? `<div class="want" style="left:${((b.target - 1) / 4) * 100}%" title="What you want: ${b.target}"></div>` : '';
    return `<div class="bar-row"><span class="name">${esc(f.label)}</span>
      <div><div class="scale" role="img" aria-label="${esc(f.label)} ${v} of 5, ${esc(f.low)} to ${esc(f.high)}">${want}<div class="pip" style="left:${pos}%"></div></div>
      <div class="ends"><span>${esc(f.low)}</span><span>${esc(f.high)}</span></div></div></div>`;
  }).join('')}</div>`;
}

function profileDetail(fields, profile) {
  return fields.map((f) => {
    const p = profile[f.key] || {};
    const ev = (p.evidence || []).map((e) => `<p class="evidence">${esc(e)}</p>`).join('') || '<p class="evidence">No evidence yet.</p>';
    return `<div class="field"><div class="top"><span>${esc(f.label)}</span><span>${p.value ?? '–'}/5</span></div>
      <div class="scale" style="margin-top:8px"><div class="pip" style="left:${(((p.value ?? 3) - 1) / 4) * 100}%"></div></div>
      <div class="ends"><span>${esc(f.low)}</span><span>${esc(f.high)}</span></div>${ev}</div>`;
  }).join('');
}

// ---------- intake questions ----------
// No "visual / auditory / kinesthetic" question: learning styles are not supported by research.

const QUESTIONS = [
  { key: 'prior', q: 'How much do you already know about this subject?', options: [
    [1, 'Nothing yet', 'This is brand new to me'], [2, 'A little', 'Some exposure, nothing formal'],
    [3, 'Some', 'Took a related class or did some on my own'], [4, 'Pretty comfortable', 'I could explain the basics'],
    [5, 'A lot', 'I could teach parts of it'] ] },
  { key: 'format', q: 'What kind of class time helps you most?', options: [
    [1, 'Mostly lecture', 'Professor explains, I take notes'], [2, 'Lecture with some Q&A', ''],
    [3, 'An even mix', 'Some lecture, some activities'], [4, 'Mostly discussion or group work', ''],
    [5, 'All discussion', 'Learning by talking it through'] ] },
  { key: 'structure', q: 'How much structure do you want?', options: [
    [1, 'Loose is fine', 'I like flexibility'], [2, 'A little structure', ''],
    [3, 'Somewhere in the middle', ''], [4, 'Clear plan', 'I like knowing what is coming'],
    [5, 'Highly organized', 'Every date and rubric up front'] ] },
  { key: 'assessment', q: 'How would you rather be graded?', options: [
    [1, 'Exams', 'I do well on tests'], [2, 'Mostly exams', ''], [3, 'A mix', ''],
    [4, 'Mostly projects', ''], [5, 'Projects', 'I show what I know by building things'] ] },
  { key: 'participation', q: 'How do you feel about being called on in class?', options: [
    [1, 'Please don\'t', 'I learn best listening'], [2, 'Only if I volunteer', ''],
    [3, 'Occasionally is okay', ''], [4, 'Comfortable', 'Graded participation is fine'],
    [5, 'Bring it on', 'Cold-calling keeps me sharp'] ] },
  { key: 'pace', q: 'What pace works for you?', options: [
    [1, 'Slow and thorough', 'Depth over coverage'], [2, 'Steady', ''], [3, 'Moderate', ''],
    [4, 'Brisk', ''], [5, 'Fast', 'Cover as much as possible'] ] },
  { key: 'workload', q: 'How much time can you give this class each week, outside class?', options: [
    [1, 'About 2 hours', 'Heavy semester'], [2, '3-4 hours', ''], [3, '5-6 hours', ''],
    [4, '7-8 hours', ''], [5, 'Whatever it takes', ''] ] },
  { key: 'goal', q: 'What is your goal for this class?', options: [
    ['requirement', 'Meet the requirement', 'Get through it well and move on'],
    ['foundation', 'Build a solid foundation', 'I will use this later'],
    ['mastery', 'Master it and go further', 'This is my area'] ] },
];

function routeIntake() {
  const answers = store.get('answers', {});
  let i = Math.max(0, QUESTIONS.findIndex((q) => answers[q.key] === undefined));
  if (QUESTIONS.every((q) => answers[q.key] !== undefined)) i = 0;

  const draw = () => {
    const q = QUESTIONS[i];
    render(`
      <p class="muted small">Question ${i + 1} of ${QUESTIONS.length} · about 2 minutes</p>
      <div class="progress" aria-hidden="true"><div style="width:${(i / QUESTIONS.length) * 100}%"></div></div>
      <h1 id="q">${esc(q.q)}</h1>
      <div class="options" role="radiogroup" aria-labelledby="q">
        ${q.options.map(([v, label, sub]) => `
          <button class="option ${answers[q.key] === v ? 'selected' : ''}" role="radio" aria-checked="${answers[q.key] === v}" data-v="${esc(v)}">
            <span class="dot"></span><span>${esc(label)}${sub ? `<small>${esc(sub)}</small>` : ''}</span>
          </button>`).join('')}
      </div>
      <div class="btn-row">
        ${i > 0 ? '<button class="btn secondary" id="back">Back</button>' : ''}
      </div>
      ${i === 0 ? '<p class="notice small" style="margin-top:20px">We don\'t ask whether you are a "visual" or "auditory" learner. Research doesn\'t support learning styles, so we ask about things that actually differ between sections: pace, format, structure, grading, participation and workload.</p>' : ''}
    `);
    app.querySelectorAll('.option').forEach((btn) => btn.addEventListener('click', () => {
      const raw = btn.dataset.v;
      answers[q.key] = q.key === 'goal' ? raw : Number(raw);
      store.set('answers', answers);
      if (i < QUESTIONS.length - 1) { i++; draw(); } else location.hash = '#/matches';
    }));
    app.querySelector('#back')?.addEventListener('click', () => { i--; draw(); });
  };
  draw();
}

// ---------- matches ----------

async function routeMatches(params) {
  const answers = store.get('answers');
  if (!answers || QUESTIONS.some((q) => answers[q.key] === undefined)) { location.hash = '#/intake'; return; }
  const [{ fields }, list] = await Promise.all([meta(), courses()]);
  const courseId = params.get('course') || store.get('course') || list[0]?.id;
  store.set('course', courseId);

  render(`
    <h1>Your matches</h1>
    <p class="muted">Pick a course. Sections are ranked by a fixed scoring formula from your answers; the AI only writes the explanation.</p>
    <div class="chips" role="tablist">${list.map((c) => `<button class="chip ${c.id === courseId ? 'selected' : ''}" role="tab" aria-selected="${c.id === courseId}" data-c="${esc(c.id)}">${esc(c.code)}</button>`).join('')}</div>
    <p class="small muted" id="course-title"></p>
    <div id="results"><div class="card"><div class="skeleton"></div><div class="skeleton" style="width:70%"></div></div></div>
    <div class="btn-row"><a class="btn secondary" href="#/intake">Change my answers</a></div>
  `);
  app.querySelectorAll('.chip').forEach((b) => b.addEventListener('click', () => { location.hash = '#/matches?course=' + b.dataset.c; }));
  const course = list.find((c) => c.id === courseId);
  app.querySelector('#course-title').textContent = course ? `${course.code}: ${course.title}` : '';

  const results = await api('/match', { courseId, answers });
  const box = app.querySelector('#results');
  if (!results.length) { box.innerHTML = '<div class="card">No sections with profiles yet for this course. <a href="#/contribute">Contribute notes</a> to add one.</div>'; return; }

  box.innerHTML = results.map((r, idx) => `
    <article class="card" data-id="${r.id}">
      <div class="match-head">
        <div class="info">
          <div class="rank">#${idx + 1} match${idx === 0 ? ' · best fit' : ''}</div>
          <h3><a href="#/professor/${r.id}">${esc(r.name)}</a>${sampleBadge(r)}</h3>
          <div class="small muted">${esc([r.section && 'Section ' + r.section, r.schedule].filter(Boolean).join(' · '))}</div>
        </div>
        <div class="score" style="--p:${r.score}" aria-label="Fit score ${r.score} out of 100"><span><div>${r.score}<small>fit</small></div></span></div>
      </div>
      <p class="small" style="margin-top:12px">${esc(r.summary)}</p>
      <div class="why" aria-live="polite"><div class="skeleton"></div><div class="skeleton" style="width:80%"></div><div class="skeleton" style="width:60%"></div></div>
      ${confirmLine(r.feedback)}
      <details>
        <summary class="btn ghost">Profile at a glance &amp; score breakdown</summary>
        <p class="small muted" style="margin-top:8px">Red dot = this section. Gold line = what you asked for.</p>
        ${profileBars(fields, r.profile, r.breakdown)}
        <table class="breakdown">
          <thead><tr><th>Dimension</th><th class="num">You</th><th class="num">Class</th><th class="num">Weight</th><th class="num">Fit</th></tr></thead>
          <tbody>${r.breakdown.map((b) => `<tr><td>${esc(b.label)}<div class="muted" style="font-size:.75rem">${esc(b.why)}</div></td><td class="num">${b.target}</td><td class="num">${b.actual}</td><td class="num">×${b.weight}</td><td class="num">${b.fit}%</td></tr>`).join('')}</tbody>
        </table>
        <p class="small muted" style="margin-top:8px">Score = weighted average of per-dimension fit. Participation and workload only count against a section when it asks for more than you said you want.</p>
      </details>
    </article>`).join('');

  // Explanations load independently so the ranking shows instantly.
  results.forEach(async (r) => {
    const el = box.querySelector(`[data-id="${r.id}"] .why`);
    try {
      const ex = await api('/explain', { professorId: r.id, answers });
      el.innerHTML = `<p>${esc(ex.why)}</p><p class="watch"><strong>Watch out:</strong> ${esc(ex.watch_out)}</p>
        ${ex.source === 'template' ? `<p class="small muted">${esc(ex.notice || '')} This text is generated from the score breakdown, not by AI.</p>` : '<p class="small muted">Explanation written by AI from your answers and this profile.</p>'}`;
    } catch (e) {
      el.innerHTML = `<p class="small muted">${esc(e.message)}</p>`;
    }
  });
}

// ---------- professor profile + feedback + response ----------

async function routeProfessor(id) {
  const [{ fields }, p] = await Promise.all([meta(), api('/professors/' + encodeURIComponent(id))]);
  const fb = p.feedback;
  render(`
    <p class="small"><a href="#/matches?course=${esc(p.course_id)}">← ${esc(p.course_code)} matches</a></p>
    <h1>${esc(p.name)}${sampleBadge(p)}</h1>
    <p class="muted">${esc(p.course_code)}: ${esc(p.course_title)}${p.section ? ' · Section ' + esc(p.section) : ''}${p.schedule ? ' · ' + esc(p.schedule) : ''}</p>
    ${p.is_sample ? '<p class="notice gold small">This is a fictional professor included as sample data so the demo works on first load.</p>' : ''}
    <div class="card">
      <h3>A typical class day</h3>
      <p>${esc(p.summary)}</p>
      <p class="small muted">Built from ${p.contributionCount} contribution${p.contributionCount === 1 ? '' : 's'}. Values are averaged across contributions; evidence lines are pulled from the source text so you can check them.</p>
      ${confirmLine(fb)}
    </div>
    <div class="card">${profileDetail(fields, p.profile)}</div>

    <h2>Took this class? Check the profile</h2>
    <div class="card" id="fb">
      <p class="small muted">Three quick questions. Answers are anonymous and shown as confirmations.</p>
      ${[['pace', 'Was the pace what this profile describes?'], ['format', 'Was the class format (lecture vs. discussion) as described?'], ['workload', 'Was the workload as described?']].map(([k, q]) => `
        <fieldset style="border:0;padding:0;margin:14px 0 0"><legend style="font-weight:600">${esc(q)}</legend>
          <div class="yesno"><button class="option" data-k="${k}" data-v="true"><span class="dot"></span>Yes</button><button class="option" data-k="${k}" data-v="false"><span class="dot"></span>Not really</button></div>
        </fieldset>`).join('')}
      <button class="btn block" id="fb-submit" style="margin-top:16px" disabled>Submit feedback</button>
      ${fb.total ? `<p class="small muted" style="margin-top:12px">So far: pace matched for ${fb.pace_ok}/${fb.total}, format for ${fb.format_ok}/${fb.total}, workload for ${fb.workload_ok}/${fb.total}.</p>` : ''}
    </div>

    <h2>Professor's response</h2>
    ${p.responses.length ? p.responses.map((r) => `<div class="card tight"><p>${esc(r.body)}</p><span class="badge ${r.verified ? 'verified' : ''}">${r.verified ? 'Verified professor' : 'Unverified'}</span></div>`).join('') : '<p class="muted small">No response yet.</p>'}
    <details class="card tight">
      <summary class="btn ghost">Are you this professor? Respond to your profile</summary>
      <label for="resp">Your response</label>
      <textarea id="resp" style="min-height:120px" maxlength="2000" placeholder="Add context, corrections, or tips for incoming students."></textarea>
      <label for="code">Verification code (optional)</label>
      <input id="code" type="password" autocomplete="off" placeholder="Provided by the Trojan Fit team">
      <p class="small muted">Responses without a valid code are labeled "Unverified".</p>
      <button class="btn" id="resp-submit">Post response</button>
    </details>
  `);

  const picks = {};
  app.querySelectorAll('#fb .option').forEach((b) => b.addEventListener('click', () => {
    picks[b.dataset.k] = b.dataset.v === 'true';
    app.querySelectorAll(`#fb .option[data-k="${b.dataset.k}"]`).forEach((x) => x.classList.toggle('selected', x === b));
    app.querySelector('#fb-submit').disabled = Object.keys(picks).length < 3;
  }));
  app.querySelector('#fb-submit').addEventListener('click', async (ev) => {
    ev.target.disabled = true;
    try {
      const r = await api('/feedback', { professorId: p.id, ...picks });
      app.querySelector('#fb').innerHTML = `<p><strong>Thanks!</strong> Your answers are saved.</p>${confirmLine(r.feedback)}`;
    } catch (e) { showError(e, app.querySelector('#fb')); ev.target.disabled = false; }
  });
  app.querySelector('#resp-submit').addEventListener('click', async (ev) => {
    ev.target.disabled = true;
    try {
      await api(`/professors/${p.id}/responses`, { body: app.querySelector('#resp').value, code: app.querySelector('#code').value });
      routeProfessor(id);
    } catch (e) { showError(e, ev.target.parentElement); ev.target.disabled = false; }
  });
}

// ---------- contribute ----------

async function routeContribute() {
  const [{ fields, ai }, list] = await Promise.all([meta(), courses()]);
  render(`
    <h1>Contribute class notes</h1>
    <p class="muted">Paste notes or a syllabus from a class you're taking. AI turns it into a teaching profile with evidence you can check. Your text is not stored.</p>
    ${ai ? '' : '<p class="error">AI extraction is not configured on this server yet (missing API key), so contributions are disabled.</p>'}
    <div class="notice small">
      <strong>Before you paste:</strong> only share notes you wrote yourself, or materials from a class where the professor agreed.
      Text only, no recordings. We strip names, emails and IDs before processing and store only the extracted profile, never your raw notes.
      Profiles describe the class, not the person.
    </div>
    <form id="form" novalidate>
      <label for="course">Course</label>
      <select id="course">${list.map((c) => `<option value="${esc(c.id)}">${esc(c.code)}: ${esc(c.title)}</option>`).join('')}</select>
      <label for="prof">Professor</label>
      <select id="prof"></select>
      <div id="newprof" hidden><label for="profname">Professor's name</label><input id="profname" type="text" maxlength="80" placeholder="e.g. Dr. Jordan Smith"></div>
      <label for="type">What are you pasting?</label>
      <select id="type"><option value="notes">Class notes</option><option value="syllabus">Syllabus</option><option value="both">Both</option></select>
      <label for="text">Notes or syllabus text</label>
      <textarea id="text" placeholder="e.g. Lecture 4: She started with a 5-minute recap quiz, then live-coded a linked list..."></textarea>
      <p class="small muted" id="count">0 characters</p>
      <label class="check"><input type="checkbox" id="consent"> These are my own notes, or materials shared with the professor's agreement.</label>
      <button class="btn block" type="submit" id="submit" style="margin-top:16px" ${ai ? '' : 'disabled'}>Build profile</button>
    </form>
    <div id="result"></div>
  `);
  const $ = (s) => app.querySelector(s);
  const loadProfs = async () => {
    const profs = await api(`/courses/${encodeURIComponent($('#course').value)}/professors`);
    $('#prof').innerHTML = profs.map((p) => `<option value="${p.id}">${esc(p.name)}${p.is_sample ? ' (sample)' : ''}</option>`).join('') + '<option value="new">Someone else…</option>';
    $('#newprof').hidden = $('#prof').value !== 'new';
  };
  await loadProfs();
  $('#course').addEventListener('change', loadProfs);
  $('#prof').addEventListener('change', () => { $('#newprof').hidden = $('#prof').value !== 'new'; });
  $('#text').addEventListener('input', () => { $('#count').textContent = `${$('#text').value.length.toLocaleString()} characters`; });

  $('#form').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const btn = $('#submit');
    btn.disabled = true;
    btn.innerHTML = '<span class="loader"></span> Reading your notes…';
    $('#result').innerHTML = '';
    const isNew = $('#prof').value === 'new';
    try {
      const r = await api('/contribute', {
        courseId: $('#course').value,
        professorId: isNew ? undefined : Number($('#prof').value),
        professorName: isNew ? $('#profname').value : undefined,
        sourceType: $('#type').value,
        text: $('#text').value,
        consent: $('#consent').checked,
      });
      $('#form').hidden = true;
      const ex = r.extracted;
      $('#result').innerHTML = `
        <div class="card">
          <h3>Here's what we extracted</h3>
          <p class="small muted">Each rating has the line from your text it's based on. Dimensions without evidence were left out and don't affect the profile.</p>
          <p><strong>Typical class day:</strong> ${esc(ex.summary)}</p>
          ${fields.map((f) => {
            const v = ex.profile[f.key];
            return `<div class="field"><div class="top"><span>${esc(f.label)}</span><span>${v.value ?? 'not found'}${v.value ? '/5' : ''}</span></div>
              ${v.value ? `<div class="scale" style="margin-top:8px"><div class="pip" style="left:${((v.value - 1) / 4) * 100}%"></div></div><div class="ends"><span>${esc(f.low)}</span><span>${esc(f.high)}</span></div><p class="evidence">${esc(v.evidence)}</p>` : ''}</div>`;
          }).join('')}
          ${ex.dropped.length ? `<p class="notice small">We removed evidence for ${esc(ex.dropped.join(', '))} because it commented on the person rather than the class.</p>` : ''}
        </div>
        <div class="card">
          <h3>Merged into ${esc(r.professor.name)}'s profile</h3>
          <p class="small muted">Now built from ${r.professor.contributionCount} contributions.</p>
          ${profileBars(fields, r.professor.profile)}
          <div class="btn-row"><a class="btn" href="#/professor/${r.professor.id}">View full profile</a><a class="btn secondary" href="#/contribute" id="again">Contribute more</a></div>
        </div>`;
      $('#again').addEventListener('click', (e) => { e.preventDefault(); routeContribute(); });
      state.courses = null; // section counts may have changed
    } catch (e) {
      showError(e, $('#result'));
      btn.disabled = false;
      btn.textContent = 'Build profile';
    }
  });
}

// ---------- home & about ----------

function routeHome() {
  const has = store.get('answers');
  render(`
    <section class="hero">
      <div class="kicker">By Trojans, for Trojans</div>
      <h1>Pick the section that fits how you learn, before add/drop.</h1>
      <p class="muted">Same course, different professors, very different classes. Trojan Fit builds a teaching profile for each section from notes and syllabi that current students share, then ranks sections for you with a plain-language reason.</p>
      <div class="btn-row">
        <a class="btn" href="#/${has ? 'matches' : 'intake'}">${has ? 'See my matches' : 'Find my best section'}</a>
        <a class="btn secondary" href="#/contribute">I'm taking a class: contribute notes</a>
      </div>
    </section>
    <div class="steps">
      <div class="step"><div class="num">1</div><strong>Answer 8 questions</strong><p class="small muted">About 2 minutes: pace, format, structure, grading, participation, workload, goal.</p></div>
      <div class="step"><div class="num">2</div><strong>See sections ranked</strong><p class="small muted">A transparent score you can tap to inspect, plus why it fits and one honest watch-out.</p></div>
      <div class="step"><div class="num">3</div><strong>Pay it forward</strong><p class="small muted">After the class, confirm the profile in three taps or contribute your notes.</p></div>
    </div>
    <p class="notice gold small">The demo includes 6 fictional sample professors across CSCI 103 and ECON 203 so you can try it immediately. They are labeled "Sample data".</p>
    <h2>Why not Rate My Professors?</h2>
    <p class="muted">Star ratings come from a self-selected few and rate people, not classes. A great professor for one student can be a bad fit for another. Trojan Fit describes how a class runs, with evidence, and lets you decide what fits you.</p>
  `);
}

function routeAbout() {
  render(`
    <h1>Privacy and ground rules</h1>
    <p class="muted">These rules are part of the product, not fine print.</p>
    <div class="card">
      <h3>Text only</h3><p>No audio or video recording. Contributors paste text notes or syllabi.</p>
      <h3>We store profiles, not notes</h3><p>Names, emails, phone numbers and student IDs are stripped before your text is sent to the AI model. Only the extracted profile and short evidence lines are saved; your raw notes are discarded.</p>
      <h3>Classes, not people</h3><p>Profiles describe how a class runs. Comments about a professor's personality, appearance, accent or identity are not allowed and are filtered out.</p>
      <h3>Consent-based</h3><p>Contributions should come from your own notes, or from classes where the professor agreed. Professors can view and respond to their own profile.</p>
      <h3>No USC systems required</h3><p>No Brightspace crawling and no USC login. Trojan Fit runs as a standalone site, so Student Government could pilot it with one department.</p>
      <h3>Anonymous</h3><p>No accounts. Your intake answers stay in your browser.</p>
    </div>
    <h2>Why no "learning style" question?</h2>
    <p class="muted">The idea that students learn better when taught in their "visual", "auditory" or "kinesthetic" style is not supported by research. We match on things that really differ between sections and that students can judge: pace, format, structure, how you're graded, participation, guidance and workload.</p>
    <h2>How matching works</h2>
    <p class="muted">Ranking is a fixed, deterministic formula: for each dimension we compare what you asked for with the section's profile, weight it, and average. Your prior knowledge shifts the guidance and pace you're matched to, so beginners see step-by-step sections ranked higher. The AI model only writes the explanation; it never decides the ranking. Tap "score breakdown" on any match to see the math.</p>
  `);
}

// ---------- router ----------

async function router() {
  const [path, qs] = location.hash.replace(/^#/, '').split('?');
  const params = new URLSearchParams(qs || '');
  const parts = (path || '/').split('/').filter(Boolean);
  document.querySelectorAll('[data-nav]').forEach((a) => a.classList.toggle('active', a.dataset.nav === parts[0] || (parts[0] === 'matches' && a.dataset.nav === 'intake')));
  try {
    if (!parts.length) routeHome();
    else if (parts[0] === 'intake') routeIntake();
    else if (parts[0] === 'matches') await routeMatches(params);
    else if (parts[0] === 'professor' && parts[1]) await routeProfessor(parts[1]);
    else if (parts[0] === 'contribute') await routeContribute();
    else if (parts[0] === 'about') routeAbout();
    else routeHome();
  } catch (e) {
    render('');
    showError(e);
  }
  app.focus({ preventScroll: true });
}

window.addEventListener('hashchange', router);
router();
