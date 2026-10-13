// Offline support for the invites: saves the page on first visit, then opens it without internet.
const CACHE = 'sarah-faaiz-v2';
const PAGE = new URL(self.location.href).searchParams.get('p') || 'index.html';
const FILES = PAGE === 'index.html' ? ['./', './index.html'] : ['./' + PAGE];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== CACHE).map(x => caches.delete(x)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  e.respondWith((async () => {
    let hit = await caches.match(r, { ignoreSearch: true });
    if (!hit && r.mode === 'navigate') hit = await caches.match('./' + PAGE);
    const net = fetch(r).then(res => { if (res && res.ok) { const cp = res.clone(); caches.open(CACHE).then(c => c.put(r, cp)); } return res; }).catch(() => null);
    if (hit) { e.waitUntil(net); return hit; }
    return (await net) || Response.error();
  })());
});
