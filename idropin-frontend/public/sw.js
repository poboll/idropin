const CACHE_VERSION = 'v2';
const CACHE_NAME = `idropin-${CACHE_VERSION}`;

// 安装事件 - 立即激活
self.addEventListener('install', () => {
  self.skipWaiting();
});

// 激活事件 - 清理所有旧缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 获取事件 - 全部网络优先
self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => {
        return caches.match(request).then((cached) => {
          return cached || new Response('Offline', { status: 503 });
        });
      })
  );
});

// 后台同步 - 同步离线上传
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-uploads') {
    event.waitUntil(syncPendingUploads());
  }
});

async function syncPendingUploads() {
  try {
    const db = await openIndexedDB();
    const pendingUploads = await getPendingUploads(db);

    for (const upload of pendingUploads) {
      try {
        const formData = new FormData();
        formData.append('file', upload.file);

        const response = await fetch('/api/files/upload', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          await removePendingUpload(db, upload.id);
          // 通知客户端上传成功
          self.clients.matchAll().then((clients) => {
            clients.forEach((client) => {
              client.postMessage({
                type: 'UPLOAD_SUCCESS',
                uploadId: upload.id,
              });
            });
          });
        }
      } catch (error) {
        console.error('Failed to sync upload:', error);
      }
    }
  } catch (error) {
    console.error('Sync failed:', error);
  }
}

function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('idropin-offline', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('pending-uploads')) {
        db.createObjectStore('pending-uploads', { keyPath: 'id' });
      }
    };
  });
}

function getPendingUploads(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pending-uploads'], 'readonly');
    const store = transaction.objectStore('pending-uploads');
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function removePendingUpload(db, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pending-uploads'], 'readwrite');
    const store = transaction.objectStore('pending-uploads');
    const request = store.delete(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

// 推送通知
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  const title = data.title || 'Idrop.in';
  const options = {
    body: data.body || '您有新的通知',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: data.tag || 'notification',
    requireInteraction: data.requireInteraction || false,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// 通知点击事件
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
