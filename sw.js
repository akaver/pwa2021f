"use strict";
const CACHE = "cache_0.1.2";
const PREFETCH = [
    './css/materialize.css',
    './css/materialize.min.css',
    './css/style.css',
    './js/init.js',
    './js/materialize.js',
    './js/materialize.min.js',
];
const installFn = async (event) => {
    try {
        const cache = await caches.open(CACHE);
        console.log('Starting prefetch...', cache);
        return await cache.addAll(PREFETCH);
    }
    catch (err) {
        console.error('Error in cache prefetch', err);
        return Promise.reject(err);
    }
};
const activateFn = async (event) => {
    const cacheKeyList = await caches.keys();
    cacheKeyList.map(async (cacheKey) => {
        if (cacheKey != CACHE) {
            console.warn('Deleting from cache: ' + cacheKey);
            await caches.delete(cacheKey);
        }
    });
};
const getCachedResponse = async (request, cache) => {
    const cachedResponse = await cache.match(request);
    console.log('Cache response', cachedResponse);
    if (cachedResponse != undefined)
        return cachedResponse;
    return new Response(undefined, { status: 500, statusText: 'Not found in cache!' });
};
const fetchFn = async (event) => {
    const cache = await caches.open(CACHE);
    console.log('fetchFn', event.request.url);
    if (navigator.onLine) {
        try {
            // get fresh copy from net
            const response = await fetch(event.request);
            // save it to cache
            cache.put(event.request, response.clone());
            // return fresh data
            return response;
        }
        catch (err) {
            console.warn('Fetch failed, trying cache', err);
            const cachedResponse = await getCachedResponse(event.request, cache);
            return cachedResponse;
        }
    }
    else {
        console.warn('navigator.online', navigator.onLine);
        const cachedResponse = await getCachedResponse(event.request, cache);
        return cachedResponse;
    }
};
// ============================== SERWICE WORKER =============================
self.addEventListener('install', ((event) => {
    console.log('SW install ' + CACHE, event);
    // waitUntil parameter is a Promise, not an function that returns a Promise
    event.waitUntil(installFn(event));
    console.log('install done');
}));
self.addEventListener('activate', ((event) => {
    console.log('SW activate ' + CACHE, event);
    // delete all keys/data from cache not currently ours
    event.waitUntil(activateFn(event));
}));
self.addEventListener('fetch', ((event) => {
    console.log('SW fetch ' + CACHE, event);
    event.respondWith(fetchFn(event));
}));
//# sourceMappingURL=sw.js.map