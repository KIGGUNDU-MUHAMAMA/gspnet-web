// ============================================================
// CESIUM 3D GLOBE VIEWER  (cesium3d-viewer.js)
// GSPNET Platform — National Digital Twin for Uganda
// v2.0  Engineering-Grade Upgrade
// ============================================================
(function () {
    'use strict';

    // ── CONFIGURATION ─────────────────────────────────────────────────────────
    const CFG = {
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIxMzJhN2ZkMi0wNmUxLTQ1MWMtOTRkZS0xZjA0OTYxMDg4NTEiLCJpZCI6NDI2MjM2LCJzdWIiOiJraWdndW5kdSBtdWhhbWFkIiwiaXNzIjoiaHR0cHM6Ly9pb24uY2VzaXVtLmNvbSIsImF1ZCI6Imdlb3NwYXRpYWwtbmV0d29rIiwiaWF0IjoxNzc3NjY0Mzk5fQ.NBpX1C09suQ4A2p6OiOqgEHQc2YYPTLTKp4FUF17sOc',
        terrainAsset     : 1,
        osmBuildingsAsset: 96188,
        ugandaRect       : [29.5, -1.5, 35.0, 4.5],   // [W,S,E,N]
        elevMin          : -100,
        elevMax          : 5200,     // Rwenzori
        contourSpacing   : 100,      // metres
        maxTrees         : 1500,
        treeDensityPerKm2: 28,
        batchSize        : 80,       // features per RAF frame
        labelMaxDist     : 2000,     // metres camera height for labels
        buildingSSE      : 8,        // OSM buildings screen-space error
        profileSamples   : 80,       // terrain sample count for profile
    };

    // ── STATE ─────────────────────────────────────────────────────────────────
    let viewer              = null;
    let initialCamera       = null;
    let captures            = [];
    let currentImageryLayer = null;
    let currentBasemapKey   = 'esri-satellite';
    let osmBuildingsTileset = null;
    let dtmEnabled          = false;
    let contoursEnabled     = false;

    // Per-layer entity tracking for visibility toggle
    const layerEntityMap  = new Map();   // layerTitle → Set<entityId>
    const layerVisibility = { 'gspnet-layer': true, 'survey-polygon': true };

    // RAF feature batching queue
    let featureQueue = [];
    let rafId        = null;

    // Reactive source WeakSet (prevent duplicate listeners)
    const _reactiveSourceKeys = new WeakSet();

    // AOI
    let aoiMode          = false;
    let aoiPoints        = [];
    let aoiPreviewEntity = null;
    let aoiPolygonEntity = null;
    let aoiHandler       = null;
    let aoiBbox          = null;   // {west,south,east,north} in degrees

    // Elevation query
    let elevQueryActive  = false;
    let elevHandler      = null;

    // Terrain profile
    let profileMode      = false;
    let profilePoints    = [];
    let profileHandler   = null;
    let profileLineEntity= null;
    let profileData      = null;

    // Vegetation
    let vegetationEnabled    = false;
    let vegetationCollection = null;
    let _treeCanvas          = null;

    // ── ELEVATION-RAMP CANVAS (Standard Topo Palette) ─────────────────────────
    function buildElevationRampCanvas() {
        const c = document.createElement('canvas');
        c.width = 512; c.height = 1;
        const ctx = c.getContext('2d');
        const g = ctx.createLinearGradient(0, 0, 512, 0);

        // Map relative to CFG.elevMin (-100) and CFG.elevMax (5200)
        const getT = (m) => Math.max(0, Math.min(1, (m - CFG.elevMin) / (CFG.elevMax - CFG.elevMin)));

        // Steep gradient tailored for Uganda's plateau (1000m - 1800m)
        g.addColorStop(getT(-100), '#000000'); // Errors
        g.addColorStop(getT(800),  '#2a5a3b'); // Dark Green (Lowlands)
        g.addColorStop(getT(1100), '#5b8c5a'); // Mid Green
        g.addColorStop(getT(1150), '#8dae58'); // Light Green (Lake Victoria basin)
        g.addColorStop(getT(1200), '#d9d068'); // Yellow-Green
        g.addColorStop(getT(1300), '#e6b741'); // Yellow/Orange
        g.addColorStop(getT(1400), '#d68a33'); // Orange/Brown (Hills)
        g.addColorStop(getT(1600), '#a35427'); // Brown
        g.addColorStop(getT(2000), '#6b3c22'); // Dark Brown
        g.addColorStop(getT(3000), '#665d58'); // Grey
        g.addColorStop(getT(4500), '#9c9a98'); // Light Grey
        g.addColorStop(getT(5100), '#ffffff'); // Snow (Rwenzori)

        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 512, 1);
        return c;
    }

    // ── GLOBE MATERIAL: DTM / CONTOUR / COMBINED ──────────────────────────────
    function buildGlobeMaterial(showDtm, showContours) {
        if (!showDtm && !showContours) return null;

        if (showDtm) {
            // ── DTM Custom Shader with Procedural Roughness & Optional Contours ──
            const rampUrl = buildElevationRampCanvas().toDataURL();
            return new Cesium.Material({
                fabric: {
                    uniforms: {
                        image         : rampUrl,
                        minimumHeight : CFG.elevMin,
                        maximumHeight : CFG.elevMax,
                        contourSpacing: CFG.contourSpacing,
                        showContours  : showContours
                    },
                    source: [
                        'uniform sampler2D image;',
                        'uniform float minimumHeight;',
                        'uniform float maximumHeight;',
                        'uniform float contourSpacing;',
                        'uniform bool showContours;',

                        // Fractal Brownian Motion (fBm) for procedural roughness
                        'float hash(vec2 p) { return fract(1e4 * sin(17.0 * p.x + p.y * 0.1) * (0.1 + abs(sin(p.y * 13.0 + p.x)))); }',
                        'float noise(vec2 x) {',
                        '    vec2 i = floor(x); vec2 f = fract(x);',
                        '    float a = hash(i); float b = hash(i + vec2(1.0, 0.0));',
                        '    float c = hash(i + vec2(0.0, 1.0)); float d = hash(i + vec2(1.0, 1.0));',
                        '    vec2 u = f * f * (3.0 - 2.0 * f);',
                        '    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;',
                        '}',
                        'float fbm(vec2 x) {',
                        '    float v = 0.0; float a = 0.5; vec2 shift = vec2(100.0);',
                        '    for (int i = 0; i < 4; ++i) { v += a * noise(x); x = x * 2.0 + shift; a *= 0.5; }',
                        '    return v;',
                        '}',

                        'czm_material czm_getMaterial(czm_materialInput materialInput) {',
                        '    czm_material material = czm_getDefaultMaterial(materialInput);',
                        '    float height = materialInput.height;',

                        // Elevation color stretch
                        '    float t = clamp((height - minimumHeight) / (maximumHeight - minimumHeight), 0.0, 1.0);',
                        '    vec4 ramp = texture(image, vec2(t, 0.5));',
                        '    vec3 baseColor = ramp.rgb;',

                        // Apply procedural terrain roughness texture (bump mapping)
                        '    float n = fbm(materialInput.st * 180.0);',
                        '    baseColor *= (0.65 + 0.55 * n);', // Stronger roughness contrast

                        '    material.diffuse = baseColor;',
                        // Fully opaque DTM
                        '    material.alpha = 1.00;',

                        '    if (showContours) {',
                        '        float h = height / contourSpacing;',
                        '        float frac = abs(fract(h) - 0.5) * 2.0;',
                        '        float minor = clamp(1.0 - frac * 15.0, 0.0, 1.0);',
                        '        float hM = height / (contourSpacing * 5.0);',
                        '        float fracM = abs(fract(hM) - 0.5) * 2.0;',
                        '        float major = clamp(1.0 - fracM * 10.0, 0.0, 1.0);',
                        
                        // Professional contours: subtle darkening
                        '        if (major > 0.1) {',
                        '            material.diffuse = mix(material.diffuse, vec3(0.15, 0.12, 0.10), major * 0.8);',
                        '            material.alpha = max(material.alpha, major * 0.9);',
                        '        } else if (minor > 0.1) {',
                        '            material.diffuse = mix(material.diffuse, vec3(0.25, 0.22, 0.20), minor * 0.6);',
                        '            material.alpha = max(material.alpha, minor * 0.7);',
                        '        }',
                        '    }',
                        '    return material;',
                        '}'
                    ].join('\n')
                }
            });

        } else {
            // ── Contours only: built-in ElevationContour overlaid on satellite ──
            return Cesium.Material.fromType('ElevationContour', {
                color  : Cesium.Color.fromCssColorString('rgba(0,0,30,0.85)'),
                spacing: CFG.contourSpacing,
                width  : 1.5
            });
        }
    }

    function applyGlobeMaterial() {
        if (!viewer) return;
        viewer.scene.globe.material = buildGlobeMaterial(dtmEnabled, contoursEnabled);

        // DO NOT remove the satellite imagery! 
        // Our new DTM shader has alpha=0.6, so blending the DTM color WITH the 
        // satellite map provides the terrain colors AND the roads, water, and forests.
        if (!currentImageryLayer) {
            switchBasemap(currentBasemapKey);
        }

        const modeEl = document.getElementById('cesium3dGlobeMode');
        if (modeEl) {
            if      (dtmEnabled && contoursEnabled) modeEl.textContent = '🗺 DTM + Contours';
            else if (dtmEnabled)                   modeEl.textContent = '🗺 DTM View';
            else if (contoursEnabled)              modeEl.textContent = '〰 Contours';
            else                                   modeEl.textContent = '';
        }
    }

    // ── TREE BILLBOARD CANVAS — clean 2-tier lollipop design ─────────────────
    // Larger canvas (48×56) for crisp rendering at viewer zoom levels
    function buildTreeCanvas() {
        const W = 48, H = 56;
        const c = document.createElement('canvas');
        c.width = W; c.height = H;
        const ctx = c.getContext('2d');

        const cx = W / 2; // 24

        // Drop shadow under crown
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.40)';
        ctx.shadowBlur  = 5;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 3;

        // Trunk — warm brown pillar
        const tg = ctx.createLinearGradient(cx - 3, 38, cx + 3, H);
        tg.addColorStop(0, '#7c4a2a');
        tg.addColorStop(1, '#4e2810');
        ctx.fillStyle = tg;
        ctx.beginPath();
        ctx.roundRect(cx - 3, 39, 6, H - 39, 2);
        ctx.fill();

        // Crown — single lush circle with radial gradient
        const rg = ctx.createRadialGradient(cx - 4, 18, 2, cx, 22, 19);
        rg.addColorStop(0.00, '#81c784');  // bright highlight centre
        rg.addColorStop(0.35, '#4caf50');  // mid green
        rg.addColorStop(0.70, '#2e7d32');  // deep green edge
        rg.addColorStop(1.00, '#1b5e20');  // dark outer rim
        ctx.fillStyle = rg;
        ctx.beginPath();
        ctx.arc(cx, 22, 19, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Specular highlight (top-left shine)
        ctx.save();
        ctx.globalAlpha = 0.30;
        const sg = ctx.createRadialGradient(cx - 7, 12, 0, cx - 6, 14, 10);
        sg.addColorStop(0, '#ffffff');
        sg.addColorStop(1, 'transparent');
        ctx.fillStyle = sg;
        ctx.beginPath();
        ctx.arc(cx, 22, 19, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        return c;
    }

    // ── BASEMAP PROVIDERS ─────────────────────────────────────────────────────
    const BASEMAPS = {
        'esri-satellite': () => new Cesium.UrlTemplateImageryProvider({
            url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            maximumLevel: 19, credit: new Cesium.Credit('Esri')
        }),
        'esri-topo': () => new Cesium.UrlTemplateImageryProvider({
            url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
            maximumLevel: 19, credit: new Cesium.Credit('Esri')
        }),
        'osm': () => new Cesium.UrlTemplateImageryProvider({
            url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
            maximumLevel: 19, credit: new Cesium.Credit('OpenStreetMap')
        }),
        'carto-voyager': () => new Cesium.UrlTemplateImageryProvider({
            url: 'https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png',
            maximumLevel: 19, credit: new Cesium.Credit('CARTO')
        }),
        'carto-dark': () => new Cesium.UrlTemplateImageryProvider({
            url: 'https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
            maximumLevel: 19, credit: new Cesium.Credit('CARTO')
        }),
        'esri-streets': () => new Cesium.UrlTemplateImageryProvider({
            url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
            maximumLevel: 19, credit: new Cesium.Credit('Esri')
        })
    };

    // ── LAUNCH ────────────────────────────────────────────────────────────────
    window.launchCesium3DGlobe = async function () {
        const overlay = document.getElementById('cesium3dOverlay');
        if (!overlay) return;
        overlay.classList.add('active');

        const modal = document.getElementById('terrainProjectModal');
        if (modal) modal.classList.remove('show');

        const loading  = document.getElementById('cesium3dLoading');
        const statusEl = document.getElementById('cesium3dLoadingStatus');
        if (loading) loading.classList.remove('hidden');

        try {
            if (statusEl) statusEl.textContent = 'Setting up Cesium Ion…';
            Cesium.Ion.defaultAccessToken = CFG.token;

            if (statusEl) statusEl.textContent = 'Loading Cesium World Terrain…';
            const terrainProvider = await Cesium.CesiumTerrainProvider.fromIonAssetId(CFG.terrainAsset, {
                requestVertexNormals: true,
                requestWaterMask    : true
            });

            if (statusEl) statusEl.textContent = 'Initialising 3D Viewer…';

            // Reset previous viewer
            if (viewer) { try { viewer.destroy(); } catch (e) {} viewer = null; }
            featureQueue = []; rafId = null; layerEntityMap.clear();
            dtmEnabled = false; contoursEnabled = false;
            vegetationEnabled = false; vegetationCollection = null; _treeCanvas = null;
            captures = []; aoiBbox = null; profileData = null;

            const container = document.getElementById('cesium3dContainer');
            const old = container.querySelector('.cesium-viewer');
            if (old) old.remove();

            // ── CREATE VIEWER ────────────────────────────────────────────────
            viewer = new Cesium.Viewer('cesium3dContainer', {
                terrainProvider,
                baseLayerPicker     : false,
                geocoder            : false,
                homeButton          : false,
                sceneModePicker     : false,
                selectionIndicator  : false,
                timeline            : false,
                animation           : false,
                fullscreenButton    : false,
                navigationHelpButton: false,
                infoBox             : false,
                creditContainer     : document.createElement('div'),
                contextOptions      : { webgl: { preserveDrawingBuffer: true } },
                msaaSamples         : 4
            });

            // ── SCENE QUALITY & WATER EFFECTS ─────────────────────────────────
            const scene = viewer.scene;
            scene.globe.maximumScreenSpaceError = 2;
            scene.globe.depthTestAgainstTerrain = true;
            scene.globe.enableLighting          = true;
            scene.globe.showGroundAtmosphere    = true;
            
            // Enable realistic animated water reflections
            scene.globe.showWaterEffect = true;

            scene.skyAtmosphere.show             = true;
            scene.skyAtmosphere.saturationShift  = 0.06;
            scene.skyAtmosphere.brightnessShift  = 0.03;

            scene.fog.enabled               = true;
            scene.fog.density               = 0.00016;
            scene.fog.screenSpaceErrorFactor= 4.0;

            // Uganda equatorial lighting — 10:00 local
            viewer.clock.currentTime   = Cesium.JulianDate.fromIso8601('2024-06-15T08:00:00Z');
            viewer.clock.shouldAnimate = false;

            // ── BASEMAP ───────────────────────────────────────────────────────
            viewer.imageryLayers.removeAll();
            currentImageryLayer = viewer.imageryLayers.addImageryProvider(BASEMAPS['esri-satellite']());
            currentBasemapKey   = 'esri-satellite';

            // ── FLY TO EXTENT ─────────────────────────────────────────────────
            if (statusEl) statusEl.textContent = 'Flying to your area…';
            await flyToMapExtent();

            initialCamera = {
                position: viewer.camera.position.clone(),
                heading : viewer.camera.heading,
                pitch   : viewer.camera.pitch,
                roll    : viewer.camera.roll
            };

            // ── VECTOR LAYERS ─────────────────────────────────────────────────
            if (statusEl) statusEl.textContent = 'Overlaying map layers…';
            addVectorLayers();

            // ── SENTINEL DRAPE ────────────────────────────────────────────────
            if (typeof window.sentinelDrapeOn3D === 'function') {
                try { window.sentinelDrapeOn3D(viewer); } catch (e) {}
            }

            // ── ALTITUDE READOUT ──────────────────────────────────────────────
            scene.postRender.addEventListener(updateAltitudeReadout);

            if (loading) loading.classList.add('hidden');
            wireControls();
            if (typeof showToast === 'function') showToast('🌍 3D Globe loaded', 'success');

        } catch (err) {
            console.error('[Cesium3D] Launch error:', err);
            if (loading) loading.classList.add('hidden');
            if (typeof showToast === 'function') showToast('3D Globe error: ' + err.message, 'error');
        }
    };

    function updateAltitudeReadout() {
        if (!viewer) return;
        const el = document.getElementById('cesium3dAltitude');
        if (!el) return;
        const h = viewer.camera.positionCartographic.height;
        el.textContent = h > 1000 ? (h / 1000).toFixed(1) + ' km' : Math.round(h) + ' m';
    }

    // ── FLY TO MAP EXTENT ─────────────────────────────────────────────────────
    async function flyToMapExtent() {
        if (!viewer) return;
        try {
            const view   = map.getView();
            const extent = view.calculateExtent(map.getSize());
            const ll     = ol.proj.transformExtent(extent, 'EPSG:3857', 'EPSG:4326');
            viewer.camera.flyTo({
                destination : Cesium.Rectangle.fromDegrees(ll[0], ll[1], ll[2], ll[3]),
                orientation : { heading: 0, pitch: Cesium.Math.toRadians(-35), roll: 0 },
                duration    : 2.0
            });
            await new Promise(r => setTimeout(r, 2600));
        } catch (e) {
            const [w, s, e2, n] = CFG.ugandaRect;
            viewer.camera.flyTo({ destination: Cesium.Rectangle.fromDegrees(w, s, e2, n), duration: 2.0 });
            await new Promise(r => setTimeout(r, 2600));
        }
    }

    // ── COLLECT LEAF OL LAYERS ────────────────────────────────────────────────
    function collectLeafLayers(lg) {
        const out = [];
        if (typeof lg.getLayers === 'function') {
            lg.getLayers().getArray().forEach(c => out.push(...collectLeafLayers(c)));
        } else { out.push(lg); }
        return out;
    }

    function addVectorLayers() {
        if (!viewer || typeof map === 'undefined') return;
        try {
            const all = [];
            map.getLayers().getArray().forEach(l => all.push(...collectLeafLayers(l)));
            all.forEach(layer => {
                const title  = layer.get('title') || layer.get('name') || '';
                const source = layer.getSource && layer.getSource();
                if (!source || typeof source.getFeatures !== 'function') return;

                if (!_reactiveSourceKeys.has(source)) {
                    _reactiveSourceKeys.add(source);
                    source.on('addfeature', evt => {
                        if (!viewer) return;
                        enqueueFeatures([evt.feature], title);
                    });
                }

                const feats = source.getFeatures();
                if (feats.length > 0) enqueueFeatures(feats, title);
            });
        } catch (e) { console.warn('[Cesium3D] addVectorLayers:', e); }
    }

    // ── RAF-CHUNKED FEATURE QUEUE ─────────────────────────────────────────────
    function enqueueFeatures(features, layerTitle) {
        for (let i = 0; i < features.length; i += CFG.batchSize) {
            featureQueue.push({ batch: features.slice(i, i + CFG.batchSize), layerTitle });
        }
        if (!rafId) rafId = requestAnimationFrame(processQueue);
    }

    function processQueue() {
        if (!viewer || featureQueue.length === 0) { rafId = null; return; }
        const item = featureQueue.shift();
        addVectorFeaturesToCesium(item.batch, item.layerTitle);
        rafId = requestAnimationFrame(processQueue);
    }

    // ── PUBLIC: RELOAD LAYERS ─────────────────────────────────────────────────
    window.cesium3dReloadLayers = function () {
        if (!viewer) return;
        layerEntityMap.forEach(idSet => {
            idSet.forEach(id => { const e = viewer.entities.getById(id); if (e) viewer.entities.remove(e); });
        });
        layerEntityMap.clear();
        featureQueue = [];
        if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
        addVectorLayers();
        if (typeof showToast === 'function') showToast('Layers refreshed', 'success');
    };

    // ── LABEL LOOKUP ──────────────────────────────────────────────────────────
    function getLabelText(feature, layerTitle) {
        const t = (layerTitle || '').toLowerCase();
        if (t.includes('forest')) return feature.get('Name') || feature.get('name') || null;
        if (t === 'mukono blocks') return feature.get('Number_') != null ? String(feature.get('Number_')) : null;
        if (!t.includes('nlis') && !t.includes('nlsi') && !t.includes('block') && !t.includes('forest') && !t.includes('protected')) {
            return feature.get('unique_id') != null ? String(feature.get('unique_id')) : null;
        }
        const id = feature.get('nlis_id');
        return id != null ? String(id) : null;
    }

    function getRingCentroidLL(ring) {
        let sx = 0, sy = 0;
        const n = ring.length - 1;
        for (let i = 0; i < n; i++) { sx += ring[i][0]; sy += ring[i][1]; }
        return ol.proj.transform([sx / n, sy / n], 'EPSG:3857', 'EPSG:4326');
    }

    // ── AOI INTERSECTION CHECK ────────────────────────────────────────────────
    function featureIntersectsAoi(feature) {
        if (!aoiBbox) return true;
        try {
            const ext = feature.getGeometry().getExtent();
            const ll  = ol.proj.transformExtent(ext, 'EPSG:3857', 'EPSG:4326');
            return !(ll[2] < aoiBbox.west || ll[0] > aoiBbox.east || ll[3] < aoiBbox.south || ll[1] > aoiBbox.north);
        } catch (e) { return true; }
    }

    // ── ADD VECTOR FEATURES (RAF-CHUNKED) ─────────────────────────────────────
    function addVectorFeaturesToCesium(features, layerTitle) {
        const tl          = (layerTitle || '').toLowerCase();
        const isForest    = tl.includes('forest');
        const isProtected = tl.includes('protected');
        const isBlock     = tl.includes('block');
        const isNlis      = tl.includes('nlis') || tl.includes('nlsi');
        const isGspnet    = isNlis || isBlock || isForest || isProtected;
        const layerType   = isGspnet ? 'gspnet-layer' : 'survey-polygon';
        const lineColor   = isGspnet ? '#ef4444' : '#facc15';
        const lblOut      = isGspnet ? '#7f1d1d' : '#713f12';
        const visible     = layerVisibility[layerType] !== false;

        if (!layerEntityMap.has(layerTitle)) layerEntityMap.set(layerTitle, new Set());
        const idSet = layerEntityMap.get(layerTitle);

        features.forEach(feature => {
            if (aoiBbox && !featureIntersectsAoi(feature)) return;
            const geom = feature.getGeometry();
            if (!geom) return;
            const type = geom.getType();

            if (type === 'Polygon' || type === 'MultiPolygon') {
                const polys = type === 'Polygon' ? [geom.getCoordinates()] : geom.getCoordinates();
                polys.forEach(polyCoords => {
                    const ring = polyCoords[0];
                    if (!ring || ring.length < 3) return;
                    const pos = ring.map(c => {
                        const ll = ol.proj.transform(c, 'EPSG:3857', 'EPSG:4326');
                        return Cesium.Cartesian3.fromDegrees(ll[0], ll[1]);
                    });
                    const oe = viewer.entities.add({
                        polyline: {
                            positions  : [...pos, pos[0]],
                            width      : isBlock ? 1.8 : 1.5,
                            material   : Cesium.Color.fromCssColorString(lineColor),
                            clampToGround: true
                        },
                        properties: { layerType }
                    });
                    oe.show = visible;
                    idSet.add(oe.id);

                    const lbl = getLabelText(feature, layerTitle);
                    if (lbl) {
                        const centLL = getRingCentroidLL(ring);
                        const le = viewer.entities.add({
                            position: Cesium.Cartesian3.fromDegrees(centLL[0], centLL[1]),
                            label: {
                                text        : lbl,
                                font        : isBlock || isForest || isProtected ? 'bold 11px sans-serif' : '10px sans-serif',
                                fillColor   : Cesium.Color.WHITE,
                                outlineColor: Cesium.Color.fromCssColorString(lblOut),
                                outlineWidth: 2,
                                style       : Cesium.LabelStyle.FILL_AND_OUTLINE,
                                verticalOrigin  : Cesium.VerticalOrigin.CENTER,
                                horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
                                heightReference : Cesium.HeightReference.CLAMP_TO_GROUND,
                                distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, CFG.labelMaxDist),
                                disableDepthTestDistance: Number.POSITIVE_INFINITY,
                            },
                            properties: { layerType }
                        });
                        le.show = visible;
                        idSet.add(le.id);
                    }
                });

            } else if (type === 'LineString' || type === 'MultiLineString') {
                const lines = type === 'LineString' ? [geom.getCoordinates()] : geom.getCoordinates();
                lines.forEach(lc => {
                    if (!lc || lc.length < 2) return;
                    const pos = lc.map(c => {
                        const ll = ol.proj.transform(c, 'EPSG:3857', 'EPSG:4326');
                        return Cesium.Cartesian3.fromDegrees(ll[0], ll[1]);
                    });
                    const le = viewer.entities.add({
                        polyline  : { positions: pos, width: 1.5, material: Cesium.Color.fromCssColorString(lineColor), clampToGround: true },
                        properties: { layerType }
                    });
                    le.show = visible;
                    idSet.add(le.id);
                });

            } else if (type === 'Point') {
                const ll = ol.proj.transform(geom.getCoordinates(), 'EPSG:3857', 'EPSG:4326');
                const lbl = getLabelText(feature, layerTitle);
                const pe = viewer.entities.add({
                    position  : Cesium.Cartesian3.fromDegrees(ll[0], ll[1]),
                    point     : {
                        pixelSize      : 6,
                        color          : Cesium.Color.fromCssColorString(lineColor),
                        outlineColor   : Cesium.Color.WHITE,
                        outlineWidth   : 1,
                        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
                    },
                    label: lbl ? {
                        text        : lbl,
                        font        : '10px sans-serif',
                        fillColor   : Cesium.Color.WHITE,
                        outlineColor: Cesium.Color.fromCssColorString(lblOut),
                        outlineWidth: 2,
                        style       : Cesium.LabelStyle.FILL_AND_OUTLINE,
                        verticalOrigin  : Cesium.VerticalOrigin.BOTTOM,
                        heightReference : Cesium.HeightReference.CLAMP_TO_GROUND,
                        distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, CFG.labelMaxDist),
                        disableDepthTestDistance: Number.POSITIVE_INFINITY,
                        pixelOffset : new Cesium.Cartesian2(0, -10)
                    } : undefined,
                    properties: { layerType }
                });
                pe.show = visible;
                idSet.add(pe.id);
            }
        });
    }

    // ── LAYER VISIBILITY ──────────────────────────────────────────────────────
    function toggleLayerVisibility(layerType, visible) {
        if (!viewer) return;
        layerVisibility[layerType] = visible;
        viewer.entities.values.forEach(e => {
            const p = e.properties;
            if (p && p.layerType && p.layerType.getValue() === layerType) e.show = visible;
        });
    }

    // ── SWITCH BASEMAP ────────────────────────────────────────────────────────
    function switchBasemap(key) {
        if (!viewer) return;
        currentBasemapKey = key;
        if (dtmEnabled) return; // DTM mode: no imagery
        try {
            if (currentImageryLayer) {
                viewer.imageryLayers.remove(currentImageryLayer, false);
                currentImageryLayer = null;
            }
            const factory = BASEMAPS[key];
            if (!factory) return;
            const result = factory();
            if (result && typeof result.then === 'function') {
                result.then(p => { currentImageryLayer = viewer.imageryLayers.addImageryProvider(p, 0); });
            } else {
                currentImageryLayer = viewer.imageryLayers.addImageryProvider(result, 0);
            }
        } catch (e) { console.warn('[Cesium3D] Basemap switch:', e); }
    }

    // ── DTM / CONTOUR SETTERS ─────────────────────────────────────────────────
    function setDtmMode(enabled) {
        dtmEnabled = enabled;
        applyGlobeMaterial();
        const cb = document.getElementById('cesium3dDtmToggle');
        if (cb) cb.checked = enabled;
    }

    function setContoursMode(enabled) {
        contoursEnabled = enabled;
        applyGlobeMaterial();
        if (!dtmEnabled && !currentImageryLayer) switchBasemap(currentBasemapKey);
    }

    // ── VERTICAL EXAGGERATION ─────────────────────────────────────────────────
    function setVerticalExaggeration(val) {
        if (!viewer) return;
        viewer.scene.verticalExaggeration = parseFloat(val);
    }

    // ── IMAGERY ADJUSTMENTS ───────────────────────────────────────────────────
    function setImageryAdjustment(prop, val) {
        if (!viewer || !currentImageryLayer) return;
        const v = parseFloat(val) / 100;
        if (prop === 'brightness') currentImageryLayer.brightness = v;
        else if (prop === 'contrast') currentImageryLayer.contrast = v;
        else if (prop === 'saturation') currentImageryLayer.saturation = v;
    }

    // ── OSM BUILDINGS (height-styled) ─────────────────────────────────────────
    async function toggleOsmBuildings(enabled) {
        if (!viewer) return;
        if (enabled) {
            try {
                osmBuildingsTileset = await Cesium.Cesium3DTileset.fromIonAssetId(CFG.osmBuildingsAsset);

                // Add to scene first, then configure
                viewer.scene.primitives.add(osmBuildingsTileset);

                // SSE=2 → show fine LOD tiles; default 16 is blocky
                osmBuildingsTileset.maximumScreenSpaceError = 2;

                // Light, pastel architectural palette based on height
                // Lighter colors reflect Cesium's sun shadows, preventing congested areas
                // from looking like a single giant blob of dark color.
                osmBuildingsTileset.style = new Cesium.Cesium3DTileStyle({
                    defines: {
                        Height: '${feature["cesium#estimatedHeight"]}'
                    },
                    color: {
                        conditions: [
                            ['${Height} >= 80',  "color('#F08080')"], // Light Coral for tall
                            ['${Height} >= 50',  "color('#F4A460')"], // Sandy Brown
                            ['${Height} >= 30',  "color('#F0E68C')"], // Khaki
                            ['${Height} >= 15',  "color('#ADD8E6')"], // Light Blue
                            ['${Height} >= 8',   "color('#B0C4DE')"], // Light Steel Blue
                            ['true',             "color('#F5F5F5')"]  // White Smoke for low-rises
                        ]
                    }
                });

            } catch (e) {
                console.warn('[Cesium3D] OSM buildings:', e);
                if (typeof showToast === 'function') showToast('Buildings unavailable', 'warning');
            }
        } else {
            if (osmBuildingsTileset) {
                viewer.scene.primitives.remove(osmBuildingsTileset);
                osmBuildingsTileset = null;
            }
        }
    }

    // ── VEGETATION: Procedural Generation (Fast, Offline) ─────────────────────
    // Replaced brittle Overpass API with local procedural generation using noise.
    async function toggleVegetation(enabled) {
        vegetationEnabled = enabled;
        if (!viewer) return;
        if (!enabled) {
            if (vegetationCollection) { viewer.scene.primitives.remove(vegetationCollection); vegetationCollection = null; }
            updateToolButtons();
            return;
        }
        await loadVegetationForView();
        updateToolButtons();
    }

    async function loadVegetationForView() {
        if (!viewer || !vegetationEnabled) return;
        const alt = viewer.camera.positionCartographic.height;
        if (alt > 15000) {
            if (typeof showToast === 'function') showToast('🌲 Zoom in closer to see trees', 'info');
            return;
        }
        const rect = viewer.camera.computeViewRectangle(viewer.scene.globe.ellipsoid);
        if (!rect) return;
        
        const W = Cesium.Math.toDegrees(rect.west),  S = Cesium.Math.toDegrees(rect.south);
        const E = Cesium.Math.toDegrees(rect.east),  N = Cesium.Math.toDegrees(rect.north);
        const areakm2 = (E - W) * (N - S) * 111.32 * 111.32;
        
        if (areakm2 > 2500) {
            if (typeof showToast === 'function') showToast('🌲 Zoom in for vegetation detail', 'info');
            return;
        }

        if (typeof showToast === 'function') showToast('🌿 Generating procedural forests…', 'info');
        
        try {
            // ── PHASE 1: Generate procedural tree locations ────────────
            const candidates = [];
            
            // Simple spatial hash to simulate organic clustering
            const hash = (x, y) => Math.abs(Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1;
            
            const numPoints = Math.min(Math.floor(areakm2 * 250), CFG.maxTrees * 2); // Sample density
            
            for (let i = 0; i < numPoints; i++) {
                if (candidates.length >= CFG.maxTrees) break;
                const lon = W + Math.random() * (E - W);
                const lat = S + Math.random() * (N - S);
                
                // Procedural noise check for clustering (forest patches)
                const clusterNoise = hash(Math.floor(lon * 200), Math.floor(lat * 200));
                if (clusterNoise > 0.65) {
                    candidates.push({
                        lon, lat,
                        scale: 0.70 + Math.random() * 0.75,
                        r: 0.82 + Math.random() * 0.18,
                        g: 0.88 + Math.random() * 0.12,
                        b: 0.74 + Math.random() * 0.16,
                        a: 0.90 + Math.random() * 0.10
                    });
                }
            }

            if (candidates.length === 0) return;

            // ── PHASE 2: Batch terrain-height sampling ───────
            const cartoPos = candidates.map(c => new Cesium.Cartographic(Cesium.Math.toRadians(c.lon), Cesium.Math.toRadians(c.lat)));
            const sampled = await Cesium.sampleTerrain(viewer.terrainProvider, 11, cartoPos);

            // Filter out trees placed in water (height <= 0 roughly) or extremely steep areas
            const validCandidates = [];
            for (let i = 0; i < candidates.length; i++) {
                const h = (sampled[i] && sampled[i].height != null) ? sampled[i].height : 0;
                // Keep trees that are safely on land
                if (h > 1130 || h > 10) { // Lake Victoria is ~1134m, general land >10m
                    candidates[i].height = h;
                    validCandidates.push(candidates[i]);
                }
            }

            // ── PHASE 3: Build BillboardCollection ────
            if (vegetationCollection) viewer.scene.primitives.remove(vegetationCollection);
            vegetationCollection = new Cesium.BillboardCollection({ scene: viewer.scene });
            if (!_treeCanvas) _treeCanvas = buildTreeCanvas();

            const visRange = new Cesium.DistanceDisplayCondition(0, Math.min(alt * 2.5, 6000));

            validCandidates.forEach(c => {
                vegetationCollection.add({
                    position       : Cesium.Cartesian3.fromDegrees(c.lon, c.lat, c.height),
                    image          : _treeCanvas,
                    width          : 24 * c.scale,
                    height         : 36 * c.scale,
                    verticalOrigin : Cesium.VerticalOrigin.BOTTOM,
                    distanceDisplayCondition: visRange,
                    color: new Cesium.Color(c.r, c.g, c.b, c.a)
                });
            });

            viewer.scene.primitives.add(vegetationCollection);
            if (typeof showToast === 'function') showToast(`🌲 ${validCandidates.length} trees placed`, 'success');

        } catch (e) {
            console.warn('[Cesium3D] Vegetation:', e);
            if (typeof showToast === 'function') showToast('Vegetation generation failed', 'warning');
        }
    }



    // ── AOI DRAW TOOL ─────────────────────────────────────────────────────────
    function startAoiDraw() {
        if (!viewer) return;
        if (aoiMode) { cancelAoiDraw(); return; }
        aoiMode = true; aoiPoints = [];
        updateToolButtons();
        if (typeof showToast === 'function') showToast('Click to draw AOI polygon · Double-click to finish', 'info');
        if (aoiHandler) aoiHandler.destroy();
        aoiHandler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);

        aoiHandler.setInputAction(evt => {
            const ray = viewer.camera.getPickRay(evt.position);
            const pt  = viewer.scene.globe.pick(ray, viewer.scene);
            if (!pt) return;
            const c = Cesium.Cartographic.fromCartesian(pt);
            aoiPoints.push({ lon: Cesium.Math.toDegrees(c.longitude), lat: Cesium.Math.toDegrees(c.latitude) });
            updateAoiPreview();
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

        aoiHandler.setInputAction(() => { if (aoiPoints.length >= 3) finishAoiDraw(); },
            Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
    }

    function updateAoiPreview() {
        if (!viewer) return;
        if (aoiPreviewEntity) viewer.entities.remove(aoiPreviewEntity);
        if (aoiPoints.length < 2) return;
        const pos = aoiPoints.map(p => Cesium.Cartesian3.fromDegrees(p.lon, p.lat));
        aoiPreviewEntity = viewer.entities.add({
            polyline: {
                positions    : [...pos, pos[0]],
                width        : 2.5,
                material     : new Cesium.PolylineDashMaterialProperty({ color: Cesium.Color.YELLOW, dashLength: 14 }),
                clampToGround: true
            }
        });
    }

    function finishAoiDraw() {
        if (aoiPoints.length < 3) { cancelAoiDraw(); return; }
        aoiMode = false;
        if (aoiHandler) { aoiHandler.destroy(); aoiHandler = null; }
        if (aoiPreviewEntity) { viewer.entities.remove(aoiPreviewEntity); aoiPreviewEntity = null; }
        if (aoiPolygonEntity) viewer.entities.remove(aoiPolygonEntity);

        aoiBbox = {
            west : Math.min(...aoiPoints.map(p => p.lon)),
            east : Math.max(...aoiPoints.map(p => p.lon)),
            south: Math.min(...aoiPoints.map(p => p.lat)),
            north: Math.max(...aoiPoints.map(p => p.lat))
        };

        const pos  = aoiPoints.map(p => Cesium.Cartesian3.fromDegrees(p.lon, p.lat));
        aoiPolygonEntity = viewer.entities.add({
            polygon: {
                hierarchy         : new Cesium.PolygonHierarchy(pos),
                material          : Cesium.Color.YELLOW.withAlpha(0.10),
                outline           : true,
                outlineColor      : Cesium.Color.YELLOW,
                outlineWidth      : 2,
                classificationType: Cesium.ClassificationType.TERRAIN,
                heightReference   : Cesium.HeightReference.CLAMP_TO_GROUND
            }
        });

        const badge = document.getElementById('cesium3dAoiBadge');
        const info  = document.getElementById('cesium3dAoiInfo');
        if (badge) badge.style.display = 'flex';
        if (info) {
            const wkm = ((aoiBbox.east - aoiBbox.west) * 111.32).toFixed(1);
            const hkm = ((aoiBbox.north - aoiBbox.south) * 111.32).toFixed(1);
            info.textContent = `AOI ${wkm} × ${hkm} km`;
        }
        updateToolButtons();
        if (typeof showToast === 'function') showToast('✅ AOI set — new features filtered to this area', 'success');
    }

    function cancelAoiDraw() {
        aoiMode = false; aoiPoints = [];
        if (aoiHandler)      { aoiHandler.destroy(); aoiHandler = null; }
        if (aoiPreviewEntity){ viewer.entities.remove(aoiPreviewEntity); aoiPreviewEntity = null; }
        updateToolButtons();
    }

    function clearAoi() {
        cancelAoiDraw();
        aoiBbox = null;
        if (aoiPolygonEntity) { viewer.entities.remove(aoiPolygonEntity); aoiPolygonEntity = null; }
        const badge = document.getElementById('cesium3dAoiBadge');
        if (badge) badge.style.display = 'none';
        if (typeof showToast === 'function') showToast('AOI cleared', 'info');
    }
    window.clearAoi = clearAoi; // expose for inline onclick safety

    // ── ELEVATION QUERY ───────────────────────────────────────────────────────
    function toggleElevationQuery(enable) {
        elevQueryActive = enable;
        if (elevHandler) { elevHandler.destroy(); elevHandler = null; }
        if (!enable) {
            const popup = document.getElementById('cesium3dElevPopup');
            if (popup) popup.style.display = 'none';
            updateToolButtons();
            return;
        }
        updateToolButtons();
        if (typeof showToast === 'function') showToast('📍 Click terrain to read elevation', 'info');
        elevHandler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
        elevHandler.setInputAction(async evt => {
            const ray = viewer.camera.getPickRay(evt.position);
            const pt  = viewer.scene.globe.pick(ray, viewer.scene);
            if (!pt) return;
            const c   = Cesium.Cartographic.fromCartesian(pt);
            let height = c.height;
            try {
                const [sampled] = await Cesium.sampleTerrainMostDetailed(
                    viewer.terrainProvider,
                    [new Cesium.Cartographic(c.longitude, c.latitude)]
                );
                if (sampled && sampled.height != null) height = sampled.height;
            } catch (e) {}
            const lon = Cesium.Math.toDegrees(c.longitude);
            const lat = Cesium.Math.toDegrees(c.latitude);
            showElevPopup(lon, lat, height, evt.position);
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    }

    function showElevPopup(lon, lat, height, screenPos) {
        const popup = document.getElementById('cesium3dElevPopup');
        if (!popup) return;
        document.getElementById('elevHeight').textContent = height.toFixed(1) + ' m';
        document.getElementById('elevLon').textContent    = lon.toFixed(6) + '°E';
        document.getElementById('elevLat').textContent    = (lat >= 0 ? lat.toFixed(6) + '°N' : Math.abs(lat).toFixed(6) + '°S');
        popup.style.display = 'block';
        popup.style.left    = Math.min(screenPos.x + 14, window.innerWidth  - 230) + 'px';
        popup.style.top     = Math.min(screenPos.y - 90, window.innerHeight - 140) + 'px';
    }

    // ── TERRAIN PROFILE ───────────────────────────────────────────────────────
    function startProfileTool() {
        if (!viewer) return;
        profileMode = true; profilePoints = [];
        if (profileLineEntity) { viewer.entities.remove(profileLineEntity); profileLineEntity = null; }
        if (profileHandler)    { profileHandler.destroy(); profileHandler = null; }
        const pp = document.getElementById('cesium3dProfilePanel');
        if (pp) pp.style.display = 'none';
        updateToolButtons();
        if (typeof showToast === 'function') showToast('📏 Click two points on the terrain', 'info');

        profileHandler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
        profileHandler.setInputAction(async evt => {
            const ray = viewer.camera.getPickRay(evt.position);
            const pt  = viewer.scene.globe.pick(ray, viewer.scene);
            if (!pt) return;
            const c = Cesium.Cartographic.fromCartesian(pt);
            profilePoints.push({ lon: Cesium.Math.toDegrees(c.longitude), lat: Cesium.Math.toDegrees(c.latitude) });
            if (profilePoints.length === 1) {
                if (typeof showToast === 'function') showToast('Click the second point', 'info');
            } else if (profilePoints.length >= 2) {
                profileHandler.destroy(); profileHandler = null;
                profileMode = false;
                await generateProfile();
                updateToolButtons();
            }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    }

    async function generateProfile() {
        if (!viewer || profilePoints.length < 2) return;
        const [p1, p2] = profilePoints;

        if (profileLineEntity) viewer.entities.remove(profileLineEntity);
        profileLineEntity = viewer.entities.add({
            polyline: {
                positions    : [Cesium.Cartesian3.fromDegrees(p1.lon, p1.lat), Cesium.Cartesian3.fromDegrees(p2.lon, p2.lat)],
                width        : 3,
                material     : new Cesium.PolylineGlowMaterialProperty({ glowPower: 0.2, color: Cesium.Color.fromCssColorString('#38bdf8') }),
                clampToGround: true
            }
        });

        if (typeof showToast === 'function') showToast('⏳ Sampling terrain…', 'info');
        try {
            const N     = CFG.profileSamples;
            const carts = [];
            for (let i = 0; i <= N; i++) {
                const t = i / N;
                carts.push(new Cesium.Cartographic(
                    Cesium.Math.toRadians(p1.lon + (p2.lon - p1.lon) * t),
                    Cesium.Math.toRadians(p1.lat + (p2.lat - p1.lat) * t)
                ));
            }
            const sampled   = await Cesium.sampleTerrainMostDetailed(viewer.terrainProvider, carts);
            const heights   = sampled.map(p => p.height || 0);
            const distances = [0];
            const R = 6371000;
            for (let i = 1; i <= N; i++) {
                const a   = sampled[i - 1], b = sampled[i];
                const dLa = b.latitude  - a.latitude;
                const dLo = b.longitude - a.longitude;
                const h   = Math.sin(dLa / 2) ** 2 + Math.cos(a.latitude) * Math.cos(b.latitude) * Math.sin(dLo / 2) ** 2;
                distances.push(distances[i - 1] + R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h)));
            }
            profileData = { distances, heights, p1, p2 };
            renderProfileChart();
            const pp = document.getElementById('cesium3dProfilePanel');
            if (pp) pp.style.display = 'flex';
        } catch (e) {
            console.warn('[Cesium3D] Profile:', e);
            if (typeof showToast === 'function') showToast('Profile failed', 'error');
        }
    }

    function renderProfileChart() {
        if (!profileData) return;
        const canvas = document.getElementById('cesium3dProfileCanvas');
        if (!canvas) return;
        const W   = canvas.offsetWidth  || 600;
        const H   = canvas.offsetHeight || 160;
        canvas.width = W; canvas.height = H;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, W, H);

        const { distances, heights } = profileData;
        const maxD = distances[distances.length - 1];
        const maxH = Math.max(...heights), minH = Math.min(...heights);
        const rng  = maxH - minH || 1;
        const pad  = { l: 52, r: 12, t: 16, b: 32 };
        const cW   = W - pad.l - pad.r, cH = H - pad.t - pad.b;
        const tx   = d => pad.l + (d / maxD) * cW;
        const ty   = h => pad.t + cH - ((h - minH) / rng) * cH;

        // Grid
        ctx.strokeStyle = 'rgba(56,189,248,0.12)'; ctx.lineWidth = 1;
        for (let i = 0; i <= 4; i++) {
            const y = pad.t + (i / 4) * cH;
            ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(pad.l + cW, y); ctx.stroke();
        }

        // Area fill
        ctx.beginPath();
        heights.forEach((h, i) => i === 0 ? ctx.moveTo(tx(distances[i]), ty(h)) : ctx.lineTo(tx(distances[i]), ty(h)));
        ctx.lineTo(tx(maxD), H - pad.b); ctx.lineTo(pad.l, H - pad.b); ctx.closePath();
        const fg = ctx.createLinearGradient(0, pad.t, 0, H - pad.b);
        fg.addColorStop(0, 'rgba(56,189,248,0.52)'); fg.addColorStop(1, 'rgba(56,189,248,0.04)');
        ctx.fillStyle = fg; ctx.fill();

        // Line
        ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 2.2; ctx.lineJoin = 'round';
        ctx.beginPath();
        heights.forEach((h, i) => i === 0 ? ctx.moveTo(tx(distances[i]), ty(h)) : ctx.lineTo(tx(distances[i]), ty(h)));
        ctx.stroke();

        // Y labels
        ctx.fillStyle = '#94a3b8'; ctx.font = '10px sans-serif'; ctx.textAlign = 'right';
        for (let i = 0; i <= 4; i++) {
            ctx.fillText(Math.round(minH + rng * (4 - i) / 4) + 'm', pad.l - 5, pad.t + (i / 4) * cH + 4);
        }
        // X labels
        ctx.textAlign = 'center';
        for (let i = 0; i <= 4; i++) {
            const d = maxD * i / 4;
            ctx.fillText(d > 1000 ? (d / 1000).toFixed(1) + 'km' : Math.round(d) + 'm', tx(d), H - 9);
        }

        // Stats
        const fmt = v => v > 1000 ? (v / 1000).toFixed(2) + ' km' : Math.round(v) + ' m';
        const setTx = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
        setTx('profileDist',  fmt(maxD));
        setTx('profileMaxH',  Math.round(maxH) + ' m');
        setTx('profileMinH',  Math.round(minH) + ' m');
        setTx('profileRelief', Math.round(maxH - minH) + ' m');
    }

    function exportProfileCsv() {
        if (!profileData) return;
        const { distances, heights } = profileData;
        let csv = 'Distance_m,Elevation_m\n';
        distances.forEach((d, i) => { csv += `${d.toFixed(2)},${(heights[i] || 0).toFixed(2)}\n`; });
        const blob = new Blob([csv], { type: 'text/csv' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob); a.download = 'terrain_profile.csv'; a.click();
        URL.revokeObjectURL(a.href);
    }

    // ── TOOL BUTTON STATES ────────────────────────────────────────────────────
    function updateToolButtons() {
        const states = {
            cesium3dAoiBtn    : aoiMode,
            cesium3dElevBtn   : elevQueryActive,
            cesium3dProfileBtn: profileMode,
            cesium3dTreeBtn   : vegetationEnabled
        };
        Object.entries(states).forEach(([id, active]) => {
            const el = document.getElementById(id);
            if (el) { el.classList.toggle('tool-active', active); el.setAttribute('aria-pressed', String(active)); }
        });
    }

    // ── CAPTURE + PDF ─────────────────────────────────────────────────────────
    function captureViewpoint() {
        if (!viewer) return;
        try {
            const dataUrl = viewer.scene.canvas.toDataURL('image/png');
            const note    = prompt('Capture note:', 'View ' + (captures.length + 1));
            if (note === null) return;
            const cap = {
                image    : dataUrl,
                note     : note || 'View ' + (captures.length + 1),
                timestamp: new Date().toISOString(),
                camera   : { position: viewer.camera.position.clone(), heading: viewer.camera.heading, pitch: viewer.camera.pitch, roll: viewer.camera.roll }
            };
            captures.push(cap);
            updateCaptureStrip();
            const pdfBtn = document.getElementById('cesium3dPdfBtn');
            if (pdfBtn) pdfBtn.disabled = false;
            if (typeof showToast === 'function') showToast('📸 ' + cap.note, 'success');
        } catch (e) { console.error('[Cesium3D] Capture:', e); }
    }

    function updateCaptureStrip() {
        const strip = document.getElementById('cesium3dCaptures');
        if (!strip) return;
        strip.innerHTML = '';
        captures.forEach(cap => {
            const img = document.createElement('img');
            img.src = cap.image; img.className = 'cesium3d-cap-thumb'; img.title = cap.note;
            img.onclick = () => viewer.camera.flyTo({ destination: cap.camera.position, orientation: { heading: cap.camera.heading, pitch: cap.camera.pitch, roll: cap.camera.roll }, duration: 1.5 });
            strip.appendChild(img);
        });
    }

    async function exportPdf() {
        if (captures.length === 0) { if (typeof showToast === 'function') showToast('No captures yet', 'warning'); return; }
        try {
            const { jsPDF } = window.jspdf;
            const doc   = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
            const pW    = doc.internal.pageSize.getWidth();
            const pH    = doc.internal.pageSize.getHeight();
            const proj  = document.getElementById('cesium3dProjectName')?.value  || 'GSPNET Digital Twin';
            const loc   = document.getElementById('cesium3dLocation')?.value      || '';
            const sup   = document.getElementById('cesium3dSupervisor')?.value    || '';
            const sur   = document.getElementById('cesium3dSurveyor')?.value      || '';

            // Cover
            doc.setFillColor(15, 23, 42); doc.rect(0, 0, pW, pH, 'F');
            doc.setTextColor(255, 255, 255); doc.setFontSize(24);
            doc.text('3D Digital Twin — Terrain Report', pW / 2, 42, { align: 'center' });
            doc.setFontSize(14); doc.setTextColor(148, 163, 184);
            doc.text(proj, pW / 2, 58, { align: 'center' });
            if (loc) doc.text('📍 ' + loc, pW / 2, 70, { align: 'center' });
            doc.setFontSize(10); doc.setTextColor(203, 213, 225);
            if (sup) doc.text('Supervisor: ' + sup, pW / 2, 96, { align: 'center' });
            if (sur) doc.text('Surveyor: '   + sur, pW / 2, 106, { align: 'center' });
            doc.text('Date: ' + new Date().toLocaleDateString(), pW / 2, 116, { align: 'center' });
            doc.text('Captured Views: ' + captures.length, pW / 2, 126, { align: 'center' });
            if (aoiBbox) {
                const wk = ((aoiBbox.east - aoiBbox.west) * 111.32).toFixed(1);
                const hk = ((aoiBbox.north - aoiBbox.south) * 111.32).toFixed(1);
                doc.text(`AOI: ${wk} × ${hk} km`, pW / 2, 136, { align: 'center' });
            }
            doc.setFontSize(8); doc.setTextColor(100, 116, 139);
            doc.text('Generated by GSPNET Digital Twin Platform — geospatialnetworkug.xyz', pW / 2, pH - 10, { align: 'center' });

            for (let i = 0; i < captures.length; i++) {
                doc.addPage('landscape');
                doc.setFillColor(248, 250, 252); doc.rect(0, 0, pW, pH, 'F');
                doc.setFillColor(15, 23, 42); doc.rect(0, 0, pW, 15, 'F');
                doc.setTextColor(255, 255, 255); doc.setFontSize(9);
                doc.text(`View ${i + 1}: ${captures[i].note}`, 8, 10);
                doc.setFontSize(7); doc.text(new Date(captures[i].timestamp).toLocaleString(), pW - 8, 10, { align: 'right' });
                doc.addImage(captures[i].image, 'PNG', 8, 18, pW - 16, pH - 36);
                doc.setTextColor(100, 116, 139); doc.setFontSize(7);
                doc.text(proj + ' | GSPNET', 8, pH - 3);
                doc.text('Page ' + (i + 2), pW - 8, pH - 3, { align: 'right' });
            }

            if (profileData) {
                doc.addPage('landscape');
                doc.setFillColor(248, 250, 252); doc.rect(0, 0, pW, pH, 'F');
                doc.setFillColor(15, 23, 42); doc.rect(0, 0, pW, 15, 'F');
                doc.setTextColor(255, 255, 255); doc.setFontSize(9);
                doc.text('Terrain Profile', 8, 10);
                const pc = document.getElementById('cesium3dProfileCanvas');
                if (pc) doc.addImage(pc.toDataURL('image/png'), 'PNG', 8, 20, pW - 16, 80);
                const { distances, heights } = profileData;
                const maxD = distances[distances.length - 1];
                doc.setTextColor(30, 30, 30); doc.setFontSize(9);
                const sy = 110;
                doc.text('Distance: ' + (maxD > 1000 ? (maxD / 1000).toFixed(2) + ' km' : Math.round(maxD) + ' m'), 12, sy);
                doc.text('Max Elev: '  + Math.round(Math.max(...heights)) + ' m', 12, sy + 8);
                doc.text('Min Elev: '  + Math.round(Math.min(...heights)) + ' m', 12, sy + 16);
                doc.text('Relief: '    + Math.round(Math.max(...heights) - Math.min(...heights)) + ' m', 12, sy + 24);
            }

            doc.save((proj.replace(/[^a-zA-Z0-9]/g, '_') || 'GSPNET') + '_3D_Report.pdf');
            if (typeof showToast === 'function') showToast('📄 PDF exported!', 'success');
        } catch (e) {
            console.error('[Cesium3D] PDF:', e);
            if (typeof showToast === 'function') showToast('PDF failed: ' + e.message, 'error');
        }
    }

    // ── CLOSE VIEWER ──────────────────────────────────────────────────────────
    function closeViewer() {
        const overlay = document.getElementById('cesium3dOverlay');
        if (overlay) overlay.classList.remove('active');

        if (aoiHandler)     { aoiHandler.destroy();     aoiHandler     = null; }
        if (elevHandler)    { elevHandler.destroy();     elevHandler    = null; }
        if (profileHandler) { profileHandler.destroy();  profileHandler = null; }
        if (rafId)          { cancelAnimationFrame(rafId); rafId = null; }

        if (viewer) { try { viewer.destroy(); } catch (e) {} viewer = null; }
        currentImageryLayer = null; osmBuildingsTileset = null;
        vegetationCollection = null; aoiPolygonEntity = null; aoiPreviewEntity = null; profileLineEntity = null;
        captures = []; profileData = null;

        const strip = document.getElementById('cesium3dCaptures');    if (strip) strip.innerHTML = '';
        const pdfBtn = document.getElementById('cesium3dPdfBtn');     if (pdfBtn) pdfBtn.disabled = true;
        const pp = document.getElementById('cesium3dProfilePanel');   if (pp) pp.style.display = 'none';
        const ep = document.getElementById('cesium3dElevPopup');      if (ep)  ep.style.display = 'none';
        const badge = document.getElementById('cesium3dAoiBadge');    if (badge) badge.style.display = 'none';
    }

    // ── WIRE CONTROLS ─────────────────────────────────────────────────────────
    function wireControls() {
        // Panel toggle
        const panel = document.getElementById('cesium3dPanel');
        const togglePanel = () => { if (panel) panel.classList.toggle('visible'); };
        const sb  = document.getElementById('cesium3dSettingsBtn');    if (sb)  sb.onclick  = togglePanel;
        const sbb = document.getElementById('cesium3dSettingsBarBtn'); if (sbb) sbb.onclick = togglePanel;
        const pc  = document.getElementById('cesium3dPanelClose');     if (pc)  pc.onclick  = () => panel?.classList.remove('visible');

        // Basemap
        document.querySelectorAll('input[name="cesium3dBasemap"]').forEach(r => {
            r.addEventListener('change', () => {
                if (dtmEnabled) setDtmMode(false);
                switchBasemap(r.value);
            });
        });

        // DTM + Contours
        const dtmCb = document.getElementById('cesium3dDtmToggle');
        if (dtmCb) dtmCb.addEventListener('change', () => setDtmMode(dtmCb.checked));
        const conCb = document.getElementById('cesium3dContourToggle');
        if (conCb) conCb.addEventListener('change', () => setContoursMode(conCb.checked));

        // Contour spacing
        const cSpacing = document.getElementById('cesium3dContourSpacing');
        if (cSpacing) cSpacing.addEventListener('change', () => {
            CFG.contourSpacing = parseFloat(cSpacing.value) || 100;
            if (contoursEnabled || (dtmEnabled && contoursEnabled)) applyGlobeMaterial();
        });

        // OSM Buildings
        const osmCb = document.getElementById('cesium3dOsmBuildings');
        if (osmCb) osmCb.addEventListener('change', () => toggleOsmBuildings(osmCb.checked));

        // Vegetation
        const vegCb = document.getElementById('cesium3dVegetation');
        if (vegCb) vegCb.addEventListener('change', async () => { await toggleVegetation(vegCb.checked); });

        // Layer visibility
        const gn = document.getElementById('cesium3dGspnetLayers');
        if (gn) gn.addEventListener('change', () => toggleLayerVisibility('gspnet-layer', gn.checked));
        const sp = document.getElementById('cesium3dSurveyPolygons');
        if (sp) sp.addEventListener('change', () => toggleLayerVisibility('survey-polygon', sp.checked));

        // Vertical exag
        const ve    = document.getElementById('cesium3dVertExag');
        const veVal = document.getElementById('cesium3dVertExagVal');
        const veBar = document.getElementById('cesium3dVertExagBar');
        const veBarV= document.getElementById('cesium3dVertExagBarVal');
        const syncEx = v => {
            setVerticalExaggeration(v);
            const t = parseFloat(v).toFixed(1) + '×';
            if (veVal)  veVal.textContent  = t;
            if (veBarV) veBarV.textContent = t;
            if (ve)     ve.value           = v;
            if (veBar)  veBar.value        = v;
        };
        if (ve)    ve.addEventListener('input',    () => syncEx(ve.value));
        if (veBar) veBar.addEventListener('input', () => syncEx(veBar.value));

        // Brightness / Contrast / Saturation
        ['Brightness', 'Contrast', 'Saturation'].forEach(prop => {
            const sl = document.getElementById('cesium3d' + prop);
            const vl = document.getElementById('cesium3d' + prop + 'Val');
            if (sl) sl.addEventListener('input', () => {
                setImageryAdjustment(prop.toLowerCase(), sl.value);
                if (vl) vl.textContent = sl.value + '%';
            });
        });

        // Capture + PDF
        const capBtn = document.getElementById('cesium3dCaptureBtn'); if (capBtn) capBtn.onclick = captureViewpoint;
        const pdfBtn = document.getElementById('cesium3dPdfBtn');     if (pdfBtn) pdfBtn.onclick = exportPdf;

        // Reset camera
        const resetBtn = document.getElementById('cesium3dResetBtn');
        if (resetBtn) resetBtn.onclick = () => {
            if (initialCamera) viewer.camera.flyTo({
                destination : initialCamera.position,
                orientation : { heading: initialCamera.heading, pitch: initialCamera.pitch, roll: initialCamera.roll },
                duration    : 1.5
            });
        };

        // Reload layers
        const rlBtn = document.getElementById('cesium3dReloadLayersBtn');
        if (rlBtn) rlBtn.onclick = () => window.cesium3dReloadLayers();

        // Close
        const closeBtn = document.getElementById('cesium3dCloseBtn');
        if (closeBtn) closeBtn.onclick = closeViewer;

        // ── ANALYSIS TOOL BUTTONS ─────────────────────────────────────────────
        const aoiBtn = document.getElementById('cesium3dAoiBtn');
        if (aoiBtn) aoiBtn.onclick = startAoiDraw;

        const clrAoiBtn = document.getElementById('cesium3dClearAoiBtn');
        if (clrAoiBtn) clrAoiBtn.onclick = clearAoi;

        const clrAoiBadgeBtn = document.getElementById('cesium3dAoiBadgeClose');
        if (clrAoiBadgeBtn) clrAoiBadgeBtn.onclick = clearAoi;

        const elevBtn = document.getElementById('cesium3dElevBtn');
        if (elevBtn) elevBtn.onclick = () => toggleElevationQuery(!elevQueryActive);

        const profBtn = document.getElementById('cesium3dProfileBtn');
        if (profBtn) profBtn.onclick = startProfileTool;

        const treeBtn = document.getElementById('cesium3dTreeBtn');
        if (treeBtn) treeBtn.onclick = async () => { await toggleVegetation(!vegetationEnabled); };

        // Profile panel controls
        const ppClose  = document.getElementById('cesium3dProfileClose');
        if (ppClose) ppClose.onclick = () => { const pp = document.getElementById('cesium3dProfilePanel'); if (pp) pp.style.display = 'none'; };
        const ppCsv    = document.getElementById('cesium3dProfileCsvBtn');
        if (ppCsv) ppCsv.onclick = exportProfileCsv;

        // Elevation popup close
        const epClose  = document.getElementById('cesium3dElevClose');
        if (epClose) epClose.onclick = () => toggleElevationQuery(false);

        // Refresh vegetation on camera stop
        viewer.camera.moveEnd.addEventListener(() => { if (vegetationEnabled) loadVegetationForView(); });
    }

    // ── INIT ──────────────────────────────────────────────────────────────────
    document.addEventListener('DOMContentLoaded', function () {
        const btn = document.getElementById('launchCesium3DBtn');
        if (btn) btn.addEventListener('click', () => window.launchCesium3DGlobe());
    });

})();
