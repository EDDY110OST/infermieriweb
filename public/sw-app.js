// InfermieriWeb — service worker: riceve le push e mostra la notifica. v1
// Porta il modello collaudato di Prenotazioni Sbarba (v6), incluso il salvataggio
// della destinazione in Cache Storage: iOS uccide il service worker e riapre
// l'app sull'ultima pagina rimasta, quindi la pagina deve poter ritrovare da
// sola la destinazione del tocco appena torna visibile.
// NOTA: nessun handler fetch — questo SW non fa cache delle pagine (zero rischio
// di contenuti vecchi), serve solo per le notifiche.

var GOTO_KEY = '/iw-goto';

function stashGoto(url) {
  return caches.open('iw-goto').then(function (c) {
    return c.put(GOTO_KEY, new Response(Date.now() + '|' + url));
  }).catch(function () {});
}

self.addEventListener('install', function () {
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', function (event) {
  var data = { title: 'InfermieriWeb', body: '' };
  try { data = event.data.json(); } catch (e) { data.body = event.data ? event.data.text() : ''; }
  event.waitUntil(
    self.registration.showNotification(data.title || 'InfermieriWeb', {
      body: data.body || '',
      icon: '/logo-512.png',
      badge: '/logo-512.png',
      tag: data.tag || undefined,
      data: { url: data.url || '/area-professionisti' },
      vibrate: [200, 100, 200],
    })
  );
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  var url = (event.notification.data && event.notification.data.url) || '/area-professionisti';
  event.waitUntil(
    stashGoto(url).then(function () {
      return self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
        for (var i = 0; i < list.length; i++) {
          if ('focus' in list[i]) {
            list[i].navigate(url);
            return list[i].focus();
          }
        }
        return self.clients.openWindow(url);
      });
    })
  );
});
