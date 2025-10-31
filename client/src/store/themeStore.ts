import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark' | 'system';

interface ThemeStore {
  theme: Theme;
  effectiveTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  initializeTheme: () => void;
}

const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const applyTheme = (theme: 'light' | 'dark') => {
  const root = window.document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
};

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      theme: 'system',
      effectiveTheme: getSystemTheme(),
      
      setTheme: (theme: Theme) => {
        const effectiveTheme = theme === 'system' ? getSystemTheme() : theme;
        applyTheme(effectiveTheme);
        set({ theme, effectiveTheme });
      },

      initializeTheme: () => {
        const { theme } = get();
        const effectiveTheme = theme === 'system' ? getSystemTheme() : theme;
        applyTheme(effectiveTheme);
        set({ effectiveTheme });

        // Listen for system theme changes
        if (theme === 'system') {
          const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
          const handler = (e: MediaQueryListEvent) => {
            const newTheme = e.matches ? 'dark' : 'light';
            applyTheme(newTheme);
            set({ effectiveTheme: newTheme });
          };
          mediaQuery.addEventListener('change', handler);
          return () => mediaQuery.removeEventListener('change', handler);
        }
      },
    }),
    {
      name: 'theme-storage',
    }
  )
);
