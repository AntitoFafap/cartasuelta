// Cache compartido para inventario
let inventoryCache = null;
let cacheTime = null;
const CACHE_DURATION = 30000; // 30 segundos

export function getCache() {
  const now = Date.now();
  if (inventoryCache && cacheTime && (now - cacheTime) < CACHE_DURATION) {
    return inventoryCache;
  }
  return null;
}

export function setCache(data) {
  inventoryCache = data;
  cacheTime = Date.now();
}

export function invalidateCache() {
  inventoryCache = null;
  cacheTime = null;
}
