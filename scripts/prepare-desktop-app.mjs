import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const repoRoot = process.cwd();
const stageRoot = resolve(repoRoot, '.desktop-app');
const rootPackage = JSON.parse(readFileSync(resolve(repoRoot, 'package.json'), 'utf8'));
const electronPackagePath = resolve(repoRoot, 'node_modules', 'electron', 'package.json');
const electronVersion = existsSync(electronPackagePath)
  ? JSON.parse(readFileSync(electronPackagePath, 'utf8')).version
  : '43.0.0';

function copyFileIntoStage(source, target) {
  const targetPath = resolve(stageRoot, target);
  mkdirSync(dirname(targetPath), { recursive: true });
  cpSync(resolve(repoRoot, source), targetPath);
}

if (!existsSync(resolve(repoRoot, 'dist', 'index.html'))) {
  throw new Error('Missing dist/index.html. Run npm run desktop:build first.');
}

rmSync(stageRoot, { recursive: true, force: true });
mkdirSync(stageRoot, { recursive: true });

cpSync(resolve(repoRoot, 'dist'), resolve(stageRoot, 'dist'), { recursive: true });
cpSync(resolve(repoRoot, 'electron'), resolve(stageRoot, 'electron'), { recursive: true });
copyFileIntoStage('LICENSE', 'LICENSE');
copyFileIntoStage('README.md', 'README.md');
copyFileIntoStage('docs/windows-installer.md', 'docs/windows-installer.md');
copyFileIntoStage('public/favicon.ico', 'public/favicon.ico');

const stagedPackage = {
  name: rootPackage.name,
  version: rootPackage.version,
  description: rootPackage.description,
  author: rootPackage.author,
  type: 'commonjs',
  main: 'electron/main.cjs',
  dependencies: {},
  devDependencies: {},
  build: {
    appId: 'cn.buaa.wlkt.mechanics',
    productName: 'WLKT Mechanics 材料力学求解器',
    copyright: 'Copyright © 2026 WLKT Mechanics',
    electronVersion,
    directories: {
      output: '../release/desktop',
      buildResources: 'public',
    },
    files: [
      'dist/**/*',
      'electron/**/*',
      'package.json',
      'LICENSE',
      'README.md',
      'docs/windows-installer.md',
    ],
    asar: true,
    compression: 'maximum',
    npmRebuild: false,
    win: {
      target: [
        {
          target: 'nsis',
          arch: ['x64'],
        },
      ],
      icon: 'public/favicon.ico',
      requestedExecutionLevel: 'highestAvailable',
      signAndEditExecutable: true,
      verifyUpdateCodeSignature: true,
      artifactName: 'WLKT-Mechanics-${version}-${arch}-Setup.${ext}',
    },
    nsis: {
      oneClick: true,
      perMachine: true,
      allowElevation: true,
      allowToChangeInstallationDirectory: false,
      createDesktopShortcut: true,
      createStartMenuShortcut: true,
      shortcutName: 'WLKT Mechanics 材料力学求解器',
      runAfterFinish: true,
      deleteAppDataOnUninstall: false,
    },
  },
};

writeFileSync(resolve(stageRoot, 'package.json'), `${JSON.stringify(stagedPackage, null, 2)}\n`);
console.log(`Prepared desktop staging app at ${stageRoot}`);

