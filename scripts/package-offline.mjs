import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const distDir = resolve(repoRoot, 'dist');
const releaseRoot = resolve(repoRoot, 'release');
const packageDir = resolve(releaseRoot, 'wlkt-mechanics-offline');
const appDir = resolve(packageDir, 'app');

if (!existsSync(distDir)) {
  throw new Error('dist directory is missing. Run npm run build first.');
}

if (!packageDir.startsWith(`${releaseRoot}`)) {
  throw new Error('Refusing to write outside release directory.');
}

rmSync(packageDir, { recursive: true, force: true });
mkdirSync(appDir, { recursive: true });

cpSync(distDir, appDir, { recursive: true });
cpSync(resolve(repoRoot, 'README.md'), resolve(packageDir, 'README.md'));
cpSync(resolve(repoRoot, 'LICENSE'), resolve(packageDir, 'LICENSE'));
cpSync(resolve(repoRoot, 'docs/share-and-privacy.md'), resolve(packageDir, 'SHARE_AND_PRIVACY.md'));
cpSync(resolve(repoRoot, 'scripts/serve-dist.mjs'), resolve(packageDir, 'serve-local.mjs'));

writeFileSync(
  resolve(packageDir, 'START_HERE.md'),
  `# WLKT Mechanics Offline Package

This package runs on the user's own computer. It does not call the publisher's computer for computation, storage, or project data.

## Run Locally

1. Install Node.js 20 or later on this computer.
2. Open a terminal in this package directory.
3. Run:

\`\`\`bash
node serve-local.mjs app 4173
\`\`\`

4. Open:

\`\`\`text
http://127.0.0.1:4173/
\`\`\`

The server binds to 127.0.0.1 by default, so it is only available on this computer.
`
);

console.log(`Prepared offline package at ${packageDir}`);
