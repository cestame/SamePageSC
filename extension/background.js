// The extension's background worker. It opens the side panel and asks the Same Page server how the
// sections on a webReg page fit the student. webReg pages never talk to our server directly.

const configReady = fetch(chrome.runtime.getURL('config.json')).then((res) => res.json());

// Clicking the toolbar icon opens the side panel. Set on every worker start, not only on install,
// so it also holds after Chrome restarts the worker or the extension is reloaded.
function openPanelOnIconClick() {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch((err) => console.error('Same Page: could not set the side panel to open on click.', err));
}
openPanelOnIconClick();
chrome.runtime.onInstalled.addListener(openPanelOnIconClick);
chrome.runtime.onStartup.addListener(openPanelOnIconClick);

const serverOrigin = async () => (await configReady).server.replace(/\/+$/, '');

async function lookupSections(sections, includeSamples) {
  const { answers } = await chrome.storage.local.get('answers');
  const res = await fetch(`${await serverOrigin()}/api/sections/lookup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sections, includeSamples, general: answers?.general ?? {}, perCourse: answers?.perCourse ?? {} }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Same Page answered with an error (${res.status}).`);
  return { results: data };
}

const COURSE_CODE = /^[A-Z]{2,5} \d{3}[A-Z]{0,2}$/;
const SECTION_KEY = /^\d{5}[A-Z]?$/;

/**
 * Opens the 3D simulation, served by the Same Page server at /try-this-class/, for one webReg section.
 * Everything in the URL is checked first, because the message comes from a content script on webReg.
 */
async function openSimulation({ code, section, name, profile }) {
  if (!COURSE_CODE.test(String(code)) || !SECTION_KEY.test(String(section))) return;
  const { server } = await configReady;
  const url = new URL('/try-this-class/', server);
  url.searchParams.set('course', code);
  url.searchParams.set('section', section);
  if (typeof name === 'string' && name) url.searchParams.set('name', name.slice(0, 80));
  if (Array.isArray(profile) && profile.length === 7 && profile.every((v) => Number.isFinite(v) && v >= 1 && v <= 5)) {
    url.searchParams.set('profile', profile.map((v) => Math.round(v * 10) / 10).join(','));
  }
  await chrome.tabs.create({ url: url.href });
}

/** Opens the panel on a page of the app. Clearing the route first means the same route still triggers a change. */
async function showInPanel(route) {
  await chrome.storage.local.remove('panelRoute');
  await chrome.storage.local.set({ panelRoute: route });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === 'open-panel' && sender.tab?.id !== undefined) {
    const route = String(message.route || '#/');
    // sidePanel.open only works during the student's click, so it runs before anything is awaited.
    // If Chrome refuses (an older version, or no user gesture), open the same page in a new tab instead.
    chrome.sidePanel.open({ tabId: sender.tab.id }).then(
      () => showInPanel(route),
      async () => chrome.tabs.create({ url: `${await serverOrigin()}/${route}`, index: sender.tab.index + 1 }),
    );
    return false;
  }
  if (message?.type === 'open-simulation') {
    openSimulation(message);
    return false;
  }
  if (message?.type === 'lookup-sections' && Array.isArray(message.sections)) {
    lookupSections(message.sections, message.includeSamples === true).then(sendResponse, (err) => sendResponse({ error: err.message }));
    return true;
  }
  return false;
});
