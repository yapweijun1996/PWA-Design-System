// Apply the saved preference before the stylesheet is rendered.
(() => {
  let preference = 'light';
  try {
    const saved = localStorage.getItem('pwa-ds-theme');
    if (saved === 'light' || saved === 'dark' || saved === 'system') preference = saved;
  } catch {
    // The default remains usable when storage is unavailable.
  }
  const resolved = preference === 'system'
    ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : preference;
  document.documentElement.dataset.themePreference = preference;
  document.documentElement.dataset.theme = resolved;
})();
