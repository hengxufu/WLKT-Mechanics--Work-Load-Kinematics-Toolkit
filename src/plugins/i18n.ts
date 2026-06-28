import { createI18n } from 'vue-i18n';
import messages from '@intlify/unplugin-vue-i18n/messages';
import * as vloc from 'vuetify/locale';

export const availableLocales = [
  { code: 'en', name: 'English' },
  { code: 'cs', name: 'Čeština' },
  { code: 'de', name: 'Deutsch' },
  { code: 'fr', name: 'Français' },
  { code: 'es', name: 'Español' },
  { code: 'pt', name: 'Português' },
  { code: 'pl', name: 'Polski' },
  { code: 'cn', name: '简体中文' },
  { code: 'th', name: 'ไทย' },
  { code: 'uk', name: 'Українська' },
  { code: 'ru', name: 'Русский' },
];

export const DEFAULT_LOCALE = 'cn';

const browserLocaleMap: Record<string, string> = {
  zh: 'cn',
  'zh-cn': 'cn',
  'zh-hans': 'cn',
  'zh-sg': 'cn',
};

const vuetifyLocaleMap: Record<string, keyof typeof vloc> = {
  cn: 'zhHans',
};

const intlLocaleMap: Record<string, string> = {
  cn: 'zh-CN',
};

export function resolveLocale(locale?: string | null) {
  if (!locale) return DEFAULT_LOCALE;

  const normalized = locale.toLowerCase();
  const [base] = normalized.split('-');
  const mapped = browserLocaleMap[normalized] ?? browserLocaleMap[base] ?? normalized;

  if (availableLocales.some((item) => item.code === mapped)) return mapped;
  if (availableLocales.some((item) => item.code === base)) return base;

  return DEFAULT_LOCALE;
}

export function toIntlLocale(locale: string) {
  return intlLocaleMap[locale] ?? locale;
}

// Create Vue I18n instance.
export const i18n = createI18n({
  legacy: false,
  globalInjection: true,
  locale: DEFAULT_LOCALE,
  fallbackLocale: 'en',
  messages: messages,
});

// Set new locale.
export async function setLocale(locale: string) {
  const resolvedLocale = resolveLocale(locale);
  const vuetifyLocale = vuetifyLocaleMap[resolvedLocale] ?? (resolvedLocale as keyof typeof vloc);
  const vuetifyMessages = vloc[vuetifyLocale] ?? vloc.en;

  i18n.global.setLocaleMessage(resolvedLocale, {
    ...i18n.global.getLocaleMessage(resolvedLocale),
    $vuetify: { ...vuetifyMessages },
  });

  i18n.global.locale.value = resolvedLocale;
  document.documentElement.lang = toIntlLocale(resolvedLocale);
}
