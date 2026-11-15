// Runs on USC Web Registration pages. It reads the course codes and instructor names already shown on
// the page, asks the background worker how each section fits the student, and puts a small badge beside
// each one. It never sends requests to webReg itself and never reads anything outside the class listings.

(() => {
  const BADGE_ATTR = 'data-same-page-key';
  // Anywhere but USC's own webReg, this is Same Page's demo class list of fictional sample sections.
  const ON_DEMO = location.hostname !== 'webreg.usc.edu';
  const FIELD_ORDER = ['pace', 'format', 'structure', 'assessment', 'participation', 'guidance', 'workload'];

  /*
   * webReg's course list: each course's sections sit inside `#courseBin_ACAD-176`, each section is
   * `div#section_10201.section`, and every cell starts with a small label ("Instructor: ") followed by one
   * <span> per value. The badge goes on its own full-width line at the end of the section row, where
   * webReg puts its own notes ("This class is restricted to majors only.").
   */
  const COURSE_PREFIX = 'courseBin_';

  function cellValues(row, label) {
    const cell = [...row.querySelectorAll('.section_row')].find((el) =>
      el.querySelector('.table-headers-xsmall')?.textContent.trim().toLowerCase().startsWith(label));
    if (!cell) return [];
    return [...cell.children]
      .filter((el) => el.tagName === 'SPAN' && !el.classList.contains('table-headers-xsmall'))
      .map((el) => el.textContent.trim())
      .filter((text) => text && text.toUpperCase() !== 'TBA');
  }

  /** The sections on the current page: { key, code, instructors, anchor }. */
  function readSections() {
    return [...document.querySelectorAll('.section[id^="section_"]')].flatMap((section) => {
      const course = section.closest(`[id^="${COURSE_PREFIX}"]`);
      const row = section.querySelector('.section_crsbin');
      if (!course || !row) return [];
      return [{
        key: section.id.slice('section_'.length),
        code: course.id.slice(COURSE_PREFIX.length).replace('-', ' '),
        instructors: cellValues(row, 'instructor'),
        anchor: row,
      }];
    });
  }

  /** A full-width line using webReg's own grid classes, so it clears the floated cells above it. */
  function place(anchor, badgeEl) {
    const line = document.createElement('div');
    line.className = 'col-xs-12 col-sm-12 col-md-12 col-lg-12';
    line.append(badgeEl);
    const trailingLink = anchor.lastElementChild?.tagName === 'A' ? anchor.lastElementChild : null;
    anchor.insertBefore(line, trailingLink);
    return line;
  }

  // ---------- badge ----------

  const BADGE_STYLE = `
    :host { all: initial; display: flex; flex-wrap: wrap; gap: 8px; padding: 0 0 4px; }
    button {
      display: inline-flex; align-items: center; min-height: 44px; padding: 0; border: 0;
      background: transparent; cursor: pointer; font: 600 13px/1.2 Lato, "Segoe UI", system-ui, sans-serif;
    }
    .pill {
      display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px 4px 6px; border-radius: 999px;
      background: #fffefa; color: #030027; box-shadow: 0 0 0 1px rgb(3 0 39 / 0.14), 0 1px 2px rgb(3 0 39 / 0.08);
    }
    button:hover .pill { box-shadow: 0 0 0 1.5px #922e2e, 0 1px 2px rgb(3 0 39 / 0.08); }
    button:focus-visible { outline: 3px solid #922e2e; outline-offset: 2px; border-radius: 999px; }
    .score { font-weight: 800; }
    .muted { color: #5e5c69; font-weight: 600; }
    svg { flex: none; }
  `;

  /** The teaching profile as a tiny line, the same motif the app uses everywhere. */
  function glyph(profile) {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 20 26');
    svg.setAttribute('width', '16');
    svg.setAttribute('height', '20');
    svg.setAttribute('aria-hidden', 'true');
    const points = FIELD_ORDER.map((key, row) => {
      const value = profile?.[key] ?? 3;
      return `${3 + ((value - 1) / 4) * 14},${3 + row * 3.33}`;
    });
    const line = document.createElementNS(ns, 'polyline');
    line.setAttribute('points', points.join(' '));
    line.setAttribute('fill', 'none');
    line.setAttribute('stroke', profile ? '#922e2e' : '#aea3b0');
    line.setAttribute('stroke-width', '2');
    line.setAttribute('stroke-linejoin', 'round');
    line.setAttribute('stroke-linecap', 'round');
    svg.append(line);
    return svg;
  }

  /** What each result looks like, what it says to a screen reader, and which app page it opens. */
  function describe(result, code) {
    const who = result.isSample ? `${result.name} (sample professor, fictional)` : result.name;
    const course = encodeURIComponent(result.courseId ?? '');
    // Every section with notes opens its class's matches with this section selected; missing answers are asked there.
    const matches = `#/matches?course=${course}&section=${encodeURIComponent(result.professorId ?? '')}`;
    const lookup = {
      scored: {
        text: [['score', `${result.score}%`], ['muted', `teaching fit with ${who}, based on pace, structure, grading and 4 more`]],
        label: `${result.score}% teaching fit with ${who}, based on pace, structure, grading and four more. Open the match in Same Page.`,
        route: matches,
      },
      'needs-answers': {
        text: [['muted', 'Answer 2 questions for your fit']],
        label: `Same Page has notes on ${who} for ${code}. Answer 2 questions to see your fit.`,
        route: matches,
      },
      'needs-setup': {
        text: [['muted', 'Answer 8 questions for your fit']],
        label: `Same Page has notes on ${who} for ${code}. Answer 8 quick questions to see your fit.`,
        route: matches,
      },
      'no-notes': {
        text: [['muted', 'No notes yet']],
        label: `No one has added notes for this ${code} section yet. If you took it, you can add your notes in Same Page.`,
        route: '#/contribute',
      },
    };
    return lookup[result.status] ?? lookup['no-notes'];
  }

  function badge(result, code) {
    const host = document.createElement('span');
    const root = host.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = BADGE_STYLE;
    const { text, label, route } = describe(result, code);
    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('aria-label', label);
    button.title = label;
    const pill = document.createElement('span');
    pill.className = 'pill';
    pill.append(glyph(result.profile));
    for (const [cls, words] of text) {
      const span = document.createElement('span');
      span.className = cls;
      span.textContent = words;
      pill.append(span);
    }
    button.append(pill);
    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      chrome.runtime.sendMessage({ type: 'open-panel', route });
    });
    root.append(style, button, simulationButton(result, code));
    return host;
  }

  /** Opens the 3D "Try this class" simulation for this section in a new tab. */
  function simulationButton(result, code) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'try';
    const label = `Try a simulated class for ${code}, section ${result.key}`;
    button.setAttribute('aria-label', label);
    button.title = label;
    const pill = document.createElement('span');
    pill.className = 'pill';
    const text = document.createElement('span');
    text.textContent = 'Try this class';
    pill.append(text);
    button.append(pill);
    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      const profile = result.profile ? FIELD_ORDER.map((key) => result.profile[key] ?? 3) : null;
      chrome.runtime.sendMessage({ type: 'open-simulation', code, section: result.key, name: result.name ?? '', profile });
    });
    return button;
  }

  // ---------- scanning ----------

  let scanning = false;

  async function scan() {
    if (scanning) return;
    scanning = true;
    try {
      const sections = readSections().filter((s) => !document.querySelector(`[${BADGE_ATTR}="${CSS.escape(s.key)}"]`));
      if (!sections.length) return;
      const results = [];
      // The server takes up to 100 sections per request.
      for (let i = 0; i < sections.length; i += 100) {
        const response = await chrome.runtime.sendMessage({
          type: 'lookup-sections',
          includeSamples: ON_DEMO,
          sections: sections.slice(i, i + 100).map(({ key, code, instructors }) => ({ key, code, instructors })),
        });
        if (!response || response.error) return;
        results.push(...response.results);
      }
      for (const result of results) {
        const section = sections.find((s) => s.key === result.key);
        if (!section?.anchor?.isConnected) continue;
        place(section.anchor, badge(result, section.code)).setAttribute(BADGE_ATTR, section.key);
      }
    } finally {
      scanning = false;
    }
  }

  function clearBadges() {
    document.querySelectorAll(`[${BADGE_ATTR}]`).forEach((el) => el.remove());
  }

  // webReg expands course listings in place, so look again whenever the page changes.
  let pending = 0;
  const observer = new MutationObserver(() => {
    window.clearTimeout(pending);
    pending = window.setTimeout(scan, 250);
  });
  observer.observe(document.body, { childList: true, subtree: true });

  // When the student answers questions in the side panel, redraw the badges with the new fit.
  chrome.storage.onChanged.addListener((changes) => {
    if (!changes.answers) return;
    clearBadges();
    scan();
  });

  scan();
})();
