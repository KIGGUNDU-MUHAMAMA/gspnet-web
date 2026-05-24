/**
 * sentinel-analytics.js
 * ─────────────────────────────────────────────────────────────────────────────
 * GSP.NET Platform — Satellite Analytics Module
 * Handles:
 *  • OpenLayers WMS layer (CDSE) with full controls (index, opacity, date, cloud cover)
 *  • Dynamic AOI: draw polygon OR use DTM extent
 *  • Area limit enforcement (50 km²) with visual feedback
 *  • Supabase Edge Function invocation (gspnet-sentinel-analytics)
 *  • Chart.js multi-index time-series visualisation (NDVI, NDMI, NDRE, NDWI)
 *  • Multi-snapshot capture system (one snapshot per index per date range)
 *  • GSP.NET-branded multi-page A4 PDF report (jsPDF, manual table, html2canvas)
 *  • Cesium 3D WMS draping bridge (window.sentinelDrapeOn3D)
 * ─────────────────────────────────────────────────────────────────────────────
 */

(function () {
    'use strict';

    // ─────────────────────────────────────────────────────────────────────────
    // CONSTANTS
    // ─────────────────────────────────────────────────────────────────────────
    const CDSE_WMS_URL = 'https://sh.dataspace.copernicus.eu/ogc/wms/ab8b1162-e45e-4405-9db6-aa882b920217';
    const SUPABASE_URL = 'https://kwssgfanbntfjdclchfi.supabase.co';
    const EDGE_FN_URL  = `${SUPABASE_URL}/functions/v1/gspnet-sentinel-analytics`;

    const MAX_AREA_SQ_KM = 50;
    const MIN_ZOOM_FOR_WMS = 12;

    const LAYER_CONFIGS = {
        TRUE_COLOR:      { name: 'True Color',         icon: 'fa-camera',            color: '#3b82f6' },
        FALSE_COLOR:     { name: 'False Color (CIR)',   icon: 'fa-palette',           color: '#8b5cf6' },
        NDVI:            { name: 'NDVI (Vegetation)',   icon: 'fa-leaf',              color: '#22c55e' },
        NDMI:            { name: 'NDMI (Moisture)',     icon: 'fa-tint',              color: '#06b6d4' },
        NDWI:            { name: 'NDWI (Water)',        icon: 'fa-water',             color: '#0ea5e9' },
        MOISTURE_STRESS: { name: 'Moisture Stress',     icon: 'fa-thermometer-half',  color: '#f59e0b' },
        SWIR:            { name: 'SWIR',                icon: 'fa-wave-square',       color: '#ef4444' },
    };

    // ─────────────────────────────────────────────────────────────────────────
    // STATE
    // ─────────────────────────────────────────────────────────────────────────
    let state = {
        wmsLayer:         null,
        aoiLayer:         null,
        aoiFeature:       null,
        drawInteraction:  null,
        currentIndex:     'TRUE_COLOR',
        currentDate:      getTodayRange(),
        maxCC:            20,
        wmsOpacity:       0.75,
        analyticsData:    null,
        chartInstance:    null,
        snapshots:        [],
        isLoading:        false,
        isWmsVisible:     false,
        aoiAreaSqKm:      0,
    };

    // ─────────────────────────────────────────────────────────────────────────
    // UTILITY
    // ─────────────────────────────────────────────────────────────────────────
    function getMap()     { return window.map || null; }
    function getAnonKey() { return window.supabaseKey || ''; }

    function toast(msg, type = 'info') {
        if (typeof showToast === 'function') showToast(msg, type);
        else console.log(`[Sentinel] ${type}: ${msg}`);
    }

    function getTodayRange() {
        const now  = new Date();
        const to   = now.toISOString().slice(0, 10);
        const from = new Date(now - 90 * 864e5).toISOString().slice(0, 10);
        return { from, to };
    }

    function fmtArea(sqKm) {
        if (!sqKm || sqKm === 0) return '—';
        if (sqKm < 1) return (sqKm * 100).toFixed(1) + ' ha';
        return sqKm.toFixed(2) + ' km²';
    }

    function computeAreaSqKm(feature) {
        try {
            const geom = feature.getGeometry();
            return geom.getArea() / 1e6;
        } catch (e) { return 0; }
    }

    function featureToWgs84GeoJSON(feature) {
        const geom = feature.getGeometry().clone();
        geom.transform('EPSG:3857', 'EPSG:4326');
        return { type: 'Polygon', coordinates: geom.getCoordinates() };
    }

    function buildWmsTime(from, to) { return `${from}/${to}`; }

    // ─────────────────────────────────────────────────────────────────────────
    // WMS LAYER MANAGEMENT
    // NOTE: CDSE WMS does not support geometry clipping via WMS params.
    // Token saving comes from minZoom restriction + 50 km² AOI cap on stats.
    // ─────────────────────────────────────────────────────────────────────────
    function buildWmsParams() {
        return {
            SERVICE:     'WMS',
            VERSION:     '1.3.0',
            REQUEST:     'GetMap',
            FORMAT:      'image/png',
            TRANSPARENT: 'true',
            LAYERS:      state.currentIndex,
            TIME:        buildWmsTime(state.currentDate.from, state.currentDate.to),
            MAXCC:       state.maxCC,
            PRIORITY:    'leastCC',
            SHOWLOGO:    'false',
        };
    }

    function createWmsLayer() {
        return new ol.layer.Tile({
            title: 'Sentinel Imagery',
            source: new ol.source.TileWMS({
                url:          CDSE_WMS_URL,
                params:       buildWmsParams(),
                serverType:   'geoserver',
                crossOrigin:  'anonymous',
                transition:   0,
            }),
            opacity:  state.wmsOpacity,
            zIndex:   0,
            minZoom:  MIN_ZOOM_FOR_WMS,
            visible:  true,
        });
    }

    function addOrUpdateWmsLayer() {
        const map = getMap();
        if (!map) return;
        if (state.wmsLayer) {
            state.wmsLayer.getSource().updateParams(buildWmsParams());
            state.wmsLayer.setOpacity(state.wmsOpacity);
            state.wmsLayer.setVisible(true);
        } else {
            state.wmsLayer = createWmsLayer();
            map.getLayers().insertAt(1, state.wmsLayer);
        }
        state.isWmsVisible = true;
        updateWmsStatusUI();
    }

    function removeWmsLayer() {
        const map = getMap();
        if (map && state.wmsLayer) {
            map.removeLayer(state.wmsLayer);
            state.wmsLayer = null;
        }
        state.isWmsVisible = false;
        updateWmsStatusUI();
    }

    function updateWmsStatusUI() {
        const badge     = document.getElementById('sentinelWmsBadge');
        const toggleBtn = document.getElementById('sentinelWmsToggle');
        const indexLabel = LAYER_CONFIGS[state.currentIndex]?.name || state.currentIndex;
        if (badge) {
            badge.textContent = state.isWmsVisible ? `● ${indexLabel}` : '○ Off';
            badge.style.color = state.isWmsVisible
                ? LAYER_CONFIGS[state.currentIndex]?.color || '#22c55e'
                : '#64748b';
        }
        if (toggleBtn) {
            toggleBtn.textContent = state.isWmsVisible ? 'Hide Layer' : 'Show Layer';
            toggleBtn.className = state.isWmsVisible
                ? 'sentinel-btn sentinel-btn-warning'
                : 'sentinel-btn sentinel-btn-primary';
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AOI MANAGEMENT
    // ─────────────────────────────────────────────────────────────────────────
    function initAoiLayer() {
        const map = getMap();
        if (!map || state.aoiLayer) return;
        const source = new ol.source.Vector();
        state.aoiLayer = new ol.layer.Vector({
            source,
            zIndex: 2,
            style: new ol.style.Style({
                stroke: new ol.style.Stroke({ color: '#f59e0b', width: 2.5, lineDash: [8, 4] }),
                fill:   new ol.style.Fill({ color: 'rgba(245,158,11,0.08)' }),
            }),
        });
        map.addLayer(state.aoiLayer);
    }

    function startDrawAOI() {
        const map = getMap();
        if (!map) { toast('Map not ready', 'error'); return; }
        initAoiLayer();
        if (state.drawInteraction) {
            map.removeInteraction(state.drawInteraction);
            state.drawInteraction = null;
        }
        toast('Click to draw AOI polygon. Double-click to finish.', 'info');
        updateAoiStatusUI('Drawing…');
        state.drawInteraction = new ol.interaction.Draw({ source: state.aoiLayer.getSource(), type: 'Polygon' });
        state.drawInteraction.on('drawstart', () => {
            state.aoiLayer.getSource().clear();
            state.aoiFeature = null;
        });
        state.drawInteraction.on('drawend', (evt) => {
            state.aoiFeature = evt.feature;
            map.removeInteraction(state.drawInteraction);
            state.drawInteraction = null;
            const areaSqKm = computeAreaSqKm(state.aoiFeature);
            state.aoiAreaSqKm = areaSqKm;
            if (areaSqKm > MAX_AREA_SQ_KM) {
                toast(`AOI too large (${fmtArea(areaSqKm)}). Max is ${MAX_AREA_SQ_KM} km².`, 'error');
                state.aoiLayer.getSource().clear();
                state.aoiFeature = null;
                updateAoiStatusUI('');
                return;
            }
            updateAoiStatusUI(`✓ ${fmtArea(areaSqKm)}`);
            toast(`AOI set: ${fmtArea(areaSqKm)}`, 'success');
        });
        map.addInteraction(state.drawInteraction);
    }

    function useDtmExtent() {
        const map = getMap();
        const t3d = window.terrain3DState;
        if (!map) { toast('Map not ready', 'error'); return; }
        initAoiLayer();
        state.aoiLayer.getSource().clear();
        state.aoiFeature = null;

        let usedExtent = false;
        if (t3d && t3d.extentLayer) {
            const src      = t3d.extentLayer.getSource();
            const features = src ? src.getFeatures() : [];
            if (features.length > 0) {
                const cloned = features[0].clone();
                state.aoiLayer.getSource().addFeature(cloned);
                state.aoiFeature = cloned;
                usedExtent = true;
            }
        }
        if (!usedExtent) {
            const view    = map.getView();
            const extent  = view.calculateExtent(map.getSize());
            const polygon = ol.geom.Polygon.fromExtent(extent);
            const feature = new ol.Feature({ geometry: polygon });
            state.aoiLayer.getSource().addFeature(feature);
            state.aoiFeature = feature;
        }

        const areaSqKm = computeAreaSqKm(state.aoiFeature);
        state.aoiAreaSqKm = areaSqKm;

        if (areaSqKm > MAX_AREA_SQ_KM) {
            toast(`Extent too large (${fmtArea(areaSqKm)}). Max ${MAX_AREA_SQ_KM} km². Zoom in closer.`, 'error');
            state.aoiLayer.getSource().clear();
            state.aoiFeature = null;
            updateAoiStatusUI('');
            return;
        }
        updateAoiStatusUI(`✓ ${fmtArea(areaSqKm)} (extent)`);
        toast(`Using current extent as AOI: ${fmtArea(areaSqKm)}`, 'success');
    }

    function clearAOI() {
        if (state.drawInteraction) {
            const map = getMap();
            if (map) map.removeInteraction(state.drawInteraction);
            state.drawInteraction = null;
        }
        if (state.aoiLayer) state.aoiLayer.getSource().clear();
        state.aoiFeature    = null;
        state.aoiAreaSqKm   = 0;
        updateAoiStatusUI('');
    }

    function updateAoiStatusUI(text) {
        const el = document.getElementById('sentinelAoiStatus');
        if (el) el.textContent = text;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // FETCH STATISTICS
    // ─────────────────────────────────────────────────────────────────────────
    async function fetchStatistics() {
        if (!state.aoiFeature) {
            toast('Please draw an AOI or use DTM Extent first.', 'error');
            return;
        }
        if (state.isLoading) { toast('Analytics already running…', 'warning'); return; }

        const from     = document.getElementById('sentinelDateFrom')?.value || state.currentDate.from;
        const to       = document.getElementById('sentinelDateTo')?.value   || state.currentDate.to;
        const interval = document.getElementById('sentinelInterval')?.value  || 'P16D';

        if (!from || !to) { toast('Please select date range.', 'error'); return; }

        const aoi = featureToWgs84GeoJSON(state.aoiFeature);
        setLoadingState(true);

        try {
            // The Edge Function uses --no-verify-jwt, so just send anon key as apikey header.
            const response = await fetch(EDGE_FN_URL, {
                method:  'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey':       getAnonKey(),
                    'Authorization': `Bearer ${getAnonKey()}`,
                },
                body: JSON.stringify({ aoi, date_from: from, date_to: to, interval }),
            });

            let result;
            try {
                result = await response.json();
            } catch (parseErr) {
                const text = await response.text().catch(() => '(no body)');
                toast(`Server returned non-JSON response (status ${response.status})`, 'error');
                console.error('[Sentinel] Non-JSON response:', text);
                setLoadingState(false);
                return;
            }

            if (!response.ok || !result.success) {
                const errMsg = result?.error || `HTTP ${response.status}`;
                toast(`Analytics failed: ${errMsg}`, 'error');
                console.error('[Sentinel] Edge Function error:', result);
                setLoadingState(false);
                return;
            }

            state.analyticsData = result;
            state.currentDate   = { from, to };
            renderChart(result);
            renderStatsTable(result);
            showAnalyticsPanels();
            toast('Satellite analytics loaded successfully!', 'success');

        } catch (e) {
            toast(`Network error: ${e.message}`, 'error');
            console.error('[Sentinel] fetchStatistics error:', e);
        }
        setLoadingState(false);
    }

    function setLoadingState(loading) {
        state.isLoading = loading;
        const btn     = document.getElementById('sentinelFetchBtn');
        const spinner = document.getElementById('sentinelLoadingSpinner');
        if (btn) {
            btn.disabled  = loading;
            btn.innerHTML = loading
                ? '<i class="fas fa-spinner fa-spin"></i> Fetching Data…'
                : '<i class="fas fa-satellite"></i> Generate Analytics';
        }
        if (spinner) spinner.style.display = loading ? 'flex' : 'none';
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CHART.JS RENDERING
    // ─────────────────────────────────────────────────────────────────────────
    function renderChart(data) {
        const canvas = document.getElementById('sentinelAnalyticsChart');
        if (!canvas) return;
        if (state.chartInstance) { state.chartInstance.destroy(); state.chartInstance = null; }

        const ndvi = data.ndvi_intervals || [];
        const ndmi = data.ndmi_intervals || [];
        const ndre = data.ndre_intervals || [];
        const ndwi = data.ndwi_intervals || [];
        const labels = ndvi.map(d => d.from ? d.from.slice(0, 10) : '');

        const mkDataset = (label, arr, color, hidden = false) => ({
            label,
            data: arr.map(d => d.mean !== null && d.mean !== undefined ? parseFloat(d.mean.toFixed(4)) : null),
            borderColor: color,
            backgroundColor: color.replace(')', ', 0.08)').replace('rgb', 'rgba'),
            borderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 7,
            tension: 0.35,
            fill: false,
            spanGaps: true,
            hidden,
        });

        state.chartInstance = new Chart(canvas, {
            type: 'line',
            data: {
                labels,
                datasets: [
                    mkDataset('NDVI (Vegetation)', ndvi, '#22c55e'),
                    mkDataset('NDMI (Moisture)',   ndmi, '#06b6d4'),
                    mkDataset('NDRE (Red-Edge)',    ndre, '#f59e0b'),
                    mkDataset('NDWI (Water)',       ndwi, '#0ea5e9', true),
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: { color: '#cbd5e1', font: { size: 11 }, usePointStyle: true },
                    },
                    tooltip: {
                        backgroundColor: '#0f172a',
                        titleColor: '#f1f5f9',
                        bodyColor: '#94a3b8',
                        borderColor: '#334155',
                        borderWidth: 1,
                        callbacks: {
                            label: ctx => `${ctx.dataset.label}: ${ctx.parsed.y !== null ? ctx.parsed.y.toFixed(4) : 'N/A'}`,
                        },
                    },
                },
                scales: {
                    x: {
                        ticks: { color: '#94a3b8', maxRotation: 45, font: { size: 10 } },
                        grid:  { color: 'rgba(148,163,184,0.1)' },
                    },
                    y: {
                        min: -1, max: 1,
                        ticks: { color: '#94a3b8', font: { size: 10 } },
                        grid:  { color: 'rgba(148,163,184,0.1)' },
                        title: { display: true, text: 'Index Value', color: '#64748b', font: { size: 11 } },
                    },
                },
            },
        });
    }

    function renderStatsTable(data) {
        const container = document.getElementById('sentinelStatsTable');
        if (!container) return;
        const rows = computeStatsRows(data);
        container.innerHTML = `
            <table style="width:100%;border-collapse:collapse;font-size:0.8rem;">
                <thead>
                    <tr style="background:#1e293b;color:#94a3b8;">
                        <th style="padding:6px 8px;text-align:left;">Index</th>
                        <th style="padding:6px 8px;text-align:center;">Min</th>
                        <th style="padding:6px 8px;text-align:center;">Max</th>
                        <th style="padding:6px 8px;text-align:center;">Mean</th>
                        <th style="padding:6px 8px;text-align:center;">Scenes</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows.map(r => `
                        <tr style="border-bottom:1px solid #1e293b;">
                            <td style="padding:6px 8px;"><span style="color:${r.cssColor};font-weight:600;">${r.name}</span></td>
                            <td style="padding:6px 8px;text-align:center;color:#e2e8f0;">${r.mn}</td>
                            <td style="padding:6px 8px;text-align:center;color:#e2e8f0;">${r.mx}</td>
                            <td style="padding:6px 8px;text-align:center;color:#e2e8f0;">${r.av}</td>
                            <td style="padding:6px 8px;text-align:center;color:#64748b;">${r.ct}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>`;
    }

    /** Shared stats computation used by both screen table and PDF. */
    function computeStatsRows(data) {
        const stat = (arr) => {
            const vals = (arr || []).map(d => d.mean).filter(v => v !== null && v !== undefined && Number.isFinite(v));
            if (!vals.length) return { mn: 'N/A', mx: 'N/A', av: 'N/A', ct: 0 };
            return {
                mn: Math.min(...vals).toFixed(4),
                mx: Math.max(...vals).toFixed(4),
                av: (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(4),
                ct: vals.length,
            };
        };
        return [
            { name: 'NDVI', desc: 'Vegetation Health',       cssColor: '#22c55e', pdfColor: [34,197,94],   ...stat(data.ndvi_intervals) },
            { name: 'NDMI', desc: 'Moisture Index',          cssColor: '#06b6d4', pdfColor: [6,182,212],   ...stat(data.ndmi_intervals) },
            { name: 'NDRE', desc: 'Red-Edge Chlorophyll',    cssColor: '#f59e0b', pdfColor: [245,158,11],  ...stat(data.ndre_intervals) },
            { name: 'NDWI', desc: 'Water Bodies / Flooding', cssColor: '#0ea5e9', pdfColor: [14,165,233],  ...stat(data.ndwi_intervals) },
        ];
    }

    function showAnalyticsPanels() {
        ['sentinelChartPanel', 'sentinelStatsPanel', 'sentinelReportPanel'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = 'block';
        });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SNAPSHOT SYSTEM
    // ─────────────────────────────────────────────────────────────────────────
    async function captureMapSnapshot() {
        const map = getMap();
        if (!map) { toast('Map not ready', 'error'); return; }

        const indexLabel = LAYER_CONFIGS[state.currentIndex]?.name || state.currentIndex;
        const from = document.getElementById('sentinelDateFrom')?.value || state.currentDate.from;
        const to   = document.getElementById('sentinelDateTo')?.value   || state.currentDate.to;

        toast(`Capturing ${indexLabel} snapshot…`, 'info');

        return new Promise((resolve) => {
            map.once('rendercomplete', async () => {
                try {
                    // Try html2canvas on the map DIV first for clean flat render
                    const h2c     = window.html2canvas || (typeof html2canvas !== 'undefined' ? html2canvas : null);
                    const mapDiv  = document.getElementById('map');
                    let dataUrl   = null;

                    if (h2c && mapDiv) {
                        try {
                            const captured = await h2c(mapDiv, {
                                useCORS:    true,
                                allowTaint: false,
                                scale:      1,
                                logging:    false,
                                // No CSS transforms — get the flat 2D map
                                ignoreElements: (el) => el.classList?.contains('ol-control'),
                            });
                            dataUrl = captured.toDataURL('image/jpeg', 0.88);
                        } catch (h2cErr) {
                            console.warn('[Sentinel] html2canvas failed, falling back to canvas:', h2cErr);
                        }
                    }

                    // Fallback: composite all map canvases manually
                    if (!dataUrl) {
                        const canvases = mapDiv ? [...mapDiv.querySelectorAll('canvas')] : [];
                        if (canvases.length > 0) {
                            const first   = canvases[0];
                            const merged  = document.createElement('canvas');
                            merged.width  = first.width;
                            merged.height = first.height;
                            const ctx     = merged.getContext('2d');
                            canvases.forEach(c => {
                                try { ctx.drawImage(c, 0, 0); } catch (_) {}
                            });
                            dataUrl = merged.toDataURL('image/jpeg', 0.88);
                        }
                    }

                    if (!dataUrl) { toast('Could not capture map', 'error'); resolve(null); return; }

                    // Store actual map aspect ratio with the snapshot for correct PDF rendering
                    const mapDiv2  = document.getElementById('map');
                    const mapW     = mapDiv2?.offsetWidth  || 800;
                    const mapH     = mapDiv2?.offsetHeight || 600;

                    const snapshot = {
                        label:       indexLabel,
                        index:       state.currentIndex,
                        dateFrom:    from,
                        dateTo:      to,
                        dataUrl,
                        aspectRatio: mapW / mapH,   // width / height
                        timestamp:   new Date().toISOString(),
                    };
                    state.snapshots.push(snapshot);
                    updateSnapshotStrip();
                    toast(`Snapshot captured: ${indexLabel}`, 'success');
                    resolve(snapshot);
                } catch (e) {
                    toast('Snapshot failed: ' + e.message, 'error');
                    resolve(null);
                }
            });
            map.renderSync();
        });
    }

    function removeSnapshot(index) {
        state.snapshots.splice(index, 1);
        updateSnapshotStrip();
    }

    function updateSnapshotStrip() {
        const strip = document.getElementById('sentinelSnapshotStrip');
        if (!strip) return;
        if (state.snapshots.length === 0) {
            strip.innerHTML = '<p style="font-size:0.75rem;color:#475569;text-align:center;padding:8px 0;">No snapshots yet.</p>';
            return;
        }
        strip.innerHTML = state.snapshots.map((s, i) => `
            <div style="position:relative;display:inline-block;margin:4px;">
                <img src="${s.dataUrl}"
                    title="${s.label} (${s.dateFrom}→${s.dateTo})"
                    style="width:70px;height:50px;object-fit:cover;border-radius:4px;border:2px solid ${LAYER_CONFIGS[s.index]?.color || '#334155'};cursor:pointer;transition:transform 0.2s;"
                    onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'"
                />
                <span style="position:absolute;top:-4px;right:-4px;background:#ef4444;color:white;border-radius:50%;width:16px;height:16px;font-size:9px;display:flex;align-items:center;justify-content:center;cursor:pointer;line-height:1;"
                    onclick="window.sentinelRemoveSnapshot(${i})" title="Remove">×</span>
                <div style="font-size:9px;color:#64748b;text-align:center;max-width:70px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${s.label}</div>
            </div>
        `).join('');
    }
    window.sentinelRemoveSnapshot = removeSnapshot;

    // ─────────────────────────────────────────────────────────────────────────
    // PDF REPORT GENERATION
    // ─────────────────────────────────────────────────────────────────────────
    async function generatePdfReport() {
        if (!state.analyticsData && state.snapshots.length === 0) {
            toast('Please run analytics or capture snapshots first.', 'error');
            return;
        }

        toast('Generating GSP.NET Satellite Report…', 'info');

        try {
            // Resolve jsPDF — handles both UMD bundles
            const jsPDFCtor = (window.jspdf?.jsPDF) || window.jsPDF || null;
            if (!jsPDFCtor) {
                toast('PDF library not loaded. Please refresh the page.', 'error');
                return;
            }

            const doc      = new jsPDFCtor({ orientation: 'portrait', unit: 'mm', format: 'a4' });
            const pageW    = doc.internal.pageSize.getWidth();   // 210 mm
            const pageH    = doc.internal.pageSize.getHeight();  // 297 mm
            const margin   = 15;
            const contentW = pageW - margin * 2;                 // 180 mm

            const from       = document.getElementById('sentinelDateFrom')?.value || state.currentDate.from;
            const to         = document.getElementById('sentinelDateTo')?.value   || state.currentDate.to;
            const intervalEl = document.getElementById('sentinelInterval');
            const intervalRaw = intervalEl?.value || 'P16D';
            const intervalLabel = intervalRaw === 'P10D' ? '10-day' : intervalRaw === 'P16D' ? '16-day' : '1-month';

            const area       = state.analyticsData?.meta?.area_sq_km
                ? `${state.analyticsData.meta.area_sq_km.toFixed(2)} km²`
                : fmtArea(state.aoiAreaSqKm);
            const resolution = state.analyticsData?.meta?.resolution_m
                ? `${state.analyticsData.meta.resolution_m} m`
                : 'Auto';

            // ── Helper: page footer ─────────────────────────────────────────
            const drawFooter = (pageNum, total) => {
                doc.setDrawColor(0);
                doc.setLineWidth(0.3);
                doc.line(margin, pageH - 12, pageW - margin, pageH - 12);
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(7);
                doc.setTextColor(100, 100, 100);
                doc.text('GEOSPATIAL NETWORK (GSP.NET)  |  Sentinel-2 L2A Satellite Analytics  |  Copernicus Data Space Ecosystem', pageW / 2, pageH - 7, { align: 'center' });
                doc.text(`Page ${pageNum}`, pageW - margin, pageH - 7, { align: 'right' });
            };

            // ── Helper: section header bar ──────────────────────────────────
            const drawSectionHeader = (title, subtitle) => {
                doc.setFillColor(20, 20, 20);
                doc.rect(0, 0, pageW, 18, 'F');
                // Left accent stripe
                doc.setFillColor(255, 255, 255);
                doc.rect(0, 0, 4, 18, 'F');
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(11);
                doc.setTextColor(255, 255, 255);
                doc.text(title, margin + 2, 12);
                if (subtitle) {
                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(8);
                    doc.setTextColor(160, 160, 160);
                    doc.text(subtitle, pageW - margin, 12, { align: 'right' });
                }
            };

            let pageNum = 1;
            let totalPages = 1 + (state.analyticsData ? 1 : 0) + state.snapshots.length;

            // ═══════════════════════════════════════════════════════════════
            // PAGE 1: COVER PAGE (Black & White, print-friendly)
            // ═══════════════════════════════════════════════════════════════
            // White background
            doc.setFillColor(255, 255, 255);
            doc.rect(0, 0, pageW, pageH, 'F');

            // Top black header band
            doc.setFillColor(10, 10, 10);
            doc.rect(0, 0, pageW, 55, 'F');

            // Left white accent stripe
            doc.setFillColor(255, 255, 255);
            doc.rect(0, 0, 5, 55, 'F');

            // Title
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(24);
            doc.setTextColor(255, 255, 255);
            doc.text('Satellite Analytics', margin + 4, 28);
            doc.setFontSize(14);
            doc.setTextColor(200, 200, 200);
            doc.text('Surveyor Report', margin + 4, 42);

            // Report date (top right)
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            doc.setTextColor(180, 180, 180);
            doc.text(new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' }), pageW - margin, 12, { align: 'right' });

            // ── Metadata section ────────────────────────────────────────────
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9);
            doc.setTextColor(80, 80, 80);
            doc.text('REPORT DETAILS', margin, 72);
            doc.setDrawColor(0, 0, 0);
            doc.setLineWidth(0.5);
            doc.line(margin, 74, pageW - margin, 74);

            const metaRows = [
                ['Platform',        'Geospatial Network (GSP.NET)'],
                ['Satellite Source','Sentinel-2 Level-2A (Copernicus CDSE)'],
                ['Analysis Period', `${from}  →  ${to}`],
                ['Time Interval',   intervalLabel],
                ['Area of Interest',area],
                ['Resolution',      resolution],
                ['Indices Computed','NDVI · NDMI · NDRE · NDWI'],
                ['Generated By',    'GSP.NET Satellite Analytics Engine'],
                ['Generated On',    new Date().toLocaleString()],
            ];

            let metaY = 82;
            metaRows.forEach(([label, value], i) => {
                if (i % 2 === 0) {
                    doc.setFillColor(245, 245, 245);
                    doc.rect(margin, metaY - 4, contentW, 9, 'F');
                }
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(8.5);
                doc.setTextColor(60, 60, 60);
                doc.text(label + ':', margin + 2, metaY + 2);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(20, 20, 20);
                doc.text(String(value), margin + 55, metaY + 2);
                metaY += 9;
            });

            // ── Index legend box ────────────────────────────────────────────
            metaY += 6;
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9);
            doc.setTextColor(80, 80, 80);
            doc.text('VEGETATION & MOISTURE INDICES INCLUDED', margin, metaY);
            doc.line(margin, metaY + 2, pageW - margin, metaY + 2);
            metaY += 8;

            const indexDescs = [
                ['NDVI', 'Normalised Difference Vegetation Index — Photosynthetically active vegetation density and vigour.'],
                ['NDMI', 'Normalised Difference Moisture Index — Canopy water content and vegetation moisture stress.'],
                ['NDRE', 'Normalised Difference Red-Edge Index — Chlorophyll concentration in the leaf mesophyll layer.'],
                ['NDWI', 'Normalised Difference Water Index — Open water body delineation and flood extent mapping.'],
            ];
            indexDescs.forEach(([name, desc]) => {
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(9);
                doc.setTextColor(20, 20, 20);
                doc.text(name + ':', margin + 2, metaY);
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(8);
                doc.setTextColor(60, 60, 60);
                const lines = doc.splitTextToSize(desc, contentW - 24);
                doc.text(lines, margin + 22, metaY);
                metaY += lines.length * 5 + 3;
            });

            // ── Disclaimer ──────────────────────────────────────────────────
            const disclaimerY = pageH - 40;
            doc.setDrawColor(150, 150, 150);
            doc.setLineWidth(0.2);
            doc.line(margin, disclaimerY, pageW - margin, disclaimerY);
            doc.setFont('helvetica', 'italic');
            doc.setFontSize(7);
            doc.setTextColor(120, 120, 120);
            const disclaimer = 'This report is generated from Sentinel-2 multispectral imagery provided via the Copernicus Data Space Ecosystem (CDSE). ' +
                'Statistical values represent cloud-masked scene averages over the specified AOI and time interval. ' +
                'All index values are dimensionless and range from -1 to +1. This report is intended for professional surveying use only.';
            const discLines = doc.splitTextToSize(disclaimer, contentW);
            doc.text(discLines, margin, disclaimerY + 5);

            drawFooter(pageNum, totalPages);

            // ═══════════════════════════════════════════════════════════════
            // PAGE 2: TIME-SERIES STATISTICS + CHART
            // ═══════════════════════════════════════════════════════════════
            if (state.analyticsData) {
                pageNum++;
                doc.addPage();
                doc.setFillColor(255, 255, 255);
                doc.rect(0, 0, pageW, pageH, 'F');

                drawSectionHeader('Time-Series Statistics', `${from}  →  ${to}`);

                const statsRows = computeStatsRows(state.analyticsData);

                // ── Stats narrative ─────────────────────────────────────────
                let cy = 25;
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(8);
                doc.setTextColor(60, 60, 60);
                const narrative = `The following statistics were computed from Sentinel-2 L2A imagery over the selected AOI (${area}) ` +
                    `between ${from} and ${to} at a ${intervalLabel} interval. Values represent cloud-masked pixel means at ${resolution} spatial resolution.`;
                const narLines = doc.splitTextToSize(narrative, contentW);
                doc.text(narLines, margin, cy);
                cy += narLines.length * 5 + 6;

                // ── Statistics table ────────────────────────────────────────
                const colX    = [margin, margin + 20, margin + 72, margin + 100, margin + 128, margin + 156];
                const colW    = [20, 52, 28, 28, 28, 24];
                const rowH    = 8.5;
                const headers = ['Index', 'Description', 'Minimum', 'Maximum', 'Mean', 'Scenes'];

                // Header
                doc.setFillColor(20, 20, 20);
                doc.rect(margin, cy, contentW, rowH, 'F');
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(8);
                doc.setTextColor(220, 220, 220);
                headers.forEach((h, i) => doc.text(h, colX[i] + 2, cy + 5.5));
                cy += rowH;

                // Data rows
                statsRows.forEach((row, ri) => {
                    const fill = ri % 2 === 0 ? [245, 245, 245] : [255, 255, 255];
                    doc.setFillColor(...fill);
                    doc.rect(margin, cy, contentW, rowH, 'F');
                    // Border
                    doc.setDrawColor(220, 220, 220);
                    doc.setLineWidth(0.1);
                    doc.line(margin, cy + rowH, margin + contentW, cy + rowH);

                    // Index name (bold)
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(8);
                    doc.setTextColor(20, 20, 20);
                    doc.text(row.name, colX[0] + 2, cy + 5.5);
                    // Description
                    doc.setFont('helvetica', 'normal');
                    doc.setTextColor(60, 60, 60);
                    doc.text(row.desc, colX[1] + 2, cy + 5.5);
                    // Min, Max, Mean, Scenes
                    const vals = [row.mn, row.mx, row.av, String(row.ct)];
                    vals.forEach((v, i) => {
                        doc.setTextColor(20, 20, 20);
                        doc.text(String(v), colX[i + 2] + 2, cy + 5.5);
                    });
                    cy += rowH;
                });
                cy += 4;

                // ── Per-index interpretation ────────────────────────────────
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(9);
                doc.setTextColor(20, 20, 20);
                doc.text('Interpretation Notes', margin, cy + 5);
                doc.setLineWidth(0.3);
                doc.setDrawColor(0, 0, 0);
                doc.line(margin, cy + 7, pageW - margin, cy + 7);
                cy += 12;

                const interpret = (row) => {
                    if (row.av === 'N/A') return 'No valid data available for this index in the selected period.';
                    const v = parseFloat(row.av);
                    if (row.name === 'NDVI') {
                        if (v > 0.6) return `Strong healthy vegetation (mean NDVI ${row.av}). High biomass, good photosynthetic activity.`;
                        if (v > 0.4) return `Moderate vegetation cover (mean NDVI ${row.av}). Typical cropland or mixed canopy.`;
                        if (v > 0.2) return `Sparse vegetation or early-growth stage (mean NDVI ${row.av}).`;
                        return `Very sparse or no significant vegetation (mean NDVI ${row.av}). Possible bare soil, urban, or water.`;
                    }
                    if (row.name === 'NDMI') {
                        if (v > 0.3) return `High canopy moisture content (mean NDMI ${row.av}). Low water stress.`;
                        if (v > 0.0) return `Moderate moisture levels (mean NDMI ${row.av}). Monitor for seasonal stress.`;
                        return `Vegetation moisture stress detected (mean NDMI ${row.av}). Possible drought or senescence.`;
                    }
                    if (row.name === 'NDRE') {
                        if (v > 0.4) return `High chlorophyll content (mean NDRE ${row.av}). Good nitrogen uptake and plant health.`;
                        if (v > 0.2) return `Moderate chlorophyll levels (mean NDRE ${row.av}). Possible nutrient limitation.`;
                        return `Low chlorophyll detected (mean NDRE ${row.av}). Potential chlorosis or crop stress.`;
                    }
                    if (row.name === 'NDWI') {
                        if (v > 0.3) return `Open water bodies or saturated surfaces present (mean NDWI ${row.av}).`;
                        if (v > 0.0) return `Possible wetland or high soil moisture (mean NDWI ${row.av}).`;
                        return `Predominantly non-water surfaces (mean NDWI ${row.av}).`;
                    }
                    return '';
                };

                statsRows.forEach(row => {
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(8.5);
                    doc.setTextColor(20, 20, 20);
                    doc.text(`${row.name} —`, margin, cy);
                    doc.setFont('helvetica', 'normal');
                    doc.setTextColor(50, 50, 50);
                    const iText = interpret(row);
                    const iLines = doc.splitTextToSize(iText, contentW - 20);
                    doc.text(iLines, margin + 18, cy);
                    cy += Math.max(iLines.length * 5, 7) + 2;
                });

                cy += 4;

                // ── Chart image ─────────────────────────────────────────────
                if (cy < pageH - 70) {
                    const chartCanvas = document.getElementById('sentinelAnalyticsChart');
                    if (chartCanvas) {
                        const h2c = window.html2canvas || (typeof html2canvas !== 'undefined' ? html2canvas : null);
                        const availH = pageH - cy - margin - 12;

                        if (h2c && availH > 40) {
                            try {
                                const chartImg   = await h2c(chartCanvas, { backgroundColor: '#0f172a', scale: 2, useCORS: true, logging: false });
                                const chartDataUrl = chartImg.toDataURL('image/png');
                                const natW       = chartImg.width;
                                const natH       = chartImg.height;
                                // Fit within available width, maintaining aspect ratio
                                const drawW      = contentW;
                                const drawH      = Math.min((natH / natW) * drawW, availH);
                                doc.addImage(chartDataUrl, 'PNG', margin, cy, drawW, drawH);
                            } catch (chartErr) {
                                console.warn('[Sentinel PDF] Chart capture failed:', chartErr);
                                // Fallback: direct canvas toDataURL
                                try {
                                    const dataUrl = chartCanvas.toDataURL('image/png');
                                    const availH2 = pageH - cy - margin - 12;
                                    const drawH2  = Math.min((chartCanvas.height / chartCanvas.width) * contentW, availH2);
                                    if (availH2 > 20) doc.addImage(dataUrl, 'PNG', margin, cy, contentW, drawH2);
                                } catch (_) {}
                            }
                        } else if (state.chartInstance && availH > 20) {
                            try {
                                const dataUrl = chartCanvas.toDataURL('image/png');
                                const drawH   = Math.min((chartCanvas.height / chartCanvas.width) * contentW, availH);
                                doc.addImage(dataUrl, 'PNG', margin, cy, contentW, drawH);
                            } catch (_) {}
                        }
                    }
                }

                drawFooter(pageNum, totalPages);
            }

            // ═══════════════════════════════════════════════════════════════
            // PAGE(S): MAP SNAPSHOTS — aspect-ratio preserved, centred
            // ═══════════════════════════════════════════════════════════════
            for (let i = 0; i < state.snapshots.length; i++) {
                pageNum++;
                const snap = state.snapshots[i];
                doc.addPage();
                doc.setFillColor(255, 255, 255);
                doc.rect(0, 0, pageW, pageH, 'F');

                drawSectionHeader(`Map View: ${snap.label}`, `${snap.dateFrom} → ${snap.dateTo}  |  Capture ${i + 1} of ${state.snapshots.length}`);

                // Available area for image (below header, above footer)
                const imgAreaTop  = 22;
                const imgAreaBot  = pageH - 16;
                const imgAreaH    = imgAreaBot - imgAreaTop;  // usable mm
                const imgAreaW    = contentW;

                // Compute display dimensions preserving aspect ratio
                const ar = snap.aspectRatio || (16 / 9); // width/height
                let drawW = imgAreaW;
                let drawH = drawW / ar;
                if (drawH > imgAreaH) {
                    drawH = imgAreaH;
                    drawW = drawH * ar;
                }
                // Centre horizontally and vertically in available area
                const imgX = margin + (imgAreaW - drawW) / 2;
                const imgY = imgAreaTop + (imgAreaH - drawH) / 2;

                doc.addImage(snap.dataUrl, 'JPEG', imgX, imgY, drawW, drawH);

                // Image caption below
                const captionY = imgY + drawH + 4;
                if (captionY < imgAreaBot) {
                    doc.setFont('helvetica', 'italic');
                    doc.setFontSize(7.5);
                    doc.setTextColor(80, 80, 80);
                    doc.text(
                        `Figure ${i + 1}: ${snap.label}  |  Date range: ${snap.dateFrom} → ${snap.dateTo}  |  Captured: ${new Date(snap.timestamp).toLocaleString()}`,
                        pageW / 2, captionY, { align: 'center' }
                    );
                }

                drawFooter(pageNum, totalPages);
            }

            // ── Save ──────────────────────────────────────────────────────
            const filename = `GSPNET_Satellite_Report_${from}_to_${to}.pdf`;
            doc.save(filename);
            toast('PDF Report downloaded successfully!', 'success');

        } catch (e) {
            console.error('[Sentinel PDF] Error:', e);
            toast(`PDF generation failed: ${e.message}`, 'error');
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CESIUM 3D WMS DRAPING
    // ─────────────────────────────────────────────────────────────────────────
    window.sentinelDrapeOn3D = function (viewer) {
        if (!viewer) return;
        try {
            while (viewer.imageryLayers.length > 1) {
                viewer.imageryLayers.remove(viewer.imageryLayers.get(viewer.imageryLayers.length - 1));
            }
            if (!state.isWmsVisible) return;

            const params = buildWmsParams();
            const wmsProvider = new Cesium.WebMapServiceImageryProvider({
                url:    CDSE_WMS_URL,
                layers: params.LAYERS,
                parameters: {
                    transparent: 'true',
                    format:      'image/png',
                    TIME:        params.TIME,
                    MAXCC:       String(params.MAXCC),
                    PRIORITY:    'leastCC',
                    SHOWLOGO:    'false',
                },
                credit:       new Cesium.Credit('Copernicus Data Space Ecosystem'),
                minimumLevel: 8,
                maximumLevel: 17,
            });
            const layer  = viewer.imageryLayers.addImageryProvider(wmsProvider);
            layer.alpha  = state.wmsOpacity;
            toast(`Sentinel ${params.LAYERS} draped on 3D terrain`, 'success');
        } catch (e) {
            console.warn('[Sentinel 3D] Drape error:', e);
        }
    };

    // ─────────────────────────────────────────────────────────────────────────
    // UI WIRING
    // ─────────────────────────────────────────────────────────────────────────
    function wireUI() {
        const $ = id => document.getElementById(id);

        // AOI
        $('sentinelDrawAoiBtn')   ?.addEventListener('click', startDrawAOI);
        $('sentinelUseExtentBtn') ?.addEventListener('click', useDtmExtent);
        $('sentinelClearAoiBtn')  ?.addEventListener('click', clearAOI);

        // Index selector
        $('sentinelIndexSel')?.addEventListener('change', (e) => {
            state.currentIndex = e.target.value;
            if (state.isWmsVisible) addOrUpdateWmsLayer();
            updateWmsStatusUI();
        });

        // Opacity
        $('sentinelOpacitySlider')?.addEventListener('input', (e) => {
            state.wmsOpacity = parseFloat(e.target.value) / 100;
            const v = $('sentinelOpacityVal');
            if (v) v.textContent = e.target.value + '%';
            if (state.wmsLayer) state.wmsLayer.setOpacity(state.wmsOpacity);
        });

        // Cloud cover
        $('sentinelCloudCover')?.addEventListener('input', (e) => {
            state.maxCC = parseInt(e.target.value);
            const v = $('sentinelCloudCoverVal');
            if (v) v.textContent = e.target.value + '%';
            if (state.isWmsVisible) addOrUpdateWmsLayer();
        });

        // WMS toggle
        $('sentinelWmsToggle')?.addEventListener('click', () => {
            if (state.isWmsVisible) {
                removeWmsLayer();
            } else {
                const from = $('sentinelDateFrom')?.value;
                const to   = $('sentinelDateTo')?.value;
                if (from && to) state.currentDate = { from, to };
                addOrUpdateWmsLayer();
            }
        });

        // Apply layer
        $('sentinelApplyLayerBtn')?.addEventListener('click', () => {
            const from = $('sentinelDateFrom')?.value;
            const to   = $('sentinelDateTo')?.value;
            if (from && to) state.currentDate = { from, to };
            addOrUpdateWmsLayer();
            toast('Satellite layer updated', 'success');
        });

        // Generate analytics
        $('sentinelFetchBtn')?.addEventListener('click', fetchStatistics);

        // Capture snapshot
        $('sentinelCaptureBtn')?.addEventListener('click', captureMapSnapshot);

        // Download PDF
        $('sentinelPdfBtn')?.addEventListener('click', generatePdfReport);

        // Default dates
        const dateFrom = $('sentinelDateFrom');
        const dateTo   = $('sentinelDateTo');
        if (dateFrom && !dateFrom.value) dateFrom.value = state.currentDate.from;
        if (dateTo   && !dateTo.value)   dateTo.value   = state.currentDate.to;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // INIT
    // ─────────────────────────────────────────────────────────────────────────
    function init() {
        wireUI();
        updateWmsStatusUI();
        updateSnapshotStrip();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
