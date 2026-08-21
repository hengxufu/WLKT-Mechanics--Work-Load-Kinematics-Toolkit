/**
 * plugins/vuetify.ts
 *
 * Framework documentation: https://vuetifyjs.com`
 */

// Styles
import '@mdi/font/css/materialdesignicons.css';
import 'vuetify/styles';

// Composables
import { createVuetify } from 'vuetify';
import { createVueI18nAdapter } from 'vuetify/locale/adapters/vue-i18n';
import { i18n } from './i18n';
import { useI18n } from 'vue-i18n';

// https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides
export default createVuetify({
  theme: {
    defaultTheme: 'dark',
    themes: {
      light: {
        dark: false,
        colors: {
          primary: '#0f60a8',
          secondary: '#e4e9ef',
          accent: '#b67b16',
          surface: '#f5f7f9',
          background: '#e9edf2',
          info: '#2f7fbd',
          warning: '#b67b16',
          success: '#287c5d',
          error: '#c74842',
        },
      },
      dark: {
        dark: true,
        colors: {
          primary: '#3b8bd9',
          secondary: '#303640',
          accent: '#e0ad4f',
          surface: '#202329',
          background: '#17191d',
          info: '#69bce7',
          warning: '#e0ad4f',
          success: '#56b58a',
          error: '#eb6a63',
        },
      },
    },
  },
  locale: {
    adapter: createVueI18nAdapter({ i18n, useI18n }),
  },
});
