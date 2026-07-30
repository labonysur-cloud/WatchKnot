export interface DownloadMetadata {
  id: string;
  title: string;
  posterUrl?: string;
  videoUrl: string;
  type: "MOVIE" | "EPISODE";
  season?: number;
  episodeNumber?: number;
  downloadedAt: number;
  sizeBytes?: number;
}

const STORAGE_KEY = "watchknot_downloads";

// --- IndexedDB for Crypto Keys ---
const DB_NAME = "watchknot-offline-db";
const STORE_NAME = "keys";

function openCryptoDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "videoUrl" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveKey(videoUrl: string, key: CryptoKey, iv: Uint8Array, mimeType: string) {
  const db = await openCryptoDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.put({ videoUrl, key, iv, mimeType });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function removeKey(videoUrl: string) {
  const db = await openCryptoDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.delete(videoUrl);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
// ----------------------------------

export const getDownloadedMedia = (): DownloadMetadata[] => {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

export const saveDownloadMetadata = (metadata: DownloadMetadata) => {
  const current = getDownloadedMedia();
  const updated = current.filter(m => m.videoUrl !== metadata.videoUrl);
  updated.push(metadata);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
};

export const removeDownloadMetadata = (videoUrl: string) => {
  const current = getDownloadedMedia();
  const updated = current.filter(m => m.videoUrl !== videoUrl);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
};

export const isDownloaded = (videoUrl: string): boolean => {
  const current = getDownloadedMedia();
  return current.some(m => m.videoUrl === videoUrl);
};

export const downloadMedia = async (
  metadata: Omit<DownloadMetadata, "downloadedAt">, 
  onProgress?: (pct: number) => void
) => {
  if (!window.caches) throw new Error("Cache API not supported");

  const cache = await caches.open("watchknot-media-v1");
  
  // Fetch with no-store to ensure we download the fresh blob
  const response = await fetch(metadata.videoUrl, { cache: "no-store" });
  if (!response.ok) throw new Error(`Failed to download: ${response.statusText}`);

  const contentLength = response.headers.get("content-length");
  const total = contentLength ? parseInt(contentLength, 10) : 0;
  let loaded = 0;

  // We read the stream to report progress
  const reader = response.body?.getReader();
  if (!reader) throw new Error("Response body is not readable");

  const chunks: Uint8Array[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    if (value) {
      chunks.push(value);
      loaded += value.length;
      if (total && onProgress) {
        onProgress(Math.round((loaded / total) * 100));
      }
    }
  }

  const mimeType = response.headers.get("content-type") || "video/mp4";
  const blob = new Blob(chunks as BlobPart[], { type: mimeType });
  const arrayBuffer = await blob.arrayBuffer();

  // Generate AES-CTR Key and IV
  const iv = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.generateKey(
    { name: "AES-CTR", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );

  // Encrypt the entire video buffer
  // Note: For extremely large videos (e.g. >2GB), processing the whole buffer at once might hit memory limits,
  // but for typical web videos and episodes this works perfectly.
  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: "AES-CTR", counter: iv, length: 64 },
    key,
    arrayBuffer
  );

  // Save the key and IV securely to IndexedDB so the Service Worker can access it
  await saveKey(metadata.videoUrl, key, iv, mimeType);

  const encryptedBlob = new Blob([encryptedBuffer], { type: "application/octet-stream" });
  const cacheResponse = new Response(encryptedBlob, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Length": encryptedBlob.size.toString(),
    }
  });

  // Store encrypted blob in Cache API
  await cache.put(metadata.videoUrl, cacheResponse);

  // Save Metadata
  saveDownloadMetadata({
    ...metadata,
    downloadedAt: Date.now(),
    sizeBytes: encryptedBlob.size
  });
};

export const removeDownloadedMedia = async (videoUrl: string) => {
  if (window.caches) {
    const cache = await caches.open("watchknot-media-v1");
    await cache.delete(videoUrl);
  }
  await removeKey(videoUrl);
  removeDownloadMetadata(videoUrl);
};
