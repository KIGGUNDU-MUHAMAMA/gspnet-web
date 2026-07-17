/**
 * GSP.NET Service Worker
 * Progressive Web App — Offline-first caching strategy
 * ─────────────────────────────────────────────────────
 * Bump CACHE_VERSION when deploying updates.
 */

const CACHE_VERSION = 'v7';

/* ─── Cache Names ─────────────────────────────────────────────────────── */
const CACHE_SHELL   = `gspnet-shell-${CACHE_VERSION}`;
const CACHE_CDN     = `gspnet-cdn-${CACHE_VERSION}`;
const CACHE_TILES   = `gspnet-tiles-${CACHE_VERSION}`;
const CACHE_DATA    = `gspnet-data-${CACHE_VERSION}`;
const CACHE_FGB     = `gspnet-fgb-${CACHE_VERSION}`;
const CACHE_CESIUM  = `gspnet-cesium-lazy-${CACHE_VERSION}`;

const EXPECTED_CACHES = [
  CACHE_SHELL,
  CACHE_CDN,
  CACHE_TILES,
  CACHE_DATA,
  CACHE_FGB,
  CACHE_CESIUM,
];

/* ─── Precache Manifest (App Shell) ───────────────────────────────────── */
const PRECACHE_LOCAL = [
  '/webmap.html',
  '/css/styles.css',
  '/css/street-view.css',
  '/css/rover-camera.css?v=3',
  '/cesium3d-viewer.css',
  '/export-engine.css',
  '/js/map-app.js',
  '/js/supabase-client.js',
  '/js/utils.js',
  '/js/auth.js',
  '/js/importer.js',
  '/js/fgb-search.js',
  '/js/routing-engine.js',
  '/js/street-view.js',
  '/js/rover-camera.js?v=3',
  '/js/mapillary-uploader.js?v=2',
  '/js/spatial-analysis.js',
  '/js/sentinel-analytics.js?v=1.2',
  '/js/profile-report.js',
  '/js/jrj-generator.js',
  '/contour-worker.js',
  '/cad-integration.js',
  '/condo-viewer.js',
  '/export-engine.js',
  '/symbols-library.js',
  '/jrj_engine.js',
  '/jrj_pdf.js',
  '/chatbot_assistant_context.md',
  '/manifest.json',
  '/assets/icons/favicon-32.png?v=3',
  '/assets/icons/favicon-64.png?v=3',
  '/assets/icons/logo.png?v=2',
  '/assets/icons/crosshair-dot.svg',
  '/assets/icons/icon-192x192.png',
  '/assets/icons/icon-512x512.png',
];

const PRECACHE_CDN = [
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
  'https://cdn.jsdelivr.net/npm/ol@7.3.0/dist/ol.js',
  'https://cdn.jsdelivr.net/npm/ol@7.3.0/dist/ol.css',
  'https://cdn.jsdelivr.net/npm/ol-layerswitcher@4.1.0/dist/ol-layerswitcher.js',
  'https://cdn.jsdelivr.net/npm/ol-layerswitcher@4.1.0/dist/ol-layerswitcher.css',
  'https://cdn.jsdelivr.net/npm/@turf/turf@7/turf.min.js',
  'https://cdn.jsdelivr.net/npm/d3-delaunay@6',
  'https://cdn.jsdelivr.net/npm/d3-contour@4',
  'https://cdn.jsdelivr.net/npm/d3-array@3',
  'https://cdn.jsdelivr.net/npm/papaparse@5',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.js',
  'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.6.0/jspdf.plugin.autotable.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',
  'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js',
  'https://cdn.jsdelivr.net/npm/geotiff@2.1.3/dist-browser/geotiff.js',
  'https://cdnjs.cloudflare.com/ajax/libs/proj4js/2.8.0/proj4.js',
  'https://cdnjs.cloudflare.com/ajax/libs/piexifjs/1.0.6/piexif.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/localforage/1.10.0/localforage.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://unpkg.com/mapillary-js@4.1.2/dist/mapillary.js',
  'https://unpkg.com/mapillary-js@4.1.2/dist/mapillary.css',
  'https://unpkg.com/flatgeobuf@4.3.3/dist/flatgeobuf-ol.min.js',
  'https://unpkg.com/@flatgeobuf/flatgeobuf@3.28.2/dist/index.umd.js',
];

const PRECACHE_URLS = [...PRECACHE_LOCAL, ...PRECACHE_CDN];

/* ─── Runtime-match helpers ───────────────────────────────────────────── */
const CDN_HOSTS = [
  'cdnjs.cloudflare.com',
  'cdn.jsdelivr.net',
  'unpkg.com',
  'fonts.googleapis.com',
  'fonts.gstatic.com',
];

const TILE_HOSTS = [
  'tile.openstreetmap',
  'mt1.google.com',
  'basemaps.cartocdn.com',
  'server.arcgisonline.com',
  'tiles.stadiamaps.com',
  'tile.opentopomap.org',
];

const API_HOSTS = [
  'supabase.co',
  'geospatialnetworkug.xyz',
];

/**
 * Test whether a URL string contains any of the given substrings.
 */
function urlContains(url, substrings) {
  return substrings.some((s) => url.includes(s));
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * INSTALL — Precache the App Shell
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_SHELL).then((cache) => {
      // Use addAll for local assets (same-origin, will throw on failure)
      const localPromise = cache.addAll(PRECACHE_LOCAL);

      // For CDN assets, fetch individually so one transient failure doesn't
      // block the entire install.  We use no-cors for cross-origin requests.
      const cdnPromise = Promise.all(
        PRECACHE_CDN.map((url) =>
          fetch(url, { mode: 'cors' })
            .then((response) => {
              if (response.ok || response.type === 'opaque') {
                return cache.put(url, response);
              }
              console.warn(`[SW] Precache skipped (non-ok): ${url}`);
            })
            .catch((err) => {
              console.warn(`[SW] Precache failed: ${url}`, err);
            })
        )
      );

      return Promise.all([localPromise, cdnPromise]);
    })
  );
});

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * ACTIVATE — Claim clients & purge old caches
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name.startsWith('gspnet-') && !EXPECTED_CACHES.includes(name))
          .map((name) => {
            console.log(`[SW] Deleting old cache: ${name}`);
            return caches.delete(name);
          })
      )
    ).then(() => self.clients.claim())
  );
});

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * FETCH — Runtime caching strategies
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = request.url;

  // ── 1. FlatGeobuf files → Cache-First ──────────────────────────────
  if (url.endsWith('.fgb')) {
    event.respondWith(cacheFirst(request, CACHE_FGB));
    return;
  }

  // ── 2. Map tiles → Cache-First ─────────────────────────────────────
  if (urlContains(url, TILE_HOSTS)) {
    event.respondWith(cacheFirst(request, CACHE_TILES));
    return;
  }

  // ── 3. CesiumJS → Network-First (lazy cache) ──────────────────────
  if (url.includes('cesium.com')) {
    event.respondWith(networkFirst(request, CACHE_CESIUM));
    return;
  }

  // ── 4. API data → Network-First ────────────────────────────────────
  if (urlContains(url, API_HOSTS)) {
    event.respondWith(networkFirst(request, CACHE_DATA));
    return;
  }

  // ── 5. CDN resources (not already precached) → Stale-While-Revalidate
  if (urlContains(url, CDN_HOSTS)) {
    event.respondWith(staleWhileRevalidate(request, CACHE_CDN));
    return;
  }

  // ── 6. Navigation requests → Shell fallback ────────────────────────
  if (request.mode === 'navigate') {
    event.respondWith(
      caches.match(request).then((cached) => {
        return cached || fetch(request).catch(() => caches.match('/webmap.html'));
      })
    );
    return;
  }

  // ── 7. Everything else (same-origin app files) → Cache-falling-back-to-network
  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request))
  );
});

/* ─── Caching strategy helpers ────────────────────────────────────────── */

/**
 * Cache-First: serve from cache, fall back to network and cache the response.
 */
function cacheFirst(request, cacheName) {
  return caches.open(cacheName).then((cache) =>
    cache.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response.ok || response.type === 'opaque') {
          cache.put(request, response.clone());
        }
        return response;
      });
    })
  );
}

/**
 * Network-First: try network, cache on success, fall back to cache on failure.
 */
function networkFirst(request, cacheName) {
  return caches.open(cacheName).then((cache) =>
    fetch(request)
      .then((response) => {
        if (response.ok || response.type === 'opaque') {
          cache.put(request, response.clone());
        }
        return response;
      })
      .catch(() => cache.match(request))
  );
}

/**
 * Stale-While-Revalidate: serve cached immediately, update cache in background.
 */
function staleWhileRevalidate(request, cacheName) {
  return caches.open(cacheName).then((cache) =>
    cache.match(request).then((cached) => {
      const fetchPromise = fetch(request)
        .then((response) => {
          if (response.ok || response.type === 'opaque') {
            cache.put(request, response.clone());
          }
          return response;
        })
        .catch(() => cached);

      return cached || fetchPromise;
    })
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * MESSAGE HANDLER — Communication with the app
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
self.addEventListener('message', (event) => {
  const { data } = event;
  if (!data || !data.type) return;

  switch (data.type) {
    /* ── Skip waiting (update prompt) ───────────────────────────────── */
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;

    /* ── Store downloaded tiles in the tile cache ───────────────────── */
    case 'CACHE_TILES':
      event.waitUntil(
        (async () => {
          try {
            const cache = await caches.open(CACHE_TILES);
            const tiles = data.payload && data.payload.tiles;
            if (!Array.isArray(tiles)) return;

            await Promise.all(
              tiles.map(({ url, blob }) => {
                const response = new Response(blob, {
                  headers: { 'Content-Type': blob.type || 'image/png' },
                });
                return cache.put(url, response);
              })
            );
          } catch (err) {
            console.error('[SW] CACHE_TILES error:', err);
          }
        })()
      );
      break;

    /* ── Calculate total cache size ──────────────────────────────────── */
    case 'GET_CACHE_SIZE':
      event.waitUntil(
        (async () => {
          try {
            let totalSize = 0;
            const cacheNames = await caches.keys();

            for (const name of cacheNames) {
              if (!name.startsWith('gspnet-')) continue;
              const cache = await caches.open(name);
              const keys = await cache.keys();

              for (const request of keys) {
                const response = await cache.match(request);
                if (response) {
                  const blob = await response.blob();
                  totalSize += blob.size;
                }
              }
            }

            event.source.postMessage({
              type: 'CACHE_SIZE',
              payload: { totalSize },
            });
          } catch (err) {
            console.error('[SW] GET_CACHE_SIZE error:', err);
            event.source.postMessage({
              type: 'CACHE_SIZE',
              payload: { totalSize: 0, error: err.message },
            });
          }
        })()
      );
      break;

    /* ── Clear the tile cache and recreate it ───────────────────────── */
    case 'CLEAR_TILE_CACHE':
      event.waitUntil(
        caches.delete(CACHE_TILES).then(() => caches.open(CACHE_TILES))
      );
      break;

    default:
      break;
  }
});

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * BACKGROUND SYNC — Retry failed mutations when connectivity returns
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
self.addEventListener('sync', (event) => {
  if (event.tag === 'gspnet-sync-queue') {
    event.waitUntil(processSyncQueue());
  }
});

/**
 * Open the `gspnet-sync-queue` IndexedDB, iterate over all pending items,
 * POST each to its target URL, and remove successfully synced entries.
 */
async function processSyncQueue() {
  const db = await openSyncDB();
  const tx = db.transaction('requests', 'readonly');
  const store = tx.objectStore('requests');
  const allItems = await idbGetAll(store);

  for (const item of allItems) {
    try {
      const response = await fetch(item.url, {
        method: 'POST',
        headers: item.headers || { 'Content-Type': 'application/json' },
        body: item.body,
      });

      if (response.ok) {
        const deleteTx = db.transaction('requests', 'readwrite');
        deleteTx.objectStore('requests').delete(item.id);
        await idbTxComplete(deleteTx);
      }
    } catch (err) {
      console.warn(`[SW] Sync failed for item ${item.id}:`, err);
      // Will retry on next sync event
    }
  }

  db.close();
}

/* ─── IndexedDB helpers (no external deps) ────────────────────────────── */

function openSyncDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('gspnet-sync-queue', 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('requests')) {
        db.createObjectStore('requests', { keyPath: 'id', autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function idbGetAll(store) {
  return new Promise((resolve, reject) => {
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function idbTxComplete(tx) {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * PUSH NOTIFICATIONS — Handle Web Push API
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
self.addEventListener('push', function(event) {
    if (event.data) {
        try {
            const data = event.data.json();
            const title = data.title || 'New Notification';
            const options = {
                body: data.body || 'You have a new message.',
                icon: data.icon || '/assets/icons/icon-192x192.png',
                badge: data.badge || '/assets/icons/favicon-32.png',
                data: data.url || '/' // Where to navigate on click
            };

            event.waitUntil(
                self.registration.showNotification(title, options)
            );
        } catch (e) {
            // Fallback if data is not JSON
            event.waitUntil(
                self.registration.showNotification('New Notification', {
                    body: event.data.text(),
                    icon: '/assets/icons/icon-192x192.png'
                })
            );
        }
    }
});

self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    // Navigate to the app when notification is clicked
    const urlToOpen = new URL(event.notification.data || '/', self.location.origin).href;

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
            // Check if there is already a window/tab open with the target URL
            for (let i = 0; i < windowClients.length; i++) {
                const client = windowClients[i];
                // If so, just focus it.
                if (client.url === urlToOpen && 'focus' in client) {
                    return client.focus();
                }
            }
            // If not, then open the target URL in a new window/tab.
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});
