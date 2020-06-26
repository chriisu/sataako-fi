const CACHE_NAME = 'sade-cache-v11'

self.skipWaiting()

this.addEventListener('install', (event) => {
  const preCache = async () => {
    const cache = await caches.open(CACHE_NAME)
    cache.addAll(['/index.html', '/client.css', '/client.js'])
  }
  event.waitUntil(preCache())
})

self.addEventListener('activate', (event) => {
  event.waitUntil(Promise.all([pruneCaches(), clients.claim()]))
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const getCustomResponsePromise = () => {
    try {
      return cacheBlacklist(request)
        ? fetchResponse({ request })
        : cacheFirstResponse(request)
    } catch (err) {
      console.error(`Error ${err}`)
      throw err
    }
  }

  if (request.method === 'GET' && request.url.startsWith('http')) {
    event.respondWith(getCustomResponsePromise())
  }
})

async function fetchResponse({ request, cacheResponse = false }) {
  const netResponse = await fetch(request)
  if (cacheResponse) {
    console.log(`adding response to cache: `, request.url)
    const cache = await caches.open(CACHE_NAME)
    cache.put(request, netResponse.clone())
  }
  return netResponse
}

async function cacheFirstResponse(request) {
  const cachedResponse = await caches.match(request)
  return cachedResponse
    ? cachedResponse
    : fetchResponse({ request, cacheResponse: true })
}

function cacheBlacklist(request) {
  return (
    request.cache === 'reload' ||
    request.url.includes('google-analytics.com') ||
    request.url.includes('googletagmanager.com')
  )
}

async function pruneCaches() {
  return Promise.all([
    ...(await pruneOldRadarFrames()),
    ...(await pruneOldCaches()),
  ])
}

async function pruneOldCaches() {
  const cacheNames = await caches.keys()
  return cacheNames
    .filter(
      (cacheName) =>
        CACHE_NAME !== cacheName && cacheName.startsWith('sade-cache')
    )
    .map((cacheName) => caches.delete(cacheName))
}

async function pruneOldRadarFrames() {
  const cache = await caches.open(CACHE_NAME)
  const cacheItems = await cache.keys()
  return cacheItems
    .filter(({ url }) => url.includes('/frame/'))
    .filter(
      ({ url }) =>
        Date.now() - new Date(url.split('/frame/')[1].split('/')[0]).getTime() >
        1000 * 60 * 60 * 4
    )
    .map((request) => cache.delete(request))
}
