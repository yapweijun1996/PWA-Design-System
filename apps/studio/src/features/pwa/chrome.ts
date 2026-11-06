/** Reflect resolved semantic surfaces in supported browser chrome; iOS launch still needs device QA. */
export function initializeSystemChrome(): () => void {
  const root = document.documentElement;
  const sync = (): void => {
    const surface = getComputedStyle(root).getPropertyValue('--ds-color-surface').trim();
    if (/^#[a-f0-9]{6}$/i.test(surface)) document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')?.setAttribute('content', surface);
    document.querySelector<HTMLMetaElement>('meta[name="apple-mobile-web-app-status-bar-style"]')?.setAttribute('content', root.dataset.theme === 'dark' ? 'black' : 'default');
  };
  sync();
  const observer = new MutationObserver(sync);
  observer.observe(root, { attributes: true, attributeFilter: ['data-theme', 'data-palette', 'data-density', 'data-kit', 'style'] });
  return () => observer.disconnect();
}
