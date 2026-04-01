export const THEME_CHANGE_EVENT = 'nexus-theme-change';

export function applyTheme(t: 'light' | 'dark') {
  const root = document.documentElement;
  if (t === 'dark') {
    root.classList.add('dark');
    root.style.colorScheme = 'dark';
  } else {
    root.classList.remove('dark');
    root.style.colorScheme = 'light';
  }
  try {
    localStorage.setItem('theme', t);
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT, { detail: t }));
}

export function readInitialTheme(): 'light' | 'dark' {
  const stored = localStorage.getItem('theme') as 'light' | 'dark' | null;
  if (stored === 'light' || stored === 'dark') return stored;
  if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}
