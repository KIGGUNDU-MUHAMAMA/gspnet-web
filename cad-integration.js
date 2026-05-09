/**
 * GSPNET CAD Integration Module
 * Handles DXF/DWG drag-and-drop, parsing, map rendering,
 * digitizing tools, and CAD Inspector panel.
 */
(function () {
    'use strict';

    // ── Constants ──────────────────────────────────────────────────────────────
    const UGANDA_CRS = {
        'EPSG:4326':  '+proj=longlat +datum=WGS84 +no_defs',
        'EPSG:32635': '+proj=utm +zone=35 +datum=WGS84 +units=m +no_defs',
        'EPSG:32636': '+proj=utm +zone=36 +datum=WGS84 +units=m +no_defs',
        'EPSG:32735': '+proj=utm +zone=35 +south +datum=WGS84 +units=m +no_defs',
        'EPSG:32736': '+proj=utm +zone=36 +south +datum=WGS84 +units=m +no_defs',
        'EPSG:21095': '+proj=utm +zone=35 +a=6378249.145 +rf=293.465 +towgs84=-160,-6,-302,0,0,0,0 +units=m +no_defs',
        'EPSG:21096': '+proj=utm +zone=36 +a=6378249.145 +rf=293.465 +towgs84=-160,-6,-302,0,0,0,0 +units=m +no_defs',
        'EPSG:21036': '+proj=utm +zone=36 +south +a=6378249.145 +rf=293.465 +towgs84=-160,-6,-302,0,0,0,0 +units=m +no_defs'
    };

    // ── State ──────────────────────────────────────────────────────────────────
    let dxfState = {
        file: null,
        text: null,
        crs: 'EPSG:32636',
        overlayLayer: null,
        overlaySource: null,
        snapInteraction: null,
        drawInteraction: null,
        tracedFeatures: [],
        snapEnabled: true,
        drawActive: false
    };

    // ── Register proj4 defs ────────────────────────────────────────────────────
    function registerProj4() {
        if (typeof proj4 === 'undefined') return;
        Object.entries(UGANDA_CRS).forEach(([code, def]) => {
            try { proj4.defs(code, def); } catch(e) {}
        });
        if (window.ol && ol.proj && ol.proj.proj4 && ol.proj.proj4.register) {
            ol.proj.proj4.register(proj4);
        }
    }

    // ── DXF Parser (minimal, handles LINE, LWPOLYLINE, POLYLINE, SPLINE) ──────
    function parseDXF(text) {
        const features = [];
        const lines = text.split(/\r?\n/);
        let i = 0;

        function peek() { return (lines[i] || '').trim(); }
        function next() { return (lines[i++] || '').trim(); }

        while (i < lines.length) {
            const code = parseInt(next(), 10);
            const val  = next();
            if (code === 0) {
                if (val === 'LINE')       features.push(...parseLine(lines, i));
                if (val === 'LWPOLYLINE') features.push(...parseLWPolyline(lines, i));
                if (val === 'POLYLINE')   features.push(...parsePolyline(lines, i));
            }
        }
        return features;
    }

    function parseLine(lines, start) {
        const coords = {};
        for (let j = start; j < start + 20 && j < lines.length; j += 2) {
            const c = parseInt((lines[j]||'').trim(),10);
            const v = parseFloat((lines[j+1]||'').trim());
            if (c === 10) coords.x1 = v;
            if (c === 20) coords.y1 = v;
            if (c === 11) coords.x2 = v;
            if (c === 21) coords.y2 = v;
            if (c === 0) break;
        }
        if (coords.x1 == null) return [];
        return [{ type:'LineString', coordinates:[[coords.x1,coords.y1],[coords.x2,coords.y2]] }];
    }

    function parseLWPolyline(lines, start) {
        const pts = [];
        let x = null, closed = false;
        for (let j = start; j < start + 2000 && j < lines.length; j += 2) {
            const c = parseInt((lines[j]||'').trim(),10);
            const v = parseFloat((lines[j+1]||'').trim());
            if (c === 70) closed = !!(v & 1);
            if (c === 10) x = v;
            if (c === 20 && x != null) { pts.push([x, v]); x = null; }
            if (c === 0) break;
        }
        if (pts.length < 2) return [];
        if (closed && pts.length >= 3) {
            const ring = [...pts, pts[0]];
            return [{ type:'Polygon', coordinates:[ring] }];
        }
        return [{ type:'LineString', coordinates: pts }];
    }

    function parsePolyline(lines, start) {
        const pts = [];
        let x = null;
        for (let j = start; j < start + 5000 && j < lines.length; j += 2) {
            const c = parseInt((lines[j]||'').trim(),10);
            const v = parseFloat((lines[j+1]||'').trim());
            if (c === 10) x = v;
            if (c === 20 && x != null) { pts.push([x, v]); x = null; }
            if (c === 0 && (lines[j+1]||'').trim() === 'SEQEND') break;
        }
        if (pts.length < 2) return [];
        return [{ type:'LineString', coordinates: pts }];
    }

    // ── Project geometries to EPSG:3857 ───────────────────────────────────────
    function projectGeometries(rawFeatures, sourceCrs) {
        if (typeof proj4 === 'undefined') return rawFeatures;
        const geojsonFeatures = [];
        rawFeatures.forEach(geom => {
            try {
                const projected = projectGeometry(geom, sourceCrs);
                if (projected) geojsonFeatures.push({ type:'Feature', geometry: projected, properties:{} });
            } catch(e) {}
        });
        return geojsonFeatures;
    }

    function projectCoord(xy, sourceCrs) {
        if (sourceCrs === 'EPSG:3857') return xy;
        if (sourceCrs === 'EPSG:4326') return proj4('EPSG:4326','EPSG:3857', xy);
        return proj4(sourceCrs,'EPSG:3857', xy);
    }

    function projectGeometry(geom, crs) {
        if (geom.type === 'LineString') {
            return { type:'LineString', coordinates: geom.coordinates.map(c => projectCoord(c, crs)) };
        }
        if (geom.type === 'Polygon') {
            return { type:'Polygon', coordinates: geom.coordinates.map(ring => ring.map(c => projectCoord(c, crs))) };
        }
        return null;
    }

    // ── Build OL VectorLayer from GeoJSON features ─────────────────────────────
    function buildDXFLayer(geojsonFeatures) {
        const format = new ol.format.GeoJSON();
        const source = new ol.source.Vector({
            features: format.readFeatures({ type:'FeatureCollection', features: geojsonFeatures })
        });
        const layer = new ol.layer.Vector({
            source: source,
            style: new ol.style.Style({
                stroke: new ol.style.Stroke({ color: '#00e5ff', width: 1.5 }),
                fill:   new ol.style.Fill({ color: 'rgba(0,229,255,0.08)' })
            }),
            zIndex: 999
        });
        layer.set('id','dxf-overlay');
        return { layer, source };
    }

    // ── Remove existing DXF overlay ───────────────────────────────────────────
    function removeDXFOverlay() {
        const m = window.map;
        if (!m) return;
        if (dxfState.overlayLayer) {
            m.removeLayer(dxfState.overlayLayer);
            dxfState.overlayLayer = null;
            dxfState.overlaySource = null;
        }
        if (dxfState.snapInteraction) {
            m.removeInteraction(dxfState.snapInteraction);
            dxfState.snapInteraction = null;
        }
        if (dxfState.drawInteraction) {
            m.removeInteraction(dxfState.drawInteraction);
            dxfState.drawInteraction = null;
            dxfState.drawActive = false;
        }
        document.getElementById('dxfOverlayBadge').classList.remove('is-visible');
        document.getElementById('dxf-digitize-toolbar').style.display = 'none';
        document.getElementById('dxf-panel-inspect-btn').style.display = 'none';
        document.getElementById('dxf-panel-filename').textContent = 'No file selected';
        document.getElementById('dxf-panel-status').textContent = '';
        dxfState.tracedFeatures = [];
    }

    // ── Render DXF on map ─────────────────────────────────────────────────────
    function renderDXFOnMap(text, crs, filename) {
        const m = window.map;
        if (!m) { alert('Map not ready. Please try again.'); return false; }

        // Remove previous
        removeDXFOverlay();

        // Parse
        let rawFeatures;
        try { rawFeatures = parseDXF(text); }
        catch(e) { console.error('[DXF] Parse error', e); return false; }

        if (!rawFeatures.length) {
            showDXFStatus('No geometry found in DXF file. Ensure it contains LINE or POLYLINE entities.', 'error');
            return false;
        }

        // Project
        const geojsonFeatures = projectGeometries(rawFeatures, crs);
        if (!geojsonFeatures.length) {
            showDXFStatus('Projection failed. Check coordinate system selection.', 'error');
            return false;
        }

        // Add layer
        const { layer, source } = buildDXFLayer(geojsonFeatures);
        dxfState.overlayLayer = layer;
        dxfState.overlaySource = source;
        m.addLayer(layer);

        // Zoom to extent
        const ext = source.getExtent();
        if (ext && isFinite(ext[0])) {
            m.getView().fit(ext, { padding:[60,60,60,60], duration:800, maxZoom:18 });
        }

        // Add snap interaction
        const snap = new ol.interaction.Snap({ source: source, pixelTolerance: 14 });
        dxfState.snapInteraction = snap;
        m.addInteraction(snap);

        // Show badge
        const badge = document.getElementById('dxfOverlayBadge');
        document.getElementById('dxfOverlayBadgeText').textContent =
            (filename || 'DXF') + ' — ' + geojsonFeatures.length + ' entities';
        badge.classList.add('is-visible');

        // Show toolbar
        document.getElementById('dxf-digitize-toolbar').style.display = 'block';
        document.getElementById('dxf-panel-inspect-btn').style.display = 'block';
        document.getElementById('dxf-panel-filename').textContent = filename || 'drawing.dxf';
        showDXFStatus('✓ ' + geojsonFeatures.length + ' entities rendered on map.', 'success');

        return true;
    }

    function showDXFStatus(msg, type) {
        ['dxf-panel-status','dxf-digitize-status'].forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;
            el.textContent = msg;
            el.style.color = type === 'error' ? '#f87171' : type === 'success' ? '#4ade80' : '#94a3b8';
        });
    }

    // ── CAD Inspector ─────────────────────────────────────────────────────────
    function openCadInspector(filename, fileObjectOrUrl) {
        const panel   = document.getElementById('cadInspectorPanel');
        const frame   = document.getElementById('cadInspectorFrame');
        const loading = document.getElementById('cadInspectorLoading');
        const fnEl    = document.getElementById('cadInspectorFilename');
        const statusEl= document.getElementById('cadInspectorStatus');
        const msgEl   = document.getElementById('cadInspectorLoadingMsg');

        if (!panel) return;

        fnEl.textContent = filename || '—';
        statusEl.textContent = 'Loading…';
        loading.style.display = 'flex';
        frame.src = 'about:blank';
        panel.classList.add('is-open');

        // Build ShareCAD viewer URL using a blob or object URL
        function loadIntoViewer(url) {
            // Use ShareCAD embed (free, no API key required for public URLs)
            // For local blobs we use a direct blob URL in the iframe with a message
            const isBlob = url.startsWith('blob:');
            if (isBlob) {
                // Can't pass blob to external; show embedded fallback message
                loading.style.display = 'flex';
                msgEl.innerHTML =
                    'The file is loaded locally in your browser.<br>' +
                    'To view in the CAD engine, the file needs to be accessible via a public URL.<br><br>' +
                    '<strong style="color:#818cf8;">Tip:</strong> Files uploaded via the DWG &amp; DXF tab are stored in Supabase and can be inspected here.';
                statusEl.textContent = 'Local file';
            } else {
                const viewerUrl = 'https://sharecad.org/cadframe/load?url=' + encodeURIComponent(url);
                frame.src = viewerUrl;
                frame.onload = function() {
                    loading.style.display = 'none';
                    statusEl.textContent = 'Ready';
                };
                msgEl.textContent = 'Connecting to CAD engine…';
            }
        }

        if (typeof fileObjectOrUrl === 'string') {
            loadIntoViewer(fileObjectOrUrl);
        } else if (fileObjectOrUrl instanceof File) {
            const blobUrl = URL.createObjectURL(fileObjectOrUrl);
            loadIntoViewer(blobUrl);
        }
    }

    // ── Map drag-and-drop handler ─────────────────────────────────────────────
    function initMapDropZone() {
        const mapEl = document.getElementById('map');
        if (!mapEl) return;

        mapEl.addEventListener('dragover', e => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; });
        mapEl.addEventListener('dragleave', e => {});
        mapEl.addEventListener('drop', function(e) {
            e.preventDefault();
            const files = e.dataTransfer.files;
            if (!files || !files.length) return;
            const file = files[0];
            const ext  = file.name.split('.').pop().toLowerCase();

            if (ext === 'dxf') {
                dxfState.file = file;
                document.getElementById('dxfDropModalFilename').textContent = file.name;
                document.getElementById('dxfDropModal').classList.add('is-open');
            } else if (ext === 'dwg') {
                dxfState.file = file;
                document.getElementById('dwgDropModalFilename').textContent = file.name;
                document.getElementById('dwgDropModal').classList.add('is-open');
            }
        });
    }

    // ── Read file as text then do action ─────────────────────────────────────
    function readAndAct(file, crs, action) {
        const reader = new FileReader();
        reader.onload = function(ev) {
            dxfState.text = ev.target.result;
            dxfState.crs  = crs;
            if (action === 'preview') {
                renderDXFOnMap(dxfState.text, crs, file.name);
            } else if (action === 'update') {
                renderDXFOnMap(dxfState.text, crs, file.name);
                openGspNetUpdatesDock();
                // Switch to DXF tab in polygon import workflow
                setTimeout(() => {
                    const dxfTab = document.getElementById('importSubTabDxf');
                    if (dxfTab) dxfTab.click();
                }, 600);
            } else if (action === 'inspect') {
                openCadInspector(file.name, file);
            }
        };
        reader.readAsText(file);
    }

    function openGspNetUpdatesDock() {
        const dock = document.getElementById('gspnet-updates-dock');
        if (dock) {
            dock.setAttribute('aria-hidden','false');
            // Trigger Project Info modal
            const btn = document.getElementById('gspnet-updates-toggle');
            if (btn) btn.click();
        }
    }

    // ── Wire DXF Drop Modal buttons ───────────────────────────────────────────
    function initDXFDropModal() {
        const modal = document.getElementById('dxfDropModal');
        if (!modal) return;

        document.getElementById('dxfDropModalClose').addEventListener('click', () => modal.classList.remove('is-open'));
        modal.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('is-open'); });

        document.getElementById('dxfDropPreviewBtn').addEventListener('click', () => {
            const crs = document.getElementById('dxfDropCrsSelect').value;
            if (!crs) { alert('Please select a coordinate system.'); return; }
            modal.classList.remove('is-open');
            readAndAct(dxfState.file, crs, 'preview');
        });

        document.getElementById('dxfDropUpdateBtn').addEventListener('click', () => {
            const crs = document.getElementById('dxfDropCrsSelect').value;
            if (!crs) { alert('Please select a coordinate system.'); return; }
            modal.classList.remove('is-open');
            readAndAct(dxfState.file, crs, 'update');
        });

        document.getElementById('dxfDropInspectBtn').addEventListener('click', () => {
            modal.classList.remove('is-open');
            openCadInspector(dxfState.file.name, dxfState.file);
        });
    }

    // ── Wire DWG Drop Modal ───────────────────────────────────────────────────
    function initDWGDropModal() {
        const modal = document.getElementById('dwgDropModal');
        if (!modal) return;
        document.getElementById('dwgDropModalClose').addEventListener('click', () => modal.classList.remove('is-open'));
        modal.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('is-open'); });
        document.getElementById('dwgDropOpenBtn').addEventListener('click', () => {
            modal.classList.remove('is-open');
            openCadInspector(dxfState.file.name, dxfState.file);
        });
    }

    // ── Wire CAD Inspector Close ──────────────────────────────────────────────
    function initCadInspector() {
        const closeBtn = document.getElementById('cadInspectorClose');
        if (closeBtn) closeBtn.addEventListener('click', () => {
            document.getElementById('cadInspectorPanel').classList.remove('is-open');
            document.getElementById('cadInspectorFrame').src = 'about:blank';
        });
    }

    // ── Wire DXF overlay badge ────────────────────────────────────────────────
    function initOverlayBadge() {
        const btn = document.getElementById('dxfOverlayBadgeClear');
        if (btn) btn.addEventListener('click', removeDXFOverlay);
    }

    // ── Wire Digitizing Toolbar ───────────────────────────────────────────────
    function initDigitizeToolbar() {
        // Snap toggle
        const snapBtn = document.getElementById('dxf-snap-toggle');
        if (snapBtn) snapBtn.addEventListener('click', () => {
            dxfState.snapEnabled = !dxfState.snapEnabled;
            const m = window.map;
            if (m && dxfState.snapInteraction) {
                if (dxfState.snapEnabled) m.addInteraction(dxfState.snapInteraction);
                else m.removeInteraction(dxfState.snapInteraction);
            }
            snapBtn.innerHTML = '<i class="fas fa-magnet"></i> Snap: ' + (dxfState.snapEnabled ? 'ON' : 'OFF');
            snapBtn.style.borderColor = dxfState.snapEnabled ? '#22c55e' : '#475569';
        });

        // Trace polygon
        const traceBtn = document.getElementById('dxf-trace-btn');
        if (traceBtn) traceBtn.addEventListener('click', () => {
            const m = window.map;
            if (!m) return;
            if (dxfState.drawInteraction) { m.removeInteraction(dxfState.drawInteraction); dxfState.drawInteraction = null; }
            if (!dxfState.overlaySource) { showDXFStatus('Load a DXF first.', 'error'); return; }

            // Traced source
            if (!dxfState.tracedSource) {
                dxfState.tracedSource = new ol.source.Vector();
                dxfState.tracedLayer  = new ol.layer.Vector({
                    source: dxfState.tracedSource,
                    style: new ol.style.Style({
                        stroke: new ol.style.Stroke({ color:'#facc15', width:2.5 }),
                        fill:   new ol.style.Fill({ color:'rgba(250,204,21,0.15)' })
                    }),
                    zIndex: 1000
                });
                m.addLayer(dxfState.tracedLayer);
            }

            const draw = new ol.interaction.Draw({ source: dxfState.tracedSource, type:'Polygon' });
            draw.on('drawend', function(evt) {
                dxfState.tracedFeatures.push(evt.feature);
                document.getElementById('dxf-save-traced-btn').disabled = false;
                showDXFStatus('Polygon traced. Click Save Polygon or trace another.', 'success');
                dxfState.drawActive = false;
                traceBtn.style.background = '#1d4ed8';
            });
            draw.on('drawstart', () => { dxfState.drawActive = true; traceBtn.style.background = '#7c3aed'; });
            dxfState.drawInteraction = draw;
            m.addInteraction(draw);
            showDXFStatus('Click corners to trace polygon. Double-click to finish.', '');
        });

        // Clear traced
        const clearBtn = document.getElementById('dxf-clear-trace-btn');
        if (clearBtn) clearBtn.addEventListener('click', () => {
            const m = window.map;
            if (m && dxfState.drawInteraction) { m.removeInteraction(dxfState.drawInteraction); dxfState.drawInteraction = null; }
            if (dxfState.tracedSource) dxfState.tracedSource.clear();
            dxfState.tracedFeatures = [];
            document.getElementById('dxf-save-traced-btn').disabled = true;
            showDXFStatus('Drawing cleared.', '');
        });

        // Save traced polygon
        const saveBtn = document.getElementById('dxf-save-traced-btn');
        if (saveBtn) saveBtn.addEventListener('click', async () => {
            if (!dxfState.tracedFeatures.length) { showDXFStatus('No polygon to save.', 'error'); return; }
            const layer = document.querySelector('input[name="polygonLayer"]:checked');
            if (!layer) { showDXFStatus('Select a target layer first (above).', 'error'); return; }
            showDXFStatus('Saving…', '');
            saveBtn.disabled = true;

            // Convert traced features to WKT / GeoJSON for saving
            const format = new ol.format.GeoJSON();
            const geojson = format.writeFeaturesObject(dxfState.tracedFeatures, {
                featureProjection: 'EPSG:3857', dataProjection: 'EPSG:4326'
            });

            // Delegate to existing polygon save function if available
            if (typeof window.saveDXFTracedPolygons === 'function') {
                await window.saveDXFTracedPolygons(geojson, layer.value);
            } else {
                // Fallback: log and notify
                console.log('[DXF] Traced GeoJSON to save:', geojson, 'Layer:', layer.value);
                showDXFStatus('✓ ' + dxfState.tracedFeatures.length + ' polygon(s) ready. (Connect saveDXFTracedPolygons to persist.)', 'success');
            }
            saveBtn.disabled = false;
        });

        // Remove overlay
        const removeBtn = document.getElementById('dxf-remove-overlay-btn');
        if (removeBtn) removeBtn.addEventListener('click', removeDXFOverlay);

        // CAD Inspector from panel
        const inspectBtn = document.getElementById('dxf-panel-inspect-btn');
        if (inspectBtn) inspectBtn.addEventListener('click', () => {
            if (dxfState.file) openCadInspector(dxfState.file.name, dxfState.file);
        });
    }

    // ── Wire Panel Browse + Sub-tab switcher ──────────────────────────────────
    function initPanelBrowse() {
        const browseBtn = document.getElementById('dxf-panel-browse-btn');
        const fileInput = document.getElementById('dxf-panel-file-input');
        const dropArea  = document.getElementById('dxf-panel-drop-area');

        if (browseBtn && fileInput) {
            browseBtn.addEventListener('click', () => fileInput.click());
            fileInput.addEventListener('change', e => handlePanelFile(e.target.files[0]));
        }
        if (dropArea) {
            dropArea.addEventListener('dragover', e => { e.preventDefault(); dropArea.style.borderColor='#818cf8'; });
            dropArea.addEventListener('dragleave', () => { dropArea.style.borderColor='#6366f1'; });
            dropArea.addEventListener('drop', e => {
                e.preventDefault();
                dropArea.style.borderColor='#6366f1';
                const f = e.dataTransfer.files[0];
                if (f) handlePanelFile(f);
            });
        }

        // Sub-tab switcher
        const csvTab = document.getElementById('importSubTabCsv');
        const dxfTab = document.getElementById('importSubTabDxf');
        const csvPanel = document.getElementById('importPanelCsv');
        const dxfPanel = document.getElementById('importPanelDxf');
        if (csvTab && dxfTab) {
            csvTab.addEventListener('click', () => {
                csvPanel.style.display = 'block'; dxfPanel.style.display = 'none';
                csvTab.style.background = '#3b82f6'; csvTab.style.color = '#fff';
                dxfTab.style.background = '#f3f4f6'; dxfTab.style.color = '#374151';
            });
            dxfTab.addEventListener('click', () => {
                dxfPanel.style.display = 'block'; csvPanel.style.display = 'none';
                dxfTab.style.background = '#6366f1'; dxfTab.style.color = '#fff';
                csvTab.style.background = '#f3f4f6'; csvTab.style.color = '#374151';
            });
        }
    }

    function handlePanelFile(file) {
        if (!file) return;
        const ext = file.name.split('.').pop().toLowerCase();
        if (ext !== 'dxf') { showDXFStatus('Only .dxf files are supported here.', 'error'); return; }
        dxfState.file = file;
        document.getElementById('dxf-panel-filename').textContent = file.name;
        showDXFStatus('File selected. Use the tools above to render on map.', '');

        // Auto-render using the CRS from the polygon import form
        const crsEl = document.getElementById('polygon-crs-confirm');
        const crs   = (crsEl && crsEl.value) ? crsEl.value : 'EPSG:32636';
        const reader = new FileReader();
        reader.onload = ev => {
            dxfState.text = ev.target.result;
            dxfState.crs  = crs;
            renderDXFOnMap(dxfState.text, crs, file.name);
        };
        reader.readAsText(file);
    }

    // ── Bootstrap ─────────────────────────────────────────────────────────────
    function init() {
        registerProj4();
        initMapDropZone();
        initDXFDropModal();
        initDWGDropModal();
        initCadInspector();
        initOverlayBadge();
        initDigitizeToolbar();
        initPanelBrowse();
        console.log('[GSPNET CAD] Integration module ready.');
    }

    // Wait for map to be available
    function waitForMap() {
        if (typeof window.map !== 'undefined' && window.map) {
            init();
        } else {
            setTimeout(waitForMap, 500);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', waitForMap);
    } else {
        waitForMap();
    }

})();
