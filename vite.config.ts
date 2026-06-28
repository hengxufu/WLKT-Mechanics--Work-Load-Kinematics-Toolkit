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

// https://vitejs.dev/config/
export default defineConfig({
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
      registerType: 'autoUpdate',
      injectRegister: 'script',
      includeAssets: ['favicon.ico', 'robots.txt', 'docs/*.html', 'changelog/**/*'],
      manifest: {
        name: 'WLKT Mechanics 材料力学求解器',
        short_name: 'WLKT Mechanics',
        description: '面向材料力学和结构力学学习的本地离线二维杆系、梁和桁架求解工具。',
        theme_color: '#111133',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        lang: 'zh-CN',
        icons: [
          {
            src: '/favicon.ico',
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
        navigateFallback: '/index.html',
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
