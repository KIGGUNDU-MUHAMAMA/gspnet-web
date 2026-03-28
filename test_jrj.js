const JRJEngine = require('./jrj_engine.js');

const engine = new JRJEngine();

// Coordinates from the formulas_dump.txt Area Comp section:
// Row 21: CM1 549409.626 168004.332
// Row 22: IP/5421 549416.164 168002.753
// Row 23: CM6 549425.850 167794.731
// Row 24: CM5 549398.978 167791.194
// Row 25: CM4 549392.085 167805.171
// Row 26: RIR/3582 549329.791 167847.421
// Row 27: CM2 549335.080 168002.539

const coords = [
    { stn: 'CM1', n: 549409.626, e: 168004.332 },
    { stn: 'IP/5421', n: 549416.164, e: 168002.753 },
    { stn: 'CM6', n: 549425.850, e: 167794.731 },
    { stn: 'CM5', n: 549398.978, e: 167791.194 },
    { stn: 'CM4', n: 549392.085, e: 167805.171 },
    { stn: 'RIR/3582', n: 549329.791, e: 167847.421 },
    { stn: 'CM2', n: 549335.080, e: 168002.539 }
];

const result = engine.computeAll(coords);
console.log("=== TRAVERSE ===");
result.traverse.forEach(t => {
    console.log(`${t.from} -> ${t.to}: Dist=${t.distance.toFixed(3)}, Bearing=${t.bearing.str}`);
});

console.log("\n=== AREA ===");
console.log(`Area Sq. Meters: ${result.area.sqMeters.toFixed(3)}`);
console.log(`Area Hectares: ${result.area.hectares.toFixed(4)}`);
console.log(`Area Acres: ${result.area.acres.toFixed(3)}`);
