import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const cli = join(
  dirname(require.resolve('@playwright/test/package.json')),
  'cli.js',
);
const browserDirectory = fileURLToPath(
  new URL('../artifacts/pw-browsers', import.meta.url),
);
const child = spawn(process.execPath, [cli, ...process.argv.slice(2)], {
  stdio: 'inherit',
  windowsHide: true,
  env: { ...process.env, PLAYWRIGHT_BROWSERS_PATH: browserDirectory },
});
child.on('error', (error) => {
  console.error(error.message);
  process.exitCode = 1;
});
child.on('exit', (code) => {
  process.exitCode = code ?? 1;
});
