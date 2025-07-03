/**
 * Enhanced Service Worker for Civilyst PWA
 * Provides background sync, advanced caching, and offline capabilities
 */

const CACHE_NAME = 'civilyst-v1';
const BACKGROUND_SYNC_TAG = 'background-sync';
const CRITICAL_RESOURCES_CACHE = 'critical-resources-v1';
const API_CACHE = 'api-cache-v1';
const IMAGES_CACHE = 'images-cache-v1';

// Critical resources to pre-cache
const criticalResources = [
  '/',
  '/campaigns',
  '/dashboard',
  '/offline',
  '/manifest.json',
  // Add more critical resources as needed
];

// Install event - cache critical resources
self.addEventListener('install', (event) => {
  console.log('SW: Installing enhanced service worker');
  
  event.waitUntil(
    caches.open(CRITICAL_RESOURCES_CACHE)
      .then((cache) => {
        console.log('SW: Caching critical resources');
        return cache.addAll(criticalResources);
      })
      .then(() => {
        // Skip waiting to activate immediately
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('SW: Activating enhanced service worker');
  
  event.waitUntil(
    Promise.all([
      // Take control of all pages
      self.clients.claim(),
      
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && 
                cacheName !== CRITICAL_RESOURCES_CACHE && 
                cacheName !== API_CACHE && 
                cacheName !== IMAGES_CACHE) {
              console.log('SW: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
    ])
  );
});

// Fetch event - handle requests with advanced caching strategies
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Handle different types of requests
  if (event.request.method === 'GET') {
    if (url.pathname.startsWith('/api/')) {
      // API requests - Network first with cache fallback
      event.respondWith(handleApiRequest(event.request));
    } else if (url.pathname.match(/\.(png|jpg|jpeg|svg|gif|webp)$/)) {
      // Images - Cache first
      event.respondWith(handleImageRequest(event.request));
    } else if (url.pathname.startsWith('/_next/static/')) {
      // Static assets - Cache first
      event.respondWith(handleStaticAssets(event.request));
    } else {
      // Pages - Network first with offline fallback
      event.respondWith(handlePageRequest(event.request));
    }
  }
});

// Background sync event
self.addEventListener('sync', (event) => {
  console.log('SW: Background sync triggered:', event.tag);
  
  if (event.tag === BACKGROUND_SYNC_TAG) {
    event.waitUntil(handleBackgroundSync());
  }
});

// Message event - handle commands from the app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type) {
    switch (event.data.type) {
      case 'SKIP_WAITING':
        self.skipWaiting();
        break;
      case 'GET_VERSION':
        event.ports[0].postMessage({ version: '1.0.0' });
        break;
      case 'CACHE_URLS':
        event.waitUntil(cacheUrls(event.data.urls));
        break;
      default:
        console.log('SW: Unknown message type:', event.data.type);
    }
  }
});

// API request handler - Network first with cache fallback
async function handleApiRequest(request) {
  try {
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(API_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('SW: Network failed for API request, trying cache');
    
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline response for API failures
    return new Response(
      JSON.stringify({ error: 'Offline', offline: true }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Image request handler - Cache first
async function handleImageRequest(request) {
  const cache = await caches.open(IMAGES_CACHE);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    // Return placeholder image for failed image requests
    return new Response('', { status: 404 });
  }
}

// Static assets handler - Cache first
async function handleStaticAssets(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('SW: Failed to fetch static asset:', request.url);
    return new Response('', { status: 404 });
  }
}

// Page request handler - Network first with offline fallback
async function handlePageRequest(request) {
  try {
    const networkResponse = await fetch(request);
    
    // Cache successful page responses
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('SW: Network failed for page request, trying cache');
    
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page as fallback
    const offlineResponse = await caches.match('/offline');
    return offlineResponse || new Response('Offline', { status: 503 });
  }
}

// Background sync handler
async function handleBackgroundSync() {
  console.log('SW: Processing background sync');
  
  try {
    // Get sync queue from IndexedDB
    const db = await openDB();
    const transaction = db.transaction(['syncQueue'], 'readonly');
    const store = transaction.objectStore('syncQueue');
    const syncItems = await getAll(store);
    
    console.log('SW: Found', syncItems.length, 'items to sync');
    
    // Process each sync item
    for (const item of syncItems) {
      try {
        await processSyncItem(item);
        
        // Remove successful item from queue
        const deleteTransaction = db.transaction(['syncQueue'], 'readwrite');
        const deleteStore = deleteTransaction.objectStore('syncQueue');
        await deleteStore.delete(item.id);
        
        console.log('SW: Successfully synced item:', item.id);
      } catch (error) {
        console.error('SW: Failed to sync item:', item.id, error);
        
        // Increment retry count
        item.retryCount = (item.retryCount || 0) + 1;
        
        if (item.retryCount > 3) {
          // Remove after too many retries
          const deleteTransaction = db.transaction(['syncQueue'], 'readwrite');
          const deleteStore = deleteTransaction.objectStore('syncQueue');
          await deleteStore.delete(item.id);
          console.log('SW: Removed failed item after max retries:', item.id);
        } else {
          // Update retry count
          const updateTransaction = db.transaction(['syncQueue'], 'readwrite');
          const updateStore = updateTransaction.objectStore('syncQueue');
          await updateStore.put(item);
        }
      }
    }
  } catch (error) {
    console.error('SW: Background sync failed:', error);
  }
}

// Process individual sync item
async function processSyncItem(item) {
  const { type, data } = item;
  
  switch (type) {
    case 'campaign_create':
      return await syncCampaignCreate(data);
    case 'campaign_update':
      return await syncCampaignUpdate(data);
    case 'vote':
      return await syncVote(data);
    case 'comment':
      return await syncComment(data);
    default:
      throw new Error(`Unknown sync type: ${type}`);
  }
}

// Sync campaign creation
async function syncCampaignCreate(data) {
  const response = await fetch('/api/campaigns', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error(`Campaign create failed: ${response.status}`);
  }
  
  return response.json();
}

// Sync campaign update
async function syncCampaignUpdate(data) {
  const response = await fetch(`/api/campaigns/${data.id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error(`Campaign update failed: ${response.status}`);
  }
  
  return response.json();
}

// Sync vote
async function syncVote(data) {
  const response = await fetch('/api/votes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error(`Vote sync failed: ${response.status}`);
  }
  
  return response.json();
}

// Sync comment
async function syncComment(data) {
  const response = await fetch('/api/comments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error(`Comment sync failed: ${response.status}`);
  }
  
  return response.json();
}

// Cache additional URLs
async function cacheUrls(urls) {
  const cache = await caches.open(CACHE_NAME);
  return Promise.all(
    urls.map(url => {
      return cache.add(url).catch(error => {
        console.error('SW: Failed to cache URL:', url, error);
      });
    })
  );
}

// IndexedDB helpers
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('civilyst-pwa', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains('syncQueue')) {
        const store = db.createObjectStore('syncQueue', { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('type', 'type', { unique: false });
      }
    };
  });
}

function getAll(store) {
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}