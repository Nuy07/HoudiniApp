// Guarda la app para usarla sin internet: primero la red, si falla usa la copia.
const CACHE = 'houdini-v1';
const ARCHIVOS = ['./', 'index.html', 'estilos.css', 'icono.svg', 'manifest.webmanifest',
  'js/app.js', 'js/db.js', 'js/ui.js', 'js/escape.js', 'js/gatillos.js', 'js/nube.js',
  'vendor/sql-wasm-browser.js', 'vendor/sql-wasm-browser.wasm'];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ARCHIVOS)));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin || url.pathname.startsWith('/api/')) return;
  e.respondWith(fetch(e.request).then((r) => {
    if (r.ok) { const copia = r.clone(); e.waitUntil(caches.open(CACHE).then((c) => c.put(e.request, copia))); }
    return r;
  }).catch(async () => (await caches.match(e.request, { ignoreSearch: true })) ?? Response.error()));
});
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window' }).then((c) => (c[0] ? c[0].focus() : self.clients.openWindow('./'))));
});
