// Offline support for the invites. Pages always load fresh from the internet when it is available;
// the saved copy is only used when there is no connection (or a very slow one).
const CACHE = 'sarah-faaiz-v3';
const PAGE = new URL(self.location.href).searchParams.get('p') || 'index.html';
const FILES = PAGE === 'index.html' ? ['./', './index.html'] : ['./' + PAGE];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== CACHE).map(x => caches.delete(x)))).then(() => self.clients.claim()));
});
const save = (r, res) => { if (res && res.ok) { const cp = res.clone(); caches.open(CACHE).then(c => c.put(r, cp)); } return res; };
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  if (r.mode === 'navigate') {
    // Network first: always show the latest page when online; fall back to the saved copy of THIS page when offline.
    e.respondWith((async () => {
      const net = fetch(r).then(res => save(r, res));
      try {
        return await Promise.race([net, new Promise((_, no) => setTimeout(no, 6000))]);
      } catch (err) {
        const hit = await caches.match(r, { ignoreSearch: true });
        if (hit) return hit;
        return (await net.catch(() => null)) || (await caches.match('./' + PAGE)) || Response.error();
      }
    })());
    return;
  }
  e.respondWith(caches.match(r, { ignoreSearch: true }).then(hit => hit || fetch(r).then(res => save(r, res))));
});
