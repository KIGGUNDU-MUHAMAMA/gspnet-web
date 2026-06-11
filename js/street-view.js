// js/street-view.js

// Mapillary credentials provided by user
const MAPILLARY_CLIENT_TOKEN = 'MLY|36830379239909087|4fc1eb15e121772201104ed2b92e7658';

let mlyViewer = null;
let streetViewMarker = null;
let svMarkerSource = null;

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
        style: new ol.style.Style({
            stroke: new ol.style.Stroke({
                color: '#05CB63', // Mapillary Brand Green
                width: 2
            })
        }),
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
            // Mapillary API v4 - Find nearest image within radius
            const url = `https://graph.mapillary.com/images?fields=id,geometry,computed_geometry&close_to=${lonLat[0]},${lonLat[1]}&access_token=${MAPILLARY_CLIENT_TOKEN}&limit=1`;
            
            const response = await fetch(url);
            const data = await response.json();
            
            if (data && data.data && data.data.length > 0) {
                const imageId = data.data[0].id;
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
        });

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
}

// Make globally available
window.closeStreetViewPanel = closeStreetViewPanel;
