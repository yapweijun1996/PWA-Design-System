import { isDraftUnsafe } from './guard.js';
import './styles.css';

export function initializePwa(): void {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
  const container = document.querySelector<HTMLElement>('#pwa-update');
  const message = container?.querySelector<HTMLElement>('[role="status"]');
  const button = container?.querySelector<HTMLButtonElement>('button');
  if (!container || !message || !button) return;
  const version = document.querySelector<HTMLMetaElement>('meta[name="studio-version"]')?.content;
  navigator.serviceWorker.addEventListener('message', event => {
    if (event.data?.type === 'REQUEST_BUILD_VERSION' && event.ports[0]) event.ports[0].postMessage({ version });
  });
  void navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, { scope: import.meta.env.BASE_URL, updateViaCache: 'none' }).then(registration => {
    registration.active?.postMessage({ type: 'CLEANUP_CACHES' });
    let lastCheck = Date.now();
    let checking = false;
    const checkForUpdates = (): void => {
      if (!navigator.onLine || document.visibilityState !== 'visible' || checking || registration.waiting || Date.now() - lastCheck < 5 * 60 * 1000) return;
      lastCheck = Date.now(); checking = true;
      void registration.update().catch(() => {}).finally(() => { checking = false; });
    };
    window.addEventListener('online', checkForUpdates);
    document.addEventListener('visibilitychange', checkForUpdates);
    window.setInterval(checkForUpdates, 60 * 60 * 1000);
    const showUpdate = (): void => {
      if (!registration.waiting || !navigator.serviceWorker.controller) return;
      container.hidden = false;
      message.textContent = 'An update is available. Save or cancel token drafts and close other Studio tabs before preparing it.';
    };
    showUpdate();
    registration.addEventListener('updatefound', () => {
      registration.installing?.addEventListener('statechange', showUpdate);
    });
    button.addEventListener('click', () => {
      if (isDraftUnsafe()) { message.textContent = 'Save or cancel the token draft and finish importing before updating.'; return; }
      const waiting = registration.waiting;
      if (!waiting) { message.textContent = 'The update is no longer waiting. Refresh after saving your work.'; return; }
      button.disabled = true;
      message.textContent = 'Checking for other Studio tabs…';
      const main = document.querySelector<HTMLElement>('#main');
      const wasInert = main?.inert ?? false;
      if (main) main.inert = true;
      const unlock = (): void => { if (main) main.inert = wasInert; };
      const channel = new MessageChannel();
      const timeout = window.setTimeout(() => { channel.port1.close(); unlock(); button.disabled = false; message.textContent = 'Could not prepare the update. Try again when this tab is the only Studio tab.'; }, 5000);
      channel.port1.onmessage = event => {
        clearTimeout(timeout); channel.port1.close(); unlock();
        if (event.data?.status === 'accepted') {
          message.textContent = 'Update prepared. Save any work, then reload this tab when ready.';
          button.hidden = true;
        } else {
          button.disabled = false;
          message.textContent = event.data?.status === 'other-tabs' ? 'Close all other Studio tabs, then try again.' : 'Could not prepare the update. Please try again.';
        }
      };
      waiting.postMessage({ type: 'ACTIVATE_UPDATE' }, [channel.port2]);
    });
  }).catch(() => { container.hidden = false; button.hidden = true; message.textContent = 'Offline support is unavailable in this browser session.'; });
}
