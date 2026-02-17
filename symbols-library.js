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
let modifyInteraction = null;
let selectInteraction = null;
let loadedFeatures = new Map(); // Map<featureId, ol.Feature> for upsert
let currentUserId = null;
let isAutoLoadEnabled = false;
let autoLoadTimeout = null;
let selectedSymbol = null;

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
            console.warn('[SL] Symbols Library: User not authenticated');
            return;
        }
        console.log('[SL] User authenticated:', user.id);
        currentUserId = user.id;

        // Load symbol catalog
        console.log('[SL] Loading symbol catalog...');
        await loadSymbolCatalog();
        console.log('[SL] Symbol catalog loaded:', symbolCatalog.length, 'symbols');

        // Setup OpenLayers layer
        console.log('[SL] Setting up features layer...');
        setupFeaturesLayer();

        // Setup UI event handlers
        console.log('[SL] Setting up UI handlers...');
        setupUIHandlers();

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
        console.log(`Symbols Library: Loaded ${symbolCatalog.length} symbols`);

        // Populate catalog UI
        populateCatalogUI();
    } catch (error) {
        console.error('Symbols Library: Failed to load symbol catalog:', error);
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

    // Group symbols by geometry type
    const grouped = {
        Point: [],
        LineString: [],
        Polygon: []
    };

    symbolCatalog.forEach(symbol => {
        if (grouped[symbol.geom_type]) {
            grouped[symbol.geom_type].push(symbol);
        }
    });

    let html = '';

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
            const color = symbol.default_style?.stroke_color || '#3b82f6';
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
            const fillColor = symbol.default_style?.fill_color || '#22c55e';
            const strokeColor = symbol.default_style?.stroke_color || '#166534';
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
    const geomType = props.geom_type;
    const style = props.style || {};

    // Find symbol in catalog
    const symbol = symbolCatalog.find(s => s.symbol_key === symbolKey);
    if (!symbol) {
        console.warn(`Symbol not found: ${symbolKey}`);
        return null;
    }

    // Merge default style with per-feature overrides
    const defaultStyle = symbol.default_style || {};
    const mergedStyle = { ...defaultStyle, ...style };

    // Create cache key
    const cacheKey = `${symbolKey}-${JSON.stringify(mergedStyle)}-${props.name || ''}`;
    if (styleCache.has(cacheKey)) {
        return styleCache.get(cacheKey);
    }

    let olStyle;

    if (geomType === 'Point') {
        olStyle = createPointStyle(symbol, mergedStyle, props);
    } else if (geomType === 'LineString') {
        olStyle = createLineStyle(mergedStyle, props);
    } else if (geomType === 'Polygon') {
        olStyle = createPolygonStyle(mergedStyle, props);
    }

    styleCache.set(cacheKey, olStyle);
    return olStyle;
}

/**
 * Create style for point features
 */
function createPointStyle(symbol, style, props) {
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
    if (props.name) {
        styles.push(new ol.style.Style({
            text: new ol.style.Text({
                text: props.name,
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

/**
 * Create style for line features
 */
function createLineStyle(style, props) {
    const strokeColor = style.strokeColor || '#000000';
    const strokeWidth = style.strokeWidth || 2;
    const strokeOpacity = style.strokeOpacity !== undefined ? style.strokeOpacity : 1.0;
    const strokeDash = style.strokeDash || null;

    // Convert hex color to rgba
    const rgba = hexToRgba(strokeColor, strokeOpacity);

    return new ol.style.Style({
        stroke: new ol.style.Stroke({
            color: rgba,
            width: strokeWidth,
            lineDash: strokeDash
        })
    });
}

/**
 * Create style for polygon features
 */
function createPolygonStyle(style, props) {
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
        })
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

    // Toggle button to open/close dock
    const toggleBtn = document.getElementById('symbolsLibraryToggleBtn') || document.getElementById('symbolsLibraryBtn');
    console.log('[SL] Toggle button:', toggleBtn ? 'FOUND' : 'NOT FOUND', toggleBtn);
    if (toggleBtn) {
        toggleBtn.onclick = () => {
            console.log('[SL] Toggle button clicked!');
            const dock = document.getElementById('symbolsLibraryDock');
            console.log('[SL] Dock element:', dock ? 'FOUND' : 'NOT FOUND');
            if (dock) {
                console.log('[SL] Setting dock display to block');
                dock.style.display = dock.style.display === 'block' ? 'none' : 'block';
            }
        };
        console.log('[SL] Toggle button click handler attached');
    }

    // Close button in dock header
    const closeDockBtn = document.getElementById('symbolsLibraryClose');
    console.log('[SL] Close button:', closeDockBtn ? 'FOUND' : 'NOT FOUND');
    if (closeDockBtn) {
        closeDockBtn.onclick = () => {
            const dock = document.getElementById('symbolsLibraryDock');
            if (dock) {
                dock.style.display = 'none';
            }
        };
    }

    // Tab switching
    console.log('[SL] Setting up tab switching...');
    const tabButtons = document.querySelectorAll('.symbols-tab');
    const tabContents = document.querySelectorAll('.symbols-tab-content');

    console.log('[SL] Found tab buttons:', tabButtons.length);
    console.log('[SL] Found tab contents:', tabContents.length);

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');
            console.log('[SL] Tab clicked:', targetTab);

            // Remove active class from all tabs and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => {
                content.classList.remove('active');
                content.style.display = 'none';
            });

            // Add active class to clicked tab and corresponding content
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

    if (drawPointBtn) drawPointBtn.onclick = () => startDrawing('Point');
    if (drawLineBtn) drawLineBtn.onclick = () => startDrawing('LineString');
    if (drawPolygonBtn) drawPolygonBtn.onclick = () => startDrawing('Polygon');
    if (stopDrawBtn) stopDrawBtn.onclick = stopDrawing;

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
                <i class="fas fa-sync-alt"></i> Load
            </button>
        </div>
    `;

    if (myFeatures.length === 0) {
        html += '<p style="color: #6b7280; text-align: center; padding: 20px;">No features yet. Use the Draw tab to create features.</p>';
    } else {
        html += '<div class="features-list" style="max-height: 400px; overflow-y: auto;">';

        myFeatures.forEach(feature => {
            const id = feature.getId();
            const name = feature.get('name') || 'Unnamed';
            const symbolKey = feature.get('symbol_key');
            const symbol = symbolCatalog.find(s => s.symbol_key === symbolKey);
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

    // Add Load button handler
    const loadBtn = document.getElementById('loadMyFeaturesBtn');
    if (loadBtn) {
        loadBtn.onclick = loadMyFeatures;
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
    const name = document.getElementById('editFeatureName').value;
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

        showMessage(`Loaded ${data?.features?.length || 0} features`, 'success');
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
        showMessage('Please select a symbol from the Catalog first', 'warning');
        console.warn('[SL] No symbol selected');
        return;
    }

    console.log('[SL] Starting drawing:', geomType, 'with symbol:', selectedSymbol.name);

    // Remove existing interaction
    if (drawInteraction) {
        map.removeInteraction(drawInteraction);
    }

    // Create new draw interaction
    drawInteraction = new ol.interaction.Draw({
        source: featuresSource,
        type: geomType
    });

    drawInteraction.on('drawend', handleDrawEnd);
    map.addInteraction(drawInteraction);

    showMessage(`Drawing ${geomType}... Click on map to draw`, 'info');
}

/**
 * Stop drawing interaction
 */
function stopDrawing() {
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
    const name = prompt(`Name for this ${selectedSymbol.name}:`, `New ${selectedSymbol.name}`);
    if (!name) {
        showMessage('Feature creation cancelled', 'info');
        return;
    }

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
    // Check for jsPDF library
    if (typeof jsPDF === 'undefined') {
        showMessage('PDF library not available. Legend export disabled.', 'error');
        console.warn('[SL] jsPDF library not found');
        return;
    }

    try {
        // Get unique symbols from user's features
        const myFeatures = Array.from(loadedFeatures.values())
            .filter(f => f.get('user_id') === currentUserId);

        if (myFeatures.length === 0) {
            showMessage('No features to export', 'warning');
            return;
        }

        // Count features by symbol
        const symbolCounts = {};
        myFeatures.forEach(feature => {
            const symbolKey = feature.get('symbol_key');
            symbolCounts[symbolKey] = (symbolCounts[symbolKey] || 0) + 1;
        });

        // Create PDF
        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.text('Symbols Legend', 20, 20);

        doc.setFontSize(10);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 30);
        doc.text(`Total Features: ${myFeatures.length}`, 20, 36);

        let y = 50;

        // Add each symbol
        Object.entries(symbolCounts).forEach(([symbolKey, count]) => {
            const symbol = symbolCatalog.find(s => s.symbol_key === symbolKey);
            if (symbol) {
                // Check page break
                if (y > 270) {
                    doc.addPage();
                    y = 20;
                }

                doc.setFontSize(12);
                doc.text(`• ${symbol.name}`, 25, y);
                doc.setFontSize(9);
                doc.setTextColor(100);
                doc.text(`(${count} feature${count > 1 ? 's' : ''})`, 25, y + 5);
                doc.setTextColor(0);

                y += 12;
            }
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

// Export additional functions if needed
export {
    initSymbolsLibrary,
    loadFeatures,
    startDrawing,
    stopDrawing
};
