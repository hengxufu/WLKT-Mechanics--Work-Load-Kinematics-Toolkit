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
    themes: {
      light: {
        colors: {
          primary: '#003b7a',
          secondary: '#eef3f8',
          accent: '#c7952d',
          surface: '#ffffff',
          background: '#f4f7fb',
          info: '#2f80c9',
          warning: '#c7952d',
          success: '#14745f',
        },
      },
    },
  },
  locale: {
    adapter: createVueI18nAdapter({ i18n, useI18n }),
  },
});
