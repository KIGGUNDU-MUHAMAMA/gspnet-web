// FGB Search Logic
document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const searchBtn = document.getElementById('fgbSearchBtn');
    const searchPanel = document.getElementById('fgbSearchPanel');
    const closePanel = document.getElementById('closeFgbSearch');
    const blockInput = document.getElementById('fgbSearchBlockInput');
    const btnSearch = document.getElementById('btnFgbSearch');
    const statusDiv = document.getElementById('fgbSearchStatus');
    const activeLayerDisplay = document.getElementById('fgbActiveLayerDisplay');

    // Create the Highlight Layer
    const searchHighlightSource = new ol.source.Vector();
    const searchHighlightLayer = new ol.layer.Vector({
        source: searchHighlightSource,
        style: new ol.style.Style({
            stroke: new ol.style.Stroke({
                color: '#ffff00',
                width: 4
            }),
            fill: new ol.style.Fill({
                color: 'rgba(255, 255, 0, 0.3)'
            })
        }),
        zIndex: 9999
    });
    
    // Add to map once map is available
    const initHighlightLayer = setInterval(() => {
        if (typeof map !== 'undefined') {
            map.addLayer(searchHighlightLayer);
            clearInterval(initHighlightLayer);
        }
    }, 500);

    // Get Active Block Layer Configuration
    function getActiveBlockLayerConfig() {
        if (typeof map === 'undefined' || typeof GSPNET_LAYERS_CONFIG === 'undefined') return null;
        
        let activeBlockLayerName = null;

        const findVisibleBlockLayer = (layers) => {
            layers.forEach(layer => {
                if (layer.getLayers) { 
                    // is a group
                    findVisibleBlockLayer(layer.getLayers().getArray());
                } else {
                    const title = layer.get('title');
                    if (title && layer.getVisible()) {
                        const isBlock = title.toLowerCase().includes('block');
                        if (isBlock) {
                            activeBlockLayerName = title;
                        }
                    }
                }
            });
        };
        
        findVisibleBlockLayer(map.getLayers().getArray());

        if (activeBlockLayerName) {
            return GSPNET_LAYERS_CONFIG.find(c => c.title === activeBlockLayerName);
        }
        return null;
    }

    // Update UI for active layer
    function updateActiveLayerUI() {
        const config = getActiveBlockLayerConfig();
        if (config) {
            if (activeLayerDisplay) {
                activeLayerDisplay.textContent = `Active Layer: ${config.title}`;
                activeLayerDisplay.style.color = "#2ecc71";
            }
        } else {
            if (activeLayerDisplay) {
                activeLayerDisplay.textContent = `No Block Layer Active`;
                activeLayerDisplay.style.color = "#ffaa00";
            }
        }
    }

    // Toggle Panel
    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            if (searchPanel.style.display === 'flex') {
                searchPanel.style.display = 'none';
            } else {
                searchPanel.style.display = 'flex';
                updateActiveLayerUI();
            }
        });
    }

    if (closePanel) {
        closePanel.addEventListener('click', () => {
            searchPanel.style.display = 'none';
        });
    }

    // Search Action
    if (btnSearch) {
        btnSearch.addEventListener('click', async () => {
            const blockTerm = (blockInput ? blockInput.value.trim().toLowerCase() : "");

            const activeConfig = getActiveBlockLayerConfig();
            updateActiveLayerUI(); // Refresh UI in case they toggled while panel was open

            if (!activeConfig) {
                statusDiv.textContent = "Please turn on a Block layer in the layer switcher first.";
                statusDiv.style.color = "#ffaa00";
                return;
            }

            if (!blockTerm) {
                statusDiv.textContent = "Please enter a Block number.";
                statusDiv.style.color = "#ff4a4a";
                return;
            }

            statusDiv.textContent = `Fetching data for ${activeConfig.title}... this may take a moment.`;
            statusDiv.style.color = "#3498db";
            searchHighlightSource.clear();
            
            try {
                // Check if flatgeobuf is available
                const fgb = window.flatgeobufLib || window.flatgeobuf || window.FlatGeobuf;
                if (!fgb) {
                    throw new Error("FlatGeobuf library not loaded.");
                }
                
                // Ensure URL protocol is HTTPS
                let fetchUrl = activeConfig.url;
                if (fetchUrl.startsWith('http://')) {
                    fetchUrl = fetchUrl.replace('http://', 'https://');
                }
                
                // Fetch the entire file so we can search its properties
                const response = await fetch(fetchUrl);
                if (!response.ok) {
                    throw new Error(`Network response was not ok: ${response.statusText}`);
                }
                const buffer = await response.arrayBuffer();
                
                statusDiv.textContent = `Searching ${activeConfig.title}...`;
                
                // deserialize buffer
                const iter = fgb.deserialize(new Uint8Array(buffer));
                
                const matches = [];
                const samplePropsList = [];
                
                for await (let feature of iter) {
                    // Extract properties safely
                    let props = {};
                    if (typeof feature.getProperties === 'function') {
                        props = feature.getProperties();
                        const geomName = typeof feature.getGeometryName === 'function' ? feature.getGeometryName() : 'geometry';
                        delete props[geomName];
                    } else {
                        props = feature.properties || {};
                    }

                    if (samplePropsList.length < 2 && Object.keys(props).length > 0) {
                        samplePropsList.push(props);
                    }
                    
                    let matchBlock = false;
                    
                    // Search across all attributes
                    for (const key in props) {
                        if (Object.prototype.hasOwnProperty.call(props, key)) {
                            const val = props[key];
                            if (val !== null && val !== undefined) {
                                // Clean up non-printable characters and whitespace
                                const cleanVal = val.toString().replace(/[\u0000-\u001F\u007F-\u009F]/g, "").trim().toLowerCase();
                                
                                if (cleanVal === blockTerm) {
                                    matchBlock = true;
                                    break;
                                }
                                
                                // Loose match for numeric values padded with zeroes or embedded in 'block 193'
                                if (cleanVal.includes(blockTerm)) {
                                    const alphanumericVal = cleanVal.replace(/[^a-z0-9]/g, "");
                                    const alphanumericSearch = blockTerm.replace(/[^a-z0-9]/g, "");
                                    if (alphanumericSearch && alphanumericVal === alphanumericSearch) {
                                        matchBlock = true;
                                        break;
                                    }
                                }
                            }
                        }
                    }

                    if (matchBlock) {
                        if (feature instanceof ol.Feature || typeof feature.getGeometry === 'function') {
                            matches.push(feature);
                        } else {
                            matches.push({
                                type: 'Feature',
                                geometry: feature.geometry,
                                properties: props
                            });
                        }
                    }
                }

                if (matches.length > 0) {
                    if (matches[0] instanceof ol.Feature || typeof matches[0].getGeometry === 'function') {
                        searchHighlightSource.addFeatures(matches);
                    } else {
                        const format = new ol.format.GeoJSON();
                        const olFeatures = format.readFeatures({
                            type: 'FeatureCollection',
                            features: matches
                        }, {
                            dataProjection: 'EPSG:3857',
                            featureProjection: map.getView().getProjection()
                        });
                        searchHighlightSource.addFeatures(olFeatures);
                    }
                    
                    // Zoom to results
                    const extent = searchHighlightSource.getExtent();
                    map.getView().fit(extent, {
                        padding: [50, 50, 50, 50],
                        duration: 1000,
                        maxZoom: 19
                    });
                    
                    statusDiv.textContent = `Found ${matches.length} matching feature(s).`;
                    statusDiv.style.color = "#2ecc71";
                } else {
                    const safePropsStr = samplePropsList.length > 0 ? JSON.stringify(samplePropsList[0]) : 'None';
                    statusDiv.textContent = `No features found matching Block: '${blockTerm}'. Sample props: ${safePropsStr}`;
                    statusDiv.style.color = "#ffaa00";
                    console.log("FGB Search Sample Properties:", samplePropsList);
                }
                
            } catch (error) {
                console.error("FGB Search Error:", error);
                statusDiv.textContent = "Error occurred during search. Check console.";
                statusDiv.style.color = "#ff4a4a";
            }
        });
    }
});
