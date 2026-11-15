// Classic content scripts can't use import statements, so this loads the module entry point.
// The module URL is per-session (use_dynamic_url), so pages can't fingerprint the extension by it.
(async () => {
  const { start } = await import(chrome.runtime.getURL('src/content-main.js'));
  await start(document);
})();
