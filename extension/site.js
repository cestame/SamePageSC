// Runs on the Same Page SC website. When a student answers questions there (instead of in the side panel),
// the site announces the answers on its own window; this saves them so the webReg badges can use them.
// Only answers and course ids are kept, never a name or email.

window.addEventListener('message', (event) => {
  if (event.source !== window || event.origin !== window.location.origin) return;
  const data = event.data;
  if (data?.source !== 'same-page' || data.type !== 'answers') return;
  const answers = data.answers && typeof data.answers === 'object'
    ? { general: data.answers.general ?? {}, perCourse: data.answers.perCourse ?? {}, courseIds: data.answers.courseIds ?? [] }
    : null;
  chrome.storage.local.set({ answers });
});
