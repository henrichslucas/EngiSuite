// Service worker: o app abre offline depois da primeira visita.
// /assets/* tem nome com hash (imutável): cache primeiro. O resto: rede primeiro, com cache de reserva.
const CACHE = 'engisuite-v1'

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(['/', '/favicon.svg', '/manifest.webmanifest'])).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()))
})

self.addEventListener('fetch', (e) => {
  const req = e.request
  const url = new URL(req.url)
  if (req.method !== 'GET' || url.origin !== location.origin) return
  const guardar = (res) => {
    if (res.ok) {
      const copia = res.clone()
      caches.open(CACHE).then((c) => c.put(req, copia))
    }
    return res
  }
  if (url.pathname.startsWith('/assets/')) {
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then(guardar)))
    return
  }
  e.respondWith(fetch(req).then(guardar).catch(() => caches.match(req).then((hit) => hit || caches.match('/'))))
})
