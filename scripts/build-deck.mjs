// Builds the pitch deck in deck/ into dist/deck, so the site serves it at /deck/.
// Newer npm versions pass a global allow-scripts setting to nested installs as an
// environment variable, which a project-scoped `npm ci` rejects, so it is removed here.
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const deckDir = fileURLToPath(new URL('../deck/', import.meta.url));
const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => key.toLowerCase() !== 'npm_config_allow_scripts'));

/** Runs one npm command in deck/. The commands are fixed strings, so passing them through the shell is safe. */
function run(command) {
  const result = spawnSync(`npm ${command}`, { cwd: deckDir, env, stdio: 'inherit', shell: true });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run('ci --no-audit --no-fund');
run('run build -- --outDir ../dist/deck --emptyOutDir');
