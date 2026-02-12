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
export async function initSymbolsLibrary(olMap, supabase) {
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
 * Load features within bbox with 20% buffer
 */
async function loadFeatures() {
    try {
        const view = map.getView();
        const extent = view.calculateExtent(map.getSize());

        // Transform to EPSG:4326
        const extent4326 = ol.proj.transformExtent(extent, view.getProjection(), 'EPSG:4326');

        // Add 20% buffer
        const width = extent4326[2] - extent4326[0];
        const height = extent4326[3] - extent4326[1];
        const bufferX = width * 0.2;
        const bufferY = height * 0.2;

        const bufferedExtent = [
            extent4326[0] - bufferX,
            extent4326[1] - bufferY,
            extent4326[2] + bufferX,
            extent4326[3] + bufferY
        ];

        console.log('Loading features with buffered extent:', bufferedExtent);

        // Call RPC function
        const { data, error } = await supabaseClient.rpc('get_features_bbox', {
            min_lon: bufferedExtent[0],
            min_lat: bufferedExtent[1],
            max_lon: bufferedExtent[2],
            max_lat: bufferedExtent[3],
            lim: 1000
        });

        if (error) throw error;

        const geojson = data;
        if (!geojson || !geojson.features) {
            console.log('No features found');
            return;
        }

        // Parse GeoJSON and add to source (upsert behavior)
        const format = new ol.format.GeoJSON({
            dataProjection: 'EPSG:4326',
            featureProjection: view.getProjection()
        });

        geojson.features.forEach(geoJsonFeature => {
            const featureId = geoJsonFeature.id;
            const olFeature = format.readFeature(geoJsonFeature);

            // Set feature properties
            olFeature.setId(featureId);
            olFeature.setProperties(geoJsonFeature.properties);

            // Upsert: update existing or add new
            if (loadedFeatures.has(featureId)) {
                const existingFeature = loadedFeatures.get(featureId);
                existingFeature.setGeometry(olFeature.getGeometry());
                existingFeature.setProperties(geoJsonFeature.properties);
            } else {
                featuresSource.addFeature(olFeature);
                loadedFeatures.set(featureId, olFeature);
            }
        });

        console.log(`Loaded ${geojson.features.length} features (total cached: ${loadedFeatures.size})`);

        // Update UI
        updateMyFeaturesTab();
    } catch (error) {
        console.error('Failed to load features:', error);
        alert(`Failed to load features: ${error.message}`);
    }
}

/**
 * Start drawing interaction
 */
function startDrawing(geomType) {
    if (!selectedSymbol) {
        alert('Please select a symbol from the catalog first');
        return;
    }

    // Remove existing draw interaction
    if (drawInteraction) {
        map.removeInteraction(drawInteraction);
    }

    drawInteraction = new ol.interaction.Draw({
        source: featuresSource,
        type: geomType
    });

    drawInteraction.on('drawend', (event) => {
        const feature = event.feature;
        showFeatureForm(feature, geomType, selectedSymbol);
    });

    map.addInteraction(drawInteraction);
    console.log(`Drawing ${geomType} started`);
}

/**
 * Stop drawing interaction
 */
function stopDrawing() {
    if (drawInteraction) {
        map.removeInteraction(drawInteraction);
        drawInteraction = null;
    }
}

/**
 * Show feature form after drawing
 */
function showFeatureForm(feature, geomType, symbol) {
    // Remove the feature temporarily (will be re-added after save)
    featuresSource.removeFeature(feature);

    const formHtml = `
    <div style="padding: 15px;">
      <h4>New ${symbol.name}</h4>
      <div style="margin-bottom: 10px;">
        <label>Name:</label>
        <input type="text" id="featureName" style="width: 100%; padding: 5px;" />
      </div>
      <div style="margin-bottom: 10px;">
        <label>Description:</label>
        <textarea id="featureDescription" style="width: 100%; padding: 5px;" rows="3"></textarea>
      </div>
      <div style="margin-bottom: 10px;">
        <label>Status:</label>
        <select id="featureStatus" style="width: 100%; padding: 5px;">
          <option value="existing">Existing</option>
          <option value="proposed">Proposed</option>
          <option value="under_construction">Under Construction</option>
          <option value="demolished">Demolished</option>
        </select>
      </div>
      ${getStyleFormHTML(symbol, geomType)}
      <div style="display: flex; gap: 10px; margin-top: 15px;">
        <button id="saveFeatureBtn" style="flex: 1; padding: 8px; background: #3b82f6; color: white; border: none; cursor: pointer;">Save</button>
        <button id="cancelFeatureBtn" style="flex: 1; padding: 8px; background: #6b7280; color: white; border: none; cursor: pointer;">Cancel</button>
      </div>
    </div>
  `;

    // Show in draw tab
    const drawTab = document.getElementById('drawTab');
    const formContainer = document.createElement('div');
    formContainer.innerHTML = formHtml;
    formContainer.style.cssText = 'background: white; border: 1px solid #ccc; border-radius: 4px; margin-top: 10px;';
    drawTab.appendChild(formContainer);

    // Handle save
    document.getElementById('saveFeatureBtn').onclick = async () => {
        await saveFeature(feature, geomType, symbol);
        formContainer.remove();
        stopDrawing();
    };

    // Handle cancel
    document.getElementById('cancelFeatureBtn').onclick = () => {
        formContainer.remove();
        stopDrawing();
    };
}

/**
 * Get style form HTML based on geometry type
 */
function getStyleFormHTML(symbol, geomType) {
    const defaultStyle = symbol.default_style || {};

    if (geomType === 'Point') {
        return `
      <div style="margin-bottom: 10px;">
        <label>Color:</label>
        <input type="color" id="featureColor" value="${defaultStyle.color || '#000000'}" style="width: 100%; height: 40px;" />
      </div>
      <div style="margin-bottom: 10px;">
        <label>Size (px):</label>
        <input type="number" id="featureSize" value="${defaultStyle.size || 24}" min="8" max="64" style="width: 100%; padding: 5px;" />
      </div>
    `;
    } else if (geomType === 'LineString') {
        return `
      <div style="margin-bottom: 10px;">
        <label>Stroke Color:</label>
        <input type="color" id="featureStrokeColor" value="${defaultStyle.strokeColor || '#000000'}" style="width: 100%; height: 40px;" />
      </div>
      <div style="margin-bottom: 10px;">
        <label>Stroke Width (px):</label>
        <input type="number" id="featureStrokeWidth" value="${defaultStyle.strokeWidth || 2}" min="1" max="20" style="width: 100%; padding: 5px;" />
      </div>
      <div style="margin-bottom: 10px;">
        <label>Dash Style:</label>
        <select id="featureDashStyle" style="width: 100%; padding: 5px;">
          <option value="">Solid</option>
          <option value="5,5">Dashed</option>
          <option value="2,2">Dotted</option>
          <option value="10,5,2,5">Dash-Dot</option>
        </select>
      </div>
    `;
    } else if (geomType === 'Polygon') {
        return `
      <div style="margin-bottom: 10px;">
        <label>Fill Color:</label>
        <input type="color" id="featureFillColor" value="${defaultStyle.fillColor || '#3b82f6'}" style="width: 100%; height: 40px;" />
      </div>
      <div style="margin-bottom: 10px;">
        <label>Fill Opacity:</label>
        <input type="range" id="featureFillOpacity" value="${(defaultStyle.fillOpacity || 0.4) * 100}" min="0" max="100" style="width: 100%;" />
        <span id="fillOpacityValue">${Math.round((defaultStyle.fillOpacity || 0.4) * 100)}%</span>
      </div>
      <div style="margin-bottom: 10px;">
        <label>Stroke Color:</label>
        <input type="color" id="featureStrokeColor" value="${defaultStyle.strokeColor || '#1e40af'}" style="width: 100%; height: 40px;" />
      </div>
      <div style="margin-bottom: 10px;">
        <label>Stroke Width (px):</label>
        <input type="number" id="featureStrokeWidth" value="${defaultStyle.strokeWidth || 2}" min="1" max="10" style="width: 100%; padding: 5px;" />
      </div>
    `;
    }
}

/**
 * Save feature to Supabase
 */
async function saveFeature(feature, geomType, symbol) {
    try {
        const geometry = feature.getGeometry();
        const view = map.getView();

        // Transform to EPSG:4326
        const geom4326 = geometry.clone().transform(view.getProjection(), 'EPSG:4326');

        // Convert to GeoJSON
        const format = new ol.format.GeoJSON();
        const geojson = format.writeGeometryObject(geom4326);

        // Collect form data
        const name = document.getElementById('featureName')?.value || null;
        const description = document.getElementById('featureDescription')?.value || null;
        const status = document.getElementById('featureStatus')?.value || 'existing';

        // Collect style data based on geometry type
        let style = {};
        if (geomType === 'Point') {
            style = {
                color: document.getElementById('featureColor')?.value,
                size: parseInt(document.getElementById('featureSize')?.value || 24)
            };
        } else if (geomType === 'LineString') {
            const dashValue = document.getElementById('featureDashStyle')?.value;
            style = {
                strokeColor: document.getElementById('featureStrokeColor')?.value,
                strokeWidth: parseInt(document.getElementById('featureStrokeWidth')?.value || 2),
                strokeDash: dashValue ? dashValue.split(',').map(Number) : null
            };
        } else if (geomType === 'Polygon') {
            style = {
                fillColor: document.getElementById('featureFillColor')?.value,
                fillOpacity: parseInt(document.getElementById('featureFillOpacity')?.value || 40) / 100,
                strokeColor: document.getElementById('featureStrokeColor')?.value,
                strokeWidth: parseInt(document.getElementById('featureStrokeWidth')?.value || 2)
            };
        }

        // Call insert RPC
        const { data: featureId, error } = await supabaseClient.rpc('insert_map_feature', {
            geom_geojson: geojson,
            geom_type: geomType,
            symbol_key: symbol.symbol_key,
            name: name,
            description: description,
            status: status,
            style: style
        });

        if (error) throw error;

        console.log('Feature saved:', featureId);
        alert('Feature saved successfully!');

        // Reload features to get the saved feature
        await loadFeatures();

    } catch (error) {
        console.error('Failed to save feature:', error);
        alert(`Failed to save feature: ${error.message}`);
    }
}

/**
 * Setup UI event handlers
 */
function setupUIHandlers() {
    console.log('[SL] setupUIHandlers called');

    // Toggle button to open/close dock
    const toggleBtn = document.getElementById('symbolsLibraryToggleBtn');
    console.log('[SL] Toggle button:', toggleBtn ? 'FOUND' : 'NOT FOUND', toggleBtn);
    if (toggleBtn) {
        toggleBtn.onclick = () => {
            console.log('[SL] Toggle button clicked!');
            const dock = document.getElementById('symbolsLibraryDock');
            console.log('[SL] Dock element:', dock ? 'FOUND' : 'NOT FOUND');
            if (dock) {
                console.log('[SL] Setting dock display to block');
                dock.style.display = 'block';
            }
        };
        console.log('[SL] Toggle button click handler attached');
    }

    // Close button in dock header
    const closeDockBtn = document.querySelector('#symbolsLibraryDock .dock-close-btn');
    console.log('[SL] Close button:', closeDockBtn ? 'FOUND' : 'NOT FOUND');
    if (closeDockBtn) {
        closeDockBtn.onclick = () => {
            const dock = document.getElementById('symbolsLibraryDock');
            if (dock) {
                dock.style.display = 'none';
            }
        };
    }

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
 * Populate catalog UI with symbols
 */
function populateCatalogUI() {
    const catalogTab = document.getElementById('catalogTab');
    if (!catalogTab) return;

    const categories = {
        point: [],
        line: [],
        polygon: []
    };

    symbolCatalog.forEach(symbol => {
        if (categories[symbol.category]) {
            categories[symbol.category].push(symbol);
        }
    });

    let html = '<div style="padding: 10px;">';

    for (const [category, symbols] of Object.entries(categories)) {
        if (symbols.length === 0) continue;

        html += `<h4 style="margin-top: 15px;">${category.charAt(0).toUpperCase() + category.slice(1)}s</h4>`;
        html += '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 10px;">';

        symbols.forEach(symbol => {
            html += `
        <div class="symbol-card" data-symbol="${symbol.symbol_key}" style="
          border: 2px solid #e5e7eb;
          border-radius: 4px;
          padding: 10px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s;
        ">
          <div style="font-size: 11px; font-weight: 600;">${symbol.name}</div>
        </div>
      `;
        });

        html += '</div>';
    }

    html += '</div>';
    catalogTab.innerHTML = html;

    // Add click handlers to symbol cards
    catalogTab.querySelectorAll('.symbol-card').forEach(card => {
        card.onclick = () => {
            // Remove selection from all cards
            catalogTab.querySelectorAll('.symbol-card').forEach(c => {
                c.style.borderColor = '#e5e7eb';
                c.style.backgroundColor = 'transparent';
            });

            // Highlight selected
            card.style.borderColor = '#3b82f6';
            card.style.backgroundColor = '#eff6ff';

            // Set selected symbol
            const symbolKey = card.dataset.symbol;
            selectedSymbol = symbolCatalog.find(s => s.symbol_key === symbolKey);
            console.log('Selected symbol:', selectedSymbol);
        };
    });
}

/**
 * Update My Features tab
 */
function updateMyFeaturesTab() {
    const myFeaturesTab = document.getElementById('myfeaturesTab');
    if (!myFeaturesTab) return;

    const myFeatures = Array.from(loadedFeatures.values())
        .filter(f => f.get('user_id') === currentUserId);

    let html = '<div style="padding: 10px;">';
    html += `<h4>My Features (${myFeatures.length})</h4>`;

    if (myFeatures.length === 0) {
        html += '<p style="color: #6b7280;">No features yet. Use the Draw tab to create features.</p>';
    } else {
        html += '<ul style="list-style: none; padding: 0;">';
        myFeatures.forEach(feature => {
            const name = feature.get('name') || 'Unnamed';
            const symbolKey = feature.get('symbol_key');
            const symbol = symbolCatalog.find(s => s.symbol_key === symbolKey);
            html += `
        <li style="padding: 8px; border-bottom: 1px solid #e5e7eb;">
          <strong>${name}</strong> (${symbol?.name || symbolKey})
        </li>
      `;
        });
        html += '</ul>';
    }

    html += '</div>';
    myFeaturesTab.innerHTML = html;
}

// Export additional functions if needed
export {
    loadFeatures,
    startDrawing,
    stopDrawing
};
