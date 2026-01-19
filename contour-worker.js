// ========================================
// PRODUCTION-GRADE CONTOUR WEB WORKER
// ========================================
// Implements: Gaussian blur pre-processing, contour line tracing,
// topology cleanup, simplification, and smoothing
// 
// This runs in a dedicated Web Worker to prevent UI freezing

'use strict';

// ========================================
// MESSAGE HANDLER
// ========================================
self.onmessage = function (e) {
    const { type, payload } = e.data;

    try {
        switch (type) {
            case 'generate-contours':
                const result = generateContours(payload);
                self.postMessage({ type: 'contours-complete', payload: result });
                break;

            case 'ping':
                self.postMessage({ type: 'pong' });
                break;

            default:
                throw new Error(`Unknown message type: ${type}`);
        }
    } catch (error) {
        self.postMessage({
            type: 'error',
            payload: { message: error.message, stack: error.stack }
        });
    }
};

// ========================================
// MAIN CONTOUR GENERATION
// ========================================
function generateContours(params) {
    const {
        grid,
        width,
        height,
        bounds,
        cellSize,
        interval = 5,
        majorInterval = 25,
        blurPasses = 1,
        simplifyTolerance = null,
        smoothIterations = 2
    } = params;

    console.log('[Worker] Starting contour generation:', {
        gridSize: `${width}x${height}`,
        cellSize,
        interval,
        majorInterval,
        blurPasses
    });

    const startTime = performance.now();

    // Step 1: Pre-process grid with Gaussian blur
    // This is CRITICAL - removes TIN edge artifacts that cause mesh pattern
    let processedGrid = grid;
    for (let i = 0; i < blurPasses; i++) {
        processedGrid = blurGrid(processedGrid, width, height);
    }
    console.log(`[Worker] Grid blurred (${blurPasses} passes)`);

    // Step 2: Calculate elevation range
    let minZ = Infinity, maxZ = -Infinity;
    for (let r = 0; r < height; r++) {
        for (let c = 0; c < width; c++) {
            const val = processedGrid[r][c];
            if (val !== null && isFinite(val)) {
                if (val < minZ) minZ = val;
                if (val > maxZ) maxZ = val;
            }
        }
    }

    if (!isFinite(minZ) || !isFinite(maxZ)) {
        throw new Error('No valid elevation data in grid');
    }

    console.log(`[Worker] Elevation range: ${minZ.toFixed(2)}m to ${maxZ.toFixed(2)}m`);

    // Step 3: Generate contour levels
    const minLevel = Math.floor(minZ / interval) * interval;
    const maxLevel = Math.ceil(maxZ / interval) * interval;
    const levels = [];
    for (let elev = minLevel; elev <= maxLevel; elev += interval) {
        levels.push(elev);
    }

    console.log(`[Worker] Generating ${levels.length} contour levels`);

    // Step 4: Trace contours for each level using LINE TRACING (not segment collection!)
    const features = [];
    let totalLines = 0;

    for (const elevation of levels) {
        const lines = traceContoursAtLevel(processedGrid, width, height, elevation);

        if (lines.length === 0) continue;

        // Convert grid coordinates to world coordinates
        const worldLines = lines.map(line =>
            line.map(p => [
                bounds.minX + p[0] * cellSize,
                bounds.minY + p[1] * cellSize
            ])
        );

        // Merge nearby line endpoints
        const mergedLines = mergeLineEndpoints(worldLines, cellSize * 1.5);

        // Simplify
        const tolerance = simplifyTolerance || (cellSize * 0.3);
        const simplifiedLines = mergedLines
            .map(line => simplifyDouglasPeucker(line, tolerance))
            .filter(line => line.length >= 2);

        // Smooth
        const smoothedLines = smoothIterations > 0
            ? simplifiedLines.map(line => {
                let result = line;
                for (let i = 0; i < smoothIterations; i++) {
                    result = smoothChaikin(result);
                }
                return result;
            })
            : simplifiedLines;

        // Create GeoJSON features
        const isMajor = (elevation % majorInterval) === 0;

        for (const line of smoothedLines) {
            if (line.length < 2) continue;

            features.push({
                type: 'Feature',
                properties: {
                    elevation: elevation,
                    isMajor: isMajor,
                    pointCount: line.length
                },
                geometry: {
                    type: 'LineString',
                    coordinates: line
                }
            });
            totalLines++;
        }
    }

    const elapsed = performance.now() - startTime;
    console.log(`[Worker] Generated ${totalLines} contour lines in ${elapsed.toFixed(0)}ms`);

    return {
        type: 'FeatureCollection',
        features: features,
        metadata: {
            totalLines,
            elevationRange: [minZ, maxZ],
            interval,
            majorInterval,
            processingTimeMs: elapsed
        }
    };
}

// ========================================
// GAUSSIAN BLUR (CRITICAL FOR TIN ARTIFACTS)
// ========================================
function blurGrid(grid, width, height) {
    // 3x3 Gaussian kernel
    const kernel = [
        [1 / 16, 2 / 16, 1 / 16],
        [2 / 16, 4 / 16, 2 / 16],
        [1 / 16, 2 / 16, 1 / 16]
    ];

    const blurred = new Array(height);

    for (let r = 0; r < height; r++) {
        blurred[r] = new Array(width);

        for (let c = 0; c < width; c++) {
            const centerVal = grid[r][c];

            // Skip null cells
            if (centerVal === null || !isFinite(centerVal)) {
                blurred[r][c] = centerVal;
                continue;
            }

            let sum = 0;
            let weightSum = 0;

            for (let kr = -1; kr <= 1; kr++) {
                for (let kc = -1; kc <= 1; kc++) {
                    const nr = r + kr;
                    const nc = c + kc;

                    if (nr >= 0 && nr < height && nc >= 0 && nc < width) {
                        const val = grid[nr][nc];
                        if (val !== null && isFinite(val)) {
                            const weight = kernel[kr + 1][kc + 1];
                            sum += val * weight;
                            weightSum += weight;
                        }
                    }
                }
            }

            blurred[r][c] = weightSum > 0 ? sum / weightSum : centerVal;
        }
    }

    return blurred;
}

// ========================================
// CONTOUR LINE TRACING ALGORITHM
// ========================================
// This traces contours cell-by-cell, producing continuous lines
// instead of collecting disconnected segments

function traceContoursAtLevel(grid, width, height, isoValue) {
    const lines = [];
    const visited = new Set();

    // For each cell, check if contour passes through
    for (let row = 0; row < height - 1; row++) {
        for (let col = 0; col < width - 1; col++) {
            const a = grid[row][col];       // top-left
            const b = grid[row][col + 1];   // top-right
            const c = grid[row + 1][col + 1]; // bottom-right
            const d = grid[row + 1][col];   // bottom-left

            // Skip cells with null values
            if (a === null || b === null || c === null || d === null) continue;

            // Calculate cell case
            let cellCase = 0;
            if (a >= isoValue) cellCase |= 1;
            if (b >= isoValue) cellCase |= 2;
            if (c >= isoValue) cellCase |= 4;
            if (d >= isoValue) cellCase |= 8;

            // Skip cells with no contour (all above or all below)
            if (cellCase === 0 || cellCase === 15) continue;

            // Check if we've already traced a contour starting from this cell's edges
            const edgeKeys = getEdgeKeys(row, col, cellCase);

            for (const edgeKey of edgeKeys) {
                if (visited.has(edgeKey)) continue;

                // Trace contour line starting from this edge
                const line = traceContourFromEdge(grid, width, height, isoValue, row, col, edgeKey, visited);

                if (line && line.length >= 2) {
                    lines.push(line);
                }
            }
        }
    }

    return lines;
}

function getEdgeKeys(row, col, cellCase) {
    const keys = [];

    // Determine which edges have contour crossings based on case
    // Edge naming: T=top, R=right, B=bottom, L=left
    const hasTop = ((cellCase & 1) !== 0) !== ((cellCase & 2) !== 0);
    const hasRight = ((cellCase & 2) !== 0) !== ((cellCase & 4) !== 0);
    const hasBottom = ((cellCase & 4) !== 0) !== ((cellCase & 8) !== 0);
    const hasLeft = ((cellCase & 1) !== 0) !== ((cellCase & 8) !== 0);

    if (hasTop) keys.push(`T:${row}:${col}`);
    if (hasRight) keys.push(`R:${row}:${col}`);
    if (hasBottom) keys.push(`B:${row}:${col}`);
    if (hasLeft) keys.push(`L:${row}:${col}`);

    return keys;
}

function traceContourFromEdge(grid, width, height, isoValue, startRow, startCol, startEdgeKey, visited) {
    const line = [];
    let row = startRow;
    let col = startCol;
    let entryEdge = startEdgeKey.split(':')[0]; // T, R, B, or L

    const maxIterations = width * height * 2; // Safety limit
    let iterations = 0;

    while (iterations++ < maxIterations) {
        const a = grid[row][col];
        const b = grid[row][col + 1];
        const c = grid[row + 1][col + 1];
        const d = grid[row + 1][col];

        if (a === null || b === null || c === null || d === null) break;

        // Calculate crossing points on each edge
        const crossings = {};

        // Top edge (a-b)
        if ((a >= isoValue) !== (b >= isoValue)) {
            const t = (isoValue - a) / (b - a);
            crossings.T = [col + t, row];
        }

        // Right edge (b-c)
        if ((b >= isoValue) !== (c >= isoValue)) {
            const t = (isoValue - b) / (c - b);
            crossings.R = [col + 1, row + t];
        }

        // Bottom edge (d-c)
        if ((d >= isoValue) !== (c >= isoValue)) {
            const t = (isoValue - d) / (c - d);
            crossings.B = [col + t, row + 1];
        }

        // Left edge (a-d)
        if ((a >= isoValue) !== (d >= isoValue)) {
            const t = (isoValue - a) / (d - a);
            crossings.L = [col, row + t];
        }

        // Find exit edge (any crossing that's not the entry edge)
        const crossingEdges = Object.keys(crossings).filter(e => e !== entryEdge);

        if (crossingEdges.length === 0) break;

        // For saddle points (2 exits), choose based on center value
        let exitEdge = crossingEdges[0];
        if (crossingEdges.length > 1) {
            // Use center value to resolve ambiguity
            const center = (a + b + c + d) / 4;
            // Choose the exit that maintains contour continuity
            if (center >= isoValue) {
                exitEdge = crossingEdges[0];
            } else {
                exitEdge = crossingEdges[crossingEdges.length - 1];
            }
        }

        // Add crossing point to line
        const point = crossings[exitEdge];
        if (point) {
            line.push(point);
        }

        // Mark this edge as visited
        const edgeKey = `${exitEdge}:${row}:${col}`;
        if (visited.has(edgeKey)) break;
        visited.add(edgeKey);

        // Move to next cell based on exit edge
        let nextRow = row, nextCol = col;
        let nextEntryEdge = '';

        switch (exitEdge) {
            case 'T':
                nextRow = row - 1;
                nextEntryEdge = 'B';
                break;
            case 'R':
                nextCol = col + 1;
                nextEntryEdge = 'L';
                break;
            case 'B':
                nextRow = row + 1;
                nextEntryEdge = 'T';
                break;
            case 'L':
                nextCol = col - 1;
                nextEntryEdge = 'R';
                break;
        }

        // Check if next cell is valid
        if (nextRow < 0 || nextRow >= height - 1 || nextCol < 0 || nextCol >= width - 1) {
            break; // Reached grid boundary
        }

        // Also mark the corresponding entry edge in the next cell as visited
        const nextEdgeKey = `${nextEntryEdge}:${nextRow}:${nextCol}`;
        visited.add(nextEdgeKey);

        row = nextRow;
        col = nextCol;
        entryEdge = nextEntryEdge;
    }

    return line;
}

// ========================================
// LINE MERGING
// ========================================
function mergeLineEndpoints(lines, threshold) {
    if (lines.length <= 1) return lines;

    const merged = [];
    const used = new Set();

    for (let i = 0; i < lines.length; i++) {
        if (used.has(i)) continue;

        let current = [...lines[i]];
        used.add(i);

        let foundMerge = true;
        while (foundMerge) {
            foundMerge = false;

            for (let j = 0; j < lines.length; j++) {
                if (used.has(j)) continue;

                const other = lines[j];
                const currentStart = current[0];
                const currentEnd = current[current.length - 1];
                const otherStart = other[0];
                const otherEnd = other[other.length - 1];

                // Check all 4 connection possibilities
                const d1 = distance(currentEnd, otherStart);
                const d2 = distance(currentEnd, otherEnd);
                const d3 = distance(currentStart, otherStart);
                const d4 = distance(currentStart, otherEnd);

                const minDist = Math.min(d1, d2, d3, d4);

                if (minDist <= threshold) {
                    used.add(j);
                    foundMerge = true;

                    if (minDist === d1) {
                        // current end -> other start
                        current = current.concat(other.slice(1));
                    } else if (minDist === d2) {
                        // current end -> other end (reverse other)
                        current = current.concat(other.slice(0, -1).reverse());
                    } else if (minDist === d3) {
                        // current start -> other start (reverse other, prepend)
                        current = other.slice(1).reverse().concat(current);
                    } else {
                        // current start -> other end (prepend)
                        current = other.slice(0, -1).concat(current);
                    }
                    break;
                }
            }
        }

        merged.push(current);
    }

    return merged;
}

function distance(p1, p2) {
    const dx = p1[0] - p2[0];
    const dy = p1[1] - p2[1];
    return Math.sqrt(dx * dx + dy * dy);
}

// ========================================
// DOUGLAS-PEUCKER SIMPLIFICATION
// ========================================
function simplifyDouglasPeucker(points, tolerance) {
    if (!points || points.length <= 2) return points;

    let maxDist = 0;
    let maxIndex = 0;
    const end = points.length - 1;

    for (let i = 1; i < end; i++) {
        const d = perpendicularDistance(points[i], points[0], points[end]);
        if (d > maxDist) {
            maxDist = d;
            maxIndex = i;
        }
    }

    if (maxDist > tolerance) {
        const left = simplifyDouglasPeucker(points.slice(0, maxIndex + 1), tolerance);
        const right = simplifyDouglasPeucker(points.slice(maxIndex), tolerance);
        return left.slice(0, -1).concat(right);
    } else {
        return [points[0], points[end]];
    }
}

function perpendicularDistance(point, lineStart, lineEnd) {
    const dx = lineEnd[0] - lineStart[0];
    const dy = lineEnd[1] - lineStart[1];
    const lenSq = dx * dx + dy * dy;

    if (lenSq === 0) {
        return distance(point, lineStart);
    }

    const t = Math.max(0, Math.min(1,
        ((point[0] - lineStart[0]) * dx + (point[1] - lineStart[1]) * dy) / lenSq
    ));

    const projection = [
        lineStart[0] + t * dx,
        lineStart[1] + t * dy
    ];

    return distance(point, projection);
}

// ========================================
// CHAIKIN SMOOTHING
// ========================================
function smoothChaikin(points, iterations = 1) {
    if (!points || points.length < 3) return points;

    let result = points;

    for (let iter = 0; iter < iterations; iter++) {
        const smoothed = [result[0]]; // Keep first point

        for (let i = 0; i < result.length - 1; i++) {
            const p0 = result[i];
            const p1 = result[i + 1];

            // Generate two new points at 1/4 and 3/4 positions
            smoothed.push([
                p0[0] * 0.75 + p1[0] * 0.25,
                p0[1] * 0.75 + p1[1] * 0.25
            ]);
            smoothed.push([
                p0[0] * 0.25 + p1[0] * 0.75,
                p0[1] * 0.25 + p1[1] * 0.75
            ]);
        }

        smoothed.push(result[result.length - 1]); // Keep last point
        result = smoothed;
    }

    return result;
}

console.log('[Worker] Contour worker loaded and ready');
