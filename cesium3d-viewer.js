// ============================================================
// CESIUM 3D GLOBE VIEWER MODULE  (cesium3d-viewer.js)
// GSP.NET Platform — Professional 3D Terrain Visualization
// ============================================================
(function () {
    'use strict';

    // --- State ---
    let viewer = null;
    let initialCamera = null;
    let captures = [];
    let osmBuildingsTileset = null;
    let currentImageryLayer = null;
    const CESIUM_ION_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI2ZjBiZjk2OC1mMDM2LTRkNTktODcxMi01MGEzMWYyNDNkZDAiLCJpZCI6MjkwMTYwLCJpYXQiOjE3NDYxMjcwNTl9.GJTNeQr1r6yOVfByD-YkbEiQOKH1drdHyi-UrMed0Qs';

    // --- Basemap providers ---
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
        'bing-aerial': () => Cesium.BingMapsImageryProvider.fromUrl(
            'https://dev.virtualearth.net', { mapStyle: Cesium.BingMapsStyle.AERIAL_WITH_LABELS }
        )
    };

    // ========== PUBLIC: Launch 3D Globe ==========
    window.launchCesium3DGlobe = async function () {
        const overlay = document.getElementById('cesium3dOverlay');
        if (!overlay) return;
        overlay.classList.add('active');

        // Hide the project modal
        const modal = document.getElementById('terrainProjectModal');
        if (modal) modal.classList.remove('show');

        const loading = document.getElementById('cesium3dLoading');
        const statusEl = document.getElementById('cesium3dLoadingStatus');
        if (loading) loading.classList.remove('hidden');

        try {
            if (statusEl) statusEl.textContent = 'Setting up Cesium Ion…';
            Cesium.Ion.defaultAccessToken = CESIUM_ION_TOKEN;

            if (statusEl) statusEl.textContent = 'Loading Cesium World Terrain…';
            const terrainProvider = await Cesium.CesiumTerrainProvider.fromIonAssetId(1, {
                requestVertexNormals: true,
                requestWaterMask: true
            });

            if (statusEl) statusEl.textContent = 'Initializing 3D Viewer…';

            // Destroy previous viewer if exists
            if (viewer) {
                try { viewer.destroy(); } catch (e) { /* ignore */ }
                viewer = null;
            }

            // Clear container
            const container = document.getElementById('cesium3dContainer');
            const existingWidget = container.querySelector('.cesium-viewer');
            if (existingWidget) existingWidget.remove();

            viewer = new Cesium.Viewer('cesium3dContainer', {
                terrainProvider: terrainProvider,
                baseLayerPicker: false,
                geocoder: false,
                homeButton: false,
                sceneModePicker: false,
                selectionIndicator: false,
                timeline: false,
                animation: false,
                fullscreenButton: false,
                navigationHelpButton: false,
                infoBox: false,
                creditContainer: document.createElement('div'),
                contextOptions: { webgl: { preserveDrawingBuffer: true } },
                msaaSamples: 4
            });

            // Remove default imagery and add Esri satellite
            viewer.imageryLayers.removeAll();
            const provider = BASEMAPS['esri-satellite']();
            currentImageryLayer = viewer.imageryLayers.addImageryProvider(provider);

            // Enable depth testing
            viewer.scene.globe.depthTestAgainstTerrain = true;

            // Fly to current map extent
            if (statusEl) statusEl.textContent = 'Flying to current map extent…';
            await flyToMapExtent();

            // Store initial camera
            initialCamera = {
                position: viewer.camera.position.clone(),
                heading: viewer.camera.heading,
                pitch: viewer.camera.pitch,
                roll: viewer.camera.roll
            };

            // Add vector layers
            if (statusEl) statusEl.textContent = 'Overlaying map layers…';
            addVectorLayers();

            // Hide loading
            if (loading) loading.classList.add('hidden');

            // Wire up controls
            wireControls();

            if (typeof showToast === 'function') {
                showToast('3D Globe loaded successfully', 'success');
            }

        } catch (err) {
            console.error('Cesium 3D Globe error:', err);
            if (loading) loading.classList.add('hidden');
            if (typeof showToast === 'function') {
                showToast('Error loading 3D Globe: ' + err.message, 'error');
            }
        }
    };

    // ========== Fly to current OL map extent ==========
    async function flyToMapExtent() {
        if (!viewer || typeof map === 'undefined') return;

        try {
            const olView = map.getView();
            const extent = olView.calculateExtent(map.getSize());
            // Transform from EPSG:3857 to EPSG:4326
            const lonLatExtent = ol.proj.transformExtent(extent, 'EPSG:3857', 'EPSG:4326');

            const west = lonLatExtent[0];
            const south = lonLatExtent[1];
            const east = lonLatExtent[2];
            const north = lonLatExtent[3];

            const rect = Cesium.Rectangle.fromDegrees(west, south, east, north);

            viewer.camera.flyTo({
                destination: rect,
                orientation: {
                    heading: 0.0,
                    pitch: Cesium.Math.toRadians(-45),
                    roll: 0.0
                },
                duration: 2.0
            });

            // Wait for flight to complete
            await new Promise(r => setTimeout(r, 2500));
        } catch (e) {
            console.warn('Could not fly to map extent:', e);
            // Fallback: fly to Uganda
            viewer.camera.flyTo({
                destination: Cesium.Rectangle.fromDegrees(29.5, -1.5, 35.0, 4.5),
                duration: 2.0
            });
            await new Promise(r => setTimeout(r, 2500));
        }
    }

    // ========== Add vector layers (GSPNET, survey polygons) ==========
    function addVectorLayers() {
        if (!viewer || typeof map === 'undefined') return;

        try {
            const layers = map.getLayers().getArray();
            layers.forEach(layer => {
                if (!layer.getVisible()) return;
                const title = (layer.get('title') || layer.get('name') || '').toLowerCase();
                const source = layer.getSource && layer.getSource();

                // Look for WMS/tile layers (GSPNET/NLIS)
                if (source && (title.includes('gspnet') || title.includes('nlis') ||
                    title.includes('control') || title.includes('cadastr'))) {
                    addWmsLayerToCesium(layer);
                }

                // Look for vector layers (survey polygons)
                if (source && typeof source.getFeatures === 'function') {
                    const features = source.getFeatures();
                    if (features.length > 0) {
                        addVectorFeaturesToCesium(features, title);
                    }
                }
            });
        } catch (e) {
            console.warn('Error adding vector layers:', e);
        }
    }

    function addWmsLayerToCesium(olLayer) {
        try {
            const source = olLayer.getSource();
            const params = source.getParams ? source.getParams() : null;
            const urls = source.getUrls ? source.getUrls() : null;
            const url = urls && urls.length > 0 ? urls[0] : (source.getUrl ? source.getUrl() : null);

            if (url && params) {
                const wmsProvider = new Cesium.WebMapServiceImageryProvider({
                    url: url,
                    layers: params.LAYERS || params.layers || '',
                    parameters: { transparent: true, format: 'image/png', ...params },
                    credit: new Cesium.Credit('GSPNET')
                });
                viewer.imageryLayers.addImageryProvider(wmsProvider);
            }
        } catch (e) {
            console.warn('Could not add WMS layer:', e);
        }
    }

    function addVectorFeaturesToCesium(features, layerTitle) {
        try {
            features.forEach(feature => {
                const geom = feature.getGeometry();
                if (!geom) return;

                const type = geom.getType();
                if (type === 'Polygon' || type === 'MultiPolygon') {
                    const coords = type === 'Polygon' ? [geom.getCoordinates()] : geom.getCoordinates();
                    coords.forEach(polygonCoords => {
                        const ring = polygonCoords[0];
                        const positions = ring.map(c => {
                            const ll = ol.proj.transform(c, 'EPSG:3857', 'EPSG:4326');
                            return Cesium.Cartesian3.fromDegrees(ll[0], ll[1]);
                        });

                        viewer.entities.add({
                            polygon: {
                                hierarchy: new Cesium.PolygonHierarchy(positions),
                                material: Cesium.Color.fromCssColorString('#3b82f6').withAlpha(0.35),
                                outline: true,
                                outlineColor: Cesium.Color.fromCssColorString('#1d4ed8'),
                                outlineWidth: 2,
                                classificationType: Cesium.ClassificationType.TERRAIN,
                                heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
                            },
                            properties: {
                                title: feature.get('name') || feature.get('title') || layerTitle,
                                layerType: 'survey-polygon'
                            }
                        });
                    });
                } else if (type === 'Point') {
                    const coords = geom.getCoordinates();
                    const ll = ol.proj.transform(coords, 'EPSG:3857', 'EPSG:4326');
                    viewer.entities.add({
                        position: Cesium.Cartesian3.fromDegrees(ll[0], ll[1]),
                        point: {
                            pixelSize: 8,
                            color: Cesium.Color.fromCssColorString('#ef4444'),
                            outlineColor: Cesium.Color.WHITE,
                            outlineWidth: 2,
                            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
                        },
                        properties: {
                            title: feature.get('name') || feature.get('point_id') || layerTitle,
                            layerType: 'gspnet-point'
                        }
                    });
                }
            });
        } catch (e) {
            console.warn('Could not add vector features:', e);
        }
    }

    // ========== Switch basemap ==========
    function switchBasemap(key) {
        if (!viewer) return;
        try {
            if (currentImageryLayer) {
                viewer.imageryLayers.remove(currentImageryLayer, false);
            }
            const factory = BASEMAPS[key];
            if (!factory) return;
            const result = factory();
            // Handle promise-based providers (Bing)
            if (result instanceof Promise || (result && typeof result.then === 'function')) {
                result.then(provider => {
                    currentImageryLayer = viewer.imageryLayers.addImageryProvider(provider, 0);
                });
            } else {
                currentImageryLayer = viewer.imageryLayers.addImageryProvider(result, 0);
            }
        } catch (e) {
            console.warn('Basemap switch error:', e);
        }
    }

    // ========== Vertical exaggeration ==========
    function setVerticalExaggeration(val) {
        if (!viewer) return;
        viewer.scene.verticalExaggeration = parseFloat(val);
    }

    // ========== Visual adjustments ==========
    function setImageryAdjustment(prop, val) {
        if (!viewer || !currentImageryLayer) return;
        const v = parseFloat(val) / 100;
        switch (prop) {
            case 'brightness': currentImageryLayer.brightness = v; break;
            case 'contrast': currentImageryLayer.contrast = v; break;
            case 'saturation': currentImageryLayer.saturation = v; break;
        }
    }

    // ========== Capture viewpoint ==========
    function captureViewpoint() {
        if (!viewer) return;
        try {
            const canvas = viewer.scene.canvas;
            const dataUrl = canvas.toDataURL('image/png');
            const note = prompt('Add a note for this viewpoint capture:', 'Viewpoint ' + (captures.length + 1));
            if (note === null) return; // cancelled

            const capture = {
                image: dataUrl,
                note: note || 'Viewpoint ' + (captures.length + 1),
                timestamp: new Date().toISOString(),
                camera: {
                    position: viewer.camera.position.clone(),
                    heading: viewer.camera.heading,
                    pitch: viewer.camera.pitch,
                    roll: viewer.camera.roll
                }
            };
            captures.push(capture);
            updateCaptureStrip();

            // Enable PDF button
            const pdfBtn = document.getElementById('cesium3dPdfBtn');
            if (pdfBtn) pdfBtn.disabled = false;

            if (typeof showToast === 'function') {
                showToast('Viewpoint captured: ' + capture.note, 'success');
            }
        } catch (e) {
            console.error('Capture error:', e);
        }
    }

    function updateCaptureStrip() {
        const strip = document.getElementById('cesium3dCaptures');
        if (!strip) return;
        strip.innerHTML = '';
        captures.forEach((cap, i) => {
            const img = document.createElement('img');
            img.src = cap.image;
            img.className = 'cesium3d-cap-thumb';
            img.title = cap.note;
            img.addEventListener('click', () => {
                // Fly back to captured viewpoint
                viewer.camera.flyTo({
                    destination: cap.camera.position,
                    orientation: {
                        heading: cap.camera.heading,
                        pitch: cap.camera.pitch,
                        roll: cap.camera.roll
                    },
                    duration: 1.5
                });
            });
            strip.appendChild(img);
        });
    }

    // ========== Export 3D PDF ==========
    async function exportPdf() {
        if (captures.length === 0) {
            if (typeof showToast === 'function') showToast('No viewpoints captured yet', 'warning');
            return;
        }

        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
            const pageW = doc.internal.pageSize.getWidth();
            const pageH = doc.internal.pageSize.getHeight();

            // Get project info
            const projectName = document.getElementById('cesium3dProjectName')?.value || 'Untitled Project';
            const location = document.getElementById('cesium3dLocation')?.value || '';
            const supervisor = document.getElementById('cesium3dSupervisor')?.value || '';
            const surveyor = document.getElementById('cesium3dSurveyor')?.value || '';

            // Title page
            doc.setFillColor(15, 23, 42);
            doc.rect(0, 0, pageW, pageH, 'F');

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(28);
            doc.text('3D Terrain Visualization Report', pageW / 2, 50, { align: 'center' });

            doc.setFontSize(16);
            doc.setTextColor(148, 163, 184);
            doc.text(projectName, pageW / 2, 70, { align: 'center' });
            if (location) doc.text('Location: ' + location, pageW / 2, 82, { align: 'center' });

            doc.setFontSize(11);
            doc.setTextColor(203, 213, 225);
            const infoY = 110;
            if (supervisor) doc.text('Supervisor: ' + supervisor, pageW / 2, infoY, { align: 'center' });
            if (surveyor) doc.text('Surveyor: ' + surveyor, pageW / 2, infoY + 10, { align: 'center' });
            doc.text('Date: ' + new Date().toLocaleDateString(), pageW / 2, infoY + 20, { align: 'center' });
            doc.text('Captures: ' + captures.length, pageW / 2, infoY + 30, { align: 'center' });

            doc.setFontSize(9);
            doc.setTextColor(100, 116, 139);
            doc.text('Generated by GSP.NET 3D Globe Viewer', pageW / 2, pageH - 15, { align: 'center' });

            // Capture pages
            for (let i = 0; i < captures.length; i++) {
                doc.addPage('landscape');
                doc.setFillColor(248, 250, 252);
                doc.rect(0, 0, pageW, pageH, 'F');

                // Header bar
                doc.setFillColor(15, 23, 42);
                doc.rect(0, 0, pageW, 18, 'F');
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(11);
                doc.text(`Viewpoint ${i + 1} of ${captures.length}: ${captures[i].note}`, 10, 12);
                doc.setFontSize(8);
                doc.text(new Date(captures[i].timestamp).toLocaleString(), pageW - 10, 12, { align: 'right' });

                // Image
                const imgW = pageW - 20;
                const imgH = pageH - 40;
                doc.addImage(captures[i].image, 'PNG', 10, 22, imgW, imgH);

                // Footer
                doc.setTextColor(100, 116, 139);
                doc.setFontSize(8);
                doc.text(projectName + ' | GSP.NET 3D Report', 10, pageH - 5);
                doc.text(`Page ${i + 2}`, pageW - 10, pageH - 5, { align: 'right' });
            }

            doc.save(`${projectName.replace(/[^a-zA-Z0-9]/g, '_')}_3D_Report.pdf`);
            if (typeof showToast === 'function') showToast('3D PDF Report exported!', 'success');
        } catch (e) {
            console.error('PDF export error:', e);
            if (typeof showToast === 'function') showToast('PDF export failed: ' + e.message, 'error');
        }
    }

    // ========== Toggle OSM Buildings ==========
    async function toggleOsmBuildings(enabled) {
        if (!viewer) return;
        if (enabled) {
            try {
                osmBuildingsTileset = await Cesium.Cesium3DTileset.fromIonAssetId(96188);
                viewer.scene.primitives.add(osmBuildingsTileset);
            } catch (e) {
                console.warn('Could not load OSM buildings:', e);
            }
        } else {
            if (osmBuildingsTileset) {
                viewer.scene.primitives.remove(osmBuildingsTileset);
                osmBuildingsTileset = null;
            }
        }
    }

    // ========== Toggle layer visibility ==========
    function toggleLayerVisibility(layerType, visible) {
        if (!viewer) return;
        viewer.entities.values.forEach(entity => {
            const props = entity.properties;
            if (props && props.layerType && props.layerType.getValue() === layerType) {
                entity.show = visible;
            }
        });
    }

    // ========== Close viewer ==========
    function closeViewer() {
        const overlay = document.getElementById('cesium3dOverlay');
        if (overlay) overlay.classList.remove('active');

        if (viewer) {
            try { viewer.destroy(); } catch (e) { /* ignore */ }
            viewer = null;
        }
        currentImageryLayer = null;
        osmBuildingsTileset = null;
        captures = [];

        const strip = document.getElementById('cesium3dCaptures');
        if (strip) strip.innerHTML = '';
        const pdfBtn = document.getElementById('cesium3dPdfBtn');
        if (pdfBtn) pdfBtn.disabled = true;
    }

    // ========== Wire all controls ==========
    function wireControls() {
        // Settings panel toggle
        const settingsBtn = document.getElementById('cesium3dSettingsBtn');
        const settingsBarBtn = document.getElementById('cesium3dSettingsBarBtn');
        const panel = document.getElementById('cesium3dPanel');
        const panelClose = document.getElementById('cesium3dPanelClose');

        function togglePanel() {
            if (panel) panel.classList.toggle('visible');
        }
        if (settingsBtn) settingsBtn.onclick = togglePanel;
        if (settingsBarBtn) settingsBarBtn.onclick = togglePanel;
        if (panelClose) panelClose.onclick = () => panel.classList.remove('visible');

        // Basemap radio buttons
        document.querySelectorAll('input[name="cesium3dBasemap"]').forEach(radio => {
            radio.addEventListener('change', () => switchBasemap(radio.value));
        });

        // OSM Buildings
        const osmBldg = document.getElementById('cesium3dOsmBuildings');
        if (osmBldg) osmBldg.addEventListener('change', () => toggleOsmBuildings(osmBldg.checked));

        // Layer toggles
        const gspnetToggle = document.getElementById('cesium3dGspnetLayers');
        if (gspnetToggle) gspnetToggle.addEventListener('change', () =>
            toggleLayerVisibility('gspnet-point', gspnetToggle.checked));

        const polyToggle = document.getElementById('cesium3dSurveyPolygons');
        if (polyToggle) polyToggle.addEventListener('change', () =>
            toggleLayerVisibility('survey-polygon', polyToggle.checked));

        // Vertical exaggeration (panel)
        const vertExag = document.getElementById('cesium3dVertExag');
        const vertExagVal = document.getElementById('cesium3dVertExagVal');
        const vertExagBar = document.getElementById('cesium3dVertExagBar');
        const vertExagBarVal = document.getElementById('cesium3dVertExagBarVal');

        function syncExag(val) {
            setVerticalExaggeration(val);
            if (vertExagVal) vertExagVal.textContent = parseFloat(val).toFixed(1) + '×';
            if (vertExagBarVal) vertExagBarVal.textContent = parseFloat(val).toFixed(1) + '×';
            if (vertExag) vertExag.value = val;
            if (vertExagBar) vertExagBar.value = val;
        }
        if (vertExag) vertExag.addEventListener('input', () => syncExag(vertExag.value));
        if (vertExagBar) vertExagBar.addEventListener('input', () => syncExag(vertExagBar.value));

        // Brightness/Contrast/Saturation
        ['Brightness', 'Contrast', 'Saturation'].forEach(prop => {
            const slider = document.getElementById('cesium3d' + prop);
            const valEl = document.getElementById('cesium3d' + prop + 'Val');
            if (slider) {
                slider.addEventListener('input', () => {
                    setImageryAdjustment(prop.toLowerCase(), slider.value);
                    if (valEl) valEl.textContent = slider.value + '%';
                });
            }
        });

        // Capture
        const captureBtn = document.getElementById('cesium3dCaptureBtn');
        if (captureBtn) captureBtn.onclick = captureViewpoint;

        // PDF export
        const pdfBtn = document.getElementById('cesium3dPdfBtn');
        if (pdfBtn) pdfBtn.onclick = exportPdf;

        // Reset camera
        const resetBtn = document.getElementById('cesium3dResetBtn');
        if (resetBtn) resetBtn.onclick = () => {
            if (initialCamera) {
                viewer.camera.flyTo({
                    destination: initialCamera.position,
                    orientation: {
                        heading: initialCamera.heading,
                        pitch: initialCamera.pitch,
                        roll: initialCamera.roll
                    },
                    duration: 1.5
                });
            }
        };

        // Close
        const closeBtn = document.getElementById('cesium3dCloseBtn');
        if (closeBtn) closeBtn.onclick = closeViewer;
    }

    // ========== Init: Wire launch button ==========
    document.addEventListener('DOMContentLoaded', function () {
        const launchBtn = document.getElementById('launchCesium3DBtn');
        if (launchBtn) {
            launchBtn.addEventListener('click', function () {
                window.launchCesium3DGlobe();
            });
        }
    });

})();
