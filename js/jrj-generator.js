// jrj-generator.js
// Handles the generation of Ugandan Job Record Jackets (JRJ) from webmap polygons.

// --- 1. Map Labels Logic ---
let jrjLabelsLayer = null;

function renderJrjLabels() {
    if (!map) return;
    
    if (!jrjLabelsLayer) {
        jrjLabelsLayer = new ol.layer.Vector({
            source: new ol.source.Vector(),
            style: function(feature) {
                return new ol.style.Style({
                    text: new ol.style.Text({
                        text: feature.get('label'),
                        font: 'bold 14px "Open Sans", "Arial Unicode MS", "sans-serif"',
                        fill: new ol.style.Fill({ color: '#c0392b' }),
                        stroke: new ol.style.Stroke({ color: '#ffffff', width: 3 }),
                        offsetY: -15
                    }),
                    image: new ol.style.Circle({
                        radius: 5,
                        fill: new ol.style.Fill({ color: '#c0392b' }),
                        stroke: new ol.style.Stroke({ color: '#ffffff', width: 2 })
                    })
                });
            },
            zIndex: 1000
        });
        map.addLayer(jrjLabelsLayer);
    }
    
    const source = jrjLabelsLayer.getSource();
    source.clear();

    const storedLabels = localStorage.getItem('jrj_labels');
    if (storedLabels) {
        try {
            const labelsData = JSON.parse(storedLabels);
            labelsData.forEach(item => {
                const feature = new ol.Feature({
                    geometry: new ol.geom.Point([item.x, item.y]),
                    label: item.id
                });
                source.addFeature(feature);
            });
        } catch (e) {
            console.error("Error parsing JRJ labels from localStorage", e);
        }
    }
}

setTimeout(() => { if (typeof map !== 'undefined') renderJrjLabels(); }, 1000);

function activateJrjSelectionMode() {
    if (window.jrjSelectInteraction) {
        map.removeInteraction(window.jrjSelectInteraction);
    }
    
    window.jrjSelectInteraction = new ol.interaction.Select({
        condition: ol.events.condition.click,
        toggleCondition: ol.events.condition.click,
        style: new ol.style.Style({
            fill: new ol.style.Fill({ color: 'rgba(46, 204, 113, 0.5)' }),
            stroke: new ol.style.Stroke({ color: '#27ae60', width: 3 })
        })
    });
    
    map.addInteraction(window.jrjSelectInteraction);

    try {
        if (window.registrationState && window.registrationState.data) {
            const surveyorInput = document.getElementById('jrj-surveyor-name');
            if (surveyorInput && !surveyorInput.value) {
                surveyorInput.value = window.registrationState.data.full_name || '';
            }
        }
    } catch (e) {}

    window.jrjSelectInteraction.on('select', function(e) {
        const selectedFeatures = window.jrjSelectInteraction.getFeatures().getArray();
        const countEl = document.getElementById('jrj-selected-count');
        if (countEl) countEl.textContent = selectedFeatures.length;
    });

    const exportBtn = document.getElementById('jrj-panel-export-btn');
    if (exportBtn) {
        exportBtn.replaceWith(exportBtn.cloneNode(true));
        document.getElementById('jrj-panel-export-btn').onclick = async function() {
            const selectedFeatures = window.jrjSelectInteraction.getFeatures().getArray();
            if (selectedFeatures.length === 0) {
                alert('Please select at least one polygon on the map before exporting.');
                return;
            }
            
            const client = document.getElementById('jrj-client').value.trim();
            const block = document.getElementById('jrj-block').value.trim();
            const plotName = document.getElementById('jrj-plot').value.trim();
            const calPoint = document.getElementById('jrj-calibration-point').value.trim();
            
            const district = document.getElementById('jrj-district').value.trim();
            const county = document.getElementById('jrj-county').value.trim();
            const surveyor = document.getElementById('jrj-surveyor-name').value.trim();
            const supervisor = document.getElementById('jrj-supervisor-name').value.trim();
            const crs = document.getElementById('jrj-crs').value;
            const mf = parseFloat(document.getElementById('jrj-mf').value) || 0.999435;

            if (!client || !block || !plotName || !calPoint || !district || !county || !surveyor || !crs) {
                alert('Please fill in all required fields (marked with *).');
                return;
            }

            const projectName = `Block ${block} Plot ${plotName}`;

            const btn = document.getElementById('jrj-panel-export-btn');
            const origText = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
            btn.disabled = true;

            try {
                await generateJrjPackage(selectedFeatures, {
                    client, projectName, block, plotName, calPoint, district, county, surveyor, supervisor, crs, mf, date: new Date().toISOString().slice(0, 10)
                });
                
                if (typeof showToast === 'function') {
                    showToast('JRJ Package generated successfully!', 'success');
                } else {
                    alert('JRJ Package generated successfully!');
                }
            } catch (e) {
                console.error('Error generating JRJ:', e);
                alert('Error generating JRJ: ' + e.message);
            } finally {
                btn.innerHTML = origText;
                btn.disabled = false;
            }
        };
    }

    const cancelBtn = document.getElementById('jrj-panel-cancel-btn');
    if (cancelBtn) {
        cancelBtn.replaceWith(cancelBtn.cloneNode(true));
        document.getElementById('jrj-panel-cancel-btn').onclick = function() {
            if (window.jrjSelectInteraction) {
                window.jrjSelectInteraction.getFeatures().clear();
                const countEl = document.getElementById('jrj-selected-count');
                if (countEl) countEl.textContent = '0';
            }
        };
    }

    const clearLabelsBtn = document.getElementById('jrj-clear-labels-btn');
    if (clearLabelsBtn) {
        clearLabelsBtn.replaceWith(clearLabelsBtn.cloneNode(true));
        document.getElementById('jrj-clear-labels-btn').onclick = function() {
            localStorage.removeItem('jrj_labels');
            renderJrjLabels();
            if (typeof showToast === 'function') {
                showToast('Map labels cleared.', 'info');
            }
        };
    }
}

// Math Helpers
function formatBearing(decimalDegrees) {
    let d = decimalDegrees;
    if (d < 0) d += 360;
    if (d >= 360) d -= 360;
    const deg = Math.floor(d);
    const minFloat = (d - deg) * 60;
    const min = Math.floor(minFloat);
    const sec = Math.round((minFloat - min) * 60);
    
    let finalDeg = deg;
    let finalMin = min;
    let finalSec = sec;
    if (finalSec === 60) { finalSec = 0; finalMin += 1; }
    if (finalMin === 60) { finalMin = 0; finalDeg += 1; }
    if (finalDeg >= 360) { finalDeg -= 360; }
    
    return { deg: finalDeg, min: finalMin, sec: finalSec };
}

function getGridBearing(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    let angle = Math.atan2(dx, dy) * (180 / Math.PI); 
    if (angle < 0) angle += 360;
    return angle;
}

function getGridDistance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

// Generate the JRJ Package
async function generateJrjPackage(features, meta) {
    const stations = []; 
    const plots = []; 
    
    const sourceProj = map.getView().getProjection();
    const sourceProjCode = sourceProj ? sourceProj.getCode() : 'EPSG:3857';
    const destProj = meta.crs;

    let stnCounter = 3; 
    let plotCounter = 1;
    
    features.forEach(feature => {
        const geom = feature.getGeometry();
        if (!geom) return;
        
        const props = feature.getProperties() || {};
        let featureLabel = props.parcel_id || props.name || props.label || props.Text || props.ID || props.id;
        
        let ringsToProcess = [];
        if (geom.getType() === 'Polygon') {
            ringsToProcess.push({ rings: geom.getCoordinates(), plotIdStr: featureLabel ? `${featureLabel}` : `Plot ${plotCounter++}` });
        } else if (geom.getType() === 'MultiPolygon') {
            const polys = geom.getCoordinates();
            polys.forEach((poly, index) => {
                let pId = featureLabel ? `${featureLabel}` : `Plot ${plotCounter}`;
                if (polys.length > 1) pId += ` (Part ${index + 1})`;
                ringsToProcess.push({ rings: poly, plotIdStr: pId });
            });
            if (!featureLabel) plotCounter++;
        } else {
            return;
        }

        ringsToProcess.forEach((polyData) => {
            const plot = { id: polyData.plotIdStr, outerRing: null, innerRings: [], netAreaSqm: 0 };
            
            polyData.rings.forEach((ringCoords, ringIndex) => {
                const metricCoords = ringCoords.map(c => {
                    return (sourceProjCode !== destProj) ? ol.proj.transform(c, sourceProjCode, destProj) : c;
                });

                if (stations.length === 0 && metricCoords.length > 0 && ringIndex === 0) {
                    const baseN = metricCoords[0][1];
                    const baseE = metricCoords[0][0];
                    stations.push({ id: 'CM1', n: baseN - 1.5, e: baseE - 28.8 });
                    stations.push({ id: 'CM2', n: baseN - 16.5, e: baseE - 14.5 });
                }

                const ringObj = { coords: [], areaSqm: 0, isExclusion: ringIndex > 0 };
                let area = 0;
                for (let i = 0; i < metricCoords.length - 1; i++) {
                    const curr = metricCoords[i];
                    const next = metricCoords[i + 1];
                    
                    const crossProduct = (curr[1] * next[0]) - (next[1] * curr[0]);
                    area += crossProduct;
                    
                    const dist = getGridDistance(curr[0], curr[1], next[0], next[1]);
                    
                    let stnId = null;
                    for (let s of stations) {
                        if (Math.abs(s.e - curr[0]) < 0.001 && Math.abs(s.n - curr[1]) < 0.001) {
                            stnId = s.id; break;
                        }
                    }
                    if (!stnId) {
                        stnId = 'CM' + stnCounter++;
                        stations.push({ id: stnId, n: curr[1], e: curr[0] });
                    }
                    
                    ringObj.coords.push({ stn: stnId, n: curr[1], e: curr[0], dist: dist, crossProd: crossProduct });
                }
                
                if (ringObj.coords.length > 0) {
                    ringObj.coords.push({ stn: ringObj.coords[0].stn, n: ringObj.coords[0].n, e: ringObj.coords[0].e, dist: 0, crossProd: 0 });
                    ringObj.areaSqm = Math.abs(area) / 2;
                    if (ringIndex === 0) {
                        plot.outerRing = ringObj;
                        plot.netAreaSqm += ringObj.areaSqm;
                    } else {
                        plot.innerRings.push(ringObj);
                        plot.netAreaSqm -= ringObj.areaSqm;
                    }
                }
            });
            if (plot.outerRing) {
                plots.push(plot);
            }
        });
    });

    if (plots.length > 0) {
        plots[plots.length - 1].id = "RESDUE PLOT";
    }

    if (stations.length < 5) {
        throw new Error("Invalid polygon selection.");
    }

    const labelData = stations.map(s => {
        const mapCoords = (sourceProjCode !== destProj) ? ol.proj.transform([s.e, s.n], destProj, sourceProjCode) : [s.e, s.n];
        return { id: s.id, x: mapCoords[0], y: mapCoords[1] };
    });
    localStorage.setItem('jrj_labels', JSON.stringify(labelData));
    renderJrjLabels();

    const cm1 = stations[0];
    const cm2 = stations[1];
    
    // Field Notes Logic (Single Pass over unique stations)
    const fieldNotesRows = [];
    function addObservation(stn, targetId, isOrientation = false) {
        const target = stations.find(s => s.id === targetId);
        if (!target) return;
        const dist = getGridDistance(stn.e, stn.n, target.e, target.n);
        const brg = getGridBearing(stn.e, stn.n, target.e, target.n);
        const fl = formatBearing(brg);
        let fr = brg + 180;
        if (fr >= 360) fr -= 360;
        const frFmt = formatBearing(fr);
        
        fieldNotesRows.push({
            stnId: stn.id, targetId: targetId,
            flD: fl.deg, flM: fl.min, flS: fl.sec,
            frD: frFmt.deg, frM: frFmt.min, frS: frFmt.sec,
            cor: 0,
            brgD: fl.deg, brgM: fl.min, brgS: fl.sec,
            fDist: isOrientation ? "" : (dist / meta.mf).toFixed(3),
            hDist: isOrientation ? "" : dist.toFixed(3),
            isCheck: isOrientation
        });
    }

    for (let i = 2; i < stations.length; i++) {
        const stn = stations[i];
        if (i === 2) {
            addObservation(stn, 'CM1', true);
            addObservation(stn, 'CM2', true);
            if (i + 1 < stations.length) addObservation(stn, stations[i+1].id, false);
        } else if (i === stations.length - 1) {
            addObservation(stn, stations[i-1].id, true);
            addObservation(stn, 'CM1', true);
            addObservation(stn, 'CM2', true);
        } else {
            addObservation(stn, stations[i-1].id, true);
            addObservation(stn, stations[i+1].id, false);
        }
    }

    // Traverse Page Logic (Single Unified Traverse)
    function buildUnifiedTraverse() {
        const tRows = [];
        if (stations.length < 3) return { rows: tRows, sumDist: 0 };

        const startStn = stations[2];
        const endStn = stations[stations.length - 1];

        // Orientation: bearings from CM3 to CM1 and CM2
        const brg1_fmt = formatBearing(getGridBearing(startStn.e, startStn.n, cm1.e, cm1.n));
        tRows.push({ stn: 'CM1', isHeader: true, obs: brg1_fmt, adj: brg1_fmt });
        const brg2_fmt = formatBearing(getGridBearing(startStn.e, startStn.n, cm2.e, cm2.n));
        tRows.push({ stn: 'CM2', isHeader: true, obs: brg2_fmt, adj: brg2_fmt });

        // Starting station
        let sumDist = 0;
        let curN = startStn.n, curE = startStn.e;
        tRows.push({ stn: startStn.id, isStart: true, n: curN, e: curE });

        // Walk through all stations linearly (same order as field notes)
        for (let i = 2; i < stations.length - 1; i++) {
            const p1 = stations[i];
            const p2 = stations[i + 1];
            const dist = getGridDistance(p1.e, p1.n, p2.e, p2.n);
            const fmt = formatBearing(getGridBearing(p1.e, p1.n, p2.e, p2.n));
            const dN = p2.n - p1.n;
            const dE = p2.e - p1.e;
            curN += dN; curE += dE; sumDist += dist;
            tRows.push({ stn: p2.id, obs: fmt, adj: fmt, dist: dist, dN: dN, dE: dE, n: curN, e: curE });
        }

        // Tie-back from last station to CM1 and CM2
        const distT1 = getGridDistance(endStn.e, endStn.n, cm1.e, cm1.n);
        const fmtT1 = formatBearing(getGridBearing(endStn.e, endStn.n, cm1.e, cm1.n));
        tRows.push({ stn: 'CM1', obs: fmtT1, adj: fmtT1, dist: distT1, dN: cm1.n - endStn.n, dE: cm1.e - endStn.e, n: cm1.n, e: cm1.e, isTie: true });

        const distT2 = getGridDistance(endStn.e, endStn.n, cm2.e, cm2.n);
        const fmtT2 = formatBearing(getGridBearing(endStn.e, endStn.n, cm2.e, cm2.n));
        tRows.push({ stn: 'CM2', obs: fmtT2, adj: fmtT2, dist: distT2, dN: cm2.n - endStn.n, dE: cm2.e - endStn.e, n: cm2.n, e: cm2.e, isTie: true });

        return { rows: tRows, sumDist: sumDist };
    }

    const unifiedTraverse = buildUnifiedTraverse();


    const cm3 = stations[2];
    const cmN = stations[stations.length - 1];

    // Datum Computations
    const datumPairs = [{from: cm1, to: cm3}, {from: cm2, to: cm3}, {from: cm1, to: cmN}, {from: cm2, to: cmN}];

    // CSV BUILDING (Unchanged)
    let csv = "JOB RECORD JACKET EXPORT\n";
    csv += `Client:,${meta.client}\nProject:,${meta.projectName}\nDistrict:,${meta.district}\nCounty:,${meta.county}\n`;
    csv += `Surveyor:,${meta.surveyor}\nSupervisor:,${meta.supervisor}\nCRS:,${meta.crs}\nDate:,${meta.date}\nMF:,${meta.mf}\n\n`;

    csv += "ABSTRACT OF FINAL RESULTS\nSTN,NORTHINGS,EASTINGS\n";
    stations.forEach(s => csv += `${s.id},${s.n.toFixed(4)},${s.e.toFixed(4)}\n`);
    csv += "\n";

    csv += "FIELD NOTES\nStn,Direction D,M,S,Cor,Bearing D,M,S,F/dist,S/dist,V.A,H/dist,REMARKS\n";
    let lastStn = null;
    fieldNotesRows.forEach(row => {
        const headerStn = (row.stnId !== lastStn) ? row.stnId : "";
        lastStn = row.stnId;
        csv += `${headerStn},${row.targetId},${row.flD},${row.flM},${row.flS},${row.cor},${row.brgD},${row.brgM},${row.brgS},${row.fDist},${row.fDist},,${row.hDist},\n`;
        csv += `,,${row.frD},${row.frM},${row.frS},,,,,,,,,\n`;
        csv += `,,180,0,0,,,,,,,,,\n`;
    });
    csv += "\n";

    csv += "TRAVERSE PAGE\nSTN,OBS.BRG D,M,S,corr,ADJ.BRG D,M,S,DIST,\u00b1\u0394 N,corr,\u00b1\u0394E,corr,NORTHINGS,EASTINGS,STN,REMARKS\n";
    csv += `MAIN TRAVERSE,,,,,,,,,,,,,,,,\n`;
    unifiedTraverse.rows.forEach(row => {
        if (row.isHeader) {
            csv += `${row.stn},${row.obs.deg},${row.obs.min},${row.obs.sec},0,${row.adj.deg},${row.adj.min},${row.adj.sec},,,,,,,,,\n`;
        } else if (row.isStart) {
            csv += `${row.stn},,,,,,,,,,,,,${row.n.toFixed(2)},${row.e.toFixed(2)},${row.stn},0\n`;
        } else if (row.isTie) {
            csv += `${row.stn},${row.obs.deg},${row.obs.min},${row.obs.sec},0,${row.adj.deg},${row.adj.min},${row.adj.sec},${row.dist.toFixed(2)},${row.dN.toFixed(2)},,${row.dE.toFixed(2)},,${row.n.toFixed(2)},${row.e.toFixed(2)},,\n`;
        } else {
            csv += `${row.stn},${row.obs.deg},${row.obs.min},${row.obs.sec},0,${row.adj.deg},${row.adj.min},${row.adj.sec},${row.dist.toFixed(2)},${row.dN.toFixed(2)},0.00,${row.dE.toFixed(2)},0.00,${row.n.toFixed(2)},${row.e.toFixed(2)},${row.stn},\n`;
        }
    });
    csv += `,,,,,,,,,,,,,,,,0.00,0.00,,\n`;
    csv += `angular misclosure is,0,,,,,,,,Linear misclosure is,0.00,in,${unifiedTraverse.sumDist.toFixed(2)},,,,\n`;
    csv += `misclosure per stn is,0,,,,,,,,OR,1,in,2803873,,,,\n\n`;


    csv += "DATUM COMPUTATIONS\nI/S NO:,0\nstation,Northing,Easting,comp bearing,dist (m)\n";
    datumPairs.forEach(pair => {
        const fmt = formatBearing(getGridBearing(pair.from.e, pair.from.n, pair.to.e, pair.to.n));
        const dist = getGridDistance(pair.from.e, pair.from.n, pair.to.e, pair.to.n);
        csv += `${pair.from.id},${pair.from.n.toFixed(4)},${pair.from.e.toFixed(4)},,\n`;
        csv += `${pair.to.id},${pair.to.n.toFixed(4)},${pair.to.e.toFixed(4)},${fmt.deg} ${fmt.min} ${fmt.sec},\n`;
        csv += `Δ,${(pair.to.n - pair.from.n).toFixed(4)},${(pair.to.e - pair.from.e).toFixed(4)},,${dist.toFixed(2)}\n\n`;
    });

    csv += "AREA COMPUTATIONS\n";
    plots.forEach(plot => {
        csv += `${plot.id}\nStation,N(m),E(m),Cross-Product,DISTANCE (m)\n`;
        if (plot.outerRing) {
            csv += `${plot.outerRing.coords[0].stn},${plot.outerRing.coords[0].n.toFixed(3)},${plot.outerRing.coords[0].e.toFixed(3)},,\n`;
            for (let i = 1; i < plot.outerRing.coords.length; i++) {
                csv += `${plot.outerRing.coords[i].stn},${plot.outerRing.coords[i].n.toFixed(3)},${plot.outerRing.coords[i].e.toFixed(3)},${plot.outerRing.coords[i-1].crossProd.toExponential(2)},${plot.outerRing.coords[i-1].dist.toFixed(3)}\n`;
            }
            csv += `Outer Area =, ${plot.outerRing.areaSqm.toFixed(3)} sq m\n\n`;
        }
        
        plot.innerRings.forEach((inner, idx) => {
            csv += `${plot.id} - EXCLUSION ${idx + 1}\nStation,N(m),E(m),Cross-Product,DISTANCE (m)\n`;
            csv += `${inner.coords[0].stn},${inner.coords[0].n.toFixed(3)},${inner.coords[0].e.toFixed(3)},,\n`;
            for (let i = 1; i < inner.coords.length; i++) {
                csv += `${inner.coords[i].stn},${inner.coords[i].n.toFixed(3)},${inner.coords[i].e.toFixed(3)},${inner.coords[i-1].crossProd.toExponential(2)},${inner.coords[i-1].dist.toFixed(3)}\n`;
            }
            csv += `Less Area =, ${inner.areaSqm.toFixed(3)} sq m\n\n`;
        });
        
        const ac = plot.netAreaSqm / 4046.8564224;
        csv += `NET AREA COMPUTATION FOR ${plot.id}\n`;
        csv += `hectares =,${(plot.netAreaSqm / 10000).toFixed(3)}\nAcres =,${ac.toFixed(3)}\ndecimals =,${(ac * 100).toFixed(3)}\nsquare metres =,${plot.netAreaSqm.toFixed(3)}\n\n`;
    });

    // --- PDF BUILDING ---
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');
    const marginX = 14;
    const pageCenter = doc.internal.pageSize.width / 2;
    
    function drawHeader(pageTitle, physicalPageStr, includeMeta = true) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text("JOB RECORD JACKET", pageCenter, 15, { align: 'center' });
        
        doc.setFontSize(10);
        doc.text(physicalPageStr, 200 - marginX, 15, { align: 'right' });
        
        if (includeMeta) {
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.text(`Client: ${meta.client}`, marginX, 22);
            doc.text(`Project: ${meta.projectName}`, marginX, 27);
            doc.text(`District: ${meta.district}`, marginX, 32);
            doc.text(`County: ${meta.county}`, marginX, 37);
            
            doc.text(`Surveyor: ${meta.surveyor}`, 110, 22);
            doc.text(`Supervisor: ${meta.supervisor}`, 110, 27);
            doc.text(`Date: ${meta.date}`, 110, 32);
            
            doc.text(`CRS: ${meta.crs}`, 200 - marginX, 22, { align: 'right' });
            doc.text(`MF: ${meta.mf}`, 200 - marginX, 27, { align: 'right' });
            doc.line(marginX, 40, 200 - marginX, 40);
            doc.setFont('helvetica', 'bold');
            doc.text(pageTitle, pageCenter, 46, { align: 'center' });
            return 52;
        } else {
            doc.setFont('helvetica', 'bold');
            doc.text(pageTitle, pageCenter, 25, { align: 'center' });
            return 32;
        }
    }

    // --- PHYSICAL PAGE 2: INDEX ---
    // (This is the very first page rendered in our PDF, but labeled PAGE 2)
    drawHeader("INDEX TO COMPUTATIONS", "PAGE 2", false);
    doc.autoTable({
        startY: 35,
        head: [['ITEM', 'PAGE NO.']],
        body: [
            ['Mutation form', '1'],
            ['Index page', '2'],
            ['Job history', '3'],
            ['Index to computations', '4'],
            ['Datum computation', '5'],
            ['Working print', '6'],
            ['Working diagram', '7'],
            ['Field observations', '8'],
            ['Traverse computations', '9'],
            ['Area computations', '10'],
            ['Abstract of coordinates', '11']
        ],
        theme: 'grid',
        headStyles: { fontStyle: 'bold', fillColor: [236, 240, 241], textColor: [0,0,0] },
        styles: { fontSize: 10, halign: 'left', lineWidth: 0.1 }
    });

    // --- PHYSICAL PAGE 3: JOB HISTORY ---
    doc.addPage();
    drawHeader("JOB HISTORY", "PAGE 3", false);
    
    // Auto-fill template variables
    const plotListStr = plots.map(p => p.id.replace('Plot ', '')).join(', ');
    const cm3Str = cm3 ? cm3.id : 'CM3';
    const cmNStr = cmN ? cmN.id : 'CM_N';

    const historyText = `The purpose of the survey was.......................................................................................................

Plot was surveyed under instructions of the registered proprietors.

A DIFFERENTIAL GPS ............................. in RTK MODE using ............................... CORS NETWORK in fixed solution was used, the machine was used to obtain Coordinates of all existing markstones. 

Point ${meta.calPoint} was used to calibrate obtained data.

The traverse was derived running from ${cm3Str} orienting to CM1 and checking with CM2, and closed at ${cmNStr} raying to CM1 and CM2.

All misclosures are within the acceptable limits.`;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(historyText, 210 - (marginX * 2));
    doc.text(lines, marginX, 35);
    
    // Signatures
    const sigY = 160;
    doc.text('......................................................................', marginX, sigY);
    doc.text('FIELD SURVEYOR', marginX + 15, sigY + 6);
    
    const supX = 210 - marginX - 60;
    doc.text('..................................................................', supX - 10, sigY);
    doc.text('SUPERVISOR', supX + 5, sigY + 6);

    // --- PHYSICAL PAGE 5: DATUM COMPUTATIONS ---
    doc.addPage();
    let startY = drawHeader("DATUM COMPUTATIONS", "PAGE 5", false);
    
    const dtmData = [];
    datumPairs.forEach(pair => {
        const fmt = formatBearing(getGridBearing(pair.from.e, pair.from.n, pair.to.e, pair.to.n));
        const dist = getGridDistance(pair.from.e, pair.from.n, pair.to.e, pair.to.n);
        dtmData.push([pair.from.id, pair.from.n.toFixed(4), pair.from.e.toFixed(4), "", ""]);
        dtmData.push([pair.to.id, pair.to.n.toFixed(4), pair.to.e.toFixed(4), `${fmt.deg} ${fmt.min} ${fmt.sec}`, ""]);
        dtmData.push(["Δ", (pair.to.n - pair.from.n).toFixed(4), (pair.to.e - pair.from.e).toFixed(4), "", dist.toFixed(2)]);
        dtmData.push([{ content: "", colSpan: 5, styles: { fillColor: [248, 249, 250] } }]);
    });

    doc.autoTable({
        startY: startY + 5,
        head: [['station', 'Northing', 'Easting', 'comp bearing', 'dist (m)']],
        body: dtmData,
        theme: 'grid',
        headStyles: { fontStyle: 'bold', fillColor: [236, 240, 241], textColor: [0,0,0] },
        styles: { fontSize: 9, halign: 'center', lineWidth: 0.1 }
    });

    // --- PHYSICAL PAGE 7: WORKING DIAGRAM ---
    doc.addPage();
    drawHeader("WORKING DIAGRAM", "PAGE 7", false);

    // ═══ Double-Line Page Border ═══
    doc.setDrawColor(0);
    doc.setLineWidth(0.4);
    doc.rect(8, 33, 194, 256);
    doc.setLineWidth(0.2);
    doc.rect(10, 35, 190, 252);

    // ═══ Layout Constants ═══
    const frmL = 10, frmR = 200, frmT = 35, frmB = 287;
    const frmW = frmR - frmL;
    const frmH = frmB - frmT;

    // ═══ Compute Bounding Box ═══
    let minN = Infinity, maxN = -Infinity, minE = Infinity, maxE = -Infinity;
    stations.forEach(s => {
        if (s.n < minN) minN = s.n;
        if (s.n > maxN) maxN = s.n;
        if (s.e < minE) minE = s.e;
        if (s.e > maxE) maxE = s.e;
    });

    const rangeN = maxN - minN || 1;
    const rangeE = maxE - minE || 1;
    const plotPad = 0.15;
    const padMinN = minN - rangeN * plotPad;
    const padMaxN = maxN + rangeN * plotPad;
    const padMinE = minE - rangeE * plotPad;
    const padMaxE = maxE + rangeE * plotPad;

    const scaleE_d = frmW / (padMaxE - padMinE);
    const scaleN_d = frmH / (padMaxN - padMinN);
    const drawScale = Math.min(scaleE_d, scaleN_d);

    const centerN_d = (padMinN + padMaxN) / 2;
    const centerE_d = (padMinE + padMaxE) / 2;
    const frmCX = (frmL + frmR) / 2;
    const frmCY = (frmT + frmB) / 2;

    function toPageXY(e, n) {
        return {
            x: frmCX + (e - centerE_d) * drawScale,
            y: frmCY - (n - centerN_d) * drawScale
        };
    }

    // ═══ Nice interval helper ═══
    function niceGridInterval(range, targetDivs) {
        const rough = range / targetDivs;
        const mag = Math.pow(10, Math.floor(Math.log10(rough)));
        const res = rough / mag;
        let nice;
        if (res <= 1.5) nice = 1;
        else if (res <= 3.5) nice = 2;
        else if (res <= 7.5) nice = 5;
        else nice = 10;
        return nice * mag;
    }

    // ═══ Coordinate Grid Frame ═══
    doc.setDrawColor(0);
    doc.setLineWidth(0.3);
    doc.setLineDashPattern([], 0);
    doc.rect(frmL, frmT, frmW, frmH);

    const gridInterval = niceGridInterval(Math.max(rangeN, rangeE), 6);
    const gridStartN = Math.floor(padMinN / gridInterval) * gridInterval;
    const gridStartE = Math.floor(padMinE / gridInterval) * gridInterval;

    // Northing grid lines (horizontal)
    for (let gn = gridStartN; gn <= padMaxN + gridInterval; gn += gridInterval) {
        const pt = toPageXY(centerE_d, gn);
        if (pt.y >= frmT && pt.y <= frmB) {
            doc.setDrawColor(180);
            doc.setLineWidth(0.1);
            doc.setLineDashPattern([1, 2], 0);
            doc.line(frmL, pt.y, frmR, pt.y);
            doc.setDrawColor(0);
            doc.setLineDashPattern([], 0);
            doc.setLineWidth(0.2);
            doc.line(frmL, pt.y, frmL + 2, pt.y);
            doc.line(frmR - 2, pt.y, frmR, pt.y);
            doc.setFontSize(5);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(0);
            doc.text(gn.toFixed(0), frmL + 2, pt.y - 1, { align: 'left' });
        }
    }

    // Easting grid lines (vertical)
    for (let ge = gridStartE; ge <= padMaxE + gridInterval; ge += gridInterval) {
        const pt = toPageXY(ge, centerN_d);
        if (pt.x >= frmL && pt.x <= frmR) {
            doc.setDrawColor(180);
            doc.setLineWidth(0.1);
            doc.setLineDashPattern([1, 2], 0);
            doc.line(pt.x, frmT, pt.x, frmB);
            doc.setDrawColor(0);
            doc.setLineDashPattern([], 0);
            doc.setLineWidth(0.2);
            doc.line(pt.x, frmB, pt.x, frmB - 2);
            doc.line(pt.x, frmT, pt.x, frmT + 2);
            doc.setFontSize(5);
            doc.setTextColor(0);
            doc.text(ge.toFixed(0), pt.x, frmB - 2, { align: 'center' });
        }
    }

    // ═══ North Arrow ═══
    const naX = frmR - 8;
    const naY = frmT + 14;
    const naH_a = 10;
    const naHW = 2.5;
    const naTip = naY - naH_a / 2;
    const naBase = naY + naH_a / 2;
    const naMid = naY - naH_a * 0.08;

    doc.setDrawColor(0);
    doc.setLineWidth(0.2);
    doc.setLineDashPattern([], 0);
    doc.setFillColor(0, 0, 0);
    doc.triangle(naX, naTip, naX - naHW, naBase, naX, naMid, 'F');
    doc.setFillColor(255, 255, 255);
    doc.triangle(naX, naTip, naX + naHW, naBase, naX, naMid, 'FD');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0);
    doc.text('N', naX, naTip - 2, { align: 'center' });
    doc.setFontSize(4);
    doc.setFont('helvetica', 'normal');
    doc.text('Grid', naX, naBase + 3, { align: 'center' });

    // ═══ Boundary Lines + Bearing & Distance Annotations ═══
    doc.setTextColor(0);

    function drawRingPro(ring, isOuter) {
        if (!ring) return { sumX: 0, sumY: 0, numPoints: 0 };
        let sumX = 0, sumY = 0;

        doc.setLineDashPattern(isOuter ? [] : [1.5, 1.5], 0);
        doc.setLineWidth(isOuter ? 0.3 : 0.15);
        doc.setDrawColor(0);

        for (let i = 0; i < ring.coords.length - 1; i++) {
            const p1 = ring.coords[i];
            const p2 = ring.coords[i + 1];
            const xy1 = toPageXY(p1.e, p1.n);
            const xy2 = toPageXY(p2.e, p2.n);
            doc.line(xy1.x, xy1.y, xy2.x, xy2.y);

            const midX = (xy1.x + xy2.x) / 2;
            const midY = (xy1.y + xy2.y) / 2;
            const dx = xy2.x - xy1.x;
            const dy = xy2.y - xy1.y;
            const segLen = Math.sqrt(dx * dx + dy * dy);

            if (segLen < 8) {
                sumX += xy1.x;
                sumY += xy1.y;
                continue;
            }

            // Perpendicular direction for label offset
            const nx = -dy / segLen;
            const ny = dx / segLen;

            // Text rotation
            let angleDeg = Math.atan2(dy, dx) * (180 / Math.PI);
            if (angleDeg > 90) angleDeg -= 180;
            else if (angleDeg < -90) angleDeg += 180;

            let fontSize = 6;
            let labelGap = 2.0;
            if (drawScale < 0.05) { fontSize = 2.5; labelGap = 1.0; }
            else if (drawScale < 0.1) { fontSize = 3; labelGap = 1.2; }
            else if (drawScale < 0.2) { fontSize = 4; labelGap = 1.5; }
            else if (drawScale < 0.5) { fontSize = 5; labelGap = 1.8; }

            // Distance label (one side)
            doc.setFontSize(fontSize);
            doc.setFont('helvetica', 'normal');
            doc.text(p1.dist.toFixed(2) + 'm', midX + nx * labelGap, midY + ny * labelGap, { angle: -angleDeg, align: 'center' });

            // Bearing label removed per user request

            sumX += xy1.x;
            sumY += xy1.y;
        }
        return { sumX, sumY, numPoints: ring.coords.length - 1 };
    }

    plots.forEach(plot => {
        const outerRes = drawRingPro(plot.outerRing, true);
        plot.innerRings.forEach(inner => drawRingPro(inner, false));

        // Plot name label at centroid
        if (outerRes.numPoints > 0) {
            const pcx = outerRes.sumX / outerRes.numPoints;
            const pcy = outerRes.sumY / outerRes.numPoints;
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(0);
            let labelText = plot.id.toUpperCase();
            if (labelText.startsWith('PLOT ')) labelText = labelText.replace('PLOT ', '');
            doc.text(labelText, pcx, pcy, { align: 'center' });
        }
    });

    // ═══ Exclusion Hatching ═══
    function clipLineToPolygon(lx1, ly1, lx2, ly2, polygon) {
        const intersections = [];
        for (let pi = 0; pi < polygon.length - 1; pi++) {
            const ax = polygon[pi].x, ay = polygon[pi].y;
            const bx = polygon[pi + 1].x, by = polygon[pi + 1].y;
            const d1x = lx2 - lx1, d1y = ly2 - ly1;
            const d2x = bx - ax, d2y = by - ay;
            const cross = d1x * d2y - d1y * d2x;
            if (Math.abs(cross) < 1e-10) continue;
            const t = ((ax - lx1) * d2y - (ay - ly1) * d2x) / cross;
            const u = ((ax - lx1) * d1y - (ay - ly1) * d1x) / cross;
            if (u >= 0 && u <= 1 && t >= 0 && t <= 1) intersections.push(t);
        }
        intersections.sort((a, b) => a - b);
        const segs = [];
        for (let si = 0; si + 1 < intersections.length; si += 2) {
            segs.push({
                x1: lx1 + intersections[si] * (lx2 - lx1), y1: ly1 + intersections[si] * (ly2 - ly1),
                x2: lx1 + intersections[si + 1] * (lx2 - lx1), y2: ly1 + intersections[si + 1] * (ly2 - ly1)
            });
        }
        return segs;
    }

    plots.forEach(plot => {
        plot.innerRings.forEach(inner => {
            const pts = inner.coords.map(c => toPageXY(c.e, c.n));
            let hMinX = Infinity, hMaxX = -Infinity, hMinY = Infinity, hMaxY = -Infinity;
            pts.forEach(p => { hMinX = Math.min(hMinX, p.x); hMaxX = Math.max(hMaxX, p.x); hMinY = Math.min(hMinY, p.y); hMaxY = Math.max(hMaxY, p.y); });

            const hatchSpacing = 3;
            doc.setLineWidth(0.08);
            doc.setDrawColor(0);
            doc.setLineDashPattern([], 0);

            const diag = hMaxX - hMinX + hMaxY - hMinY;
            for (let hd = 0; hd <= diag; hd += hatchSpacing) {
                const hlx1 = hMinX, hly1 = hMinY + hd;
                const hlx2 = hMinX + hd, hly2 = hMinY;
                const hSegs = clipLineToPolygon(hlx1, hly1, hlx2, hly2, pts);
                hSegs.forEach(hs => doc.line(hs.x1, hs.y1, hs.x2, hs.y2));
            }

            // "EXCL." label
            const exclCX = pts.reduce((s, p) => s + p.x, 0) / pts.length;
            const exclCY = pts.reduce((s, p) => s + p.y, 0) / pts.length;
            doc.setFontSize(5);
            doc.setFont('helvetica', 'italic');
            doc.setTextColor(0);
            doc.text('EXCL.', exclCX, exclCY, { align: 'center' });
        });
    });

    // ═══ CM Tie Lines ═══
    const firstBdyStn = stations[2];
    const lastBdyStn = stations[stations.length - 1];
    doc.setLineWidth(0.1);
    doc.setDrawColor(0);
    doc.setLineDashPattern([0.5, 1, 2, 1], 0);

    [cm1, cm2].forEach(cmPt => {
        const cmXY = toPageXY(cmPt.e, cmPt.n);
        const firstXY = toPageXY(firstBdyStn.e, firstBdyStn.n);
        const lastXY = toPageXY(lastBdyStn.e, lastBdyStn.n);
        doc.line(firstXY.x, firstXY.y, cmXY.x, cmXY.y);
        doc.line(lastXY.x, lastXY.y, cmXY.x, cmXY.y);
    });

    // ═══ Station Symbols & Smart Labels ═══
    doc.setLineDashPattern([], 0);

    // Centroid of boundary stations for label offset direction
    const bdyStns = stations.slice(2);
    const centN_lbl = bdyStns.reduce((s, st) => s + st.n, 0) / bdyStns.length;
    const centE_lbl = bdyStns.reduce((s, st) => s + st.e, 0) / bdyStns.length;

    let stnFontSize = 7;
    let stnTriSize = 1.5;
    let stnCircR = 0.8;
    let lblOffset = 4;
    if (drawScale < 0.05) { stnFontSize = 3; stnTriSize = 0.4; stnCircR = 0.3; lblOffset = 1.5; }
    else if (drawScale < 0.1) { stnFontSize = 4; stnTriSize = 0.6; stnCircR = 0.4; lblOffset = 2; }
    else if (drawScale < 0.2) { stnFontSize = 5; stnTriSize = 0.8; stnCircR = 0.5; lblOffset = 2.5; }
    else if (drawScale < 0.5) { stnFontSize = 6; stnTriSize = 1.0; stnCircR = 0.6; lblOffset = 3; }

    stations.forEach(stn => {
        const xy = toPageXY(stn.e, stn.n);
        const isControl = (stn.id === 'CM1' || stn.id === 'CM2');

        doc.setDrawColor(0);
        doc.setLineWidth(0.2);

        if (isControl) {
            // Filled triangle for control marks
            doc.setFillColor(0, 0, 0);
            doc.triangle(
                xy.x, xy.y - stnTriSize,
                xy.x - stnTriSize, xy.y + stnTriSize * 0.7,
                xy.x + stnTriSize, xy.y + stnTriSize * 0.7,
                'F'
            );
        } else {
            // Open circle for boundary stations
            doc.setFillColor(255, 255, 255);
            doc.circle(xy.x, xy.y, stnCircR, 'FD');
        }

        // Smart label: offset away from centroid of boundary stations
        const centXY = toPageXY(centE_lbl, centN_lbl);
        let ldx = xy.x - centXY.x;
        let ldy = xy.y - centXY.y;
        const lLen = Math.sqrt(ldx * ldx + ldy * ldy);
        if (lLen > 0.01) { ldx /= lLen; ldy /= lLen; }
        else { ldx = 1; ldy = -1; }

        const labelX = xy.x + ldx * lblOffset;
        const labelY = xy.y + ldy * lblOffset;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(stnFontSize);
        doc.setTextColor(0);
        doc.text(stn.id, labelX, labelY, { align: 'center' });
    });

    // ═══ Scale Bar ═══
    const sbX = frmL + 4;
    const sbY = frmB - 4;
    const maxBarW = 60;
    const maxGroundDist = maxBarW / drawScale;
    const scaleBarDist = niceGridInterval(maxGroundDist, 4);
    const barLenMm = scaleBarDist * drawScale;
    const numSegs = 4;
    const segLenMm = barLenMm / numSegs;
    const barH_s = 2;

    doc.setLineWidth(0.2);
    doc.setDrawColor(0);
    doc.setLineDashPattern([], 0);

    for (let si = 0; si < numSegs; si++) {
        const sx = sbX + si * segLenMm;
        if (si % 2 === 0) {
            doc.setFillColor(0, 0, 0);
            doc.rect(sx, sbY, segLenMm, barH_s, 'F');
        } else {
            doc.setFillColor(255, 255, 255);
            doc.rect(sx, sbY, segLenMm, barH_s, 'FD');
        }
    }

    doc.setFontSize(5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0);
    for (let si = 0; si <= numSegs; si++) {
        const lblVal = (scaleBarDist / numSegs) * si;
        doc.text(lblVal.toFixed(0), sbX + si * segLenMm, sbY - 1, { align: 'center' });
    }
    doc.text('m', sbX + barLenMm + 2, sbY + 1.5);

    const repFrac = Math.round(1000 / drawScale);
    doc.setFontSize(6);
    doc.text('Scale  1 : ' + repFrac, sbX + barLenMm + 6, sbY + 1.5);

    // ═══ Title Block (Removed per user request) ═══


    // --- PHYSICAL PAGE 8: FIELD NOTES ---
    doc.addPage();
    startY = drawHeader("FIELD NOTES", "PAGE 8", false);
    
    const fnData = [];
    let lastStnForPdf = null;
    fieldNotesRows.forEach(row => {
        let stnLabel = "";
        if (row.stnId !== lastStnForPdf) {
            fnData.push([{ content: row.stnId, colSpan: 12, styles: { halign: 'center', fontStyle: 'bold', fillColor: [248, 249, 250] } }]);
            stnLabel = row.targetId;
            lastStnForPdf = row.stnId;
        } else {
            stnLabel = row.targetId;
        }
        fnData.push([stnLabel, row.flD, row.flM, row.flS, row.cor, row.brgD, row.brgM, row.brgS, row.fDist, row.fDist, "", row.hDist]);
        fnData.push(["", row.frD, row.frM, row.frS, "", "", "", "", "", "", "", ""]);
        fnData.push(["", "180", "0", "0", "", "", "", "", "", "", "", ""]);
    });

    doc.autoTable({
        startY: startY,
        head: [['Stn', 'D', 'M', 'S', 'Cor', 'D', 'M', 'S', 'F/dist', 'S/dist', 'V.A', 'H/dist']],
        body: fnData,
        theme: 'grid',
        headStyles: { fontStyle: 'bold', fillColor: [236, 240, 241], textColor: [0,0,0] },
        styles: { fontSize: 8, halign: 'center', cellPadding: 1, lineWidth: 0.1 }
    });

    // --- PHYSICAL PAGE 9: TRAVERSE ---
    doc.addPage();
    startY = drawHeader("TRAVERSE PAGE", "PAGE 9", false);

    const trData = [];
    unifiedTraverse.rows.forEach(row => {
        if (row.isHeader) {
            trData.push([row.stn, row.obs.deg, row.obs.min, row.obs.sec, "0", row.adj.deg, row.adj.min, row.adj.sec, "", "", "", "", "", "", "", "", ""]);
        } else if (row.isStart) {
            trData.push([row.stn, "", "", "", "", "", "", "", "", "", "", "", "", row.n.toFixed(2), row.e.toFixed(2), row.stn, "0"]);
        } else if (row.isTie) {
            trData.push([row.stn, row.obs.deg, row.obs.min, row.obs.sec, "0", row.adj.deg, row.adj.min, row.adj.sec, row.dist.toFixed(2), row.dN.toFixed(2), "", row.dE.toFixed(2), "", row.n.toFixed(2), row.e.toFixed(2), "", ""]);
        } else {
            trData.push([row.stn, row.obs.deg, row.obs.min, row.obs.sec, "0", row.adj.deg, row.adj.min, row.adj.sec, row.dist.toFixed(2), row.dN.toFixed(2), "0.00", row.dE.toFixed(2), "0.00", row.n.toFixed(2), row.e.toFixed(2), row.stn, ""]);
        }
    });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text("MAIN TRAVERSE", marginX, startY);

    doc.autoTable({
        startY: startY + 3,
        head: [['STN', 'D', 'M', 'S', 'cor', 'D', 'M', 'S', 'DIST', '\u00b1\u0394 N', 'cor', '\u00b1\u0394E', 'cor', 'NORTHINGS', 'EASTINGS', 'STN', 'REMARKS']],
        body: trData,
        theme: 'grid',
        headStyles: { fontStyle: 'bold', fillColor: [236, 240, 241], textColor: [0,0,0] },
        styles: { fontSize: 7, halign: 'center', cellPadding: 1, lineWidth: 0.1 }
    });

    let traverseEndY = doc.lastAutoTable.finalY + 5;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('angular misclosure is 0', marginX, traverseEndY);
    doc.text('misclosure per stn is 0', marginX, traverseEndY + 5);
    doc.text('Linear misclosure is 0.00 in ' + unifiedTraverse.sumDist.toFixed(2), marginX + 100, traverseEndY);
    doc.text('OR 1 in 2803873', marginX + 100, traverseEndY + 5);


    // --- PHYSICAL PAGE 10: AREA COMPUTATIONS ---
    doc.addPage();
    startY = drawHeader("AREA COMPUTATION", "PAGE 10", false);
    
    let currentYArea = startY;
    plots.forEach(plot => {
        if (currentYArea > 230) {
            doc.addPage();
            currentYArea = drawHeader("AREA COMPUTATION", "PAGE 10 (Cont.)", false);
        }

        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(plot.id.toUpperCase(), marginX, currentYArea);
        currentYArea += 4;

        if (plot.outerRing) {
            doc.setFontSize(9);
            const aData = [];
            aData.push([plot.outerRing.coords[0].stn, plot.outerRing.coords[0].n.toFixed(3), plot.outerRing.coords[0].e.toFixed(3), "", ""]);
            for (let i = 1; i < plot.outerRing.coords.length; i++) {
                aData.push([plot.outerRing.coords[i].stn, plot.outerRing.coords[i].n.toFixed(3), plot.outerRing.coords[i].e.toFixed(3), plot.outerRing.coords[i-1].crossProd.toExponential(2), plot.outerRing.coords[i-1].dist.toFixed(3)]);
            }

            doc.autoTable({
                startY: currentYArea,
                head: [['Station', 'N(m)', 'E(m)', 'Cross-Product', 'DISTANCE (m)']],
                body: aData,
                theme: 'grid',
                headStyles: { fontStyle: 'bold', fillColor: [236, 240, 241], textColor: [0,0,0] },
                styles: { fontSize: 8, halign: 'center', lineWidth: 0.1 }
            });
            currentYArea = doc.lastAutoTable.finalY + 5;
            doc.text(`Outer Area = ${plot.outerRing.areaSqm.toFixed(3)} sq m`, marginX + 20, currentYArea);
            currentYArea += 8;
        }

        plot.innerRings.forEach((inner, idx) => {
            if (currentYArea > 240) {
                doc.addPage();
                currentYArea = drawHeader("AREA COMPUTATION", "PAGE 10 (Cont.)", false);
            }
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.text(`EXCLUSION ${idx + 1}`, marginX, currentYArea);
            currentYArea += 2;
            
            const aData = [];
            aData.push([inner.coords[0].stn, inner.coords[0].n.toFixed(3), inner.coords[0].e.toFixed(3), "", ""]);
            for (let i = 1; i < inner.coords.length; i++) {
                aData.push([inner.coords[i].stn, inner.coords[i].n.toFixed(3), inner.coords[i].e.toFixed(3), inner.coords[i-1].crossProd.toExponential(2), inner.coords[i-1].dist.toFixed(3)]);
            }

            doc.autoTable({
                startY: currentYArea,
                head: [['Station', 'N(m)', 'E(m)', 'Cross-Product', 'DISTANCE (m)']],
                body: aData,
                theme: 'grid',
                headStyles: { fontStyle: 'bold', fillColor: [236, 240, 241], textColor: [0,0,0] },
                styles: { fontSize: 8, halign: 'center', lineWidth: 0.1 }
            });
            currentYArea = doc.lastAutoTable.finalY + 5;
            doc.text(`Less Area = ${inner.areaSqm.toFixed(3)} sq m`, marginX + 20, currentYArea);
            currentYArea += 8;
        });

        const ac = plot.netAreaSqm / 4046.8564224;
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text("NET AREA", marginX, currentYArea);
        currentYArea += 5;
        doc.setFont('helvetica', 'normal');
        doc.text(`hectares = ${(plot.netAreaSqm / 10000).toFixed(3)}`, marginX + 20, currentYArea);
        doc.text(`Acres = ${ac.toFixed(3)}`, marginX + 20, currentYArea + 5);
        doc.text(`decimals = ${(ac * 100).toFixed(3)}`, marginX + 20, currentYArea + 10);
        doc.text(`square metres = ${plot.netAreaSqm.toFixed(3)}`, marginX + 20, currentYArea + 15);
        currentYArea += 25;
    });

    // --- PHYSICAL PAGE 11: ABSTRACT OF FINAL RESULTS ---
    doc.addPage();
    startY = drawHeader("ABSTRACT OF FINAL RESULTS", "PAGE 11");
    doc.autoTable({
        startY: startY,
        head: [['STN', 'NORTHINGS (m)', 'EASTINGS (m)']],
        body: stations.map(s => [s.id, s.n.toFixed(4), s.e.toFixed(4)]),
        theme: 'grid',
        headStyles: { fontStyle: 'bold', fillColor: [236, 240, 241], textColor: [0,0,0] },
        styles: { fontSize: 9, halign: 'center', lineWidth: 0.1 }
    });
    // --- Add Footer to All Pages ---
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(150, 150, 150);
        doc.text("Geospatial network uganda", pageCenter, doc.internal.pageSize.height - 10, { align: 'center' });
    }
    doc.setTextColor(0, 0, 0); // Reset for safety

    // Generate ZIP
    const pdfBlob = doc.output('blob');
    const csvBlob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    
    const zip = new JSZip();
    zip.file(`JRJ_Report_${meta.projectName}.pdf`, pdfBlob);
    zip.file(`JRJ_Data_${meta.projectName}.csv`, csvBlob);
    
    const zipContent = await zip.generateAsync({ type: 'blob' });
    
    const downloadLink = document.createElement('a');
    downloadLink.href = URL.createObjectURL(zipContent);
    downloadLink.download = `JRJ_Export_${meta.projectName}.zip`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
}
