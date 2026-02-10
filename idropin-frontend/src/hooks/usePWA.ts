import { useState, useEffect, useCallback } from 'react';

interface OfflineUpload {
  id: string;
  file: File;
  formData: FormData;
  token: string;
  timestamp: number;
}

interface PWAState {
  isOnline: boolean;
  isPWAInstalled: boolean;
  hasUpdate: boolean;
  offlineUploads: OfflineUpload[];
}

export function usePWA() {
  const [state, setState] = useState<PWAState>({
    isOnline: true,
    isPWAInstalled: false,
    hasUpdate: false,
    offlineUploads: [],
  });

  // 检查在线状态
  useEffect(() => {
    const handleOnline = () => {
      console.log('[PWA] Online');
      setState(prev => ({ ...prev, isOnline: true }));
      // 同步离线上传
      syncOfflineUploads();
    };

    const handleOffline = () => {
      console.log('[PWA] Offline');
      setState(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 注册Service Worker
  useEffect(() => {
    // Dev mode: don't register SW. It can cache old chunks and cause hydration mismatch / stale UI.
    if (process.env.NODE_ENV !== 'production') {
      return;
    }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[PWA] Service Worker registered:', registration);
          setState(prev => ({ ...prev, isPWAInstalled: true }));

          // 检查更新
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('[PWA] New content available');
                  setState(prev => ({ ...prev, hasUpdate: true }));
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error('[PWA] Service Worker registration failed:', error);
        });

      // 监听Service Worker消息
      navigator.serviceWorker.addEventListener('message', (event) => {
        console.log('[PWA] Message from SW:', event.data);

        if (event.data.type === 'UPLOAD_SYNCED') {
          // 移除已同步的上传
          setState(prev => ({
            ...prev,
            offlineUploads: prev.offlineUploads.filter(
              upload => upload.id !== event.data.id
            ),
          }));
        }
      });
    }
  }, []);

  // 加载离线上传队列
  useEffect(() => {
    const loadOfflineUploads = () => {
      try {
        const uploads = localStorage.getItem('offlineUploads');
        if (uploads) {
          setState(prev => ({
            ...prev,
            offlineUploads: JSON.parse(uploads),
          }));
        }
      } catch (error) {
        console.error('[PWA] Failed to load offline uploads:', error);
      }
    };

    loadOfflineUploads();
  }, []);

  // 添加离线上传
  const addOfflineUpload = useCallback((file: File, token: string) => {
    const upload: OfflineUpload = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file,
      formData: new FormData(),
      token,
      timestamp: Date.now(),
    };

    upload.formData.append('file', file);

    setState(prev => {
      const newUploads = [...prev.offlineUploads, upload];
      try {
        localStorage.setItem('offlineUploads', JSON.stringify(newUploads));
      } catch (error) {
        console.error('[PWA] Failed to save offline uploads:', error);
      }
      return { ...prev, offlineUploads: newUploads };
    });

    return upload.id;
  }, []);

  // 同步离线上传
  const syncOfflineUploads = useCallback(async () => {
    if (state.offlineUploads.length === 0) {
      return;
    }

    console.log('[PWA] Syncing offline uploads...');

    for (const upload of state.offlineUploads) {
      try {
        const response = await fetch('/api/files/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${upload.token}`,
          },
          body: upload.formData,
        });

        if (response.ok) {
          console.log('[PWA] Upload synced:', upload.id);

          // 通知Service Worker
          if (navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
              type: 'UPLOAD_SYNCED',
              data: { id: upload.id },
            });
          }

          // 从队列中移除
          setState(prev => ({
            ...prev,
            offlineUploads: prev.offlineUploads.filter(u => u.id !== upload.id),
          }));
        }
      } catch (error) {
        console.error('[PWA] Upload sync failed:', upload.id, error);
      }
    }

    // 更新localStorage
    try {
      localStorage.setItem(
        'offlineUploads',
        JSON.stringify(state.offlineUploads)
      );
    } catch (error) {
      console.error('[PWA] Failed to save offline uploads:', error);
    }
  }, [state.offlineUploads]);

  // 清除离线上传
  const clearOfflineUploads = useCallback(() => {
    setState(prev => ({ ...prev, offlineUploads: [] }));
    try {
      localStorage.removeItem('offlineUploads');
    } catch (error) {
      console.error('[PWA] Failed to clear offline uploads:', error);
    }
  }, []);

  // 应用更新
  const updateApp = useCallback(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
        window.location.reload();
      });
    }
  }, []);

  // 清除缓存
  const clearCache = useCallback(() => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_CACHE' });
      window.location.reload();
    }
  }, []);

  return {
    ...state,
    addOfflineUpload,
    syncOfflineUploads,
    clearOfflineUploads,
    updateApp,
    clearCache,
  };
}
