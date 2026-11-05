import '../../../packages/tokens/generated/tokens.css';
import './styles.css';

type Theme = 'light' | 'dark' | 'system';
const root = document.documentElement;
const select = document.querySelector<HTMLSelectElement>('#theme-select');
const status = document.querySelector<HTMLElement>('#preference-status');
const media = window.matchMedia('(prefers-color-scheme: dark)');

function isTheme(value: string | undefined): value is Theme {
  return value === 'light' || value === 'dark' || value === 'system';
}

function applyTheme(preference: Theme): void {
  root.dataset.themePreference = preference;
  root.dataset.theme = preference === 'system' ? (media.matches ? 'dark' : 'light') : preference;
  if (select) select.value = preference;
}

const initial = root.dataset.themePreference;
applyTheme(isTheme(initial) ? initial : 'light');
select?.addEventListener('change', () => {
  if (!isTheme(select.value)) return;
  applyTheme(select.value);
  try {
    localStorage.setItem('pwa-ds-theme', select.value);
    if (status) status.textContent = `${select.value} theme selected.`;
  } catch {
    if (status) status.textContent = 'Theme changed for this page, but browser storage is unavailable.';
  }
});
media.addEventListener('change', () => {
  if (root.dataset.themePreference === 'system') applyTheme('system');
});
