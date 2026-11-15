import extensionConfig from './extension/config.json';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/** The server the extension talks to. Change it in extension/config.json, then run npm run build:extension. */
function extensionServer(): string {
  return extensionConfig.server.replace(/\/+$/, '');
}

export default defineConfig(({ mode }) => {
  if (mode === 'extension') {
    // The side panel: relative paths so it loads from chrome-extension://, API calls to the deployed server.
    return {
      root: 'client',
      base: './',
      plugins: [react()],
      define: {
        'import.meta.env.VITE_TARGET': JSON.stringify('extension'),
        'import.meta.env.VITE_API_ORIGIN': JSON.stringify(extensionServer()),
      },
      build: { outDir: '../extension/panel', emptyOutDir: true },
    };
  }
  return {
    root: 'client',
    plugins: [react()],
    build: { outDir: '../dist', emptyOutDir: true },
    server: { proxy: { '/api': 'http://localhost:3000' } },
  };
});
