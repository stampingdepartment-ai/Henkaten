/* Service worker HENKATEN Plant-2
   Tugasnya hanya menyimpan "kulit" aplikasi (halaman pembuka, ikon, manifest) supaya aplikasi bisa
   dipasang ke layar utama dan tetap menampilkan layar tunggu / pesan offline saat tidak ada internet.
   Data Henkaten sendiri selalu diambil langsung dari Google Apps Script, tidak pernah disimpan di sini.
   Naikkan angka versi di bawah setiap kali index.html, ikon, atau manifest diubah. */
const CACHE = 'henkaten-pwa-v2';
const SHELL = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  const req = e.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== self.location.origin) return; // Apps Script & Google: langsung ke jaringan
  // Utamakan jaringan supaya perubahan di GitHub langsung terpakai; bila offline, pakai salinan tersimpan
  e.respondWith(
    fetch(req).then(function (res) {
      if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(req, copy); }); }
      return res;
    }).catch(function () {
      return caches.match(req).then(function (hit) { return hit || caches.match('./index.html'); });
    })
  );
});

