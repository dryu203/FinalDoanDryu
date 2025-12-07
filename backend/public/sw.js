// Service Worker cho PWA - Network-first strategy để luôn có version mới nhất
// Version này sẽ tự động update khi có build mới
const CACHE_VERSION = Date.now().toString();
const CACHE_NAME = `study-tracker-${CACHE_VERSION}`;

// Install event - skip waiting để activate ngay
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker version:', CACHE_VERSION);
  self.skipWaiting(); // Activate ngay lập tức
});

// Activate event - clean up old caches và claim clients
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker version:', CACHE_VERSION);
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Xóa tất cả cache cũ
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Claim tất cả clients ngay lập tức
      return self.clients.claim();
    })
  );
});

// Fetch event - Network-first strategy
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Skip API calls - always use network, never cache
  if (url.pathname.startsWith('/api/')) {
    return;
  }
  
  // Skip Socket.IO - always use network
  if (url.pathname.startsWith('/socket.io/')) {
    return;
  }

  // Skip uploads - always use network
  if (url.pathname.startsWith('/uploads/')) {
    return;
  }

  // Network-first strategy: Luôn fetch từ network trước, fallback to cache
  event.respondWith(
    fetch(event.request, {
      cache: 'no-cache', // Bypass browser cache, fetch từ network
      headers: {
        'Cache-Control': 'no-cache'
      }
    })
      .then((response) => {
        // Clone response để có thể cache
        const responseToCache = response.clone();
        
        // Chỉ cache successful responses
        if (response.status === 200) {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        
        return response;
      })
      .catch(() => {
        // Network failed, try cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          
          // Nếu là HTML request và không có cache, return index.html
          if (event.request.destination === 'document') {
            return caches.match('/index.html');
          }
          
          // Return empty response nếu không có cache
          return new Response('Offline', { status: 503 });
        });
      })
  );
});
