// Service worker «Школьного забега»: игра открывается и без сети.
// Свои файлы — сначала из сети (чтобы обновления приходили сразу), без сети — из кэша.
const CACHE = 'shkola-v1'; // новое имя — старый кэш удалится при обновлении
const SHELL = ['./', './index.html', './content.js', './content2.js', './content3.js', './content4.js', './formulas.js', './data.js', './audio.js', './state.js', './figures.js', './world.js', './ui.js', './lesson.js', './runner.js', './game.js', './manifest.webmanifest', './icons/icon-180.png', './icons/icon-192.png', './icons/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(SHELL.map(u => c.add(u).catch(() => { })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
function fromNetwork(req) {
  return new Promise((res, rej) => {
    const t = setTimeout(() => rej(new Error('timeout')), 6000);
    fetch(req, { cache: 'no-cache' }).then(r => { clearTimeout(t); res(r); }, err => { clearTimeout(t); rej(err); });
  });
}
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // шрифты Google грузятся как есть
  e.respondWith(fromNetwork(req).then(r => {
    if (r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return r;
  }).catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || (req.mode === 'navigate' ? caches.match('./index.html') : Response.error()))));
});
