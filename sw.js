// Radlands 2 – ukládání pro hraní offline + aktualizace jen po potvrzení
const PREFIX = 'radlands2-';
const VERSION = PREFIX + '2.8';
const CORE = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png'];
self.addEventListener('install', e => {
  // nová verze se stáhne do zásoby, ale počká, dokud hráč nepotvrdí „Aktualizovat“
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(CORE.map(u => new Request(u, { cache: 'reload' })))));
});
self.addEventListener('message', e => { if (e.data === 'SKIP') self.skipWaiting(); });
self.addEventListener('activate', e => {
  // maže jen vlastní staré verze – soubory jiných aplikací na stejné doméně nechá být
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith(PREFIX) && k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(caches.open(VERSION).then(c => c.match(req).then(hit => hit || fetch(req).then(res => { c.put(req, res.clone()); return res; }))));
    return;
  }
  if (url.origin !== location.origin) return;
  if (!url.pathname.startsWith(new URL(self.registration.scope).pathname)) return;
  if (url.pathname.endsWith('version.json')) return; // informace o nové verzi vždy ze sítě
  if (req.mode === 'navigate') {
    e.respondWith(caches.open(VERSION).then(c => c.match('./index.html')).then(hit => hit || fetch(req)));
    return;
  }
  e.respondWith(caches.open(VERSION).then(c => c.match(req, { ignoreSearch: true })).then(hit => hit || fetch(req)));
});
