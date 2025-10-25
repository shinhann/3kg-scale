const CACHE_NAME = 'scale-app-v1';
// 我們需要快取的主要檔案 (假設您會將 .html 檔改名為 index.html 或從根目錄 . 存取)
const urlsToCache = [
  '.',
  'index.html',
  'blank_page.html', // 也快取目前的名字
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
];

// 1. 安裝 Service Worker 並快取檔案
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// 2. 攔截網路請求 (實現離線功能)
self.addEventListener('fetch', event => {
  event.respondWith(
    // 策略：Cache First (快取優先)
    caches.match(event.request)
      .then(response => {
        // 如果快取中有，就從快取回傳
        if (response) {
          return response;
        }

        // 如果快取中沒有，就從網路請求
        return fetch(event.request)
          .then(fetchResponse => {
            // 如果請求成功，將其存入快取並回傳
            if (fetchResponse && fetchResponse.status === 200) {
              const responseToCache = fetchResponse.clone();
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, responseToCache);
                });
            }
            return fetchResponse;
          })
          .catch(err => {
            // 網路請求失敗 (離線) 且快取中也沒有
            console.error('Fetch failed; returning offline fallback (if available).', err);
            // 您可以在這裡回傳一個「離線頁面」，但對於單一 App，
            // 由於 . 已被快取，理論上不應該會進到這裡。
          });
      })
  );
});

// 3. 啟用 Service Worker 並清除舊快取
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            // 刪除不是目前版本的舊快取
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
