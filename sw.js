const CACHE = "elvis-livro-v17";
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png"];
const LIBS = [
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js"
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE).then(c =>
      c.addAll(SHELL).then(() => Promise.allSettled(LIBS.map(u => c.add(u))))
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  // pages: take the newest version when online, the saved copy when offline
  if (e.request.mode === "navigate") {
    e.respondWith(
      fetch(e.request).then(res => {
        if (res && res.ok) caches.open(CACHE).then(c => c.put("./index.html", res.clone()));
        return res;
      }).catch(() => caches.match("./index.html", { ignoreSearch: true }))
    );
    return;
  }
  // everything else: saved copy first, refreshed in the background
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(hit => {
      const net = fetch(e.request).then(res => {
        if (res && res.ok) caches.open(CACHE).then(c => c.put(e.request, res.clone()));
        return res;
      }).catch(() => hit);
      return hit || net;
    })
  );
});
