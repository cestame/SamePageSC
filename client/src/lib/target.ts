// The client is built twice: as the website, and as the side panel of the Chrome extension (extension/).
// Everything that differs between the two lives here.

import type { StudentProfile } from './storage';

export const IS_EXTENSION = import.meta.env.VITE_TARGET === 'extension';

/** Where API requests go. The website calls its own origin; the side panel calls the deployed server. */
export const API_ORIGIN = import.meta.env.VITE_API_ORIGIN ?? '';

/** A file from client/public, resolved against the build's base so it works inside the extension too. */
export const asset = (name: string) => `${import.meta.env.BASE_URL}${name}`;

type ExtensionStorage = {
  set(items: Record<string, unknown>): Promise<void>;
  get(key: string): Promise<Record<string, unknown>>;
  remove(key: string): Promise<void>;
  onChanged: { addListener(fn: (changes: Record<string, { newValue?: unknown }>) => void): void };
};

function extensionStorage(): ExtensionStorage | null {
  if (!IS_EXTENSION) return null;
  const chrome = (globalThis as { chrome?: { storage?: { local?: ExtensionStorage } } }).chrome;
  return chrome?.storage?.local ?? null;
}

/**
 * The extension's background worker can't read the side panel's state, so the panel copies the answers
 * it needs into extension storage. Only answers and course ids are shared, never the name or email.
 */
export function shareAnswersWithExtension(profile: StudentProfile | null) {
  const answers = profile ? { general: profile.general, perCourse: profile.perCourse, courseIds: profile.courseIds } : null;
  const storage = extensionStorage();
  if (storage) {
    storage.set({ answers }).catch(() => undefined);
    return;
  }
  // On the website, the extension (if installed) listens for this on our own window and saves it.
  window.postMessage({ source: 'same-page', type: 'answers', answers }, window.location.origin);
}

/**
 * The webReg badges ask the panel to open a page, such as a match, by writing a route to extension
 * storage. The panel follows it on load and whenever it changes.
 */
export function followExtensionRoutes(navigate: (hash: string) => void) {
  const storage = extensionStorage();
  if (!storage) return;
  const follow = (route: unknown) => {
    if (typeof route === 'string' && route.startsWith('#/')) navigate(route);
  };
  storage.get('panelRoute').then((items) => follow(items.panelRoute)).catch(() => undefined);
  storage.onChanged.addListener((changes) => {
    if (changes.panelRoute) follow(changes.panelRoute.newValue);
  });
}
