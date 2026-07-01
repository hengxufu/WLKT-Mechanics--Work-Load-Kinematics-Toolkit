import { existsSync } from 'node:fs';
import { delimiter, join, resolve } from 'node:path';
import { spawn } from 'node:child_process';

const repoRoot = process.cwd();
const localNodeDir = resolve(repoRoot, '.local-tools', 'node-v22.22.2-win-x64');
const electronCache = resolve(repoRoot, '.electron-cache');
const builderCache = resolve(repoRoot, '.electron-builder-cache');

const hasSigningMaterial = [
  'CSC_LINK',
  'WIN_CSC_LINK',
  'CSC_NAME',
  'WIN_CSC_NAME',
  'AZURE_TENANT_ID',
  'AZURE_CLIENT_ID',
].some((name) => Boolean(process.env[name]));

const env = {
  ...process.env,
  ELECTRON_CACHE: process.env.ELECTRON_CACHE || electronCache,
  ELECTRON_BUILDER_CACHE: process.env.ELECTRON_BUILDER_CACHE || builderCache,
};

if (existsSync(localNodeDir)) {
  const pathKey = Object.keys(env).find((key) => key.toLowerCase() === 'path') || 'PATH';
  const nextPath = `${localNodeDir}${delimiter}${env[pathKey] || ''}`;
  for (const key of Object.keys(env)) {
    if (key.toLowerCase() === 'path' && key !== pathKey) {
      delete env[key];
    }
  }
  env[pathKey] = nextPath;
}

if (!hasSigningMaterial && !process.env.CSC_IDENTITY_AUTO_DISCOVERY) {
  env.CSC_IDENTITY_AUTO_DISCOVERY = 'false';
}

const builderBin = process.platform === 'win32'
  ? join(repoRoot, 'node_modules', '.bin', 'electron-builder.cmd')
  : join(repoRoot, 'node_modules', '.bin', 'electron-builder');

const child = spawn(builderBin, process.argv.slice(2), {
  cwd: repoRoot,
  env,
  shell: process.platform === 'win32',
  stdio: 'inherit',
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
  }
  process.exit(code ?? 1);
});
