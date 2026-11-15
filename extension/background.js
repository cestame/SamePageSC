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
  if (message?.type === 'lookup-sections' && Array.isArray(message.sections)) {
    lookupSections(message.sections, message.includeSamples === true).then(sendResponse, (err) => sendResponse({ error: err.message }));
    return true;
  }
  return false;
});
