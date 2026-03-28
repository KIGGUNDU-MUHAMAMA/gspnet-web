/**
 * JRJ PDF Generator
 * Uses html2pdf.js to construct an HTML representation of the JRJ
 * and convert it to a downloadable PDF.
 */

class JRJPdfGenerator {
    constructor() {
        this.engine = new (window.JRJEngine || require('./jrj_engine.js'))();
    }

    /**
     * Generate PDF from an array of coordinates
     * @param {Array} coords - [{stn, n, e}, ...]
     * @param {Object} projectData - { surveyor, location, block, plot, etc. }
     */
    async generatePdf(coords, projectData = {}) {
        // Compute all data using the JRJ Engine
        const jrjData = this.engine.computeAll(coords);

        // Generate the HTML content
        const htmlContent = this.buildHtml(jrjData, projectData);

        // Configuration for html2pdf
        const opt = {
            margin:       10,
            filename:     `JRJ_${projectData.plot || 'Export'}.pdf`,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        try {
            // Generate PDF directly from HTML string
            await html2pdf().set(opt).from(htmlContent).save();
            return true;
        } catch (error) {
            console.error('Error generating JRJ PDF:', error);
            return false;
        }
    }

    buildHtml(jrj, projectSettings) {
        // Build style block
        const styles = `
            <style>
                .jrj-container { font-family: 'Times New Roman', serif; font-size: 12px; line-height: 1.4; color: #000; padding: 20px; }
                .jrj-header { text-align: center; font-weight: bold; margin-bottom: 20px; font-size: 16px; text-decoration: underline; }
                .jrj-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                .jrj-table th, .jrj-table td { border: 1px solid #000; padding: 4px; text-align: center; }
                .jrj-section-title { font-weight: bold; text-decoration: underline; margin-top: 20px; margin-bottom: 10px; }
                .jrj-footer { margin-top: 30px; font-size: 12px; }
                .page-break { page-break-before: always; }
            </style>
        `;

        let html = `<div class="jrj-container">${styles}`;

        // ==== PAGE 1: COORDINATES ABSTRACT ====
        html += `<div class="jrj-header">ABSTRACT OF FINAL RESULTS</div>`;
        html += `<table class="jrj-table">
            <thead>
                <tr>
                    <th>STN</th><th>NORTHINGS</th><th>EASTINGS</th>
                </tr>
            </thead>
            <tbody>`;
        
        jrj.coordinates.forEach(c => {
            html += `<tr>
                <td>${c.stn || ''}</td>
                <td>${c.n.toFixed(3)}</td>
                <td>${c.e.toFixed(3)}</td>
            </tr>`;
        });
        
        html += `</tbody></table>`;
        html += `<div class="page-break"></div>`;

        // ==== PAGE 2: TRAVERSE COMPUTATIONS ====
        html += `<div class="jrj-header">TRAVERSE COMPUTATIONS</div>`;
        html += `<table class="jrj-table" style="font-size: 10px;">
            <thead>
                <tr>
                    <th>Station</th>
                    <th>Northing (d)</th>
                    <th>Easting (d)</th>
                    <th>Bearing (Deg Min Sec)</th>
                    <th>Distance (m)</th>
                </tr>
            </thead>
            <tbody>`;
        
        jrj.traverse.forEach(line => {
             html += `<tr>
                <td>${line.from}</td>
                <td>${line.fromCoords.n.toFixed(3)}</td>
                <td>${line.fromCoords.e.toFixed(3)}</td>
                <td></td>
                <td></td>
             </tr>`;
             html += `<tr style="background:#f4f4f4;">
                <td>&darr; to ${line.to}</td>
                <td>${(line.toCoords.n - line.fromCoords.n).toFixed(3)}</td>
                <td>${(line.toCoords.e - line.fromCoords.e).toFixed(3)}</td>
                <td>${line.bearing.deg}&deg; ${line.bearing.min}' ${line.bearing.sec}"</td>
                <td>${line.distance.toFixed(3)}</td>
             </tr>`;
        });
        
        html += `</tbody></table>`;
        html += `<div class="page-break"></div>`;

        // ==== PAGE 3: AREA COMPUTATIONS ====
        html += `<div class="jrj-header">AREA COMPUTATIONS</div>`;
        html += `<table class="jrj-table">
            <thead>
                <tr>
                    <th>STN</th>
                    <th>NORTHINGS</th>
                    <th>EASTINGS</th>
                    <th>N * E(i+1)</th>
                    <th>E * N(i+1)</th>
                    <th>DIST (m)</th>
                </tr>
            </thead>
            <tbody>`;
        
        jrj.area.details.forEach((line, idx) => {
            // Distance is equivalent to the traverse line distance outgoing from this point
            const trLine = jrj.traverse[idx];
            html += `<tr>
                <td>${line.stn}</td>
                <td>${line.n.toFixed(3)}</td>
                <td>${line.e.toFixed(3)}</td>
                <td>${line.cross1.toFixed(3)}</td>
                <td>${line.cross2.toFixed(3)}</td>
                <td>${trLine ? trLine.distance.toFixed(3) : ''}</td>
            </tr>`;
        });
        
        // Add closing station repetition for visual similar to Excel
        if (jrj.coordinates.length > 0) {
            const first = jrj.coordinates[0];
            html += `<tr>
                <td>${first.stn}</td>
                <td>${first.n.toFixed(3)}</td>
                <td>${first.e.toFixed(3)}</td>
                <td></td><td></td><td></td>
            </tr>`;
        }

        html += `</tbody></table>`;
        
        html += `<div style="text-align: right; font-weight: bold; margin-top: 20px;">`;
        html += `<p>Area = ${jrj.area.sqMeters.toFixed(3)} sq. m</p>`;
        html += `<p>Area = ${jrj.area.hectares.toFixed(4)} hectares</p>`;
        html += `<p>Area = ${jrj.area.acres.toFixed(3)} acres</p>`;
        html += `</div>`;

        html += `</div>`; // .jrj-container

        return html;
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = JRJPdfGenerator;
} else {
    window.JRJPdfGenerator = JRJPdfGenerator;
}
