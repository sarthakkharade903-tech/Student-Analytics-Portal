// StudentIQ PWA Service Worker (v1.0)
// Network-First strategy to guarantee fresh SSR & dynamic marks data from Vercel

const CACHE_NAME = 'studentiq-v1'
const STATIC_ASSETS = [
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-512.png',
  '/manifest.json',
  '/favicon.ico'
]

// Install Event — precache core offline icons
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS)
    }).then(() => self.skipWaiting())
  )
})

// Activate Event — cleanup old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    }).then(() => self.clients.claim())
  )
})

// Fetch Event — Network-First for dynamic routes, Cache-First for static assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // Ignore non-GET requests and Supabase external API requests
  if (event.request.method !== 'GET' || !url.origin.includes(self.location.origin)) {
    return
  }

  // Static assets: Cache-First
  if (url.pathname.startsWith('/icons/') || url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse
        return fetch(event.request).then((networkResponse) => {
          if (networkResponse.status === 200) {
            const responseToCache = networkResponse.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache))
          }
          return networkResponse
        })
      })
    )
    return
  }

  // Navigation & Data: Network-First (ensures live test results and attendance)
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse.status === 200) {
          const responseToCache = networkResponse.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache))
        }
        return networkResponse
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse
          // If offline and request is an HTML page navigation, fallback
          if (event.request.mode === 'navigate') {
            return caches.match('/app') || new Response(
              '<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Offline - StudentIQ</title><style>body{background:#09090b;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;text-align:center;padding:20px;}</style></head><body><div><h2>You are currently offline</h2><p>Please check your internet connection to view the latest test analytics.</p></div></body></html>',
              { headers: { 'Content-Type': 'text/html' } }
            )
          }
        })
      })
  )
})
