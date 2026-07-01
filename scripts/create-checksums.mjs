import { createHash } from 'node:crypto';
import { createReadStream, existsSync, readdirSync, writeFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';

const repoRoot = process.cwd();
const releaseDir = resolve(repoRoot, 'release', 'desktop');
const checksumFile = resolve(releaseDir, 'SHA256SUMS.txt');
const extensions = new Set(['.exe', '.msi', '.zip', '.7z', '.blockmap']);

function fileExtension(fileName) {
  const index = fileName.lastIndexOf('.');
  return index === -1 ? '' : fileName.slice(index).toLowerCase();
}

function sha256(filePath) {
  return new Promise((resolveHash, reject) => {
    const hash = createHash('sha256');
    const stream = createReadStream(filePath);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolveHash(hash.digest('hex')));
  });
}

if (!existsSync(releaseDir)) {
  throw new Error(`Release directory not found: ${releaseDir}`);
}

const artifacts = readdirSync(releaseDir)
  .filter((fileName) => extensions.has(fileExtension(fileName)))
  .sort((a, b) => a.localeCompare(b));

if (artifacts.length === 0) {
  throw new Error(`No release artifacts found in ${releaseDir}`);
}

const lines = [];
for (const artifact of artifacts) {
  const artifactPath = resolve(releaseDir, artifact);
  lines.push(`${await sha256(artifactPath)}  ${basename(artifactPath)}`);
}

writeFileSync(checksumFile, `${lines.join('\n')}\n`);
console.log(`Wrote ${checksumFile}`);

