/* Raavi Volt service worker.
 * - Hashed app files, fonts, icons: cache-first (they never change).
 * - Product images (/media/products/<uuid>): cache-first, capped.
 * - Pages: network-first; last copy is used only when offline / very slow.
 * - Admin, API, checkout, order pages, POSTs and RSC requests: never touched.
 * Any failure falls straight through to the network, so the SW can't break the site.
 */
const VERSION = "rv-v1";
const STATIC = `${VERSION}-static`;
const MEDIA = `${VERSION}-media`;
const PAGES = `${VERSION}-pages`;
const OFFLINE_URL = "/offline"; // public/offline.html, served at its clean URL
const PRECACHE = [OFFLINE_URL, "/icons/icon-192.png", "/icon.svg"];
const LIMITS = { [STATIC]: 300, [MEDIA]: 150, [PAGES]: 40 };
const PRIVATE = /^\/(admin|api|checkout|order)(\/|$)/;
const SLOW_NETWORK_MS = 4000;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC)
      .then((cache) => cache.addAll(PRECACHE))
      .catch(() => undefined)
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => !k.startsWith(`${VERSION}-`)).map((k) => caches.delete(k)));
      if (self.registration.navigationPreload) await self.registration.navigationPreload.enable().catch(() => undefined);
      await self.clients.claim();
    })(),
  );
});

async function trim(cacheName) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  const extra = keys.length - (LIMITS[cacheName] ?? 100);
  for (let i = 0; i < extra; i++) await cache.delete(keys[i]);
}

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request, { cacheName });
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok && response.type === "basic") {
    const copy = response.clone();
    caches
      .open(cacheName)
      .then((cache) => cache.put(request, copy))
      .then(() => trim(cacheName))
      .catch(() => undefined);
  }
  return response;
}

async function networkFirstPage(event) {
  const { request } = event;
  const cache = await caches.open(PAGES);
  const cached = await cache.match(request, { ignoreSearch: false });

  const network = (async () => {
    const preloaded = await event.preloadResponse;
    const response = preloaded || (await fetch(request));
    if (response.ok && response.type === "basic") {
      cache
        .put(request, response.clone())
        .then(() => trim(PAGES))
        .catch(() => undefined);
    }
    return response;
  })();

  try {
    if (!cached) return await network;
    // With a saved copy, don't keep a shopper waiting on a very slow connection.
    const timeout = new Promise((resolve) => setTimeout(() => resolve(null), SLOW_NETWORK_MS));
    const winner = await Promise.race([network, timeout]);
    if (winner) return winner;
    event.waitUntil(network.catch(() => undefined));
    return cached;
  } catch {
    return cached || (await caches.match(OFFLINE_URL)) || Response.error();
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }
  if (url.origin !== self.location.origin) return;
  if (PRIVATE.test(url.pathname)) return;
  if (url.searchParams.has("_rsc") || request.headers.get("RSC")) return;
  if (url.pathname === "/sw.js") return;

  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/") || url.pathname === "/icon.svg") {
    event.respondWith(cacheFirst(request, STATIC).catch(() => fetch(request)));
    return;
  }
  if (url.pathname.startsWith("/media/products/")) {
    event.respondWith(cacheFirst(request, MEDIA).catch(() => fetch(request)));
    return;
  }
  if (request.mode === "navigate") {
    event.respondWith(networkFirstPage(event).catch(() => fetch(request)));
  }
});
