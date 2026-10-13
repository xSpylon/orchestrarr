import { useCallback, useEffect, useState } from 'react';
import { useLocale } from '@/lib/i18n';

export type ThemePreference = 'system' | 'dark' | 'light';

export function useThemePreference(showToast: (message: string) => void) {
  const { t } = useLocale();
  const [themePreference, setThemePreference] = useState<ThemePreference>(() => {
    const saved = localStorage.getItem('theme');
    // Dark is the default; 'system' is stored explicitly when chosen.
    return saved === 'light' || saved === 'system' ? saved : 'dark';
  });
  const [theme, setTheme] = useState<'dark' | 'light'>(() => document.documentElement.dataset.theme === 'light' ? 'light' : 'dark');

  const changeTheme = useCallback((preference: ThemePreference) => {
    setThemePreference(preference);
    // Only explicit theme choices show feedback; following the system theme stays quiet.
    if (preference === 'light') showToast(t('settings.lightEnabled'));
    if (preference === 'dark') showToast(t('settings.darkEnabled'));
    if (preference === 'system') {
      localStorage.setItem('theme', 'system');
      const resolved = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
      document.documentElement.dataset.theme = resolved;
      setTheme(resolved);
    } else {
      localStorage.setItem('theme', preference);
      document.documentElement.dataset.theme = preference;
      setTheme(preference);
    }
  }, [showToast, t]);

  useEffect(() => {
    if (themePreference !== 'system') return undefined;
    const preference = window.matchMedia('(prefers-color-scheme: light)');
    const update = () => { const resolved = preference.matches ? 'light' : 'dark'; document.documentElement.dataset.theme = resolved; setTheme(resolved); };
    preference.addEventListener('change', update);
    return () => preference.removeEventListener('change', update);
  }, [themePreference]);

  const toggleTheme = useCallback(() => changeTheme(theme === 'dark' ? 'light' : 'dark'), [changeTheme, theme]);
  return { themePreference, theme, changeTheme, toggleTheme };
}
