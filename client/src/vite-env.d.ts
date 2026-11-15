/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** "extension" when built as the Chrome extension's side panel (npm run build:extension). */
  readonly VITE_TARGET?: string;
  /** The Same Page server the side panel talks to. Empty for the website, which uses its own origin. */
  readonly VITE_API_ORIGIN?: string;
}
