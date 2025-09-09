// Service Worker for Agente de Investigación Clínica de Oftalmología
const CACHE_NAME = 'oftalmologia-agent-v1.0.0';
const STATIC_CACHE = 'oftalmologia-static-v1';
const DYNAMIC_CACHE = 'oftalmologia-dynamic-v1';

// Essential files to cache for offline functionality
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/index.tsx',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'
];

// API endpoints that should be cached
const CACHE_API_PATTERNS = [
  /^https:\/\/generativelanguage\.googleapis\.com\/v1beta\//,
];

// Install event - cache static assets
self.addEventListener('install', event => {
  console.log('SW: Installing service worker');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('SW: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .catch(err => {
        console.error('SW: Error caching static assets', err);
      })
  );
  
  // Force activation of new service worker
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('SW: Activating service worker');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            console.log('SW: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Take control of all pages immediately
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', event => {
  const { request } = event;
  const { method, url } = request;
  
  // Only handle GET requests
  if (method !== 'GET') return;
  
  // Skip chrome-extension and non-http requests
  if (!url.startsWith('http')) return;
  
  event.respondWith(
    handleRequest(request)
  );
});

async function handleRequest(request) {
  const { url } = request;
  
  try {
    // For navigation requests (HTML pages)
    if (request.mode === 'navigate') {
      return await handleNavigationRequest(request);
    }
    
    // For API requests that should be cached
    if (shouldCacheApiRequest(url)) {
      return await handleApiRequest(request);
    }
    
    // For static assets (JS, CSS, fonts, images)
    if (isStaticAsset(url)) {
      return await handleStaticAssetRequest(request);
    }
    
    // For everything else, try network first
    return await fetch(request);
    
  } catch (error) {
    console.error('SW: Error handling request', url, error);
    
    // Return offline fallback if available
    if (request.mode === 'navigate') {
      const cache = await caches.open(STATIC_CACHE);
      return await cache.match('/') || new Response('Offline - No cached page available');
    }
    
    throw error;
  }
}

// Handle navigation requests (HTML pages)
async function handleNavigationRequest(request) {
  try {
    // Try network first for fresh content
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Fallback to cache
    const cache = await caches.open(STATIC_CACHE);
    const cachedResponse = await cache.match('/');
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Ultimate fallback
    return new Response('Offline - App not available', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// Handle API requests with caching strategy
async function handleApiRequest(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    // Cache successful API responses
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Fallback to cache for API requests
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      console.log('SW: Serving API request from cache', request.url);
      return cachedResponse;
    }
    
    throw error;
  }
}

// Handle static assets (JS, CSS, fonts)
async function handleStaticAssetRequest(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    // Serve from cache immediately
    return cachedResponse;
  }
  
  try {
    // Fetch from network and cache
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('SW: Failed to fetch static asset', request.url);
    throw error;
  }
}

// Helper functions
function shouldCacheApiRequest(url) {
  return CACHE_API_PATTERNS.some(pattern => pattern.test(url));
}

function isStaticAsset(url) {
  return /\.(js|css|woff2?|png|jpg|jpeg|gif|svg|ico)$/i.test(url) ||
         url.includes('fonts.googleapis.com') ||
         url.includes('cdn.tailwindcss.com');
}

// Background sync for offline actions
self.addEventListener('sync', event => {
  console.log('SW: Background sync triggered', event.tag);
  
  if (event.tag === 'medical-investigation') {
    event.waitUntil(syncMedicalInvestigations());
  }
});

// Handle offline investigation requests
async function syncMedicalInvestigations() {
  try {
    // This would sync any pending medical investigations when back online
    console.log('SW: Syncing medical investigations');
    
    // Implementation would depend on your offline storage strategy
    // For now, just log the sync event
  } catch (error) {
    console.error('SW: Error syncing medical investigations', error);
  }
}

// PWA install prompt handling
self.addEventListener('beforeinstallprompt', event => {
  console.log('SW: PWA install prompt triggered');
  event.preventDefault();
  
  // Store the event to trigger it later
  self.deferredPrompt = event;
});