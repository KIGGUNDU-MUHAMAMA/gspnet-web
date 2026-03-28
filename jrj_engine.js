/**
 * JRJ (Job Record Jacket) Computation Engine
 * 
 * Handles the mathematical and surveying calculations based on standard
 * formulas found in traditional Excel-based land survey forms.
 */

class JRJEngine {
    constructor() {
        // Corrections
        this.utmScaleFactor = -0.3737;
        this.mslCorrection = -0.1911;
        this.multiplyingFactor = ((this.utmScaleFactor + this.mslCorrection) / 1000) + 1;
    }

    /**
     * Compute the full JRJ details from an array of coordinates.
     * @param {Array} coords - Array of points: [{ stn: 'CM1', n: 1000, e: 5000 }, ...]
     * @returns {Object} - Complete computation results including traverse, area, etc.
     */
    computeAll(coords) {
        if (!coords || coords.length < 3) {
            throw new Error("At least 3 coordinates are required to compute a JRJ.");
        }

        const traverse = this.computeTraverse(coords);
        const area = this.computeArea(coords);
        const datum = this.computeDatum(coords);

        return {
            traverse,
            area,
            datum,
            coordinates: coords,
            corrections: {
                utmScaleFactor: this.utmScaleFactor,
                mslCorrection: this.mslCorrection,
                multiplyingFactor: this.multiplyingFactor
            }
        };
    }

    /**
     * Compute bearings, distances, and angles for the traverse.
     */
    computeTraverse(coords) {
        const lines = [];
        
        for (let i = 0; i < coords.length; i++) {
            const current = coords[i];
            const next = coords[(i + 1) % coords.length]; // Close the loop back to start

            const geom = this.getBearingDistance(current.n, current.e, next.n, next.e);
            
            lines.push({
                from: current.stn,
                to: next.stn,
                fromCoords: { n: current.n, e: current.e },
                toCoords: { n: next.n, e: next.e },
                distance: geom.distance,
                bearing: geom.bearing,
                bearingDec: geom.bearingDec
            });
        }

        // Compute Internal Angles
        for (let i = 0; i < lines.length; i++) {
            const prevLine = lines[i === 0 ? lines.length - 1 : i - 1];
            const currLine = lines[i];

            // Angle = Backsight Bearing - Foresight Bearing ... or similar depending on geometry.
            // Using interior angle from coordinates.
            let angleDeg = prevLine.bearingDec - currLine.bearingDec;
            if (angleDeg < 0) angleDeg += 360;
            // Depending on survey convention, you might want 180 + prev - curr etc.
            // We store the raw angle for now.
            let angleRad = angleDeg * Math.PI / 180;
            lines[i].angle = this.decimalToDMS(angleDeg);
        }

        return lines;
    }

    /**
     * Calculate Distance and Bearing between two points.
     */
    getBearingDistance(n1, e1, n2, e2) {
        const dN = n2 - n1;
        const dE = e2 - e1;
        const distance = Math.sqrt(dN * dN + dE * dE);
        
        let bearingRad = Math.atan2(dE, dN); 
        let bearingDeg = bearingRad * (180 / Math.PI);
        if (bearingDeg < 0) bearingDeg += 360;
        
        return {
            distance: distance,
            bearing: this.decimalToDMS(bearingDeg),
            bearingDec: bearingDeg
        };
    }

    /**
     * Convert decimal degrees to DMS format.
     */
    decimalToDMS(decDeg) {
        const deg = Math.floor(decDeg);
        const minFloat = (decDeg - deg) * 60;
        const min = Math.floor(minFloat);
        const sec = Math.round((minFloat - min) * 60);
        
        let finalDeg = deg;
        let finalMin = min;
        let finalSec = sec;
        
        if (finalSec === 60) {
            finalSec = 0;
            finalMin += 1;
        }
        if (finalMin === 60) {
            finalMin = 0;
            finalDeg += 1;
        }
        if (finalDeg >= 360) {
            finalDeg -= 360;
        }
        
        return { deg: finalDeg, min: finalMin, sec: finalSec, str: `${finalDeg}° ${finalMin}' ${finalSec}"` };
    }

    /**
     * Compute Area using cross-multiplication (Shoelace) formula
     */
    computeArea(coords) {
        let areaSum = 0;
        const lines = [];

        for (let i = 0; i < coords.length; i++) {
            const current = coords[i];
            const next = coords[(i + 1) % coords.length];
            
            const cross1 = current.n * next.e;
            const cross2 = next.n * current.e;

            lines.push({
                stn: current.stn,
                n: current.n,
                e: current.e,
                cross1,
                cross2
            });

            areaSum += (cross1 - cross2);
        }
        
        const areaSqMeters = Math.abs(areaSum / 2);
        const areaHectares = areaSqMeters / 10000;
        const areaAcres = areaHectares * 2.47105;

        return {
            sqMeters: areaSqMeters,
            hectares: areaHectares,
            acres: areaAcres,
            details: lines
        };
    }

    /**
     * Compute Datum checks (simulating the 'datum' sheet from the Excel)
     */
    computeDatum(coords) {
        if (coords.length < 3) return null;
        
        // Take first 3 and last 3 coordinates (or close equivalents) to form datum checks.
        // In the traditional sheet, it uses first 3 as opening, last 3 as closing.
        // We will just return the lines for those specific segments.
        const opening = [];
        const closing = [];

        for(let i=0; i<Math.min(3, coords.length - 1); i++) {
            opening.push(this.getBearingDistance(coords[i].n, coords[i].e, coords[i+1].n, coords[i+1].e));
        }

        const len = coords.length;
        for(let i=len-3; i<len-1; i++) {
            if (i >= 0) {
                closing.push(this.getBearingDistance(coords[i].n, coords[i].e, coords[i+1].n, coords[i+1].e));
            }
        }

        return {
            opening,
            closing
        };
    }
}

// Export for usage in other scripts or UI
if (typeof module !== 'undefined' && module.exports) {
    module.exports = JRJEngine;
} else {
    window.JRJEngine = JRJEngine;
}
