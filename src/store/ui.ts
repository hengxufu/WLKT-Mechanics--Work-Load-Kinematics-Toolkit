import { defineStore } from 'pinia';
import { ref } from 'vue';

export type CaeTheme = 'dark' | 'light';

export const useUiStore = defineStore(
  'cae-ui',
  () => {
    const theme = ref<CaeTheme>('dark');
    const leftSidebarWidth = ref(244);
    const rightSidebarWidth = ref(320);
    const leftSidebarCollapsed = ref(false);
    const rightSidebarCollapsed = ref(false);
    const modelTreeFilter = ref('');

    const toggleTheme = () => {
      theme.value = theme.value === 'dark' ? 'light' : 'dark';
    };

    return {
      theme,
      leftSidebarWidth,
      rightSidebarWidth,
      leftSidebarCollapsed,
      rightSidebarCollapsed,
      modelTreeFilter,
      toggleTheme,
    };
  },
  {
    persist: {
      pick: [
        'theme',
        'leftSidebarWidth',
        'rightSidebarWidth',
        'leftSidebarCollapsed',
        'rightSidebarCollapsed',
      ],
    },
  }
);
