/**
 * GSP.NET Field Navigator - Routing Engine
 * Integrates OSRM for dynamic routing, Drive Mode, Voice Guidance, and Context Menus.
 */

const GSPRouting = {
    osrmUrl: 'https://router.project-osrm.org/route/v1/driving/',
    routeLayer: null,
    startCoord: null,
    endCoord: null,
    watchId: null,
    routeCoordinates: [], // the path geometry points
    currentStepIndex: 0,
    steps: [],
    recalculating: false,
    destinationReachedSpoken: false,
    
    // UI Elements
    ui: {
        startInput: null,
        endInput: null,
        goBtn: null,
        cancelBtn: null,
        stats: null,
        distanceVal: null,
        timeVal: null
    },

    init: function() {
        console.log('[Routing] Initializing GSP.NET Field Navigator');
        
        // Setup UI references
        this.ui.startInput = document.getElementById('route-start-input');
        this.ui.endInput = document.getElementById('route-end-input');
        this.ui.goBtn = document.getElementById('route-go-btn');
        this.ui.cancelBtn = document.getElementById('route-cancel-btn');
        this.ui.stats = document.getElementById('route-stats');
        this.ui.distanceVal = document.getElementById('route-distance-val');
        this.ui.timeVal = document.getElementById('route-time-val');

        // Route Layer
        this.routeLayer = new ol.layer.Vector({
            source: new ol.source.Vector(),
            style: new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: 'rgba(52, 152, 219, 0.8)',
                    width: 6
                })
            }),
            zIndex: 9999
        });
        if (window.map) {
            window.map.addLayer(this.routeLayer);
            this.setupContextMenus();
        }

        // DOM Listeners
        document.getElementById('route-start-gps-btn')?.addEventListener('click', () => this.useCurrentLocation());
        this.ui.goBtn?.addEventListener('click', () => this.startDriveMode());
        this.ui.cancelBtn?.addEventListener('click', () => this.stopDriveMode());

        this.setupPopupHook();
    },

    // Option A: Inject "Navigate Here" into existing info popup via MutationObserver
    setupPopupHook: function() {
        const featureInfo = document.getElementById('featureInfoContent');
        if (!featureInfo) return;

        const observer = new MutationObserver((mutations) => {
            // Check if there is content and we haven't already added the button
            if (featureInfo.innerHTML.includes('<table') && !document.getElementById('popup-navigate-btn')) {
                // Try to find the coordinate of the last clicked feature. 
                // Since this happens right after a click, we can use the global coordinate.
                
                const btnHtml = `
                    <button id="popup-navigate-btn" style="
                        width: 100%; padding: 12px; margin-top: 15px; 
                        background: linear-gradient(135deg, #3498db, #2980b9); 
                        color: white; border: none; border-radius: 6px; 
                        font-weight: bold; font-size: 14px; cursor: pointer;
                        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                        transition: all 0.2s;
                    ">
                        <i class="fas fa-car"></i> Navigate to this Parcel
                    </button>
                `;
                featureInfo.insertAdjacentHTML('beforeend', btnHtml);

                document.getElementById('popup-navigate-btn').addEventListener('click', () => {
                    // Grab center of map as approximation if we don't have exact parcel geom here
                    const center = window.map.getView().getCenter();
                    this.setDestination(center, "Selected Parcel");
                    
                    // Close popup and open routing panel
                    const closeBtn = document.getElementById('closeFeatureInfo');
                    if(closeBtn) closeBtn.click();
                    
                    const routingTab = document.querySelector('.gspnet-tab[data-tab="routing"]');
                    if (routingTab) routingTab.click();
                    
                    // Open dock if closed
                    const gspnetPanel = document.getElementById('gspnet-assist-panel');
                    if (gspnetPanel && !gspnetPanel.classList.contains('active')) {
                        gspnetPanel.style.display = 'flex';
                        gspnetPanel.classList.add('active');
                        setTimeout(() => gspnetPanel.classList.add('show'), 10);
                    }
                });
            }
        });

        observer.observe(featureInfo, { childList: true, subtree: true });
    },

    // Option B: Context Menu
    setupContextMenus: function() {
        const viewport = window.map.getViewport();
        
        // Create context menu element
        const contextMenu = document.createElement('div');
        contextMenu.id = 'gspnet-context-menu';
        contextMenu.style.cssText = `
            position: absolute; display: none; background: #fff;
            border-radius: 8px; box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            padding: 5px 0; z-index: 10000; min-width: 180px; font-family: sans-serif;
        `;
        
        const navItem = document.createElement('div');
        navItem.innerHTML = '<i class="fas fa-route" style="margin-right: 8px; color: #3498db;"></i> Navigate Here';
        navItem.style.cssText = 'padding: 10px 15px; cursor: pointer; color: #2c3e50; transition: background 0.2s; font-size: 14px;';
        navItem.onmouseover = () => navItem.style.background = '#f1f2f6';
        navItem.onmouseout = () => navItem.style.background = 'transparent';
        
        contextMenu.appendChild(navItem);
        document.body.appendChild(contextMenu);

        // Hide on click anywhere
        document.addEventListener('click', () => {
            contextMenu.style.display = 'none';
        });

        // Right click on map
        viewport.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            const pixel = window.map.getEventPixel(e);
            const coord = window.map.getCoordinateFromPixel(pixel);
            
            // Check if there are features
            const features = window.map.getFeaturesAtPixel(pixel);
            if (features && features.length > 0) {
                contextMenu.style.left = e.pageX + 'px';
                contextMenu.style.top = e.pageY + 'px';
                contextMenu.style.display = 'block';
                
                navItem.onclick = () => {
                    this.setDestination(coord, "Selected Parcel");
                    const routingTab = document.querySelector('.gspnet-tab[data-tab="routing"]');
                    if (routingTab) routingTab.click();
                    const gspnetPanel = document.getElementById('gspnet-assist-panel');
                    if (gspnetPanel && !gspnetPanel.classList.contains('active')) {
                        gspnetPanel.style.display = 'flex';
                        gspnetPanel.classList.add('active');
                        setTimeout(() => gspnetPanel.classList.add('show'), 10);
                    }
                };
            }
        });

        // Mobile Long Press simulation
        let pressTimer;
        viewport.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                pressTimer = setTimeout(() => {
                    const evt = e.touches[0];
                    const pixel = window.map.getEventPixel(evt);
                    const coord = window.map.getCoordinateFromPixel(pixel);
                    const features = window.map.getFeaturesAtPixel(pixel);
                    
                    if (features && features.length > 0) {
                        contextMenu.style.left = evt.pageX + 'px';
                        contextMenu.style.top = evt.pageY + 'px';
                        contextMenu.style.display = 'block';
                        
                        navItem.onclick = () => {
                            this.setDestination(coord, "Selected Parcel");
                            const routingTab = document.querySelector('.gspnet-tab[data-tab="routing"]');
                            if (routingTab) routingTab.click();
                            const gspnetPanel = document.getElementById('gspnet-assist-panel');
                            if (gspnetPanel && !gspnetPanel.classList.contains('active')) {
                                gspnetPanel.style.display = 'flex';
                                gspnetPanel.classList.add('active');
                                setTimeout(() => gspnetPanel.classList.add('show'), 10);
                            }
                            contextMenu.style.display = 'none';
                        };
                    }
                }, 800); // 800ms for long press
            }
        });
        
        viewport.addEventListener('touchend', () => clearTimeout(pressTimer));
        viewport.addEventListener('touchmove', () => clearTimeout(pressTimer));
    },

    useCurrentLocation: function() {
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser");
            return;
        }

        this.ui.startInput.value = "Locating...";
        
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const coord = ol.proj.fromLonLat([position.coords.longitude, position.coords.latitude]);
                this.setStart(coord, "My Location");
            },
            (err) => {
                alert("Could not get location: " + err.message);
                this.ui.startInput.value = "";
            },
            { enableHighAccuracy: true }
        );
    },

    setStart: function(coord, label) {
        this.startCoord = coord;
        this.ui.startInput.value = label;
        this.drawMarkers();
        this.calculateRoute();
    },

    setDestination: function(coord, label) {
        this.endCoord = coord;
        this.ui.endInput.value = label;
        this.drawMarkers();
        this.calculateRoute();
    },

    drawMarkers: function() {
        const source = this.routeLayer.getSource();
        // Keep the route line if it exists, remove old markers
        const features = source.getFeatures().filter(f => f.getGeometry().getType() === 'LineString');
        source.clear();
        source.addFeatures(features);

        if (this.startCoord) {
            const startFeature = new ol.Feature({
                geometry: new ol.geom.Point(this.startCoord)
            });
            startFeature.setStyle(new ol.style.Style({
                image: new ol.style.Circle({
                    radius: 8,
                    fill: new ol.style.Fill({color: '#2ecc71'}),
                    stroke: new ol.style.Stroke({color: '#fff', width: 2})
                })
            }));
            source.addFeature(startFeature);
        }

        if (this.endCoord) {
            const endFeature = new ol.Feature({
                geometry: new ol.geom.Point(this.endCoord)
            });
            endFeature.setStyle(new ol.style.Style({
                image: new ol.style.Circle({
                    radius: 8,
                    fill: new ol.style.Fill({color: '#e74c3c'}),
                    stroke: new ol.style.Stroke({color: '#fff', width: 2})
                })
            }));
            source.addFeature(endFeature);
        }
        
        // Zoom to markers if we only have one or haven't calculated route yet
        if ((this.startCoord && !this.endCoord) || (!this.startCoord && this.endCoord)) {
            const coord = this.startCoord || this.endCoord;
            window.map.getView().animate({ center: coord, zoom: 16, duration: 800 });
        }
    },

    calculateRoute: async function() {
        if (!this.startCoord || !this.endCoord) return;

        this.ui.goBtn.style.opacity = '0.5';
        this.ui.goBtn.style.pointerEvents = 'none';
        this.ui.goBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Calculating...';

        try {
            // OSRM requires Lon,Lat
            const startLonLat = ol.proj.toLonLat(this.startCoord);
            const endLonLat = ol.proj.toLonLat(this.endCoord);

            const url = `${this.osrmUrl}${startLonLat[0]},${startLonLat[1]};${endLonLat[0]},${endLonLat[1]}?geometries=geojson&steps=true&overview=full`;
            
            const response = await fetch(url);
            const data = await response.json();

            if (data.code === 'Ok' && data.routes.length > 0) {
                const route = data.routes[0];
                
                // Draw route on map
                const geojson = {
                    type: 'Feature',
                    geometry: route.geometry
                };
                
                const format = new ol.format.GeoJSON({
                    featureProjection: 'EPSG:3857'
                });
                
                const feature = format.readFeature(geojson);
                this.routeLayer.getSource().clear();
                this.routeLayer.getSource().addFeature(feature);
                this.drawMarkers();

                // Zoom to route
                window.map.getView().fit(this.routeLayer.getSource().getExtent(), {
                    padding: [50, 50, 50, 50],
                    duration: 1000
                });

                // Update UI Stats
                const distKm = (route.distance / 1000).toFixed(2);
                const timeMin = Math.round(route.duration / 60);
                
                this.ui.distanceVal.textContent = `${distKm} km`;
                this.ui.timeVal.textContent = `${timeMin} min`;
                this.ui.stats.style.display = 'block';

                if (document.getElementById('gspnet-nav-hud')) {
                    this.updateNavHUD(null, null, route.distance, route.duration);
                }

                // Enable GO button
                this.ui.goBtn.style.opacity = '1';
                this.ui.goBtn.style.pointerEvents = 'auto';
                this.ui.goBtn.innerHTML = '<i class="fas fa-car"></i> START NAVIGATION';

                // Save steps for audio guidance
                if (route.legs && route.legs.length > 0) {
                    this.steps = route.legs[0].steps;
                    this.currentStepIndex = 0;
                }
            } else {
                alert("No route found between these points.");
                this.ui.goBtn.innerHTML = '<i class="fas fa-car"></i> START NAVIGATION';
            }
        } catch (error) {
            console.error("Routing Error:", error);
            alert("Error calculating route. Please try again.");
            this.ui.goBtn.innerHTML = '<i class="fas fa-car"></i> START NAVIGATION';
        }
    },

    startDriveMode: function() {
        console.log('[Routing] Starting Drive Mode');
        if (!navigator.geolocation) return;

        // UI Changes
        this.ui.goBtn.style.display = 'none';
        this.ui.cancelBtn.style.display = 'flex';
        
        // Close the panel
        const gspnetPanel = document.getElementById('gspnet-assist-panel');
        if (gspnetPanel && gspnetPanel.classList.contains('active')) {
            gspnetPanel.classList.remove('show');
            setTimeout(() => {
                gspnetPanel.classList.remove('active');
                gspnetPanel.style.display = 'none';
            }, 300);
        }

        this.destinationReachedSpoken = false;

        // Hide heavy layers, ensure basemaps are visible
        window.map.getLayers().forEach(l => {
            const title = l.get('title');
            if (l !== this.routeLayer) {
                if (title === 'BASE MAPS' || title === 'Base Maps') {
                    // Do nothing, leave the basemap group visible
                } else { // Hide other stuff
                    if(l.getVisible()) {
                        l.set('wasVisibleForRouting', true);
                        l.setVisible(false);
                    }
                }
            }
        });

        // Create Navigation HUD
        this.createNavHUD();

        // Configure 3D View perspective (Pitch) if supported by OpenLayers version
        const view = window.map.getView();
        if (typeof view.setPitch === 'function') {
            view.setPitch(60); // Tilt map
        }
        view.setZoom(18);

        const distTxt = this.ui.distanceVal.textContent || "";
        this.speak(`Starting navigation. Total distance to cover is ${distTxt}.`);

        // Start live tracking
        this.watchId = navigator.geolocation.watchPosition(
            (position) => {
                this.handlePositionUpdate(position);
            },
            (err) => console.warn(err),
            { enableHighAccuracy: true, maximumAge: 0 }
        );
    },

    createNavHUD: function() {
        if(document.getElementById('gspnet-nav-hud')) return;

        const hud = document.createElement('div');
        hud.id = 'gspnet-nav-hud';
        hud.style.cssText = `
            position: absolute; bottom: 30px; left: 50%; transform: translateX(-50%);
            background: rgba(30, 39, 46, 0.9); backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.1); border-radius: 16px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5); padding: 15px 25px;
            display: flex; align-items: center; gap: 20px; z-index: 10001;
            color: white; font-family: sans-serif;
        `;

        hud.innerHTML = `
            <div style="text-align: center; border-right: 1px solid rgba(255,255,255,0.2); padding-right: 20px;">
                <div id="nav-hud-speed" style="font-size: 28px; font-weight: bold; color: #0fb9b1;">0</div>
                <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #a4b0be;">km/h</div>
            </div>
            <div style="flex: 1; min-width: 150px;">
                <div id="nav-hud-instruction" style="font-size: 16px; font-weight: bold; margin-bottom: 5px; color: #feca57;">Follow route</div>
                <div style="display: flex; justify-content: space-between; font-size: 13px; color: #a4b0be;">
                    <span id="nav-hud-dist"><i class="fas fa-route"></i> -- km</span>
                    <span id="nav-hud-eta"><i class="far fa-clock"></i> -- min</span>
                </div>
            </div>
            <button id="nav-hud-exit" style="
                background: #ff3f34; color: white; border: none; border-radius: 8px;
                padding: 10px 15px; font-weight: bold; cursor: pointer;
                box-shadow: 0 4px 10px rgba(255,63,52,0.3); transition: all 0.2s;
            ">
                <i class="fas fa-times"></i> EXIT
            </button>
        `;

        document.body.appendChild(hud);
        document.getElementById('nav-hud-exit').addEventListener('click', () => this.stopDriveMode());
    },

    updateNavHUD: function(speedKmh, instruction, totalDist, totalTime) {
        const speedEl = document.getElementById('nav-hud-speed');
        const instEl = document.getElementById('nav-hud-instruction');
        const distEl = document.getElementById('nav-hud-dist');
        const etaEl = document.getElementById('nav-hud-eta');

        if(speedEl && speedKmh !== null) speedEl.textContent = Math.round(speedKmh);
        if(instEl && instruction !== null) instEl.textContent = instruction;
        if(distEl && totalDist !== null && totalDist !== undefined) distEl.innerHTML = `<i class="fas fa-route"></i> ${(totalDist / 1000).toFixed(1)} km`;
        if(etaEl && totalTime !== null && totalTime !== undefined) etaEl.innerHTML = `<i class="far fa-clock"></i> ${Math.round(totalTime / 60)} min`;
    },

    handlePositionUpdate: function(position) {
        const coord = ol.proj.fromLonLat([position.coords.longitude, position.coords.latitude]);
        const heading = position.coords.heading || 0;
        const speed = position.coords.speed || 0; // m/s
        const speedKmh = speed * 3.6;
        
        const view = window.map.getView();
        view.setCenter(coord);
        
        // Auto-rotate map if moving
        if (speed > 1) { // only rotate if actually moving > 1 m/s
            // Convert heading to radians. 
            // In OL, positive rotation is clockwise.
            view.setRotation(-heading * Math.PI / 180);
        }

        this.updateNavHUD(speedKmh, null, null, null);

        // Check for deviation
        this.checkRouteDeviation(coord);

        // Voice Guidance logic
        this.checkAudioTriggers(coord);

        // Check if destination reached
        if (this.endCoord) {
            const line = new ol.geom.LineString([coord, this.endCoord]);
            const distToEnd = Math.round(line.getLength());
            if (distToEnd < 20 && !this.destinationReachedSpoken) {
                this.speak("You have arrived at your destination.");
                this.destinationReachedSpoken = true;
                setTimeout(() => this.stopDriveMode(), 3000);
            }
        }
    },

    checkRouteDeviation: function(currentCoord) {
        if (this.recalculating) return;
        
        const source = this.routeLayer.getSource();
        const features = source.getFeatures();
        if (features.length === 0) return;
        
        const routeGeom = features[0].getGeometry(); // LineString
        const closestPoint = routeGeom.getClosestPoint(currentCoord);
        
        // Calculate distance
        const line = new ol.geom.LineString([currentCoord, closestPoint]);
        const deviation = Math.round(line.getLength()); // rough distance in meters
        
        // If deviation > 50m, recalculate
        if (deviation > 50) {
            console.log('[Routing] Deviated from route by ' + deviation + 'm. Recalculating...');
            this.recalculating = true;
            this.speak("Recalculating route.");
            
            // Set new start to current location
            this.startCoord = currentCoord;
            
            // Recalculate implicitly
            this.calculateRoute().then(() => {
                this.recalculating = false;
            }).catch(() => {
                this.recalculating = false;
            });
        }
    },

    checkAudioTriggers: function(currentCoord) {
        if (!this.steps || this.currentStepIndex >= this.steps.length) return;

        const nextStep = this.steps[this.currentStepIndex];
        if (!nextStep || !nextStep.maneuver) return;

        const maneuverLonLat = nextStep.maneuver.location;
        const maneuverCoord = ol.proj.fromLonLat([maneuverLonLat[0], maneuverLonLat[1]]);
        
        // Distance to next maneuver using OL sphere math
        const line = new ol.geom.LineString([currentCoord, maneuverCoord]);
        const distanceToManeuver = Math.round(line.getLength()); // in meters

        // Update HUD instruction
        this.updateNavHUD(null, `${nextStep.maneuver.instruction || 'Turn'} in ${distanceToManeuver}m`, null, null);

        // Trigger audio when 100 meters away
        if (distanceToManeuver < 100 && !nextStep.spoken) {
            this.speak(nextStep.maneuver.instruction || `Turn in ${distanceToManeuver} meters`);
            nextStep.spoken = true;
            this.currentStepIndex++;
        }
    },

    speak: function(text) {
        if ('speechSynthesis' in window) {
            // Cancel any ongoing speech
            window.speechSynthesis.cancel();
            const msg = new SpeechSynthesisUtterance(text);
            msg.rate = 1.0;
            msg.pitch = 1.0;
            
            // Try to find a male voice
            const voices = window.speechSynthesis.getVoices();
            let maleVoice = voices.find(v => v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('david') || v.name.toLowerCase().includes('guy'));
            if (!maleVoice) {
                // fallback to any english voice if no explicit male voice found
                maleVoice = voices.find(v => v.lang.startsWith('en'));
            }
            if (maleVoice) {
                msg.voice = maleVoice;
            }

            window.speechSynthesis.speak(msg);
        }
    },

    stopDriveMode: function() {
        if (this.watchId) navigator.geolocation.clearWatch(this.watchId);
        
        // Restore UI
        this.ui.goBtn.style.display = 'flex';
        this.ui.cancelBtn.style.display = 'none';

        const hud = document.getElementById('gspnet-nav-hud');
        if(hud) hud.remove();

        // Restore map view
        const view = window.map.getView();
        if (typeof view.setPitch === 'function') view.setPitch(0);
        view.setRotation(0);
        
        // Restore layers
        window.map.getLayers().forEach(l => {
            if (l.get('wasVisibleForRouting')) {
                l.setVisible(true);
                l.set('wasVisibleForRouting', false);
            }
            if (l.get('wasHiddenForRouting')) {
                l.setVisible(false);
                l.set('wasHiddenForRouting', false);
            }
        });
        
        this.speak("Navigation stopped.");
    }
};

// Auto-init when map is ready
const checkMapForRouting = setInterval(() => {
    if (window.map) {
        clearInterval(checkMapForRouting);
        GSPRouting.init();
    }
}, 500);
