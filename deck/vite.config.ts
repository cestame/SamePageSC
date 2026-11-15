import { fileURLToPath, URL } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const fromHere = (path: string) => fileURLToPath(new URL(path, import.meta.url));

/** Three pages: the deck, a print version with one beat per landscape page, and the pitch script. Relative paths let it run from any folder. */
export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@": fromHere("./src") } },
  build: {
    rollupOptions: { input: { deck: fromHere("./index.html"), print: fromHere("./print.html"), script: fromHere("./script.html"), class: fromHere("./class.html"), classPrint: fromHere("./class-print.html"), classScript: fromHere("./class-script.html") } },
  },
});
