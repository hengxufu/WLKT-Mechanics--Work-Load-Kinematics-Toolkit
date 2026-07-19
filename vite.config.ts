// Plugins
import vue from '@vitejs/plugin-vue';
import vuetify, { transformAssetUrls } from 'vite-plugin-vuetify';
import VueI18nPlugin from '@intlify/unplugin-vue-i18n/vite';
import { VitePWA } from 'vite-plugin-pwa';

import { resolve, dirname } from 'node:path';
import packageJson from './package.json';

// Utilities
import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';
import { execSync } from 'child_process';

const readGitValue = (command: string, fallback: string) => {
  try {
    return execSync(command).toString().trimEnd();
  } catch {
    return fallback;
  }
};

const commitDate = readGitValue('git log -1 --format=%cI', new Date().toISOString());
const commitHash = readGitValue('git rev-parse HEAD', 'local-build');
const basePath = process.env.VITE_BASE_PATH || '/';
const normalizedBasePath = basePath.endsWith('/') ? basePath : `${basePath}/`;

// https://vitejs.dev/config/
export default defineConfig({
  base: normalizedBasePath,
  plugins: [
    vue({
      template: { transformAssetUrls },
    }),
    vuetify({
      autoImport: true,
    }),
    VueI18nPlugin({
      include: resolve(dirname(fileURLToPath(import.meta.url)), './src/locales/**'),
      runtimeOnly: false,
      strictMessage: false,
    }),
    VitePWA({
      registerType: 'prompt',
      injectRegister: 'script',
      includeAssets: ['favicon.ico', 'robots.txt', 'docs/*.html', 'changelog/**/*'],
      manifest: {
        name: '拉压弯扭大师',
        short_name: '拉压弯扭大师',
        description: '面向材料力学学习的本地离线求解工具，支持拉伸压缩、弯曲、扭转、组合变形、三维有限元和字母公式计算。',
        theme_color: '#0b63d1',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: normalizedBasePath,
        scope: normalizedBasePath,
        lang: 'zh-CN',
        icons: [
          {
            src: `${normalizedBasePath}favicon.ico`,
            sizes: '48x48 72x72 96x96 128x128 256x256',
            type: 'image/x-icon',
            purpose: 'any',
          },
        ],
      },
      workbox: {
        cleanupOutdatedCaches: true,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,gif,jpg,json,woff2,ttf}'],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        navigateFallback: `${normalizedBasePath}index.html`,
      },
    }),
  ],

  define: {
    'process.env': {},
    APP_VERSION: JSON.stringify(packageJson.version),
    APP_RELEASED: JSON.stringify(commitDate),
    APP_COMMIT: JSON.stringify(commitHash),
  },

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
    extensions: ['.js', '.json', '.jsx', '.mjs', '.ts', '.tsx', '.vue'],
  },

  server: {
    port: 3000,
  },

  build: {
    sourcemap: false,
  },
});
