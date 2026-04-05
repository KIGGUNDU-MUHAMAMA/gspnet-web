// ============================================
// CONDOMINIUM 3D VIEWER MODULE
// condo-viewer.js
// Dependencies: Three.js r128, OrbitControls
// ============================================

// ============================================
// 1. COORDINATE UTILITIES
// ============================================
var CondoCoordUtils = {
    // Projection definitions for proj4 (if available)
    projDefs: {
        'EPSG:32636': '+proj=utm +zone=36 +datum=WGS84 +units=m +no_defs',
        'EPSG:32637': '+proj=utm +zone=37 +datum=WGS84 +units=m +no_defs',
        'EPSG:21036': '+proj=utm +zone=36 +south +ellps=clrk80 +towgs84=-160,-6,-302 +units=m +no_defs',
        'EPSG:21037': '+proj=utm +zone=37 +south +ellps=clrk80 +towgs84=-160,-6,-302 +units=m +no_defs',
        'EPSG:4326': '+proj=longlat +datum=WGS84 +no_defs'
    },

    /**
     * Convert coordinates from source CRS to WGS84 (EPSG:4326)
     * Uses proj4 if available, otherwise assumes UTM Zone 36N approximation
     */
    toWGS84(easting, northing, sourceCRS) {
        if (typeof proj4 !== 'undefined') {
            try {
                const srcDef = this.projDefs[sourceCRS] || sourceCRS;
                const result = proj4(srcDef, 'EPSG:4326', [easting, northing]);
                return { lon: result[0], lat: result[1] };
            } catch (e) {
                console.warn('[Condo] proj4 conversion failed, using approximation:', e);
            }
        }
        // Fallback: simple UTM Zone 36N approximation for Uganda
        const lon = (easting - 500000) / (111320 * Math.cos(1.0 * Math.PI / 180)) + 33;
        const lat = northing / 110540;
        return { lon, lat };
    },

    /**
     * Convert an array of [E, N] coordinate pairs to GeoJSON polygon
     */
    toGeoJSON(coords, sourceCRS) {
        const ring = coords.map(([e, n]) => {
            const wgs = this.toWGS84(e, n, sourceCRS);
            return [wgs.lon, wgs.lat];
        });
        // Close the ring if not already closed
        if (ring.length > 0) {
            const first = ring[0];
            const last = ring[ring.length - 1];
            if (first[0] !== last[0] || first[1] !== last[1]) {
                ring.push([...first]);
            }
        }
        return {
            type: 'Polygon',
            coordinates: [ring]
        };
    },

    /**
     * Compute polygon area using the Shoelace formula (in source CRS units = m²)
     */
    computeArea(coords) {
        let area = 0;
        const n = coords.length;
        for (let i = 0; i < n; i++) {
            const j = (i + 1) % n;
            area += coords[i][0] * coords[j][1];
            area -= coords[j][0] * coords[i][1];
        }
        return Math.abs(area / 2);
    },

    /**
     * Compute polygon perimeter in meters (assumes coords in meters)
     */
    computePerimeter(coords) {
        let perimeter = 0;
        for (let i = 0; i < coords.length; i++) {
            const j = (i + 1) % coords.length;
            const dx = coords[j][0] - coords[i][0];
            const dy = coords[j][1] - coords[i][1];
            perimeter += Math.sqrt(dx * dx + dy * dy);
        }
        return perimeter;
    },

    /**
     * Generate a unit ID from building prefix, floor, and unit number
     * Format: PREFIX-F01-U01 or PREFIX-B01-U01 for basements
     */
    generateUnitId(prefix, floorNum, unitNum) {
        const floorStr = floorNum < 0
            ? `B${String(Math.abs(floorNum)).padStart(2, '0')}`
            : `F${String(floorNum).padStart(2, '0')}`;
        const unitStr = `U${String(unitNum).padStart(2, '0')}`;
        return `${prefix}-${floorStr}-${unitStr}`;
    },

    /**
     * Generate building prefix from name (first letter of each word, max 4 chars)
     */
    generatePrefix(buildingName) {
        return buildingName
            .split(/\s+/)
            .map(w => w[0])
            .join('')
            .toUpperCase()
            .substring(0, 4);
    },

    /**
     * Normalize coords to be relative to centroid (for 3D rendering)
     * Returns { normalized: [[x,y]...], centerE, centerN, scaleE, scaleN }
     */
    normalizeForViewer(coords) {
        if (!coords || coords.length === 0) return { normalized: [], centerE: 0, centerN: 0 };
        let sumE = 0, sumN = 0;
        coords.forEach(([e, n]) => { sumE += e; sumN += n; });
        const centerE = sumE / coords.length;
        const centerN = sumN / coords.length;
        const normalized = coords.map(([e, n]) => [e - centerE, n - centerN]);
        return { normalized, centerE, centerN };
    }
};

// ============================================
// 2. CSV PARSER
// ============================================
var CondoCSVParser = class CondoCSVParser {

    /**
     * Parse a footprint CSV string
     * Expected columns: point_number, easting, northing
     * Returns: { points: [[E, N], ...], errors: [] }
     */
    static parseFootprintCSV(csvText) {
        const errors = [];
        const points = [];
        const lines = csvText.trim().split(/\r?\n/);

        if (lines.length < 2) {
            errors.push('CSV must have a header row and at least 1 data row');
            return { points, errors };
        }

        const header = lines[0].toLowerCase().replace(/\s+/g, '');
        const cols = header.split(',');

        // Find column indices
        const eidx = cols.findIndex(c => c.includes('easting') || c === 'e' || c === 'x');
        const nidx = cols.findIndex(c => c.includes('northing') || c === 'n' || c === 'y');
        const pidx = cols.findIndex(c => c.includes('point') || c === 'p' || c === 'no' || c === 'number');

        if (eidx === -1) errors.push('Could not find Easting/X column');
        if (nidx === -1) errors.push('Could not find Northing/Y column');
        if (errors.length > 0) return { points, errors };

        const rawPoints = [];
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            const vals = line.split(',');
            const e = parseFloat(vals[eidx]);
            const n = parseFloat(vals[nidx]);
            const p = pidx !== -1 ? parseInt(vals[pidx]) : i;

            if (isNaN(e) || isNaN(n)) {
                errors.push(`Row ${i + 1}: Invalid easting/northing values`);
                continue;
            }
            rawPoints.push({ point: p, easting: e, northing: n });
        }

        // Sort by point number
        rawPoints.sort((a, b) => a.point - b.point);
        rawPoints.forEach(p => points.push([p.easting, p.northing]));

        if (points.length < 3) {
            errors.push('At least 3 points are required to form a polygon');
        }

        return { points, errors };
    }

    /**
     * Parse a unit coordinates CSV string
     * Expected columns: floor_number, unit_number, point_number, easting, northing, description
     * Returns: { floors: [...], summary: {...}, errors: [] }
     */
    static parseUnitCSV(csvText) {
        const errors = [];
        const lines = csvText.trim().split(/\r?\n/);

        if (lines.length < 2) {
            errors.push('CSV must have a header row and at least 1 data row');
            return { floors: [], summary: {}, errors };
        }

        const header = lines[0].toLowerCase().replace(/\s+/g, '');
        const cols = header.split(',');

        // Find column indices
        const fidx = cols.findIndex(c => c.includes('floor') || c === 'f' || c === 'level');
        const uidx = cols.findIndex(c => c.includes('unit') && !c.includes('point') || c === 'u');
        const pidx = cols.findIndex(c => c.includes('point') || c === 'p');
        const eidx = cols.findIndex(c => c.includes('easting') || c === 'e' || c === 'x');
        const nidx = cols.findIndex(c => c.includes('northing') || c === 'n' || c === 'y');
        const didx = cols.findIndex(c => c.includes('desc') || c === 'd');

        if (fidx === -1) errors.push('Could not find Floor Number column');
        if (uidx === -1) errors.push('Could not find Unit Number column');
        if (eidx === -1) errors.push('Could not find Easting/X column');
        if (nidx === -1) errors.push('Could not find Northing/Y column');
        if (errors.length > 0) return { floors: [], summary: {}, errors };

        // Parse all data rows
        const dataPoints = [];
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            const vals = line.split(',');

            const floor = parseInt(vals[fidx]);
            const unit = parseInt(vals[uidx]);
            const point = pidx !== -1 ? parseInt(vals[pidx]) : dataPoints.length + 1;
            const easting = parseFloat(vals[eidx]);
            const northing = parseFloat(vals[nidx]);
            const desc = didx !== -1 ? (vals[didx] || '').trim() : '';

            if (isNaN(floor) || isNaN(unit) || isNaN(easting) || isNaN(northing)) {
                errors.push(`Row ${i + 1}: Invalid numeric values`);
                continue;
            }

            dataPoints.push({ floor, unit, point, easting, northing, description: desc });
        }

        // Group by floor -> unit -> sort by point
        const floorMap = new Map();
        dataPoints.forEach(dp => {
            if (!floorMap.has(dp.floor)) floorMap.set(dp.floor, new Map());
            const unitMap = floorMap.get(dp.floor);
            if (!unitMap.has(dp.unit)) unitMap.set(dp.unit, []);
            unitMap.get(dp.unit).push(dp);
        });

        // Build structured result
        const floors = [];
        let totalUnits = 0;
        let floorsAbove = 0;
        let floorsBelow = 0;

        const sortedFloors = [...floorMap.keys()].sort((a, b) => a - b);
        sortedFloors.forEach(floorNum => {
            if (floorNum > 0) floorsAbove++;
            else floorsBelow++;

            const unitMap = floorMap.get(floorNum);
            const units = [];

            const sortedUnits = [...unitMap.keys()].sort((a, b) => a - b);
            sortedUnits.forEach(unitNum => {
                const points = unitMap.get(unitNum).sort((a, b) => a.point - b.point);
                const coords = points.map(p => [p.easting, p.northing]);
                const descriptions = {};
                points.forEach(p => {
                    if (p.description) descriptions[`P${p.point}`] = p.description;
                });

                units.push({
                    unitNumber: unitNum,
                    points: points,
                    coords: coords,
                    descriptions: descriptions,
                    area: CondoCoordUtils.computeArea(coords),
                    perimeter: CondoCoordUtils.computePerimeter(coords)
                });
                totalUnits++;
            });

            floors.push({
                floorNumber: floorNum,
                floorLabel: floorNum < 0 ? `Basement ${Math.abs(floorNum)}` : `Floor ${floorNum}`,
                units: units
            });
        });

        const summary = {
            totalFloors: floors.length,
            floorsAbove,
            floorsBelow,
            totalUnits,
            message: `Found: ${floors.length} floor${floors.length !== 1 ? 's' : ''} (${floorsAbove} above ground${floorsBelow > 0 ? `, ${floorsBelow} basement` : ''}), ${totalUnits} unit${totalUnits !== 1 ? 's' : ''} total`
        };

        return { floors, summary, errors };
    }
};


// ============================================
// 3. THREE.JS 3D VIEWER
// ============================================
var CondoViewer = class CondoViewer {

    constructor(containerElement) {
        this.container = containerElement;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.buildingGroup = null;
        this.unitMeshes = [];
        this.floorGroups = [];
        this.selectedMesh = null;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.onUnitClickCallback = null;
        this.buildingData = null;
        this.maxFloor = 1;
        this.animationId = null;
        this._boundAnimate = this._animate.bind(this);
        this._boundOnClick = this._onClick.bind(this);
        this._boundOnResize = this._onResize.bind(this);

        this._init();
    }

    _init() {
        const w = this.container.clientWidth;
        const h = this.container.clientHeight || 350;

        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xf4f6f8); // Light architectural background

        // Camera
        this.camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 1000);
        this.camera.position.set(30, 25, 30);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
        this.renderer.setSize(w, h);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.container.appendChild(this.renderer.domElement);

        // Lights
        const ambient = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambient);

        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(20, 30, 20);
        dirLight.castShadow = true;
        this.scene.add(dirLight);

        const hemiLight = new THREE.HemisphereLight(0xadd8e6, 0x444444, 0.3);
        this.scene.add(hemiLight);

        // Ground plane
        const groundGeo = new THREE.PlaneGeometry(200, 200);
        const groundMat = new THREE.MeshStandardMaterial({
            color: 0xe9ecef,
            roughness: 0.9
        });
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.05;
        ground.receiveShadow = true;
        this.scene.add(ground);

        // Grid helper
        const grid = new THREE.GridHelper(100, 50, 0xcbd5e1, 0xe2e8f0);
        grid.position.y = -0.02;
        this.scene.add(grid);

        // OrbitControls
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.08;
        this.controls.minDistance = 5;
        this.controls.maxDistance = 150;
        this.controls.maxPolarAngle = Math.PI * 0.48;

        // Events
        this.renderer.domElement.addEventListener('click', this._boundOnClick);
        window.addEventListener('resize', this._boundOnResize);

        // Start animation
        this._animate();
    }

    _animate() {
        this.animationId = requestAnimationFrame(this._boundAnimate);
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }

    _onResize() {
        const w = this.container.clientWidth;
        const h = this.container.clientHeight || 350;
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(w, h);
    }

    _onClick(event) {
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.unitMeshes, false);

        if (intersects.length > 0) {
            const mesh = intersects[0].object;
            this._selectUnit(mesh);
        }
    }

    _selectUnit(mesh) {
        // Deselect previous
        if (this.selectedMesh && this.selectedMesh.userData._originalColor) {
            this.selectedMesh.material.color.setHex(this.selectedMesh.userData._originalColor);
            this.selectedMesh.material.emissive.setHex(0x000000);
        }

        // Select new
        this.selectedMesh = mesh;
        mesh.userData._originalColor = mesh.userData._originalColor || mesh.material.color.getHex();
        mesh.material.color.setHex(0x2196f3); // Blue highlight
        mesh.material.emissive.setHex(0x0d47a1);
        mesh.material.emissiveIntensity = 0.3;

        if (this.onUnitClickCallback && mesh.userData.unitData) {
            this.onUnitClickCallback(mesh.userData.unitData);
        }
    }

    /**
     * Build 3D model from building data
     * @param {Object} building - Building info with footprint_coords, floors_above, floors_below, floor_to_floor_height
     * @param {Array} units - Array of unit objects with floor_number, unit_coords, unit_id, area_sqm, status, etc.
     */
    buildFromData(building, units) {
        // Clear previous
        if (this.buildingGroup) {
            this.scene.remove(this.buildingGroup);
        }
        this.unitMeshes = [];
        this.floorGroups = [];
        this.selectedMesh = null;
        this.buildingData = building;

        this.buildingGroup = new THREE.Group();

        const floorHeight = building.floor_to_floor_height || 3.0;
        const floorsAbove = building.floors_above || 1;
        const floorsBelow = building.floors_below || 0;
        this.maxFloor = floorsAbove;

        // Normalize footprint to center
        const { normalized: fpNorm } = CondoCoordUtils.normalizeForViewer(building.footprint_coords);

        // Create a 2D shape from footprint
        const fpShape = new THREE.Shape();
        if (fpNorm.length > 0) {
            fpShape.moveTo(fpNorm[0][0], fpNorm[0][1]);
            for (let i = 1; i < fpNorm.length; i++) {
                fpShape.lineTo(fpNorm[i][0], fpNorm[i][1]);
            }
            fpShape.lineTo(fpNorm[0][0], fpNorm[0][1]); // Close
        }

        // Compute center of all units for normalization
        let allUnitCoords = [];
        units.forEach(u => {
            if (u.unit_coords) allUnitCoords = allUnitCoords.concat(u.unit_coords);
        });
        const { centerE, centerN } = CondoCoordUtils.normalizeForViewer(
            building.footprint_coords
        );

        // Draw floors (including basements)
        const startFloor = -floorsBelow;
        const endFloor = floorsAbove;
        const gap = 0.15; // Visual gap between floors

        for (let f = startFloor; f <= endFloor; f++) {
            if (f === 0) continue; // No floor 0
            const floorGroup = new THREE.Group();
            floorGroup.userData.floorNumber = f;

            const yBase = (f < 0 ? f : f - 1) * floorHeight;

            // Floor slab (extruded footprint)
            const slabGeo = new THREE.ExtrudeGeometry(fpShape, {
                depth: 0.2,
                bevelEnabled: false
            });

            const isBasement = f < 0;
            const slabMat = new THREE.MeshStandardMaterial({
                color: isBasement ? 0x5c5c5c : 0xb0bec5,
                transparent: true,
                opacity: 0.35,
                roughness: 0.7,
                side: THREE.DoubleSide
            });

            const slabMesh = new THREE.Mesh(slabGeo, slabMat);
            slabMesh.rotation.x = -Math.PI / 2;
            slabMesh.position.y = yBase;
            floorGroup.add(slabMesh);

            // Floor edge wireframe
            const edgeGeo = new THREE.EdgesGeometry(slabGeo);
            const edgeMat = new THREE.LineBasicMaterial({
                color: isBasement ? 0x888888 : 0x607d8b,
                linewidth: 1
            });
            const edgeLine = new THREE.LineSegments(edgeGeo, edgeMat);
            edgeLine.rotation.x = -Math.PI / 2;
            edgeLine.position.y = yBase;
            floorGroup.add(edgeLine);

            // Units on this floor
            const floorUnits = units.filter(u => u.floor_number === f);
            floorUnits.forEach(unitData => {
                if (!unitData.unit_coords || unitData.unit_coords.length < 3) return;

                // Normalize unit coords to same center as footprint
                const unitNorm = unitData.unit_coords.map(([e, n]) => [e - centerE, n - centerN]);

                // Create unit shape
                const unitShape = new THREE.Shape();
                unitShape.moveTo(unitNorm[0][0], unitNorm[0][1]);
                for (let i = 1; i < unitNorm.length; i++) {
                    unitShape.lineTo(unitNorm[i][0], unitNorm[i][1]);
                }
                unitShape.lineTo(unitNorm[0][0], unitNorm[0][1]);

                // Extrude unit to ~80% of floor height
                const unitGeo = new THREE.ExtrudeGeometry(unitShape, {
                    depth: floorHeight - gap * 2,
                    bevelEnabled: false
                });

                // Color based on status
                let color = 0xef6c00; // Orange = VACANT
                if (unitData.status === 'OCCUPIED') color = 0x2e7d32;   // Green
                if (unitData.status === 'REGISTERED') color = 0x1565c0; // Blue
                if (unitData.status === 'SOLD') color = 0x6a1b9a;      // Purple
                if (isBasement) color = 0x7e57c2; // Lighter purple for basement

                const unitMat = new THREE.MeshStandardMaterial({
                    color: color,
                    transparent: true,
                    opacity: 0.82,
                    roughness: 0.5,
                    metalness: 0.1
                });

                const unitMesh = new THREE.Mesh(unitGeo, unitMat);
                unitMesh.rotation.x = -Math.PI / 2;
                unitMesh.position.y = yBase + gap;
                unitMesh.castShadow = true;
                unitMesh.receiveShadow = true;

                // Store unit data for click interaction
                unitMesh.userData.unitData = unitData;
                unitMesh.userData._originalColor = color;

                floorGroup.add(unitMesh);
                this.unitMeshes.push(unitMesh);

                // Unit edges
                const unitEdgeGeo = new THREE.EdgesGeometry(unitGeo);
                const unitEdgeMat = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 1 });
                const unitEdgeLine = new THREE.LineSegments(unitEdgeGeo, unitEdgeMat);
                unitEdgeLine.rotation.x = -Math.PI / 2;
                unitEdgeLine.position.y = yBase + gap;
                floorGroup.add(unitEdgeLine);

                // Unit label sprite
                this._addUnitLabel(floorGroup, unitData, unitNorm, yBase + floorHeight / 2);
            });

            // Floor number label
            this._addFloorLabel(floorGroup, f, fpNorm, yBase + floorHeight / 2);

            this.buildingGroup.add(floorGroup);
            this.floorGroups.push(floorGroup);
        }

        this.scene.add(this.buildingGroup);

        // Auto-fit camera
        this._fitCameraToBuilding();
    }

    _addUnitLabel(group, unitData, unitNorm, y) {
        // Compute centroid of unit polygon
        let cx = 0, cy = 0;
        unitNorm.forEach(([x, z]) => { cx += x; cy += z; });
        cx /= unitNorm.length;
        cy /= unitNorm.length;

        const labelText = unitData.unit_id || `U${unitData.unit_number}`;
        const areaText = unitData.area_sqm ? `${unitData.area_sqm.toFixed(1)}m²` : '';
        const fullText = areaText ? `${labelText}\n${areaText}` : labelText;

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 128;

        ctx.fillStyle = 'rgba(0,0,0,0)';
        ctx.fillRect(0, 0, 256, 128);

        ctx.font = 'bold 28px Arial';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;

        const lines = fullText.split('\n');
        lines.forEach((line, i) => {
            const ly = 40 + i * 36;
            ctx.strokeText(line, 128, ly);
            ctx.fillText(line, 128, ly);
        });

        const texture = new THREE.CanvasTexture(canvas);
        const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
        const sprite = new THREE.Sprite(spriteMat);
        sprite.position.set(cx, y, cy);
        sprite.scale.set(4, 2, 1);
        group.add(sprite);
    }

    _addFloorLabel(group, floorNum, fpNorm, y) {
        // Position label at edge of footprint
        let maxX = -Infinity;
        let atY = 0;
        fpNorm.forEach(([x, z]) => { if (x > maxX) { maxX = x; atY = z; } });

        const label = floorNum < 0 ? `B${Math.abs(floorNum)}` : `F${floorNum}`;

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 128;
        canvas.height = 64;

        ctx.font = 'bold 36px Arial';
        ctx.fillStyle = '#90caf9';
        ctx.textAlign = 'center';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.strokeText(label, 64, 44);
        ctx.fillText(label, 64, 44);

        const texture = new THREE.CanvasTexture(canvas);
        const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
        const sprite = new THREE.Sprite(spriteMat);
        sprite.position.set(maxX + 3, y, atY);
        sprite.scale.set(3, 1.5, 1);
        group.add(sprite);
    }

    _fitCameraToBuilding() {
        if (!this.buildingGroup) return;

        const bbox = new THREE.Box3().setFromObject(this.buildingGroup);
        const center = new THREE.Vector3();
        bbox.getCenter(center);

        const size = new THREE.Vector3();
        bbox.getSize(size);
        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = this.camera.fov * (Math.PI / 180);
        let dist = maxDim / (2 * Math.tan(fov / 2));
        dist = Math.max(dist * 1.5, 20);

        this.camera.position.set(
            center.x + dist * 0.6,
            center.y + dist * 0.5,
            center.z + dist * 0.6
        );
        this.controls.target.copy(center);
        this.controls.update();
    }

    /**
     * Show floors up to the given number (hides floors above)
     * @param {number} maxFloor - Maximum floor to show (inclusive)
     */
    showFloorsUpTo(maxFloor) {
        this.floorGroups.forEach(group => {
            const f = group.userData.floorNumber;
            if (f <= maxFloor) {
                group.visible = true;
                // Make floors above maxFloor-2 semi-transparent for context
                group.children.forEach(child => {
                    if (child.material && f > maxFloor - 2 && f === maxFloor) {
                        // Keep as-is for the viewed floor
                    }
                });
            } else {
                group.visible = false;
            }
        });
    }

    /**
     * Show all floors
     */
    showAllFloors() {
        this.floorGroups.forEach(group => {
            group.visible = true;
        });
    }

    /**
     * Register callback for unit click events
     */
    onUnitClick(callback) {
        this.onUnitClickCallback = callback;
    }

    /**
     * Clean up all Three.js resources
     */
    dispose() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        this.renderer.domElement.removeEventListener('click', this._boundOnClick);
        window.removeEventListener('resize', this._boundOnResize);

        // Dispose geometries and materials
        this.scene.traverse(child => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(m => m.dispose());
                } else {
                    child.material.dispose();
                }
            }
        });

        this.renderer.dispose();
        if (this.renderer.domElement.parentNode) {
            this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
        }

        this.unitMeshes = [];
        this.floorGroups = [];
        this.selectedMesh = null;
    }
};

// Export globally
window.CondoViewer = CondoViewer;
window.CondoCSVParser = CondoCSVParser;
window.CondoCoordUtils = CondoCoordUtils;
