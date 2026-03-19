let cache = {};
let lastFetch = 0;

function getCache() {
  return cache;
}

function setCache(data) {
  cache = data;
  lastFetch = Date.now();
}

module.exports = { getCache, setCache };