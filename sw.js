// Service Worker for Nokia Bounce Game PWA
const CACHE_NAME = 'bounce-game-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/ui.js',
  '/js/renderer.js',
  '/js/physics.js',
  '/js/ball.js',
  '/js/level.js',
  '/js/game.js',
  '/js/main.js',
  '/favicon.svg',
  '/favicon.ico',
  '/apple-touch-icon.png',
  'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/cannon.js/0.6.2/cannon.min.js'
];

// Dynamic base URL for different environments
const BASE_URL = self.location.hostname === 'localhost' || self.location.hostname.includes('127.0.0.1') 
  ? '' // Local development
  : 'https://bounce.nikhilmishra.live'; // Production

// Install event - cache all required assets
self.addEventListener('install', event => {
  // Perform install steps
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache.map(url => {
          // Only prepend BASE_URL to relative URLs (not CDN URLs)
          return url.startsWith('http') ? url : `${BASE_URL}${url}`;
        }));
      })
  );
});

// Fetch event - serve from cache, fall back to network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        
        // Clone the request because it's a one-time use stream
        const fetchRequest = event.request.clone();
        
        return fetch(fetchRequest).then(
          response => {
            // Check if we received a valid response
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clone the response because it's a one-time use stream
            const responseToCache = response.clone();
            
            caches.open(CACHE_NAME)
              .then(cache => {
                // Don't cache if it's a Google Analytics request
                if (!event.request.url.includes('google-analytics.com')) {
                  cache.put(event.request, responseToCache);
                }
              });
              
            return response;
          }
        );
      })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            // If this cache name isn't in the whitelist, delete it
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
