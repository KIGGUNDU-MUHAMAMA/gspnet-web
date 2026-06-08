/**
 * GIS Export Engine — Extractor tool
 * Raster (PNG/JPG + world files), vector (DXF/GeoJSON/KML), survey CSV deliverables
 */
(function (global) {
    'use strict';

    const MAX_EXPORT_M = 1000;
    const SESSION_KEY = 'gspnet_gis_export_prefs';

    const EXPORT_FORMATS = {
        png: { id: 'png', label: 'PNG + PGW + PRJ', icon: 'fa-file-image', group: 'raster', ext: 'png', mime: 'image/png' },
        jpg: { id: 'jpg', label: 'JPG + JGW + PRJ', icon: 'fa-file-image', group: 'raster', ext: 'jpg', mime: 'image/jpeg' },
        dxf: { id: 'dxf', label: 'DXF (CAD)', icon: 'fa-drafting-compass', group: 'vector', ext: 'dxf', mime: 'application/dxf' },
        geojson: { id: 'geojson', label: 'GeoJSON', icon: 'fa-code', group: 'vector', ext: 'geojson', mime: 'application/geo+json' },
        kml: { id: 'kml', label: 'KML', icon: 'fa-globe-africa', group: 'vector', ext: 'kml', mime: 'application/vnd.google-earth.kml+xml' }
    };

    const DPI_MAP = { low: 96, medium: 150, high: 300 };

    const PRJ_WKT = {
        'EPSG:4326': 'GEOGCS["WGS 84",DATUM["WGS_1984",SPHEROID["WGS 84",6378137,298.257223563]],PRIMEM["Greenwich",0],UNIT["degree",0.0174532925199433],AUTHORITY["EPSG","4326"]]',
        'EPSG:3857': 'PROJCS["WGS 84 / Pseudo-Mercator",GEOGCS["WGS 84",DATUM["WGS_1984",SPHEROID["WGS 84",6378137,298.257223563]],PRIMEM["Greenwich",0],UNIT["degree",0.0174532925199433]],PROJECTION["Mercator_1SP"],PARAMETER["central_meridian",0],PARAMETER["scale_factor",1],PARAMETER["false_easting",0],PARAMETER["false_northing",0],UNIT["metre",1],AXIS["X",EAST],AXIS["Y",NORTH]]',
        'EPSG:32635': 'PROJCS["WGS 84 / UTM zone 35N",GEOGCS["WGS 84",DATUM["WGS_1984",SPHEROID["WGS 84",6378137,298.257223563]],PRIMEM["Greenwich",0],UNIT["degree",0.0174532925199433]],PROJECTION["Transverse_Mercator"],PARAMETER["latitude_of_origin",0],PARAMETER["central_meridian",27],PARAMETER["scale_factor",0.9996],PARAMETER["false_easting",500000],PARAMETER["false_northing",0],UNIT["metre",1],AXIS["Easting",EAST],AXIS["Northing",NORTH]]',
        'EPSG:32636': 'PROJCS["WGS 84 / UTM zone 36N",GEOGCS["WGS 84",DATUM["WGS_1984",SPHEROID["WGS 84",6378137,298.257223563]],PRIMEM["Greenwich",0],UNIT["degree",0.0174532925199433]],PROJECTION["Transverse_Mercator"],PARAMETER["latitude_of_origin",0],PARAMETER["central_meridian",33],PARAMETER["scale_factor",0.9996],PARAMETER["false_easting",500000],PARAMETER["false_northing",0],UNIT["metre",1],AXIS["Easting",EAST],AXIS["Northing",NORTH]]',
        'EPSG:32735': 'PROJCS["WGS 84 / UTM zone 35S",GEOGCS["WGS 84",DATUM["WGS_1984",SPHEROID["WGS 84",6378137,298.257223563]],PRIMEM["Greenwich",0],UNIT["degree",0.0174532925199433]],PROJECTION["Transverse_Mercator"],PARAMETER["latitude_of_origin",0],PARAMETER["central_meridian",27],PARAMETER["scale_factor",0.9996],PARAMETER["false_easting",500000],PARAMETER["false_northing",10000000],UNIT["metre",1],AXIS["Easting",EAST],AXIS["Northing",NORTH]]',
        'EPSG:32736': 'PROJCS["WGS 84 / UTM zone 36S",GEOGCS["WGS 84",DATUM["WGS_1984",SPHEROID["WGS 84",6378137,298.257223563]],PRIMEM["Greenwich",0],UNIT["degree",0.0174532925199433]],PROJECTION["Transverse_Mercator"],PARAMETER["latitude_of_origin",0],PARAMETER["central_meridian",33],PARAMETER["scale_factor",0.9996],PARAMETER["false_easting",500000],PARAMETER["false_northing",10000000],UNIT["metre",1],AXIS["Easting",EAST],AXIS["Northing",NORTH]]',
        'EPSG:21095': 'PROJCS["Arc 1960 / UTM zone 35N",GEOGCS["Arc 1960",DATUM["Arc_1960",SPHEROID["Clarke 1880 (RGS)",6378249.145,293.465]],PRIMEM["Greenwich",0],UNIT["degree",0.0174532925199433]],PROJECTION["Transverse_Mercator"],PARAMETER["latitude_of_origin",0],PARAMETER["central_meridian",27],PARAMETER["scale_factor",0.9996],PARAMETER["false_easting",500000],PARAMETER["false_northing",0],UNIT["metre",1]]',
        'EPSG:21096': 'PROJCS["Arc 1960 / UTM zone 36N",GEOGCS["Arc 1960",DATUM["Arc_1960",SPHEROID["Clarke 1880 (RGS)",6378249.145,293.465]],PRIMEM["Greenwich",0],UNIT["degree",0.0174532925199433]],PROJECTION["Transverse_Mercator"],PARAMETER["latitude_of_origin",0],PARAMETER["central_meridian",33],PARAMETER["scale_factor",0.9996],PARAMETER["false_easting",500000],PARAMETER["false_northing",0],UNIT["metre",1]]',
        'EPSG:21036': 'PROJCS["Arc 1960 / UTM zone 36S",GEOGCS["Arc 1960",DATUM["Arc_1960",SPHEROID["Clarke 1880 (RGS)",6378249.145,293.465]],PRIMEM["Greenwich",0],UNIT["degree",0.0174532925199433]],PROJECTION["Transverse_Mercator"],PARAMETER["latitude_of_origin",0],PARAMETER["central_meridian",33],PARAMETER["scale_factor",0.9996],PARAMETER["false_easting",500000],PARAMETER["false_northing",10000000],UNIT["metre",1]]'
    };

    const CRS_NAMES = {
        'EPSG:4326': 'WGS 84 (Geographic)',
        'EPSG:3857': 'Web Mercator',
        'EPSG:32635': 'UTM Zone 35N (WGS 84)',
        'EPSG:32636': 'UTM Zone 36N (WGS 84)',
        'EPSG:32735': 'UTM Zone 35S (WGS 84)',
        'EPSG:32736': 'UTM Zone 36S (WGS 84)',
        'EPSG:21095': 'UTM Zone 35N (Arc 1960)',
        'EPSG:21096': 'UTM Zone 36N (Arc 1960)',
        'EPSG:21036': 'UTM Zone 36S (Arc 1960)'
    };

    function sanitizeCadLayer(name) {
        let s = (name || 'GSPNET_MISC').toString().toUpperCase().replace(/[^A-Z0-9_]/g, '_').replace(/_+/g, '_');
        if (s.length > 31) s = s.slice(0, 31);
        return s || 'GSPNET_MISC';
    }

    function geomSuffix(type) {
        if (type === 'Polygon' || type === 'MultiPolygon') return '_PLGN';
        if (type === 'Point' || type === 'MultiPoint') return '_PT';
        return '_LINE';
    }

    function cadLayerForFeature(feature, layerTitle, contourLayer) {
        const title = (layerTitle || feature.get('__layerTitle') || '').toString();
        if (contourLayer && title.toLowerCase().includes('contour')) {
            const elev = feature.get('elevation') || feature.get('elev');
            const isMajor = feature.get('major') || (elev && Number(elev) % 25 === 0);
            return isMajor ? 'CONTOURS_MAJOR' : 'CONTOURS_MINOR';
        }
        const base = sanitizeCadLayer(title || 'GSPNET_MISC');
        const gt = feature.getGeometry().getType();
        return base + geomSuffix(gt);
    }

    function cloneLayerForRasterExport(layer, skipLayer) {
        if (!layer || layer === skipLayer || !layer.getVisible()) return null;

        if (layer instanceof ol.layer.Group) {
            const children = [];
            layer.getLayers().forEach((child) => {
                const cloned = cloneLayerForRasterExport(child, skipLayer);
                if (cloned) children.push(cloned);
            });
            if (!children.length) return null;
            return new ol.layer.Group({ layers: children, zIndex: layer.getZIndex() });
        }

        const base = {
            opacity: layer.getOpacity(),
            visible: true,
            zIndex: layer.getZIndex()
        };

        if (layer instanceof ol.layer.Tile) {
            const source = layer.getSource();
            let newSource = source;
            if (source instanceof ol.source.XYZ) {
                const url = source.getUrls() ? source.getUrls()[0] : source.getUrl();
                
                let mz = typeof source.getMaxZoom === 'function' ? source.getMaxZoom() : undefined;
                if (mz === undefined && typeof source.getTileGrid === 'function') {
                    const tg = source.getTileGrid();
                    if (tg && typeof tg.getMaxZoom === 'function') mz = tg.getMaxZoom();
                }
                
                // Default maxZoom limits to prevent "Map data not available" tiles on high-res exports
                if (mz === undefined || mz === 42) {
                    if (url && url.includes('arcgisonline.com')) mz = 19;
                    if (url && url.includes('mt1.google.com')) mz = 20;
                }

                // Force a fresh source instance to avoid CORS/Cache conflicts when sharing sources between maps
                newSource = new ol.source.XYZ({
                    url: url,
                    attributions: source.getAttributions(),
                    crossOrigin: 'anonymous',
                    maxZoom: mz,
                    minZoom: typeof source.getMinZoom === 'function' ? source.getMinZoom() : undefined,
                    transition: 0 // No fade-in during export
                });
            }
            return new ol.layer.Tile(Object.assign({ source: newSource }, base));
        }
        if (layer instanceof ol.layer.VectorImage) {
            return new ol.layer.VectorImage(
                Object.assign({ source: layer.getSource(), style: layer.getStyle(), declutter: true }, base)
            );
        }
        if (layer instanceof ol.layer.Vector) {
            return new ol.layer.Vector(Object.assign({ source: layer.getSource(), style: layer.getStyle() }, base));
        }
        if (layer instanceof ol.layer.Image) {
            return new ol.layer.Image(Object.assign({ source: layer.getSource() }, base));
        }
        return null;
    }

    function waitForMapRenderComplete(map, minFrames, maxWaitMs) {
        minFrames = minFrames || 2;
        maxWaitMs = maxWaitMs || 10000;
        return new Promise((resolve) => {
            let frames = 0;
            const started = Date.now();
            const onComplete = function () {
                frames++;
                map.renderSync();
                if (frames >= minFrames || Date.now() - started > maxWaitMs) {
                    map.un('rendercomplete', onComplete);
                    setTimeout(resolve, 350);
                }
            };
            map.on('rendercomplete', onComplete);
            map.renderSync();
        });
    }

    function compositeMapCanvases(container, outCanvas, fillWhite) {
        const ctx = outCanvas.getContext('2d');
        const w = outCanvas.width;
        const h = outCanvas.height;
        let drewAny = false;
        let tainted = false;

        if (fillWhite) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, w, h);
        } else {
            ctx.clearRect(0, 0, w, h);
        }

        const canvases = container.querySelectorAll('.ol-layer canvas');
        Array.prototype.forEach.call(canvases, function (canvas) {
            if (!canvas.width || !canvas.height) return;
            try {
                const opacity = canvas.parentElement && canvas.parentElement.style.opacity;
                ctx.globalAlpha = opacity === '' || opacity == null ? 1 : Number(opacity);
                const transform = canvas.style.transform;
                let drew = false;
                if (transform) {
                    const matrix = transform.match(/^matrix\(([^)]*)\)$/);
                    if (matrix) {
                        const matrixValues = matrix[1].split(',').map(Number);
                        if (matrixValues.length === 6) {
                            ctx.setTransform.apply(ctx, matrixValues);
                            ctx.drawImage(canvas, 0, 0);
                            ctx.setTransform(1, 0, 0, 1, 0, 0);
                            drew = true;
                        }
                    }
                }
                if (!drew) {
                    ctx.setTransform(1, 0, 0, 1, 0, 0);
                    ctx.drawImage(canvas, 0, 0);
                }
                drewAny = true;
            } catch (e) {
                tainted = true;
            }
        });
        ctx.globalAlpha = 1;
        return { drewAny, tainted };
    }

    function canvasHasVisibleContent(canvas) {
        const ctx = canvas.getContext('2d');
        const w = canvas.width;
        const h = canvas.height;
        if (!w || !h) return false;
        const points = [
            [Math.floor(w / 2), Math.floor(h / 2)],
            [Math.floor(w * 0.25), Math.floor(h * 0.25)],
            [Math.floor(w * 0.75), Math.floor(h * 0.75)]
        ];
        for (let p = 0; p < points.length; p++) {
            const data = ctx.getImageData(points[p][0], points[p][1], 1, 1).data;
            if (data[3] > 0 && (data[0] < 252 || data[1] < 252 || data[2] < 252)) return true;
        }
        return false;
    }

    function loadPrefs() {
        try {
            return JSON.parse(sessionStorage.getItem(SESSION_KEY) || '{}');
        } catch (e) {
            return {};
        }
    }

    function savePrefs(partial) {
        try {
            const p = Object.assign(loadPrefs(), partial);
            sessionStorage.setItem(SESSION_KEY, JSON.stringify(p));
        } catch (e) { /* ignore */ }
    }

    function suggestUtmEpsg(map, view) {
        const center = view.getCenter();
        const lonLat = ol.proj.transform(center, view.getProjection(), 'EPSG:4326');
        return lonLat[0] < 30 ? 'EPSG:32635' : 'EPSG:32636';
    }

    function measureExtentMeters(extent, exportCrs, viewProj) {
        const bl = ol.proj.transform([extent[0], extent[1]], viewProj, exportCrs);
        const tr = ol.proj.transform([extent[2], extent[3]], viewProj, exportCrs);
        if (exportCrs === 'EPSG:4326' && global.turf) {
            const w = global.turf.distance(global.turf.point([bl[0], bl[1]]), global.turf.point([tr[0], bl[1]]), { units: 'meters' });
            const h = global.turf.distance(global.turf.point([bl[0], bl[1]]), global.turf.point([bl[0], tr[1]]), { units: 'meters' });
            return { width: w, height: h, areaM2: w * h };
        }
        const width = Math.abs(tr[0] - bl[0]);
        const height = Math.abs(tr[1] - bl[1]);
        return { width, height, areaM2: width * height };
    }

    function autoCropExtent(extent, exportCrs, viewProj, maxM) {
        const center = ol.extent.getCenter(extent);
        const cExp = ol.proj.transform(center, viewProj, exportCrs);
        let halfW, halfH;
        if (exportCrs === 'EPSG:4326' && global.turf) {
            const dLon = (maxM / 2) / (111320 * Math.cos((cExp[1] * Math.PI) / 180));
            const dLat = (maxM / 2) / 110540;
            halfW = dLon;
            halfH = dLat;
            const ring = [
                [cExp[0] - halfW, cExp[1] - halfH],
                [cExp[0] + halfW, cExp[1] - halfH],
                [cExp[0] + halfW, cExp[1] + halfH],
                [cExp[0] - halfW, cExp[1] + halfH],
                [cExp[0] - halfW, cExp[1] - halfH]
            ];
            const coords = ring.map((c) => ol.proj.transform(c, exportCrs, viewProj));
            return ol.extent.boundingExtent(coords);
        }
        halfW = maxM / 2;
        halfH = maxM / 2;
        const box = [cExp[0] - halfW, cExp[1] - halfH, cExp[0] + halfW, cExp[1] + halfH];
        return ol.extent.boundingExtent([
            ol.proj.transform([box[0], box[1]], exportCrs, viewProj),
            ol.proj.transform([box[2], box[3]], exportCrs, viewProj)
        ]);
    }

    class GisExportEngine {
        constructor(options) {
            this.map = options.map;
            this.view = options.view;
            this.getGspnetLayers = options.getGspnetLayers;
            this.getPolygonLayers = options.getPolygonLayers;
            this.getExtractorSource = options.getExtractorSource;
            this.getContourLayer = options.getContourLayer;
            this.showToast = options.showToast || function () {};
            this.closeOtherPanels = options.closeOtherPanels || function () {};
            this.isAuthenticated = options.isAuthenticated || function () {
                return global.__gspnetExportAuthenticated === true;
            };

            this.panel = document.getElementById('gisExportPanel');
            this.extentSource = new ol.source.Vector();
            this.extentLayer = new ol.layer.Vector({
                title: 'GIS Export Extent',
                source: this.extentSource,
                zIndex: 2000,
                style: new ol.style.Style({
                    stroke: new ol.style.Stroke({ color: '#2563eb', width: 2, lineDash: [8, 4] }),
                    fill: new ol.style.Fill({ color: 'rgba(37, 99, 235, 0.12)' })
                })
            });

            this.state = {
                format: 'png',
                extentMode: 'map',
                exportCrs: 'EPSG:32636',
                resolution: 'medium',
                rasterLabels: true,
                rasterGrid: true,
                rasterTransparent: false,
                dxfSimplify: false,
                dxfLabels: false,
                dxfLegacyR12: false,
                surveyCornerCsv: true,
                surveyJrjCsv: false,
                exportExtent: null,
                pickedFeatures: [],
                drawInteraction: null,
                selectInteraction: null,
                isExporting: false,
                corsWarning: null
            };

            this._savedView = null;
        }

        init() {
            if (!this.panel) {
                console.error('[GisExportEngine] Panel #gisExportPanel not found');
                return;
            }

            if (window.annotationsGroup) {
                window.annotationsGroup.getLayers().push(this.extentLayer);
                if (typeof window.layerSwitcher !== 'undefined' && typeof window.layerSwitcher.renderPanel === 'function') {
                    window.layerSwitcher.renderPanel();
                } else {
                    const lsControl = this.map.getControls().getArray().find(c => typeof c.renderPanel === 'function');
                    if (lsControl) lsControl.renderPanel();
                }
            } else {
                this.map.addLayer(this.extentLayer);
            }
            this._buildFormatCards();
            this._populateCrsSelect();
            this._bindUi();
            this._loadSessionPrefs();
            this._refreshAuthState();
            this._updateExtentModeAvailability();
            this._updatePreview();

            const mainBtn = document.getElementById('coordExtractorMainBtn');
            if (mainBtn) {
                mainBtn.addEventListener('click', () => this.openPanel());
            }

            global.addEventListener('gspnet-export-auth-changed', () => this._refreshAuthState());
        }

        openPanel() {
            this.closeOtherPanels();
            this._refreshAuthState();
            this.panel.classList.add('open');
            this.panel.setAttribute('aria-hidden', 'false');
            document.getElementById('coordExtractorMainBtn')?.classList.add('active');
            if (this.state.extentMode === 'map' && !this.state.exportExtent) {
                this.state.exportExtent = this.view.calculateExtent(this.map.getSize());
                this._drawExtentFeature(this.state.exportExtent);
            }
            this._suggestCrs();
            this._updatePreview();
        }

        closePanel() {
            this.panel.classList.remove('open');
            this.panel.setAttribute('aria-hidden', 'true');
            document.getElementById('coordExtractorMainBtn')?.classList.remove('active');
            this._stopExtentInteractions();
        }

        _refreshAuthState() {
            const ok = this.isAuthenticated();
            this.panel.classList.toggle('is-authenticated', ok);
        }

        _buildFormatCards() {
            const host = document.getElementById('gisExportFormatCards');
            if (!host) return;
            host.innerHTML = '';
            Object.values(EXPORT_FORMATS).forEach((f) => {
                const card = document.createElement('button');
                card.type = 'button';
                card.className = 'gis-export-format-card' + (f.id === this.state.format ? ' is-selected' : '');
                card.dataset.format = f.id;
                card.innerHTML =
                    '<div class="gis-export-format-card__icon"><i class="fas ' +
                    f.icon +
                    '"></i></div><div class="gis-export-format-card__name">' +
                    f.label +
                    '</div><div class="gis-export-format-card__desc">' +
                    (f.group === 'raster' ? 'Geo-referenced image export' : 'Vector CAD / GIS export') +
                    '</div>';
                card.addEventListener('click', () => this._selectFormat(f.id));
                host.appendChild(card);
            });
        }

        _selectFormat(id) {
            this.state.format = id;
            savePrefs({ format: id });
            this.panel.querySelectorAll('.gis-export-format-card').forEach((c) => {
                c.classList.toggle('is-selected', c.dataset.format === id);
            });
            this._updateExtentModeAvailability();
            this._markStepComplete(1);
            this._updatePreview();
        }

        _populateCrsSelect() {
            const sel = document.getElementById('gisExportCrs');
            if (!sel) return;
            const groups = [
                {
                    label: 'Global',
                    items: [
                        { v: 'EPSG:4326', l: 'WGS 84 Geographic (EPSG:4326)' },
                        { v: 'EPSG:3857', l: 'Web Mercator (EPSG:3857)' }
                    ]
                },
                {
                    label: 'Uganda Survey / UTM (WGS 84)',
                    items: [
                        { v: 'EPSG:32635', l: 'UTM Zone 35N (EPSG:32635)' },
                        { v: 'EPSG:32636', l: 'UTM Zone 36N (EPSG:32636)' },
                        { v: 'EPSG:32735', l: 'UTM Zone 35S (EPSG:32735)' },
                        { v: 'EPSG:32736', l: 'UTM Zone 36S (EPSG:32736)' }
                    ]
                },
                {
                    label: 'Local Survey (Arc 1960)',
                    items: [
                        { v: 'EPSG:21095', l: 'Arc 1960 / UTM 35N (EPSG:21095)' },
                        { v: 'EPSG:21096', l: 'Arc 1960 / UTM 36N (EPSG:21096)' },
                        { v: 'EPSG:21036', l: 'Arc 1960 / UTM 36S (EPSG:21036)' }
                    ]
                }
            ];
            sel.innerHTML = '';
            groups.forEach((g) => {
                const og = document.createElement('optgroup');
                og.label = g.label;
                g.items.forEach((it) => {
                    const o = document.createElement('option');
                    o.value = it.v;
                    o.textContent = it.l;
                    og.appendChild(o);
                });
                sel.appendChild(og);
            });
            sel.value = this.state.exportCrs;
        }

        _bindUi() {
            document.getElementById('gisExportClose')?.addEventListener('click', () => this.closePanel());
            document.getElementById('gisExportCancel')?.addEventListener('click', () => this.closePanel());
            document.getElementById('gisExportClearExtent')?.addEventListener('click', () => this._clearExtent());
            document.getElementById('gisExportRun')?.addEventListener('click', () => this._runExport());

            this.panel.querySelectorAll('.gis-export-step__head').forEach((head) => {
                head.addEventListener('click', () => {
                    const step = head.closest('.gis-export-step');
                    step.classList.toggle('is-open');
                });
            });

            this.panel.querySelectorAll('.gis-export-chip[data-extent]').forEach((chip) => {
                chip.addEventListener('click', () => {
                    if (chip.disabled) return;
                    this._setExtentMode(chip.dataset.extent);
                });
            });

            document.getElementById('gisExportCrs')?.addEventListener('change', (e) => {
                this.state.exportCrs = e.target.value;
                savePrefs({ exportCrs: this.state.exportCrs });
                this._updateExtentStats();
                this._updatePreview();
            });

            document.getElementById('gisExportResolution')?.addEventListener('change', (e) => {
                this.state.resolution = e.target.value;
                savePrefs({ resolution: this.state.resolution });
                this._updatePreview();
            });

            const toggles = {
                gisExportRasterLabels: 'rasterLabels',
                gisExportRasterGrid: 'rasterGrid',
                gisExportRasterTransparent: 'rasterTransparent',
                gisExportDxfSimplify: 'dxfSimplify',
                gisExportDxfLabels: 'dxfLabels',
                gisExportDxfLegacy: 'dxfLegacyR12',
                gisExportCornerCsv: 'surveyCornerCsv',
                gisExportJrjCsv: 'surveyJrjCsv'
            };
            Object.entries(toggles).forEach(([id, key]) => {
                document.getElementById(id)?.addEventListener('change', (e) => {
                    this.state[key] = e.target.checked;
                    this._updatePreview();
                });
            });

            document.getElementById('gisExportAutoCrop')?.addEventListener('click', () => {
                if (this.state.exportExtent) {
                    this.state.exportExtent = autoCropExtent(
                        this.state.exportExtent,
                        this.state.exportCrs,
                        this.view.getProjection(),
                        MAX_EXPORT_M
                    );
                    this._drawExtentFeature(this.state.exportExtent);
                    this._updateExtentStats();
                    this._updatePreview();
                }
            });

            document.addEventListener('keydown', (e) => {
                if (!this.panel.classList.contains('open')) return;
                if (e.key === 'Escape') {
                    this._stopExtentInteractions();
                    this.closePanel();
                }
            });
        }

        _loadSessionPrefs() {
            const p = loadPrefs();
            if (p.format && EXPORT_FORMATS[p.format]) this.state.format = p.format;
            if (p.exportCrs) this.state.exportCrs = p.exportCrs;
            if (p.resolution) this.state.resolution = p.resolution;
            const crsSel = document.getElementById('gisExportCrs');
            if (crsSel) crsSel.value = this.state.exportCrs;
            const resSel = document.getElementById('gisExportResolution');
            if (resSel) resSel.value = this.state.resolution;
            this._buildFormatCards();
        }

        _suggestCrs() {
            const suggested = suggestUtmEpsg(this.map, this.view);
            const hint = document.getElementById('gisExportCrsHint');
            if (hint) {
                hint.textContent = 'Suggested for this view: ' + suggested.replace('EPSG:', 'EPSG ') + ' (Uganda UTM)';
                hint.classList.add('is-visible');
            }
        }

        _setExtentMode(mode) {
            this.state.extentMode = mode;
            this._stopExtentInteractions();
            this.panel.querySelectorAll('.gis-export-chip[data-extent]').forEach((c) => {
                c.classList.toggle('is-selected', c.dataset.extent === mode);
            });

            if (mode === 'map') {
                this.state.exportExtent = this.view.calculateExtent(this.map.getSize());
                this.state.pickedFeatures = [];
                this._drawExtentFeature(this.state.exportExtent);
            } else if (mode === 'draw-box') {
                this._startDrawBox();
            } else if (mode === 'draw-poly') {
                this._startDrawPolygon();
            } else if (mode === 'pick') {
                this._startPickPolygons();
            }

            this._updateExtentStats();
            this._markStepComplete(2);
            this._updatePreview();
        }

        _updateExtentModeAvailability() {
            const isRaster = EXPORT_FORMATS[this.state.format].group === 'raster';
            const pickChip = this.panel.querySelector('.gis-export-chip[data-extent="pick"]');
            if (pickChip) {
                pickChip.disabled = isRaster;
                pickChip.title = isRaster ? 'Use draw or map extent for raster exports' : '';
            }
            if (isRaster && this.state.extentMode === 'pick') {
                this._setExtentMode('map');
            }
            const transp = document.getElementById('gisExportRasterTransparent');
            if (transp) transp.closest('.gis-export-toggle-row').style.display = this.state.format === 'png' ? 'flex' : 'none';
        }

        _startDrawBox() {
            this.state.pickedFeatures = [];
            this.state.drawInteraction = new ol.interaction.Draw({
                source: this.extentSource,
                type: 'Circle',
                geometryFunction: ol.interaction.Draw.createBox()
            });
            this.extentSource.clear();
            this.state.drawInteraction.on('drawend', (e) => {
                const geom = e.feature.getGeometry();
                this.state.exportExtent = geom.getExtent();
                this.map.removeInteraction(this.state.drawInteraction);
                this.state.drawInteraction = null;
                this._updateExtentStats();
                this._updatePreview();
                this.showToast('Export extent drawn.', 'success');
            });
            this.map.addInteraction(this.state.drawInteraction);
            this.showToast('Draw a rectangle on the map.', 'info');
        }

        _startDrawPolygon() {
            this.state.pickedFeatures = [];
            this.state.drawInteraction = new ol.interaction.Draw({
                source: this.extentSource,
                type: 'Polygon'
            });
            this.extentSource.clear();
            this.state.drawInteraction.on('drawend', (e) => {
                this.state.exportExtent = e.feature.getGeometry().getExtent();
                this.map.removeInteraction(this.state.drawInteraction);
                this.state.drawInteraction = null;
                this._updateExtentStats();
                this._updatePreview();
            });
            this.map.addInteraction(this.state.drawInteraction);
            this.showToast('Draw a polygon extent on the map.', 'info');
        }

        _startPickPolygons() {
            this.extentSource.clear();
            this.state.exportExtent = null;
            const layers = this._getSelectableLayers();
            this.state.selectInteraction = new ol.interaction.Select({
                layers,
                multi: true,
                style: new ol.style.Style({
                    stroke: new ol.style.Stroke({ color: '#0d9488', width: 3 }),
                    fill: new ol.style.Fill({ color: 'rgba(13, 148, 136, 0.25)' })
                })
            });
            this.state.selectInteraction.on('select', () => {
                this.state.pickedFeatures = this.state.selectInteraction.getFeatures().getArray().slice();
                if (this.state.pickedFeatures.length) {
                    const extents = this.state.pickedFeatures.map((f) => f.getGeometry().getExtent());
                    this.state.exportExtent = extents.reduce((acc, ex) => ol.extent.extend(acc, ex), ol.extent.createEmpty());
                    this._drawExtentFeature(this.state.exportExtent);
                    if (this.state.pickedFeatures.length === 1) {
                        this.showExtractedVerticesOnMap(this.state.pickedFeatures[0]);
                    }
                }
                this._updateExtentStats();
                this._updatePreview();
            });
            this.map.addInteraction(this.state.selectInteraction);
            this.showToast('Click parcels to select (multiple allowed).', 'info');
        }

        _getSelectableLayers() {
            const out = [];
            (this.getGspnetLayers() || []).forEach((l) => {
                if (l.getVisible() && l.get('title') !== 'Extracted Polygon Points') out.push(l);
            });
            Object.values(this.getPolygonLayers() || {}).forEach((l) => {
                if (l.getVisible()) out.push(l);
            });
            return out;
        }

        _stopExtentInteractions() {
            if (this.state.drawInteraction) {
                this.map.removeInteraction(this.state.drawInteraction);
                this.state.drawInteraction = null;
            }
            if (this.state.selectInteraction) {
                this.map.removeInteraction(this.state.selectInteraction);
                this.state.selectInteraction = null;
            }
        }

        _clearExtent() {
            this._stopExtentInteractions();
            this.extentSource.clear();
            this.state.exportExtent = null;
            this.state.pickedFeatures = [];
            this._updateExtentStats();
            this._updatePreview();
        }

        _drawExtentFeature(extent) {
            this.extentSource.clear();
            if (!extent) return;
            const poly = ol.geom.Polygon.fromExtent(extent);
            this.extentSource.addFeature(new ol.Feature(poly));
        }

        _updateExtentStats() {
            const el = document.getElementById('gisExportExtentStats');
            if (!el) return;
            if (!this.state.exportExtent) {
                el.className = 'gis-export-extent-stats';
                el.textContent = 'No extent defined yet.';
                return;
            }
            const dims = measureExtentMeters(this.state.exportExtent, this.state.exportCrs, this.view.getProjection());
            const isRaster = EXPORT_FORMATS[this.state.format].group === 'raster';
            const pickMode = this.state.extentMode === 'pick';
            const over = dims.width > MAX_EXPORT_M || dims.height > MAX_EXPORT_M;
            let cls = 'gis-export-extent-stats--ok';
            let msg =
                'Width: ' +
                dims.width.toFixed(1) +
                ' m · Height: ' +
                dims.height.toFixed(1) +
                ' m · Area: ' +
                (dims.areaM2 / 10000).toFixed(4) +
                ' ha';
            if (pickMode && !isRaster) {
                msg += ' · ' + this.state.pickedFeatures.length + ' parcel(s) selected (full geometry export)';
                el.className = 'gis-export-extent-stats gis-export-extent-stats--ok';
                el.textContent = msg;
                return;
            }
            if (isRaster && over) {
                cls = 'gis-export-extent-stats--error';
                msg = 'Export area exceeds 1 km × 1 km limit. Use Auto-crop or redraw.';
            } else if (isRaster && (dims.width > 800 || dims.height > 800)) {
                cls = 'gis-export-extent-stats--warn';
            }
            el.className = 'gis-export-extent-stats ' + cls;
            el.textContent = msg;
        }

        _markStepComplete(n) {
            this.panel.querySelectorAll('.gis-export-step').forEach((step, i) => {
                step.classList.toggle('is-complete', i < n);
                step.classList.toggle('is-active', i === n - 1);
            });
        }

        _getVisibleVectorLayers() {
            const skip = ['Extracted Polygon Points', 'GIS Export Extent'];
            const list = [];
            const walk = (layer) => {
                if (layer instanceof ol.layer.Group) {
                    layer.getLayers().forEach(walk);
                    return;
                }
                if (!layer.getVisible()) return;
                const title = layer.get('title') || '';
                if (skip.some((s) => title.includes(s))) return;
                if (layer === this.extentLayer) return;
                if (layer instanceof ol.layer.Vector || layer instanceof ol.layer.VectorImage) {
                    list.push(layer);
                }
            };
            this.map.getLayers().forEach(walk);
            const contour = this.getContourLayer?.();
            if (contour && contour.getVisible() && !list.includes(contour)) list.push(contour);
            return list;
        }

        _collectFeaturesForExport() {
            const viewProj = this.view.getProjection();
            const pickMode = this.state.extentMode === 'pick' && this.state.pickedFeatures.length;
            const clipExtent = this.state.exportExtent;
            const pickedSet = new Set(this.state.pickedFeatures);
            const out = [];

            if (pickMode) {
                this.state.pickedFeatures.forEach((f) => {
                    out.push({ feature: f, layerTitle: f.get('__layerTitle') || 'SELECTED_PARCEL', fullGeometry: true });
                });
            }

            const layers = this._getVisibleVectorLayers();
            layers.forEach((layer) => {
                const title = layer.get('title') || 'LAYER';
                const source = layer.getSource();
                if (!source || !source.getFeatures) return;
                source.getFeatures().forEach((feature) => {
                    if (pickedSet.has(feature)) return;
                    const geom = feature.getGeometry();
                    if (!geom) return;
                    if (!clipExtent) return;
                    const fExt = geom.getExtent();
                    if (!ol.extent.intersects(fExt, clipExtent)) return;
                    out.push({ feature, layerTitle: feature.get('__layerTitle') || title, fullGeometry: false });
                });
            });

            return out;
        }

        _estimateExportSize() {
            const fmt = EXPORT_FORMATS[this.state.format];
            const items = this._collectFeaturesForExport();
            let vertices = 0;
            items.forEach(({ feature, fullGeometry }) => {
                const g = feature.getGeometry();
                if (!g) return;
                if (fullGeometry) {
                    vertices += this._countVertices(g);
                } else {
                    vertices += this._countVertices(g) * 0.6;
                }
            });

            if (fmt.group === 'raster' && this.state.exportExtent) {
                const dims = measureExtentMeters(this.state.exportExtent, this.state.exportCrs, this.view.getProjection());
                const dpi = DPI_MAP[this.state.resolution] || 150;
                const wPx = Math.min(8192, Math.max(64, Math.round((dims.width / 0.0254) * dpi)));
                const hPx = Math.min(8192, Math.max(64, Math.round((dims.height / 0.0254) * dpi)));
                const bytes = wPx * hPx * 4 * (fmt.id === 'jpg' ? 0.22 : 0.35);
                return { bytes, label: this._formatBytes(bytes) + ' (image ~' + wPx + '×' + hPx + ' px)' };
            }

            const bytes = vertices * 24 + items.length * 220 + 8000;
            return { bytes, label: this._formatBytes(bytes) + ' (~' + items.length + ' features)' };
        }

        _countVertices(geom) {
            const t = geom.getType();
            if (t === 'Point') return 1;
            if (t === 'LineString') return geom.getCoordinates().length;
            if (t === 'Polygon') return geom.getCoordinates()[0].length;
            if (t === 'MultiPolygon') {
                let n = 0;
                geom.getPolygons().forEach((p) => (n += p.getCoordinates()[0].length));
                return n;
            }
            return 8;
        }

        _formatBytes(b) {
            if (b < 1024) return b.toFixed(0) + ' B';
            if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
            return (b / 1048576).toFixed(2) + ' MB';
        }

        _updatePreview() {
            const fmt = EXPORT_FORMATS[this.state.format];
            const dims = this.state.exportExtent
                ? measureExtentMeters(this.state.exportExtent, this.state.exportCrs, this.view.getProjection())
                : null;
            const est = this._estimateExportSize();
            const layers = this._getVisibleVectorLayers().map((l) => l.get('title') || 'Layer');

            const set = (id, text) => {
                const el = document.getElementById(id);
                if (el) el.textContent = text;
            };
            set('gisPreviewFormat', fmt.label);
            set('gisPreviewCrs', this.state.exportCrs);
            set('gisPreviewResolution', fmt.group === 'raster' ? this.state.resolution + ' (' + (DPI_MAP[this.state.resolution] || 150) + ' DPI)' : '—');
            set(
                'gisPreviewExtent',
                dims
                    ? dims.width.toFixed(0) + ' × ' + dims.height.toFixed(0) + ' m (' + (dims.areaM2 / 1e6).toFixed(3) + ' km²)'
                    : 'Not set'
            );
            set('gisPreviewSize', est.label);

            const layerHost = document.getElementById('gisPreviewLayers');
            if (layerHost) {
                layerHost.innerHTML = layers.length
                    ? layers.map((l) => '<span>• ' + l + '</span>').join('<br>')
                    : '<span>No visible vector layers</span>';
            }

            const warnings = document.getElementById('gisExportWarnings');
            if (warnings) {
                const msgs = [];
                msgs.push({
                    type: 'info',
                    text: 'Export uses features loaded in the current map view. Pan and zoom to load more survey data if needed.'
                });
                if (EXPORT_FORMATS[this.state.format].group === 'raster' && dims && (dims.width > MAX_EXPORT_M || dims.height > MAX_EXPORT_M)) {
                    msgs.push({ type: 'warn', text: 'Raster export blocked: extent exceeds 1 km × 1 km.' });
                }
                warnings.innerHTML = msgs
                    .map(
                        (m) =>
                            '<div class="gis-export-warning gis-export-warning--' +
                            m.type +
                            '"><i class="fas fa-info-circle"></i><span>' +
                            m.text +
                            '</span></div>'
                    )
                    .join('');
            }

            const runBtn = document.getElementById('gisExportRun');
            if (runBtn) {
                const isRaster = fmt.group === 'raster';
                const over = dims && (dims.width > MAX_EXPORT_M || dims.height > MAX_EXPORT_M);
                const noExtent = !this.state.exportExtent && !(this.state.extentMode === 'pick' && this.state.pickedFeatures.length);
                runBtn.disabled =
                    !this.isAuthenticated() || this.state.isExporting || noExtent || (isRaster && over);
            }
        }

        async _runExport() {
            if (!this.isAuthenticated() || this.state.isExporting) return;
            const fmt = EXPORT_FORMATS[this.state.format];
            if (fmt.group === 'raster') {
                const dims = measureExtentMeters(this.state.exportExtent, this.state.exportCrs, this.view.getProjection());
                if (dims.width > MAX_EXPORT_M || dims.height > MAX_EXPORT_M) {
                    this.showToast('Export area exceeds 1km × 1km limit.', 'error');
                    return;
                }
            }

            this.state.isExporting = true;
            this._setProgress(true, 'Generating export…', 10);
            const runBtn = document.getElementById('gisExportRun');
            if (runBtn) runBtn.disabled = true;

            try {
                const zip = new global.JSZip();
                const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
                const folder = zip.folder('GSPNET_export_' + stamp);

                const meta = {
                    platform: 'GEOSPATIALNETWORKUG',
                    exportedAt: new Date().toISOString(),
                    format: fmt.id,
                    crs: this.state.exportCrs,
                    extentMode: this.state.extentMode,
                    resolution: this.state.resolution
                };

                if (fmt.group === 'raster') {
                    this._setProgress(true, 'Rendering map…', 35);
                    const rasterResult = await this._exportRaster();
                    meta.corsNote = rasterResult.corsNote;
                    folder.file('map.' + fmt.ext, rasterResult.imageBytes, { binary: true });
                    folder.file('map.' + (fmt.id === 'png' ? 'pgw' : 'jgw'), rasterResult.worldFile);
                    folder.file('map.prj', PRJ_WKT[this.state.exportCrs] || '');
                    if (rasterResult.readmeExtra) {
                        folder.file('RASTER_NOTE.txt', rasterResult.readmeExtra);
                    }
                } else {
                    this._setProgress(true, 'Building vector export…', 40);
                    const vectorBlob = this._exportVector(fmt.id);
                    folder.file('export.' + fmt.ext, vectorBlob);
                }

                if (this.state.surveyCornerCsv && this.state.pickedFeatures.length === 1) {
                    const csv = this._buildCornerCsv(this.state.pickedFeatures[0]);
                    folder.file('parcel-corner-coordinates.csv', csv);
                } else if (this.state.surveyCornerCsv && this.state.pickedFeatures.length > 1) {
                    this.state.pickedFeatures.forEach((f, i) => {
                        folder.file('parcel-' + (i + 1) + '-corner-coordinates.csv', this._buildCornerCsv(f));
                    });
                }

                if (this.state.surveyJrjCsv && this.state.pickedFeatures.length >= 1) {
                    this.state.pickedFeatures.forEach((f, i) => {
                        const jrj = this._buildJrjCsv(f);
                        if (jrj) folder.file('parcel-' + (i + 1) + '-jrj-computation.csv', jrj);
                    });
                }

                folder.file(
                    'export-metadata.json',
                    JSON.stringify(meta, null, 2)
                );
                folder.file(
                    'README.txt',
                    'GEOSPATIALNETWORKUG — GIS Export\n' +
                        'Generated: ' +
                        new Date().toLocaleString() +
                        '\nFormat: ' +
                        fmt.label +
                        '\nCRS: ' +
                        this.state.exportCrs +
                        '\n\nSee export-metadata.json for details.\n'
                );

                this._setProgress(true, 'Creating ZIP…', 85);
                const zipBlob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
                this._downloadBlob(zipBlob, 'GSPNET_export_' + stamp + '.zip');
                this.showToast('Export downloaded successfully.', 'success');
            } catch (err) {
                console.error('[GisExportEngine]', err);
                this.showToast('Export failed: ' + (err.message || err), 'error');
            } finally {
                this.state.isExporting = false;
                this._setProgress(false);
                this._updatePreview();
            }
        }

        _setProgress(visible, text, pct) {
            const wrap = document.getElementById('gisExportProgress');
            const fill = document.getElementById('gisExportProgressFill');
            const label = document.getElementById('gisExportProgressText');
            if (wrap) wrap.classList.toggle('is-visible', visible);
            if (label && text) label.textContent = text;
            if (fill) fill.style.width = (pct || 0) + '%';
        }

        async _exportRaster() {
            const viewProj = this.view.getProjection();
            const exportCrs = this.state.exportCrs;
            const extent = this.state.exportExtent;
            const dims = measureExtentMeters(extent, exportCrs, viewProj);
            const dpi = DPI_MAP[this.state.resolution] || 150;
            const width = Math.min(8192, Math.max(128, Math.round((dims.width / 0.0254) * dpi)));
            const height = Math.min(8192, Math.max(128, Math.round((dims.height / 0.0254) * dpi)));

            const exportLayers = [];
            this.map.getLayers().forEach((layer) => {
                const cloned = cloneLayerForRasterExport(layer, this.extentLayer);
                if (cloned) exportLayers.push(cloned);
            });

            if (!exportLayers.length) {
                throw new Error('No visible map layers to export.');
            }

            const tempContainer = document.createElement('div');
            tempContainer.style.cssText =
                'position:absolute;left:-99999px;top:0;width:' + width + 'px;height:' + height + 'px;overflow:hidden;';
            document.body.appendChild(tempContainer);

            const tempView = new ol.View({ projection: viewProj });
            const tempMap = new ol.Map({
                layers: exportLayers,
                view: tempView,
                controls: [],
                interactions: []
            });

            try {
                tempMap.setTarget(tempContainer);
                tempMap.updateSize();
                tempView.fit(extent, { size: [width, height], padding: [0, 0, 0, 0], duration: 0 });
                // Wait longer (5 frames) for Esri/heavy layers to stabilize
                await waitForMapRenderComplete(tempMap, 5, 15000);

                const mapCanvas = document.createElement('canvas');
                mapCanvas.width = width;
                mapCanvas.height = height;
                const fillWhite = !(this.state.rasterTransparent && this.state.format === 'png');
                const composite = compositeMapCanvases(tempContainer, mapCanvas, fillWhite);

                // Add grid, scale bar, north arrow and metadata
                this._drawRasterDecorations(mapCanvas, extent, exportCrs, viewProj);

                let tainted = composite.tainted;
                let corsNote = '';
                let readmeExtra = '';

                if (!composite.drewAny || !canvasHasVisibleContent(mapCanvas)) {
                    corsNote =
                        'Map image could not be composited (tiles may still be loading or blocked by CORS). ' +
                        'Try zooming the export area into view first, or use vector-only formats.';
                    readmeExtra = corsNote;
                } else if (tainted) {
                    corsNote =
                        'Some basemap tiles could not be embedded (CORS). Export includes layers that loaded successfully.';
                    readmeExtra = corsNote;
                }

                const mime = this.state.format === 'jpg' ? 'image/jpeg' : 'image/png';
                let dataUrl;
                try {
                    dataUrl = mapCanvas.toDataURL(mime, this.state.format === 'jpg' ? 0.92 : undefined);
                } catch (e) {
                    tainted = true;
                    corsNote = 'Raster export blocked by browser canvas security (CORS on basemap tiles).';
                    readmeExtra = corsNote;
                    throw new Error(corsNote);
                }

                const imageBytes = await (await fetch(dataUrl)).arrayBuffer();

                const bl = ol.proj.transform([extent[0], extent[1]], viewProj, exportCrs);
                const tr = ol.proj.transform([extent[2], extent[3]], viewProj, exportCrs);
                const pixelW = (tr[0] - bl[0]) / width;
                const pixelH = (tr[1] - bl[1]) / height;
                const worldFile =
                    pixelW.toFixed(10) +
                    '\n0\n0\n' +
                    (-Math.abs(pixelH)).toFixed(10) +
                    '\n' +
                    bl[0].toFixed(6) +
                    '\n' +
                    tr[1].toFixed(6) +
                    '\n';

                return { imageBytes, worldFile, corsNote, readmeExtra };
            } finally {
                tempMap.setTarget(null);
                if (tempContainer.parentNode) {
                    tempContainer.parentNode.removeChild(tempContainer);
                }
            }
        }

        _exportVector(formatId) {
            const viewProj = this.view.getProjection();
            const exportCrs = this.state.exportCrs;
            const items = this._collectFeaturesForExport();
            const contourLayer = this.getContourLayer?.();

            if (formatId === 'geojson') {
                const features = items.map((i) => i.feature);
                const fc = new ol.format.GeoJSON().writeFeaturesObject(features, {
                    dataProjection: exportCrs,
                    featureProjection: viewProj
                });
                return JSON.stringify(fc, null, 2);
            }

            if (formatId === 'kml') {
                const features = items.map((i) => i.feature);
                return new ol.format.KML().writeFeatures(features, {
                    dataProjection: exportCrs,
                    featureProjection: viewProj
                });
            }

            return this._buildDxf(items, contourLayer);
        }

        _buildDxf(items, contourLayer) {
            const exportCrs = this.state.exportCrs;
            const viewProj = this.view.getProjection();
            const legacy = this.state.dxfLegacyR12;
            let dxf = '';

            if (legacy) {
                // DXF R12 (Legacy)
                dxf += '0\nSECTION\n2\nHEADER\n9\n$ACADVER\n1\nAC1009\n0\nENDSEC\n0\nSECTION\n2\nENTITIES\n';
                items.forEach(({ feature, layerTitle, fullGeometry }) => {
                    const rings = this._geomToRings(feature.getGeometry(), viewProj, exportCrs);
                    const layer = cadLayerForFeature(feature, layerTitle, contourLayer);
                    
                    rings.forEach(ring => {
                        if (ring.length < 2) return;
                        const closed = feature.getGeometry().getType().includes('Polygon');
                        dxf += '0\nPOLYLINE\n8\n' + layer + '\n66\n1\n10\n0.0\n20\n0.0\n30\n0.0\n70\n' + (closed ? 1 : 0) + '\n';
                        ring.forEach(([x, y]) => {
                            if (isFinite(x) && isFinite(y)) {
                                dxf += '0\nVERTEX\n8\n' + layer + '\n10\n' + x.toFixed(8) + '\n20\n' + y.toFixed(8) + '\n30\n0.0\n';
                            }
                        });
                        dxf += '0\nSEQEND\n8\n' + layer + '\n';
                    });
                });
                dxf += '0\nENDSEC\n0\nEOF\n';
            } else {
                // DXF AC1015 (AutoCAD 2000) - More robust LWPOLYLINE
                dxf += '0\nSECTION\n2\nHEADER\n9\n$ACADVER\n1\nAC1015\n0\nENDSEC\n';
                // AutoCAD 2000+ requires TABLES and BLOCKS sections
                dxf += '0\nSECTION\n2\nTABLES\n0\nTABLE\n2\nVPORT\n70\n0\n0\nENDTAB\n0\nTABLE\n2\nLTYPE\n70\n0\n0\nENDTAB\n0\nTABLE\n2\nLAYER\n70\n0\n0\nENDTAB\n0\nTABLE\n2\nSTYLE\n70\n0\n0\nENDTAB\n0\nTABLE\n2\nVIEW\n70\n0\n0\nENDTAB\n0\nTABLE\n2\nUCS\n70\n0\n0\nENDTAB\n0\nTABLE\n2\nAPPID\n70\n0\n0\nENDTAB\n0\nTABLE\n2\nDIMSTYLE\n70\n0\n0\nENDTAB\n0\nTABLE\n2\nBLOCK_RECORD\n70\n0\n0\nENDTAB\n0\nENDSEC\n';
                dxf += '0\nSECTION\n2\nBLOCKS\n0\nENDSEC\n';
                dxf += '0\nSECTION\n2\nENTITIES\n';
                items.forEach(({ feature, layerTitle }) => {
                    const geom = feature.getGeometry();
                    if (!geom) return;
                    
                    const type = geom.getType();
                    const layer = cadLayerForFeature(feature, layerTitle, contourLayer);

                    if (type === 'Point' || type === 'MultiPoint') {
                        const coords = type === 'Point' ? [geom.getCoordinates()] : geom.getCoordinates();
                        coords.forEach(c => {
                            const pt = ol.proj.transform(c, viewProj, exportCrs);
                            if (isFinite(pt[0]) && isFinite(pt[1])) {
                                dxf += '0\nPOINT\n100\nAcDbEntity\n8\n' + layer + '\n100\nAcDbPoint\n10\n' + pt[0].toFixed(8) + '\n20\n' + pt[1].toFixed(8) + '\n30\n0\n';
                            }
                        });
                        return;
                    }

                    const rings = this._geomToRings(geom, viewProj, exportCrs);
                    rings.forEach((ring) => {
                        if (ring.length < 2) return;
                        const closed = type.includes('Polygon');
                        // Use full LWPOLYLINE definition with subclass markers
                        dxf += '0\nLWPOLYLINE\n100\nAcDbEntity\n8\n' + layer + '\n100\nAcDbPolyline\n90\n' + ring.length + '\n70\n' + (closed ? 1 : 0) + '\n';
                        ring.forEach(([x, y]) => {
                            if (isFinite(x) && isFinite(y)) {
                                dxf += '10\n' + x.toFixed(8) + '\n20\n' + y.toFixed(8) + '\n';
                            } else {
                                // If coordinate is invalid, we must still provide a value to keep DXF structure, 
                                // but ideally we should have skipped this ring or feature.
                                // Adding 0 as fallback is risky but better than NaN which breaks the file.
                                dxf += '10\n0.0\n20\n0.0\n';
                            }
                        });
                    });
                });
                dxf += '0\nENDSEC\n0\nSECTION\n2\nOBJECTS\n0\nENDSEC\n0\nEOF\n';
            }
            return dxf;
        }

        _geomToRings(geom, viewProj, exportCrs) {
            if (!geom) return [];
            const t = geom.getType();
            const tr = (c) => ol.proj.transform(c, viewProj, exportCrs);
            
            if (t === 'LineString') return [geom.getCoordinates().map(tr)];
            if (t === 'Polygon') return geom.getCoordinates().map(ring => ring.map(tr));
            if (t === 'MultiLineString') {
                return geom.getLineStrings().map((ls) => ls.getCoordinates().map(tr));
            }
            if (t === 'MultiPolygon') {
                const rings = [];
                geom.getPolygons().forEach((p) => {
                    p.getCoordinates().forEach(ring => rings.push(ring.map(tr)));
                });
                return rings;
            }
            return [];
        }

        _extractCoordsForDxf(feature, fullGeometry, exportCrs, viewProj) {
            const geom = feature.getGeometry();
            const t = geom.getType();
            if (t === 'Polygon') return geom.getCoordinates()[0].map((c) => ol.proj.transform(c, viewProj, exportCrs));
            if (t === 'MultiPolygon') return geom.getPolygon(0).getCoordinates()[0].map((c) => ol.proj.transform(c, viewProj, exportCrs));
            return [];
        }

        _buildCornerCsv(feature) {
            const coords = this._polygonRing(feature);
            if (!coords.length) return '';
            const crs = this.state.exportCrs;
            const viewProj = this.view.getProjection();
            const properties = feature.getProperties();
            let csv = 'POLYGON ATTRIBUTES\nAttribute,Value\n';
            for (const key in properties) {
                if (key === feature.getGeometryName() || typeof properties[key] === 'object') continue;
                let val = properties[key] == null ? '' : String(properties[key]);
                if (val.includes(',') || val.includes('"')) val = '"' + val.replace(/"/g, '""') + '"';
                csv += key + ',' + val + '\n';
            }
            csv += '\nPOLYGON COORDINATES\nPoint ID,Easting,Northing,Latitude,Longitude\n';
            const points = [];
            coords.forEach((coord, index) => {
                const transformed = ol.proj.transform(coord, viewProj, crs);
                const lonLat = ol.proj.transform(coord, viewProj, 'EPSG:4326');
                if (
                    index === coords.length - 1 &&
                    points.length &&
                    Math.abs(points[0].e - transformed[0]) < 1e-6 &&
                    Math.abs(points[0].n - transformed[1]) < 1e-6
                ) {
                    return;
                }
                const e = crs === 'EPSG:4326' ? transformed[0].toFixed(6) : Number(transformed[0].toFixed(3));
                const n = crs === 'EPSG:4326' ? transformed[1].toFixed(6) : Number(transformed[1].toFixed(3));
                points.push({ e, n, lat: lonLat[1].toFixed(6), lon: lonLat[0].toFixed(6) });
                csv += index + 1 + ',' + e + ',' + n + ',' + lonLat[1].toFixed(6) + ',' + lonLat[0].toFixed(6) + '\n';
            });
            return csv;
        }

        _buildJrjCsv(feature) {
            if (typeof global.JRJEngine === 'undefined') return null;
            const ring = this._polygonRing(feature);
            if (ring.length < 3) return null;
            const crs = this.state.exportCrs;
            const viewProj = this.view.getProjection();
            const coords = ring.slice(0, -1).map((c, i) => {
                const t = ol.proj.transform(c, viewProj, crs);
                return { stn: 'CM' + (i + 1), n: t[1], e: t[0] };
            });
            try {
                const engine = new global.JRJEngine();
                const result = engine.computeAll(coords);
                let csv = 'JRJ TRAVERSE\nFrom,To,Distance (m),Bearing\n';
                result.traverse.forEach((line) => {
                    csv += line.from + ',' + line.to + ',' + line.distance.toFixed(3) + ',"' + line.bearing.str + '"\n';
                });
                csv += '\nAREA\nSq Meters,Hectares,Acres\n';
                csv += result.area.sqMeters.toFixed(2) + ',' + result.area.hectares.toFixed(4) + ',' + result.area.acres.toFixed(4) + '\n';
                return csv;
            } catch (e) {
                return null;
            }
        }

        _polygonRing(feature) {
            const g = feature.getGeometry();
            if (!g) return [];
            if (g.getType() === 'Polygon') return g.getCoordinates()[0];
            if (g.getType() === 'MultiPolygon') return g.getPolygon(0).getCoordinates()[0];
            return [];
        }

        _downloadBlob(blob, filename) {
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = filename;
            a.click();
            setTimeout(() => URL.revokeObjectURL(a.href), 5000);
        }

        /**
         * Add professional decorations to the raster export
         */
        _drawRasterDecorations(canvas, extent, crs, viewProj) {
            const ctx = canvas.getContext('2d');
            const w = canvas.width;
            const h = canvas.height;
            const isGeographic = crs === 'EPSG:4326';

            // 1. Calculate Grid
            if (this.state.rasterGrid) {
                const bl = ol.proj.transform([extent[0], extent[1]], viewProj, crs);
                const tr = ol.proj.transform([extent[2], extent[3]], viewProj, crs);
                const minE = Math.min(bl[0], tr[0]);
                const maxE = Math.max(bl[0], tr[0]);
                const minN = Math.min(bl[1], tr[1]);
                const maxN = Math.max(bl[1], tr[1]);

                const width_m = maxE - minE;
                const height_m = maxN - minN;

                const getInterval = (dim) => {
                    const targets = [
                        0.0001, 0.0002, 0.0005, 0.001, 0.002, 0.005, 0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 
                        1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 5000
                    ];
                    const ideal = dim / 4;
                    return targets.reduce((prev, curr) => 
                        Math.abs(curr - ideal) < Math.abs(prev - ideal) ? curr : prev
                    );
                };

                const intervalE = getInterval(width_m);
                const intervalN = getInterval(height_m);

                ctx.save();
                
                // Vertical lines (Eastings)
                for (let e = Math.ceil(minE / intervalE) * intervalE; e <= maxE; e += intervalE) {
                    const x = ((e - minE) / width_m) * w;
                    if (x < 1 || x > w - 1) continue;
                    
                    // Draw White Buffer Line
                    ctx.beginPath();
                    ctx.setLineDash([]);
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
                    ctx.lineWidth = 4;
                    ctx.moveTo(x, 0);
                    ctx.lineTo(x, h);
                    ctx.stroke();

                    // Draw Blue Dashed Line
                    ctx.beginPath();
                    ctx.setLineDash([10, 8]);
                    ctx.strokeStyle = '#2563eb';
                    ctx.lineWidth = 2;
                    ctx.moveTo(x, 0);
                    ctx.lineTo(x, h);
                    ctx.stroke();

                    const label = e.toFixed(isGeographic ? 5 : 3);
                    ctx.font = 'bold 24px "Inter", sans-serif';
                    this._drawHaloText(ctx, label, x, h - 12, 'center', 'bottom', '#2563eb');
                    this._drawHaloText(ctx, label, x, 12, 'center', 'top', '#2563eb');
                }

                // Horizontal lines (Northings)
                for (let n = Math.ceil(minN / intervalN) * intervalN; n <= maxN; n += intervalN) {
                    const y = h - ((n - minN) / height_m) * h;
                    if (y < 1 || y > h - 1) continue;

                    // Draw White Buffer Line
                    ctx.beginPath();
                    ctx.setLineDash([]);
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
                    ctx.lineWidth = 4;
                    ctx.moveTo(0, y);
                    ctx.lineTo(w, y);
                    ctx.stroke();

                    // Draw Blue Dashed Line
                    ctx.beginPath();
                    ctx.setLineDash([10, 8]);
                    ctx.strokeStyle = '#2563eb';
                    ctx.lineWidth = 2;
                    ctx.moveTo(0, y);
                    ctx.lineTo(w, y);
                    ctx.stroke();

                    const label = n.toFixed(isGeographic ? 5 : 3);
                    ctx.font = 'bold 24px "Inter", sans-serif';
                    this._drawHaloText(ctx, label, 12, y, 'left', 'middle', '#2563eb');
                    this._drawHaloText(ctx, label, w - 12, y, 'right', 'middle', '#2563eb');
                }
                ctx.restore();
            }

            // 2. Scale Bar
            this._drawScaleBar(ctx, w, h, extent, viewProj);

            // 3. Metadata & North Arrow
            this._drawMetadataBlock(ctx, w, h, crs);
        }

        _drawHaloText(ctx, text, x, y, align, baseline, color) {
            ctx.save();
            ctx.textAlign = align;
            ctx.textBaseline = baseline;
            ctx.strokeStyle = 'rgba(255, 255, 255, 1)';
            ctx.lineWidth = 6;
            ctx.lineJoin = 'round';
            ctx.strokeText(text, x, y);
            ctx.fillStyle = color || '#0f172a';
            ctx.fillText(text, x, y);
            ctx.restore();
        }

        _drawScaleBar(ctx, w, h, extent, viewProj) {
            const bl_ll = ol.proj.transform([extent[0], extent[1]], viewProj, 'EPSG:4326');
            const br_ll = ol.proj.transform([extent[2], extent[1]], viewProj, 'EPSG:4326');
            const width_m = ol.sphere.getDistance(bl_ll, br_ll);
            const pxPerM = w / width_m;

            const targets = [1, 2, 5, 10, 20, 50, 100, 200, 250, 500, 1000, 2000, 5000];
            const ideal_m = (w * 0.2) / pxPerM;
            const scale_m = targets.reduce((prev, curr) => 
                Math.abs(curr - ideal_m) < Math.abs(prev - ideal_m) ? curr : prev
            );
            const scale_px = scale_m * pxPerM;

            ctx.save();
            const startX = 25;
            const startY = h - 45;
            
            // Bar background shadow
            ctx.fillStyle = 'rgba(255,255,255,0.7)';
            ctx.fillRect(startX - 5, startY - 20, scale_px + 10, 35);
            
            // Draw alternating segments
            ctx.lineWidth = 1.5;
            ctx.strokeStyle = '#000';
            const segments = 2;
            for (let i = 0; i < segments; i++) {
                ctx.fillStyle = i % 2 === 0 ? '#000' : '#fff';
                ctx.fillRect(startX + (i * scale_px) / segments, startY, scale_px / segments, 8);
                ctx.strokeRect(startX + (i * scale_px) / segments, startY, scale_px / segments, 8);
            }
            
            ctx.font = 'bold 11px sans-serif';
            this._drawHaloText(ctx, scale_m + ' m', startX + scale_px / 2, startY - 4, 'center', 'bottom');
            ctx.restore();
        }

        _drawMetadataBlock(ctx, w, h, crs) {
            ctx.save();
            
            // Background for readability
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.fillRect(w - 230, h - 55, 220, 45);
            ctx.strokeStyle = 'rgba(0,0,0,0.1)';
            ctx.strokeRect(w - 230, h - 55, 220, 45);

            const crsName = CRS_NAMES[crs] || crs;
            ctx.font = 'bold 11px sans-serif';
            this._drawHaloText(ctx, 'GEOSPATIALNETWORKUG', w - 15, h - 38, 'right', 'bottom');
            ctx.font = '10px sans-serif';
            this._drawHaloText(ctx, 'System: ' + crsName, w - 15, h - 24, 'right', 'bottom');
            this._drawHaloText(ctx, 'Date: ' + new Date().toLocaleDateString(), w - 15, h - 12, 'right', 'bottom');

            // North Arrow next to info
            const nx = w - 215;
            const ny = h - 32;
            ctx.translate(nx, ny);
            ctx.beginPath();
            ctx.moveTo(0, -15);
            ctx.lineTo(6, 4);
            ctx.lineTo(0, 0);
            ctx.lineTo(-6, 4);
            ctx.closePath();
            ctx.fillStyle = '#000';
            ctx.fill();
            ctx.stroke();
            ctx.font = 'bold 10px sans-serif';
            this._drawHaloText(ctx, 'N', 0, -18, 'center', 'bottom');

            ctx.restore();
        }

        /** Extract corner points to map overlay (legacy visual) */
        showExtractedVerticesOnMap(feature) {
            const source = this.getExtractorSource?.();
            if (!source) return;
            source.clear();
            const ring = this._polygonRing(feature);
            const crs = this.state.exportCrs;
            const viewProj = this.view.getProjection();
            let id = 1;
            ring.forEach((coord, index) => {
                if (index === ring.length - 1) return;
                const t = ol.proj.transform(coord, viewProj, crs);
                const pt = new ol.Feature({
                    geometry: new ol.geom.Point(ol.proj.transform([parseFloat(t[0]), parseFloat(t[1])], crs, viewProj))
                });
                pt.setStyle(
                    new ol.style.Style({
                        image: new ol.style.Circle({
                            radius: 6,
                            fill: new ol.style.Fill({ color: 'rgba(255,0,0,0.7)' }),
                            stroke: new ol.style.Stroke({ color: 'red', width: 2 })
                        }),
                        text: new ol.style.Text({
                            text: String(id),
                            offsetY: -15,
                            font: 'bold 12px sans-serif',
                            fill: new ol.style.Fill({ color: 'red' }),
                            stroke: new ol.style.Stroke({ color: 'white', width: 3 })
                        })
                    })
                );
                source.addFeature(pt);
                id++;
            });
        }
    }

    global.GisExportEngine = GisExportEngine;
    global.GSPNET_EXPORT_FORMATS = EXPORT_FORMATS;
})(window);
