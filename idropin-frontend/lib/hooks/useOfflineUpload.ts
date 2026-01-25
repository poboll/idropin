'use client'

import { useCallback, useState } from 'react';

export interface OfflineUpload {
  id: string;
  file: File;
  timestamp: number;
  status: 'pending' | 'uploading' | 'success' | 'failed';
  error?: string;
}

export function useOfflineUpload() {
  const [uploads, setUploads] = useState<OfflineUpload[]>([]);

  const addOfflineUpload = useCallback(async (file: File) => {
    const id = `${Date.now()}-${Math.random()}`;
    const upload: OfflineUpload = {
      id,
      file,
      timestamp: Date.now(),
      status: 'pending',
    };

    try {
      const db = await openIndexedDB();
      await saveUpload(db, upload);
      setUploads((prev) => [...prev, upload]);
      return id;
    } catch (error) {
      console.error('Failed to save offline upload:', error);
      throw error;
    }
  }, []);

  const getOfflineUploads = useCallback(async () => {
    try {
      const db = await openIndexedDB();
      const uploads = await getAllUploads(db);
      setUploads(uploads);
      return uploads;
    } catch (error) {
      console.error('Failed to get offline uploads:', error);
      return [];
    }
  }, []);

  const removeOfflineUpload = useCallback(async (id: string) => {
    try {
      const db = await openIndexedDB();
      await deleteUpload(db, id);
      setUploads((prev) => prev.filter((u) => u.id !== id));
    } catch (error) {
      console.error('Failed to remove offline upload:', error);
    }
  }, []);

  const updateUploadStatus = useCallback(
    async (id: string, status: OfflineUpload['status'], error?: string) => {
      setUploads((prev) =>
        prev.map((u) =>
          u.id === id ? { ...u, status, error } : u
        )
      );

      try {
        const db = await openIndexedDB();
        const upload = uploads.find((u) => u.id === id);
        if (upload) {
          await saveUpload(db, { ...upload, status, error });
        }
      } catch (err) {
        console.error('Failed to update upload status:', err);
      }
    },
    [uploads]
  );

  return {
    uploads,
    addOfflineUpload,
    getOfflineUploads,
    removeOfflineUpload,
    updateUploadStatus,
  };
}

function openIndexedDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('idropin-offline', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('pending-uploads')) {
        db.createObjectStore('pending-uploads', { keyPath: 'id' });
      }
    };
  });
}

function saveUpload(db: IDBDatabase, upload: OfflineUpload): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pending-uploads'], 'readwrite');
    const store = transaction.objectStore('pending-uploads');
    const request = store.put(upload);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

function getAllUploads(db: IDBDatabase): Promise<OfflineUpload[]> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pending-uploads'], 'readonly');
    const store = transaction.objectStore('pending-uploads');
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function deleteUpload(db: IDBDatabase, id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pending-uploads'], 'readwrite');
    const store = transaction.objectStore('pending-uploads');
    const request = store.delete(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}
