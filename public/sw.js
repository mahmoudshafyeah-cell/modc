self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  clients.claim();
});

self.addEventListener('fetch', (event) => {
  // تجاهل الطلبات غير GET أو الطلبات لـ Supabase
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.hostname.includes('supabase.co')) {
    return;
  }
  
  event.respondWith(
    fetch(event.request).catch(() => new Response('Offline'))
  );
});