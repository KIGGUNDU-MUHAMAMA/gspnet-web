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
 *  • GSP.NET-branded multi-page A4 PDF report (jsPDF + html2canvas)
 *  • Cesium 3D WMS draping bridge (window.sentinelDrapeOn3D)
 * ─────────────────────────────────────────────────────────────────────────────
 */

(function () {
    'use strict';

    // ─────────────────────────────────────────────────────────────────────────
    // CONSTANTS
    // ─────────────────────────────────────────────────────────────────────────
    const CDSE_WMS_URL = 'https://sh.dataspace.copernicus.eu/ogc/wms/ab8b1162-e45e-4405-9db6-aa882b920217';
    const MAX_AREA_SQ_KM = 50;
    const MIN_ZOOM_FOR_WMS = 12; // WMS tiles only load above this zoom level (token saving)

    const LAYER_CONFIGS = {
        TRUE_COLOR:   { name: 'True Color',         icon: 'fa-camera',         color: '#3b82f6' },
        FALSE_COLOR:  { name: 'False Color (CIR)',   icon: 'fa-palette',        color: '#8b5cf6' },
        NDVI:         { name: 'NDVI (Vegetation)',   icon: 'fa-leaf',           color: '#22c55e' },
        NDMI:         { name: 'NDMI (Moisture)',     icon: 'fa-tint',           color: '#06b6d4' },
        NDWI:         { name: 'NDWI (Water)',        icon: 'fa-water',          color: '#0ea5e9' },
        MOISTURE_STRESS: { name: 'Moisture Stress',  icon: 'fa-thermometer-half', color: '#f59e0b' },
        SWIR:         { name: 'SWIR',                icon: 'fa-wave-square',    color: '#ef4444' },
    };

    const GSPNET_WMS_ID = 'gspnet-sentinel-wms';

    // ─────────────────────────────────────────────────────────────────────────
    // STATE
    // ─────────────────────────────────────────────────────────────────────────
    let state = {
        wmsLayer: null,          // ol.layer.Tile
        aoiLayer: null,          // ol.layer.Vector — drawn/extent AOI
        aoiFeature: null,        // ol.Feature — current AOI polygon
        drawInteraction: null,   // ol.interaction.Draw
        currentIndex: 'TRUE_COLOR',
        currentDate: getTodayRange(),
        maxCC: 20,
        wmsOpacity: 0.75,
        analyticsData: null,     // last fetched stats result
        chartInstance: null,     // Chart.js instance
        snapshots: [],           // [{ label, dataUrl, index, dateFrom, dateTo }]
        isLoading: false,
        isWmsVisible: false,
        aoiAreaSqKm: 0,
    };

    // ─────────────────────────────────────────────────────────────────────────
    // UTILITY
    // ─────────────────────────────────────────────────────────────────────────
    function getMap() { return window.map || null; }

    function getSupabase() {
        return window.supabaseClient || window.supabase || null;
    }

    function toast(msg, type = 'info') {
        if (typeof showToast === 'function') showToast(msg, type);
        else console.log(`[Sentinel] ${type}: ${msg}`);
    }

    function getTodayRange() {
        const now = new Date();
        const to = now.toISOString().slice(0, 10);
        const from = new Date(now - 90 * 864e5).toISOString().slice(0, 10);
        return { from, to };
    }

    function fmtArea(sqKm) {
        if (sqKm < 1) return (sqKm * 100).toFixed(1) + ' ha';
        return sqKm.toFixed(2) + ' km²';
    }

    /** Compute area of EPSG:3857 polygon (OpenLayers native) in km². */
    function computeAreaSqKm(feature) {
        try {
            const geom = feature.getGeometry();
            const area = geom.getArea(); // m²
            return area / 1e6;
        } catch (e) { return 0; }
    }

    /** Convert OL feature geometry to EPSG:4326 GeoJSON polygon. */
    function featureToWgs84GeoJSON(feature) {
        const geom = feature.getGeometry().clone();
        geom.transform('EPSG:3857', 'EPSG:4326');
        const coords = geom.getCoordinates();
        return { type: 'Polygon', coordinates: coords };
    }

    /** Generate WMS TIME parameter string from date inputs. */
    function buildWmsTime(from, to) {
        return `${from}/${to}`;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // WMS LAYER MANAGEMENT
    // ─────────────────────────────────────────────────────────────────────────
    function buildWmsParams() {
        return {
            SERVICE: 'WMS',
            VERSION: '1.3.0',
            REQUEST: 'GetMap',
            FORMAT: 'image/png',
            TRANSPARENT: 'true',
            LAYERS: state.currentIndex,
            TIME: buildWmsTime(state.currentDate.from, state.currentDate.to),
            MAXCC: state.maxCC,
            PRIORITY: 'leastCC',
            SHOWLOGO: 'false',
        };
    }

    function createWmsLayer() {
        return new ol.layer.Tile({
            title: 'Sentinel Imagery',
            source: new ol.source.TileWMS({
                url: CDSE_WMS_URL,
                params: buildWmsParams(),
                serverType: 'geoserver',
                crossOrigin: 'anonymous',
                transition: 0,
            }),
            opacity: state.wmsOpacity,
            zIndex: 0,     // Always behind all data layers
            minZoom: MIN_ZOOM_FOR_WMS,
            visible: true,
        });
        // Set internal ID for reference
    }

    function addOrUpdateWmsLayer() {
        const map = getMap();
        if (!map) return;

        if (state.wmsLayer) {
            // Update existing layer params
            state.wmsLayer.getSource().updateParams(buildWmsParams());
            state.wmsLayer.setOpacity(state.wmsOpacity);
            state.wmsLayer.setVisible(true);
        } else {
            state.wmsLayer = createWmsLayer();
            map.getLayers().insertAt(1, state.wmsLayer); // index 1 = just above basemap
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
        const badge = document.getElementById('sentinelWmsBadge');
        const toggleBtn = document.getElementById('sentinelWmsToggle');
        const indexLabel = LAYER_CONFIGS[state.currentIndex]?.name || state.currentIndex;
        if (badge) {
            badge.textContent = state.isWmsVisible ? `● ${indexLabel}` : '○ Off';
            badge.style.color = state.isWmsVisible ? LAYER_CONFIGS[state.currentIndex]?.color || '#22c55e' : '#64748b';
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
                fill: new ol.style.Fill({ color: 'rgba(245,158,11,0.08)' }),
            }),
        });
        map.addLayer(state.aoiLayer);
    }

    function startDrawAOI() {
        const map = getMap();
        if (!map) { toast('Map not ready', 'error'); return; }
        initAoiLayer();

        // Cancel existing draw
        if (state.drawInteraction) {
            map.removeInteraction(state.drawInteraction);
            state.drawInteraction = null;
        }

        toast('Click to draw AOI polygon. Double-click to finish.', 'info');
        updateAoiStatusUI('Drawing...');

        state.drawInteraction = new ol.interaction.Draw({
            source: state.aoiLayer.getSource(),
            type: 'Polygon',
        });

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
                toast(`AOI too large (${fmtArea(areaSqKm)}). Maximum is ${MAX_AREA_SQ_KM} km². Please draw a smaller area.`, 'error');
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

        // Try terrain extent feature first
        let usedExtent = false;
        if (t3d && t3d.extentLayer) {
            const src = t3d.extentLayer.getSource();
            const features = src ? src.getFeatures() : [];
            if (features.length > 0) {
                const cloned = features[0].clone();
                state.aoiLayer.getSource().addFeature(cloned);
                state.aoiFeature = cloned;
                usedExtent = true;
            }
        }

        // Fallback: use the map view extent
        if (!usedExtent) {
            const view = map.getView();
            const extent = view.calculateExtent(map.getSize());
            const polygon = ol.geom.Polygon.fromExtent(extent);
            const feature = new ol.Feature({ geometry: polygon });
            state.aoiLayer.getSource().addFeature(feature);
            state.aoiFeature = feature;
        }

        const areaSqKm = computeAreaSqKm(state.aoiFeature);
        state.aoiAreaSqKm = areaSqKm;

        if (areaSqKm > MAX_AREA_SQ_KM) {
            toast(`Extent too large (${fmtArea(areaSqKm)}). Max ${MAX_AREA_SQ_KM} km². Zoom in closer and try again.`, 'error');
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
        state.aoiFeature = null;
        state.aoiAreaSqKm = 0;
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
        if (state.isLoading) { toast('Analytics already running...', 'warning'); return; }

        const from = document.getElementById('sentinelDateFrom')?.value || state.currentDate.from;
        const to = document.getElementById('sentinelDateTo')?.value || state.currentDate.to;
        const interval = document.getElementById('sentinelInterval')?.value || 'P16D';

        if (!from || !to) { toast('Please select date range.', 'error'); return; }

        const supabase = getSupabase();
        if (!supabase) { toast('Supabase not initialized.', 'error'); return; }

        const aoi = featureToWgs84GeoJSON(state.aoiFeature);

        setLoadingState(true);

        try {
            let authHeader = '';
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.access_token) {
                authHeader = `Bearer ${session.access_token}`;
            }

            const SUPABASE_URL = window.supabaseUrl || 'https://kwssgfanbntfjdclchfi.supabase.co';

            const response = await fetch(`${SUPABASE_URL}/functions/v1/gspnet-sentinel-analytics`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': authHeader,
                    'apikey': window.supabaseKey || '',
                },
                body: JSON.stringify({ aoi, date_from: from, date_to: to, interval }),
            });

            const result = await response.json();

            if (!result.success) {
                toast(`Analytics failed: ${result.error}`, 'error');
                setLoadingState(false);
                return;
            }

            state.analyticsData = result;
            state.currentDate = { from, to };
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
        const btn = document.getElementById('sentinelFetchBtn');
        const spinner = document.getElementById('sentinelLoadingSpinner');
        if (btn) {
            btn.disabled = loading;
            btn.innerHTML = loading
                ? '<i class="fas fa-spinner fa-spin"></i> Fetching Data...'
                : '<i class="fas fa-satellite"></i> Generate Analytics';
        }
        if (spinner) spinner.style.display = loading ? 'flex' : 'none';
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CHART.JS RENDERING
    // ─────────────────────────────────────────────────────────────────────────
    function renderChart(data) {
        const canvasId = 'sentinelAnalyticsChart';
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        if (state.chartInstance) {
            state.chartInstance.destroy();
            state.chartInstance = null;
        }

        const ndvi = data.ndvi_intervals || [];
        const ndmi = data.ndmi_intervals || [];
        const ndre = data.ndre_intervals || [];
        const ndwi = data.ndwi_intervals || [];

        const labels = ndvi.map(d => d.from ? d.from.slice(0, 10) : '');

        const datasets = [
            {
                label: 'NDVI (Vegetation)',
                data: ndvi.map(d => d.mean !== null ? parseFloat(d.mean.toFixed(4)) : null),
                borderColor: '#22c55e',
                backgroundColor: 'rgba(34,197,94,0.08)',
                borderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 7,
                tension: 0.35,
                fill: false,
                spanGaps: true,
            },
            {
                label: 'NDMI (Moisture)',
                data: ndmi.map(d => d.mean !== null ? parseFloat(d.mean.toFixed(4)) : null),
                borderColor: '#06b6d4',
                backgroundColor: 'rgba(6,182,212,0.08)',
                borderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 7,
                tension: 0.35,
                fill: false,
                spanGaps: true,
            },
            {
                label: 'NDRE (Red-Edge)',
                data: ndre.map(d => d.mean !== null ? parseFloat(d.mean.toFixed(4)) : null),
                borderColor: '#f59e0b',
                backgroundColor: 'rgba(245,158,11,0.08)',
                borderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 7,
                tension: 0.35,
                fill: false,
                spanGaps: true,
            },
            {
                label: 'NDWI (Water)',
                data: ndwi.map(d => d.mean !== null ? parseFloat(d.mean.toFixed(4)) : null),
                borderColor: '#0ea5e9',
                backgroundColor: 'rgba(14,165,233,0.08)',
                borderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 7,
                tension: 0.35,
                fill: false,
                spanGaps: true,
                hidden: true, // Off by default, toggled via legend
            },
        ];

        state.chartInstance = new Chart(canvas, {
            type: 'line',
            data: { labels, datasets },
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
                        grid: { color: 'rgba(148,163,184,0.1)' },
                    },
                    y: {
                        min: -1, max: 1,
                        ticks: { color: '#94a3b8', font: { size: 10 } },
                        grid: { color: 'rgba(148,163,184,0.1)' },
                        title: { display: true, text: 'Index Value', color: '#64748b', font: { size: 11 } },
                    },
                },
            },
        });
    }

    function renderStatsTable(data) {
        const container = document.getElementById('sentinelStatsTable');
        if (!container) return;

        const ndvi = data.ndvi_intervals || [];
        const ndmi = data.ndmi_intervals || [];
        const ndre = data.ndre_intervals || [];
        const ndwi = data.ndwi_intervals || [];

        function calcStats(arr) {
            const vals = arr.map(d => d.mean).filter(v => v !== null && v !== undefined);
            if (!vals.length) return { min: 'N/A', max: 'N/A', avg: 'N/A', count: 0 };
            const min = Math.min(...vals).toFixed(4);
            const max = Math.max(...vals).toFixed(4);
            const avg = (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(4);
            return { min, max, avg, count: vals.length };
        }

        const rows = [
            { name: 'NDVI', color: '#22c55e', ...calcStats(ndvi) },
            { name: 'NDMI', color: '#06b6d4', ...calcStats(ndmi) },
            { name: 'NDRE', color: '#f59e0b', ...calcStats(ndre) },
            { name: 'NDWI', color: '#0ea5e9', ...calcStats(ndwi) },
        ];

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
                            <td style="padding:6px 8px;"><span style="color:${r.color};font-weight:600;">${r.name}</span></td>
                            <td style="padding:6px 8px;text-align:center;color:#e2e8f0;">${r.min}</td>
                            <td style="padding:6px 8px;text-align:center;color:#e2e8f0;">${r.max}</td>
                            <td style="padding:6px 8px;text-align:center;color:#e2e8f0;">${r.avg}</td>
                            <td style="padding:6px 8px;text-align:center;color:#64748b;">${r.count}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    function showAnalyticsPanels() {
        const panels = ['sentinelChartPanel', 'sentinelStatsPanel', 'sentinelReportPanel'];
        panels.forEach(id => {
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
        const to = document.getElementById('sentinelDateTo')?.value || state.currentDate.to;

        toast(`Capturing ${indexLabel} map snapshot...`, 'info');

        return new Promise((resolve) => {
            map.once('rendercomplete', () => {
                try {
                    const mapCanvas = document.getElementById('map').querySelector('canvas');
                    const dataUrl = mapCanvas ? mapCanvas.toDataURL('image/png') : null;

                    if (!dataUrl) { toast('Could not capture map canvas', 'error'); resolve(null); return; }

                    const snapshot = {
                        label: indexLabel,
                        index: state.currentIndex,
                        dateFrom: from,
                        dateTo: to,
                        dataUrl,
                        timestamp: new Date().toISOString(),
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
            strip.innerHTML = '<p style="font-size:0.75rem;color:#475569;text-align:center;padding:8px 0;">No snapshots yet. Capture the map after switching indices.</p>';
            return;
        }

        strip.innerHTML = state.snapshots.map((s, i) => `
            <div style="position:relative;display:inline-block;margin:4px;">
                <img src="${s.dataUrl}" title="${s.label} (${s.dateFrom}→${s.dateTo})"
                    style="width:70px;height:50px;object-fit:cover;border-radius:4px;border:2px solid ${LAYER_CONFIGS[s.index]?.color || '#334155'};cursor:pointer;transition:transform 0.2s;"
                    onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'"
                />
                <span style="position:absolute;top:-4px;right:-4px;background:#ef4444;color:white;border-radius:50%;width:16px;height:16px;font-size:9px;display:flex;align-items:center;justify-content:center;cursor:pointer;line-height:1;"
                    onclick="window.sentinelRemoveSnapshot(${i})" title="Remove">×</span>
                <div style="font-size:9px;color:#64748b;text-align:center;max-width:70px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${s.label}">${s.label}</div>
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

        toast('Generating GSP.NET Satellite Report...', 'info');

        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
            const pageW = doc.internal.pageSize.getWidth();
            const pageH = doc.internal.pageSize.getHeight();
            const margin = 14;
            const contentW = pageW - margin * 2;

            const from = document.getElementById('sentinelDateFrom')?.value || state.currentDate.from;
            const to = document.getElementById('sentinelDateTo')?.value || state.currentDate.to;
            const interval = document.getElementById('sentinelInterval')?.value || 'P16D';
            const area = state.analyticsData?.meta?.area_sq_km
                ? `${state.analyticsData.meta.area_sq_km.toFixed(2)} km²`
                : fmtArea(state.aoiAreaSqKm);
            const resolution = state.analyticsData?.meta?.resolution_m
                ? `${state.analyticsData.meta.resolution_m}m`
                : 'Auto';

            // ── PAGE 1: COVER PAGE ───────────────────────────────────────────
            // Dark gradient cover
            doc.setFillColor(10, 17, 40);
            doc.rect(0, 0, pageW, pageH, 'F');

            // Accent stripe
            doc.setFillColor(34, 197, 94);
            doc.rect(0, 0, 6, pageH, 'F');

            // Title
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(241, 245, 249);
            doc.setFontSize(26);
            doc.text('Satellite Analytics', margin + 8, 52);
            doc.text('Report', margin + 8, 66);

            doc.setFontSize(11);
            doc.setTextColor(148, 163, 184);
            doc.setFont('helvetica', 'normal');
            doc.text('Powered by Copernicus Data Space Ecosystem (CDSE)', margin + 8, 80);

            // Divider
            doc.setDrawColor(34, 197, 94);
            doc.setLineWidth(0.5);
            doc.line(margin + 8, 87, pageW - margin, 87);

            // Metadata grid
            doc.setFontSize(9);
            const metaRows = [
                ['Platform', 'Geospatial Network (GSP.NET)'],
                ['Sentinel Mission', 'Sentinel-2 L2A (CDSE)'],
                ['Date Range', `${from}  →  ${to}`],
                ['Interval', interval === 'P10D' ? '10-day' : interval === 'P16D' ? '16-day' : '1-month'],
                ['AOI Area', area],
                ['Resolution', resolution],
                ['Generated', new Date().toLocaleString()],
            ];
            let metaY = 97;
            metaRows.forEach(([label, value]) => {
                doc.setTextColor(100, 116, 139);
                doc.text(label + ':', margin + 8, metaY);
                doc.setTextColor(226, 232, 240);
                doc.text(value, margin + 55, metaY);
                metaY += 9;
            });

            // Indices captured
            doc.setTextColor(148, 163, 184);
            doc.setFontSize(8);
            const indices = ['NDVI (Vegetation Health)', 'NDMI (Moisture Index)', 'NDRE (Red-Edge Chlorophyll)', 'NDWI (Water Bodies)'];
            doc.text('Indices Computed:', margin + 8, metaY + 6);
            indices.forEach((idx, i) => {
                doc.setTextColor(34, 197, 94);
                doc.text(`• ${idx}`, margin + 12, metaY + 16 + i * 8);
            });

            // Footer
            doc.setTextColor(51, 65, 85);
            doc.setFontSize(8);
            doc.text('GEOSPATIAL NETWORK  |  Sentinel Satellite Analytics Report  |  Confidential', pageW / 2, pageH - 10, { align: 'center' });

            // ── PAGE 2: STATISTICS CHART ──────────────────────────────────────
            if (state.analyticsData) {
                doc.addPage();

                // Header bar
                doc.setFillColor(10, 17, 40);
                doc.rect(0, 0, pageW, 20, 'F');
                doc.setFillColor(34, 197, 94);
                doc.rect(0, 0, 6, 20, 'F');
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(241, 245, 249);
                doc.setFontSize(12);
                doc.text('Time-Series Analytics', margin + 8, 13);
                doc.setFontSize(8);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(100, 116, 139);
                doc.text(`${from} → ${to}`, pageW - margin, 13, { align: 'right' });

                // Summary stats table (jsPDF AutoTable)
                const data = state.analyticsData;
                const ndvi = data.ndvi_intervals || [];
                const ndmi = data.ndmi_intervals || [];
                const ndre = data.ndre_intervals || [];
                const ndwi = data.ndwi_intervals || [];

                function s(arr) {
                    const vals = arr.map(d => d.mean).filter(v => v !== null && v !== undefined);
                    if (!vals.length) return ['N/A', 'N/A', 'N/A'];
                    return [
                        Math.min(...vals).toFixed(4),
                        Math.max(...vals).toFixed(4),
                        (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(4),
                    ];
                }

                if (typeof doc.autoTable === 'function') {
                    doc.autoTable({
                        startY: 28,
                        margin: { left: margin, right: margin },
                        head: [['Index', 'Description', 'Minimum', 'Maximum', 'Mean', 'Scenes']],
                        body: [
                            ['NDVI', 'Vegetation Health', ...s(ndvi), ndvi.filter(d => d.mean !== null).length],
                            ['NDMI', 'Moisture Stress', ...s(ndmi), ndmi.filter(d => d.mean !== null).length],
                            ['NDRE', 'Red-Edge Chlorophyll', ...s(ndre), ndre.filter(d => d.mean !== null).length],
                            ['NDWI', 'Water Bodies / Flooding', ...s(ndwi), ndwi.filter(d => d.mean !== null).length],
                        ],
                        headStyles: { fillColor: [15, 23, 42], textColor: [148, 163, 184], fontStyle: 'bold', fontSize: 9 },
                        bodyStyles: { fontSize: 8.5, textColor: [51, 65, 85] },
                        alternateRowStyles: { fillColor: [248, 250, 252] },
                        styles: { cellPadding: 3 },
                    });
                }

                // Chart screenshot
                const chartCanvas = document.getElementById('sentinelAnalyticsChart');
                if (chartCanvas) {
                    const chartY = (doc.lastAutoTable?.finalY || 70) + 8;
                    try {
                        const chartImg = await html2canvas(chartCanvas, { backgroundColor: '#0f172a', scale: 2 });
                        const chartDataUrl = chartImg.toDataURL('image/png');
                        const chartH = (chartCanvas.height / chartCanvas.width) * contentW;
                        doc.addImage(chartDataUrl, 'PNG', margin, chartY, contentW, Math.min(chartH, pageH - chartY - 20));
                    } catch (e) {
                        console.warn('[Sentinel PDF] Could not capture chart:', e);
                    }
                }

                doc.setFontSize(7);
                doc.setTextColor(100, 116, 139);
                doc.text('GSP.NET Satellite Analytics  |  NDVI/NDMI/NDRE/NDWI Time Series', pageW / 2, pageH - 6, { align: 'center' });
            }

            // ── PAGE(S): MAP SNAPSHOTS ────────────────────────────────────────
            for (let i = 0; i < state.snapshots.length; i++) {
                const snap = state.snapshots[i];
                doc.addPage();

                // Header
                doc.setFillColor(10, 17, 40);
                doc.rect(0, 0, pageW, 20, 'F');
                doc.setFillColor(34, 197, 94);
                doc.rect(0, 0, 6, 20, 'F');
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(241, 245, 249);
                doc.setFontSize(11);
                doc.text(`Map View: ${snap.label}`, margin + 8, 13);
                doc.setFontSize(8);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(100, 116, 139);
                doc.text(`${snap.dateFrom} → ${snap.dateTo}  |  Capture ${i + 1} of ${state.snapshots.length}`, pageW - margin, 13, { align: 'right' });

                // Map image
                const imgH = pageH - 30;
                doc.addImage(snap.dataUrl, 'PNG', 0, 20, pageW, imgH);

                // Footer
                doc.setFillColor(10, 17, 40, 0.8);
                doc.setTextColor(100, 116, 139);
                doc.setFontSize(7);
                doc.text(`GSP.NET  |  ${snap.label}  |  ${new Date(snap.timestamp).toLocaleString()}`, pageW / 2, pageH - 3, { align: 'center' });
            }

            // ── SAVE ─────────────────────────────────────────────────────────
            const filename = `GSPNET_Sentinel_Report_${from}_to_${to}.pdf`.replace(/\s/g, '_');
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
    /**
     * Called by cesium3d-viewer.js when the 3D globe is open.
     * Drapes the current Sentinel WMS layer over the 3D terrain.
     */
    window.sentinelDrapeOn3D = function (viewer) {
        if (!viewer) return;
        try {
            // Remove any previous Sentinel imagery layers (keep index 0 = basemap)
            while (viewer.imageryLayers.length > 1) {
                viewer.imageryLayers.remove(viewer.imageryLayers.get(viewer.imageryLayers.length - 1));
            }

            if (!state.isWmsVisible) return;

            const params = buildWmsParams();
            const wmsProvider = new Cesium.WebMapServiceImageryProvider({
                url: CDSE_WMS_URL,
                layers: params.LAYERS,
                parameters: {
                    transparent: 'true',
                    format: 'image/png',
                    TIME: params.TIME,
                    MAXCC: String(params.MAXCC),
                    PRIORITY: 'leastCC',
                    SHOWLOGO: 'false',
                },
                credit: new Cesium.Credit('Copernicus Data Space Ecosystem'),
                minimumLevel: 8,
                maximumLevel: 17,
            });

            const layer = viewer.imageryLayers.addImageryProvider(wmsProvider);
            layer.alpha = state.wmsOpacity;
            toast(`Sentinel ${params.LAYERS} layer draped on 3D terrain`, 'success');
        } catch (e) {
            console.warn('[Sentinel 3D] Drape error:', e);
        }
    };

    // ─────────────────────────────────────────────────────────────────────────
    // UI WIRING
    // ─────────────────────────────────────────────────────────────────────────
    function wireUI() {
        // AOI controls
        const drawBtn = document.getElementById('sentinelDrawAoiBtn');
        const extentBtn = document.getElementById('sentinelUseExtentBtn');
        const clearAoiBtn = document.getElementById('sentinelClearAoiBtn');
        if (drawBtn) drawBtn.addEventListener('click', startDrawAOI);
        if (extentBtn) extentBtn.addEventListener('click', useDtmExtent);
        if (clearAoiBtn) clearAoiBtn.addEventListener('click', clearAOI);

        // Layer index selector
        const indexSel = document.getElementById('sentinelIndexSel');
        if (indexSel) {
            indexSel.addEventListener('change', () => {
                state.currentIndex = indexSel.value;
                if (state.isWmsVisible) addOrUpdateWmsLayer();
                updateWmsStatusUI();
            });
        }

        // Opacity slider
        const opacitySlider = document.getElementById('sentinelOpacitySlider');
        const opacityVal = document.getElementById('sentinelOpacityVal');
        if (opacitySlider) {
            opacitySlider.addEventListener('input', () => {
                state.wmsOpacity = parseFloat(opacitySlider.value) / 100;
                if (opacityVal) opacityVal.textContent = opacitySlider.value + '%';
                if (state.wmsLayer) state.wmsLayer.setOpacity(state.wmsOpacity);
            });
        }

        // Cloud cover slider
        const ccSlider = document.getElementById('sentinelCloudCover');
        const ccVal = document.getElementById('sentinelCloudCoverVal');
        if (ccSlider) {
            ccSlider.addEventListener('input', () => {
                state.maxCC = parseInt(ccSlider.value);
                if (ccVal) ccVal.textContent = ccSlider.value + '%';
                if (state.isWmsVisible) addOrUpdateWmsLayer();
            });
        }

        // WMS toggle
        const wmsToggle = document.getElementById('sentinelWmsToggle');
        if (wmsToggle) {
            wmsToggle.addEventListener('click', () => {
                if (state.isWmsVisible) {
                    removeWmsLayer();
                } else {
                    // Apply current dates before showing
                    const from = document.getElementById('sentinelDateFrom')?.value || state.currentDate.from;
                    const to = document.getElementById('sentinelDateTo')?.value || state.currentDate.to;
                    state.currentDate = { from, to };
                    addOrUpdateWmsLayer();
                }
            });
        }

        // Apply layer button (update WMS with current date/index)
        const applyBtn = document.getElementById('sentinelApplyLayerBtn');
        if (applyBtn) {
            applyBtn.addEventListener('click', () => {
                const from = document.getElementById('sentinelDateFrom')?.value;
                const to = document.getElementById('sentinelDateTo')?.value;
                if (from && to) state.currentDate = { from, to };
                addOrUpdateWmsLayer();
                toast('Satellite layer updated', 'success');
            });
        }

        // Fetch statistics
        const fetchBtn = document.getElementById('sentinelFetchBtn');
        if (fetchBtn) fetchBtn.addEventListener('click', fetchStatistics);

        // Capture snapshot
        const captureBtn = document.getElementById('sentinelCaptureBtn');
        if (captureBtn) captureBtn.addEventListener('click', captureMapSnapshot);

        // Download PDF
        const pdfBtn = document.getElementById('sentinelPdfBtn');
        if (pdfBtn) pdfBtn.addEventListener('click', generatePdfReport);

        // Date inputs: Set defaults
        const dateFrom = document.getElementById('sentinelDateFrom');
        const dateTo = document.getElementById('sentinelDateTo');
        if (dateFrom && !dateFrom.value) dateFrom.value = state.currentDate.from;
        if (dateTo && !dateTo.value) dateTo.value = state.currentDate.to;
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
