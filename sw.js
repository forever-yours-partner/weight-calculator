/* Service worker: lets the site install like an app and open the page shell offline.
 * Strategy: network first (so updates show immediately), cache as the fallback. */
const CACHE = "wc-shell-v1";
const FILES = [
  "./", "index.html", "app.html", "history.html", "style.css", "theme.js", "i18n.js", "calc.js",
  "pdf.js", "auth.js", "account.js", "app.js", "history.js", "firebase-config.js",
  "firebase-bundle.js", "jspdf.umd.min.js", "jspdf.plugin.autotable.min.js", "login-bg.jpg",
  "manifest.webmanifest", "icon-192.png", "icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => Promise.all(FILES.map((f) => cache.add(f).catch(() => null))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  if (new URL(req.url).origin !== self.location.origin) return; // Firebase etc. go straight to the network
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() =>
        caches.match(req, { ignoreSearch: true }).then((hit) => hit || caches.match("index.html"))
      )
  );
});
