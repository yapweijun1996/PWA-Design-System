// Resolve stored appearance before styles and token overrides are painted.
(() => {
  const choices = {
    theme: ['light', 'dark', 'system'],
    palette: ['blue', 'indigo', 'violet', 'emerald', 'teal', 'rose', 'orange', 'slate'],
    density: ['comfortable', 'compact'],
    kit: ['default', 'minimal', 'enterprise']
  };
  const read = (name) => {
    try {
      const value = localStorage.getItem(`pwa-ds-${name}`);
      return choices[name].includes(value) ? value : choices[name][0];
    } catch {
      return choices[name][0];
    }
  };
  const preference = read('theme');
  const data = document.documentElement.dataset;
  data.themePreference = preference;
  data.theme = preference === 'system'
    ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : preference;
  for (const name of ['palette', 'density', 'kit']) data[name] = read(name);
})();
