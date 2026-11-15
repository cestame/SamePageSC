/** Resolves a file in `public/` against Vite's base path, so the deck works from any folder it's hosted in. */
export function asset(path: string) {
  return `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;
}
