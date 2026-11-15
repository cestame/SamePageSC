// Runs on USC Web Registration pages. It reads the course codes and instructor names already shown on
// the page, asks the background worker how each section fits the student, and puts a small badge beside
// each one. It never sends requests to webReg itself and never reads anything outside the class listings.

(() => {
  const BADGE_ATTR = 'data-same-page-key';
  const FIELD_ORDER = ['pace', 'format', 'structure', 'assessment', 'participation', 'guidance', 'workload'];

  /**
   * The sections on the current page: { key, code, instructors, anchor }, where `anchor` is the element
   * the badge goes after. Filled in once we have a saved webReg page that lists sections.
   */
  function readSections() {
    return [];
  }

  // ---------- badge ----------

  const BADGE_STYLE = `
    :host { all: initial; display: inline-block; vertical-align: middle; margin-left: 8px; }
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
    const course = encodeURIComponent(result.courseId ?? '');
    const lookup = {
      scored: {
        text: [['score', `${result.score}%`], ['muted', 'teaching fit']],
        label: `${result.score}% teaching fit with ${result.name}, based on pace, structure, grading and four more. Open the match in Same Page.`,
        route: `#/matches?course=${course}`,
      },
      'needs-answers': {
        text: [['muted', 'Answer 2 questions for your fit']],
        label: `Same Page has notes on ${result.name} for ${code}. Answer 2 questions to see your fit.`,
        route: '#/home',
      },
      'needs-setup': {
        text: [['muted', 'Set up Same Page for your fit']],
        label: `Same Page has notes on ${result.name} for ${code}. Finish setup to see your fit.`,
        route: '#/setup',
      },
      'no-notes': {
        text: [['muted', 'No notes yet']],
        label: `No one has added notes for this ${code} section yet. Took it? Add your notes in Same Page.`,
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
    root.append(style, button);
    return host;
  }

  // ---------- scanning ----------

  let scanning = false;

  async function scan() {
    if (scanning) return;
    scanning = true;
    try {
      const sections = readSections().filter((s) => !document.querySelector(`[${BADGE_ATTR}="${CSS.escape(s.key)}"]`));
      if (!sections.length) return;
      const response = await chrome.runtime.sendMessage({
        type: 'lookup-sections',
        sections: sections.map(({ key, code, instructors }) => ({ key, code, instructors })),
      });
      if (!response || response.error) return;
      for (const result of response.results) {
        const section = sections.find((s) => s.key === result.key);
        if (!section?.anchor?.isConnected) continue;
        const el = badge(result, section.code);
        el.setAttribute(BADGE_ATTR, section.key);
        section.anchor.after(el);
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
