const CACHE_NAME = 'watchknot-media-v1';
const DYNAMIC_CACHE = 'watchknot-dynamic-v1';
const STATIC_CACHE = 'watchknot-static-v1';

const PRECACHE_URLS = [
  '/',
  '/downloads',
  '/icon.svg',
  '/file.svg',
  '/globe.svg',
  '/window.svg'
];

// --- IndexedDB for Crypto Keys ---
const DB_NAME = "watchknot-offline-db";
const STORE_NAME = "keys";

function openCryptoDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "videoUrl" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getKey(videoUrl) {
  try {
    const db = await openCryptoDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(videoUrl);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    return null;
  }
}
// ----------------------------------

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_URLS.map(url => new Request(url, { cache: 'reload' })));
    }).then(() => self.skipWaiting()).catch(err => {
      console.error("Precaching failed:", err);
      self.skipWaiting();
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith('http')) return;
  if (url.pathname.startsWith('/api/')) return;

  const isNavigation = event.request.mode === 'navigate';

  if (isNavigation) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          return caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        })
        .catch(() => {
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;
            if (url.pathname === '/downloads' || url.pathname.startsWith('/downloads')) {
               return caches.match('/downloads');
            }
            return caches.match('/');
          });
        })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(async (cachedResponse) => {
      if (cachedResponse) {
        const rangeHeader = event.request.headers.get('range');
        if (rangeHeader) {
          try {
            const keyData = await getKey(event.request.url);
            if (keyData) {
              // Encrypted offline video!
              const encryptedBuffer = await cachedResponse.arrayBuffer();
              const parts = rangeHeader.replace(/bytes=/, "").split("-");
              const start = parseInt(parts[0], 10);
              const end = parts[1] ? parseInt(parts[1], 10) : encryptedBuffer.byteLength - 1;
              
              const blockSize = 16;
              const startBlock = Math.floor(start / blockSize);
              const endBlock = Math.floor(end / blockSize);
              
              const blockAlignedStart = startBlock * blockSize;
              const blockAlignedEnd = Math.min((endBlock + 1) * blockSize - 1, encryptedBuffer.byteLength - 1);
              
              const encryptedSlice = encryptedBuffer.slice(blockAlignedStart, blockAlignedEnd + 1);
              
              const iv = new Uint8Array(keyData.iv);
              const counterView = new DataView(iv.buffer);
              const currentCounter = counterView.getBigUint64(8, false);
              counterView.setBigUint64(8, currentCounter + BigInt(startBlock), false);
              
              const decryptedBuffer = await crypto.subtle.decrypt(
                { name: "AES-CTR", counter: iv, length: 64 },
                keyData.key,
                encryptedSlice
              );
              
              const byteOffset = start - blockAlignedStart;
              const byteLength = end - start + 1;
              const exactDecryptedSlice = decryptedBuffer.slice(byteOffset, byteOffset + byteLength);
              
              return new Response(exactDecryptedSlice, {
                status: 206,
                statusText: 'Partial Content',
                headers: {
                  'Content-Range': `bytes ${start}-${end}/${encryptedBuffer.byteLength}`,
                  'Accept-Ranges': 'bytes',
                  'Content-Length': exactDecryptedSlice.byteLength.toString(),
                  'Content-Type': keyData.mimeType || 'video/mp4',
                }
              });
            } else {
              // Fallback to unencrypted blob logic
              const blob = await cachedResponse.blob();
              const parts = rangeHeader.replace(/bytes=/, "").split("-");
              const start = parseInt(parts[0], 10);
              const end = parts[1] ? parseInt(parts[1], 10) : blob.size - 1;
              const chunksize = (end - start) + 1;
              const slicedBlob = blob.slice(start, end + 1, blob.type);
              
              return new Response(slicedBlob, {
                status: 206,
                statusText: 'Partial Content',
                headers: {
                  'Content-Range': `bytes ${start}-${end}/${blob.size}`,
                  'Accept-Ranges': 'bytes',
                  'Content-Length': chunksize.toString(),
                  'Content-Type': blob.type || 'video/mp4',
                }
              });
            }
          } catch (err) {
             console.error("Decryption or range request failed:", err);
             // Return 500 error response so video player doesn't hang
             return new Response("Decryption failed", { status: 500 });
          }
        }
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        if (networkResponse.ok && networkResponse.type === 'basic') {
          const responseClone = networkResponse.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      }).catch((err) => {
        console.error('Offline fetch failed:', err);
      });
    })
  );
});
