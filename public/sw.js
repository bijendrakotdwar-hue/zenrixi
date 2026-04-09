const CACHE_NAME = "zenrixi-v3"
const urlsToCache = ["/", "/manifest.json"]

self.addEventListener("install", event => {
  self.skipWaiting()
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache)))
})

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  )
})

self.addEventListener("fetch", event => {
  if (event.request.destination === "script" || event.request.destination === "style") {
    event.respondWith(fetch(event.request))
    return
  }
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  )
})