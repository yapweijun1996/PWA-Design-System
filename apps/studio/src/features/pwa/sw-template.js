/* Build replaces the version and exact local file list. */
const cachePrefix = 'pwa-design-system-static-';
const cacheName = `${cachePrefix}__VERSION__`;
const files = __PRECACHE__;
const scopePath = '/PWA-Design-System/';

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    try {
      const verified = await Promise.all(files.map(async file => {
        const response = await fetch(file.url, { cache: 'no-store', credentials: 'same-origin', redirect: 'error' });
        if (!response.ok || response.type !== 'basic') throw new Error(`Precache request failed: ${file.url}`);
        const bytes = await response.clone().arrayBuffer();
        const hash = await crypto.subtle.digest('SHA-256', bytes);
        const actual = Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, '0')).join('');
        if (actual !== file.sha256) throw new Error(`Precache integrity mismatch: ${file.url}`);
        return { url: file.url, response };
      }));
      const cache = await caches.open(cacheName);
      await Promise.all(verified.map(({ url, response }) => cache.put(url, response)));
    } catch (error) {
      await caches.delete(cacheName);
      throw error;
    }
  })());
});

async function scopedWindows() {
  const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  return windows.filter(client => new URL(client.url).pathname.startsWith(scopePath));
}

async function clientVersion(client) {
  return new Promise(resolve => {
    const channel = new MessageChannel();
    const timer = setTimeout(() => { channel.port1.close(); resolve(null); }, 1500);
    channel.port1.onmessage = event => {
      clearTimeout(timer); channel.port1.close();
      const version = event.data?.version;
      resolve(typeof version === 'string' && /^[a-f0-9]{20}$/.test(version) ? version : null);
    };
    client.postMessage({ type: 'REQUEST_BUILD_VERSION' }, [channel.port2]);
  });
}

async function cleanup() {
  if (self.registration.installing || self.registration.waiting) return;
  const keys = (await caches.keys()).filter(key => key.startsWith(cachePrefix));
  if (self.registration.installing || self.registration.waiting) return;
  const before = await scopedWindows();
  const versions = await Promise.all(before.map(clientVersion));
  if (versions.some(version => !version)) return;
  const after = await scopedWindows();
  if (before.length !== after.length || after.some(client => !before.some(previous => previous.id === client.id))) return;
  if (self.registration.installing || self.registration.waiting) return;
  // Keep the immediately preceding version to cover a document opening during this check.
  const prior = keys.filter(key => key !== cacheName).at(-1);
  const keep = new Set([cacheName, prior, ...versions.map(version => `${cachePrefix}${version}`)]);
  await Promise.all(keys.filter(key => !keep.has(key)).map(key => caches.delete(key)));
}

self.addEventListener('activate', event => { event.waitUntil(cleanup()); });

self.addEventListener('message', event => {
  if (event.data?.type === 'CLEANUP_CACHES') { event.waitUntil(cleanup()); return; }
  if (event.data?.type !== 'ACTIVATE_UPDATE' || !event.ports[0] || !event.source?.id) return;
  const port = event.ports[0];
  event.waitUntil((async () => {
    const source = await self.clients.get(event.source.id);
    const windows = await scopedWindows();
    const others = windows.filter(client => client.id !== event.source.id);
    if (!source || !new URL(source.url).pathname.startsWith(scopePath) || others.length) {
      port.postMessage({ status: 'other-tabs' });
      return;
    }
    await self.skipWaiting();
    port.postMessage({ status: 'accepted' });
  })().catch(() => port.postMessage({ status: 'error' })));
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin || url.search || !url.pathname.startsWith(scopePath)) return;
  const path = request.mode === 'navigate' && (url.pathname === scopePath || url.pathname === `${scopePath}index.html`) ? `${scopePath}index.html` : url.pathname;
  event.respondWith((async () => {
    const current = await caches.open(cacheName);
    const hit = await current.match(path);
    if (hit) return hit;
    // Earlier precaches contain only their build's explicitly enumerated files.
    const keys = await caches.keys();
    for (const key of keys.filter(key => key.startsWith(cachePrefix) && key !== cacheName).reverse()) {
      const old = await (await caches.open(key)).match(path);
      if (old) return old;
    }
    return fetch(request);
  })());
});
