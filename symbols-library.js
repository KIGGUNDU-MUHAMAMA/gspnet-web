/**
 * Symbols Library Module
 * A QGIS-like collaborative mapping feature for OpenLayers
 * Allows users to create, style, and manage point/line/polygon features
 */

// Global state
let map = null;
let supabaseClient = null;
let symbolCatalog = [];
let featuresLayer = null;
let featuresSource = null;
let drawInteraction = null;
let snapInteractions = [];
let modifyInteraction = null;
let selectInteraction = null;
let loadedFeatures = new Map(); // Map<featureId, ol.Feature> for upsert
let currentUserId = null;
let isAutoLoadEnabled = false;
let autoLoadTimeout = null;
let selectedSymbol = null;

// Expanded symbols expected in production catalog (used for health check/bootstrap)
const REQUIRED_EXPANDED_SYMBOL_KEYS = [
    'culvert', 'bus_stop', 'taxi_stage', 'junction_roundabout',
    'transformer', 'water_valve', 'hydrant', 'storm_drain_inlet',
    'protected_tree', 'needs_verification', 'missing_feature',
    'access_blocked', 'photo_evidence_point', 'bridge', 'sewer_line',
    'drainage_channel', 'school', 'health_facility', 'market',
    'worship_place', 'public_office', 'wetland', 'flood_zone',
    'landslide_zone', 'conflict_overlap'
];

/**
 * Normalize geometry type from DB category to OpenLayers format
 * DB category column stores: point, line, polygon
 * OL expects: Point, LineString, Polygon
 */
function normalizeGeomType(value) {
    if (!value) return value;
    const mapping = {
        'point': 'Point',
        'line': 'LineString',
        'linestring': 'LineString',
        'polygon': 'Polygon'
    };
    return mapping[value.toLowerCase()] || value;
}

/**
 * Initialize the Symbols Library
 * @param {ol.Map} olMap - OpenLayers map instance
 * @param {Object} supabase - Supabase client instance
 */
async function initSymbolsLibrary(olMap, supabase) {
    console.log('[SL] initSymbolsLibrary called', { hasMap: !!olMap, hasSupabase: !!supabase });
    map = olMap;
    supabaseClient = supabase;

    console.log('[SL] Symbols Library: Initializing...');

    try {
        // Get current user
        console.log('[SL] Getting current user...');
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) {
            console.warn('[SL] Symbols Library: User not authenticated, running in read-only mode');
            showMessage('Sign in to save/edit features. Catalog can still load if permissions allow.', 'warning');
            currentUserId = null;
        } else {
            console.log('[SL] User authenticated:', user.id);
            currentUserId = user.id;
        }

        // Load symbol catalog
        console.log('[SL] Loading symbol catalog...');
        await loadSymbolCatalog();
        await ensureExpandedCatalogAvailable();
        console.log('[SL] Symbol catalog loaded:', symbolCatalog.length, 'symbols');

        // Setup OpenLayers layer
        console.log('[SL] Setting up features layer...');
        setupFeaturesLayer();

        // Setup UI event handlers
        console.log('[SL] Setting up UI handlers...');
        setupUIHandlers();

        // Load collaborative features immediately (all users in current extent)
        await loadFeatures();

        console.log('Symbols Library: Initialization complete');
    } catch (error) {
        console.error('Symbols Library: Initialization failed:', error);
    }
}

/**
 * Load symbol catalog from Supabase
 */
async function loadSymbolCatalog() {
    try {
        const { data, error } = await supabaseClient
            .from('symbol_catalog')
            .select('*')
            .order('category', { ascending: true })
            .order('name', { ascending: true });

        if (error) throw error;

        symbolCatalog = data || [];

        // The DB table uses 'category' column (point/line/polygon) instead of 'geom_type'.
        // Map category to geom_type (OL PascalCase) on every symbol.
        if (symbolCatalog.length > 0) {
            console.log('[SL] DB columns:', Object.keys(symbolCatalog[0]));
            console.log('[SL] Sample record:', JSON.stringify(symbolCatalog[0]));

            // Remap: category -> geom_type with normalization
            symbolCatalog = symbolCatalog.map(s => ({
                ...s,
                geom_type: normalizeGeomType(s.category)
            }));

            console.log('[SL] geom_type values after mapping:', [...new Set(symbolCatalog.map(s => s.geom_type))]);
        }

        console.log(`Symbols Library: Loaded ${symbolCatalog.length} symbols`);

        // Populate catalog UI
        populateCatalogUI();
    } catch (error) {
        console.error('Symbols Library: Failed to load symbol catalog:', error);
        const catalogContainer = document.getElementById('catalogSymbols');
        if (catalogContainer) {
            catalogContainer.innerHTML = `
                <div style="padding: 15px; color: #6b7280;">
                    <p style="margin: 0 0 8px 0; color: #dc2626; font-weight: 600;">
                        Failed to load symbols library.
                    </p>
                    <p style="margin: 0 0 6px 0;">
                        Common causes:
                    </p>
                    <ul style="margin: 0 0 8px 18px; padding: 0;">
                        <li>No rows in <code>symbol_catalog</code></li>
                        <li>RLS policy blocks reads for current session</li>
                        <li>Supabase connection/auth issue</li>
                    </ul>
                    <p style="margin: 0;">Check browser console for details.</p>
                </div>
            `;
        }
    }
}

function getExpandedCatalogSeedRows() {
    return [
        { symbol_key: 'culvert', category: 'point', name: 'Culvert', description: 'Road crossing culvert', svg: '<svg viewBox="0 0 24 24"><ellipse cx="12" cy="12" rx="8" ry="5" fill="none" stroke="currentColor" stroke-width="2"/><line x1="4" y1="12" x2="20" y2="12" stroke="currentColor" stroke-width="2"/></svg>', default_style: { color: '#6b7280', size: 20, opacity: 1.0 }, tags: ['transport', 'drainage', 'culvert'] },
        { symbol_key: 'bus_stop', category: 'point', name: 'Bus Stop', description: 'Public bus stop', svg: '<svg viewBox="0 0 24 24"><rect x="6" y="4" width="12" height="10" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="9" cy="16" r="1.5"/><circle cx="15" cy="16" r="1.5"/></svg>', default_style: { color: '#f59e0b', size: 22, opacity: 1.0 }, tags: ['transport', 'bus', 'stop'] },
        { symbol_key: 'taxi_stage', category: 'point', name: 'Taxi Stage', description: 'Taxi pickup and drop-off stage', svg: '<svg viewBox="0 0 24 24"><path d="M5 12h14v5H5z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8 8h8l2 4H6z" fill="none" stroke="currentColor" stroke-width="2"/></svg>', default_style: { color: '#f97316', size: 22, opacity: 1.0 }, tags: ['transport', 'taxi', 'stage'] },
        { symbol_key: 'junction_roundabout', category: 'point', name: 'Roundabout Junction', description: 'Roundabout road junction', svg: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="6" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 3v4M21 12h-4M12 21v-4M3 12h4" stroke="currentColor" stroke-width="2"/></svg>', default_style: { color: '#ef4444', size: 22, opacity: 1.0 }, tags: ['transport', 'junction', 'roundabout'] },
        { symbol_key: 'transformer', category: 'point', name: 'Transformer', description: 'Electric power transformer', svg: '<svg viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="10" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="9" cy="11" r="1.5"/><circle cx="15" cy="11" r="1.5"/></svg>', default_style: { color: '#7c3aed', size: 20, opacity: 1.0 }, tags: ['utility', 'electricity', 'transformer'] },
        { symbol_key: 'water_valve', category: 'point', name: 'Water Valve', description: 'Water network valve', svg: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 6v12M6 12h12" stroke="currentColor" stroke-width="2"/></svg>', default_style: { color: '#0284c7', size: 18, opacity: 1.0 }, tags: ['utility', 'water', 'valve'] },
        { symbol_key: 'hydrant', category: 'point', name: 'Fire Hydrant', description: 'Firefighting hydrant', svg: '<svg viewBox="0 0 24 24"><rect x="9" y="6" width="6" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><rect x="7" y="10" width="2" height="3"/><rect x="15" y="10" width="2" height="3"/></svg>', default_style: { color: '#dc2626', size: 20, opacity: 1.0 }, tags: ['utility', 'fire', 'hydrant'] },
        { symbol_key: 'storm_drain_inlet', category: 'point', name: 'Storm Drain Inlet', description: 'Stormwater drain inlet', svg: '<svg viewBox="0 0 24 24"><rect x="5" y="8" width="14" height="8" fill="none" stroke="currentColor" stroke-width="2"/><line x1="8" y1="8" x2="8" y2="16" stroke="currentColor" stroke-width="1.5"/><line x1="12" y1="8" x2="12" y2="16" stroke="currentColor" stroke-width="1.5"/><line x1="16" y1="8" x2="16" y2="16" stroke="currentColor" stroke-width="1.5"/></svg>', default_style: { color: '#0ea5e9', size: 19, opacity: 1.0 }, tags: ['utility', 'drainage', 'stormwater'] },
        { symbol_key: 'protected_tree', category: 'point', name: 'Protected Tree', description: 'Protected or heritage tree', svg: '<svg viewBox="0 0 24 24"><circle cx="12" cy="9" r="5"/><rect x="10.5" y="13" width="3" height="7"/><path d="M6 6l12 12" stroke="currentColor" stroke-width="2" fill="none"/></svg>', default_style: { color: '#16a34a', size: 22, opacity: 1.0 }, tags: ['environment', 'tree', 'protected'] },
        { symbol_key: 'needs_verification', category: 'point', name: 'Needs Verification', description: 'Feature requiring field verification', svg: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 7v6" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="17" r="1.2"/></svg>', default_style: { color: '#f59e0b', size: 22, opacity: 1.0 }, tags: ['qa', 'verification', 'review'] },
        { symbol_key: 'missing_feature', category: 'point', name: 'Missing Feature', description: 'Expected feature missing on ground', svg: '<svg viewBox="0 0 24 24"><path d="M12 4v16M4 12h16" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/></svg>', default_style: { color: '#e11d48', size: 22, opacity: 1.0 }, tags: ['qa', 'missing', 'correction'] },
        { symbol_key: 'access_blocked', category: 'point', name: 'Access Blocked', description: 'No physical access to target area', svg: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M6 6l12 12" stroke="currentColor" stroke-width="2"/></svg>', default_style: { color: '#b91c1c', size: 21, opacity: 1.0 }, tags: ['qa', 'access', 'blocked'] },
        { symbol_key: 'photo_evidence_point', category: 'point', name: 'Photo Evidence Point', description: 'Location with photo evidence', svg: '<svg viewBox="0 0 24 24"><rect x="4" y="7" width="16" height="11" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12.5" r="3" fill="none" stroke="currentColor" stroke-width="2"/><rect x="8" y="5" width="4" height="2"/></svg>', default_style: { color: '#2563eb', size: 21, opacity: 1.0 }, tags: ['qa', 'photo', 'evidence'] },
        { symbol_key: 'bridge', category: 'line', name: 'Bridge', description: 'Bridge crossing segment', svg: null, default_style: { strokeColor: '#7c2d12', strokeWidth: 4, strokeOpacity: 1.0, strokeDash: [2, 2] }, tags: ['transport', 'bridge', 'crossing'] },
        { symbol_key: 'sewer_line', category: 'line', name: 'Sewer Line', description: 'Underground sewer network line', svg: null, default_style: { strokeColor: '#374151', strokeWidth: 2, strokeOpacity: 1.0, strokeDash: [4, 3] }, tags: ['utility', 'sewer', 'infrastructure'] },
        { symbol_key: 'drainage_channel', category: 'line', name: 'Drainage Channel', description: 'Open drainage channel', svg: null, default_style: { strokeColor: '#0ea5e9', strokeWidth: 2.5, strokeOpacity: 0.9, strokeDash: [10, 4] }, tags: ['hydrology', 'drainage', 'channel'] },
        { symbol_key: 'school', category: 'polygon', name: 'School Compound', description: 'School land parcel/compound', svg: null, default_style: { fillColor: '#fbbf24', fillOpacity: 0.35, strokeColor: '#b45309', strokeWidth: 1.8, strokeOpacity: 1.0 }, tags: ['landuse', 'education', 'school'] },
        { symbol_key: 'health_facility', category: 'polygon', name: 'Health Facility', description: 'Hospital, clinic, or health center', svg: null, default_style: { fillColor: '#f87171', fillOpacity: 0.35, strokeColor: '#b91c1c', strokeWidth: 1.8, strokeOpacity: 1.0 }, tags: ['landuse', 'health', 'clinic'] },
        { symbol_key: 'market', category: 'polygon', name: 'Market Area', description: 'Market zone or trading center', svg: null, default_style: { fillColor: '#fb923c', fillOpacity: 0.35, strokeColor: '#c2410c', strokeWidth: 1.6, strokeOpacity: 1.0 }, tags: ['landuse', 'market', 'commercial'] },
        { symbol_key: 'worship_place', category: 'polygon', name: 'Place of Worship', description: 'Religious worship compound', svg: null, default_style: { fillColor: '#a78bfa', fillOpacity: 0.35, strokeColor: '#6d28d9', strokeWidth: 1.6, strokeOpacity: 1.0 }, tags: ['landuse', 'religion', 'worship'] },
        { symbol_key: 'public_office', category: 'polygon', name: 'Public Office', description: 'Government/public administration office', svg: null, default_style: { fillColor: '#60a5fa', fillOpacity: 0.35, strokeColor: '#1d4ed8', strokeWidth: 1.6, strokeOpacity: 1.0 }, tags: ['landuse', 'public', 'office'] },
        { symbol_key: 'wetland', category: 'polygon', name: 'Wetland', description: 'Wetland or marsh area', svg: null, default_style: { fillColor: '#22d3ee', fillOpacity: 0.3, strokeColor: '#0891b2', strokeWidth: 1.5, strokeOpacity: 0.9 }, tags: ['hydrology', 'wetland', 'environment'] },
        { symbol_key: 'flood_zone', category: 'polygon', name: 'Flood Risk Zone', description: 'Area prone to seasonal flooding', svg: null, default_style: { fillColor: '#38bdf8', fillOpacity: 0.28, strokeColor: '#0369a1', strokeWidth: 1.6, strokeOpacity: 0.9 }, tags: ['hazard', 'flood', 'risk'] },
        { symbol_key: 'landslide_zone', category: 'polygon', name: 'Landslide Risk Zone', description: 'Area susceptible to landslides', svg: null, default_style: { fillColor: '#fca5a5', fillOpacity: 0.28, strokeColor: '#b91c1c', strokeWidth: 1.6, strokeOpacity: 0.9 }, tags: ['hazard', 'landslide', 'risk'] },
        { symbol_key: 'conflict_overlap', category: 'polygon', name: 'Conflict Overlap', description: 'Overlapping claims requiring adjudication', svg: null, default_style: { fillColor: '#f43f5e', fillOpacity: 0.25, strokeColor: '#9f1239', strokeWidth: 2.0, strokeOpacity: 1.0 }, tags: ['qa', 'overlap', 'conflict'] }
    ];
}

async function ensureExpandedCatalogAvailable() {
    try {
        const existingKeys = new Set(symbolCatalog.map(s => s.symbol_key));
        const missingKeys = REQUIRED_EXPANDED_SYMBOL_KEYS.filter(key => !existingKeys.has(key));
        if (missingKeys.length === 0) return;

        console.warn(`[SL] Expanded symbols missing (${missingKeys.length}), attempting bootstrap...`);
        const seedRows = getExpandedCatalogSeedRows().filter(row => missingKeys.includes(row.symbol_key));
        const { error } = await supabaseClient
            .from('symbol_catalog')
            .upsert(seedRows, { onConflict: 'symbol_key', ignoreDuplicates: true });

        if (error) {
            console.warn('[SL] Bootstrap upsert blocked (likely RLS):', error.message);
            showMessage(`Missing ${missingKeys.length} symbols in catalog. Run SQL seed to load expanded symbols.`, 'warning');
            return;
        }

        console.log(`[SL] Bootstrapped ${seedRows.length} symbols, reloading catalog...`);
        await loadSymbolCatalog();
        showMessage(`Expanded symbols loaded (${seedRows.length} added)`, 'success');
    } catch (error) {
        console.error('[SL] Expanded catalog bootstrap failed:', error);
    }
}

/**
 * Populate catalog UI with symbols
 */
function populateCatalogUI() {
    const catalogContainer = document.getElementById('catalogSymbols');
    if (!catalogContainer) {
        console.warn('[SL] Catalog container not found');
        return;
    }

    console.log('[SL] Populating catalog with', symbolCatalog.length, 'symbols');

    // Group symbols by geometry type (normalize from DB lowercase to PascalCase)
    const grouped = {
        Point: [],
        LineString: [],
        Polygon: []
    };

    symbolCatalog.forEach(symbol => {
        const normalized = normalizeGeomType(symbol.geom_type);
        if (grouped[normalized]) {
            grouped[normalized].push(symbol);
        }
    });

    let html = '';

    if (symbolCatalog.length === 0) {
        catalogContainer.innerHTML = `
            <div style="padding: 15px; color: #6b7280;">
                <p style="margin: 0 0 8px 0; font-weight: 600;">No symbols found.</p>
                <p style="margin: 0 0 6px 0;">Verify that:</p>
                <ul style="margin: 0 0 8px 18px; padding: 0;">
                    <li><code>symbol_catalog</code> has seeded rows</li>
                    <li>current user/session can SELECT the table</li>
                    <li>the app is connected to the expected Supabase project</li>
                </ul>
            </div>
        `;
        return;
    }

    // Render Points
    if (grouped.Point.length > 0) {
        html += `<h4><i class="fas fa-map-marker-alt"></i> Points (${grouped.Point.length})</h4>`;
        html += '<div class="symbol-grid">';
        grouped.Point.forEach(symbol => {
            html += `
                <div class="symbol-card" data-symbol-key="${symbol.symbol_key}" data-geom-type="Point">
                    <div class="symbol-icon">${symbol.svg || '📍'}</div>
                    <div class="symbol-name">${symbol.name}</div>
                </div>
            `;
        });
        html += '</div>';
    }

    // Render Lines
    if (grouped.LineString.length > 0) {
        html += `<h4><i class="fas fa-route"></i> Lines (${grouped.LineString.length})</h4>`;
        html += '<div class="symbol-grid">';
        grouped.LineString.forEach(symbol => {
            const color = symbol.default_style?.strokeColor || symbol.default_style?.stroke_color || '#3b82f6';
            html += `
                <div class="symbol-card" data-symbol-key="${symbol.symbol_key}" data-geom-type="LineString">
                    <div class="symbol-icon">
                        <svg width="40" height="40" viewBox="0 0 40 40">
                            <line x1="5" y1="35" x2="35" y2="5" stroke="${color}" stroke-width="3"/>
                        </svg>
                    </div>
                    <div class="symbol-name">${symbol.name}</div>
                </div>
            `;
        });
        html += '</div>';
    }

    // Render Polygons
    if (grouped.Polygon.length > 0) {
        html += `<h4><i class="fas fa-draw-polygon"></i> Polygons (${grouped.Polygon.length})</h4>`;
        html += '<div class="symbol-grid">';
        grouped.Polygon.forEach(symbol => {
            const fillColor = symbol.default_style?.fillColor || symbol.default_style?.fill_color || '#22c55e';
            const strokeColor = symbol.default_style?.strokeColor || symbol.default_style?.stroke_color || '#166534';
            html += `
                <div class="symbol-card" data-symbol-key="${symbol.symbol_key}" data-geom-type="Polygon">
                    <div class="symbol-icon">
                        <svg width="40" height="40" viewBox="0 0 40 40">
                            <rect x="5" y="5" width="30" height="30" fill="${fillColor}" fill-opacity="0.5" stroke="${strokeColor}" stroke-width="2"/>
                        </svg>
                    </div>
                    <div class="symbol-name">${symbol.name}</div>
                </div>
            `;
        });
        html += '</div>';
    }

    catalogContainer.innerHTML = html;

    // Add click handlers for symbol selection
    const symbolCards = catalogContainer.querySelectorAll('.symbol-card');
    symbolCards.forEach(card => {
        card.addEventListener('click', () => {
            // Remove selected class from all cards
            symbolCards.forEach(c => c.classList.remove('selected'));
            // Add selected class to clicked card
            card.classList.add('selected');

            const symbolKey = card.getAttribute('data-symbol-key');
            selectedSymbol = symbolCatalog.find(s => s.symbol_key === symbolKey);

            console.log('[SL] Symbol selected:', selectedSymbol?.name);

            // Show notification
            showMessage(`Selected: ${selectedSymbol?.name}`, 'success');
        });
    });

    console.log('[SL] Catalog UI populated');
}

/**
 * Setup OpenLayers vector layer for features
 */
function setupFeaturesLayer() {
    // Create vector source and layer
    featuresSource = new ol.source.Vector({
        features: [],
        wrapX: false
    });

    featuresLayer = new ol.layer.Vector({
        source: featuresSource,
        style: featureStyleFunction,
        zIndex: 1000 // High z-index to render above other layers
    });

    map.addLayer(featuresLayer);
    console.log('Symbols Library: Features layer created');
}

/**
 * Style function for features with caching
 */
const styleCache = new Map();

function featureStyleFunction(feature) {
    const props = feature.getProperties();
    const symbolKey = props.symbol_key;
    const geomType = normalizeGeomType(props.geom_type || props.category);
    const style = props.style || {};

    // Skip features that aren't symbol features (e.g., Graticule grid lines)
    if (!symbolKey) {
        return null;
    }

    // Find symbol in catalog
    const symbol = symbolCatalog.find(s => s.symbol_key === symbolKey);
    if (!symbol) {
        // Only warn once per unknown key to avoid console spam
        if (!featureStyleFunction._warned) featureStyleFunction._warned = new Set();
        if (!featureStyleFunction._warned.has(symbolKey)) {
            console.warn(`[SL] Symbol not found in catalog: "${symbolKey}", using fallback style`);
            featureStyleFunction._warned.add(symbolKey);
        }
        if (geomType === 'Point') {
            return new ol.style.Style({
                image: new ol.style.Circle({
                    radius: 6,
                    fill: new ol.style.Fill({ color: '#ef4444' }),
                    stroke: new ol.style.Stroke({ color: '#fff', width: 2 })
                })
            });
        } else if (geomType === 'LineString') {
            return new ol.style.Style({
                stroke: new ol.style.Stroke({ color: '#3b82f6', width: 3 })
            });
        } else {
            return new ol.style.Style({
                fill: new ol.style.Fill({ color: 'rgba(59, 130, 246, 0.3)' }),
                stroke: new ol.style.Stroke({ color: '#3b82f6', width: 2 })
            });
        }
    }

    // Merge default style with per-feature overrides
    const defaultStyle = symbol.default_style || {};
    const mergedStyle = { ...defaultStyle, ...style };
    const displayName = getFeatureDisplayName(feature, symbol);

    // Create cache key
    const cacheKey = `${symbolKey}-${JSON.stringify(mergedStyle)}-${displayName}`;
    if (styleCache.has(cacheKey)) {
        return styleCache.get(cacheKey);
    }

    let olStyle;

    if (geomType === 'Point') {
        olStyle = createPointStyle(symbol, mergedStyle, props, displayName);
    } else if (geomType === 'LineString') {
        olStyle = createLineStyle(mergedStyle, props, displayName);
    } else if (geomType === 'Polygon') {
        olStyle = createPolygonStyle(mergedStyle, props, displayName);
    }

    styleCache.set(cacheKey, olStyle);
    return olStyle;
}

/**
 * Create style for point features
 */
function createPointStyle(symbol, style, props, displayName = '') {
    const color = style.color || '#000000';
    const size = style.size || 24;
    const opacity = style.opacity !== undefined ? style.opacity : 1.0;

    // Tint SVG icon with color
    let svg = symbol.svg || '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>';
    svg = svg.replace(/currentColor/g, color);

    // Create data URI
    const svgDataUri = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);

    const styles = [
        new ol.style.Style({
            image: new ol.style.Icon({
                src: svgDataUri,
                scale: size / 24, // Normalize to 24px base
                opacity: opacity
            })
        })
    ];

    // Add label (default ON for points)
    if (displayName) {
        styles.push(new ol.style.Style({
            text: new ol.style.Text({
                text: displayName,
                offsetY: size / 2 + 10,
                font: '12px sans-serif',
                fill: new ol.style.Fill({ color: '#000' }),
                stroke: new ol.style.Stroke({ color: '#fff', width: 3 }),
                textAlign: 'center'
            })
        }));
    }

    return styles;
}

function buildLabelTextStyle(text, font = '12px sans-serif') {
    if (!text) return null;
    return new ol.style.Text({
        text: text,
        font: font,
        fill: new ol.style.Fill({ color: '#111827' }),
        stroke: new ol.style.Stroke({ color: '#ffffff', width: 3 })
    });
}

function makeAutoName(symbol, geomType, featureId = null) {
    const baseName = symbol?.name || geomType || 'Feature';
    if (featureId) {
        const suffix = String(featureId).slice(0, 8);
        return `${baseName} ${suffix}`;
    }
    const ts = Date.now().toString().slice(-5);
    return `${baseName} ${ts}`;
}

function getFeatureDisplayName(feature, symbol = null) {
    const rawName = feature.get('name');
    if (rawName && String(rawName).trim() !== '') {
        return String(rawName).trim();
    }
    const geomType = normalizeGeomType(feature.get('geom_type') || feature.get('category') || feature.getGeometry()?.getType());
    return makeAutoName(symbol, geomType, feature.getId());
}

/**
 * Create style for line features
 */
function createLineStyle(style, props, displayName = '') {
    const strokeColor = style.strokeColor || '#000000';
    const strokeWidth = style.strokeWidth || 2;
    const strokeOpacity = style.strokeOpacity !== undefined ? style.strokeOpacity : 1.0;
    const strokeDash = style.strokeDash || null;

    // Convert hex color to rgba
    const rgba = hexToRgba(strokeColor, strokeOpacity);

    const textStyle = buildLabelTextStyle(displayName, '11px sans-serif');
    if (textStyle) {
        textStyle.setPlacement('line');
    }

    return new ol.style.Style({
        stroke: new ol.style.Stroke({
            color: rgba,
            width: strokeWidth,
            lineDash: strokeDash
        }),
        text: textStyle
    });
}

/**
 * Create style for polygon features
 */
function createPolygonStyle(style, props, displayName = '') {
    const fillColor = style.fillColor || '#3b82f6';
    const fillOpacity = style.fillOpacity !== undefined ? style.fillOpacity : 0.4;
    const strokeColor = style.strokeColor || '#1e40af';
    const strokeWidth = style.strokeWidth || 2;
    const strokeOpacity = style.strokeOpacity !== undefined ? style.strokeOpacity : 1.0;

    const fillRgba = hexToRgba(fillColor, fillOpacity);
    const strokeRgba = hexToRgba(strokeColor, strokeOpacity);

    return new ol.style.Style({
        fill: new ol.style.Fill({ color: fillRgba }),
        stroke: new ol.style.Stroke({
            color: strokeRgba,
            width: strokeWidth
        }),
        text: buildLabelTextStyle(displayName, '11px sans-serif')
    });
}

/**
 * Convert hex color to rgba
 */
function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}


/**
 * Setup UI event handlers
 */
function setupUIHandlers() {
    console.log('[SL] setupUIHandlers called');

    // Get reference to the dock
    const dock = document.getElementById('symbolsLibraryDock');
    if (!dock) {
        console.error('[SL] symbolsLibraryDock not found!');
        return;
    }

    // Toggle button to open/close dock
    const toggleBtn = document.getElementById('symbolsLibraryToggleBtn') || document.getElementById('symbolsLibraryBtn');
    console.log('[SL] Toggle button:', toggleBtn ? 'FOUND' : 'NOT FOUND', toggleBtn);
    if (toggleBtn) {
        toggleBtn.onclick = () => {
            console.log('[SL] Toggle button clicked!');
            if (dock) {
                dock.style.display = dock.style.display === 'flex' ? 'none' : 'flex';
                console.log('[SL] Dock display set to:', dock.style.display);
            }
        };
        console.log('[SL] Toggle button click handler attached');
    }

    // Close button in dock header (uses class .dock-close-btn in original HTML)
    const closeDockBtn = dock.querySelector('.dock-close-btn');
    console.log('[SL] Close button:', closeDockBtn ? 'FOUND' : 'NOT FOUND');
    if (closeDockBtn) {
        closeDockBtn.onclick = () => {
            console.log('[SL] Close button clicked!');
            dock.style.display = 'none';
        };
    }

    // Tab switching - use selectors scoped to the dock element
    console.log('[SL] Setting up tab switching...');
    const tabButtons = dock.querySelectorAll('.dock-tab-btn');
    const tabContents = dock.querySelectorAll('.dock-tab-content');

    console.log('[SL] Found tab buttons:', tabButtons.length);
    console.log('[SL] Found tab contents:', tabContents.length);

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-target');
            console.log('[SL] Tab clicked:', targetTab);

            // Remove active class from all tabs and hide all contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => {
                content.classList.remove('active');
                content.style.display = 'none';
            });

            // Add active class to clicked tab and show corresponding content
            button.classList.add('active');
            const targetContent = document.getElementById(`${targetTab}Tab`);
            if (targetContent) {
                targetContent.classList.add('active');
                targetContent.style.display = 'block';
                console.log('[SL] Switched to tab:', targetTab);
            } else {
                console.warn('[SL] Tab content not found:', `${targetTab}Tab`);
            }
        });
    });

    // Load Features button
    const loadFeaturesBtn = document.getElementById('loadFeaturesBtn');
    if (loadFeaturesBtn) {
        loadFeaturesBtn.onclick = loadFeatures;
    }

    // Auto-load toggle
    const autoLoadToggle = document.getElementById('autoLoadToggle');
    if (autoLoadToggle) {
        // Default to collaborative behavior: keep all users' visible features in sync.
        autoLoadToggle.checked = true;
        isAutoLoadEnabled = true;
        enableAutoLoad();

        autoLoadToggle.onchange = (e) => {
            isAutoLoadEnabled = e.target.checked;
            if (isAutoLoadEnabled) {
                enableAutoLoad();
            } else {
                disableAutoLoad();
            }
        };
    }

    // Draw buttons
    const drawPointBtn = document.getElementById('drawPointBtn');
    const drawLineBtn = document.getElementById('drawLineBtn');
    const drawPolygonBtn = document.getElementById('drawPolygonBtn');
    const stopDrawBtn = document.getElementById('stopDrawBtn');
    const snapToggle = document.getElementById('symbolsSnapToPointsToggle');

    if (drawPointBtn) drawPointBtn.onclick = () => startDrawing('Point');
    if (drawLineBtn) drawLineBtn.onclick = () => startDrawing('LineString');
    if (drawPolygonBtn) drawPolygonBtn.onclick = () => startDrawing('Polygon');
    if (stopDrawBtn) stopDrawBtn.onclick = stopDrawing;
    if (snapToggle) {
        snapToggle.onchange = () => {
            if (drawInteraction && snapToggle.checked) {
                enableDrawingSnapping();
            } else if (!snapToggle.checked) {
                clearDrawingSnapping();
            }
        };
    }

    // Modify/Delete buttons
    const modifyBtn = document.getElementById('modifyFeatureBtn');
    const deleteBtn = document.getElementById('deleteFeatureBtn');
    const stopModifyBtn = document.getElementById('stopModifyBtn');

    if (modifyBtn) modifyBtn.onclick = startModify;
    if (deleteBtn) deleteBtn.onclick = startDelete;
    if (stopModifyBtn) stopModifyBtn.onclick = stopModify;

    // Legend export button
    const exportLegendBtn = document.getElementById('exportLegendBtn');
    if (exportLegendBtn) exportLegendBtn.onclick = exportLegend;

    if (map) {
        map.on('moveend', updateLegendSummaryPanel);
    }
    updateLegendSummaryPanel();

    console.log('Symbols Library: UI handlers attached');
}

/**
 * Enable auto-load on map move
 */
function enableAutoLoad() {
    map.on('moveend', handleMapMove);
    console.log('Auto-load enabled');
}

/**
 * Disable auto-load
 */
function disableAutoLoad() {
    map.un('moveend', handleMapMove);
    if (autoLoadTimeout) {
        clearTimeout(autoLoadTimeout);
    }
    console.log('Auto-load disabled');
}

/**
 * Handle map move with debounce
 */
function handleMapMove() {
    if (autoLoadTimeout) {
        clearTimeout(autoLoadTimeout);
    }
    autoLoadTimeout = setTimeout(() => {
        loadFeatures();
    }, 600);
}

/**
 * Load user's features from Supabase
 */
async function loadMyFeatures() {
    if (!supabaseClient || !currentUserId) {
        showMessage('User not authenticated', 'error');
        return;
    }

    try {
        console.log('[SL] Loading features for user:', currentUserId);

        const { data, error } = await supabaseClient
            .from('map_features')
            .select('*')
            .eq('user_id', currentUserId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        console.log(`[SL] Loaded ${data?.length || 0} features for user`);

        // Clear existing user features from map
        const existingFeatures = Array.from(loadedFeatures.values())
            .filter(f => f.get('user_id') === currentUserId);
        existingFeatures.forEach(f => featuresSource.removeFeature(f));

        // Add features to map
        if (data && data.length > 0) {
            const geojson = {
                type: 'FeatureCollection',
                features: data.map(row => ({
                    type: 'Feature',
                    id: row.id,
                    geometry: JSON.parse(row.geom),
                    properties: {
                        user_id: row.user_id,
                        symbol_key: row.symbol_key,
                        geom_type: row.geom_type,
                        name: row.name,
                        description: row.description,
                        status: row.status,
                        style: row.style,
                        metadata: row.metadata,
                        created_at: row.created_at,
                        updated_at: row.updated_at
                    }
                }))
            };

            const features = new ol.format.GeoJSON().readFeatures(geojson, {
                dataProjection: 'EPSG:4326',
                featureProjection: map.getView().getProjection()
            });

            features.forEach(feature => {
                featuresSource.addFeature(feature);
                loadedFeatures.set(feature.getId(), feature);
            });
        }

        updateMyFeaturesTab();
        updateLegendSummaryPanel();
        showMessage(`Loaded ${data?.length || 0} features`, 'success');

    } catch (error) {
        console.error('[SL] Error loading my features:', error);
        showMessage('Failed to load features', 'error');
    }
}

/**
 * Zoom map to feature extent
 */
function zoomToFeature(featureId) {
    const feature = loadedFeatures.get(featureId);
    if (!feature) {
        console.warn('[SL] Feature not found:', featureId);
        return;
    }

    const geometry = feature.getGeometry();
    const extent = geometry.getExtent();

    // Add padding around extent
    const padding = [50, 50, 50, 50];
    map.getView().fit(extent, {
        padding: padding,
        duration: 500,
        maxZoom: 18
    });

    // Temporarily highlight the feature
    highlightFeature(feature);

    console.log('[SL] Zoomed to feature:', featureId);
}

/**
 * Temporarily highlight a feature
 */
function highlightFeature(feature) {
    const geomType = feature.get('geom_type');

    // Create highlight style
    let highlightStyle;
    if (geomType === 'Point') {
        highlightStyle = new ol.style.Style({
            image: new ol.style.Circle({
                radius: 12,
                fill: new ol.style.Fill({ color: 'rgba(59, 130, 246, 0.3)' }),
                stroke: new ol.style.Stroke({ color: '#3b82f6', width: 3 })
            })
        });
    } else if (geomType === 'LineString') {
        highlightStyle = new ol.style.Style({
            stroke: new ol.style.Stroke({
                color: '#3b82f6',
                width: 5,
                lineCap: 'round'
            })
        });
    } else if (geomType === 'Polygon') {
        highlightStyle = new ol.style.Style({
            fill: new ol.style.Fill({ color: 'rgba(59, 130, 246, 0.2)' }),
            stroke: new ol.style.Stroke({ color: '#3b82f6', width: 3 })
        });
    }

    // Store original style
    const originalStyle = feature.getStyle();

    // Apply highlight
    feature.setStyle(highlightStyle);

    // Restore original after 2 seconds
    setTimeout(() => {
        feature.setStyle(originalStyle);
    }, 2000);
}

/**
 * Update My Features tab
 */
function updateMyFeaturesTab() {
    const myFeaturesTab = document.getElementById('myfeaturesTab');
    if (!myFeaturesTab) return;

    const myFeatures = Array.from(loadedFeatures.values())
        .filter(f => f.get('user_id') === currentUserId)
        .sort((a, b) => {
            const dateA = new Date(a.get('created_at'));
            const dateB = new Date(b.get('created_at'));
            return dateB - dateA; // Most recent first
        });

    let html = '<div style="padding: 15px;">';

    // Header with Load button
    html += `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
            <h4 style="margin: 0;">My Features (${myFeatures.length})</h4>
            <button id="loadMyFeaturesBtn" class="action-btn" style="padding: 8px 12px; font-size: 12px;">
                <i class="fas fa-sync-alt"></i> Load Visible (All Users)
            </button>
        </div>
        <p style="margin: 0 0 12px 0; font-size: 11px; color: #6b7280;">
            Map loads features from all users in current extent; this list shows only your own features.
        </p>
    `;

    if (myFeatures.length === 0) {
        html += '<p style="color: #6b7280; text-align: center; padding: 20px;">No features yet. Use the Draw tab to create features.</p>';
    } else {
        html += '<div class="features-list" style="max-height: 400px; overflow-y: auto;">';

        myFeatures.forEach(feature => {
            const id = feature.getId();
            const symbolKey = feature.get('symbol_key');
            const symbol = symbolCatalog.find(s => s.symbol_key === symbolKey);
            const name = getFeatureDisplayName(feature, symbol);
            const geomType = feature.get('geom_type');
            const createdAt = new Date(feature.get('created_at')).toLocaleDateString();

            // Icon based on geometry type
            let icon = '📍';
            if (geomType === 'LineString') icon = '🛣️';
            if (geomType === 'Polygon') icon = '🟩';

            html += `
                <div class="feature-item" data-feature-id="${id}" style="
                    padding: 12px;
                    border: 1px solid #e5e7eb;
                    border-radius: 6px;
                    margin-bottom: 8px;
                    cursor: pointer;
                    transition: all 0.2s;
                    background: #f9fafb;
                ">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div style="font-size: 24px;">${icon}</div>
                        <div style="flex: 1;">
                            <div style="font-weight: 600; color: #1f2937; margin-bottom: 2px;">
                                ${name}
                            </div>
                            <div style="font-size: 11px; color: #6b7280;">
                                ${symbol?.name || symbolKey} • ${createdAt}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });

        html += '</div>';
    }

    html += '</div>';
    myFeaturesTab.innerHTML = html;

    // Add click handlers for feature items
    const featureItems = myFeaturesTab.querySelectorAll('.feature-item');
    featureItems.forEach(item => {
        item.addEventListener('click', () => {
            const featureId = item.dataset.featureId;
            zoomToFeature(featureId);
        });

        // Hover effect
        item.addEventListener('mouseenter', () => {
            item.style.background = '#eff6ff';
            item.style.borderColor = '#3b82f6';
        });
        item.addEventListener('mouseleave', () => {
            item.style.background = '#f9fafb';
            item.style.borderColor = '#e5e7eb';
        });
    });

    // Add Load button handler (collaborative extent load)
    const loadBtn = document.getElementById('loadMyFeaturesBtn');
    if (loadBtn) {
        loadBtn.onclick = loadFeatures;
    }
}

// ====================================
// STEP 9: MODIFY & DELETE FEATURES
// ====================================

let editMode = null; // 'modify' or 'delete'
let selectedFeatureForEdit = null;

/**
 * Start modify mode - allow users to edit their own features
 */
function startModify() {
    console.log('[SL] Starting modify mode');

    // Stop drawing if active
    if (drawInteraction) {
        clearDrawingSnapping();
        map.removeInteraction(drawInteraction);
        drawInteraction = null;
    }

    // Remove existing interactions
    if (selectInteraction) map.removeInteraction(selectInteraction);
    if (modifyInteraction) map.removeInteraction(modifyInteraction);

    // Create Select interaction
    selectInteraction = new ol.interaction.Select({
        layers: [featuresLayer],
        style: new ol.style.Style({
            image: new ol.style.Circle({
                radius: 8,
                fill: new ol.style.Fill({ color: 'rgba(59, 130, 246, 0.3)' }),
                stroke: new ol.style.Stroke({ color: '#3b82f6', width: 3 })
            }),
            stroke: new ol.style.Stroke({ color: '#3b82f6', width: 3 }),
            fill: new ol.style.Fill({ color: 'rgba(59, 130, 246, 0.2)' })
        })
    });

    selectInteraction.on('select', (event) => {
        if (event.selected.length > 0) {
            handleFeatureSelect(event.selected[0]);
        }
    });

    map.addInteraction(selectInteraction);

    // Create Modify interaction for geometry editing
    modifyInteraction = new ol.interaction.Modify({
        features: selectInteraction.getFeatures()
    });

    modifyInteraction.on('modifyend', (event) => {
        const feature = event.features.getArray()[0];
        if (feature) {
            updateFeatureGeometryConfirm(feature);
        }
    });

    map.addInteraction(modifyInteraction);

    editMode = 'modify';
    showMessage('Modify mode active. Click a feature to select it.', 'info');
}

/**
 * Stop modify mode
 */
function stopModify() {
    if (selectInteraction) {
        map.removeInteraction(selectInteraction);
        selectInteraction = null;
    }
    if (modifyInteraction) {
        map.removeInteraction(modifyInteraction);
        modifyInteraction = null;
    }
    editMode = null;
    selectedFeatureForEdit = null;

    // Hide edit form if shown
    const editForm = document.getElementById('editFeatureForm');
    if (editForm) editForm.style.display = 'none';

    console.log('[SL] Modify mode stopped');
    showMessage('Modify mode stopped', 'info');
}

/**
 * Handle feature selection - check ownership and show edit form
 */
function handleFeatureSelect(feature) {
    const featureUserId = feature.get('user_id');

    if (featureUserId !== currentUserId) {
        showMessage('You can only edit your own features', 'warning');
        // Deselect
        if (selectInteraction) {
            selectInteraction.getFeatures().clear();
        }
        return;
    }

    selectedFeatureForEdit = feature;
    console.log('[SL] Feature selected for edit:', feature.getId());

    if (editMode === 'modify') {
        showEditForm(feature);
    } else if (editMode === 'delete') {
        deleteFeatureConfirm(feature);
    }
}

/**
 * Show edit form for feature attributes
 */
function showEditForm(feature) {
    const name = feature.get('name') || '';
    const description = feature.get('description') || '';
    const status = feature.get('status') || 'existing';

    // Create or update edit form
    let editForm = document.getElementById('editFeatureForm');
    if (!editForm) {
        editForm = document.createElement('div');
        editForm.id = 'editFeatureForm';
        editForm.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            z-index: 10000;
            width: 350px;
        `;
        document.body.appendChild(editForm);
    }

    editForm.innerHTML = `
        <h4 style="margin: 0 0 15px 0;">Edit Feature</h4>
        <div style="margin-bottom: 12px;">
            <label style="display: block; font-weight: 600; margin-bottom: 4px;">Name:</label>
            <input type="text" id="editFeatureName" value="${name}" 
                style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;" />
        </div>
        <div style="margin-bottom: 12px;">
            <label style="display: block; font-weight: 600; margin-bottom: 4px;">Description:</label>
            <textarea id="editFeatureDesc" rows="3"
                style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">${description}</textarea>
        </div>
        <div style="margin-bottom: 15px;">
            <label style="display: block; font-weight: 600; margin-bottom: 4px;">Status:</label>
            <select id="editFeatureStatus"
                style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
                <option value="existing" ${status === 'existing' ? 'selected' : ''}>Existing</option>
                <option value="proposed" ${status === 'proposed' ? 'selected' : ''}>Proposed</option>
                <option value="under_construction" ${status === 'under_construction' ? 'selected' : ''}>Under Construction</option>
                <option value="demolished" ${status === 'demolished' ? 'selected' : ''}>Demolished</option>
            </select>
        </div>
        <div style="display: flex; gap: 10px;">
            <button id="saveFeatureEditsBtn" class="action-btn" style="flex: 1;">
                <i class="fas fa-save"></i> Save
            </button>
            <button id="cancelFeatureEditsBtn" class="action-btn" style="flex: 1; background: #6b7280;">
                Cancel
            </button>
        </div>
    `;

    editForm.style.display = 'block';

    // Add event listeners
    document.getElementById('saveFeatureEditsBtn').onclick = () => {
        updateFeatureAttributes(feature);
    };

    document.getElementById('cancelFeatureEditsBtn').onclick = () => {
        editForm.style.display = 'none';
        stopModify();
    };
}

/**
 * Update feature attributes (name, description, status)
 */
async function updateFeatureAttributes(feature) {
    const inputName = document.getElementById('editFeatureName').value;
    const symbol = symbolCatalog.find(s => s.symbol_key === feature.get('symbol_key')) || null;
    const name = String(inputName || '').trim() || makeAutoName(symbol, feature.get('geom_type'), feature.getId());
    const description = document.getElementById('editFeatureDesc').value;
    const status = document.getElementById('editFeatureStatus').value;

    try {
        const { error } = await supabaseClient
            .rpc('update_map_feature', {
                feature_id: feature.getId(),
                name: name || null,
                description: description || null,
                status: status
            });

        if (error) throw error;

        // Update local feature
        feature.set('name', name);
        feature.set('description', description);
        feature.set('status', status);
        feature.set('updated_at', new Date().toISOString());

        console.log('[SL] Feature attributes updated:', feature.getId());
        showMessage('Feature updated successfully', 'success');

        document.getElementById('editFeatureForm').style.display = 'none';
        updateMyFeaturesTab();

    } catch (error) {
        console.error('[SL] Error updating feature:', error);
        showMessage('Failed to update feature', 'error');
    }
}

/**
 * Update feature geometry after modification
 */
async function updateFeatureGeometryConfirm(feature) {
    if (feature.get('user_id') !== currentUserId) {
        showMessage('You can only modify your own features', 'warning');
        return;
    }

    try {
        const geometry = feature.getGeometry();
        const geojson = new ol.format.GeoJSON().writeGeometryObject(geometry, {
            dataProjection: 'EPSG:4326',
            featureProjection: map.getView().getProjection()
        });

        const { error } = await supabaseClient
            .rpc('update_map_feature', {
                feature_id: feature.getId(),
                geom_geojson: geojson
            });

        if (error) throw error;

        console.log('[SL] Feature geometry updated:', feature.getId());
        showMessage('Geometry updated successfully', 'success');

    } catch (error) {
        console.error('[SL] Error updating geometry:', error);
        showMessage('Failed to update geometry', 'error');
    }
}

/**
 * Start delete mode
 */
function startDelete() {
    console.log('[SL] Starting delete mode');

    // Stop drawing if active
    if (drawInteraction) {
        clearDrawingSnapping();
        map.removeInteraction(drawInteraction);
        drawInteraction = null;
    }

    // Remove existing interactions
    if (selectInteraction) map.removeInteraction(selectInteraction);
    if (modifyInteraction) map.removeInteraction(modifyInteraction);

    // Create Select interaction
    selectInteraction = new ol.interaction.Select({
        layers: [featuresLayer],
        style: new ol.style.Style({
            image: new ol.style.Circle({
                radius: 8,
                fill: new ol.style.Fill({ color: 'rgba(220, 38, 38, 0.3)' }),
                stroke: new ol.style.Stroke({ color: '#dc2626', width: 3 })
            }),
            stroke: new ol.style.Stroke({ color: '#dc2626', width: 3 }),
            fill: new ol.style.Fill({ color: 'rgba(220, 38, 38, 0.2)' })
        })
    });

    selectInteraction.on('select', (event) => {
        if (event.selected.length > 0) {
            handleFeatureSelect(event.selected[0]);
        }
    });

    map.addInteraction(selectInteraction);
    editMode = 'delete';
    showMessage('Delete mode active. Click a feature to delete it.', 'warning');
}

/**
 * Confirm and delete feature
 */
function deleteFeatureConfirm(feature) {
    const name = feature.get('name') || 'this feature';

    if (!confirm(`Are you sure you want to delete "${name}"?`)) {
        // Deselect
        if (selectInteraction) {
            selectInteraction.getFeatures().clear();
        }
        return;
    }

    deleteFeature(feature);
}

/**
 * Delete feature from database and map
 */
async function deleteFeature(feature) {
    const featureId = feature.getId();

    try {
        const { error } = await supabaseClient
            .from('map_features')
            .delete()
            .eq('id', featureId);

        if (error) throw error;

        // Remove from map
        featuresSource.removeFeature(feature);
        loadedFeatures.delete(featureId);

        console.log('[SL] Feature deleted:', featureId);
        showMessage('Feature deleted successfully', 'success');
        updateMyFeaturesTab();

        // Deselect
        if (selectInteraction) {
            selectInteraction.getFeatures().clear();
        }

    } catch (error) {
        console.error('[SL] Error deleting feature:', error);
        showMessage('Failed to delete feature', 'error');
    }
}

async function loadFeatures() {
    if (!map || !supabaseClient) {
        console.warn('[SL] Cannot load features: map or supabase not initialized');
        return;
    }

    try {
        console.log('[SL] Loading features...');

        // Get map extent and transform to EPSG:4326
        const extent = map.getView().calculateExtent(map.getSize());
        const [minX, minY, maxX, maxY] = ol.proj.transformExtent(extent, map.getView().getProjection(), 'EPSG:4326');

        // Expand bbox by 20% buffer
        const bufferX = (maxX - minX) * 0.2;
        const bufferY = (maxY - minY) * 0.2;

        const { data, error } = await supabaseClient.rpc('get_features_bbox', {
            min_lon: minX - bufferX,
            min_lat: minY - bufferY,
            max_lon: maxX + bufferX,
            max_lat: maxY + bufferY,
            lim: 500
        });

        if (error) throw error;

        console.log(`[SL] Loaded ${data?.features?.length || 0} features`);

        if (data && data.features) {
            const format = new ol.format.GeoJSON();
            const features = format.readFeatures(data, {
                dataProjection: 'EPSG:4326',
                featureProjection: map.getView().getProjection()
            });

            // Upsert features (update existing, add new)
            features.forEach(feature => {
                const id = feature.get('id');
                if (loadedFeatures.has(id)) {
                    // Update existing
                    const existing = loadedFeatures.get(id);
                    existing.setGeometry(feature.getGeometry());
                    existing.setProperties(feature.getProperties());
                } else {
                    // Add new
                    featuresSource.addFeature(feature);
                    loadedFeatures.set(id, feature);
                }
            });
        }

        updateLegendSummaryPanel();
        showMessage(`Loaded ${data?.features?.length || 0} visible features (all users)`, 'success');
    } catch (error) {
        console.error('[SL] Failed to load features:', error);
        showMessage(`Error loading features: ${error.message}`, 'error');
    }
}

/**
 * Start drawing interaction
 */
function startDrawing(geomType) {
    if (!selectedSymbol) {
        // Auto-select first matching symbol from catalog (normalize case for comparison)
        selectedSymbol = symbolCatalog.find(s => normalizeGeomType(s.geom_type) === geomType);
        if (!selectedSymbol) {
            showMessage('No symbols available for this geometry type. Please select from Catalog first.', 'warning');
            console.warn('[SL] No symbol found for geomType:', geomType);
            return;
        }
        console.log('[SL] Auto-selected symbol:', selectedSymbol.name, '(' + selectedSymbol.symbol_key + ')');
        showMessage(`Using: ${selectedSymbol.name}. You can pick a different one from Catalog.`, 'info');
    }

    console.log('[SL] Starting drawing:', geomType, 'with symbol:', selectedSymbol.name);

    // Remove existing interaction
    if (drawInteraction) {
        clearDrawingSnapping();
        map.removeInteraction(drawInteraction);
    }

    // Create new draw interaction
    drawInteraction = new ol.interaction.Draw({
        source: featuresSource,
        type: geomType
    });

    drawInteraction.on('drawend', handleDrawEnd);
    map.addInteraction(drawInteraction);
    enableDrawingSnapping();

    showMessage(`Drawing ${geomType}... Click on map to draw`, 'info');
}

/**
 * Stop drawing interaction
 */
function stopDrawing() {
    clearDrawingSnapping();
    if (drawInteraction) {
        map.removeInteraction(drawInteraction);
        drawInteraction = null;
        console.log('[SL] Drawing stopped');
        showMessage('Drawing stopped', 'info');
    }
}

/**
 * Handle draw end event
 */
function handleDrawEnd(event) {
    const feature = event.feature;
    const geometry = feature.getGeometry();

    console.log('[SL] Draw completed');

    // Remove the temporary feature (we'll add it after saving)
    featuresSource.removeFeature(feature);

    // Prompt user for feature attributes
    const inputName = prompt(`Name for this ${selectedSymbol.name}:`, `New ${selectedSymbol.name}`);
    if (inputName === null) {
        showMessage('Feature creation cancelled', 'info');
        return;
    }
    const name = String(inputName).trim() || makeAutoName(selectedSymbol, selectedSymbol.geom_type);

    const description = prompt('Description (optional):', '');

    // Save feature
    saveFeature(geometry, {
        name: name,
        description: description || null,
        symbol_key: selectedSymbol.symbol_key,
        geom_type: selectedSymbol.geom_type,
        status: 'existing',
        style: selectedSymbol.default_style || {}
    });
}

function clearDrawingSnapping() {
    snapInteractions.forEach(interaction => {
        if (interaction && map) {
            map.removeInteraction(interaction);
        }
    });
    snapInteractions = [];
}

function isVectorSourceWithPointFeatures(source) {
    if (!source || !(source instanceof ol.source.Vector)) return false;
    const features = source.getFeatures();
    if (!Array.isArray(features) || features.length === 0) return false;

    const sample = features.slice(0, 50);
    return sample.some(feature => {
        const geometry = feature.getGeometry && feature.getGeometry();
        if (!geometry || !geometry.getType) return false;
        const type = geometry.getType();
        return type === 'Point' || type === 'MultiPoint';
    });
}

function collectPointSnapSources() {
    const discovered = new Set();
    const candidates = [];

    const addSource = (source) => {
        if (!source || source === featuresSource || discovered.has(source)) return;
        if (isVectorSourceWithPointFeatures(source)) {
            discovered.add(source);
            candidates.push(source);
        }
    };

    // Known global point sources from CSV/control-point workflows
    addSource(window.csvPointsSource);
    addSource(window.controlPointsSource);

    const pushLayerSource = (layer) => {
        if (!layer || typeof layer.getVisible !== 'function' || !layer.getVisible()) return;

        if (typeof layer.getLayers === 'function') {
            layer.getLayers().forEach(pushLayerSource);
            return;
        }

        if (!layer.getSource || typeof layer.getSource !== 'function') return;
        const source = layer.getSource();
        if (!source) return;

        const title = typeof layer.get === 'function' ? (layer.get('title') || '') : '';
        const titleLooksLikePointRef = /csv|control point|reference point|survey point|polygon points/i.test(String(title));
        if (titleLooksLikePointRef || isVectorSourceWithPointFeatures(source)) {
            addSource(source);
        }
    };

    if (map && map.getLayers) {
        map.getLayers().forEach(pushLayerSource);
    }

    return candidates;
}

function enableDrawingSnapping() {
    clearDrawingSnapping();
    if (!map || !drawInteraction) return;

    const snapToggle = document.getElementById('symbolsSnapToPointsToggle');
    if (snapToggle && !snapToggle.checked) return;

    const snapSources = collectPointSnapSources();
    if (snapSources.length === 0) {
        console.log('[SL] No point sources found for snapping');
        return;
    }

    snapSources.forEach(source => {
        const interaction = new ol.interaction.Snap({
            source,
            pixelTolerance: 12,
            vertex: true,
            edge: false
        });
        map.addInteraction(interaction);
        snapInteractions.push(interaction);
    });

    console.log('[SL] Snapping enabled for drawing with sources:', snapSources.length);
}

/**
 * Save feature to Supabase
 */
async function saveFeature(geometry, attributes) {
    try {
        console.log('[SL] Saving feature...', attributes);

        // Transform geometry to EPSG:4326
        const geom4326 = geometry.clone().transform(
            map.getView().getProjection(),
            'EPSG:4326'
        );

        // Convert to GeoJSON
        const format = new ol.format.GeoJSON();
        const geojson = format.writeGeometryObject(geom4326);

        // Call Supabase RPC
        const { data, error } = await supabaseClient.rpc('insert_map_feature', {
            geom_geojson: geojson,
            geom_type: attributes.geom_type,
            symbol_key: attributes.symbol_key,
            name: attributes.name,
            description: attributes.description,
            status: attributes.status,
            style: attributes.style
        });

        if (error) throw error;

        console.log('[SL] Feature saved:', data);
        showMessage(`${attributes.name} saved successfully!`, 'success');

        // Reload features to show the new one
        await loadFeatures();

    } catch (error) {
        console.error('[SL] Failed to save feature:', error);
        showMessage(`Error saving feature: ${error.message}`, 'error');
    }
}

/**
 * Show notification message to user
 */
function showMessage(message, type = 'info') {
    // Try to use existing toast notification system
    const toastDiv = document.getElementById('toastMessage');
    if (toastDiv) {
        toastDiv.textContent = message;
        toastDiv.className = `toast-message ${type}`;
        toastDiv.style.display = 'block';
        setTimeout(() => {
            toastDiv.style.display = 'none';
        }, 3000);
    } else {
        // Fallback to console if toast not available
        console.log(`[SL] ${type.toUpperCase()}: ${message}`);
    }
}

function getCurrentMapExtent() {
    if (!map || !map.getView || !map.getSize) return null;
    const size = map.getSize();
    if (!size) return null;
    return map.getView().calculateExtent(size);
}

function getLegendFeatures(options = {}) {
    const { extent = null } = options;
    if (!featuresSource) return [];
    const candidates = extent ? featuresSource.getFeaturesInExtent(extent) : featuresSource.getFeatures();
    return candidates.filter(feature => feature && feature.get('symbol_key'));
}

function getLegendEntries(options = {}) {
    const features = getLegendFeatures(options);
    const grouped = new Map();

    features.forEach(feature => {
        const symbolKey = feature.get('symbol_key');
        const symbol = symbolCatalog.find(s => s.symbol_key === symbolKey) || null;
        const geomType = normalizeGeomType(feature.get('geom_type') || symbol?.geom_type || feature.getGeometry()?.getType());
        const status = feature.get('status') || 'existing';
        const mergedStyle = { ...(symbol?.default_style || {}), ...(feature.get('style') || {}) };

        if (!grouped.has(symbolKey)) {
            grouped.set(symbolKey, {
                symbolKey,
                symbolName: symbol?.name || symbolKey,
                geomType,
                symbol,
                style: mergedStyle,
                count: 0,
                statusCounts: {}
            });
        }

        const entry = grouped.get(symbolKey);
        entry.count += 1;
        entry.statusCounts[status] = (entry.statusCounts[status] || 0) + 1;
    });

    const geomSort = { Point: 1, LineString: 2, Polygon: 3 };
    return Array.from(grouped.values()).sort((a, b) => {
        const typeDelta = (geomSort[a.geomType] || 99) - (geomSort[b.geomType] || 99);
        if (typeDelta !== 0) return typeDelta;
        return a.symbolName.localeCompare(b.symbolName);
    });
}

function makeLegendSwatchHtml(entry) {
    const style = entry.style || {};
    const symbol = entry.symbol || {};

    if (entry.geomType === 'Point') {
        let svg = symbol.svg || '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/></svg>';
        svg = svg.replace(/currentColor/g, style.color || '#111827');
        return `<span style="display:inline-flex; width:20px; height:20px; align-items:center; justify-content:center;">${svg}</span>`;
    }

    if (entry.geomType === 'LineString') {
        const stroke = style.strokeColor || '#1f2937';
        return `<svg width="22" height="14" viewBox="0 0 22 14" aria-hidden="true"><line x1="1" y1="7" x2="21" y2="7" stroke="${stroke}" stroke-width="3"/></svg>`;
    }

    const fill = style.fillColor || '#93c5fd';
    const stroke = style.strokeColor || '#1e3a8a';
    return `<svg width="22" height="14" viewBox="0 0 22 14" aria-hidden="true"><rect x="1" y="1" width="20" height="12" fill="${fill}" fill-opacity="0.6" stroke="${stroke}" stroke-width="1.5"/></svg>`;
}

function updateLegendSummaryPanel() {
    const legendTab = document.getElementById('legendTab');
    if (!legendTab) return;

    const panel = legendTab.querySelector('div');
    if (!panel) return;

    let summary = document.getElementById('legendSummaryBox');
    if (!summary) {
        summary = document.createElement('div');
        summary.id = 'legendSummaryBox';
        summary.style.marginTop = '12px';
        panel.appendChild(summary);
    }

    const extent = getCurrentMapExtent();
    const entries = getLegendEntries({ extent });
    const featureCount = entries.reduce((acc, item) => acc + item.count, 0);

    if (entries.length === 0) {
        summary.innerHTML = `
            <div style="padding:10px; border:1px solid #e5e7eb; border-radius:8px; background:#f9fafb; color:#6b7280;">
                No symbolized features in current view. Load features or draw new ones.
            </div>
        `;
        return;
    }

    const rows = entries.map(entry => {
        return `
            <div style="display:flex; align-items:center; justify-content:space-between; gap:8px; padding:6px 0; border-bottom:1px solid #f1f5f9;">
                <div style="display:flex; align-items:center; gap:8px;">
                    ${makeLegendSwatchHtml(entry)}
                    <span style="font-size:12px; color:#1f2937;">${entry.symbolName}</span>
                </div>
                <span style="font-size:12px; color:#374151; font-weight:600;">${entry.count}</span>
            </div>
        `;
    }).join('');

    summary.innerHTML = `
        <div style="padding:10px; border:1px solid #e5e7eb; border-radius:8px; background:#fff;">
            <div style="font-size:12px; color:#374151; margin-bottom:8px; font-weight:600;">
                Automated legend (current map extent): ${featureCount} features, ${entries.length} symbol types
            </div>
            <div>${rows}</div>
        </div>
    `;
}

function hexToRgbObject(hex, fallback) {
    if (typeof hex !== 'string' || !hex.startsWith('#') || (hex.length !== 7 && hex.length !== 4)) {
        return fallback;
    }
    if (hex.length === 4) {
        return {
            r: parseInt(hex[1] + hex[1], 16),
            g: parseInt(hex[2] + hex[2], 16),
            b: parseInt(hex[3] + hex[3], 16)
        };
    }
    return {
        r: parseInt(hex.slice(1, 3), 16),
        g: parseInt(hex.slice(3, 5), 16),
        b: parseInt(hex.slice(5, 7), 16)
    };
}

function drawLegendSwatchInPdf(doc, entry, x, y) {
    const style = entry.style || {};
    if (entry.geomType === 'Point') {
        const fill = hexToRgbObject(style.color || '#2563eb', { r: 37, g: 99, b: 235 });
        doc.setDrawColor(255, 255, 255);
        doc.setFillColor(fill.r, fill.g, fill.b);
        doc.circle(x + 3, y - 1, 2.5, 'FD');
        return;
    }
    if (entry.geomType === 'LineString') {
        const stroke = hexToRgbObject(style.strokeColor || '#1f2937', { r: 31, g: 41, b: 55 });
        doc.setDrawColor(stroke.r, stroke.g, stroke.b);
        doc.setLineWidth(0.8);
        doc.line(x, y - 1, x + 8, y - 1);
        return;
    }
    const fill = hexToRgbObject(style.fillColor || '#93c5fd', { r: 147, g: 197, b: 253 });
    const stroke = hexToRgbObject(style.strokeColor || '#1e3a8a', { r: 30, g: 58, b: 138 });
    doc.setDrawColor(stroke.r, stroke.g, stroke.b);
    doc.setFillColor(fill.r, fill.g, fill.b);
    doc.rect(x, y - 3.5, 8, 5, 'FD');
}

function getSymbolsLegendForPrint(options = {}) {
    const extent = options.extent || getCurrentMapExtent();
    const entries = getLegendEntries({ extent });
    const totalFeatures = entries.reduce((acc, item) => acc + item.count, 0);

    if (!entries.length) {
        return { html: '', entries: [], totalFeatures: 0 };
    }

    const rows = entries.map(entry => {
        return `
            <div style="display:flex; align-items:center; justify-content:space-between; gap:8px; padding:5px 0; border-bottom:1px solid #e5e7eb;">
                <div style="display:flex; align-items:center; gap:8px;">
                    ${makeLegendSwatchHtml(entry)}
                    <span>${entry.symbolName}</span>
                </div>
                <span style="font-weight:600;">${entry.count}</span>
            </div>
        `;
    }).join('');

    const html = `
        <div class="print-symbols-legend" style="border:2px solid #000; padding:10px; margin-top:10px; background:#fff;">
            <div style="font-weight:700; font-size:12px; margin-bottom:6px;">Automated Symbols Legend (Visible Extent)</div>
            <div style="font-size:10px; color:#374151; margin-bottom:6px;">
                ${totalFeatures} features • ${entries.length} symbol types • ${new Date().toLocaleString()}
            </div>
            <div style="font-size:10px; color:#111827;">
                ${rows}
            </div>
        </div>
    `;

    return { html, entries, totalFeatures };
}

// ====================================
// STEP 10: FLAGGING SYSTEM
// ====================================

/**
 * Show flag dialog (simplified - using browser prompt/confirm for now)
 * In production, would create a proper modal
 */
function flagSelectedFeature() {
    if (!selectedFeatureForEdit) {
        showMessage('Please select a feature to flag by clicking it', 'warning');
        return;
    }

    const featureUserId = selectedFeatureForEdit.get('user_id');

    if (featureUserId === currentUserId) {
        showMessage('You cannot flag your own features', 'warning');
        return;
    }

    const reasons = ['wrong_location', 'wrong_type', 'duplicate', 'outdated', 'needs_review', 'other'];
    const reasonText = prompt(`Select reason to flag:
1 - Wrong Location
2 - Wrong Type
3 - Duplicate
4 - Outdated
5 - Needs Review
6 - Other

Enter number (1-6):`);

    if (!reasonText) return; // Canceled

    const reasonIndex = parseInt(reasonText) - 1;
    if (reasonIndex < 0 || reasonIndex >= reasons.length) {
        showMessage('Invalid reason selection', 'error');
        return;
    }

    const reason = reasons[reasonIndex];
    const comment = prompt('Additional comment (optional):');

    submitFlag(selectedFeatureForEdit.getId(), reason, comment || '');
}

/**
 * Submit flag to database
 */
async function submitFlag(featureId, reason, comment) {
    try {
        const { error } = await supabaseClient
            .from('feature_flags')
            .insert({
                feature_id: featureId,
                flagged_by: currentUserId,
                reason: reason,
                comment: comment,
                status: 'open'
            });

        if (error) throw error;

        console.log('[SL] Flag submitted for feature:', featureId);
        showMessage('Feature flagged successfully', 'success');

        // Refresh flags tab
        updateFlagsTab();

    } catch (error) {
        console.error('[SL] Error submitting flag:', error);
        showMessage('Failed to submit flag', 'error');
    }
}

/**
 * Update Flags tab
 */
async function updateFlagsTab() {
    const flagsTab = document.getElementById('flagsTab');
    if (!flagsTab) return;

    let html = '<div style="padding: 15px;">';
    html += '<h4 style="margin: 0 0 15px 0;">My Flags</h4>';

    try {
        const { data, error } = await supabaseClient
            .from('feature_flags')
            .select('*, map_features(name, symbol_key)')
            .eq('flagged_by', currentUserId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (!data || data.length === 0) {
            html += '<p style="color: #6b7280; text-align: center; padding: 20px;">No flags yet.</p>';
        } else {
            html += '<div class="flags-list" style="max-height: 400px; overflow-y: auto;">';

            data.forEach(flag => {
                const statusColor = flag.status === 'open' ? '#f59e0b' :
                    flag.status === 'resolved' ? '#22c55e' : '#6b7280';
                const reasonText = flag.reason.replace(/_/g, ' ').toUpperCase();
                const date = new Date(flag.created_at).toLocaleDateString();

                html += `
                    <div style="
                        padding: 12px;
                        border: 1px solid #e5e7eb;
                        border-radius: 6px;
                        margin-bottom: 8px;
                        background: #f9fafb;
                    ">
                        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 6px;">
                            <strong style="color: #1f2937;">${flag.map_features?.name || 'Unknown Feature'}</strong>
                            <span style="
                                background: ${statusColor};
                                color: white;
                                padding: 2px 8px;
                                border-radius: 4px;
                                font-size: 10px;
                                font-weight: 600;
                            ">${flag.status.toUpperCase()}</span>
                        </div>
                        <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">
                            <strong>Reason:</strong> ${reasonText}
                        </div>
                        ${flag.comment ? `<div style="font-size: 11px; color: #6b7280; margin-bottom: 4px;">${flag.comment}</div>` : ''}
                        <div style="font-size: 10px; color: #9ca3af;">${date}</div>
                    </div>
                `;
            });

            html += '</div>';
        }

    } catch (error) {
        console.error('[SL] Error loading flags:', error);
        html += '<p style="color: #dc2626;">Failed to load flags</p>';
    }

    html += '</div>';
    flagsTab.innerHTML = html;
}

// ====================================
// STEP 11: LEGEND PDF EXPORT
// ====================================

/**
 * Export legend as PDF
 */
async function exportLegend() {
    const JsPdfCtor = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF;

    // Check for jsPDF library
    if (!JsPdfCtor) {
        showMessage('PDF library not available. Legend export disabled.', 'error');
        console.warn('[SL] jsPDF library not found');
        return;
    }

    try {
        const extent = getCurrentMapExtent();
        const entries = getLegendEntries({ extent });
        const totalFeatures = entries.reduce((acc, item) => acc + item.count, 0);

        if (entries.length === 0) {
            showMessage('No symbolized features in current map extent', 'warning');
            return;
        }

        // Create PDF
        const doc = new JsPdfCtor();
        doc.setFontSize(16);
        doc.text('Symbols Legend (Visible Extent)', 20, 20);

        doc.setFontSize(10);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 30);
        doc.text(`Total Features: ${totalFeatures}`, 20, 36);
        doc.text(`Symbol Types: ${entries.length}`, 20, 42);

        let y = 52;

        // Add each symbol with swatch
        entries.forEach(entry => {
            // Check page break
            if (y > 275) {
                doc.addPage();
                y = 20;
            }

            drawLegendSwatchInPdf(doc, entry, 22, y);
            doc.setFontSize(11);
            doc.setTextColor(0);
            doc.text(entry.symbolName, 34, y);
            doc.setFontSize(9);
            doc.setTextColor(100);
            doc.text(`${entry.count} feature${entry.count > 1 ? 's' : ''} • ${entry.geomType}`, 34, y + 4.5);
            doc.setTextColor(0);

            y += 11;
        });

        // Download PDF
        const filename = `symbols_legend_${new Date().getTime()}.pdf`;
        doc.save(filename);

        console.log('[SL] Legend PDF exported:', filename);
        showMessage('Legend exported successfully', 'success');

    } catch (error) {
        console.error('[SL] Error exporting legend:', error);
        showMessage('Failed to export legend', 'error');
    }
}

// Export initialization function (now accessible globally via window)
window.initSymbolsLibrary = initSymbolsLibrary;
window.getSymbolsLegendForPrint = getSymbolsLegendForPrint;

// Export additional functions if needed
export {
    initSymbolsLibrary,
    loadFeatures,
    startDrawing,
    stopDrawing
};
