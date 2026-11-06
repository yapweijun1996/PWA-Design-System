import { isDraftUnsafe } from './guard.js';
import { initializeSystemChrome } from './chrome.js';
import './styles.css';

export function initializePwa(): void {
  initializeSystemChrome();
  const connectivity = document.querySelector<HTMLElement>('#pwa-connectivity');
  const syncConnectivity = (): void => { if (connectivity) { connectivity.hidden = navigator.onLine; connectivity.textContent = navigator.onLine ? '' : 'You appear to be offline. Previously cached Studio tools and saved themes remain available; first-time loading may require a connection.'; } };
  syncConnectivity(); window.addEventListener('online', syncConnectivity); window.addEventListener('offline', syncConnectivity);
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
  const container = document.querySelector<HTMLElement>('#pwa-update');
  const message = container?.querySelector<HTMLElement>('[role="status"]');
  const button = container?.querySelector<HTMLButtonElement>('button');
  const reload = container?.querySelector<HTMLButtonElement>('[data-pwa-reload]');
  const loader = container?.querySelector<HTMLElement>('.pwa-update-loader');
  if (!container || !message || !button || !reload || !loader) return;
  const version = document.querySelector<HTMLMetaElement>('meta[name="studio-version"]')?.content;
  navigator.serviceWorker.addEventListener('message', event => {
    if (event.data?.type === 'REQUEST_BUILD_VERSION' && event.ports[0]) event.ports[0].postMessage({ version });
  });
  const setBusy = (busy: boolean): void => { container.setAttribute('aria-busy', String(busy)); loader.hidden = !busy; };
  reload.addEventListener('click', () => {
    if (isDraftUnsafe()) { message.textContent = 'Save or cancel the token draft and finish importing before reloading.'; return; }
    if (container.dataset.state !== 'ready') return;
    container.dataset.state = 'reloading'; setBusy(true); reload.disabled = true; message.textContent = 'Reloading the prepared Studio version…'; location.reload();
  });
  void navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, { scope: import.meta.env.BASE_URL, updateViaCache: 'none' }).then(registration => {
    registration.active?.postMessage({ type: 'CLEANUP_CACHES' });
    let lastCheck = Date.now(), checking = false;
    const checkForUpdates = (): void => {
      if (!navigator.onLine || document.visibilityState !== 'visible' || checking || registration.waiting || Date.now() - lastCheck < 5 * 60 * 1000) return;
      lastCheck = Date.now(); checking = true;
      void registration.update().catch(() => {}).finally(() => { checking = false; });
    };
    window.addEventListener('online', checkForUpdates);
    document.addEventListener('visibilitychange', checkForUpdates);
    window.setInterval(checkForUpdates, 60 * 60 * 1000);
    const showUpdate = (): void => {
      if (!registration.waiting || !navigator.serviceWorker.controller || ['checking', 'activating', 'ready', 'reloading'].includes(container.dataset.state ?? '')) return;
      container.hidden = false; container.dataset.state = 'available'; message.textContent = 'Update available. Save drafts before preparing.';
    };
    showUpdate(); registration.addEventListener('updatefound', () => registration.installing?.addEventListener('statechange', showUpdate));
    button.addEventListener('click', () => {
      if (isDraftUnsafe()) { message.textContent = 'Save or cancel the token draft and finish importing before updating.'; return; }
      const waiting = registration.waiting;
      if (!waiting) { message.textContent = 'The update is no longer waiting. Refresh after saving your work.'; return; }
      button.disabled = true; container.dataset.state = 'checking'; setBusy(true); message.textContent = 'Checking for other Studio tabs…';
      const main = document.querySelector<HTMLElement>('#main'), wasInert = main?.inert ?? false;
      if (main) main.inert = true;
      const unlock = (): void => { if (main) main.inert = wasInert; };
      const channel = new MessageChannel(); let activationTimer = 0, timeout = 0;
      const fail = (text: string): void => { clearTimeout(timeout); clearTimeout(activationTimer); waiting.removeEventListener('statechange', activated); channel.port1.close(); unlock(); setBusy(false); container.dataset.state = 'error'; button.disabled = false; message.textContent = text; };
      const activated = (): void => {
        if (waiting.state === 'redundant') { fail('The new version could not activate. Save your work and try again.'); return; }
        if (waiting.state !== 'activated') return;
        clearTimeout(activationTimer); waiting.removeEventListener('statechange', activated); unlock(); setBusy(false); container.dataset.state = 'ready'; message.textContent = 'Update prepared. Save any work, then reload this tab when ready.'; button.hidden = true; reload.hidden = false;
      };
      timeout = window.setTimeout(() => fail('Could not prepare the update. Try again when this tab is the only Studio tab.'), 5000);
      channel.port1.onmessage = event => {
        clearTimeout(timeout); channel.port1.close();
        if (event.data?.status === 'accepted') {
          container.dataset.state = 'activating'; message.textContent = 'Activating the prepared Studio version…'; waiting.addEventListener('statechange', activated); activationTimer = window.setTimeout(() => fail('Activation is taking longer than expected. Save your work before retrying or reloading.'), 10000); activated();
        } else fail(event.data?.status === 'other-tabs' ? 'Close all other Studio tabs, then try again.' : 'Could not prepare the update. Please try again.');
      };
      try { waiting.postMessage({ type: 'ACTIVATE_UPDATE' }, [channel.port2]); } catch { fail('Could not contact the waiting version. Save your work and try again.'); }
    });
  }).catch(() => { container.hidden = false; container.dataset.state = 'error'; setBusy(false); button.hidden = true; message.textContent = 'Offline support is unavailable in this browser session.'; });
}
