const CACHE_NAME = 'codeweaver-static-v1';
const FONT_CACHE = 'codeweaver-fonts-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/favicon.svg',
];

// Install Event: cache core static shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Caching static shell');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME && key !== FONT_CACHE) {
            console.log('[ServiceWorker] Removing old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event: intercept and apply caching strategies
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // 1. Google Fonts Caching (Cache First)
  if (requestUrl.hostname === 'fonts.googleapis.com' || requestUrl.hostname === 'fonts.gstatic.com') {
    event.respondWith(
      caches.open(FONT_CACHE).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          return fetch(event.request).then((networkResponse) => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        });
      })
    );
    return;
  }

  // 2. API intercept caching/fallback (Network First, fallback to cached API response or offline JSON)
  if (requestUrl.pathname.includes('/api/v1/')) {
    // Exclude POST/PUT requests from fetch caching to prevent side-effects, but save offline actions
    if (event.request.method !== 'GET') {
      event.respondWith(
        fetch(event.request.clone()).catch((error) => {
          console.warn('[ServiceWorker] API mutation failed. Storing request for background sync.');
          return queueOfflineRequest(event.request.clone()).then(() => {
            return new Response(
              JSON.stringify({
                success: false,
                offline: true,
                message: 'Connection degraded. Action queued for auto-sync.',
                timestamp: new Date().toISOString()
              }),
              { headers: { 'Content-Type': 'application/json' }, status: 503 }
            );
          });
        })
      );
      return;
    }

    event.respondWith(
      fetch(event.request).then((response) => {
        return response;
      }).catch(async () => {
        console.warn('[ServiceWorker] API call failed. Reverting to local cache.');
        const cache = await caches.open(CACHE_NAME);
        const match = await cache.match(event.request);
        if (match) return match;

        // Generic API fallback when totally offline and uncached
        return new Response(
          JSON.stringify({
            data: [],
            success: false,
            message: 'Swarm control offline. Local fallback database active.',
            offline: true
          }),
          { headers: { 'Content-Type': 'application/json' }, status: 200 }
        );
      })
    );
    return;
  }

  // 3. Static Assets Caching (Stale-While-Revalidate)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch fresh copy in background to update cache
        fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
            }
          })
          .catch(() => { /* Ignore background update failures */ });
        return cachedResponse;
      }

      return fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse.status === 200 && !event.request.url.startsWith('chrome-extension')) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          }
          return networkResponse;
        })
        .catch(() => {
          // If HTML request fails, serve index.html as offline fallback page
          if (event.request.headers.get('accept')?.includes('text/html')) {
            return caches.match('/index.html');
          }
          return new Response('Network error occurred.', { status: 408, statusText: 'Network Timeout' });
        });
    })
  );
});

// --- IndexedDB & Background Sync Logic ---

const getDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('codeweaver_offline_db', 1);
    request.onupgradeneeded = (e: any) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('requests')) {
        db.createObjectStore('requests', { keyPath: 'id', autoIncrement: true });
      }
    };
    request.onsuccess = (e: any) => resolve(e.target.result);
    request.onerror = (e) => reject(e);
  });
};

const queueOfflineRequest = async (request) => {
  const db: any = await getDB();
  const body = await request.text();
  const headers = {};
  for (const [key, val] of request.headers.entries()) {
    headers[key] = val;
  }

  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction('requests', 'readwrite');
    const store = transaction.objectStore('requests');
    const req = store.add({
      url: request.url,
      method: request.method,
      headers,
      body,
      timestamp: Date.now()
    });

    req.onsuccess = () => {
      console.log('[ServiceWorker] Saved offline request to IndexedDB.');
      // Register background sync if service worker registration sync is available
      if (self.registration.sync) {
        self.registration.sync.register('sync-submissions');
      }
      resolve();
    };
    req.onerror = (e) => reject(e);
  });
};

// Listen to Sync event for background sync trigger
self.addEventListener('sync', (event: any) => {
  if (event.tag === 'sync-submissions') {
    console.log('[ServiceWorker] Background Sync event triggered.');
    event.waitUntil(replayOfflineRequests());
  }
});

const replayOfflineRequests = async () => {
  const db: any = await getDB();
  const requests = await new Promise<any[]>((resolve, reject) => {
    const transaction = db.transaction('requests', 'readonly');
    const store = transaction.objectStore('requests');
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = (e) => reject(e);
  });

  if (requests.length === 0) return;

  console.log(`[ServiceWorker] Replaying ${requests.length} queued offline requests.`);

  for (const reqData of requests) {
    try {
      const response = await fetch(reqData.url, {
        method: reqData.method,
        headers: reqData.headers,
        body: reqData.body
      });

      if (response.ok) {
        // Success: remove request from IndexedDB queue
        const transaction = db.transaction('requests', 'readwrite');
        const store = transaction.objectStore('requests');
        store.delete(reqData.id);
        console.log(`[ServiceWorker] Successfully synced request ${reqData.id}.`);
      }
    } catch (e) {
      console.error(`[ServiceWorker] Failed to replay request ${reqData.id}. Re-queuing.`, e);
      break; // Pause replays if network is still unreachable
    }
  }
};
