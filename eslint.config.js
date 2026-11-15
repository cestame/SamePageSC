import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

export default tseslint.config(
  { ignores: ['dist', 'node_modules', 'data'] },
  js.configs.recommended,
  {
    files: ['server/**/*.js', 'shared/**/*.js', 'evals/**/*.js', 'extension/scripts/**/*.mjs', 'extension/test/**/*.js', 'eslint.config.js'],
    languageOptions: { globals: globals.node },
    rules: { 'no-unused-vars': ['error', { argsIgnorePattern: '^_' }] },
  },
  {
    files: ['extension/src/**/*.js'],
    languageOptions: { globals: { ...globals.browser, ...globals.webextensions } },
    rules: { 'no-unused-vars': ['error', { argsIgnorePattern: '^_' }] },
  },
  {
    files: ['client/**/*.{ts,tsx}', 'vite.config.ts'],
    extends: [...tseslint.configs.recommended],
    plugins: { 'react-hooks': reactHooks },
    languageOptions: { globals: globals.browser },
    rules: { ...reactHooks.configs.recommended.rules },
  },
);
