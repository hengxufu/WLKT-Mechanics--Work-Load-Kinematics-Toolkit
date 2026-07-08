import { createHash } from 'node:crypto';
import { copyFileSync, createReadStream, existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';

const repoRoot = process.cwd();
const releaseDir = resolve(repoRoot, 'release', 'desktop');
const checksumFile = resolve(releaseDir, 'SHA256SUMS.txt');
const manifestFile = resolve(releaseDir, 'release-manifest.json');
const verifierSource = resolve(repoRoot, 'scripts', 'verify-installer.ps1');
const verifierTarget = resolve(releaseDir, 'verify-installer.ps1');
const extensions = new Set(['.exe', '.msi', '.zip', '.7z', '.blockmap']);
const packageJson = JSON.parse(readFileSync(resolve(repoRoot, 'package.json'), 'utf8'));

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
const manifestArtifacts = [];
for (const artifact of artifacts) {
  const artifactPath = resolve(releaseDir, artifact);
  const digest = await sha256(artifactPath);
  lines.push(`${digest}  ${basename(artifactPath)}`);
  manifestArtifacts.push({
    file: basename(artifactPath),
    sha256: digest,
    sizeBytes: statSync(artifactPath).size,
  });
}

writeFileSync(checksumFile, `${lines.join('\n')}\n`);
writeFileSync(
  manifestFile,
  `${JSON.stringify(
    {
      name: packageJson.name,
      version: packageJson.version,
      generatedAt: new Date().toISOString(),
      artifacts: manifestArtifacts,
      verification: {
        checksumFile: basename(checksumFile),
        powershellScript: basename(verifierTarget),
        authenticode: 'Use Get-AuthenticodeSignature on Windows. Official releases should be signed with an OV or EV code-signing certificate.',
      },
    },
    null,
    2,
  )}\n`,
);

if (existsSync(verifierSource)) {
  copyFileSync(verifierSource, verifierTarget);
}

console.log(`Wrote ${checksumFile}`);
console.log(`Wrote ${manifestFile}`);
