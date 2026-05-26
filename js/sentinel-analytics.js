/**
 * sentinel-analytics.js  v1.3
 * ─────────────────────────────────────────────────────────────────────────────
 * GSP.NET Platform — Satellite Analytics Module
 * Handles:
 *  • OpenLayers WMS layer (CDSE) with full controls
 *  • Dynamic AOI: draw polygon OR use DTM extent
 *  • Area limit enforcement (50 km²)
 *  • Supabase Edge Function → NDVI / NDMI / NDRE / NDWI time-series
 *  • Chart.js multi-index visualisation
 *  • Advanced statistics: min, max, mean, std-dev, trend, peak, trough, Δchange
 *  • Multi-snapshot capture (html2canvas + canvas composite fallback)
 *  • Multi-page A4 PDF with fixed centred headers, high-quality chart, bar chart
 *  • Cesium 3D WMS draping bridge
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

    const MAX_AREA_SQ_KM  = 50;
    const MIN_ZOOM_FOR_WMS = 12;

    const LAYER_CONFIGS = {
        TRUE_COLOR:      { name: 'True Color',        color: '#3b82f6' },
        FALSE_COLOR:     { name: 'False Color (CIR)',  color: '#8b5cf6' },
        NDVI:            { name: 'NDVI (Vegetation)',  color: '#22c55e' },
        NDMI:            { name: 'NDMI (Moisture)',    color: '#06b6d4' },
        NDWI:            { name: 'NDWI (Water)',       color: '#0ea5e9' },
        MOISTURE_STRESS: { name: 'Moisture Stress',    color: '#f59e0b' },
        SWIR:            { name: 'SWIR',               color: '#ef4444' },
    };

    // ─────────────────────────────────────────────────────────────────────────
    // STATE
    // ─────────────────────────────────────────────────────────────────────────
    let state = {
        wmsLayer:        null,
        aoiLayer:        null,
        aoiFeature:      null,
        drawInteraction: null,
        currentIndex:    'TRUE_COLOR',
        currentDate:     getTodayRange(),
        maxCC:           20,
        wmsOpacity:      0.75,
        analyticsData:   null,
        chartInstance:   null,
        snapshots:       [],
        isLoading:       false,
        isWmsVisible:    false,
        aoiAreaSqKm:     0,
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
        const now = new Date();
        return {
            to:   now.toISOString().slice(0, 10),
            from: new Date(now - 90 * 864e5).toISOString().slice(0, 10),
        };
    }

    function fmtArea(sqKm) {
        if (!sqKm) return '—';
        return sqKm < 1 ? (sqKm * 100).toFixed(1) + ' ha' : sqKm.toFixed(2) + ' km²';
    }

    function computeAreaSqKm(feature) {
        try { return feature.getGeometry().getArea() / 1e6; } catch { return 0; }
    }

    function featureToWgs84GeoJSON(feature) {
        const geom = feature.getGeometry().clone();
        geom.transform('EPSG:3857', 'EPSG:4326');
        return { type: 'Polygon', coordinates: geom.getCoordinates() };
    }

    function buildWmsTime(from, to) { return `${from}/${to}`; }

    // ─────────────────────────────────────────────────────────────────────────
    // STATISTICS MATHS — advanced calculations from raw interval arrays
    // ─────────────────────────────────────────────────────────────────────────

    /** Linear regression slope (index units / interval step). */
    function calcTrend(arr) {
        const pts = arr.map((d, i) => [i, d.mean])
                       .filter(([, v]) => v !== null && v !== undefined && Number.isFinite(v));
        if (pts.length < 2) return { slope: 0, dir: 'stable', label: '→ Stable', slopeStr: 'N/A' };
        const n    = pts.length;
        const sumX = pts.reduce((s, [x]) => s + x, 0);
        const sumY = pts.reduce((s, [, y]) => s + y, 0);
        const sumXY = pts.reduce((s, [x, y]) => s + x * y, 0);
        const sumX2 = pts.reduce((s, [x]) => s + x * x, 0);
        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const dir   = slope > 0.001 ? 'improving' : slope < -0.001 ? 'declining' : 'stable';
        return {
            slope,
            dir,
            label:     dir === 'improving' ? '↑ Improving' : dir === 'declining' ? '↓ Declining' : '→ Stable',
            slopeStr:  (slope * 1000).toFixed(3) + ' ×10⁻³ / step',
        };
    }

    /** Population standard deviation across all valid scene means. */
    function calcStdDev(arr) {
        const vals = arr.map(d => d.mean).filter(v => v !== null && Number.isFinite(v));
        if (vals.length < 2) return 'N/A';
        const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
        const variance = vals.reduce((s, v) => s + (v - mean) ** 2, 0) / vals.length;
        return Math.sqrt(variance).toFixed(4);
    }

    /** Find the scene with the highest and lowest mean. */
    function calcPeakTrough(arr) {
        const valid = arr.filter(d => d.mean !== null && Number.isFinite(d.mean));
        if (!valid.length) return { peak: 'N/A', peakDate: 'N/A', trough: 'N/A', troughDate: 'N/A' };
        const sorted = [...valid].sort((a, b) => b.mean - a.mean);
        return {
            peak:       sorted[0].mean.toFixed(4),
            peakDate:   sorted[0].from?.slice(0, 10) || 'N/A',
            trough:     sorted[sorted.length - 1].mean.toFixed(4),
            troughDate: sorted[sorted.length - 1].from?.slice(0, 10) || 'N/A',
        };
    }

    /** Absolute and percentage change from first valid to last valid scene. */
    function calcChange(arr) {
        const valid = arr.filter(d => d.mean !== null && Number.isFinite(d.mean));
        if (valid.length < 2) return { abs: 'N/A', pct: 'N/A' };
        const first = valid[0].mean;
        const last  = valid[valid.length - 1].mean;
        const abs   = (last - first).toFixed(4);
        const pct   = first !== 0
            ? ((last - first) / Math.abs(first) * 100).toFixed(1) + '%'
            : 'N/A';
        return { abs, pct };
    }

    /**
     * Master stats computation — used by both the UI table and the PDF.
     * Returns an array of fully-computed row objects per index.
     */
    function computeStatsRows(data) {
        const baseStat = (arr) => {
            const vals = (arr || []).map(d => d.mean)
                                    .filter(v => v !== null && v !== undefined && Number.isFinite(v));
            if (!vals.length) return { mn: 'N/A', mx: 'N/A', av: 'N/A', ct: 0 };
            return {
                mn: Math.min(...vals).toFixed(4),
                mx: Math.max(...vals).toFixed(4),
                av: (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(4),
                ct: vals.length,
            };
        };

        const makeRow = (name, desc, cssColor, pdfColor, arr) => ({
            name, desc, cssColor, pdfColor,
            ...baseStat(arr),
            std:    calcStdDev(arr),
            trend:  calcTrend(arr),
            pt:     calcPeakTrough(arr),
            change: calcChange(arr),
            rawArr: arr || [],
        });

        return [
            makeRow('NDVI', 'Vegetation Health',       '#22c55e', [34,197,94],  data.ndvi_intervals),
            makeRow('NDMI', 'Moisture Index',           '#06b6d4', [6,182,212],  data.ndmi_intervals),
            makeRow('NDRE', 'Red-Edge Chlorophyll',     '#f59e0b', [245,158,11], data.ndre_intervals),
            makeRow('NDWI', 'Water Bodies / Flooding',  '#0ea5e9', [14,165,233], data.ndwi_intervals),
        ];
    }

    // ─────────────────────────────────────────────────────────────────────────
    // WMS LAYER MANAGEMENT
    // ─────────────────────────────────────────────────────────────────────────
    function buildWmsParams() {
        return {
            SERVICE: 'WMS', VERSION: '1.3.0', REQUEST: 'GetMap',
            FORMAT: 'image/png', TRANSPARENT: 'true',
            LAYERS:   state.currentIndex,
            TIME:     buildWmsTime(state.currentDate.from, state.currentDate.to),
            MAXCC:    state.maxCC,
            PRIORITY: 'leastCC',
            SHOWLOGO: 'false',
        };
    }

    function createWmsLayer() {
        return new ol.layer.Tile({
            title: 'Sentinel Imagery',
            source: new ol.source.TileWMS({
                url:         CDSE_WMS_URL,
                params:      buildWmsParams(),
                serverType:  'geoserver',
                crossOrigin: 'anonymous',
                transition:  0,
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
        if (map && state.wmsLayer) { map.removeLayer(state.wmsLayer); state.wmsLayer = null; }
        state.isWmsVisible = false;
        updateWmsStatusUI();
    }

    function updateWmsStatusUI() {
        const badge     = document.getElementById('sentinelWmsBadge');
        const toggleBtn = document.getElementById('sentinelWmsToggle');
        const label     = LAYER_CONFIGS[state.currentIndex]?.name || state.currentIndex;
        if (badge) {
            badge.textContent = state.isWmsVisible ? `● ${label}` : '○ Off';
            badge.style.color = state.isWmsVisible ? (LAYER_CONFIGS[state.currentIndex]?.color || '#22c55e') : '#64748b';
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
        state.aoiLayer = new ol.layer.Vector({
            source: new ol.source.Vector(),
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
        if (state.drawInteraction) { map.removeInteraction(state.drawInteraction); state.drawInteraction = null; }
        toast('Click to draw AOI polygon. Double-click to finish.', 'info');
        updateAoiStatusUI('Drawing…');
        state.drawInteraction = new ol.interaction.Draw({ source: state.aoiLayer.getSource(), type: 'Polygon' });
        state.drawInteraction.on('drawstart', () => { state.aoiLayer.getSource().clear(); state.aoiFeature = null; });
        state.drawInteraction.on('drawend', (evt) => {
            state.aoiFeature = evt.feature;
            map.removeInteraction(state.drawInteraction);
            state.drawInteraction = null;
            const areaSqKm = computeAreaSqKm(state.aoiFeature);
            state.aoiAreaSqKm = areaSqKm;
            if (areaSqKm > MAX_AREA_SQ_KM) {
                toast(`AOI too large (${fmtArea(areaSqKm)}). Max is ${MAX_AREA_SQ_KM} km².`, 'error');
                state.aoiLayer.getSource().clear(); state.aoiFeature = null;
                updateAoiStatusUI(''); return;
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
        if (t3d?.extentLayer) {
            const features = t3d.extentLayer.getSource()?.getFeatures() || [];
            if (features.length > 0) {
                const cloned = features[0].clone();
                state.aoiLayer.getSource().addFeature(cloned);
                state.aoiFeature = cloned;
                usedExtent = true;
            }
        }
        if (!usedExtent) {
            const polygon = ol.geom.Polygon.fromExtent(map.getView().calculateExtent(map.getSize()));
            const feature = new ol.Feature({ geometry: polygon });
            state.aoiLayer.getSource().addFeature(feature);
            state.aoiFeature = feature;
        }

        const areaSqKm = computeAreaSqKm(state.aoiFeature);
        state.aoiAreaSqKm = areaSqKm;
        if (areaSqKm > MAX_AREA_SQ_KM) {
            toast(`Extent too large (${fmtArea(areaSqKm)}). Max ${MAX_AREA_SQ_KM} km². Zoom in closer.`, 'error');
            state.aoiLayer.getSource().clear(); state.aoiFeature = null;
            updateAoiStatusUI(''); return;
        }
        updateAoiStatusUI(`✓ ${fmtArea(areaSqKm)} (extent)`);
        toast(`Using current extent as AOI: ${fmtArea(areaSqKm)}`, 'success');
    }

    function clearAOI() {
        if (state.drawInteraction) { getMap()?.removeInteraction(state.drawInteraction); state.drawInteraction = null; }
        if (state.aoiLayer) state.aoiLayer.getSource().clear();
        state.aoiFeature = null; state.aoiAreaSqKm = 0;
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
        if (!state.aoiFeature) { toast('Please draw an AOI or use DTM Extent first.', 'error'); return; }
        if (state.isLoading)   { toast('Analytics already running…', 'warning'); return; }

        const from     = document.getElementById('sentinelDateFrom')?.value || state.currentDate.from;
        const to       = document.getElementById('sentinelDateTo')?.value   || state.currentDate.to;
        const interval = document.getElementById('sentinelInterval')?.value  || 'P16D';
        if (!from || !to) { toast('Please select date range.', 'error'); return; }

        const aoi = featureToWgs84GeoJSON(state.aoiFeature);
        setLoadingState(true);

        try {
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
            try { result = await response.json(); }
            catch {
                toast(`Server returned non-JSON (status ${response.status})`, 'error');
                setLoadingState(false); return;
            }

            if (!response.ok || !result.success) {
                toast(`Analytics failed: ${result?.error || `HTTP ${response.status}`}`, 'error');
                console.error('[Sentinel] Edge Function error:', result);
                setLoadingState(false); return;
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

        const ndvi   = data.ndvi_intervals || [];
        const ndmi   = data.ndmi_intervals || [];
        const ndre   = data.ndre_intervals || [];
        const ndwi   = data.ndwi_intervals || [];
        const labels = ndvi.map(d => d.from ? d.from.slice(0, 10) : '');

        const mkDs = (label, arr, color, hidden = false) => ({
            label,
            data:            arr.map(d => d.mean !== null && d.mean !== undefined ? parseFloat(d.mean.toFixed(4)) : null),
            borderColor:     color,
            backgroundColor: color + '14',
            borderWidth:     2,
            pointRadius:     4,
            pointHoverRadius: 7,
            tension:         0.35,
            fill:            false,
            spanGaps:        true,
            hidden,
        });

        state.chartInstance = new Chart(canvas, {
            type: 'line',
            data: {
                labels,
                datasets: [
                    mkDs('NDVI (Vegetation)', ndvi, '#22c55e'),
                    mkDs('NDMI (Moisture)',   ndmi, '#06b6d4'),
                    mkDs('NDRE (Red-Edge)',   ndre, '#f59e0b'),
                    mkDs('NDWI (Water)',      ndwi, '#0ea5e9', true),
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                plugins: {
                    legend: { display: true, position: 'top',
                              labels: { color: '#cbd5e1', font: { size: 11 }, usePointStyle: true } },
                    tooltip: {
                        backgroundColor: '#0f172a', titleColor: '#f1f5f9',
                        bodyColor: '#94a3b8', borderColor: '#334155', borderWidth: 1,
                        callbacks: { label: ctx => `${ctx.dataset.label}: ${ctx.parsed.y !== null ? ctx.parsed.y.toFixed(4) : 'N/A'}` },
                    },
                },
                scales: {
                    x: { ticks: { color: '#94a3b8', maxRotation: 45, font: { size: 10 } }, grid: { color: 'rgba(148,163,184,0.1)' } },
                    y: { min: -1, max: 1,
                         ticks: { color: '#94a3b8', font: { size: 10 } },
                         grid:  { color: 'rgba(148,163,184,0.1)' },
                         title: { display: true, text: 'Index Value', color: '#64748b', font: { size: 11 } } },
                },
            },
        });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // UI STATS TABLE (expanded with advanced calculations)
    // ─────────────────────────────────────────────────────────────────────────
    function renderStatsTable(data) {
        const container = document.getElementById('sentinelStatsTable');
        if (!container) return;
        const rows = computeStatsRows(data);

        const trendArrow = (dir) =>
            dir === 'improving' ? '<span style="color:#22c55e">↑ Improving</span>'
          : dir === 'declining' ? '<span style="color:#ef4444">↓ Declining</span>'
          : '<span style="color:#94a3b8">→ Stable</span>';

        container.innerHTML = `
            <style>
                .sentinel-stats-table { width:100%;border-collapse:collapse;font-size:0.78rem; }
                .sentinel-stats-table th { padding:6px 8px;text-align:center;background:#1e293b;color:#94a3b8;font-weight:600;white-space:nowrap; }
                .sentinel-stats-table th:first-child { text-align:left; }
                .sentinel-stats-table td { padding:5px 8px;text-align:center;border-bottom:1px solid #1e293b;color:#e2e8f0; }
                .sentinel-stats-table td:first-child { text-align:left;font-weight:600; }
                .sentinel-stats-table tr:hover td { background:#1e293b44; }
            </style>
            <table class="sentinel-stats-table">
                <thead>
                    <tr>
                        <th>Index</th><th>Min</th><th>Max</th><th>Mean</th>
                        <th>Std Dev</th><th>Scenes</th><th>Trend</th>
                        <th>Peak Val</th><th>Peak Date</th><th>Trough Val</th><th>Trough Date</th>
                        <th>Δ Change</th><th>Δ %</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows.map(r => `
                        <tr>
                            <td><span style="color:${r.cssColor}">${r.name}</span></td>
                            <td>${r.mn}</td><td>${r.mx}</td><td>${r.av}</td>
                            <td>${r.std}</td><td style="color:#64748b">${r.ct}</td>
                            <td>${trendArrow(r.trend.dir)}</td>
                            <td style="color:#22c55e">${r.pt.peak}</td>
                            <td style="color:#64748b;font-size:0.72rem">${r.pt.peakDate}</td>
                            <td style="color:#ef4444">${r.pt.trough}</td>
                            <td style="color:#64748b;font-size:0.72rem">${r.pt.troughDate}</td>
                            <td style="color:${r.change.abs !== 'N/A' && parseFloat(r.change.abs) > 0 ? '#22c55e' : '#ef4444'}">${r.change.abs}</td>
                            <td style="color:#94a3b8">${r.change.pct}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>`;
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

        const label = LAYER_CONFIGS[state.currentIndex]?.name || state.currentIndex;
        const from  = document.getElementById('sentinelDateFrom')?.value || state.currentDate.from;
        const to    = document.getElementById('sentinelDateTo')?.value   || state.currentDate.to;
        toast(`Capturing ${label} snapshot…`, 'info');

        return new Promise((resolve) => {
            map.once('rendercomplete', async () => {
                try {
                    const mapDiv = document.getElementById('map');
                    let dataUrl  = null;

                    // Try html2canvas on the flat map div
                    const h2c = window.html2canvas || (typeof html2canvas !== 'undefined' ? html2canvas : null);
                    if (h2c && mapDiv) {
                        try {
                            const captured = await h2c(mapDiv, {
                                useCORS: true, allowTaint: false, scale: 1, logging: false,
                                ignoreElements: (el) => el.classList?.contains('ol-control'),
                            });
                            dataUrl = captured.toDataURL('image/jpeg', 0.88);
                        } catch (e) { console.warn('[Sentinel] html2canvas failed:', e); }
                    }

                    // Fallback: composite all map canvases
                    if (!dataUrl) {
                        const canvases = mapDiv ? [...mapDiv.querySelectorAll('canvas')] : [];
                        if (canvases.length > 0) {
                            const first  = canvases[0];
                            const merged = document.createElement('canvas');
                            merged.width  = first.width;
                            merged.height = first.height;
                            const ctx = merged.getContext('2d');
                            canvases.forEach(c => { try { ctx.drawImage(c, 0, 0); } catch (_) {} });
                            dataUrl = merged.toDataURL('image/jpeg', 0.88);
                        }
                    }

                    if (!dataUrl) { toast('Could not capture map', 'error'); resolve(null); return; }

                    const snapshot = {
                        label, index: state.currentIndex,
                        dateFrom: from, dateTo: to,
                        dataUrl,
                        aspectRatio: (mapDiv?.offsetWidth || 800) / (mapDiv?.offsetHeight || 600),
                        timestamp: new Date().toISOString(),
                    };
                    state.snapshots.push(snapshot);
                    updateSnapshotStrip();
                    toast(`Snapshot captured: ${label}`, 'success');
                    resolve(snapshot);
                } catch (e) { toast('Snapshot failed: ' + e.message, 'error'); resolve(null); }
            });
            map.renderSync();
        });
    }

    function removeSnapshot(index) { state.snapshots.splice(index, 1); updateSnapshotStrip(); }

    function updateSnapshotStrip() {
        const strip = document.getElementById('sentinelSnapshotStrip');
        if (!strip) return;
        if (!state.snapshots.length) {
            strip.innerHTML = '<p style="font-size:0.75rem;color:#475569;text-align:center;padding:8px 0;">No snapshots yet.</p>';
            return;
        }
        strip.innerHTML = state.snapshots.map((s, i) => `
            <div style="position:relative;display:inline-block;margin:4px;">
                <img src="${s.dataUrl}" title="${s.label} (${s.dateFrom}→${s.dateTo})"
                    style="width:70px;height:50px;object-fit:cover;border-radius:4px;border:2px solid ${LAYER_CONFIGS[s.index]?.color||'#334155'};cursor:pointer;" />
                <span style="position:absolute;top:-4px;right:-4px;background:#ef4444;color:#fff;border-radius:50%;width:16px;height:16px;font-size:9px;display:flex;align-items:center;justify-content:center;cursor:pointer;"
                    onclick="window.sentinelRemoveSnapshot(${i})">×</span>
                <div style="font-size:9px;color:#64748b;text-align:center;max-width:70px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${s.label}</div>
            </div>`).join('');
    }
    window.sentinelRemoveSnapshot = removeSnapshot;

    // ─────────────────────────────────────────────────────────────────────────
    // PDF HELPERS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Capture the Chart.js canvas at full quality without html2canvas artefacts.
     * Composites onto an offscreen canvas with the correct dark background.
     */
    function captureChartCanvas() {
        const chartCanvas = document.getElementById('sentinelAnalyticsChart');
        if (!chartCanvas) return null;
        try {
            const w = chartCanvas.width;
            const h = chartCanvas.height;
            const off = document.createElement('canvas');
            off.width  = w;
            off.height = h;
            const ctx = off.getContext('2d');
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(0, 0, w, h);
            ctx.drawImage(chartCanvas, 0, 0);
            return { dataUrl: off.toDataURL('image/png', 1.0), w, h };
        } catch (e) {
            console.warn('[Sentinel PDF] Chart capture failed:', e);
            return null;
        }
    }

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
            const jsPDFCtor = window.jspdf?.jsPDF || window.jsPDF || null;
            if (!jsPDFCtor) { toast('PDF library not loaded. Please refresh.', 'error'); return; }

            const doc      = new jsPDFCtor({ orientation: 'portrait', unit: 'mm', format: 'a4' });
            const pageW    = doc.internal.pageSize.getWidth();   // 210 mm
            const pageH    = doc.internal.pageSize.getHeight();  // 297 mm
            const margin   = 14;
            const contentW = pageW - margin * 2;                  // 182 mm

            const from         = document.getElementById('sentinelDateFrom')?.value || state.currentDate.from;
            const to           = document.getElementById('sentinelDateTo')?.value   || state.currentDate.to;
            const intervalRaw  = document.getElementById('sentinelInterval')?.value || 'P16D';
            const intervalLabel = intervalRaw === 'P10D' ? '10-day' : intervalRaw === 'P16D' ? '16-day' : '1-month';
            const area         = state.analyticsData?.meta?.area_sq_km
                ? `${state.analyticsData.meta.area_sq_km.toFixed(2)} km²`
                : fmtArea(state.aoiAreaSqKm);
            const resolution   = state.analyticsData?.meta?.resolution_m
                ? `${state.analyticsData.meta.resolution_m} m`
                : 'Auto';

            // ── FOOTER ──────────────────────────────────────────────────────
            const drawFooter = (pn) => {
                doc.setDrawColor(0); doc.setLineWidth(0.3);
                doc.line(margin, pageH - 12, pageW - margin, pageH - 12);
                doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(100, 100, 100);
                doc.text('GEOSPATIAL NETWORK (GSP.NET)  |  Sentinel-2 L2A Satellite Analytics  |  Copernicus Data Space Ecosystem',
                    pageW / 2, pageH - 7, { align: 'center' });
                doc.text(`Page ${pn}`, pageW - margin, pageH - 7, { align: 'right' });
            };

            // ── SECTION HEADER — 2-row band, both lines centred ─────────────
            // Returns the band height so callers know where content starts.
            const drawSectionHeader = (title, subtitle) => {
                const hasSubtitle = !!subtitle;
                const bandH = hasSubtitle ? 24 : 16;

                // Black band
                doc.setFillColor(20, 20, 20);
                doc.rect(0, 0, pageW, bandH, 'F');
                // Left accent stripe
                doc.setFillColor(255, 255, 255);
                doc.rect(0, 0, 4, bandH, 'F');

                // Title (centred, white)
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(10);
                doc.setTextColor(255, 255, 255);
                const titleY = hasSubtitle ? 9 : 10;
                // Truncate title to fit available width (between accent stripe and right margin)
                const maxTitleW = contentW;
                const titleStr  = doc.splitTextToSize(title, maxTitleW)[0]; // first line only
                doc.text(titleStr, pageW / 2, titleY, { align: 'center' });

                // Subtitle (centred, grey, smaller)
                if (hasSubtitle) {
                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(7.5);
                    doc.setTextColor(180, 180, 180);
                    const maxSubW  = contentW;
                    const subLines = doc.splitTextToSize(subtitle, maxSubW);
                    // Only show first line if subtitle wraps
                    doc.text(subLines[0], pageW / 2, 19, { align: 'center' });
                }

                return bandH;
            };

            let pageNum    = 1;
            const totalPages = 1
                + (state.analyticsData ? 2 : 0)  // stats + bar chart
                + state.snapshots.length;

            // ═══════════════════════════════════════════════════════════════
            // PAGE 1: COVER (black & white, print-friendly)
            // ═══════════════════════════════════════════════════════════════
            doc.setFillColor(255, 255, 255);
            doc.rect(0, 0, pageW, pageH, 'F');

            doc.setFillColor(10, 10, 10);
            doc.rect(0, 0, pageW, 55, 'F');
            doc.setFillColor(255, 255, 255);
            doc.rect(0, 0, 5, 55, 'F');

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(24); doc.setTextColor(255, 255, 255);
            doc.text('Satellite Analytics', margin + 4, 28);
            doc.setFontSize(14); doc.setTextColor(200, 200, 200);
            doc.text('Surveyor Report', margin + 4, 42);

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8); doc.setTextColor(180, 180, 180);
            doc.text(new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' }),
                pageW - margin, 12, { align: 'right' });

            doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(80, 80, 80);
            doc.text('REPORT DETAILS', margin, 72);
            doc.setDrawColor(0); doc.setLineWidth(0.5);
            doc.line(margin, 74, pageW - margin, 74);

            const metaRows = [
                ['Platform',         'Geospatial Network (GSP.NET)'],
                ['Satellite Source', 'Sentinel-2 Level-2A (Copernicus CDSE)'],
                ['Analysis Period',  `${from}  to  ${to}`],
                ['Time Interval',    intervalLabel],
                ['Area of Interest', area],
                ['Resolution',       resolution],
                ['Indices Computed', 'NDVI · NDMI · NDRE · NDWI'],
                ['Generated By',     'GSP.NET Satellite Analytics Engine'],
                ['Generated On',     new Date().toLocaleString()],
            ];
            let metaY = 82;
            metaRows.forEach(([label, value], i) => {
                if (i % 2 === 0) { doc.setFillColor(245, 245, 245); doc.rect(margin, metaY - 4, contentW, 9, 'F'); }
                doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(60, 60, 60);
                doc.text(label + ':', margin + 2, metaY + 2);
                doc.setFont('helvetica', 'normal'); doc.setTextColor(20, 20, 20);
                doc.text(String(value), margin + 55, metaY + 2);
                metaY += 9;
            });

            metaY += 6;
            doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(80, 80, 80);
            doc.text('VEGETATION & MOISTURE INDICES INCLUDED', margin, metaY);
            doc.line(margin, metaY + 2, pageW - margin, metaY + 2);
            metaY += 8;

            [
                ['NDVI', 'Normalised Difference Vegetation Index — Photosynthetically active vegetation density and vigour.'],
                ['NDMI', 'Normalised Difference Moisture Index — Canopy water content and vegetation moisture stress.'],
                ['NDRE', 'Normalised Difference Red-Edge Index — Chlorophyll concentration in the leaf mesophyll layer.'],
                ['NDWI', 'Normalised Difference Water Index — Open water body delineation and flood extent mapping.'],
            ].forEach(([name, desc]) => {
                doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(20, 20, 20);
                doc.text(name + ':', margin + 2, metaY);
                doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(60, 60, 60);
                const lines = doc.splitTextToSize(desc, contentW - 24);
                doc.text(lines, margin + 22, metaY);
                metaY += lines.length * 5 + 3;
            });

            const discY = pageH - 40;
            doc.setDrawColor(150); doc.setLineWidth(0.2);
            doc.line(margin, discY, pageW - margin, discY);
            doc.setFont('helvetica', 'italic'); doc.setFontSize(7); doc.setTextColor(120, 120, 120);
            const disc = 'This report is generated from Sentinel-2 multispectral imagery provided via the Copernicus Data Space Ecosystem (CDSE). ' +
                'Statistical values represent cloud-masked scene averages over the specified AOI and time interval. ' +
                'All index values are dimensionless and range from -1 to +1. This report is intended for professional surveying use only.';
            doc.text(doc.splitTextToSize(disc, contentW), margin, discY + 5);
            drawFooter(pageNum);

            // ═══════════════════════════════════════════════════════════════
            // PAGE 2: STATISTICS TABLE + ADVANCED CALCULATIONS + CHART
            // ═══════════════════════════════════════════════════════════════
            if (state.analyticsData) {
                pageNum++;
                doc.addPage();
                doc.setFillColor(255, 255, 255); doc.rect(0, 0, pageW, pageH, 'F');

                const hdrH = drawSectionHeader(
                    'Time-Series Statistics',
                    `Period: ${from}  to  ${to}   |   Interval: ${intervalLabel}   |   AOI: ${area}`
                );

                const statsRows = computeStatsRows(state.analyticsData);
                let cy = hdrH + 5;

                // ── Narrative ────────────────────────────────────────────────
                doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(60, 60, 60);
                const narr = `Statistics computed from Sentinel-2 L2A imagery over the selected AOI (${area}) ` +
                    `between ${from} and ${to} at ${intervalLabel} intervals. ` +
                    `Values represent cloud-masked pixel means at ${resolution} spatial resolution. ` +
                    `Trend computed via linear regression across all valid scenes.`;
                const narrLines = doc.splitTextToSize(narr, contentW);
                doc.text(narrLines, margin, cy);
                cy += narrLines.length * 5 + 5;

                // ── Primary Stats Table ──────────────────────────────────────
                const pColX = [margin, margin+18, margin+66, margin+94, margin+122, margin+148, margin+162];
                const pH    = 8;
                const pHdrs = ['Index', 'Description', 'Minimum', 'Maximum', 'Mean', 'Std Dev', 'Scenes'];

                doc.setFillColor(20, 20, 20); doc.rect(margin, cy, contentW, pH, 'F');
                doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); doc.setTextColor(220, 220, 220);
                pHdrs.forEach((h, i) => doc.text(h, pColX[i] + 1.5, cy + 5.2));
                cy += pH;

                statsRows.forEach((row, ri) => {
                    doc.setFillColor(...(ri % 2 === 0 ? [245, 245, 245] : [255, 255, 255]));
                    doc.rect(margin, cy, contentW, pH, 'F');
                    doc.setDrawColor(210, 210, 210); doc.setLineWidth(0.1);
                    doc.line(margin, cy + pH, margin + contentW, cy + pH);
                    doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); doc.setTextColor(20, 20, 20);
                    doc.text(row.name, pColX[0] + 1.5, cy + 5.2);
                    doc.setFont('helvetica', 'normal'); doc.setTextColor(60, 60, 60);
                    doc.text(row.desc, pColX[1] + 1.5, cy + 5.2);
                    [row.mn, row.mx, row.av, row.std, String(row.ct)].forEach((v, i) => {
                        doc.setTextColor(20, 20, 20);
                        doc.text(String(v), pColX[i + 2] + 1.5, cy + 5.2);
                    });
                    cy += pH;
                });
                cy += 5;

                // ── Advanced Analytics Table ─────────────────────────────────
                doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(20, 20, 20);
                doc.text('Advanced Analytics', margin, cy);
                doc.setLineWidth(0.3); doc.setDrawColor(0);
                doc.line(margin, cy + 2, pageW - margin, cy + 2);
                cy += 7;

                const aColX = [margin, margin+18, margin+56, margin+80, margin+118, margin+142, margin+162, margin+174];
                const aHdrs = ['Index', 'Trend', 'Peak Value', 'Peak Date', 'Trough Value', 'Trough Date', 'Δ Change', 'Δ %'];
                doc.setFillColor(20, 20, 20); doc.rect(margin, cy, contentW, pH, 'F');
                doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); doc.setTextColor(220, 220, 220);
                aHdrs.forEach((h, i) => doc.text(h, aColX[i] + 1.5, cy + 5.2));
                cy += pH;

                statsRows.forEach((row, ri) => {
                    doc.setFillColor(...(ri % 2 === 0 ? [245, 245, 245] : [255, 255, 255]));
                    doc.rect(margin, cy, contentW, pH, 'F');
                    doc.setDrawColor(210, 210, 210); doc.setLineWidth(0.1);
                    doc.line(margin, cy + pH, margin + contentW, cy + pH);
                    const cells = [
                        row.name,
                        row.trend.label,
                        row.pt.peak, row.pt.peakDate,
                        row.pt.trough, row.pt.troughDate,
                        row.change.abs, row.change.pct,
                    ];
                    cells.forEach((v, i) => {
                        doc.setFont(i === 0 ? 'helvetica' : 'helvetica', i === 0 ? 'bold' : 'normal');
                        doc.setFontSize(7.5); doc.setTextColor(20, 20, 20);
                        doc.text(String(v), aColX[i] + 1.5, cy + 5.2);
                    });
                    cy += pH;
                });
                cy += 5;

                // ── Interpretation Notes ─────────────────────────────────────
                doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(20, 20, 20);
                doc.text('Interpretation Notes', margin, cy);
                doc.setLineWidth(0.3); doc.line(margin, cy + 2, pageW - margin, cy + 2);
                cy += 7;

                const interpret = (row) => {
                    if (row.av === 'N/A') return 'No valid cloud-free data for this index in the selected period.';
                    const v = parseFloat(row.av);
                    const trendNote = row.trend.dir !== 'stable'
                        ? ` The trend is ${row.trend.dir === 'improving' ? 'increasing (↑)' : 'decreasing (↓)'} over the analysis period.`
                        : ' Values remain stable across the period.';
                    const changeNote = row.change.pct !== 'N/A'
                        ? ` Net change from first to last scene: ${row.change.abs} (${row.change.pct}).`
                        : '';
                    if (row.name === 'NDVI') {
                        const base = v > 0.6 ? `Strong healthy vegetation (mean ${row.av}) — dense biomass, high photosynthetic activity.`
                            : v > 0.4 ? `Moderate vegetation cover (mean ${row.av}) — typical cropland or mixed canopy.`
                            : v > 0.2 ? `Sparse vegetation or early-growth stage (mean ${row.av}).`
                            : `Very sparse or no significant vegetation (mean ${row.av}) — possible bare soil or urban surface.`;
                        return base + trendNote + changeNote;
                    }
                    if (row.name === 'NDMI') {
                        const base = v > 0.3 ? `High canopy moisture (mean ${row.av}) — low water stress.`
                            : v > 0.0 ? `Moderate moisture levels (mean ${row.av}) — monitor for seasonal stress.`
                            : `Vegetation moisture stress detected (mean ${row.av}) — possible drought or senescence.`;
                        return base + trendNote + changeNote;
                    }
                    if (row.name === 'NDRE') {
                        const base = v > 0.4 ? `High chlorophyll content (mean ${row.av}) — good nitrogen uptake and plant health.`
                            : v > 0.2 ? `Moderate chlorophyll levels (mean ${row.av}) — possible nutrient limitation.`
                            : `Low chlorophyll detected (mean ${row.av}) — potential chlorosis or crop stress.`;
                        return base + trendNote + changeNote;
                    }
                    if (row.name === 'NDWI') {
                        const base = v > 0.3 ? `Open water bodies or saturated surfaces present (mean ${row.av}).`
                            : v > 0.0 ? `Possible wetland or high soil moisture (mean ${row.av}).`
                            : `Predominantly non-water surfaces (mean ${row.av}).`;
                        return base + trendNote + changeNote;
                    }
                    return '';
                };

                statsRows.forEach(row => {
                    if (cy > pageH - 40) return; // avoid overflow
                    doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(20, 20, 20);
                    doc.text(`${row.name} —`, margin, cy);
                    doc.setFont('helvetica', 'normal'); doc.setTextColor(50, 50, 50);
                    const iLines = doc.splitTextToSize(interpret(row), contentW - 20);
                    doc.text(iLines, margin + 18, cy);
                    cy += Math.max(iLines.length * 5, 7) + 2;
                });

                cy += 4;

                // ── Time-Series Chart ────────────────────────────────────────
                if (cy < pageH - 60) {
                    const chart = captureChartCanvas();
                    if (chart) {
                        const availH = pageH - cy - margin - 12;
                        const drawW  = contentW;
                        const drawH  = Math.min((chart.h / chart.w) * drawW, availH);
                        if (availH > 25) {
                            // Dark background rect so chart looks correct
                            doc.setFillColor(15, 23, 42);
                            doc.rect(margin, cy, drawW, drawH, 'F');
                            doc.addImage(chart.dataUrl, 'PNG', margin, cy, drawW, drawH);
                        }
                    }
                }

                drawFooter(pageNum);

                // ═══════════════════════════════════════════════════════════
                // PAGE 3: COMPARATIVE BAR CHART (drawn with jsPDF primitives)
                // ═══════════════════════════════════════════════════════════
                pageNum++;
                doc.addPage();
                doc.setFillColor(255, 255, 255); doc.rect(0, 0, pageW, pageH, 'F');

                drawSectionHeader(
                    'Index Comparison Chart',
                    `Min / Max / Mean comparison across NDVI, NDMI, NDRE and NDWI`
                );

                let bcy = 30;

                // Chart config
                const barGroupW = 38;       // mm per index group
                const barGap    = 3;        // mm between bars within group
                const barW      = 10;       // mm each bar
                const chartTop  = bcy + 10;
                const chartH    = 80;       // chart height in mm
                const chartL    = margin + 20;
                const yMin      = -1;
                const yMax      = 1;
                const yRange    = yMax - yMin;

                // Y-axis
                doc.setDrawColor(150); doc.setLineWidth(0.3);
                doc.line(chartL, chartTop, chartL, chartTop + chartH);
                // X-axis at y=0
                const zeroY = chartTop + chartH * (yMax / yRange);
                doc.setDrawColor(80); doc.setLineWidth(0.4);
                doc.line(chartL, zeroY, chartL + barGroupW * statsRows.length + 10, zeroY);

                // Y-axis labels and gridlines
                doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5); doc.setTextColor(80);
                [-1, -0.5, 0, 0.5, 1].forEach(tick => {
                    const ty = chartTop + chartH * ((yMax - tick) / yRange);
                    doc.setDrawColor(200); doc.setLineWidth(0.1);
                    doc.line(chartL, ty, chartL + barGroupW * statsRows.length + 10, ty);
                    doc.setTextColor(80, 80, 80);
                    doc.text(tick.toFixed(1), chartL - 2, ty + 1, { align: 'right' });
                });

                // Y-axis title
                doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(60);
                doc.text('Index Value', margin + 2, chartTop + chartH / 2, { angle: 90, align: 'center' });

                // Bars for each index
                statsRows.forEach((row, gi) => {
                    const groupX = chartL + gi * barGroupW + barGap;

                    const drawBar = (val, offsetX, color) => {
                        if (val === 'N/A') return;
                        const v      = parseFloat(val);
                        const barH   = Math.abs(v) * chartH / yRange;
                        const barY   = v >= 0 ? zeroY - barH : zeroY;
                        doc.setFillColor(...color);
                        doc.rect(groupX + offsetX, barY, barW, barH, 'F');
                        // Value label
                        doc.setFont('helvetica', 'normal'); doc.setFontSize(5.5); doc.setTextColor(20, 20, 20);
                        const labelY = v >= 0 ? barY - 1.5 : barY + barH + 3.5;
                        doc.text(val, groupX + offsetX + barW / 2, labelY, { align: 'center' });
                    };

                    drawBar(row.mn, 0,              [200, 200, 200]);   // Min — light grey
                    drawBar(row.mx, barW + barGap,  [80,  80,  80]);    // Max — dark grey
                    drawBar(row.av, (barW + barGap)*2, row.pdfColor);   // Mean — index colour

                    // Index label below x-axis
                    doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); doc.setTextColor(20, 20, 20);
                    doc.text(row.name, groupX + barGroupW / 2 - barGap - barW / 2,
                        chartTop + chartH + 6, { align: 'center' });
                });

                // Legend
                const legX = chartL;
                const legY = chartTop + chartH + 14;
                const legItems = [
                    { label: 'Minimum', color: [200, 200, 200] },
                    { label: 'Maximum', color: [80, 80, 80] },
                    { label: 'Mean',    color: [80, 80, 180] },
                ];
                doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5);
                legItems.forEach((leg, li) => {
                    const lx = legX + li * 45;
                    doc.setFillColor(...leg.color);
                    doc.rect(lx, legY - 3.5, 8, 4, 'F');
                    doc.setTextColor(40, 40, 40);
                    doc.text(leg.label, lx + 10, legY);
                });

                // Title above chart
                doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(20, 20, 20);
                doc.text('Min / Max / Mean Comparison by Index', pageW / 2, bcy + 5, { align: 'center' });
                doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(80, 80, 80);
                doc.text(`AOI: ${area}   |   ${from} to ${to}   |   Resolution: ${resolution}`,
                    pageW / 2, bcy + 11, { align: 'center' });

                // Caption
                const capY = chartTop + chartH + 25;
                doc.setFont('helvetica', 'italic'); doc.setFontSize(7.5); doc.setTextColor(100, 100, 100);
                const caption = 'Bar chart showing Minimum, Maximum, and Mean values for each spectral index over the analysis period. ' +
                    'Values range from -1 to +1. The zero (0) reference line is shown as a solid horizontal line.';
                doc.text(doc.splitTextToSize(caption, contentW), margin, capY);

                drawFooter(pageNum);
            }

            // ═══════════════════════════════════════════════════════════════
            // PAGE(S): MAP SNAPSHOTS — aspect-ratio preserved, centred
            // ═══════════════════════════════════════════════════════════════
            for (let i = 0; i < state.snapshots.length; i++) {
                pageNum++;
                const snap = state.snapshots[i];
                doc.addPage();
                doc.setFillColor(255, 255, 255); doc.rect(0, 0, pageW, pageH, 'F');

                // Compact subtitle: index name on first line, date + capture info on second
                const hdrH = drawSectionHeader(
                    `Map View: ${snap.label}`,
                    `${snap.dateFrom} to ${snap.dateTo}   |   Capture ${i + 1} of ${state.snapshots.length}`
                );

                const imgAreaTop = hdrH + 4;
                const imgAreaBot = pageH - 16;
                const imgAreaH   = imgAreaBot - imgAreaTop;
                const imgAreaW   = contentW;

                const ar    = snap.aspectRatio || (16 / 9);
                let drawW   = imgAreaW;
                let drawH   = drawW / ar;
                if (drawH > imgAreaH) { drawH = imgAreaH; drawW = drawH * ar; }
                const imgX = margin + (imgAreaW - drawW) / 2;
                const imgY = imgAreaTop + (imgAreaH - drawH) / 2;

                doc.addImage(snap.dataUrl, 'JPEG', imgX, imgY, drawW, drawH);

                const capY = imgY + drawH + 4;
                if (capY < imgAreaBot) {
                    doc.setFont('helvetica', 'italic'); doc.setFontSize(7.5); doc.setTextColor(80, 80, 80);
                    doc.text(
                        `Figure ${i + 1}: ${snap.label}  |  ${snap.dateFrom} to ${snap.dateTo}  |  Captured: ${new Date(snap.timestamp).toLocaleString()}`,
                        pageW / 2, capY, { align: 'center' }
                    );
                }

                drawFooter(pageNum);
            }

            // ── Save ─────────────────────────────────────────────────────────
            doc.save(`GSPNET_Satellite_Report_${from}_to_${to}.pdf`);
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
            while (viewer.imageryLayers.length > 1)
                viewer.imageryLayers.remove(viewer.imageryLayers.get(viewer.imageryLayers.length - 1));
            if (!state.isWmsVisible) return;
            const p = buildWmsParams();
            const provider = new Cesium.WebMapServiceImageryProvider({
                url: CDSE_WMS_URL, layers: p.LAYERS,
                parameters: { transparent:'true', format:'image/png', TIME: p.TIME, MAXCC: String(p.MAXCC), PRIORITY:'leastCC', SHOWLOGO:'false' },
                credit: new Cesium.Credit('Copernicus Data Space Ecosystem'),
                minimumLevel: 8, maximumLevel: 17,
            });
            const layer = viewer.imageryLayers.addImageryProvider(provider);
            layer.alpha = state.wmsOpacity;
            toast(`Sentinel ${p.LAYERS} draped on 3D terrain`, 'success');
        } catch (e) { console.warn('[Sentinel 3D] Drape error:', e); }
    };

    // ─────────────────────────────────────────────────────────────────────────
    // UI WIRING
    // ─────────────────────────────────────────────────────────────────────────
    function wireUI() {
        const $ = id => document.getElementById(id);

        $('sentinelDrawAoiBtn')?.addEventListener('click', startDrawAOI);
        $('sentinelUseExtentBtn')?.addEventListener('click', useDtmExtent);
        $('sentinelClearAoiBtn')?.addEventListener('click', clearAOI);

        $('sentinelIndexSel')?.addEventListener('change', e => {
            state.currentIndex = e.target.value;
            if (state.isWmsVisible) addOrUpdateWmsLayer();
            updateWmsStatusUI();
        });

        $('sentinelOpacitySlider')?.addEventListener('input', e => {
            state.wmsOpacity = parseFloat(e.target.value) / 100;
            const v = $('sentinelOpacityVal');
            if (v) v.textContent = e.target.value + '%';
            if (state.wmsLayer) state.wmsLayer.setOpacity(state.wmsOpacity);
        });

        $('sentinelCloudCover')?.addEventListener('input', e => {
            state.maxCC = parseInt(e.target.value);
            const v = $('sentinelCloudCoverVal');
            if (v) v.textContent = e.target.value + '%';
            if (state.isWmsVisible) addOrUpdateWmsLayer();
        });

        $('sentinelWmsToggle')?.addEventListener('click', () => {
            if (state.isWmsVisible) { removeWmsLayer(); }
            else {
                const from = $('sentinelDateFrom')?.value;
                const to   = $('sentinelDateTo')?.value;
                if (from && to) state.currentDate = { from, to };
                addOrUpdateWmsLayer();
            }
        });

        $('sentinelApplyLayerBtn')?.addEventListener('click', () => {
            const from = $('sentinelDateFrom')?.value;
            const to   = $('sentinelDateTo')?.value;
            if (from && to) state.currentDate = { from, to };
            addOrUpdateWmsLayer();
            toast('Satellite layer updated', 'success');
        });

        $('sentinelFetchBtn')?.addEventListener('click', fetchStatistics);
        $('sentinelCaptureBtn')?.addEventListener('click', captureMapSnapshot);
        $('sentinelPdfBtn')?.addEventListener('click', generatePdfReport);

        const dateFrom = $('sentinelDateFrom');
        const dateTo   = $('sentinelDateTo');
        if (dateFrom && !dateFrom.value) dateFrom.value = state.currentDate.from;
        if (dateTo   && !dateTo.value)   dateTo.value   = state.currentDate.to;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // INIT
    // ─────────────────────────────────────────────────────────────────────────
    function init() { wireUI(); updateWmsStatusUI(); updateSnapshotStrip(); }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();

})();
