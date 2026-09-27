// AfriFluent: the app moved from this folder to the root of the site. This worker hands the phone over and lets go.
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (event) {
  event.waitUntil((async function () {
    var here = new URL('./', self.location).href;   // …/sema-app/
    var root = new URL('../', self.location).href;  // the site's root
    try { await self.clients.claim(); } catch (e) {}
    var windows = [];
    try { windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true }); } catch (e) {}
    for (var i = 0; i < windows.length; i++) {
      var w = windows[i];
      if (w.url.indexOf(here) !== 0) continue;
      var u = new URL(w.url);
      var to = new URL(root);
      to.search = u.search;
      to.hash = u.hash;
      try { await w.navigate(to.href); } catch (e) { /* not ours to move: its next start forwards it */ }
    }
    try {
      for (var name of ['sema-audio-v1', 'sema-packs-v1', 'sema-fonts-v1']) {
        if (!(await caches.has(name))) continue;
        var cache = await caches.open(name);
        var keys = await cache.keys();
        for (var k = 0; k < keys.length; k++) {
          var req = keys[k];
          if (req.url.indexOf(here) !== 0) continue;
          var moved = root + req.url.slice(here.length);
          if (!(await cache.match(moved))) {
            var res = await cache.match(req);
            if (res) await cache.put(moved, res);
          }
          await cache.delete(req);
        }
      }
      var names = await caches.keys();
      for (var n = 0; n < names.length; n++) if (names[n].indexOf('precache') >= 0 && names[n].slice(-here.length) === here) await caches.delete(names[n]);
    } catch (e) { /* storage busy or full: the new app fetches what it needs */ }
    await self.registration.unregister();
  })());
});
