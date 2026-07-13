// Service worker "spegni-tutto": il sito non usa più un service worker,
// ma i browser dei visitatori hanno ancora installato quello vecchio che
// serviva la vecchia app dalla cache. Questo lo sostituisce, svuota le
// cache e si disinstalla.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
      await self.registration.unregister();
      const clients = await self.clients.matchAll({ type: "window" });
      clients.forEach((client) => client.navigate(client.url));
    })()
  );
});
