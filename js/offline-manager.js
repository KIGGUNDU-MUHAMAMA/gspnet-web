/**
 * GSP.NET Offline Manager
 * Manages the PWA offline features, UI, tile downloading, and sync queue.
 */

window.OfflineManager = {
    init: function() {
        this.bindUI();
        this.updateConnectionStatus();
        this.updateStorageMeter();
        this.updateSyncCount();
        this.loadCachedRegionsList();
        this.setupNetworkListeners();
        this.checkServiceWorkerUpdate();
        
        // Auto-patch the active basemap if offline
        setTimeout(() => {
            if (!navigator.onLine) {
                this.patchActiveBasemapForOffline();
                this.loadCachedParcels();
            }
        }, 2000);
    },

    bindUI: function() {
        document.getElementById('offline-download-btn')?.addEventListener('click', () => this.downloadMapRegion());
        document.getElementById('offline-sync-btn')?.addEventListener('click', () => this.forceSync());
        document.getElementById('offline-clear-btn')?.addEventListener('click', () => this.clearAllCache());
        document.getElementById('offline-update-btn')?.addEventListener('click', () => this.applyUpdate());
    },

    setupNetworkListeners: function() {
        window.addEventListener('online', () => this.updateConnectionStatus());
        window.addEventListener('offline', () => this.updateConnectionStatus());
    },

    updateConnectionStatus: function() {
        const el = document.getElementById('offline-connection-status');
        if (!el) return;
        
        if (navigator.onLine) {
            el.innerHTML = '<span style="width:10px;height:10px;border-radius:50%;background:#27ae60;display:inline-block;"></span> Connected';
        } else {
            el.innerHTML = '<span style="width:10px;height:10px;border-radius:50%;background:#e74c3c;display:inline-block;animation:pulse 2s infinite;"></span> Offline Mode';
        }
    },

    checkServiceWorkerUpdate: function() {
        if (!('serviceWorker' in navigator)) return;
        
        navigator.serviceWorker.ready.then(reg => {
            reg.addEventListener('updatefound', () => {
                const newWorker = reg.installing;
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        const banner = document.getElementById('offline-update-banner');
                        if (banner) banner.style.display = 'block';
                    }
                });
            });
        });
    },

    applyUpdate: function() {
        if (!('serviceWorker' in navigator)) return;
        navigator.serviceWorker.ready.then(reg => {
            if (reg.waiting) {
                reg.waiting.postMessage({ type: 'SKIP_WAITING' });
                reg.waiting.addEventListener('statechange', e => {
                    if (e.target.state === 'activated') {
                        window.location.reload();
                    }
                });
            }
        });
    },

    getActiveBasemapSource: function() {
        if (!window.map) return null;
        const layers = window.map.getLayers().getArray();
        for (const group of layers) {
            if (group.get('title') && group.get('title').toLowerCase() === 'base maps') {
                const basemaps = group.getLayers().getArray();
                for (const basemap of basemaps) {
                    if (basemap.getVisible()) {
                        return basemap.getSource();
                    }
                }
            }
        }
        return null;
    },

    lon2tile: function(lon, zoom) { 
        return Math.floor((lon + 180) / 360 * Math.pow(2, zoom)); 
    },
    
    lat2tile: function(lat, zoom) { 
        return Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom)); 
    },

    downloadMapRegion: async function() {
        if (!window.map) return;
        
        const extent3857 = window.map.getView().calculateExtent(window.map.getSize());
        const extent4326 = ol.proj.transformExtent(extent3857, 'EPSG:3857', 'EPSG:4326');
        
        const areaSqKm = turf.area(turf.bboxPolygon(extent4326)) / 1000000;
        
        if (areaSqKm > 1.5) {
            alert('Please zoom in. The current view is larger than 1 km². Zoom in closer to download a smaller area.');
            return;
        }

        const source = this.getActiveBasemapSource();
        if (!source || !source.getUrls) {
            alert('Could not determine active basemap. Please ensure a standard basemap is selected.');
            return;
        }

        const urlTemplate = source.getUrls()[0];
        const currentZoom = Math.floor(window.map.getView().getZoom());
        const maxZoom = Math.min(currentZoom + 4, 20);
        
        const [minLon, minLat, maxLon, maxLat] = extent4326;
        
        const tilesToDownload = [];
        
        for (let z = currentZoom; z <= maxZoom; z++) {
            const minX = this.lon2tile(minLon, z);
            const maxX = this.lon2tile(maxLon, z);
            const minY = this.lat2tile(maxLat, z);
            const maxY = this.lat2tile(minLat, z);
            
            for (let x = minX; x <= maxX; x++) {
                for (let y = minY; y <= maxY; y++) {
                    const url = urlTemplate
                        .replace('{z}', z)
                        .replace('{x}', x)
                        .replace('{y}', y)
                        .replace('{a-c}', 'a'); // Default to 'a' subdomain if present
                    tilesToDownload.push({ url, z, x, y });
                }
            }
        }
        
        if (!confirm(`This will download ~${tilesToDownload.length} map tiles for offline use. Continue?`)) return;
        
        document.getElementById('offline-download-btn').disabled = true;
        document.getElementById('offline-progress-container').style.display = 'block';
        
        const tilesToCache = [];
        let downloadedCount = 0;
        let totalBytes = 0;
        
        for (const tile of tilesToDownload) {
            try {
                const response = await fetch(tile.url, { mode: 'cors' });
                if (response.ok) {
                    const blob = await response.blob();
                    tilesToCache.push({ url: tile.url, blob });
                    totalBytes += blob.size;
                }
            } catch (err) {
                console.warn('Failed to download tile:', tile.url);
            }
            
            downloadedCount++;
            const percent = Math.round((downloadedCount / tilesToDownload.length) * 100);
            document.getElementById('offline-progress-bar').style.width = `${percent}%`;
            document.getElementById('offline-progress-percent').innerText = `${percent}%`;
        }

        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
                type: 'CACHE_TILES',
                payload: { tiles: tilesToCache }
            });
        }
        
        // Save region record
        await this.saveRegionRecord({
            id: 'region_' + Date.now(),
            name: 'Region ' + new Date().toLocaleString(),
            extent: extent4326,
            zoomRange: `${currentZoom} - ${maxZoom}`,
            tileCount: tilesToCache.length,
            sizeBytes: totalBytes,
            timestamp: Date.now()
        });

        // Cache Survey Polygons
        this.cacheSurveyPolygons();
        
        document.getElementById('offline-progress-text').innerText = 'Download complete!';
        setTimeout(() => {
            document.getElementById('offline-progress-container').style.display = 'none';
            document.getElementById('offline-download-btn').disabled = false;
            document.getElementById('offline-progress-bar').style.width = '0%';
            document.getElementById('offline-progress-text').innerText = 'Downloading tiles...';
            this.updateStorageMeter();
            this.loadCachedRegionsList();
            this.patchActiveBasemapForOffline();
        }, 2000);
    },

    cacheSurveyPolygons: async function() {
        if (!window.map) return;
        const featuresToCache = [];
        window.map.getLayers().forEach(layer => {
            if (layer.get('name') === 'survey_polygons' || layer.get('title') === 'GSPNET LAYERS') {
                const source = layer.getSource();
                if (source && source.getFeatures) {
                    featuresToCache.push(...source.getFeatures());
                }
            }
        });
        
        if (featuresToCache.length === 0) return;
        
        const geojson = new ol.format.GeoJSON().writeFeatures(featuresToCache, { featureProjection: 'EPSG:3857' });
        
        const db = await this.openDB('gspnet-offline-parcels', 'parcels');
        const tx = db.transaction('parcels', 'readwrite');
        tx.objectStore('parcels').put({ id: 'latest', data: geojson, timestamp: Date.now() });
    },

    loadCachedParcels: async function() {
        try {
            const db = await this.openDB('gspnet-offline-parcels', 'parcels');
            const tx = db.transaction('parcels', 'readonly');
            const req = tx.objectStore('parcels').get('latest');
            req.onsuccess = () => {
                if (req.result && window.map) {
                    const features = new ol.format.GeoJSON().readFeatures(req.result.data, { featureProjection: 'EPSG:3857' });
                    // Create an offline layer
                    const offlineSource = new ol.source.Vector({ features });
                    const offlineLayer = new ol.layer.Vector({
                        source: offlineSource,
                        name: 'offline_parcels',
                        style: new ol.style.Style({
                            stroke: new ol.style.Stroke({ color: '#f39c12', width: 2, lineDash: [4,4] }),
                            fill: new ol.style.Fill({ color: 'rgba(243, 156, 18, 0.1)' })
                        })
                    });
                    window.map.addLayer(offlineLayer);
                    console.log('Loaded offline parcels:', features.length);
                }
            };
        } catch (err) {
            console.warn('No cached parcels found');
        }
    },

    patchActiveBasemapForOffline: function() {
        const source = this.getActiveBasemapSource();
        if (!source || !source.setTileLoadFunction) return;
        
        const defaultLoadFn = source.getTileLoadFunction();
        
        source.setTileLoadFunction(async (tile, src) => {
            if (navigator.onLine) {
                defaultLoadFn(tile, src);
                return;
            }
            
            // If offline, check Cache API first
            if ('caches' in window) {
                try {
                    const cacheResponse = await caches.match(src);
                    if (cacheResponse) {
                        const blob = await cacheResponse.blob();
                        const url = URL.createObjectURL(blob);
                        tile.getImage().src = url;
                        tile.getImage().onload = () => URL.revokeObjectURL(url);
                        return;
                    }
                } catch (e) {}
            }
            
            // Fallback
            defaultLoadFn(tile, src);
        });
    },

    updateStorageMeter: async function() {
        if (navigator.storage && navigator.storage.estimate) {
            const estimate = await navigator.storage.estimate();
            const usedMB = (estimate.usage / (1024 * 1024)).toFixed(1);
            // Limit to 500MB as specified
            const totalMB = 500;
            const percent = Math.min((usedMB / totalMB) * 100, 100);
            
            document.getElementById('offline-storage-used').innerText = `${usedMB} MB`;
            document.getElementById('offline-storage-total').innerText = `${totalMB} MB`;
            
            const bar = document.getElementById('offline-storage-bar-fill');
            bar.style.width = `${percent}%`;
            
            if (usedMB > 490) {
                bar.style.background = 'linear-gradient(90deg, #c0392b, #e74c3c)';
            } else if (usedMB > 450) {
                bar.style.background = 'linear-gradient(90deg, #d35400, #e67e22)';
            } else {
                bar.style.background = 'linear-gradient(90deg, #27ae60, #2ecc71)';
            }
        }
    },

    openDB: function(dbName, storeName) {
        return new Promise((resolve, reject) => {
            const req = indexedDB.open(dbName, 1);
            req.onupgradeneeded = () => {
                if (!req.result.objectStoreNames.contains(storeName)) {
                    req.result.createObjectStore(storeName, { keyPath: 'id' });
                }
            };
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    },

    saveRegionRecord: async function(region) {
        const db = await this.openDB('gspnet-offline-regions', 'regions');
        return new Promise((resolve) => {
            const tx = db.transaction('regions', 'readwrite');
            tx.objectStore('regions').put(region);
            tx.oncomplete = resolve;
        });
    },

    loadCachedRegionsList: async function() {
        const container = document.getElementById('offline-cached-regions-list');
        if (!container) return;
        
        try {
            const db = await this.openDB('gspnet-offline-regions', 'regions');
            const tx = db.transaction('regions', 'readonly');
            const req = tx.objectStore('regions').getAll();
            
            req.onsuccess = () => {
                const regions = req.result;
                if (regions.length === 0) {
                    container.innerHTML = '<div style="font-size:0.8em; color:rgba(255,255,255,0.4); text-align:center; padding:15px;">No regions downloaded yet</div>';
                    return;
                }
                
                container.innerHTML = '';
                regions.sort((a,b) => b.timestamp - a.timestamp).forEach(region => {
                    const sizeMB = (region.sizeBytes / (1024*1024)).toFixed(1);
                    const div = document.createElement('div');
                    div.style.cssText = 'background:rgba(0,0,0,0.2); padding:10px; border-radius:6px; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;';
                    div.innerHTML = `
                        <div>
                            <div style="font-size:0.85em; font-weight:600;">${region.name}</div>
                            <div style="font-size:0.75em; color:rgba(255,255,255,0.5);">${region.tileCount} tiles • ${sizeMB} MB</div>
                        </div>
                        <button onclick="OfflineManager.deleteRegion('${region.id}')" style="background:none; border:none; color:#e74c3c; cursor:pointer;"><i class="fas fa-trash"></i></button>
                    `;
                    container.appendChild(div);
                });
            };
        } catch (e) {
            console.warn('Could not load regions list');
        }
    },

    deleteRegion: async function(id) {
        if (!confirm('Remove this offline region record? Note: Map tiles are managed separately.')) return;
        const db = await this.openDB('gspnet-offline-regions', 'regions');
        const tx = db.transaction('regions', 'readwrite');
        tx.objectStore('regions').delete(id);
        tx.oncomplete = () => this.loadCachedRegionsList();
    },

    clearAllCache: async function() {
        if (!confirm('WARNING: This will delete ALL downloaded map tiles, regions, and offline data. Are you sure?')) return;
        
        indexedDB.deleteDatabase('gspnet-offline-regions');
        indexedDB.deleteDatabase('gspnet-offline-parcels');
        
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_TILE_CACHE' });
        }
        
        setTimeout(() => {
            this.updateStorageMeter();
            this.loadCachedRegionsList();
            alert('Offline cache cleared successfully.');
        }, 1000);
    },

    // ─── SYNC QUEUE MANAGEMENT ──────────────────────────────────────────

    addToSyncQueue: async function(url, method, body, headers = null) {
        const db = await this.openDB('gspnet-sync-queue', 'requests');
        const tx = db.transaction('requests', 'readwrite');
        tx.objectStore('requests').put({
            id: 'req_' + Date.now(),
            url,
            method,
            body,
            headers,
            timestamp: Date.now()
        });
        
        tx.oncomplete = () => {
            this.updateSyncCount();
            if ('serviceWorker' in navigator && 'sync' in navigator.serviceWorker) {
                navigator.serviceWorker.ready.then(reg => reg.sync.register('gspnet-sync-queue'));
            }
        };
    },

    updateSyncCount: async function() {
        try {
            const db = await this.openDB('gspnet-sync-queue', 'requests');
            const tx = db.transaction('requests', 'readonly');
            const req = tx.objectStore('requests').count();
            req.onsuccess = () => {
                const count = req.result;
                const el = document.getElementById('offline-sync-count');
                if (el) el.innerText = count;
                
                const btn = document.getElementById('offline-sync-btn');
                if (btn) btn.disabled = count === 0;
            };
        } catch (e) {}
    },

    forceSync: async function() {
        const btn = document.getElementById('offline-sync-btn');
        if (btn) {
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Syncing...';
            btn.disabled = true;
        }
        
        try {
            const db = await this.openDB('gspnet-sync-queue', 'requests');
            const tx = db.transaction('requests', 'readonly');
            const req = tx.objectStore('requests').getAll();
            
            req.onsuccess = async () => {
                const items = req.result;
                for (const item of items) {
                    try {
                        const response = await fetch(item.url, {
                            method: item.method || 'POST',
                            headers: item.headers || { 'Content-Type': 'application/json' },
                            body: item.body
                        });
                        
                        if (response.ok) {
                            const deleteTx = db.transaction('requests', 'readwrite');
                            deleteTx.objectStore('requests').delete(item.id);
                        }
                    } catch (err) {
                        console.warn('Sync failed for item:', item.id);
                    }
                }
                
                this.updateSyncCount();
                if (btn) {
                    btn.innerHTML = 'Sync Now';
                    btn.disabled = false;
                }
            };
        } catch (e) {
            if (btn) {
                btn.innerHTML = 'Sync Now';
                btn.disabled = false;
            }
        }
    }
};

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    window.OfflineManager.init();
});
