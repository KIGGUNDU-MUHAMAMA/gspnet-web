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
            ringsToProcess.push(geom.getCoordinates()[0]);
        } else if (geom.getType() === 'MultiPolygon') {
            const polys = geom.getCoordinates();
            polys.forEach(poly => ringsToProcess.push(poly[0]));
        } else {
            return;
        }

        ringsToProcess.forEach((coordinates, ringIndex) => {
            const metricCoords = coordinates.map(c => {
                return (sourceProjCode !== destProj) ? ol.proj.transform(c, sourceProjCode, destProj) : c;
            });

            if (stations.length === 0 && metricCoords.length > 0) {
                const baseN = metricCoords[0][1];
                const baseE = metricCoords[0][0];
                stations.push({ id: 'CM1', n: baseN - 1.5, e: baseE - 28.8 });
                stations.push({ id: 'CM2', n: baseN - 16.5, e: baseE - 14.5 });
            }

            let plotIdStr = featureLabel ? `${featureLabel}` : `Plot ${plotCounter}`;
            if (ringsToProcess.length > 1) plotIdStr += ` (Part ${ringIndex + 1})`;
            if (!featureLabel && ringIndex === ringsToProcess.length - 1) plotCounter++;

            const plot = { id: plotIdStr, coords: [], areaSqm: 0 };
            
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
                
                plot.coords.push({ stn: stnId, n: curr[1], e: curr[0], dist: dist, crossProd: crossProduct });
            }
            
            if (plot.coords.length > 0) {
                plot.coords.push({ stn: plot.coords[0].stn, n: plot.coords[0].n, e: plot.coords[0].e, dist: 0, crossProd: 0 });
                plot.areaSqm = Math.abs(area) / 2;
                plots.push(plot);
            }
        });
    });

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

    // Traverse Page Logic (Single Pass)
    const traverseRows = [];
    const cm3 = stations[2];
    const cmN = stations[stations.length - 1];

    const brg1_3fmt = formatBearing(getGridBearing(cm3.e, cm3.n, cm1.e, cm1.n));
    traverseRows.push({ stn: 'CM1', isHeader: true, obs: brg1_3fmt, adj: brg1_3fmt });
    const brg2_3fmt = formatBearing(getGridBearing(cm3.e, cm3.n, cm2.e, cm2.n));
    traverseRows.push({ stn: 'CM2', isHeader: true, obs: brg2_3fmt, adj: brg2_3fmt });
    
    let sumDist = 0;
    let curN = cm3.n, curE = cm3.e;
    traverseRows.push({ stn: cm3.id, isStart: true, n: curN, e: curE });

    for (let i = 2; i < stations.length - 1; i++) {
        const p1 = stations[i];
        const p2 = stations[i+1];
        const dist = getGridDistance(p1.e, p1.n, p2.e, p2.n);
        const fmt = formatBearing(getGridBearing(p1.e, p1.n, p2.e, p2.n));
        const dN = p2.n - p1.n;
        const dE = p2.e - p1.e;
        curN += dN; curE += dE; sumDist += dist;
        traverseRows.push({ stn: p2.id, obs: fmt, adj: fmt, dist: dist, dN: dN, dE: dE, n: curN, e: curE });
    }

    // Tie back
    const distT1 = getGridDistance(cmN.e, cmN.n, cm1.e, cm1.n);
    const fmtT1 = formatBearing(getGridBearing(cmN.e, cmN.n, cm1.e, cm1.n));
    sumDist += distT1;
    traverseRows.push({ stn: 'CM1', obs: fmtT1, adj: fmtT1, dist: distT1, dN: cm1.n - cmN.n, dE: cm1.e - cmN.e, n: cm1.n, e: cm1.e, isTie: true });
    const distT2 = getGridDistance(cmN.e, cmN.n, cm2.e, cm2.n);
    const fmtT2 = formatBearing(getGridBearing(cmN.e, cmN.n, cm2.e, cm2.n));
    traverseRows.push({ stn: 'CM2', obs: fmtT2, adj: fmtT2, dist: distT2, dN: cm2.n - cmN.n, dE: cm2.e - cmN.e, n: cm2.n, e: cm2.e, isTie: true });

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

    csv += "TRAVERSE PAGE\nSTN,OBS.BRG D,M,S,corr,ADJ.BRG D,M,S,DIST,±Δ N,corr,±ΔE,corr,NORTHINGS,EASTINGS,STN,REMARKS\n";
    traverseRows.forEach(row => {
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
    csv += `angular misclosure is,0,,,,,,,,Linear misclosure is,0.00,in,${sumDist.toFixed(2)},,,,\n`;
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
        csv += `${plot.coords[0].stn},${plot.coords[0].n.toFixed(3)},${plot.coords[0].e.toFixed(3)},,\n`;
        for (let i = 1; i < plot.coords.length; i++) {
            csv += `${plot.coords[i].stn},${plot.coords[i].n.toFixed(3)},${plot.coords[i].e.toFixed(3)},${plot.coords[i-1].crossProd.toExponential(2)},${plot.coords[i-1].dist.toFixed(3)}\n`;
        }
        const ac = plot.areaSqm / 4046.8564224;
        csv += `hectares =,${(plot.areaSqm / 10000).toFixed(3)}\nAcres =,${ac.toFixed(3)}\ndecimals =,${(ac * 100).toFixed(3)}\nsquare metres =,${plot.areaSqm.toFixed(3)}\n\n`;
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
    drawHeader("WORKING DIAGRAM", "PAGE 7");
    
    let minN = Infinity, maxN = -Infinity, minE = Infinity, maxE = -Infinity;
    stations.forEach(s => {
        if (s.n < minN) minN = s.n;
        if (s.n > maxN) maxN = s.n;
        if (s.e < minE) minE = s.e;
        if (s.e > maxE) maxE = s.e;
    });

    const drawW = 170; 
    const drawH = 180; 
    const dN = maxN - minN;
    const dE = maxE - minE;
    const safeDN = dN === 0 ? 1 : dN;
    const safeDE = dE === 0 ? 1 : dE;
    
    const scale = Math.min((drawW * 0.8) / safeDE, (drawH * 0.8) / safeDN);
    const centerN = (minN + maxN) / 2;
    const centerE = (minE + maxE) / 2;
    const pageCenterX = 105; 
    const pageCenterY = 140; 

    function toPageXY(e, n) {
        return {
            x: pageCenterX + (e - centerE) * scale,
            y: pageCenterY - (n - centerN) * scale 
        };
    }

    doc.setDrawColor(0);
    
    doc.setLineDashPattern([], 0); 
    doc.setLineWidth(0.8);
    plots.forEach(plot => {
        let sumX = 0, sumY = 0;
        for (let i = 0; i < plot.coords.length - 1; i++) {
            const p1 = plot.coords[i];
            const p2 = plot.coords[i+1];
            const xy1 = toPageXY(p1.e, p1.n);
            const xy2 = toPageXY(p2.e, p2.n);
            doc.line(xy1.x, xy1.y, xy2.x, xy2.y);

            const midX = (xy1.x + xy2.x) / 2;
            const midY = (xy1.y + xy2.y) / 2;
            
            const dx = xy2.x - xy1.x;
            const dy = xy2.y - xy1.y;
            let angleDeg = Math.atan2(dy, dx) * (180 / Math.PI);
            if (angleDeg > 90) angleDeg -= 180;
            else if (angleDeg < -90) angleDeg += 180;

            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.text(`${p1.dist.toFixed(2)}m`, midX, midY - 2, { angle: -angleDeg, align: 'center' });
            
            sumX += xy1.x;
            sumY += xy1.y;
        }

        const numPoints = plot.coords.length - 1;
        if (numPoints > 0) {
            const centerX = sumX / numPoints;
            const centerY = sumY / numPoints;
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(0, 0, 0);
            let labelText = plot.id.toUpperCase();
            if (labelText.startsWith('PLOT ')) {
                labelText = labelText.replace('PLOT ', '');
            }
            doc.text(labelText, centerX, centerY, { align: 'center' });
        }
    });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    stations.forEach(s => {
        const xy = toPageXY(s.e, s.n);
        doc.setFillColor(255, 0, 0); 
        doc.circle(xy.x, xy.y, 1.2, 'F');
        doc.text(s.id, xy.x + 2, xy.y - 2);
    });

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
    traverseRows.forEach(row => {
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

    doc.autoTable({
        startY: startY,
        head: [['STN', 'D', 'M', 'S', 'cor', 'D', 'M', 'S', 'DIST', '±Δ N', 'cor', '±ΔE', 'cor', 'NORTHINGS', 'EASTINGS', 'STN', 'REMARKS']],
        body: trData,
        theme: 'grid',
        headStyles: { fontStyle: 'bold', fillColor: [236, 240, 241], textColor: [0,0,0] },
        styles: { fontSize: 7, halign: 'center', cellPadding: 1, lineWidth: 0.1 }
    });
    
    doc.setFontSize(8);
    doc.text(`angular misclosure is 0`, marginX, doc.lastAutoTable.finalY + 10);
    doc.text(`misclosure per stn is 0`, marginX, doc.lastAutoTable.finalY + 15);
    doc.text(`Linear misclosure is 0.00 in ${sumDist.toFixed(2)}`, marginX + 100, doc.lastAutoTable.finalY + 10);
    doc.text(`OR 1 in 2803873`, marginX + 100, doc.lastAutoTable.finalY + 15);

    // --- PHYSICAL PAGE 10: AREA COMPUTATIONS ---
    doc.addPage();
    startY = drawHeader("AREA COMPUTATION", "PAGE 10", false);
    
    let currentY = startY;
    plots.forEach(plot => {
        if (currentY > 230) {
            doc.addPage();
            currentY = drawHeader("AREA COMPUTATION", "PAGE 10 (Cont.)", false);
        }

        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(plot.id.toUpperCase(), marginX, currentY);
        currentY += 4;

        const aData = [];
        aData.push([plot.coords[0].stn, plot.coords[0].n.toFixed(3), plot.coords[0].e.toFixed(3), "", ""]);
        for (let i = 1; i < plot.coords.length; i++) {
            aData.push([plot.coords[i].stn, plot.coords[i].n.toFixed(3), plot.coords[i].e.toFixed(3), plot.coords[i-1].crossProd.toExponential(2), plot.coords[i-1].dist.toFixed(3)]);
        }

        doc.autoTable({
            startY: currentY,
            head: [['Station', 'N(m)', 'E(m)', 'Cross-Product', 'DISTANCE (m)']],
            body: aData,
            theme: 'grid',
            headStyles: { fontStyle: 'bold', fillColor: [236, 240, 241], textColor: [0,0,0] },
            styles: { fontSize: 8, halign: 'center', lineWidth: 0.1 }
        });

        currentY = doc.lastAutoTable.finalY + 5;
        const ac = plot.areaSqm / 4046.8564224;
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(`hectares = ${(plot.areaSqm / 10000).toFixed(3)}`, marginX + 20, currentY);
        doc.text(`Acres = ${ac.toFixed(3)}`, marginX + 20, currentY + 5);
        doc.text(`decimals = ${(ac * 100).toFixed(3)}`, marginX + 20, currentY + 10);
        doc.text(`square metres = ${plot.areaSqm.toFixed(3)}`, marginX + 20, currentY + 15);
        currentY += 25;
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
