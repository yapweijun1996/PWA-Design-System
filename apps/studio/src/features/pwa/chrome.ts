/** Reflect resolved semantic surfaces in supported browser chrome; iOS launch still needs device QA. */
export function initializeSystemChrome(): () => void {
  const root = document.documentElement;
  const sync = (): void => {
    const surface = getComputedStyle(root).getPropertyValue('--ds-color-surface').trim();
    if (/^#[a-f0-9]{6}$/i.test(surface)) document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')?.setAttribute('content', surface);
    document.querySelector<HTMLMetaElement>('meta[name="apple-mobile-web-app-status-bar-style"]')?.setAttribute('content', root.dataset.theme === 'dark' ? 'black' : 'default');
  };
  const topbar = document.querySelector<HTMLElement>('.studio-topbar');
  const connectivity = document.querySelector<HTMLElement>('#pwa-connectivity');
  const update = document.querySelector<HTMLElement>('#pwa-update');
  const measureChrome = (): void => {
    for (const [name, value] of [['--studio-system-header-height', topbar?.offsetHeight ?? 0], ['--studio-system-connectivity-height', connectivity && !connectivity.hidden ? connectivity.offsetHeight : 0]] as const) {
      const pixels = `${value}px`; if (root.style.getPropertyValue(name) !== pixels) root.style.setProperty(name, pixels);
    }
    if ((connectivity && !connectivity.hidden) || (update && !update.hidden)) topbar?.removeAttribute('data-scroll-hidden');
  };
  const dimensions = typeof ResizeObserver === 'function' ? new ResizeObserver(measureChrome) : null;
  for (const region of [topbar, connectivity, update]) if (region) dimensions?.observe(region);
  measureChrome(); sync();
  const observer = new MutationObserver(sync);
  observer.observe(root, { attributes: true, attributeFilter: ['data-theme', 'data-palette', 'data-density', 'data-kit', 'style'] });
  return () => { observer.disconnect(); dimensions?.disconnect(); };
}
