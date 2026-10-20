import { getAccessToken } from './firebase';

const DB_NAME = 'PropInvest_ImageCache_DB';
const STORE_NAME = 'image_blobs';
const DB_VERSION = 1;

// In-memory cache of object URLs to avoid redundant requests
const memoryObjectUrlCache = new Map<string, string>();

/**
 * Open or create IndexedDB for permanent client-side image caching
 */
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported'));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

/**
 * Save an image Blob or Base64 into IndexedDB
 */
export const saveImageToLocalCache = async (key: string, data: Blob | string): Promise<void> => {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(data, key);
  } catch (err) {
    console.warn('Failed to cache image in IndexedDB:', err);
  }
};

/**
 * Get an image from IndexedDB
 */
export const getImageFromLocalCache = async (key: string): Promise<Blob | string | null> => {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
};

/**
 * Extract Google Drive fileId from any URL format or formula
 */
export const extractDriveFileId = (url?: string | null): string | null => {
  if (!url) return null;

  // Extract from =HYPERLINK("...", ...) or =IMAGE("...") if wrapped
  let cleanUrl = url.trim();
  const linkMatch = cleanUrl.match(/=(?:HYPERLINK|IMAGE)\(\s*["']([^"']+)["']/i);
  if (linkMatch && linkMatch[1]) {
    cleanUrl = linkMatch[1];
  }

  // Common Google Drive URL patterns (drive.google.com/file/d/ID, lh3.googleusercontent.com/d/ID, etc.)
  const match = cleanUrl.match(/(?:\/file\/d\/|\/d\/|[?&](?:id|fileId)=)([a-zA-Z0-9_-]{15,})/);
  if (match) return match[1];

  // If the cell contains only a raw Drive file ID (25-45 characters alphanumeric)
  if (/^[a-zA-Z0-9_-]{25,45}$/.test(cleanUrl)) {
    return cleanUrl;
  }

  return null;
};

export const setMemoryImageCache = (fileId: string, urlOrBlob: string | Blob): void => {
  if (typeof urlOrBlob === 'string') {
    memoryObjectUrlCache.set(fileId, urlOrBlob);
  } else {
    memoryObjectUrlCache.set(fileId, URL.createObjectURL(urlOrBlob));
  }
};

/**
 * Update both local IndexedDB and memory cache for a property and its Drive file
 * Ensures newly uploaded images show instantly without showing stale old images
 */
export const updatePropertyImageCache = async (
  propertyId: string | null | undefined,
  data: Blob | string,
  fileId?: string | null
): Promise<void> => {
  if (propertyId) {
    await saveImageToLocalCache(`prop_${propertyId}`, data);
  }
  if (fileId) {
    setMemoryImageCache(fileId, data);
    await saveImageToLocalCache(`drive_${fileId}`, data);
  }
};

/**
 * Invalidate cached image for a property or Drive file
 */
export const invalidateImageCache = (key: string): void => {
  memoryObjectUrlCache.delete(key);
};

/**
 * Load displayable image source URL for any property image
 * Supports: Google Drive files (via Drive API + caching), IndexedDB, Base64, and standard URLs
 */
export const loadDisplayImageSrc = async (
  imageUrl?: string | null,
  propertyId?: string | null
): Promise<string> => {
  // 1. If imageUrl is empty, check fallback for primary property image
  if (!imageUrl || imageUrl.trim() === '') {
    if (propertyId) {
      const cachedByProp = await getImageFromLocalCache(`prop_${propertyId}`);
      if (cachedByProp) {
        if (typeof cachedByProp === 'string') return cachedByProp;
        if (cachedByProp instanceof Blob) {
          return URL.createObjectURL(cachedByProp);
        }
      }
    }
    return '';
  }

  // Clean if formula (e.g., =HYPERLINK("...", ...) or =IMAGE("..."))
  let cleanUrl = imageUrl.trim();
  const linkMatch = cleanUrl.match(/=(?:HYPERLINK|IMAGE)\(\s*["']([^"']+)["']/i);
  if (linkMatch && linkMatch[1]) {
    cleanUrl = linkMatch[1];
  }

  // 2. If it's a blob: or object URL
  if (cleanUrl.startsWith('blob:')) {
    return cleanUrl;
  }

  // 3. If it's a valid Base64 image
  if (cleanUrl.startsWith('data:image')) {
    if (cleanUrl.length > 100) {
      return cleanUrl;
    }
    return '';
  }

  // 4. Check if it's a Google Drive URL or raw File ID
  const fileId = extractDriveFileId(cleanUrl);
  if (fileId) {
    // Check in-memory cache first (instantaneous)
    if (memoryObjectUrlCache.has(fileId)) {
      return memoryObjectUrlCache.get(fileId)!;
    }

    // Check IndexedDB cache for this specific fileId
    const cachedData = await getImageFromLocalCache(`drive_${fileId}`);
    if (cachedData) {
      if (typeof cachedData === 'string') {
        memoryObjectUrlCache.set(fileId, cachedData);
        return cachedData;
      } else if (cachedData instanceof Blob) {
        const objectUrl = URL.createObjectURL(cachedData);
        memoryObjectUrlCache.set(fileId, objectUrl);
        return objectUrl;
      }
    }

    // Fetch directly from Google Drive API using user's access token
    const token = getAccessToken();
    if (token) {
      try {
        const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const blob = await res.blob();
          const objectUrl = URL.createObjectURL(blob);
          memoryObjectUrlCache.set(fileId, objectUrl);
          saveImageToLocalCache(`drive_${fileId}`, blob);
          return objectUrl;
        }
      } catch (fetchErr) {
        console.warn('Drive API direct image fetch note:', fetchErr);
      }
    }

    // Reliable same-origin proxy endpoint with token for authenticated proxy
    const tokenQuery = token ? `&token=${encodeURIComponent(token)}` : '';
    return `/api/drive-image?fileId=${fileId}${tokenQuery}`;
  }

  // 5. Regular HTTP/HTTPS URL
  if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
    return cleanUrl;
  }

  // 6. Last resort fallback to property cache
  if (propertyId) {
    const cachedByProp = await getImageFromLocalCache(`prop_${propertyId}`);
    if (cachedByProp) {
      if (typeof cachedByProp === 'string') return cachedByProp;
      if (cachedByProp instanceof Blob) {
        return URL.createObjectURL(cachedByProp);
      }
    }
  }

  return '';
};
