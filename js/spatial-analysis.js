/**
 * GSP.NET Spatial Analysis Engine
 * Powered by Turf.js and OpenLayers
 */

const SpatialAnalysis = {
    layer: null,
    source: null,
    drawInteraction: null,
    selectInteraction: null,
    selectedFeatures: [],
    lastResultGeoJSON: null,
    
    // UI Elements
    ui: {
        toolSelect: null,
        bufferDistance: null,
        drawPointBtn: null,
        drawLineBtn: null,
        selectBtn: null,
        runBtn: null,
        statusText: null,
        resultsPanel: null,
        resultText: null,
        exportDxfBtn: null,
        exportPdfBtn: null,
        clearBtn: null,
        bufferOpts: null
    },

    init: function() {
        console.log('[Spatial Analysis] Initializing engine...');
        
        // Setup UI References
        this.ui.toolSelect = document.getElementById('analysis-tool-select');
        this.ui.bufferDistance = document.getElementById('analysis-buffer-distance');
        this.ui.drawPointBtn = document.getElementById('analysis-draw-point-btn');
        this.ui.drawLineBtn = document.getElementById('analysis-draw-line-btn');
        this.ui.selectBtn = document.getElementById('analysis-select-btn');
        this.ui.runBtn = document.getElementById('analysis-run-btn');
        this.ui.statusText = document.getElementById('analysis-selection-status');
        this.ui.resultsPanel = document.getElementById('analysis-results-panel');
        this.ui.resultText = document.getElementById('analysis-result-text');
        this.ui.exportDxfBtn = document.getElementById('analysis-export-dxf-btn');
        this.ui.exportPdfBtn = document.getElementById('analysis-export-pdf-btn');
        this.ui.clearBtn = document.getElementById('analysis-clear-btn');
        this.ui.bufferOpts = document.getElementById('analysis-buffer-opts');

        if (!this.ui.toolSelect) return; // UI not loaded

        // Initialize Vector Layer for Results
        this.source = new ol.source.Vector();
        this.layer = new ol.layer.Vector({
            source: this.source,
            style: new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: '#9b59b6', // Purple
                    width: 3,
                    lineDash: [10, 10]
                }),
                fill: new ol.style.Fill({
                    color: 'rgba(155, 89, 182, 0.3)' // Semi-transparent purple
                }),
                image: new ol.style.Circle({
                    radius: 6,
                    fill: new ol.style.Fill({color: '#9b59b6'}),
                    stroke: new ol.style.Stroke({color: '#fff', width: 2})
                })
            }),
            zIndex: 9999,
            title: 'Analysis Results'
        });

        if (window.map) {
            window.map.addLayer(this.layer);
        }

        // Initialize Select Interaction
        this.selectInteraction = new ol.interaction.Select({
            multi: true, // Allow selecting multiple features
            toggleCondition: ol.events.condition.click, // Toggle selection on normal click without needing shift
            style: null // Use default selection styling from map if any, or null to keep original but we handle highlighting
        });
        
        this.selectInteraction.on('select', (e) => {
            this.selectedFeatures = e.target.getFeatures().getArray();
            this.updateStatus();
        });

        this.attachEventListeners();
    },

    attachEventListeners: function() {
        this.ui.toolSelect.addEventListener('change', () => this.handleToolChange());
        
        this.ui.drawPointBtn.addEventListener('click', () => this.startDrawing('Point'));
        this.ui.drawLineBtn.addEventListener('click', () => this.startDrawing('LineString'));
        
        this.ui.selectBtn.addEventListener('click', () => {
            this.stopDrawing();
            if (window.map) {
                window.map.addInteraction(this.selectInteraction);
                this.ui.statusText.textContent = "Click on the map to select features...";
                this.ui.statusText.style.color = "#3498db";
            }
        });

        this.ui.runBtn.addEventListener('click', () => this.runAnalysis());
        this.ui.clearBtn.addEventListener('click', () => this.clearResults());
        this.ui.exportDxfBtn.addEventListener('click', () => this.exportToDxf());
        this.ui.exportPdfBtn.addEventListener('click', () => this.exportToPdf());
    },

    handleToolChange: function() {
        const tool = this.ui.toolSelect.value;
        if (tool === 'buffer') {
            this.ui.bufferOpts.style.display = 'flex';
            this.ui.drawPointBtn.style.display = 'block';
            this.ui.drawLineBtn.style.display = 'block';
        } else {
            this.ui.bufferOpts.style.display = 'none';
            this.ui.drawPointBtn.style.display = 'none';
            this.ui.drawLineBtn.style.display = 'none';
            this.stopDrawing(); // Points/Lines only useful for buffer input right now
        }
        this.updateStatus();
    },

    stopDrawing: function() {
        if (this.drawInteraction && window.map) {
            window.map.removeInteraction(this.drawInteraction);
            this.drawInteraction = null;
        }
        if (this.selectInteraction && window.map) {
            window.map.removeInteraction(this.selectInteraction);
        }
    },

    startDrawing: function(type) {
        this.stopDrawing();
        this.selectedFeatures = []; // Clear previous selections
        this.selectInteraction.getFeatures().clear();
        this.updateStatus();

        if (!window.map) return;

        // Ensure we draw into a temporary feature that we immediately select
        this.drawInteraction = new ol.interaction.Draw({
            source: this.source,
            type: type
        });

        this.drawInteraction.on('drawend', (e) => {
            const feature = e.feature;
            this.selectedFeatures = [feature]; // Auto-select the drawn feature
            this.stopDrawing(); // Stop drawing after 1 feature
            this.updateStatus();
        });

        window.map.addInteraction(this.drawInteraction);
        this.ui.statusText.textContent = `Click on the map to draw a ${type}...`;
        this.ui.statusText.style.color = "#3498db";
    },

    updateStatus: function() {
        const count = this.selectedFeatures.length;
        if (count > 0) {
            this.ui.statusText.textContent = `${count} feature(s) ready for analysis.`;
            this.ui.statusText.style.color = "#27ae60";
        } else {
            this.ui.statusText.textContent = `0 features selected.`;
            this.ui.statusText.style.color = "#e67e22";
        }
    },

    runAnalysis: function() {
        if (this.selectedFeatures.length === 0) {
            alert("Please select or draw at least one input feature.");
            return;
        }

        if (!window.turf) {
            alert("Turf.js is not loaded.");
            return;
        }

        const tool = this.ui.toolSelect.value;
        const format = new ol.format.GeoJSON({ featureProjection: 'EPSG:3857' });
        
        try {
            let resultGeoJSON = null;

            if (tool === 'buffer') {
                const distance = parseFloat(this.ui.bufferDistance.value) || 30;
                // Buffer supports multiple features via FeatureCollection or union
                const geojsons = this.selectedFeatures.map(f => format.writeFeatureObject(f));
                const fc = turf.featureCollection(geojsons);
                resultGeoJSON = turf.buffer(fc, distance, {units: 'meters'});
                
                // If multiple, dissolve them
                if (resultGeoJSON.features && resultGeoJSON.features.length > 1) {
                     resultGeoJSON = turf.dissolve(resultGeoJSON);
                } else if (resultGeoJSON.features) {
                     resultGeoJSON = resultGeoJSON.features[0]; // Extract single feature
                }
                
                this.showResultPanel(`Buffer created at ${distance}m.`);

            } else if (tool === 'intersect') {
                if (this.selectedFeatures.length !== 2) {
                    alert("Intersect requires exactly 2 selected features.");
                    return;
                }
                const f1 = format.writeFeatureObject(this.selectedFeatures[0]);
                const f2 = format.writeFeatureObject(this.selectedFeatures[1]);
                resultGeoJSON = turf.intersect(turf.featureCollection([f1, f2]));
                
                if (!resultGeoJSON) {
                    alert("Features do not intersect.");
                    return;
                }
                this.showResultPanel(`Intersection calculated successfully.`);

            } else if (tool === 'union') {
                if (this.selectedFeatures.length < 2) {
                    alert("Union requires at least 2 selected features.");
                    return;
                }
                // Union supports multiple
                let unionResult = format.writeFeatureObject(this.selectedFeatures[0]);
                for(let i=1; i<this.selectedFeatures.length; i++) {
                    const nextF = format.writeFeatureObject(this.selectedFeatures[i]);
                    unionResult = turf.union(turf.featureCollection([unionResult, nextF]));
                }
                resultGeoJSON = unionResult;
                this.showResultPanel(`Union calculated successfully.`);

            } else if (tool === 'difference') {
                 if (this.selectedFeatures.length !== 2) {
                    alert("Difference requires exactly 2 selected features. The second feature selected will be subtracted from the first.");
                    return;
                }
                const f1 = format.writeFeatureObject(this.selectedFeatures[0]);
                const f2 = format.writeFeatureObject(this.selectedFeatures[1]);
                resultGeoJSON = turf.difference(turf.featureCollection([f1, f2]));
                
                if (!resultGeoJSON) {
                    alert("Difference resulted in empty geometry (fully erased).");
                    return;
                }
                this.showResultPanel(`Difference calculated successfully.`);
            }

            if (resultGeoJSON) {
                this.lastResultGeoJSON = resultGeoJSON;
                const resultFeature = format.readFeature(resultGeoJSON);
                this.source.addFeature(resultFeature);

                // Calculate Area if Polygon
                if (resultGeoJSON.geometry && (resultGeoJSON.geometry.type === 'Polygon' || resultGeoJSON.geometry.type === 'MultiPolygon')) {
                     const areaSqM = turf.area(resultGeoJSON);
                     const areaHa = (areaSqM / 10000).toFixed(4);
                     this.ui.resultText.innerHTML += `<br><strong>Area:</strong> ${areaHa} Hectares (${areaSqM.toFixed(2)} sqm)`;
                }

                // Zoom to result
                window.map.getView().fit(this.source.getExtent(), { padding: [50, 50, 50, 50], duration: 1000 });
            }

        } catch (err) {
            console.error("Geoprocessing Error:", err);
            alert("Error during analysis: " + err.message);
        }
    },

    showResultPanel: function(msg) {
        this.ui.resultText.innerHTML = msg;
        this.ui.resultsPanel.style.display = 'block';
    },

    clearResults: function() {
        this.source.clear();
        this.selectedFeatures = [];
        if (this.selectInteraction) this.selectInteraction.getFeatures().clear();
        this.updateStatus();
        this.ui.resultsPanel.style.display = 'none';
        this.lastResultGeoJSON = null;
    },

    exportToDxf: function() {
        if (!this.lastResultGeoJSON) return;
        
        const targetCrs = document.getElementById('analysis-export-crs') ? document.getElementById('analysis-export-crs').value : 'EPSG:3857';

        let dxf = '0\\nSECTION\\n2\\nENTITIES\\n';
        
        // A very basic DXF polyline exporter for the result
        const addPolygonToDxf = (coords) => {
            const ring = coords[0]; // external ring
            dxf += '0\\nLWPOLYLINE\\n100\\nAcDbEntity\\n8\\nANALYSIS_RESULT\\n100\\nAcDbPolyline\\n90\\n' + ring.length + '\\n70\\n1\\n';
            ring.forEach(pt => {
                 let exportPt = pt;
                 if (targetCrs !== 'EPSG:3857' && window.proj4) {
                     exportPt = proj4('EPSG:3857', targetCrs, pt);
                 }
                 dxf += '10\\n' + exportPt[0].toFixed(8) + '\\n20\\n' + exportPt[1].toFixed(8) + '\\n';
            });
        };

        const geom = this.lastResultGeoJSON.geometry || this.lastResultGeoJSON;
        
        if (geom.type === 'Polygon') {
            addPolygonToDxf(geom.coordinates);
        } else if (geom.type === 'MultiPolygon') {
            geom.coordinates.forEach(poly => addPolygonToDxf(poly));
        } else {
            alert("DXF export currently only supports Polygons.");
            return;
        }

        dxf += '0\\nENDSEC\\n0\\nEOF\\n';

        const blob = new Blob([dxf], { type: 'application/dxf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `GSPNET_Analysis_${new Date().getTime()}.dxf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    exportToPdf: async function() {
        if (typeof window.jspdf === 'undefined' || typeof window.html2canvas === 'undefined') {
            alert("PDF libraries not fully loaded.");
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        
        // 1. Title Header
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(22);
        doc.setTextColor(44, 62, 80);
        doc.text("GSP.NET Spatial Analysis Report", 105, 20, { align: 'center' });
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 105, 28, { align: 'center' });
        
        doc.setLineWidth(0.5);
        doc.setDrawColor(189, 195, 199);
        doc.line(15, 35, 195, 35);

        // 2. Metadata
        doc.setFont('helvetica', 'bold');
        doc.text("Analysis Details", 15, 45);
        doc.setFont('helvetica', 'normal');
        
        const tool = this.ui.toolSelect.options[this.ui.toolSelect.selectedIndex].text;
        doc.text(`Operation: ${tool}`, 15, 55);
        
        let yPos = 65;
        if (this.ui.toolSelect.value === 'buffer') {
            doc.text(`Buffer Distance: ${this.ui.bufferDistance.value} meters`, 15, yPos);
            yPos += 10;
        }

        // Add Area from result text
        const resultHtml = this.ui.resultText.innerHTML;
        if (resultHtml.includes("Area:")) {
            const areaMatch = resultHtml.match(/<strong>Area:<\/strong>\s*(.*?Hectares.*?sqm\))/);
            if (areaMatch && areaMatch[1]) {
                 doc.setFont('helvetica', 'bold');
                 doc.text(`Output Area: ${areaMatch[1]}`, 15, yPos);
            }
        }

        // 3. Map Snapshot
        try {
            // Hide UI controls temporarily for clean screenshot
            const controls = document.querySelectorAll('.ol-control, .gspnet-assist-panel, .gspnet-top-panel');
            controls.forEach(c => c.style.visibility = 'hidden');

            const mapDiv = document.getElementById('map');
            const canvas = await window.html2canvas(mapDiv, {
                useCORS: true,
                allowTaint: true,
                scale: 2 // High res
            });

            controls.forEach(c => c.style.visibility = 'visible');

            const imgData = canvas.toDataURL('image/jpeg', 0.9);
            
            // Calculate aspect ratio for A4
            const pdfWidth = 180; 
            const imgProps = doc.getImageProperties(imgData);
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

            doc.setFont('helvetica', 'bold');
            doc.text("Analysis Map View", 15, 95);
            doc.addImage(imgData, 'JPEG', 15, 100, pdfWidth, pdfHeight);

            doc.setFont('helvetica', 'italic');
            doc.setFontSize(10);
            doc.text("© Geospatial Network Uganda (GSP.NET)", 105, 285, { align: 'center' });

            doc.save(`GSPNET_Analysis_Report_${new Date().getTime()}.pdf`);

        } catch (e) {
            console.error("PDF Map Snapshot Error:", e);
            alert("Error creating map snapshot. PDF generation failed.");
            // Restore controls just in case
            const controls = document.querySelectorAll('.ol-control, .gspnet-assist-panel, .gspnet-top-panel');
            controls.forEach(c => c.style.visibility = 'visible');
        }
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Small delay to ensure OpenLayers is fully loaded
    setTimeout(() => {
        if (window.map) {
            SpatialAnalysis.init();
        } else {
            console.warn("[Spatial Analysis] window.map not found yet. Retrying...");
            const checkMap = setInterval(() => {
                if (window.map) {
                    clearInterval(checkMap);
                    SpatialAnalysis.init();
                }
            }, 1000);
        }
    }, 1500);
});
