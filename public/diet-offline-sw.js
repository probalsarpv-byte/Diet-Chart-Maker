/* eslint-disable no-restricted-globals */
/**
 * Precision Nutrition — Dedicated Offline Diet Chart & Recent Logs Service Worker Module
 * Caches the user's active DietPhaseChart, HealthProfile, DailyAdherence logs, and DailyCalorieLogs
 * inside the Service Worker Cache Storage ('precision-diet-offline-cache-v1') so the core nutritional
 * plan and recent logs remain 100% accessible without an internet connection.
 */

const OFFLINE_DATA_CACHE = 'precision-diet-offline-cache-v1';
const APP_SHELL_CACHE = 'precision-app-shell-cache-v1';

const SYNTHETIC_ENDPOINTS = {
  dietChart: '/offline-cache/diet-chart.json',
  recentLogs: '/offline-cache/recent-logs.json',
  healthProfile: '/offline-cache/health-profile.json',
  localHarvestDb: '/offline-cache/local-harvest-db.json',
  snapshotMeta: '/offline-cache/meta.json',
};

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(APP_SHELL_CACHE).then((cache) => {
      return cache.addAll(['/', '/index.html', '/icon.svg']).catch(() => {});
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

/**
 * Listen for messages from the client app to store or clear the latest Diet Chart and Recent Logs
 * inside the Service Worker Cache Storage.
 */
self.addEventListener('message', (event) => {
  const data = event.data;
  if (!data || typeof data !== 'object') return;

  if (data.type === 'SKIP_WAITING') {
    self.skipWaiting();
    return;
  }

  if (data.type === 'CACHE_NUTRITION_DATA' && data.payload) {
    const {
      chart,
      profile,
      adherenceLogs,
      calorieLogs,
      localHarvestSnapshot,
      localHarvestCatalog,
      phase,
      updatedAt,
    } = data.payload;

    event.waitUntil(
      caches.open(OFFLINE_DATA_CACHE).then(async (cache) => {
        const headers = {
          'Content-Type': 'application/json; charset=utf-8',
          'X-Offline-Cached-At': updatedAt || new Date().toISOString(),
        };

        if (chart) {
          await cache.put(
            SYNTHETIC_ENDPOINTS.dietChart,
            new Response(
              JSON.stringify({
                chart,
                phase: phase || chart.phase || 1,
                cachedAt: updatedAt || new Date().toISOString(),
              }),
              { headers }
            )
          );
        }

        if (profile) {
          await cache.put(
            SYNTHETIC_ENDPOINTS.healthProfile,
            new Response(
              JSON.stringify({
                profile,
                cachedAt: updatedAt || new Date().toISOString(),
              }),
              { headers }
            )
          );
        }

        if (adherenceLogs || calorieLogs) {
          await cache.put(
            SYNTHETIC_ENDPOINTS.recentLogs,
            new Response(
              JSON.stringify({
                adherenceLogs: adherenceLogs || [],
                calorieLogs: calorieLogs || [],
                cachedAt: updatedAt || new Date().toISOString(),
              }),
              { headers }
            )
          );
        }

        if (localHarvestSnapshot || localHarvestCatalog) {
          await cache.put(
            SYNTHETIC_ENDPOINTS.localHarvestDb,
            new Response(
              JSON.stringify({
                activeSnapshot: localHarvestSnapshot || null,
                catalogByCountry: localHarvestCatalog || {},
                cachedAt: updatedAt || new Date().toISOString(),
              }),
              { headers }
            )
          );
        }

        await cache.put(
          SYNTHETIC_ENDPOINTS.snapshotMeta,
          new Response(
            JSON.stringify({
              hasDietChart: Boolean(chart),
              phaseName: chart?.phaseName || null,
              adherenceLogsCount: Array.isArray(adherenceLogs) ? adherenceLogs.length : 0,
              calorieLogsCount: Array.isArray(calorieLogs) ? calorieLogs.length : 0,
              hasLocalHarvestDb: Boolean(localHarvestSnapshot || localHarvestCatalog),
              cachedHarvestCountry: localHarvestSnapshot?.countryCode || null,
              cachedHarvestVegCount: Array.isArray(localHarvestSnapshot?.prioritizedVegetables)
                ? localHarvestSnapshot.prioritizedVegetables.length
                : 0,
              cachedAt: updatedAt || new Date().toISOString(),
            }),
            { headers }
          )
        );

        // Notify open clients that the Service Worker cache was updated
        const allClients = await self.clients.matchAll({ includeUncontrolled: true });
        for (const client of allClients) {
          client.postMessage({
            type: 'NUTRITION_DATA_CACHED',
            cachedAt: updatedAt || new Date().toISOString(),
          });
        }
      })
    );
  }

  if (data.type === 'CACHE_LOCAL_HARVEST_DB' && data.payload) {
    const { activeSnapshot, catalogByCountry, updatedAt } = data.payload;
    event.waitUntil(
      caches.open(OFFLINE_DATA_CACHE).then(async (cache) => {
        const headers = {
          'Content-Type': 'application/json; charset=utf-8',
          'X-Offline-Cached-At': updatedAt || new Date().toISOString(),
        };
        await cache.put(
          SYNTHETIC_ENDPOINTS.localHarvestDb,
          new Response(
            JSON.stringify({
              activeSnapshot: activeSnapshot || null,
              catalogByCountry: catalogByCountry || {},
              cachedAt: updatedAt || new Date().toISOString(),
            }),
            { headers }
          )
        );
      })
    );
  }
});

/**
 * Intercept fetch requests for synthetic `/offline-cache/*` endpoints and provide
 * network-first with cache-fallback for API & navigation requests when offline.
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // 1. Direct synthetic offline cache endpoints (/offline-cache/*)
  if (url.pathname.startsWith('/offline-cache/')) {
    event.respondWith(
      caches.open(OFFLINE_DATA_CACHE).then(async (cache) => {
        const matched = await cache.match(url.pathname);
        if (matched) return matched;
        return new Response(JSON.stringify({ cached: false }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      })
    );
    return;
  }

  // 2. API GET requests (/api/sql/catalog/*, /api/health, etc.): Network-First with Service Worker Cache Fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const cloned = networkResponse.clone();
            caches.open(OFFLINE_DATA_CACHE).then((cache) => {
              cache.put(request, cloned).catch(() => {});
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          return new Response(
            JSON.stringify({ ok: true, offline: true, items: [] }),
            {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        })
    );
    return;
  }

  // 3. SPA Navigation fallback when offline
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(APP_SHELL_CACHE).then((cache) => cache.put('/', copy).catch(() => {}));
          return response;
        })
        .catch(async () => {
          const cachedRoot =
            (await caches.match('/')) || (await caches.match('/index.html'));
          return cachedRoot || Response.error();
        })
    );
  }
});
