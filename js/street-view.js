// js/street-view.js

// Mapillary credentials provided by user
const MAPILLARY_CLIENT_TOKEN = 'MLY|36830379239909087|4fc1eb15e121772201104ed2b92e7658';

let mapillaryCoverageLayer = null;
let mlyViewer = null;
let svMarkerSource = null;
let streetViewMarker = null;

// Tool states
let isMeasureMode = false;
let isAIToggled = false;
let measurePoints = [];

function tryInit() {
    // Wait for the main OpenLayers map to be fully initialized
    const checkMap = setInterval(() => {
        if (window.map) {
            clearInterval(checkMap);
            initStreetView();
        }
    }, 500);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', tryInit);
} else {
    tryInit();
}

function initStreetView() {
    const map = window.map;

    // 1. Create Mapillary Coverage VectorTile Layer
    const mapillaryCoverageLayer = new ol.layer.VectorTile({
        title: 'Mapillary Coverage',
        visible: false, // Hidden by default, toggled via Layer Switcher
        source: new ol.source.VectorTile({
            format: new ol.format.MVT(),
            url: `https://tiles.mapillary.com/maps/vtp/mly1_public/2/{z}/{x}/{y}?access_token=${MAPILLARY_CLIENT_TOKEN}`,
            maxZoom: 14
        }),
        style: function(feature) {
            const type = feature.getGeometry().getType();
            if (type === 'Point' || feature.get('layer') === 'image') {
                return new ol.style.Style({
                    image: new ol.style.Circle({
                        radius: 8,
                        fill: new ol.style.Fill({ color: 'rgba(5, 203, 99, 0.01)' }) // Invisible but clickable
                    })
                });
            }
            return new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: '#05CB63', // Mapillary Brand Green
                    width: 2
                })
            });
        },
        zIndex: 100
    });

    // 2. Add layer to map inside a 'Street View' group
    // Check if ol-layerswitcher's Group exists, otherwise use standard ol.layer.Group
    const streetViewGroup = new ol.layer.Group({
        title: 'STREET VIEW',
        fold: 'close',
        layers: [mapillaryCoverageLayer]
    });
    streetViewGroup.set('title', 'STREET VIEW');
    mapillaryCoverageLayer.set('title', 'Mapillary Coverage');
    
    // Add to the very top so it reliably appears in the layer switcher
    map.addLayer(streetViewGroup);

    // Force ol-layerswitcher to re-render to pick up the new group
    map.getControls().forEach(control => {
        if (typeof control.renderPanel === 'function') {
            setTimeout(() => control.renderPanel(), 100);
        }
    });

    // 3. Setup marker layer for the view cone
    svMarkerSource = new ol.source.Vector();
    const markerLayer = new ol.layer.Vector({
        source: svMarkerSource,
        zIndex: 1000
    });
    map.addLayer(markerLayer);

    streetViewMarker = new ol.Feature(); // No geometry initially
    
    // Green view cone style
    streetViewMarker.setStyle(new ol.style.Style({
        image: new ol.style.Icon({
            src: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><path d="M20 0 L40 40 L20 30 L0 40 Z" fill="%2305CB63" opacity="0.8"/></svg>',
            anchor: [0.5, 0.75],
            rotation: 0 
        })
    }));
    // DO NOT add feature to source yet. It has no geometry and will crash OpenLayers.

    // 4. Handle Map Click when coverage is active
    map.on('singleclick', async (evt) => {
        if (!mapillaryCoverageLayer.getVisible()) return;

        const lonLat = ol.proj.toLonLat(evt.coordinate);
        
        try {
            let imageId = null;
            
            // Fast path: Check if we clicked directly on an MVT image point
            const features = map.getFeaturesAtPixel(evt.pixel, {
                layerFilter: layer => layer === mapillaryCoverageLayer
            });
            
            if (features && features.length > 0) {
                for (const f of features) {
                    if (f.getGeometry().getType() === 'Point' || f.get('layer') === 'image') {
                        imageId = f.get('id');
                        break;
                    }
                }
            }

            // Fallback: Graph API bbox search if no MVT point was hit
            if (!imageId) {
                const lon = lonLat[0];
                const lat = lonLat[1];
                const buffer = 0.0002; // ~20 meters
                const bbox = `${lon - buffer},${lat - buffer},${lon + buffer},${lat + buffer}`;
                const url = `https://graph.mapillary.com/images?fields=id&bbox=${bbox}&access_token=${MAPILLARY_CLIENT_TOKEN}&limit=1`;
                
                const response = await fetch(url);
                const data = await response.json();
                
                if (data && data.data && data.data.length > 0) {
                    imageId = data.data[0].id;
                }
            }
            
            if (imageId) {
                openStreetViewPanel();
                loadMapillaryViewer(imageId);
                
                // Show marker at clicked location
                streetViewMarker.setGeometry(new ol.geom.Point(evt.coordinate));
                if (!svMarkerSource.hasFeature(streetViewMarker)) {
                    svMarkerSource.addFeature(streetViewMarker);
                }
            } else {
                if (window.showToast) {
                    window.showToast('No Street View imagery found at this location.', 'info');
                } else {
                    console.log('No street view images found nearby.');
                }
            }
        } catch (e) {
            console.error('Error fetching Mapillary image', e);
            if (window.showToast) window.showToast('Error connecting to Mapillary.', 'error');
        }
    });

    // Handle viewer resize
    window.addEventListener('resize', () => {
        if (mlyViewer) mlyViewer.resize();
    });
}

function openStreetViewPanel() {
    let panel = document.getElementById('street-view-panel');
    if (panel) {
        panel.classList.add('active');
        // Let the CSS transition finish before resizing the map
        setTimeout(() => { if (window.map) window.map.updateSize(); }, 350);
    }
}

function closeStreetViewPanel() {
    let panel = document.getElementById('street-view-panel');
    if (panel) {
        panel.classList.remove('active');
        setTimeout(() => { if (window.map) window.map.updateSize(); }, 350);
    }
    // Hide marker
    if (streetViewMarker) {
         if (svMarkerSource && svMarkerSource.hasFeature(streetViewMarker)) {
             svMarkerSource.removeFeature(streetViewMarker);
         }
         streetViewMarker.setGeometry(null);
    }
}

function loadMapillaryViewer(imageId) {
    const container = document.getElementById('mly-container');
    if (!container) return;
    
    // Check if mapillary JS loaded
    if (!window.mapillary || !window.mapillary.Viewer) {
        console.error('Mapillary JS not loaded. Check script tag.');
        return;
    }

    // Initialize or update viewer
    if (!mlyViewer) {
        mlyViewer = new window.mapillary.Viewer({
            accessToken: MAPILLARY_CLIENT_TOKEN,
            container: 'mly-container',
            imageId: imageId,
            component: {
                cover: false,
                spatial: true,
                tag: true
            }
        });
        
        // Setup Mapillary event listeners for tools
        setupMapillaryTools();

        // Event: When user moves to a new node (image)
        mlyViewer.on('nodechanged', (node) => {
            if (!node || !node.latLon) return;
            const coords = ol.proj.fromLonLat([node.latLon.lon, node.latLon.lat]);
            if (streetViewMarker) {
                 if(!streetViewMarker.getGeometry()) {
                     streetViewMarker.setGeometry(new ol.geom.Point(coords));
                 } else {
                     streetViewMarker.getGeometry().setCoordinates(coords);
                 }
                 if (svMarkerSource && !svMarkerSource.hasFeature(streetViewMarker)) {
                     svMarkerSource.addFeature(streetViewMarker);
                 }
            }
            // Auto-pan map to keep marker in view
            if (window.map) {
                const view = window.map.getView();
                const extent = view.calculateExtent(window.map.getSize());
                if (!ol.extent.containsCoordinate(extent, coords)) {
                    view.animate({ center: coords, duration: 500 });
                }
            }
        });

        // Event: When user pans the camera (changes bearing)
        mlyViewer.on('povchanged', (pov) => {
            if (streetViewMarker) {
                // OpenLayers rotation is in radians clockwise from North
                const rotation = pov.bearing * (Math.PI / 180);
                const style = streetViewMarker.getStyle();
                if (style && style.getImage()) {
                    style.getImage().setRotation(rotation);
                    streetViewMarker.changed();
                }
            }
        });
    } else {
        // Move existing viewer to new image
        mlyViewer.moveTo(imageId).catch(e => console.error(e));
    }
    
    // Always load the timeline for the new image
    loadMapillaryTimeline(imageId);
}

// ---------------------------------------------------------
// ADVANCED MAPILLARY FEATURES
// ---------------------------------------------------------

function setupMapillaryTools() {
    if (!mlyViewer) return;

    // Handle Native Measurement Tool clicks
    mlyViewer.on('click', async (event) => {
        if (!isMeasureMode) return;

        try {
            const point = await mlyViewer.unproject(event.pixel);
            if (!point) {
                if (window.showToast) window.showToast('No 3D depth data available at this exact pixel.', 'warning');
                return;
            }

            measurePoints.push(point);

            if (measurePoints.length === 1) {
                if (window.showToast) window.showToast('First point captured. Click a second point.', 'info');
            } else if (measurePoints.length === 2) {
                const p1 = measurePoints[0];
                const p2 = measurePoints[1];
                
                // Euclidean distance in meters
                const distance = Math.sqrt(
                    Math.pow(p1[0] - p2[0], 2) + 
                    Math.pow(p1[1] - p2[1], 2) + 
                    Math.pow(p1[2] - p2[2], 2)
                );

                const readout = document.getElementById('mly-measure-readout');
                const text = document.getElementById('mly-distance-text');
                if (readout && text) {
                    text.innerText = distance.toFixed(2) + ' m';
                    readout.style.display = 'flex';
                }

                measurePoints = []; // Reset for next measurement
            }
        } catch (err) {
            console.error('Measurement failed', err);
        }
    });
}

window.toggleMapillaryMeasure = function() {
    isMeasureMode = !isMeasureMode;
    const btn = document.getElementById('mly-measure-btn');
    if (isMeasureMode) {
        btn.classList.add('active');
        if (window.showToast) window.showToast('Measure Mode ON. Click two points in the viewer.', 'info');
    } else {
        btn.classList.remove('active');
        window.clearMapillaryMeasure();
    }
};

window.clearMapillaryMeasure = function() {
    measurePoints = [];
    const readout = document.getElementById('mly-measure-readout');
    if (readout) readout.style.display = 'none';
};

window.toggleMapillaryAI = async function() {
    if (!mlyViewer) return;
    isAIToggled = !isAIToggled;
    const btn = document.getElementById('mly-ai-btn');

    if (isAIToggled) {
        btn.classList.add('active');
        if (window.showToast) window.showToast('Loading AI feature detections...', 'info');
        
        try {
            const image = await mlyViewer.getImage();
            const url = `https://graph.mapillary.com/${image.id}/detections?fields=id,geometry,value&access_token=${MAPILLARY_CLIENT_TOKEN}`;
            const res = await fetch(url);
            const data = await res.json();

            if (data && data.data && data.data.length > 0) {
                if (window.showToast) window.showToast(`Found ${data.data.length} AI detections for this view!`, 'success');
                // The geometry parsing requires base64 binary decoding which is omitted for simplicity.
                // In a production build, a web assembly decoder would map this to mapillary.PolygonGeometry.
            } else {
                if (window.showToast) window.showToast('No AI detections for this specific image.', 'warning');
            }
        } catch (e) {
            console.error(e);
            if (window.showToast) window.showToast('Error loading AI detections.', 'error');
        }
    } else {
        btn.classList.remove('active');
        // Clear tags if they were rendered
        const tagComponent = mlyViewer.getComponent('tag');
        if (tagComponent) tagComponent.removeAll();
    }
};

window.exportMapillaryPDF = async function() {
    if (!mlyViewer) return;
    
    // Attempt to grab canvas from DOM
    const canvas = document.querySelector('#mly-container canvas');
    if (!canvas) {
        if (window.showToast) window.showToast('Canvas not found.', 'error');
        return;
    }

    try {
        if (window.showToast) window.showToast('Generating snapshot... Please wait.', 'info');
        
        // Take a snapshot
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        
        const node = await mlyViewer.getImage();
        const lat = node.latLon.lat.toFixed(6);
        const lon = node.latLon.lon.toFixed(6);
        const date = new Date(node.capturedAt).toLocaleString();

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: 'landscape' });
        
        // PDF Styling
        doc.setFontSize(24);
        doc.setTextColor(5, 203, 99);
        doc.text('GSP STREET VIEW - SITE REPORT', 20, 20);
        
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text(`Location Coordinates: ${lat}, ${lon}`, 20, 32);
        doc.text(`Original Capture Date: ${date}`, 20, 40);
        doc.text(`Report Generated On: ${new Date().toLocaleString()}`, 20, 48);

        // Mapillary snapshot
        doc.addImage(dataUrl, 'JPEG', 20, 55, 250, 140);

        doc.save(`GSP_StreetView_Report_${node.id}.pdf`);
        if (window.showToast) window.showToast('PDF Report downloaded successfully!', 'success');
        
    } catch (err) {
        console.error('PDF Export failed', err);
        if (window.showToast) window.showToast('Failed to export PDF.', 'error');
    }
};

let historicalImages = [];

async function loadMapillaryTimeline(imageId) {
    const container = document.getElementById('mly-timeline-container');
    const slider = document.getElementById('mly-timeline-slider');
    const dateDisplay = document.getElementById('mly-date-display');
    
    if (!container || !slider || !dateDisplay) return;
    
    container.style.display = 'none';

    try {
        const node = await mlyViewer.getImage();
        const lon = node.latLon.lon;
        const lat = node.latLon.lat;
        
        // Search 20m bbox for historical images
        const buffer = 0.0002;
        const bbox = `${lon - buffer},${lat - buffer},${lon + buffer},${lat + buffer}`;
        const url = `https://graph.mapillary.com/images?fields=id,captured_at&bbox=${bbox}&access_token=${MAPILLARY_CLIENT_TOKEN}&limit=50`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data && data.data && data.data.length > 0) {
            // Sort ascending by date
            historicalImages = data.data.sort((a, b) => a.captured_at - b.captured_at);
            
            slider.min = 0;
            slider.max = historicalImages.length - 1;
            
            // Find current image index, default to newest if not found
            let currentIndex = historicalImages.findIndex(img => img.id === imageId);
            if (currentIndex === -1) currentIndex = historicalImages.length - 1;
            
            slider.value = currentIndex;
            
            const renderTimelineDate = (idx) => {
                const date = new Date(historicalImages[idx].captured_at).toLocaleDateString(undefined, {
                    year: 'numeric', month: 'long', day: 'numeric'
                });
                dateDisplay.innerText = date;
            };
            
            renderTimelineDate(currentIndex);
            container.style.display = 'flex';
            
            // On slider change
            slider.oninput = function() {
                const idx = parseInt(this.value);
                renderTimelineDate(idx);
                mlyViewer.moveTo(historicalImages[idx].id).catch(e => console.error(e));
            };
        }
    } catch (e) {
        console.error('Timeline fetch failed', e);
    }
}

// Make globally available
window.closeStreetViewPanel = closeStreetViewPanel;
