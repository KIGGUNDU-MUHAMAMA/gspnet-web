# Geospatial Network Uganda (GSP.NET) Chatbot Knowledge Base

## About GSP.NET
Geospatial Network Uganda (GSP.NET) is the future of Cadastral & Geospatial Intelligence in Uganda. It is an all-in-one professional GIS platform powering cadastral surveys, terrain analysis, property valuation, and real-time collaboration across the country. GSP.NET unifies the entire geospatial workflow—from raw survey data to professional-grade reports—in a single browser-based application.

## Authorship and Affiliations
This project is led by **Kiggundu Muhamad** of **N.A.S. Surveyors Ltd** (P.O. Box 30564 Kampala, Uganda) under the guidance of **Surveyor R.S.U. Katabu Simon**. The work is generously supported by various registered surveyors of Uganda who share the vision of modernizing land administration and geospatial data management.

## Research Inspiration & Core Principles
The conceptualization and continuous development of GSP.NET are deeply inspired by contemporary academic research in land administration, notably the structural insights discussed in studies such as **"land-10-00629.pdf" (MDPI Land 10:629)**. The platform embraces the core principles outlined in this research—emphasizing the integration of cadastral information, the modernization of land tenure systems, and the critical need for robust data-sharing frameworks to support sustainable development and secure property rights in Uganda.

## Why a Data Sharing and Storing Platform is Important for Surveyors
For the Ugandan surveying community, a centralized data sharing and storing platform like GSP.NET is vital for several reasons:
- **Elimination of Redundancy:** Surveyors can easily verify existing data to avoid overlapping surveys and duplication of effort.
- **Data Preservation & Security:** Historical survey data is safely archived in the cloud, preventing the loss of critical cadastral information due to physical damage, hardware failure, or misplacement.
- **Enhanced Collaboration:** Real-time team chat and geo-tagged quality flags allow seamless communication between field teams, draftsmen, and certifying surveyors.
- **Consistency & Standards:** Using a unified platform ensures that all professionals adhere to the exact same coordinate systems, symbology (240+ standardized symbols), and reporting formats.
- **Faster Turnaround:** With automated tools (like 50+ GIS tools, multiple base maps, and instant export to CSV/DXF), surveyors can deliver final reports and land valuations much faster.
- **Market Confidence:** Secure and fast access to validated property data builds public trust and reduces land disputes.

## Platform Features & Toolkit
- **Interactive WebMap:** Powered by OpenLayers with multiple base maps (Satellite, Topo, OSM, Terrain), drawing tools, coordinate search (UTM, Lat/Lng), and high-res exporting.
- **Terrain Intelligence:** DTM Generation (IDW/TIN), Contour Lines, 3D Visualization, and advanced analysis (slope, aspect, volume).
- **Property Valuation:** Automated valuation engine using comparable sales, statistical charts, risk indicators, and professional PDF reports.
- **Data Import & Export:** Supports CSV, DWG, DXF, and GeoJSON with automatic coordinate system detection.
- **Measurement & Polygon Tools:** Parcel creation with area calculation, profile cross-sections, and distance measurements.
- **Symbols Library & Quality Flags:** 240+ professional cartographic symbols and geo-tagged quality control flags for tracking project status.
- **Tech Stack:** OpenLayers 9, Supabase, PostgreSQL, GeoServer, Cloudflare Workers, Three.js, Chart.js, jsPDF.

## Roadmap
- **Phase 1 (Core Platform):** Interactive map, coordinate tools, data import and sharing.
- **Phase 2 (Terrain & Analysis):** DTM generation, contours, 3D viewer, slope/aspect analysis, and hydrology.
- **Phase 3 (Valuation Engine):** Auto-valuation, comparable analysis, PDF reports & valuation history.
- **Phase 4 (AI & Scale):** AI-powered insights, mobile app, API integrations, and nationwide coverage.

## Step-by-Step Guides for WebMap Tools

### 1. Place Search (Property Search)
- **What it does:** Allows you to find specific locations, landmarks, or addresses on the map.
- **How to use:**
  1. Click the **Property Search** button (magnifying glass with location pin icon) in the chat panel or map controls.
  2. Type the name of the place, district, or landmark you are looking for.
  3. Select the correct result from the dropdown suggestions.
  4. The map will automatically pan and zoom to the selected location, placing a marker for reference.

### 2. Coordinate Search (Go To Coordinate)
- **What it does:** Jumps to an exact geographic location using UTM or Latitude/Longitude coordinates.
- **How to use:**
  1. Open the Coordinate Search tool from the main navigation panel.
  2. Select your preferred coordinate system (e.g., Arc 1960 UTM Zone 36N, WGS84 Lat/Lng).
  3. Enter the Eastings/Northings or Latitude/Longitude values.
  4. Click "Search" or "Go". The map will center exactly on those coordinates.

### 3. Locate Me (Current Location)
- **What it does:** Uses your device's GPS to find your exact current location on the map.
- **How to use:**
  1. Look for the **"Locate Me"** or **"My Location"** button (usually a crosshair or GPS icon) on the map interface.
  2. Click it. If prompted by your browser, grant location access permissions.
  3. The map will zoom to your current location and display a glowing blue dot.
  4. *Note: Best used on mobile devices or tablets in the field for real-time tracking.*

### 4. Print / Export Map

### 5. Best Practices for Map Performance
- **Loading Heavy Layers:** To ensure optimal performance and fast layer rendering, you should load layers only for your specific area of interest.
  1. Navigate to your target location first using the **Place Search** or **Coordinate Search** tools (we recommend being at Zoom Level 10 or closer).
  2. Once you are centered on the correct area, turn on the desired layers from the Layer Switcher.
  3. After the layer has fully loaded, you can zoom out and pan around the area as needed.

### 6. Additional GSP.NET Platform Features
- **GSP.NET Updates:** A dedicated tool that empowers registered surveyors to plot cadastral updates and surveys directly onto the system in real-time.
- **Parcel Search:** This search engine allows users to rapidly search for and identify dedicated parcels strictly from within the loaded Survey Polygons layer.
- **Project Library:** A robust, centralized repository that allows surveyors to organize, find, and seamlessly download essential project files including surveying CSVs, technical JRJ computation files, and CAD drawings.

# ADDITIONAL SYSTEM GUIDES




## 3D_Terrain_Workflow_Guide.txt


GSP.NET 3D Terrain & Contours Toolbox - Complete Workflow Guide

================================================================================
TABLE OF CONTENTS
================================================================================
1. Overview & Purpose
2. Step-by-Step Workflow
3. Button Functions & Calculations
4. Academic Questions & Answers
5. Best Practices & Tips
6. Troubleshooting

================================================================================
1. OVERVIEW & PURPOSE
================================================================================

The 3D Terrain & Contours toolbox enables surveyors and GIS professionals to:
- Generate Digital Terrain Models (DTM) from point cloud data
- Create smooth, professional contour lines (QGIS-quality)
- Perform terrain analysis (slope, aspect, curvature)
- Calculate earthwork volumes (cut/fill, stockpiles)
- Generate profile views and cross-sections
- Export terrain data in multiple formats (STL, OBJ, GeoTIFF, LAS)
- Classify terrain features (peaks, valleys, ridges, etc.)

The system uses advanced interpolation algorithms (TIN, IDW) and smoothing techniques
(Catmull-Rom splines) to produce publication-quality terrain visualizations.

================================================================================
2. STEP-BY-STEP WORKFLOW
================================================================================

STEP 1: DATA PREPARATION
-------------------------
1.1. Open webmap.html and click the "3D Terrain & Contours" button in the left dock
1.2. In the "Data Source" section, choose one of:
    - Import New CSV: Upload a CSV file with X, Y, Z coordinates
    - Use Existing Data: Search and select from previously saved datasets
    - Combine Both: Merge imported CSV with existing database points

1.3. If importing CSV:
    - Click "Browse Files" or drag-drop your CSV file
    - Select the coordinate system (default: WGS84 UTM Zone 36N)
    - Ensure CSV has columns: X, Y, Z (or Easting, Northing, Elevation)
    - Click to load points on the map

1.4. If using existing data:
    - Use filters (District, Nature, Project Name, Surveyor, Date Range)
    - Click "Search Projects"
    - Select datasets from the "Available Datasets" list
    - Click "Use Selected" to load points

STEP 2: DEFINE PROCESSING EXTENT (OPTIONAL)
--------------------------------------------
2.1. Click "Draw Extent Polygon" to define a boundary
2.2. Click on the map to create polygon vertices
2.3. Double-click to finish the polygon
2.4. The system shows:
    - Area (m²)
    - Perimeter (m)
    - Points inside vs. excluded
2.5. Toggle "Use Custom Extent" to enable filtering
2.6. Only points inside the extent will be used for DTM/contour generation

STEP 3: CONFIGURE DTM SETTINGS
-------------------------------
3.1. Grid Resolution (Cell Size):
    - Default: 5 meters
    - Range: 1-20 meters
    - Smaller = More detail but slower processing
    - Recommended: 5m for general use, 2-3m for detailed surveys

3.2. Interpolation Method:
    - TIN (Triangulated Irregular Network): Sharp, realistic terrain (QGIS-like)
    - IDW Smooth (Power=2): Smooth interpolation, good for general terrain
    - IDW Sharp (Power=4): More weight to nearby points, sharper features
    - Nearest Neighbor: Fast but blocky, use for quick previews

3.3. IDW Parameters (if using IDW):
    - IDW Power: 1-5 (default: 2)
      * Higher = More influence from nearby points
      * Lower = More averaging across distance
    - Max Distance: 100-10000m (default: 1000m)
      * Maximum search radius for interpolation
      * Points beyond this distance are ignored

3.4. Color Ramp:
    - Elevation: Blue-Cyan-Green-Yellow-Red-White (standard)
    - Terrain: Green-Brown-White (natural)
    - Grayscale: Black-White (best for 3D effect)
    - Viridis, Spectral, Plasma: Scientific color schemes

3.5. Hillshade Settings:
    - Enable "Apply Hillshade Effect" for 3D visualization
    - Multidirectional: Uses 4 light sources for enhanced 3D effect
    - Azimuth: 0-360° (default: 315° = Northwest)
    - Altitude: 0-90° (default: 45°)
    - Z-Factor: 0.1-5.0 (default: 1.0) - Vertical exaggeration
    - Blend Mode: Multiply, Overlay, or Soft Light
    - Opacity: 0-100% (default: 50%)

3.6. Display Adjustments:
    - Contrast: -100 to +100 (enhance terrain features)
    - Brightness: -100 to +100 (adjust overall lightness)
    - DTM Layer Opacity: 0-100% (default: 80%)

STEP 4: GENERATE DTM
--------------------
4.1. Click the "DTM" button in the action buttons section
4.2. The system:
    - Validates point data (minimum 3 points required)
    - Creates a regular grid based on cell size
    - Interpolates elevation for each grid cell using selected method
    - Applies color ramp and hillshade
    - Displays the DTM as a raster layer on the map
4.3. Processing time depends on:
    - Number of points
    - Grid resolution (smaller = more cells = slower)
    - Interpolation method (TIN is fastest, IDW slower)
4.4. Once complete, the "Show DTM Layer" checkbox becomes enabled
4.5. Toggle DTM visibility on/off as needed

STEP 5: CONFIGURE CONTOUR SETTINGS
-----------------------------------
5.1. Contour Interval:
    - Default: 5 meters
    - Range: 1 meter and above (0.5m steps)
    - Smaller = More detailed contours (slower generation)
    - Recommended: 5m for general use, 2-3m for detailed surveys

5.2. Major Interval:
    - Default: 25 meters (every 5th contour)
    - Defines which contours are "major" (thicker, labeled)
    - Should be a multiple of contour interval

5.3. Minor Contours Styling:
    - Color: Default #888888 (gray)
    - Width: 0.5-5.0 (default: 1.0)
    - Style: Solid, Dashed, or Dotted

5.4. Major Contours Styling:
    - Color: Default #8b4513 (brown)
    - Width: 0.5-5.0 (default: 2.0)
    - Style: Solid, Dashed, or Dotted

5.5. Contour Labels:
    - Enable "Show Contour Labels"
    - Label Spacing: 10-1000m (default: 100m)
    - Max Labels per Contour: 1-5 (default: 3)
    - Label Frequency: Every 1st, 2nd, 3rd, or 5th major contour
    - Rotate Labels: Labels follow contour direction
    - Font Size: 8-16px (default: 11px)
    - Minor Contour Labels: Optional, smaller font

5.6. Contour Refinement:
    - Smoothing: Enabled by default (Chaikin + Catmull-Rom splines)
    - Smoothing Iterations: 0-5 (default: 3)
      * More iterations = smoother but slower
    - Simplification: Optional (Douglas-Peucker algorithm)
    - Simplification Tolerance: 0.1-5.0m (default: 1.0m)

STEP 6: GENERATE CONTOURS
-------------------------
6.1. Click the "Contours" button in the action buttons section
6.2. The system:
    - Uses the generated DTM grid data
    - Applies marching squares algorithm for each elevation level
    - Connects segments into continuous contour lines
    - Applies smoothing (if enabled)
    - Styles major and minor contours
    - Places labels on straight sections
    - Displays contours as vector layer on the map
6.3. Processing time depends on:
    - Grid resolution
    - Elevation range (more levels = more contours)
    - Smoothing iterations
6.4. Once complete, the "Show Contour Layer" checkbox becomes enabled
6.5. Toggle contour visibility on/off as needed

STEP 7: TERRAIN ANALYSIS (OPTIONAL)
------------------------------------
7.1. Select Analysis Type:
    - Slope Map: Shows terrain gradient (steepness)
    - Aspect Map: Shows slope direction (compass bearing)
    - Curvature Map: Shows terrain shape (convex/concave)

7.2. Select Display Unit:
    - Degrees: 0-90° for slope, 0-360° for aspect
    - Percent: 0-100% for slope (rise/run * 100)

7.3. Enable "Show Statistics Panel" for min/max/mean values

7.4. Click "Generate Analysis"
7.5. The analysis layer appears with color-coded values
7.6. Toggle "Show Analysis Layer" to view/hide

STEP 8: VOLUME CALCULATIONS (OPTIONAL)
---------------------------------------
8.1. Select Calculation Type:
    - Volume to Reference Plane: Cut/fill to a flat elevation
    - Volume in Polygon: Volume within a drawn polygon
    - Compare Two Surfaces: Difference between two DTMs
    - Stockpile Volume: Volume above base elevation

8.2. For Reference Plane:
    - Enter reference plane elevation (meters)
    - Click "Calculate Volume"
    - Results show: Cut volume, Fill volume, Net volume, Area

8.3. For Polygon Volume:
    - Draw a polygon on the map
    - System calculates volume within polygon
    - Results show: Volume, Average depth, Area

8.4. For Stockpile:
    - System auto-detects base elevation (edge cells)
    - Calculates volume above base
    - Estimates tonnage (assumes 1.8 tons/m³)

STEP 9: PROFILE GENERATION (OPTIONAL)
--------------------------------------
9.1. Click the "Profile" button in action buttons
9.2. Draw Alignment:
    - Click "Start Drawing Alignment"
    - Click on map to create alignment path
    - Double-click to finish
9.3. Configure Settings:
    - Sampling Interval: 1-100m (default: 10m)
    - Station Interval: 10-500m (default: 50m)
    - Show Contour Crossings: Mark where contours cross alignment
    - Show Station Markers: Display station numbers
9.4. Optional: Design Grade
    - Enable "Enable Design Grade"
    - Enter grade percentage (-15% to +15%)
    - Enter start elevation
    - Configure side slope (H:V ratio) and road width
9.5. Click "Generate Profile"
9.6. Results show:
    - Profile chart (elevation vs. distance)
    - Min/Max/Average elevation
    - Cut/Fill volumes (if design grade enabled)
    - Cross sections (if enabled)

STEP 10: EXPORT & SHARING
--------------------------
10.1. 3D Export Formats:
     - STL: For 3D printing (stereolithography)
     - OBJ: For 3D modeling software (Blender, SketchUp)
     - GeoTIFF: Raster format with georeferencing
     - LAS: Point cloud format (LiDAR standard)

10.2. Set Vertical Exaggeration: 0.1-10.0 (default: 1.0)

10.3. Click export button for desired format
10.4. File downloads automatically

STEP 11: TERRAIN CLASSIFICATION (OPTIONAL)
--------------------------------------------
11.1. Select Classification Type:
     - Basic: Peaks, Valleys, Ridges, Pits
     - Advanced: Passes, Saddles, Planes, Channels
     - Landform: Hills, Mountains, Plains, Depressions

11.2. Click "Classify Terrain"
11.3. System analyzes slope and curvature to identify features
11.4. Results displayed as colored zones on map
11.5. Statistics panel shows feature counts and percentages

STEP 12: SAVE CONFIGURATION
----------------------------
12.1. Click "Save Config" to store current settings
12.2. Settings saved to browser localStorage
12.3. Next session will load saved configuration

STEP 13: CLEAR ALL (IF NEEDED)
--------------------------------
13.1. Click "Clear All" to remove all terrain layers
13.2. Confirms before clearing
13.3. Resets all settings to defaults

================================================================================
3. BUTTON FUNCTIONS & CALCULATIONS
================================================================================

3.1. DTM BUTTON - "Generate DTM Only"
--------------------------------------
FUNCTION:
Creates a Digital Terrain Model from point cloud data using interpolation.

CALCULATION PROCESS:
1. Validates input: Minimum 3 points required
2. Calculates extent: minX, maxX, minY, maxY, minZ, maxZ from all points
3. Creates grid: width = ceil((maxX - minX) / cellSize), height = ceil((maxY - minY) / cellSize)
4. For each grid cell (row, col):
   a. Calculate cell center: x = minX + (col * cellSize) + (cellSize/2)
                              y = minY + (row * cellSize) + (cellSize/2)
   b. Apply interpolation method:
      - TIN: Find 3 nearest points, form triangle, use barycentric coordinates
      - IDW: Weighted average: z = Σ(wi * zi) / Σ(wi)
             where wi = 1 / (distance^power)
      - Nearest: Use elevation of closest point
5. Apply color ramp: Map elevation to RGB color based on min/max range
6. Calculate hillshade (if enabled):
   - Horn's method: dz/dx, dz/dy using 3x3 kernel
   - Slope = atan(sqrt(dz/dx² + dz/dy²))
   - Aspect = atan2(dz/dy, -dz/dx)
   - Hillshade = 255 * ((cos(altitude) * cos(slope)) + 
                        (sin(altitude) * sin(slope) * cos(azimuth - aspect)))
7. Blend hillshade with color ramp using selected blend mode
8. Render as image layer on map

MATHEMATICAL FORMULAS:
- IDW Interpolation: z(x,y) = Σ(zi / di^p) / Σ(1 / di^p)
  where di = distance from (x,y) to point i, p = power parameter
- TIN Barycentric: z = w1*z1 + w2*z2 + w3*z3
  where w1, w2, w3 are barycentric coordinates (sum to 1)
- Hillshade: HS = 255 * (cos(alt) * cos(slope) + sin(alt) * sin(slope) * cos(az - aspect))

3.2. CONTOURS BUTTON - "Generate Contours Only"
------------------------------------------------
FUNCTION:
Generates smooth contour lines from DTM grid using marching squares algorithm.

CALCULATION PROCESS:
1. Requires DTM grid data (must generate DTM first)
2. Calculate contour levels: minElev to maxElev in steps of contourInterval
3. For each elevation level:
   a. Apply marching squares algorithm:
      - For each 2x2 cell block in grid
      - Determine which cell corners are above/below contour level
      - Use lookup table (16 cases) to determine edge intersections
      - Interpolate intersection points along cell edges
   b. Connect segments into continuous polylines:
      - Match segment endpoints (within 0.001m tolerance)
      - Build continuous lines from connected segments
   c. Convert grid coordinates to geographic coordinates:
      - x = minX + (gridX * cellSize)
      - y = minY + (gridY * cellSize)
   d. Apply smoothing (if enabled):
      - Stage 1: Chaikin's corner cutting (2 iterations)
      - Stage 2: Catmull-Rom spline interpolation
        * Adaptive segment count based on distance
        * Tension parameter = 0.5 (centripetal)
   e. Classify as major/minor: if (elevation % majorInterval === 0) then major
4. Style contours:
   - Apply color, width, style (solid/dashed/dotted)
   - Place labels on straight sections (if enabled)
5. Create vector features and add to map layer

MATHEMATICAL FORMULAS:
- Marching Squares: 16 cases based on 4 corner values (2^4 = 16)
- Linear Interpolation: t = (isoValue - v1) / (v2 - v1)
                        point = p1 + t * (p2 - p1)
- Chaikin Smoothing: q = 0.75*p1 + 0.25*p2, r = 0.25*p1 + 0.75*p2
- Catmull-Rom Spline: Uses 4 control points (p0, p1, p2, p3)
  Basis functions: m00, m01, m02, m03 with tension parameter

3.3. PROFILE BUTTON - "Generate Profile from Alignment"
--------------------------------------------------------
FUNCTION:
Creates elevation profile along a drawn alignment path.

CALCULATION PROCESS:
1. User draws alignment line on map
2. Sample points along alignment:
   - Distance = 0, samplingInterval, 2*samplingInterval, ...
   - For each distance, interpolate (x, y) along line
   - Query DTM grid for elevation at (x, y)
3. If design grade enabled:
   - Calculate design elevation: startElev + (distance * grade/100)
   - Calculate cut/fill depth: actualElev - designElev
4. Generate profile chart:
   - X-axis: Distance along alignment
   - Y-axis: Elevation
   - Plot actual elevation line
   - Plot design grade line (if enabled)
   - Shade cut/fill areas
5. Calculate statistics:
   - Min/Max/Average elevation
   - Total cut volume, fill volume, net volume
   - Cross-sectional areas (if side slopes defined)

MATHEMATICAL FORMULAS:
- Linear Interpolation along line: t = distance / totalLength
                                  point = startPoint + t * (endPoint - startPoint)
- Design Elevation: E_design = E_start + (distance * grade / 100)
- Cross-Section Area (trapezoidal): A = (width + width + 2*sideSlope*depth) * depth / 2
- Volume (average end area): V = ((A1 + A2) / 2) * length

3.4. TERRAIN ANALYSIS BUTTON - "Generate Analysis"
--------------------------------------------------
FUNCTION:
Calculates slope, aspect, or curvature maps from DTM.

SLOPE CALCULATION:
1. For each grid cell (except edges):
   - Use Horn's method with 3x3 kernel:
     dz/dx = ((z[row-1][col+1] + 2*z[row][col+1] + z[row+1][col+1]) -
              (z[row-1][col-1] + 2*z[row][col-1] + z[row+1][col-1])) / (8 * cellSize)
     dz/dy = ((z[row+1][col-1] + 2*z[row+1][col] + z[row+1][col+1]) -
              (z[row-1][col-1] + 2*z[row-1][col] + z[row-1][col+1])) / (8 * cellSize)
   - Calculate slope: slope = atan(sqrt(dz/dx² + dz/dy²))
   - Convert to degrees: slope_deg = slope * 180 / π
   - Convert to percent: slope_pct = tan(slope) * 100
2. Apply color ramp (green = flat, red = steep)
3. Calculate statistics: min, max, mean, std dev

ASPECT CALCULATION:
1. Calculate dz/dx and dz/dy (same as slope)
2. Calculate aspect: aspect = atan2(dz/dy, -dz/dx) * 180 / π
3. Convert to compass bearing: bearing = 90 - aspect
   - Adjust to 0-360° range
   - 0° = North, 90° = East, 180° = South, 270° = West
4. Apply color ramp (rainbow: red=North, yellow=East, cyan=South, blue=West)
5. Flat areas (slope < 0.0001) set to -1 (no aspect)

CURVATURE CALCULATION:
1. Calculate second derivatives:
   zxx = (z[row][col+1] + z[row][col-1] - 2*z) / (cellSize²)
   zyy = (z[row+1][col] + z[row-1][col] - 2*z) / (cellSize²)
   zxy = (z[row+1][col+1] + z[row-1][col-1] - 
          z[row+1][col-1] - z[row-1][col+1]) / (4 * cellSize²)
2. Calculate first derivatives:
   zx = (z[row][col+1] - z[row][col-1]) / (2 * cellSize)
   zy = (z[row+1][col] - z[row-1][col]) / (2 * cellSize)
3. Profile Curvature (in direction of slope):
   profileCurv = -(p*zxx + 2*zx*zy*zxy + q*zyy) / (pq * (1 + pq)^1.5)
   where p = zx², q = zy², pq = p + q
4. Plan Curvature (perpendicular to slope):
   planCurv = -(q*zxx - 2*zx*zy*zxy + p*zyy) / (pq * (1 + pq)^1.5)
5. Apply color ramp (red = convex, blue = concave)

MATHEMATICAL FORMULAS:
- Slope: slope = atan(√(dz/dx² + dz/dy²))
- Aspect: aspect = atan2(dz/dy, -dz/dx)
- Profile Curvature: Measures rate of change of slope in direction of flow
- Plan Curvature: Measures rate of change of aspect (convergence/divergence)

3.5. VOLUME CALCULATION BUTTON - "Calculate Volume"
---------------------------------------------------
FUNCTION:
Calculates earthwork volumes (cut/fill) for various scenarios.

VOLUME TO REFERENCE PLANE:
1. For each grid cell:
   - Get elevation from DTM grid
   - Calculate difference: diff = elevation - referencePlane
   - If diff > 0: Add to cut volume
   - If diff < 0: Add to fill volume (use absolute value)
2. Volume = difference * cellArea
   where cellArea = cellSize * cellSize
3. Sum all cells:
   - Total Cut = Σ(max(0, diff) * cellArea)
   - Total Fill = Σ(max(0, -diff) * cellArea)
   - Net Volume = Total Cut - Total Fill
4. Calculate average elevation:
   avgElev = (Σ(elevation * cellArea)) / (totalArea)

VOLUME IN POLYGON:
1. User draws polygon on map
2. For each grid cell:
   - Check if cell center is inside polygon (point-in-polygon test)
   - If inside, calculate volume same as reference plane method
3. Sum only cells inside polygon

STOCKPILE VOLUME:
1. Auto-detect base elevation:
   - Sample edge cells (first/last row, first/last column)
   - Calculate average: baseElev = mean(edgeElevations)
2. For each grid cell:
   - Calculate height: height = elevation - baseElev
   - If height > 0: volume += height * cellArea
3. Estimate tonnage: tonnage = volume * 1.8 (tons/m³)

COMPARE TWO SURFACES:
1. Requires two DTM grids (before/after)
2. For each cell: diff = elevation_after - elevation_before
3. Calculate volumes same as reference plane method

MATHEMATICAL FORMULAS:
- Volume (prism method): V = Σ((elevation - reference) * cellArea)
- Average End Area: V = ((A1 + A2) / 2) * length
- Point-in-Polygon: Ray casting algorithm (count intersections)

3.6. TERRAIN CLASSIFICATION BUTTON - "Classify Terrain"
--------------------------------------------------------
FUNCTION:
Identifies terrain features (peaks, valleys, ridges, etc.) based on slope and curvature.

CALCULATION PROCESS:
1. For each grid cell:
   a. Calculate slope (using Horn's method)
   b. Calculate curvature (profile and plan)
   c. Check 8 neighbors for relative elevation
2. Classify based on rules:
   - Peak: Cell higher than all 8 neighbors, high curvature
   - Valley: Cell lower than all 8 neighbors, high curvature
   - Ridge: Higher than neighbors on one axis, lower on perpendicular
   - Pit: Local minimum, surrounded by higher cells
   - Saddle: High point in one direction, low in perpendicular
   - Plane: Low slope, low curvature
   - Channel: Negative plan curvature, positive profile curvature
3. Create classification zones (colored polygons)
4. Calculate statistics: Count and percentage of each feature type

MATHEMATICAL FORMULAS:
- Feature detection uses slope thresholds and curvature signs
- Peak: slope < 5°, curvature > threshold, all neighbors lower
- Valley: slope < 5°, curvature < -threshold, all neighbors higher

3.7. EXPORT BUTTONS (STL, OBJ, GeoTIFF, LAS)
---------------------------------------------
FUNCTION:
Exports terrain data in various 3D and raster formats.

STL EXPORT:
1. Convert DTM grid to triangular mesh:
   - Each grid cell becomes 2 triangles
   - Triangle vertices: (x, y, z) where z = elevation * verticalExaggeration
2. Write STL binary format:
   - Header (80 bytes)
   - Triangle count (4 bytes)
   - For each triangle: normal vector (12 bytes) + 3 vertices (36 bytes)
3. File format: Binary STL (standard for 3D printing)

OBJ EXPORT:
1. Convert DTM grid to vertices and faces:
   - Vertices: v x y z (with vertical exaggeration)
   - Faces: f v1 v2 v3 (triangular faces)
2. Write OBJ text format (human-readable)
3. File format: Wavefront OBJ (standard for 3D modeling)

GeoTIFF EXPORT:
1. Convert DTM grid to raster image:
   - Each cell = pixel
   - Pixel value = elevation (scaled to 16-bit integer)
2. Write GeoTIFF format:
   - TIFF image data
   - GeoTIFF tags (coordinate system, extent, cell size)
3. File format: GeoTIFF (standard GIS raster format)

LAS EXPORT:
1. Convert DTM grid back to point cloud:
   - Each grid cell center = point
   - Point coordinates: (x, y, z)
2. Write LAS format:
   - LAS header (coordinate system, scale, offset)
   - Point records (X, Y, Z, intensity, classification)
3. File format: LAS 1.2 or 1.4 (LiDAR standard)

3.8. BREAKLINES BUTTON - "Draw Breakline"
------------------------------------------
FUNCTION:
Allows drawing breaklines to enforce sharp edges in terrain (roads, ridges, streams).

CALCULATION PROCESS:
1. User draws polyline on map
2. Breakline stored as vector feature
3. During DTM generation:
   - Breakline vertices added to point set
   - TIN triangulation respects breakline edges
   - IDW interpolation gives higher weight to breakline points
4. Result: Terrain surface follows breakline exactly

MATHEMATICAL FORMULAS:
- Breaklines modify TIN triangulation (constrained Delaunay)
- IDW weight multiplier: w_breakline = w_normal * breaklineWeightFactor

================================================================================
4. ACADEMIC QUESTIONS & ANSWERS
================================================================================

Q1: What is a Digital Terrain Model (DTM) and how does it differ from a DEM?
A1: A DTM is a digital representation of the bare earth surface (terrain) without 
    vegetation or structures. A DEM (Digital Elevation Model) is a broader term that 
    can include buildings and vegetation. In this system, we generate DTMs by 
    interpolating elevation values from survey points to create a regular grid. 
    The DTM represents the continuous terrain surface as a raster where each cell 
    contains an elevation value.

Q2: Explain the difference between TIN and IDW interpolation methods.
A2: TIN (Triangulated Irregular Network) creates triangular facets between points 
    and interpolates within triangles using barycentric coordinates. It produces 
    sharp, angular surfaces that follow the actual terrain structure. IDW (Inverse 
    Distance Weighted) calculates elevation as a weighted average of nearby points, 
    where weights are inversely proportional to distance raised to a power. IDW 
    produces smoother surfaces. TIN is better for sharp terrain features (ridges, 
    valleys), while IDW is better for smooth, gradual terrain.

Q3: How does the marching squares algorithm work for contour generation?
A3: Marching squares divides the grid into 2x2 cell blocks. For each block, it 
    determines which of the 4 corners are above or below the contour elevation 
    level. This creates 16 possible cases (2^4). Each case has a lookup table 
    that defines where the contour line intersects the cell edges. The algorithm 
    interpolates intersection points along edges, then connects these points 
    into continuous contour lines. It's similar to marching cubes in 3D but 
    operates on 2D grids.

Q4: What is Catmull-Rom spline interpolation and why is it used for contour smoothing?
A4: Catmull-Rom splines are cubic interpolation curves that pass through control 
    points and create smooth transitions. They use 4 control points (p0, p1, p2, p3) 
    and a tension parameter. For contours, we use them after initial Chaikin smoothing 
    to create natural, flowing curves similar to hand-drawn contours in QGIS. The 
    spline ensures C1 continuity (smooth first derivative) between segments, 
    eliminating zig-zag artifacts from the marching squares algorithm.

Q5: How is slope calculated using Horn's method?
A5: Horn's method uses a 3x3 kernel to calculate partial derivatives dz/dx and 
    dz/dy. The formulas weight the center cell's neighbors:
    dz/dx = ((z[row-1][col+1] + 2*z[row][col+1] + z[row+1][col+1]) -
             (z[row-1][col-1] + 2*z[row][col-1] + z[row+1][col-1])) / (8 * cellSize)
    dz/dy uses similar weighting in the y-direction. Slope is then:
    slope = atan(√(dz/dx² + dz/dy²))
    This method is more accurate than simple difference methods because it considers 
    all 8 neighbors with appropriate weights.

Q6: What is the difference between profile curvature and plan curvature?
A6: Profile curvature measures the rate of change of slope in the direction of 
    maximum slope (downhill). Positive values indicate convex slopes (accelerating 
    flow), negative values indicate concave slopes (decelerating flow). Plan curvature 
    measures the rate of change of aspect (direction) perpendicular to the slope. 
    Positive values indicate divergent flow (hills), negative values indicate 
    convergent flow (valleys). Together, they describe the 3D shape of terrain.

Q7: How does volume calculation using the prism method work?
A7: The prism method treats each grid cell as a vertical prism. For a reference 
    plane elevation, the volume of each prism is:
    V_cell = (elevation - referencePlane) * cellArea
    If elevation > referencePlane, it's cut (excavation). If elevation < 
    referencePlane, it's fill (embankment). Total volume is the sum of all cells:
    V_total = Σ(V_cell). This method is accurate for regular grids and is the 
    standard approach in earthwork calculations.

Q8: What is vertical exaggeration and when is it used?
A8: Vertical exaggeration multiplies elevation values by a factor to make terrain 
    features more visible. For example, with 2x exaggeration, a 10m hill appears 
    as 20m. It's used in 3D visualizations and exports when horizontal and vertical 
    scales differ significantly (e.g., a 1km wide area with 50m elevation range). 
    Exaggeration makes subtle terrain features visible but distorts true proportions.

Q9: How does the system handle coordinate system transformations?
A9: The system accepts points in various coordinate systems (UTM zones, geographic). 
    When importing CSV, users select the coordinate system (EPSG code). The system 
    uses Proj4js or similar libraries to transform coordinates to the map's display 
    coordinate system (typically Web Mercator for web maps). All calculations 
    are performed in the original coordinate system to maintain accuracy, with 
    transformations only for display purposes.

Q10: What is the purpose of breaklines in terrain modeling?
A10: Breaklines are linear features that represent sharp terrain discontinuities 
     (roads, ridges, streams, building edges). They force the DTM to follow exact 
     elevations along these features. In TIN interpolation, breaklines become 
     constrained edges in the triangulation. In IDW, breakline points receive 
     higher weights. This ensures the terrain model accurately represents 
     man-made and natural linear features rather than smoothing over them.

Q11: How does contour labeling work to avoid overlapping labels?
A11: The system analyzes each contour line to find "straight sections" where 
     the line has low curvature. Labels are placed only on these straight sections 
     at intervals specified by label spacing (e.g., every 100m). The system 
     also limits the number of labels per contour (max 3-5) and rotates labels 
     to follow the contour direction. This ensures labels are readable and don't 
     overlap, following cartographic best practices.

Q12: What is multidirectional hillshade and why is it better than single-direction?
A12: Multidirectional hillshade uses 4 light sources (typically at 90° intervals: 
     0°, 90°, 180°, 270°) and combines their illumination values. This eliminates 
     the "shadow effect" where features facing away from the light source disappear. 
     Multidirectional hillshade reveals terrain features from all directions, 
     creating a more dramatic and informative 3D visualization. The final value 
     is typically the maximum or average of the 4 directional hillshades.

Q13: How does the system determine which contours are "major" vs "minor"?
A13: Major contours are those at elevations that are multiples of the major 
     interval (e.g., every 25m). Minor contours are all others. For example, 
     with a 5m contour interval and 25m major interval, contours at 0m, 25m, 
     50m, 75m are major, while 5m, 10m, 15m, 20m, 30m, etc. are minor. Major 
     contours are styled thicker and labeled, while minor contours are thinner 
     and typically unlabeled (or lightly labeled).

Q14: What is the difference between cut and fill volumes in earthwork?
A14: Cut volume is the amount of material that must be excavated (removed) to 
     bring the terrain down to a design elevation. Fill volume is the amount of 
     material that must be added (embanked) to raise the terrain to a design 
     elevation. Net volume = Cut - Fill. If positive, excess material; if 
     negative, material deficit. Earthwork projects aim for balance (net ≈ 0) 
     to minimize material transport costs.

Q15: How does the profile generation handle design grades and cut/fill calculations?
A15: The system calculates a design elevation profile based on a starting elevation 
     and grade percentage. At each station along the alignment, design elevation = 
     startElev + (distance * grade/100). The difference between actual and design 
     elevation determines cut (if actual > design) or fill (if actual < design). 
     Cross-sectional areas are calculated using trapezoidal sections with side 
     slopes. Volumes use the average end area method: V = ((A1 + A2)/2) * length.

Q16: What coordinate systems are supported and why is this important?
A16: The system supports UTM zones (WGS84 and Arc1960), geographic coordinates 
     (WGS84), and can be extended to others. Coordinate system selection is critical 
     because: (1) It ensures accurate distance and area calculations, (2) It 
     maintains proper georeferencing for exports, (3) It allows integration with 
     other GIS data, (4) It ensures compliance with local surveying standards. 
     Using the wrong coordinate system can introduce significant errors in 
     measurements.

Q17: How does the system handle edge cases in interpolation (e.g., points outside extent)?
A17: For cells outside the point cloud extent, the system uses the maximum search 
     distance parameter (IDW Max Distance). If no points are found within this 
     distance, the cell is set to null (no data). The system also handles cases 
     where a cell is exactly at a point (returns that point's elevation) and 
     cases where all neighbors are null (returns null). Edge cells use the same 
     interpolation but may have fewer neighbors, so results are less reliable 
     near boundaries.

Q18: What is the relationship between grid resolution and processing time?
A18: Processing time is approximately O(n²) where n is the number of grid cells. 
     If you halve the cell size, you quadruple the number of cells (2x width, 
     2x height = 4x cells). For example, a 5m grid on a 1km² area = 200x200 = 
     40,000 cells. A 2.5m grid = 400x400 = 160,000 cells (4x more). Interpolation 
     time per cell is roughly constant, so total time scales with cell count. 
     Users should balance detail (smaller cells) with processing time (larger cells).

Q19: How does the system ensure contour lines are topologically correct?
A19: The marching squares algorithm naturally creates closed loops for contour 
     lines. The system connects segments by matching endpoints (within tolerance). 
     For open contours (those that reach the boundary), the system handles them 
     correctly. The smoothing algorithm preserves topology by maintaining the 
     sequence of points. The system also clips contours to custom extents using 
     polygon clipping algorithms to ensure they don't extend beyond boundaries.

Q20: What validation does the system perform before generating DTM or contours?
A20: The system validates: (1) Minimum 3 points required for DTM (needed for 
     triangulation), (2) Points must have valid X, Y, Z coordinates (non-null, 
     numeric), (3) Coordinate system is selected, (4) Extent is calculable 
     (min/max values), (5) Grid resolution is positive and reasonable (1-20m), 
     (6) DTM exists before generating contours. If validation fails, the system 
     displays error messages guiding the user to fix the issue.

================================================================================
5. BEST PRACTICES & TIPS
================================================================================

5.1. DATA PREPARATION
---------------------
- Ensure CSV files have consistent coordinate system
- Remove outliers and erroneous points before import
- Use appropriate precision (2-3 decimal places for meters)
- Include metadata (project name, surveyor, date) for future reference
- For large datasets (>10,000 points), consider using existing data search

5.2. GRID RESOLUTION SELECTION
------------------------------
- General surveys: 5m cell size (good balance of detail and speed)
- Detailed surveys: 2-3m cell size (more detail, slower)
- Preliminary analysis: 10m cell size (faster, less detail)
- Rule of thumb: Cell size should be 1/5 to 1/10 of average point spacing

5.3. INTERPOLATION METHOD SELECTION
-----------------------------------
- Use TIN for: Sharp terrain features, roads, ridges, valleys, breaklines
- Use IDW Smooth for: General terrain, smooth hills, gradual slopes
- Use IDW Sharp for: Terrain with moderate features, mixed conditions
- Use Nearest for: Quick previews, very dense point clouds

5.4. CONTOUR GENERATION
-----------------------
- Contour interval should match survey accuracy (typically 1-5m)
- Major interval should be 4-5x contour interval for readability
- Enable smoothing for publication-quality contours
- Use 3 iterations for best smoothness without over-processing
- Label spacing: 50-100m for small areas, 200-500m for large areas

5.5. HILLSHADE SETTINGS
-----------------------
- Enable multidirectional for best 3D effect
- Azimuth 315° (NW) is standard (matches natural light)
- Altitude 45° provides good contrast
- Z-factor 1.0 for accurate representation, 2-3x for visualization
- Opacity 40-60% for good balance with color ramp

5.6. VOLUME CALCULATIONS
-------------------------
- Always verify reference plane elevation matches design
- For polygon volumes, ensure polygon is closed and valid
- Stockpile calculations assume uniform base; verify edge detection
- Compare surfaces requires both DTMs at same resolution
- Export results for documentation and verification

5.7. PROFILE GENERATION
-----------------------
- Sampling interval should be 1/5 of contour interval for smooth profiles
- Station interval: 25-50m for roads, 50-100m for general alignment
- Enable contour crossings for visual reference
- Design grade: Use actual design specifications
- Cross sections: Enable for detailed earthwork analysis

5.8. EXPORT FORMATS
-------------------
- STL: For 3D printing, use 2-3x vertical exaggeration
- OBJ: For 3D modeling, use 1-2x vertical exaggeration
- GeoTIFF: For GIS software, use 1x (no exaggeration)
- LAS: For point cloud software, use 1x (original data)

5.9. PERFORMANCE OPTIMIZATION
------------------------------
- Use custom extent to limit processing area
- Start with larger cell size, refine if needed
- Disable hillshade for faster DTM generation (add later)
- Generate DTM and contours separately to test settings
- Save configuration to avoid re-entering settings

5.10. QUALITY ASSURANCE
------------------------
- Verify point count matches imported data
- Check elevation range is reasonable for area
- Inspect DTM for artifacts (holes, spikes)
- Verify contours follow terrain logically
- Compare volumes with manual calculations for validation
- Export and review in external software (QGIS, ArcGIS)

================================================================================
6. TROUBLESHOOTING
================================================================================

ISSUE: "Need at least 3 points to generate DTM"
SOLUTION: Ensure CSV has at least 3 rows with valid X, Y, Z values. Check for 
          empty rows or missing columns.

ISSUE: Contours appear zig-zag or jagged
SOLUTION: Enable smoothing and increase iterations to 3-4. Ensure grid resolution 
          is appropriate (not too coarse). Check that DTM was generated with 
          sufficient detail.

ISSUE: DTM shows holes or missing data
SOLUTION: Check point distribution - may have gaps in coverage. Reduce IDW Max 
          Distance or use TIN method. Verify points are within processing extent.

ISSUE: Contours don't appear after generation
SOLUTION: Check "Show Contour Layer" checkbox is enabled. Verify contour interval 
          is appropriate for elevation range. Check browser console for errors.

ISSUE: Volume calculation returns zero
SOLUTION: Verify DTM was generated successfully. Check reference plane elevation 
          is within terrain elevation range. Ensure polygon (if used) is valid 
          and contains terrain data.

ISSUE: Profile generation fails
SOLUTION: Ensure alignment is drawn (at least 2 points). Verify DTM exists. Check 
          that alignment intersects terrain area.

ISSUE: Export files are too large
SOLUTION: Increase cell size to reduce grid resolution. Use custom extent to limit 
          export area. For STL/OBJ, consider reducing vertical exaggeration.

ISSUE: Processing is very slow
SOLUTION: Increase cell size (reduce resolution). Use custom extent to limit area. 
          Disable hillshade during initial generation. Use faster interpolation 
          method (TIN or Nearest).

ISSUE: Coordinates appear in wrong location
SOLUTION: Verify coordinate system selection matches CSV data. Check for coordinate 
          system mix-ups (X/Y swapped, wrong zone). Verify CSV format (comma vs. 
          semicolon, decimal separator).

ISSUE: Contour labels overlap or are unreadable
SOLUTION: Increase label spacing. Reduce max labels per contour. Increase font size. 
          Disable minor contour labels if too cluttered.

================================================================================
END OF DOCUMENT
================================================================================

This guide covers all major aspects of the 3D Terrain & Contours toolbox. For 
additional support or feature requests, refer to the system documentation or 
contact the development team.

Last Updated: 2024
Version: 1.0


## Chat_Guide.txt


CHAT - Complete Workflow Guide

================================================================================
TABLE OF CONTENTS
================================================================================
1. Overview & Purpose
2. Step-by-Step Workflow
3. Button Functions & Calculations
4. Academic Questions & Answers
5. Best Practices & Tips
6. Troubleshooting

================================================================================
1. OVERVIEW & PURPOSE
================================================================================

CHAT:
The Chat feature provides real-time collaborative communication for map users. 
It enables users to:
- Send and receive messages in real-time
- Share map locations with other users
- See who is online
- Reply to messages
- Format messages (bold, italic)
- Pin important messages
- React to messages
- Delete own messages

Key Features:
- Real-time messaging via Supabase
- Location sharing with map integration
- Online user tracking
- Message formatting (bold, italic, mentions)
- Message actions (reply, pin, react, delete)
- WhatsApp-style interface
- Dark theme support
- Unread message badge
- Message history loading

================================================================================
2. STEP-BY-STEP WORKFLOW
================================================================================

STEP 1: OPEN CHAT PANEL
-------------------------
1.1. Open webmap.html in your browser
1.2. Look for "CHAT" button in header toolbar
    - Icon: comment (fa-comment)
    - Located in main control bar
    - May show unread badge (red circle with number)
1.3. Click "CHAT" button
1.4. Chat panel slides in from right side
1.5. Panel shows:
    - Header with online users count
    - Messages container (scrollable)
    - Message input at bottom
    - Action buttons (location, formatting)

STEP 2: CHAT INITIALIZATION
----------------------------
2.1. System automatically initializes chat:
    a. Checks user authentication:
       - Gets user from Supabase auth
       - If authenticated: Uses user ID and email
       - If not: Uses anonymous mode
    b. Sets up chat state:
       - currentUser: {id, email, username}
       - isOpen: false
       - unreadCount: 0
       - messages: []
       - onlineUsers: Map()
    c. Loads recent messages:
       - Fetches last 50 messages from Supabase
       - Orders by created_at (ascending)
       - Adds each message to chat
    d. Sets up real-time subscriptions:
       - Subscribes to new messages
       - Subscribes to online users
       - Tracks own online status
    e. Adds welcome message:
       - System message: "Welcome [username]"
       - Type: 'system'
2.2. Chat is ready to use

STEP 3: VIEW MESSAGES
----------------------
3.1. Messages display in scrollable container
3.2. Message types:
    - Sent messages: Right-aligned, blue bubble
    - Received messages: Left-aligned, gray bubble
    - System messages: Centered, gray text
    - Location messages: Special format with map icon
3.3. Each message shows:
    - Sender name (for received messages)
    - Message content (formatted)
    - Timestamp (HH:MM format)
    - Action buttons (hover to see)
3.4. Scroll to see older messages
3.5. New messages auto-scroll to bottom

STEP 4: SEND TEXT MESSAGE
--------------------------
4.1. Type message in input field at bottom
4.2. Optional formatting:
    - Bold: **text** → <strong>text</strong>
    - Italic: *text* → <em>text</em>
    - Mentions: @username → highlighted
4.3. Click "Send" button or press Enter
4.4. System Processing:
    a. Validates message (not empty)
    b. Checks user authentication
    c. Prepares message data:
       - user_id: Current user ID
       - username: Current username
       - message: Message content (trimmed)
       - created_at: Current timestamp
    d. Inserts into Supabase:
       - Table: chat_messages
       - Returns inserted message
    e. Updates online status:
       - Upserts to online_users table
       - Updates last_seen timestamp
    f. Adds message to chat:
       - Immediately shows in UI
       - Real-time subscribers see it
    g. Clears input field
4.5. Message appears in chat

STEP 5: SHARE LOCATION
-----------------------
5.1. Click location button (📍) in message input area
5.2. System Processing:
    a. Gets current map view:
       - center: Map center coordinate
       - zoom: Current zoom level
       - lat, lon: Converted coordinates
    b. Creates location data:
       - center: Map center (EPSG:3857)
       - zoom: Zoom level
       - lat, lon: WGS84 coordinates
       - timestamp: Current time
       - username: Current user
    c. Formats location message:
       - Text: "📍 **Shared Location**\n\n**Coordinates:** lat, lon\n**Zoom Level:** zoom"
    d. Sends as location message:
       - type: 'location'
       - metadata: Location data object
       - content: Formatted text
5.3. Location message appears in chat
5.4. Other users can click to fly to location

STEP 6: FLY TO SHARED LOCATION
--------------------------------
6.1. Click location message in chat
6.2. Or click "View on map" button (map icon)
6.3. System Processing:
    a. Extracts location metadata
    b. Gets center coordinate (EPSG:3857)
    c. Sets target zoom: 18 (approximately 50m view)
    d. Animates map:
       - center: Location coordinate
       - zoom: 18
       - duration: 1500ms
    e. Adds persistent marker:
       - Red pin at location
       - Description label
       - Stays until page refresh
    f. Closes chat panel (if open)
6.4. Map flies to location
6.5. Marker shows exact location

STEP 7: REPLY TO MESSAGE
-------------------------
7.1. Hover over message
7.2. Click "Reply" button (↩ icon)
7.3. Reply context appears:
    - Shows: "Replying to [username]: [message]"
    - Input field shows reply indicator
7.4. Type reply message
7.5. Send message
7.6. System Processing:
    a. Includes reply context in message:
       - message: "Replying to [username]: [reply text]"
       - reply_to: Original message ID
    b. Sends message normally
7.7. Reply appears with context

STEP 8: PIN MESSAGE
--------------------
8.1. Hover over message
8.2. Click "Pin" button (📌 icon)
8.3. System Processing:
    a. Toggles pin status
    b. Updates message in database (if implemented)
    c. Pinned messages stay at top
8.4. Pinned message is highlighted

STEP 9: REACT TO MESSAGE
-------------------------
9.1. Hover over message
9.2. Click "Reaction" button (😊 icon)
9.3. Reaction menu appears
9.4. Select emoji reaction
9.5. System Processing:
    a. Adds reaction to message
    b. Updates reaction count
    c. Shows reactions below message
9.6. Reaction appears on message

STEP 10: DELETE MESSAGE
------------------------
10.1. Hover over own message
10.2. Click "Delete" button (🗑 icon)
10.3. System Processing:
     a. Confirms deletion (if implemented)
     b. Deletes from Supabase
     c. Removes from chat UI
10.4. Message is deleted

STEP 11: VIEW ONLINE USERS
---------------------------
11.1. Online users shown in header
11.2. Shows count: "X online"
11.3. Click to expand list
11.4. List shows:
     - Username
     - Online status indicator (green dot)
11.5. Updates in real-time

STEP 12: CLOSE CHAT PANEL
---------------------------
12.1. Click "×" (close) button in header
12.2. Or click outside chat panel
12.3. Panel slides out
12.4. Unread badge updates if new messages arrive

================================================================================
3. BUTTON FUNCTIONS & CALCULATIONS
================================================================================

3.1. "CHAT" BUTTON
-------------------
FUNCTION:
Opens/closes chat panel.

PROCESS:
1. Gets chat panel element
2. Toggles 'open' class
3. Updates chatState.isOpen
4. If opening:
   - Marks messages as read
   - Focuses input field
5. If closing:
   - Panel slides out

3.2. initializeChat() FUNCTION
--------------------------------
FUNCTION:
Initializes chat system and loads messages.

CALCULATION PROCESS:
1. Gets user authentication:
   - Checks cookie for auth token
   - Gets user from Supabase auth
   - If authenticated: Uses user data
   - If not: Creates anonymous user
2. Sets chatState.currentUser:
   - id: user.id or 'anonymous_' + timestamp
   - email: user.email or 'Anonymous User'
   - username: email.split('@')[0] or 'Anonymous'
3. Sets up event listeners:
   - Calls setupChatEventListeners()
4. Loads recent messages:
   - Calls loadRecentMessages()
5. Sets up real-time:
   - Calls setupRealtimeSubscriptions()
6. Adds welcome message:
   - System message with username
7. Updates online users:
   - Calls updateOnlineUsers()

3.3. loadRecentMessages() FUNCTION
------------------------------------
FUNCTION:
Loads last 50 messages from database.

CALCULATION PROCESS:
1. Queries Supabase:
   - Table: chat_messages
   - Select: all columns
   - Order: created_at ascending (oldest first)
   - Limit: 50
2. Clears existing messages:
   - messagesList.innerHTML = ''
3. For each message:
   - Extracts content (tries multiple column names)
   - Creates message object:
     * id: message.id
     * content: message.message || message.text || ...
     * type: message.message_type || 'text'
     * metadata: message.metadata
     * user_id: message.user_id
     * username: message.username
     * timestamp: message.created_at
   - Calls addMessage()
4. Scrolls to bottom:
   - After 100ms delay
   - messagesContainer.scrollTop = scrollHeight

3.4. sendMessage() FUNCTION
-----------------------------
FUNCTION:
Sends message to database and displays in chat.

CALCULATION PROCESS:
1. Validates message:
   - Checks content.trim() is not empty
   - Returns if empty
2. Checks authentication:
   - If not authenticated: Shows warning, returns
3. Prepares insert data:
   - user_id: chatState.currentUser.id
   - username: chatState.currentUser.username
   - message: content.trim()
   - message_type: type (if not 'text')
   - metadata: metadata (if provided)
   - reply_to: chatState.replyingTo.id (if replying)
4. Inserts into Supabase:
   - Table: chat_messages
   - Returns inserted data
5. On success:
   - Clears input field
   - Clears reply context (if replying)
   - Updates online status (upsert to online_users)
   - Adds message to chat immediately
6. On error:
   - Shows message locally (fallback)
   - Logs error
   - Shows warning toast

MATHEMATICAL FORMULAS:
- Timestamp: new Date().toISOString()
- Username: email.split('@')[0]

3.5. addMessage() FUNCTION
----------------------------
FUNCTION:
Adds message to chat UI and state.

PROCESS:
1. Adds to chatState.messages array
2. Calls renderMessage() to display
3. Updates unread count:
   - If panel closed: unreadCount++
   - Updates badge
4. Auto-scrolls to bottom:
   - messagesList.scrollTop = scrollHeight

3.6. renderMessage() FUNCTION
-------------------------------
FUNCTION:
Renders message in WhatsApp-style UI.

CALCULATION PROCESS:
1. Determines message type:
   - isOwn: message.user_id === currentUser.id
   - isSystem: message.type === 'system'
   - isLocation: message.type === 'location'
2. Creates message element:
   - className: 'message-item message-sent' or 'message-received'
   - data-message-id: message.id
3. Builds HTML based on type:
   a. System message:
      - Centered gray text
      - No bubble
   b. Location message:
      - Location icon (📍)
      - Formatted location text
      - "View on map" button
      - Action buttons (delete, pin, reply, react)
   c. Text message:
      - Message bubble
      - Sender name (if not own)
      - Formatted content
      - Timestamp
      - Action buttons
4. Appends to messagesList

3.7. formatMessage() FUNCTION
-------------------------------
FUNCTION:
Formats message content (bold, italic, mentions).

CALCULATION PROCESS:
1. Parses @mentions:
   - Pattern: /@(\w+)/g
   - Replacement: '<span class="message-mention">@$1</span>'
2. Parses **bold**:
   - Pattern: /\*\*(.*?)\*\*/g
   - Replacement: '<strong>$1</strong>'
3. Parses *italic*:
   - Pattern: /\*(.*?)\*/g
   - Replacement: '<em>$1</em>'
4. Returns formatted HTML

MATHEMATICAL FORMULAS:
- Regex Replace: content.replace(pattern, replacement)

3.8. shareCurrentLocation() FUNCTION
-------------------------------------
FUNCTION:
Shares current map view as location message.

CALCULATION PROCESS:
1. Gets map view:
   - view = window.map.getView()
   - center = view.getCenter() (EPSG:3857)
   - zoom = view.getZoom()
2. Converts to lat/lon:
   - lat = center[1].toFixed(6)
   - lon = center[0].toFixed(6)
   - Note: center is in EPSG:3857, needs conversion
3. Creates location data:
   - center: Map center (EPSG:3857)
   - zoom: Zoom level
   - lat, lon: WGS84 coordinates (if converted)
   - timestamp: new Date().toISOString()
   - username: chatState.currentUser.username
4. Formats location text:
   - "📍 **Shared Location**\n\n**Coordinates:** lat, lon\n**Zoom Level:** zoom"
5. Sends message:
   - Calls sendMessage(locationText, 'location', locationData)

3.9. flyToLocation() FUNCTION
-------------------------------
FUNCTION:
Flies map to shared location.

CALCULATION PROCESS:
1. Gets location metadata
2. Extracts center coordinate:
   - center = locationData.center (EPSG:3857)
   - If not available: Converts from lat/lon
3. Sets target zoom: 18 (approximately 50m view)
4. Animates map:
   - view.animate({center, zoom: 18, duration: 1500})
5. Adds persistent marker:
   - Calls addPersistentMarker(center, description)
6. Closes chat panel
7. Shows toast notification

MATHEMATICAL FORMULAS:
- Target Zoom: 18 (fixed, approximately 50m view)
- Animation Duration: 1500ms

3.10. setupRealtimeSubscriptions() FUNCTION
---------------------------------------------
FUNCTION:
Sets up Supabase real-time subscriptions.

PROCESS:
1. Subscribes to new messages:
   - Channel: 'chat_messages'
   - Event: 'INSERT' on chat_messages table
   - On insert: Calls addMessage() with new message
2. Subscribes to online users:
   - Channel: 'online_users'
   - Events: 'sync', 'join', 'leave'
   - On event: Calls updateOnlineUsers()
   - Tracks own presence:
     * user_id, username, last_seen, online_at

3.11. updateOnlineUsers() FUNCTION
-----------------------------------
FUNCTION:
Updates list of online users.

CALCULATION PROCESS:
1. Queries Supabase:
   - Table: online_users
   - Select: all columns
   - Filter: last_seen >= (now - 30 seconds)
2. Clears chatState.onlineUsers Map
3. For each user:
   - Adds to Map: user.user_id → {id, username, status: 'online'}
4. Renders online users:
   - Calls renderOnlineUsers()
5. Updates count:
   - Calls updateOnlineCount()

MATHEMATICAL FORMULAS:
- Online Threshold: Date.now() - 30000 (30 seconds ago)
- ISO Timestamp: new Date(timestamp).toISOString()

================================================================================
4. ACADEMIC QUESTIONS & ANSWERS
================================================================================

Q1: How does real-time messaging work?
A1: Real-time messaging uses Supabase Realtime: (1) Client subscribes to 
    database changes via WebSocket, (2) When message inserted, Supabase sends 
    event to all subscribers, (3) Client receives event and updates UI, 
    (4) No polling needed (efficient). Process: (1) setupRealtimeSubscriptions() 
    creates channel, (2) Subscribes to 'INSERT' events on chat_messages table, 
    (3) On insert, payload contains new message, (4) addMessage() displays 
    immediately. Benefits: (1) Instant updates, (2) Low latency, 
    (3) Efficient (no polling), (4) Scalable. WebSocket connection is 
    maintained, allowing bidirectional communication.

Q2: How does location sharing work?
A2: Location sharing: (1) Gets current map view (center, zoom), 
    (2) Converts coordinates to WGS84, (3) Creates location data object, 
    (4) Sends as message with type='location' and metadata, (5) Other users 
    receive message, (6) Clicking location flies map to coordinates. 
    Metadata includes: (1) center (EPSG:3857 for map), (2) zoom level, 
    (3) lat/lon (WGS84 for display), (4) timestamp, (5) username. When 
    clicked: (1) Extracts center coordinate, (2) Animates map to location, 
    (3) Adds persistent marker, (4) Sets zoom to 18. This enables collaborative 
    map exploration - users can share locations and navigate together.

Q3: How does message formatting work?
A3: Message formatting uses regex parsing: (1) **text** → <strong>text</strong> 
    (bold), (2) *text* → <em>text</em> (italic), (3) @username → highlighted 
    mention. Process: formatMessage() applies regex replacements sequentially. 
    Patterns: (1) Bold: /\*\*(.*?)\*\*/g (non-greedy match), (2) Italic: 
    /\*(.*?)\*/g, (3) Mentions: /@(\w+)/g. The formatted HTML is inserted 
    into message bubble. This provides rich text without full editor - simple 
    markdown-like syntax. Users can format messages for emphasis or mentions.

Q4: How does online user tracking work?
A4: Online user tracking: (1) Each user upserts to online_users table with 
    last_seen timestamp, (2) System queries users with last_seen within 30 
    seconds, (3) Updates online users list, (4) Real-time subscription updates 
    on presence changes. Process: (1) User sends message → updates last_seen, 
    (2) Presence tracking via Supabase Realtime, (3) 'join' event when user 
    comes online, (4) 'leave' event when user goes offline, (5) 'sync' event 
    for initial state. The 30-second threshold determines "online" status - 
    users seen within 30 seconds are considered online. This provides 
    approximate online status without constant heartbeats.

Q5: How does message ordering work?
A5: Message ordering: (1) Loads messages ordered by created_at ascending 
    (oldest first), (2) Displays in chronological order, (3) New messages 
    appended to bottom, (4) Auto-scrolls to show latest. The ascending order 
    ensures proper chat flow - oldest messages at top, newest at bottom. 
    Auto-scroll ensures users see new messages without manual scrolling. 
    Timestamp format: ISO 8601 (YYYY-MM-DDTHH:mm:ss.sssZ), displayed as 
    HH:MM in UI. This matches standard chat applications (WhatsApp, etc.).

Q6: How does the unread badge work?
A6: Unread badge: (1) Tracks unreadCount in chatState, (2) Increments when 
    new message arrives and panel is closed, (3) Decrements when panel opens 
    (markMessagesAsRead), (4) Displays count on chat button. Process: 
    (1) addMessage() checks if panel is open, (2) If closed: unreadCount++, 
    (3) updateUnreadBadge() updates UI, (4) Badge shows count (or "9+" if >9), 
    (5) When panel opens: markMessagesAsRead() resets count. The badge provides 
    visual indicator of new messages, encouraging users to check chat. 
    Count is approximate - based on messages received while panel closed.

Q7: How does reply functionality work?
A7: Reply functionality: (1) User clicks reply button on message, 
    (2) Sets chatState.replyingTo to message object, (3) Shows reply context 
    in UI, (4) When sending: Includes "Replying to [username]: [text]" in 
    message, (5) Sets reply_to field to original message ID. Process: 
    (1) replyToMessage() sets replyingTo state, (2) UI shows reply indicator, 
    (3) sendMessage() checks replyingTo, (4) Prepends reply context to message 
    text, (5) Sets reply_to in database, (6) Clears replyingTo after send. 
    This creates threaded conversations - users can reply to specific messages 
    for context. The reply context is included in message text for 
    compatibility, but reply_to field enables future threading features.

Q8: How does message deletion work?
A8: Message deletion: (1) Only own messages can be deleted, (2) Click delete 
    button, (3) Deletes from Supabase database, (4) Removes from UI. Process: 
    (1) deleteMessage() function, (2) Queries Supabase to delete by ID, 
    (3) On success: Removes message element from DOM, (4) Updates chat state. 
    Deletion is permanent - message removed from database. Real-time 
    subscribers would need to handle DELETE events to remove from UI. 
    Current implementation may delete locally only - full implementation 
    would delete from database and notify other users via real-time.

Q9: How does the WhatsApp-style interface work?
A9: WhatsApp-style interface: (1) Sent messages: Right-aligned, blue bubble, 
    (2) Received messages: Left-aligned, gray bubble, (3) System messages: 
    Centered, no bubble, (4) Timestamps below messages, (5) Action buttons 
    on hover. CSS styling: (1) Flexbox layout for alignment, (2) Rounded 
    corners on bubbles, (3) Color coding (blue for sent, gray for received), 
    (4) Hover effects for actions, (5) Smooth scrolling. This familiar 
    interface improves usability - users recognize WhatsApp-style chat 
    immediately. The design is responsive and works on mobile and desktop.

Q10: How does persistent marker work for shared locations?
A10: Persistent marker: (1) Created when user clicks shared location, 
     (2) Red pin icon at exact coordinate, (3) Description label above, 
     (4) Stays until page refresh, (5) Can be manually cleared. Process: 
     (1) flyToLocation() calls addPersistentMarker(), (2) Creates OpenLayers 
     Feature with Point geometry, (3) Styles with red pin icon and text, 
     (4) Adds to persistentMarkerLayer, (5) Layer added to map with high 
     zIndex. The marker provides visual reference for shared location - users 
     can see exactly where location was shared. The marker persists across 
     map interactions (pan, zoom) until page refresh, allowing users to 
     reference the location while exploring map.

Q11: How does message metadata work?
A11: Message metadata: (1) JSON object stored in metadata column, 
     (2) Used for location messages (contains coordinates, zoom, etc.), 
     (3) Can store any additional data, (4) Retrieved when rendering message. 
     For location messages: metadata contains {center, zoom, lat, lon, 
     timestamp, username}. This allows structured data alongside message text - 
     location messages can be clicked to fly to location, while text is 
     displayed for readability. Metadata enables rich message types beyond 
     plain text - future types could include screenshots, file attachments, 
     etc. The metadata is stored as JSON in database, parsed when needed.

Q12: How does the dark theme work?
A12: Dark theme: (1) Toggle button in chat header, (2) Adds/removes 
     'dark-theme' class on chat panel, (3) CSS changes colors for dark mode, 
     (4) Persists preference (if implemented). CSS changes: (1) Background: 
     Dark gray/black, (2) Text: Light colors, (3) Bubbles: Darker shades, 
     (4) Input: Dark background. The dark theme reduces eye strain in low-light 
     conditions and provides modern appearance. Toggle allows users to switch 
     between light and dark themes based on preference. Theme preference 
     could be saved to localStorage for persistence across sessions.

Q13: How does message pinning work?
A13: Message pinning: (1) Click pin button on message, (2) Toggles pin 
     status, (3) Pinned messages stay at top of chat, (4) Visual indicator 
     shows pinned status. Process: (1) togglePinMessage() function, 
     (2) Updates message in database (if implemented), (3) Re-renders 
     message list with pinned messages first, (4) Shows pin icon indicator. 
     Pinning allows users to highlight important messages - pinned messages 
     remain visible at top for easy reference. This is useful for 
     announcements, important information, or frequently referenced content. 
     Full implementation would store pin status in database and sort messages 
     accordingly.

Q14: How does message reactions work?
A14: Message reactions: (1) Click reaction button, (2) Shows emoji menu, 
     (2) Select emoji, (3) Adds reaction to message, (4) Shows reaction count. 
     Process: (1) showReactionMenu() displays emoji picker, (2) User selects 
     emoji, (3) Adds reaction to message (stores in database or local state), 
     (4) Updates reaction display below message, (5) Shows count and emoji. 
     Reactions provide quick feedback without sending new message - users can 
     react with emoji (👍, ❤️, 😂, etc.) to express sentiment. Reactions 
     are displayed below message with count. Full implementation would store 
     reactions in database and allow multiple users to react.

Q15: How does anonymous mode work?
A15: Anonymous mode: (1) If user not authenticated, creates anonymous user, 
     (2) ID: 'anonymous_' + timestamp, (3) Username: 'Anonymous', 
     (4) Messages sent but may not be saved (depends on implementation). 
     Process: (1) initializeChat() checks authentication, (2) If no user: 
     Creates anonymous user object, (3) Uses anonymous ID for messages, 
     (4) May show warning that messages not saved. Anonymous mode allows 
     users to use chat without login, but functionality may be limited. 
     Some implementations may require authentication for sending messages, 
     while others allow anonymous messages. The anonymous user ID ensures 
     uniqueness even without authentication.

Q16: How does message scrolling work?
A16: Message scrolling: (1) Messages container has fixed height with 
     overflow-y: auto, (2) New messages appended to bottom, (3) Auto-scroll 
     to bottom on new message, (4) Manual scroll allows viewing history. 
     Process: (1) messagesContainer.scrollTop = scrollHeight (scrolls to 
     bottom), (2) Called after adding message, (3) Called after loading 
     messages, (4) Smooth scrolling for better UX. Auto-scroll ensures users 
     see new messages immediately, but can be disabled if user manually 
     scrolled up (to read history). The scroll position is managed 
     automatically - new messages trigger scroll to bottom unless user is 
     viewing history.

Q17: How does the message input work?
A17: Message input: (1) Text input field at bottom of chat, (2) Enter key 
     sends message, (3) Formatting buttons (bold, italic) apply formatting, 
     (4) Location button shares current map view, (5) Send button submits. 
     Process: (1) User types in input, (2) Formatting buttons wrap selected 
     text with markdown, (3) Enter key or Send button triggers sendMessage(), 
     (4) Input cleared after send. The input supports markdown-style 
     formatting - users can type **bold** or *italic* directly, or use 
     formatting buttons to wrap selected text. Enter key sends message for 
     quick sending, while Send button provides alternative method.

Q18: How does Supabase authentication work for chat?
A18: Supabase authentication: (1) Gets user from Supabase auth session, 
     (2) Uses user.id for message user_id, (3) Uses user.email for username, 
     (4) Checks authentication before sending messages. Process: (1) 
     initializeChat() calls supabase.auth.getUser(), (2) If authenticated: 
     Uses user data, (3) If not: Uses anonymous mode, (4) sendMessage() 
     checks authentication before sending. Authentication ensures: (1) Messages 
     are attributed to users, (2) Users can delete own messages, (3) Online 
     status is tracked, (4) Real-time subscriptions work properly. The 
     authentication token is stored in cookie or session, retrieved when 
     needed. Some features may require authentication (sending messages), 
     while others work anonymously (viewing messages).

Q19: How does message history loading work?
A19: Message history: (1) Loads last 50 messages on initialization, 
     (2) Orders by created_at ascending (oldest first), (3) Adds each message 
     to chat, (4) Scrolls to bottom to show latest. Process: (1) 
     loadRecentMessages() queries Supabase, (2) Fetches 50 most recent 
     messages, (3) For each message: Calls addMessage() to display, 
     (4) After loading: Scrolls to bottom. The 50-message limit balances 
     performance and history - loading all messages could be slow for large 
     chats. Future implementation could add pagination - load more messages 
     when scrolling to top. The ascending order ensures proper chronological 
     display - oldest at top, newest at bottom.

Q20: How does the chat panel toggle work?
A20: Chat panel toggle: (1) Click chat button toggles panel, (2) Panel 
     slides in/out from right, (3) CSS transition animates movement, 
     (4) 'open' class controls visibility. Process: (1) toggleChatPanel() 
     toggles 'open' class, (2) CSS: .chat-panel.open { transform: translateX(0) }, 
     (3) Without 'open': transform: translateX(100%) (hidden off-screen), 
     (4) Transition: smooth slide animation. The panel is positioned fixed 
     on right side, slides in when opened, slides out when closed. Clicking 
     outside panel or close button closes it. The toggle provides smooth UX - 
     panel doesn't pop in/out, but slides smoothly.

================================================================================
5. BEST PRACTICES & TIPS
================================================================================

5.1. MESSAGE ETIQUETTE
-----------------------
- Be respectful in messages
- Use appropriate language
- Format messages for readability
- Use location sharing for collaboration
- Reply to messages for context

5.2. LOCATION SHARING
----------------------
- Share locations when discussing specific areas
- Use location sharing for field work coordination
- Click shared locations to navigate together
- Persistent markers help reference locations
- Clear markers when done

5.3. MESSAGE FORMATTING
-----------------------
- Use **bold** for emphasis
- Use *italic* for subtle emphasis
- Use @mentions to notify users (if implemented)
- Format long messages for readability
- Keep messages concise

5.4. REAL-TIME COLLABORATION
-----------------------------
- Chat enables real-time collaboration
- Share locations for coordinated work
- Use replies for threaded conversations
- Pin important messages
- React to messages for quick feedback

5.5. ONLINE STATUS
------------------
- Online status updates automatically
- Users seen within 30 seconds are online
- Status helps know who is available
- Presence tracking is approximate
- Check online users before important messages

5.6. MESSAGE MANAGEMENT
------------------------
- Delete own messages if needed
- Pin important messages
- Use reactions for quick feedback
- Reply to messages for context
- Keep chat organized

================================================================================
6. TROUBLESHOOTING
================================================================================

ISSUE: "Chat panel not opening"
SOLUTION:
- Check browser console for JavaScript errors
- Verify chat panel element exists in DOM
- Check CSS is loaded
- Try refreshing page (Ctrl+F5)
- Verify toggleChatPanel() function exists

ISSUE: "Messages not sending"
SOLUTION:
- Check user is authenticated
- Verify Supabase connection
- Check browser console for errors
- Verify chat_messages table exists
- Check network tab for failed requests

ISSUE: "Real-time updates not working"
SOLUTION:
- Check Supabase Realtime is enabled
- Verify WebSocket connection is open
- Check browser console for subscription errors
- Verify channel subscriptions are active
- Check Supabase project settings

ISSUE: "Messages not loading"
SOLUTION:
- Check Supabase connection
- Verify chat_messages table exists
- Check browser console for query errors
- Verify user has read permissions
- Try refreshing page

ISSUE: "Location sharing not working"
SOLUTION:
- Check map is initialized
- Verify map.getView() is available
- Check coordinates are valid
- Verify location message is sent
- Check flyToLocation() function

ISSUE: "Online users not showing"
SOLUTION:
- Check online_users table exists
- Verify presence tracking is enabled
- Check last_seen threshold (30 seconds)
- Verify real-time subscription is active
- Check updateOnlineUsers() function

ISSUE: "Message formatting not working"
SOLUTION:
- Check formatMessage() function
- Verify regex patterns are correct
- Check HTML is not escaped
- Verify CSS for formatted text
- Test formatting syntax (**bold**, *italic*)

ISSUE: "Unread badge not updating"
SOLUTION:
- Check unreadCount is incremented
- Verify updateUnreadBadge() is called
- Check badge element exists
- Verify badge CSS is correct
- Check markMessagesAsRead() on open

ISSUE: "Reply functionality not working"
SOLUTION:
- Check chatState.replyingTo is set
- Verify reply context is included
- Check reply_to field in database
- Verify reply UI is displayed
- Check cancelReply() function

ISSUE: "Persistent marker not appearing"
SOLUTION:
- Check addPersistentMarker() is called
- Verify marker layer is added to map
- Check marker coordinates are valid
- Verify marker style is applied
- Check zIndex is high enough

ISSUE: "Chat panel closes unexpectedly"
SOLUTION:
- Check click-outside handler
- Verify panel toggle logic
- Check for conflicting event listeners
- Verify panel state management
- Check CSS for pointer-events

ISSUE: "Messages appearing out of order"
SOLUTION:
- Check message ordering (created_at ascending)
- Verify timestamps are correct
- Check real-time events are processed in order
- Verify message IDs are unique
- Check database query ordering

ISSUE: "Anonymous mode not working"
SOLUTION:
- Check anonymous user creation
- Verify anonymous ID is unique
- Check if anonymous messages are allowed
- Verify fallback logic
- Check authentication check

ISSUE: "Dark theme not applying"
SOLUTION:
- Check dark-theme class is added
- Verify CSS for dark theme exists
- Check theme toggle button
- Verify class toggle logic
- Check CSS specificity

ISSUE: "Message deletion not working"
SOLUTION:
- Check deleteMessage() function
- Verify user can only delete own messages
- Check Supabase delete query
- Verify message removal from UI
- Check real-time DELETE events

ISSUE: "Reactions not working"
SOLUTION:
- Check showReactionMenu() function
- Verify emoji picker is displayed
- Check reaction storage (database or local)
- Verify reaction display
- Check reaction count updates

ISSUE: "Message pinning not working"
SOLUTION:
- Check togglePinMessage() function
- Verify pin status is stored
- Check message sorting (pinned first)
- Verify pin indicator display
- Check database pin field (if implemented)

ISSUE: "Auto-scroll not working"
SOLUTION:
- Check scrollTop assignment
- Verify messagesContainer exists
- Check scrollHeight is calculated
- Verify scroll happens after render
- Check for conflicting scroll handlers

ISSUE: "Message input not clearing"
SOLUTION:
- Check input.value = '' after send
- Verify sendMessage() clears input
- Check for errors preventing clear
- Verify input element exists
- Check input is not disabled

ISSUE: "Welcome message not showing"
SOLUTION:
- Check initializeChat() adds welcome message
- Verify addMessage() is called
- Check system message rendering
- Verify welcome message content
- Check message type is 'system'


## Coordinate_Search_and_Coordinate_Extractor_Guide.txt


COORDINATE SEARCH & COORDINATE EXTRACTOR TOOL - Complete Workflow Guide

================================================================================
TABLE OF CONTENTS
================================================================================
1. Overview & Purpose
2. COORDINATE SEARCH - Step-by-Step Workflow
3. COORDINATE EXTRACTOR TOOL - Step-by-Step Workflow
4. Button Functions & Calculations
5. Academic Questions & Answers
6. Best Practices & Tips
7. Troubleshooting

================================================================================
1. OVERVIEW & PURPOSE
================================================================================

COORDINATE SEARCH:
Coordinate Search is a tool for plotting coordinates on the map from manual 
entry or CSV files. It enables users to:
- Enter coordinates manually and plot single points
- Upload CSV files with multiple coordinates
- Visualize coordinate locations on map
- Transform coordinates between different CRS
- Validate coordinates against Uganda bounds

Key Features:
- Split-panel modal interface (Manual Input / CSV Import)
- Multiple coordinate system support (UTM, Geographic)
- Automatic coordinate transformation
- Uganda bounds validation
- CSV parsing with auto-delimiter detection
- Append mode for CSV (add to existing points)
- Results table with all plotted coordinates
- Red markers on map with point labels

COORDINATE EXTRACTOR TOOL:
Coordinate Extractor Tool allows users to extract coordinates by clicking on 
the map. It enables users to:
- Click on map to extract coordinates in selected CRS
- Extract multiple points sequentially
- View extracted coordinates in table format
- Export coordinates to CSV file
- Snap to existing map layers (optional)
- Transform coordinates to any supported CRS

Key Features:
- Modal interface with controls and results panel
- Click-to-extract functionality
- Real-time coordinate transformation
- Multiple CRS support
- Layer snapping capability
- Export to CSV with all coordinate formats
- Undo/clear functionality
- Results table with ID, Easting, Northing, Lat, Lon

================================================================================
2. COORDINATE SEARCH - STEP-BY-STEP WORKFLOW
================================================================================

STEP 1: LAUNCH COORDINATE SEARCH
----------------------------------
1.1. Open webmap.html in your browser
1.2. Look for "COORD SEARCH" button in bottom control bar
    - Icon: search-location (fa-search-location)
    - Located with other control buttons
1.3. Click "COORD SEARCH" button
1.4. Split-panel modal appears (coordinate-search-popup)
1.5. Modal contains two panels:
    - Left Panel: Manual Input
    - Right Panel: CSV Import

STEP 2: MANUAL COORDINATE ENTRY
---------------------------------
2.1. In "Manual Input" panel (left side):
2.2. Select Coordinate System:
    - Dropdown shows available systems:
      * Arc 1960 / UTM zone 36N — EPSG:21096
      * Arc 1960 / UTM zone 36S — EPSG:21036
      * WGS84 / UTM zone 36N — EPSG:32636
      * WGS84 / UTM zone 36S — EPSG:32736
      * WGS84 (lat/lon) — EPSG:4326
    - Default: Last used CRS (saved in localStorage)
    - Select CRS matching your coordinates
2.3. Enter Coordinates:
    - Easting/Longitude: Enter X coordinate
      * For UTM: Enter easting (e.g., 465919)
      * For Geographic: Enter longitude (e.g., 32.5)
    - Northing/Latitude: Enter Y coordinate
      * For UTM: Enter northing (e.g., 28089)
      * For Geographic: Enter latitude (e.g., 0.5)
2.4. Click "Plot Point" button
2.5. System Processing:
    a. Validates coordinates:
       - Parses as numbers
       - Checks for NaN values
    b. Handles EPSG:4326 coordinate order:
       - If first value is -90 to 90 and second is outside that range:
         * Assumes lat,lon format
         * Swaps to lon,lat for transformation
    c. Transforms coordinates:
       - Source CRS: Selected from dropdown
       - Target CRS: EPSG:3857 (Web Mercator for map)
       - Transformation: ol.proj.transform([x, y], sourceCRS, mapCRS)
    d. Creates map feature:
       - Point geometry at transformed coordinate
       - Name: "Point (X, Y)" with original coordinates
       - Properties: originalCoord, crs
    e. Adds to search layer:
       - Adds feature to searchSource
       - Clears previous results (unless append mode)
    f. Zooms map:
       - Animates to point location
       - Zoom level: 16
       - Duration: 1500ms
2.6. Point appears on map:
    - Red circular marker (radius 8px)
    - White stroke (2px)
    - Red text label with white outline
    - Label shows point name
2.7. Status message: "Point plotted successfully"
2.8. CRS selection saved to localStorage for next use

STEP 3: CSV COORDINATE UPLOAD
-------------------------------
3.1. In "CSV Import" panel (right side):
3.2. Select Coordinate System:
    - Dropdown shows same options as Manual Input
    - Default: Last used CSV CRS (saved separately)
    - Select CRS matching your CSV data
3.3. Select CSV File:
    - Click file input or drag & drop CSV file
    - File must have .csv extension
    - Status shows: "File selected: filename.csv"
3.4. Configure Options:
    - "Append to existing points" checkbox:
      * Checked: Adds to existing plotted points
      * Unchecked: Clears previous points first
3.5. Click "Plot CSV" button
3.6. System Processing:
    a. Reads CSV file:
       - Uses FileReader API
       - Reads as text
    b. Parses CSV:
       - Splits by newlines
       - Auto-detects delimiter: comma, semicolon, or tab
       - Detects header row (checks for 'name', 'easting', 'northing')
       - Skips header if detected
       - Parses each row:
         * Column 1: Point name (text)
         * Column 2: X coordinate (easting/longitude)
         * Column 3: Y coordinate (northing/latitude)
       - Filters out invalid rows (non-numeric coordinates)
    c. Validates and transforms each point:
       - For each parsed point:
         * Validates: parseFloat(x), parseFloat(y)
         * Transforms: ol.proj.transform([x, y], csvCRS, mapCRS)
         * Checks Uganda bounds:
           - Transforms to WGS84: ol.proj.transform(coord, mapCRS, 'EPSG:4326')
           - Checks: lon between 28-36, lat between -3-5
           - Counts out-of-bounds points
    d. Creates map features:
       - For each valid point:
         * Creates Point geometry
         * Sets name from CSV (column 1)
         * Stores originalCoord and crs
         * Adds to searchSource
    e. Updates statistics:
       - Counts: plotted, skipped, out-of-bounds
    f. Zooms map:
       - Calculates extent of all points
       - Fits extent with 50px padding
       - Max zoom: 18
3.7. Points appear on map:
    - Red circular markers (same style as manual entry)
    - Labels show point names from CSV
    - All points visible on map
3.8. Status message:
    - "CSV: X plotted, Y skipped"
    - If out-of-bounds: "(Z outside Uganda bounds)"
3.9. CRS selection saved to localStorage

STEP 4: VIEW RESULTS
---------------------
4.1. Results are displayed in table format (if modal expanded):
    - Columns: ID, X/Easting, Y/Northing, Latitude, Longitude
    - Each row shows one plotted point
    - Coordinates shown in original CRS and WGS84
4.2. Points remain on map:
    - Visible until cleared
    - Can be used for reference
    - Can be cleared individually or all at once

STEP 5: CLEAR RESULTS
----------------------
5.1. Click "Clear Results" button
5.2. System:
    - Clears searchSource (removes all points from map)
    - Clears results table
    - Resets status message
5.3. Map returns to previous view

STEP 6: CLOSE MODAL
--------------------
6.1. Click "×" (close button) in modal header
6.2. Modal closes
6.3. Points remain on map (until cleared or page refresh)

================================================================================
3. COORDINATE EXTRACTOR TOOL - STEP-BY-STEP WORKFLOW
================================================================================

STEP 1: LAUNCH COORDINATE EXTRACTOR
------------------------------------
1.1. Open webmap.html in your browser
1.2. Look for "COORD EXTRACTOR" button in bottom control bar
    - Icon: ruler-combined (fa-ruler-combined)
    - Located with other control buttons
1.3. Click "COORD EXTRACTOR" button
1.4. Modal appears (coord-extractor-modal)
1.5. Modal contains:
    - Left Panel: Controls (CRS selection, buttons)
    - Right Panel: Results table

STEP 2: SELECT COORDINATE SYSTEM
----------------------------------
2.1. In "Coordinate Reference System" dropdown:
2.2. Available options:
    - WGS84 UTM Zone 36N (Default) — EPSG:32636
    - Arc1960 UTM Zone 36N — EPSG:21096
    - Arc1960 UTM Zone 36S — EPSG:21036
    - WGS84 UTM Zone 36S — EPSG:32736
    - WGS84 Geographic (Lat/Lon) — EPSG:4326
    - Web Mercator — EPSG:3857
2.3. Select desired CRS for extracted coordinates
2.4. This CRS determines output format:
    - UTM: Easting/Northing in meters
    - Geographic: Longitude/Latitude in degrees
    - Web Mercator: X/Y in meters

STEP 3: SELECT LAYER FOR SNAPPING (OPTIONAL)
----------------------------------------------
3.1. In "Layer for Snapping" dropdown:
3.2. Options:
    - "-- Select Layer --" (no snapping)
    - Available map layers (populated dynamically)
3.3. If layer selected:
    - Cursor snaps to nearest feature in layer
    - Helps extract coordinates from existing features
    - Pixel-based tolerance (configurable)
3.4. If no layer selected:
    - Free clicking on map
    - No snapping behavior

STEP 4: START EXTRACTION
-------------------------
4.1. Click "Start Extraction" button
4.2. System:
    - Button changes to "Stop Extraction" (red)
    - Status: "Click on the map to extract coordinates"
    - Cursor changes to crosshair
    - Map click event listener activated
4.3. Extraction mode is now active

STEP 5: EXTRACT COORDINATES
-----------------------------
5.1. Click anywhere on map
5.2. System Processing:
    a. Captures click event:
       - Gets click coordinate: evt.coordinate (in Web Mercator)
       - Gets view projection: EPSG:3857
    b. Applies snapping (if layer selected):
       - Finds nearest feature in selected layer
       - Calculates pixel distance
       - If within tolerance: Uses feature coordinate
    c. Transforms coordinates:
       - Source: EPSG:3857 (Web Mercator)
       - Target: Selected CRS from dropdown
       - Transformation: ol.proj.transform(clickCoord, 'EPSG:3857', selectedCRS)
       - Also gets WGS84: ol.proj.transform(clickCoord, 'EPSG:3857', 'EPSG:4326')
    d. Formats coordinates:
       - For UTM: Rounds to 3 decimal places
       - For EPSG:4326: Keeps 6 decimal places
       - Stores both CRS-specific and WGS84 values
    e. Creates extracted point object:
       - id: Sequential number (1, 2, 3, ...)
       - easting: X coordinate in selected CRS
       - northing: Y coordinate in selected CRS
       - lat: Latitude in WGS84
       - lon: Longitude in WGS84
       - crs: Selected CRS code
       - rawEasting, rawNorthing: Unrounded values
    f. Adds to extractedPoints array
    g. Updates display:
       - Adds point marker to map (red circle with ID label)
       - Updates results table
       - Enables buttons (Undo, Clear All, Export CSV)
5.3. Point appears on map:
    - Red circular marker (radius 6px)
    - Red fill with transparency (rgba(255, 0, 0, 0.7))
    - Red stroke (2px)
    - Red text label showing point ID
    - Label offset: -15px above point
5.4. Results table updates:
    - New row added with:
      * Point ID
      * Easting (in selected CRS)
      * Northing (in selected CRS)
      * Latitude (WGS84)
      * Longitude (WGS84)
5.5. Status toast: "Point X extracted in [CRS]"
5.6. Point counter increments

STEP 6: CONTINUE EXTRACTING
----------------------------
6.1. Click additional points on map
6.2. Each click:
    - Extracts coordinate
    - Adds to array
    - Updates map and table
    - Increments point counter
6.3. Extract as many points as needed
6.4. Points are numbered sequentially (1, 2, 3, ...)

STEP 7: MANAGE EXTRACTED POINTS
--------------------------------
7.1. Undo Last Point:
    - Click "Undo" button
    - Removes last extracted point
    - Decrements point counter
    - Updates map and table
    - If no points remain: Disables buttons
7.2. Clear All Points:
    - Click "Clear All" button
    - Removes all extracted points
    - Resets point counter to 1
    - Clears map markers
    - Clears results table
    - Disables buttons
7.3. Points can be managed individually or all at once

STEP 8: EXPORT TO CSV
----------------------
8.1. Click "Export CSV" button
8.2. System Processing:
    a. Validates:
       - Checks extractedPoints array is not empty
    b. Generates CSV content:
       - Header row: "Point ID,Easting,Northing,Latitude,Longitude"
       - For each point:
         * Row: `${id},${easting},${northing},${lat},${lon}`
       - Combines into single CSV string
    c. Creates download:
       - Creates Blob: new Blob([csvContent], {type: 'text/csv'})
       - Creates temporary <a> element
       - Sets href to Blob URL
       - Sets download attribute: "GSPNET-EXTRACT-CSV.csv"
       - Programmatically clicks link
       - Removes temporary element
    d. File downloads:
       - Browser downloads CSV file
       - Filename: "GSPNET-EXTRACT-CSV.csv"
       - Contains all extracted points
8.3. Success toast: "CSV exported successfully"
8.4. CSV file contains:
    - All extracted points
    - Coordinates in selected CRS
    - WGS84 lat/lon for reference
    - Point IDs for tracking

STEP 9: STOP EXTRACTION
------------------------
9.1. Click "Stop Extraction" button
9.2. System:
    - Button changes back to "Start Extraction" (blue)
    - Status: "Extraction stopped"
    - Cursor returns to normal
    - Map click listener removed
9.3. Extraction mode deactivated
9.4. Extracted points remain on map and in table

STEP 10: TEST TRANSFORMATION (OPTIONAL)
----------------------------------------
10.1. Click "Test Transform" button
10.2. System:
     - Uses test coordinate: [32.5, 0.5] (Uganda, WGS84)
     - Transforms to selected CRS
     - Transforms back to WGS84
     - Displays results in console and toast
10.3. Purpose:
     - Verifies CRS transformation is working
     - Helps debug transformation issues
     - Shows example transformation

STEP 11: CLOSE MODAL
---------------------
11.1. Click "×" (close button) in modal header
11.2. System:
     - Closes modal
     - If extraction active: Stops extraction automatically
     - Extracted points remain on map
11.3. Points visible until cleared or page refresh

================================================================================
4. BUTTON FUNCTIONS & CALCULATIONS
================================================================================

4.1. "COORD SEARCH" BUTTON
---------------------------
FUNCTION:
Opens the coordinate search modal for plotting coordinates.

PROCESS:
1. Sets modal display to 'block'
2. Loads stored CRS selections from localStorage
3. Populates dropdowns with saved values
4. Modal becomes visible

4.2. "PLOT POINT" BUTTON (Manual Entry)
----------------------------------------
FUNCTION:
Plots single coordinate point on map from manual input.

CALCULATION PROCESS:
1. Gets input values:
   - x = document.getElementById('search-manual-easting').value
   - y = document.getElementById('search-manual-northing').value
   - crs = document.getElementById('search-manual-crs').value
2. Validates inputs:
   - Trims whitespace
   - Checks both fields are filled
   - Parses as numbers: parseFloat(x), parseFloat(y)
   - Validates not NaN
3. Handles EPSG:4326 coordinate order:
   - If crs === 'EPSG:4326':
     * Checks: numX between -90 and 90, numY outside that range
     * If true: Swaps coordinates [numY, numX] (lat,lon → lon,lat)
4. Transforms coordinates:
   - Source CRS: Selected from dropdown
   - Target CRS: view.getProjection().getCode() (EPSG:3857)
   - Transformation: ol.proj.transform([x, y], sourceCRS, mapCRS)
5. Creates feature:
   - Geometry: Point at transformed coordinate
   - Name: `Point (${original[0]}, ${original[1]})`
   - Properties: originalCoord, crs
6. Adds to map:
   - Clears previous results
   - Adds feature to searchSource
7. Zooms map:
   - Animates to point: center=coord, zoom=16, duration=1500ms

MATHEMATICAL FORMULAS:
- Coordinate Transformation: ol.proj.transform([x, y], sourceCRS, targetCRS)
- EPSG:4326 Swap Detection: if (x ∈ [-90, 90] AND y ∉ [-90, 90]) then swap

4.3. "PLOT CSV" BUTTON
-----------------------
FUNCTION:
Parses CSV file and plots all coordinates on map.

CALCULATION PROCESS:
1. Gets file and settings:
   - file = fileInput.files[0]
   - crs = document.getElementById('search-csv-crs').value
   - appendMode = checkbox.checked
2. Reads CSV file:
   - Uses FileReader API
   - Reads as text: reader.readAsText(file)
3. Parses CSV (parseCSV function):
   a. Splits into lines:
      - lines = csvText.split('\n').filter(line => line.trim())
   b. Auto-detects delimiter:
      - Checks for: ',', ';', '\t'
      - Uses first found delimiter
   c. Detects header:
      - Checks if first line contains 'name', 'easting', or 'northing'
      - If header detected: startIndex = 1, else startIndex = 0
   d. Parses rows:
      - For each line (starting at startIndex):
        * Splits by delimiter
        * Trims and removes quotes
        * Column 1: name (text)
        * Column 2: x = parseFloat(parts[1])
        * Column 3: y = parseFloat(parts[2])
        * Validates: !isNaN(x) && !isNaN(y)
        * Adds to data array: {name, x, y}
4. Plots coordinates (plotCSVCoordinates function):
   a. Clears previous (if not append mode):
      - if (!appendMode): searchSource.clear()
   b. For each point:
      - Validates and transforms: validateAndTransformCoordinate(point.x, point.y, crs)
      - Checks Uganda bounds:
        * Transforms to WGS84: ol.proj.transform(coord, mapCRS, 'EPSG:4326')
        * Checks: lon ∈ [28, 36] AND lat ∈ [-3, 5]
        * Counts out-of-bounds points
      - Creates feature:
        * Geometry: Point(coord)
        * Name: point.name
        * Properties: originalCoord, crs
      - Adds to searchSource
      - Increments plotted counter
   c. Calculates extent:
      - extent = searchSource.getExtent()
   d. Zooms map:
      - view.fit(extent, {padding: [50, 50, 50, 50], maxZoom: 18})
5. Updates statistics:
   - plotted: Number of successfully plotted points
   - skipped: Number of invalid points
   - outOfBounds: Number of points outside Uganda bounds
   - Message: `CSV: ${plotted} plotted, ${skipped} skipped`

MATHEMATICAL FORMULAS:
- Delimiter Detection: First delimiter found in first line
- Header Detection: lines[0].toLowerCase().includes('name'|'easting'|'northing')
- Uganda Bounds: lon ∈ [28, 36] AND lat ∈ [-3, 5]

4.4. "START EXTRACTION" BUTTON
-------------------------------
FUNCTION:
Activates coordinate extraction mode on map clicks.

PROCESS:
1. Toggles extractionActive flag
2. If activating:
   - Changes button to "Stop Extraction" (red)
   - Sets status: "Click on the map to extract coordinates"
   - Enables crosshair cursor
   - Adds map click listener: map.on('click', handleMapClickForExtraction)
3. If deactivating:
   - Changes button to "Start Extraction" (blue)
   - Sets status: "Extraction stopped"
   - Disables crosshair cursor
   - Removes map click listener: map.un('click', handleMapClickForExtraction)

4.5. MAP CLICK HANDLER (handleMapClickForExtraction)
-----------------------------------------------------
FUNCTION:
Extracts coordinate from map click and adds to results.

CALCULATION PROCESS:
1. Gets click coordinate:
   - clickCoord = evt.coordinate (in Web Mercator, EPSG:3857)
   - viewCode = view.getProjection().getCode() ('EPSG:3857')
2. Applies snapping (if layer selected):
   - Finds nearest feature in selected layer
   - Calculates pixel distance
   - If distance < tolerance: Uses feature coordinate
3. Transforms coordinates:
   - selectedCRS = document.getElementById('crs-selector').value
   - transformedCoord = ol.proj.transform(clickCoord, viewCode, selectedCRS)
   - lonLat = ol.proj.transform(clickCoord, viewCode, 'EPSG:4326')
4. Validates transformation:
   - Checks: !isNaN(transformedCoord[0]) && !isNaN(transformedCoord[1])
5. Formats coordinates:
   - For UTM: easting = Number(transformedCoord[0].toFixed(3))
   - For EPSG:4326: easting = transformedCoord[0].toFixed(6)
   - Same for northing
   - lat = lonLat[1].toFixed(6)
   - lon = lonLat[0].toFixed(6)
6. Creates extracted point:
   - id: pointCounter (sequential)
   - easting, northing: In selected CRS
   - lat, lon: In WGS84
   - crs: Selected CRS code
   - rawEasting, rawNorthing: Unrounded values
7. Adds to array:
   - extractedPoints.push(extractedPoint)
8. Updates display:
   - updateExtractorLayer() (adds marker to map)
   - updateResultsTable() (adds row to table)
9. Enables buttons:
   - Undo, Clear All, Export CSV become enabled
10. Increments counter:
    - pointCounter++

MATHEMATICAL FORMULAS:
- Coordinate Transformation: ol.proj.transform([x, y], sourceCRS, targetCRS)
- Rounding: Number(value.toFixed(decimals))
- For UTM: 3 decimal places (millimeter precision)
- For Geographic: 6 decimal places (sub-meter precision)

4.6. "EXPORT CSV" BUTTON
-------------------------
FUNCTION:
Exports all extracted coordinates to CSV file.

CALCULATION PROCESS:
1. Validates:
   - Checks: extractedPoints.length > 0
2. Generates CSV header:
   - "Point ID,Easting,Northing,Latitude,Longitude\n"
3. Generates CSV rows:
   - For each point in extractedPoints:
     * Row: `${point.id},${point.easting},${point.northing},${point.lat},${point.lon}\n`
   - Combines all rows
4. Creates CSV content:
   - csvContent = header + all rows
5. Creates Blob:
   - blob = new Blob([csvContent], {type: 'text/csv;charset=utf-8;'})
6. Creates download link:
   - link = document.createElement('a')
   - url = URL.createObjectURL(blob)
   - link.href = url
   - link.download = "GSPNET-EXTRACT-CSV.csv"
7. Triggers download:
   - link.style.visibility = 'hidden'
   - document.body.appendChild(link)
   - link.click()
   - document.body.removeChild(link)
8. Browser downloads file

MATHEMATICAL FORMULAS:
- CSV Format: "Header\nRow1\nRow2\n..."
- Blob Creation: new Blob([content], {type: 'text/csv'})
- Object URL: URL.createObjectURL(blob)

4.7. "UNDO" BUTTON
-------------------
FUNCTION:
Removes last extracted point.

PROCESS:
1. Checks: extractedPoints.length > 0
2. Removes last point:
   - extractedPoints.pop()
   - pointCounter--
3. Updates display:
   - updateExtractorLayer() (removes marker)
   - updateResultsTable() (removes row)
4. If no points remain:
   - Disables: Undo, Clear All, Export CSV buttons
5. Shows toast: "Last point removed"

4.8. "CLEAR ALL" BUTTON
------------------------
FUNCTION:
Removes all extracted points.

PROCESS:
1. Clears array:
   - extractedPoints = []
   - pointCounter = 1
2. Clears map:
   - extractorSource.clear()
3. Clears table:
   - updateResultsTable() (clears tbody)
4. Disables buttons:
   - Undo, Clear All, Export CSV
5. Shows toast: "All points cleared"

4.9. "TEST TRANSFORM" BUTTON
-----------------------------
FUNCTION:
Tests coordinate transformation with known coordinates.

CALCULATION PROCESS:
1. Gets selected CRS:
   - selectedCRS = document.getElementById('crs-selector').value
2. Uses test coordinate:
   - testCoord = [32.5, 0.5] (Uganda, WGS84)
3. Transforms forward:
   - transformed = ol.proj.transform(testCoord, 'EPSG:4326', selectedCRS)
4. Transforms backward:
   - backToWGS84 = ol.proj.transform(transformed, selectedCRS, 'EPSG:4326')
5. Logs results:
   - Console: Input, selected CRS, transformed, back to WGS84
6. Shows toast:
   - "Test successful! [CRS]: [X], [Y]"

MATHEMATICAL FORMULAS:
- Forward Transform: ol.proj.transform([lon, lat], 'EPSG:4326', targetCRS)
- Reverse Transform: ol.proj.transform([x, y], targetCRS, 'EPSG:4326')
- Round-trip Error: |backToWGS84 - testCoord| (should be near zero)

4.10. "CLEAR RESULTS" BUTTON (Coordinate Search)
---------------------------------------------------
FUNCTION:
Clears all plotted coordinates from map and table.

PROCESS:
1. Clears map layer:
   - searchSource.clear()
2. Clears status:
   - statusEl.textContent = 'Results cleared'
   - statusEl.className = 'coordsearch-status'
3. Shows toast: "Results cleared"

================================================================================
5. ACADEMIC QUESTIONS & ANSWERS
================================================================================

Q1: What is the difference between Coordinate Search and Coordinate Extractor?
A1: Coordinate Search plots coordinates FROM user input (manual entry or CSV) 
    TO the map. It's input-driven: user provides coordinates, system displays 
    them. Coordinate Extractor extracts coordinates FROM map clicks TO user 
    output (table, CSV). It's output-driven: user clicks map, system extracts 
    coordinates. Search: Coordinates → Map. Extractor: Map → Coordinates. 
    They are inverse operations - Search visualizes known coordinates, Extractor 
    captures unknown coordinates.

Q2: How does the CSV parser handle different delimiters and formats?
A2: The parseCSV function uses auto-detection: (1) Splits first line by common 
    delimiters (comma, semicolon, tab), (2) Uses first delimiter found, 
    (3) Detects header by checking if first line contains keywords ('name', 
    'easting', 'northing'), (4) If header detected, starts parsing from row 2, 
    (5) Uses positional parsing: Column 1 = name, Column 2 = X, Column 3 = Y, 
    (6) Validates numeric coordinates (parseFloat, checks NaN). This approach 
    is robust because: (1) Works with any delimiter, (2) Header is optional, 
    (3) Column names don't matter (uses position), (4) Handles quoted values, 
    (5) Skips invalid rows automatically.

Q3: Why does the system swap coordinates for EPSG:4326?
A3: EPSG:4326 (WGS84 Geographic) can be entered as either lat,lon or lon,lat 
    depending on user preference. The system uses heuristic detection: if first 
    value is between -90 and 90 (valid latitude range) and second value is 
    outside that range (likely longitude), it assumes lat,lon format and swaps 
    to lon,lat for transformation. This handles common CSV formats where 
    coordinates are stored as lat,lon (e.g., GPS exports) while OpenLayers 
    expects lon,lat. The swap ensures correct transformation regardless of input 
    format.

Q4: How does Uganda bounds validation work?
A4: Uganda bounds validation: (1) Transforms plotted coordinate to WGS84 
    (EPSG:4326), (2) Checks longitude is between 28°E and 36°E, (3) Checks 
    latitude is between -3°S and 5°N, (4) Counts out-of-bounds points, 
    (5) Displays warning if >50% are out-of-bounds. This helps users identify 
    coordinate system errors - if coordinates are in wrong CRS or wrong 
    hemisphere, they'll likely be outside Uganda bounds. The validation is 
    informational (doesn't block plotting) but helps catch common mistakes.

Q5: How does layer snapping work in Coordinate Extractor?
A5: Layer snapping: (1) User selects layer from dropdown, (2) On map click, 
    system finds nearest feature in selected layer, (3) Calculates pixel 
    distance from click to feature, (4) If distance < tolerance (pixels), 
    uses feature coordinate instead of click coordinate, (5) Extracts 
    coordinate from snapped feature. This enables precise coordinate extraction 
    from existing map features (e.g., extracting coordinates of control points, 
    parcel corners). Snapping uses pixel-based tolerance for screen-space 
    accuracy, making it easier to snap at any zoom level.

Q6: What coordinate precision is maintained in transformations?
A6: Coordinate precision: (1) Transformations use full double-precision 
    floating point (64-bit), (2) Display formatting: UTM uses 3 decimal places 
    (0.001m = 1mm precision), Geographic uses 6 decimal places (0.000001° ≈ 
    0.11m precision), (3) Raw values stored with full precision, (4) Only 
    display values are rounded. For UTM: 3 decimals = millimeter precision 
    (sufficient for surveying). For Geographic: 6 decimals = sub-meter 
    precision (0.000001° ≈ 0.11m at equator). The system maintains precision 
    through transformations - rounding only occurs for display, not calculations.

Q7: How does the append mode work in CSV plotting?
A7: Append mode: (1) Checkbox "Append to existing points" controls behavior, 
    (2) If unchecked: searchSource.clear() removes all previous points before 
    plotting, (3) If checked: New points are added to existing points, 
    (4) Allows combining multiple CSV files or mixing manual and CSV points, 
    (5) All points remain on map until explicitly cleared. This enables 
    workflows like: (1) Plot control points from CSV, (2) Add manual points 
    for specific locations, (3) Plot additional CSV with survey points, 
    (4) All points visible together for reference.

Q8: What is the purpose of storing original coordinates?
A8: Original coordinates are stored in feature properties (originalCoord, crs) 
    to: (1) Preserve input format - user can see coordinates as entered, 
    (2) Enable re-export - coordinates can be exported in original CRS, 
    (3) Debugging - helps identify transformation issues, (4) Reference - 
    users can verify plotted points match input, (5) Display - results table 
    shows original coordinates. The system transforms coordinates for map 
    display (Web Mercator) but preserves originals for user reference and 
    export capabilities.

Q9: How does the coordinate extractor handle different CRS outputs?
A9: Coordinate extractor: (1) User selects target CRS from dropdown, 
    (2) On each click, transforms from Web Mercator (map display) to selected 
    CRS, (3) Also calculates WGS84 for universal reference, (4) Formats 
    output based on CRS type: UTM (3 decimals, meters), Geographic (6 decimals, 
    degrees), (5) Stores both CRS-specific and WGS84 values, (6) CSV export 
    includes all formats. This allows users to extract coordinates in their 
    preferred CRS (e.g., surveyors use UTM, GPS users use Geographic) while 
    maintaining WGS84 for interoperability.

Q10: What happens if transformation fails?
A10: If transformation fails: (1) Error is caught in try-catch block, 
     (2) Error message logged to console, (3) User sees toast: "Error 
     transforming coordinate to selected CRS. Please try another CRS.", 
     (4) Point is not added to results, (5) User can retry with different CRS. 
     Common causes: (1) Invalid CRS definition, (2) Coordinates outside CRS 
     bounds, (3) Proj4js library not loaded, (4) CRS not registered. The 
     system validates transformation results (checks for NaN) before adding 
     points, ensuring only valid coordinates are extracted.

Q11: How does the test transform button help users?
A11: Test transform button: (1) Uses known Uganda coordinate [32.5, 0.5] in 
     WGS84, (2) Transforms to selected CRS, (3) Transforms back to WGS84, 
     (4) Displays results in console and toast, (5) Helps verify CRS 
     transformation is working correctly. Benefits: (1) Debugging - identifies 
     transformation issues, (2) Verification - confirms CRS selection is 
     correct, (3) Learning - shows example transformation, (4) Validation - 
     round-trip error should be near zero. Users can test before extracting 
     coordinates to ensure correct CRS selection.

Q12: Why are extracted points numbered sequentially?
A12: Sequential numbering (1, 2, 3, ...) provides: (1) Unique identification 
     - each point has distinct ID, (2) Order tracking - shows extraction 
     sequence, (3) Easy reference - users can refer to "Point 5", (4) CSV export 
     - IDs included in export for tracking, (5) Visual labels - point IDs shown 
     on map markers. The counter starts at 1 and increments with each extraction. 
     If points are cleared, counter resets to 1. If points are undone, counter 
     decrements. This ensures IDs always match array indices and extraction 
     order.

Q13: How does the system handle coordinate order for different CRS?
A13: Coordinate order handling: (1) For projected CRS (UTM): Always [easting, 
     northing] = [x, y], (2) For Geographic (EPSG:4326): Detects if input is 
     lat,lon and swaps to lon,lat, (3) OpenLayers always expects [lon, lat] for 
     EPSG:4326, (4) Transformations preserve order: [x, y] in source → [x, y] 
     in target, (5) Display shows coordinates in CRS-specific format. The 
     system handles coordinate order automatically - users don't need to worry 
     about lon,lat vs lat,lon for most CRS. Only EPSG:4326 requires special 
     handling due to common input format variations.

Q14: What is the difference between raw and formatted coordinates?
A14: Raw coordinates: (1) Full precision values from transformation (no 
     rounding), (2) Stored in extractedPoint.rawEasting, rawNorthing, 
     (3) Used for calculations and re-transformation, (4) Maintains maximum 
     precision. Formatted coordinates: (1) Rounded for display (3 decimals for 
     UTM, 6 for Geographic), (2) Stored in extractedPoint.easting, northing, 
     (3) Used for display in table and CSV export, (4) User-friendly format. 
     The system stores both to: (1) Maintain precision for calculations, 
     (2) Provide readable display, (3) Enable re-export with full precision if 
     needed. CSV export uses formatted values for readability.

Q15: How does the system validate coordinates before plotting?
A15: Coordinate validation: (1) Parses as numbers: parseFloat(x), parseFloat(y), 
     (2) Checks for NaN: isNaN(numX) || isNaN(numY), (3) Validates 
     transformation result: Checks transformed coordinate is not NaN, 
     (4) Checks Uganda bounds (informational, doesn't block), (5) Skips 
     invalid rows in CSV. Invalid coordinates are: (1) Non-numeric values, 
     (2) Empty fields, (3) Transformation failures, (4) Out-of-range values 
     (for some CRS). The system skips invalid coordinates and reports count 
     (e.g., "X plotted, Y skipped") so users know how many were processed.

Q16: What coordinate systems are supported and why?
A16: Supported systems: (1) EPSG:32636/32736 - WGS84 UTM Zones 36N/36S 
     (standard for Uganda), (2) EPSG:21096/21036 - Arc1960 UTM Zones 36N/36S 
     (legacy Uganda system), (3) EPSG:4326 - WGS84 Geographic (lat/lon, 
     universal), (4) EPSG:3857 - Web Mercator (map display). These cover 
     Uganda's surveying needs - UTM for local projects (meter-based, low 
     distortion), Arc1960 for legacy data, Geographic for GPS and global 
     compatibility, Web Mercator for web mapping. The system transforms between 
     all supported CRS automatically using Proj4js library.

Q17: How does localStorage save CRS selections?
A17: localStorage persistence: (1) Saves manual CRS: localStorage.setItem(
     'coordsearch_manual_crs', value), (2) Saves CSV CRS: localStorage.setItem(
     'coordsearch_csv_crs', value), (3) Loads on modal open: 
     loadStoredCRS() function, (4) Saves after successful plot: saveCRS() 
     function. Benefits: (1) Remembers user preference, (2) Faster workflow - 
     no need to reselect CRS, (3) Separate memory for manual vs CSV (users may 
     use different CRS), (4) Persists across page refreshes. The CRS selections 
     are saved independently for manual entry and CSV import, allowing users to 
     work with different coordinate systems for different input methods.

Q18: What is the purpose of the results table?
A18: Results table displays: (1) Point ID - Sequential number, (2) Easting - 
     X coordinate in selected CRS, (3) Northing - Y coordinate in selected CRS, 
     (4) Latitude - WGS84 latitude, (5) Longitude - WGS84 longitude. Purpose: 
     (1) Review all plotted/extracted points, (2) Verify coordinates are 
     correct, (3) See both CRS-specific and WGS84 values, (4) Reference for 
     export, (5) Quality control - check for outliers. The table provides 
     tabular view of all coordinates, complementing the visual map display. Users 
     can review coordinates before exporting to ensure accuracy.

Q19: How does the system handle coordinate transformation errors?
A19: Error handling: (1) Wraps transformation in try-catch block, (2) Validates 
     result: Checks for NaN or undefined, (3) Logs error to console with details, 
     (4) Shows user-friendly toast message, (5) Skips invalid coordinate (doesn't 
     crash), (6) Continues processing other coordinates. For Coordinate Search: 
     Invalid coordinates are skipped, count reported. For Coordinate Extractor: 
     Click is ignored, user can retry. The system is resilient - one bad 
     coordinate doesn't stop processing of other valid coordinates. Error 
     messages guide users to fix issues (e.g., "Try another CRS" suggests CRS 
     selection problem).

Q20: What is the difference between searchSource and extractorSource?
A20: searchSource: (1) Vector source for Coordinate Search plotted points, 
     (2) Contains points from manual entry or CSV import, (3) Styled with red 
     markers and labels, (4) Cleared when "Clear Results" clicked, 
     (5) Used for visualizing input coordinates. extractorSource: (1) Vector 
     source for Coordinate Extractor extracted points, (2) Contains points from 
     map clicks, (3) Styled with red markers and ID labels, (4) Cleared when 
     "Clear All" clicked, (5) Used for displaying extracted coordinates. Both 
     are separate layers, so Coordinate Search points and Extractor points can 
     coexist on map. They use different sources to avoid conflicts and allow 
     independent management.

================================================================================
6. BEST PRACTICES & TIPS
================================================================================

6.1. COORDINATE SEARCH - MANUAL ENTRY
--------------------------------------
- Verify coordinate system matches your data
- For EPSG:4326, system auto-detects lat/lon vs lon/lat
- Enter coordinates with appropriate precision
- Check plotted point location is correct
- Use test coordinate to verify CRS selection

6.2. COORDINATE SEARCH - CSV IMPORT
------------------------------------
- Ensure CSV has 3 columns: name, x, y
- Use consistent delimiter (comma recommended)
- Include header row for clarity (optional)
- Verify coordinate system matches CSV data
- Check Uganda bounds warning if many points outside
- Use append mode to combine multiple CSV files
- Clear results before importing new dataset

6.3. COORDINATE EXTRACTOR
--------------------------
- Select correct CRS before starting extraction
- Use layer snapping for precise extraction from features
- Extract points in logical order (helps with IDs)
- Review extracted coordinates in table before exporting
- Test transform button to verify CRS selection
- Export CSV regularly to backup extracted points
- Clear points when starting new extraction session

6.4. COORDINATE SYSTEM SELECTION
---------------------------------
- Use UTM for surveying projects (meter-based)
- Use Geographic for GPS coordinates
- Match CRS to your data source
- Test transformation if unsure
- Remember CRS selection is saved for next use

6.5. CSV FILE FORMAT
---------------------
- Use comma as delimiter (most compatible)
- Include header row (helps with detection)
- Ensure coordinates are numeric (no units)
- Remove special characters from point names
- Keep file size reasonable (<10MB recommended)
- Test with small file first

6.6. EXTRACTION WORKFLOW
-------------------------
- Start extraction mode before clicking
- Click points systematically (follow boundary, route, etc.)
- Use undo if you make a mistake
- Review table to verify all points extracted
- Export CSV when finished
- Stop extraction when done

6.7. QUALITY CONTROL
---------------------
- Verify plotted points appear in expected location
- Check coordinates in results table
- Compare with known reference points
- Use Uganda bounds as sanity check
- Review exported CSV before using

6.8. PERFORMANCE
-----------------
- Limit CSV files to reasonable size (<1000 points recommended)
- Clear results when not needed
- Close modals when finished
- Use append mode efficiently (don't accumulate too many points)

6.9. COORDINATE PRECISION
--------------------------
- UTM: 3 decimals = 1mm precision (sufficient for most surveys)
- Geographic: 6 decimals = 0.11m precision (GPS accuracy)
- Don't round coordinates before input (system handles precision)
- Export maintains full precision in raw values

6.10. ERROR PREVENTION
-----------------------
- Verify CRS selection matches data
- Check coordinate ranges are reasonable
- Test transformation with known coordinates
- Review plotted points visually
- Validate CSV format before importing
- Use test transform button to verify CRS

================================================================================
7. TROUBLESHOOTING
================================================================================

ISSUE: "Coordinate Search button not working"
SOLUTION:
- Check browser console for JavaScript errors
- Verify button element exists in DOM
- Try refreshing page (Ctrl+F5)
- Check that modal CSS is loaded
- Verify no conflicting event listeners

ISSUE: "Manual coordinate not plotting"
SOLUTION:
- Verify both X and Y fields are filled
- Check coordinates are numeric (not text)
- Verify coordinate system selection matches your data
- Check coordinate ranges are valid for selected CRS
- Try test transform button to verify CRS
- Check browser console for transformation errors

ISSUE: "CSV file not parsing"
SOLUTION:
- Verify CSV has at least 3 columns
- Check delimiter is comma, semicolon, or tab
- Ensure coordinates are numeric (no units or text)
- Verify file is actually CSV format
- Check browser console for parsing errors
- Try with simple test CSV first

ISSUE: "CSV points not appearing on map"
SOLUTION:
- Verify coordinate system matches CSV data
- Check coordinates are in correct range for CRS
- Verify transformation succeeded (check console)
- Check Uganda bounds warning (points may be outside view)
- Try manual entry with one coordinate to test
- Verify searchSource layer is visible

ISSUE: "Coordinate Extractor button not working"
SOLUTION:
- Check browser console for JavaScript errors
- Verify button and modal elements exist
- Try refreshing page
- Check that extraction handlers are attached
- Verify no JavaScript errors on page load

ISSUE: "Extraction not capturing coordinates"
SOLUTION:
- Verify "Start Extraction" button is clicked (should say "Stop Extraction")
- Check cursor changes to crosshair
- Verify map click event is firing (check console)
- Try test transform button to verify CRS
- Check coordinate transformation is working
- Verify no errors in browser console

ISSUE: "Coordinates showing wrong values"
SOLUTION:
- Verify coordinate system selection is correct
- Check if coordinates need to be swapped (lat/lon vs lon/lat)
- Try test transform with known coordinate
- Verify CRS definition is loaded (Proj4js)
- Check that transformation direction is correct
- Compare with known reference point

ISSUE: "CSV export fails or file empty"
SOLUTION:
- Verify extracted points array is not empty
- Check browser allows downloads (popup blocker)
- Verify CSV content is generated (check console)
- Try exporting with fewer points
- Check browser download settings
- Verify Blob creation succeeded

ISSUE: "Transformation errors"
SOLUTION:
- Verify Proj4js library is loaded
- Check CRS code is correct (e.g., EPSG:32636)
- Verify CRS definition exists in Proj4js
- Try different CRS to isolate issue
- Check coordinates are within CRS bounds
- Review browser console for specific error

ISSUE: "Points appearing in wrong location"
SOLUTION:
- Verify coordinate system matches data source
- Check if coordinates are in wrong hemisphere (N vs S)
- Verify coordinate order (easting/northing vs lat/lon)
- Try test coordinate to verify transformation
- Compare with known reference location
- Check Uganda bounds (points outside may indicate wrong CRS)

ISSUE: "Layer snapping not working"
SOLUTION:
- Verify layer is selected from dropdown
- Check layer has features loaded
- Verify layer is visible on map
- Check snapping tolerance (may be too strict)
- Try clicking closer to features
- Verify layer source is accessible

ISSUE: "Results table not updating"
SOLUTION:
- Check that updateResultsTable() is called
- Verify table body element exists
- Check browser console for errors
- Try manually clearing and re-extracting
- Verify extractedPoints array is updating
- Check table HTML structure

ISSUE: "CSV delimiter not detected"
SOLUTION:
- Ensure delimiter is comma, semicolon, or tab
- Check first line contains delimiter
- Verify CSV is not corrupted
- Try manually specifying delimiter in code
- Check for mixed delimiters in file
- Verify file encoding is UTF-8

ISSUE: "Uganda bounds warning for valid coordinates"
SOLUTION:
- Warning is informational (doesn't block plotting)
- Some coordinates near borders may trigger warning
- Verify coordinates are actually in Uganda
- Check if coordinate system is correct
- Warning threshold is >50% out-of-bounds
- Can proceed if coordinates are correct

ISSUE: "Coordinate precision lost in export"
SOLUTION:
- System stores raw values with full precision
- Export uses formatted values (3-6 decimals)
- Raw values available in extractedPoint object
- Modify export code to use raw values if needed
- Precision is maintained in transformations
- Only display values are rounded

ISSUE: "Modal not closing"
SOLUTION:
- Click "×" close button in header
- Check close event handler is attached
- Try pressing ESC key
- Verify modal display property is set
- Check for JavaScript errors preventing close
- Refresh page if modal is stuck

ISSUE: "Points disappear on page refresh"
SOLUTION:
- Points are stored in browser memory only
- Not persisted to database or localStorage
- This is by design (temporary visualization)
- Export CSV before refreshing to save points
- Use Coordinate Search for permanent plotting
- Consider saving coordinates to database if needed

ISSUE: "Multiple coordinate systems in same session"
SOLUTION:
- Coordinate Search: Can plot points in different CRS (each point stores its CRS)
- Coordinate Extractor: Uses single CRS for all extractions (change CRS before starting)
- For mixed CRS: Extract in batches with different CRS selections
- Export separate CSV files for each CRS
- Points on map are transformed to Web Mercator for display (uniform)

ISSUE: "Performance issues with large CSV files"
SOLUTION:
- Limit CSV to <1000 points for best performance
- Large files may cause browser slowdown
- Consider splitting large CSV into multiple files
- Use append mode to combine smaller files
- Clear results between imports
- Check browser memory usage


## GSP.NET_ASSIST_and_Project_Library_Guide.txt


GSP.NET ASSIST & PROJECT LIBRARY - Complete Workflow Guide

================================================================================
TABLE OF CONTENTS
================================================================================
1. Overview & Purpose
2. GSP.NET ASSIST - Step-by-Step Workflow
3. PROJECT LIBRARY - Step-by-Step Workflow
4. Button Functions & Calculations
5. Academic Questions & Answers
6. Best Practices & Tips
7. Troubleshooting

================================================================================
1. OVERVIEW & PURPOSE
================================================================================

GSP.NET ASSIST:
GSP.NET ASSIST is a floating action button (FAB) that provides quick access to 
essential geospatial tools and file upload capabilities. It serves as a 
comprehensive toolkit for:
- File and CSV uploads with project metadata
- DWG and DXF CAD file uploads
- Drawing and markup tools for map annotation
- Measurement tools for distances, areas, and azimuths

Key Features:
- Floating button at bottom-left corner (30x30px, pulsing animation)
- Left-side slide-in panel with tabbed interface
- Location-based project organization
- Dynamic form fields based on project nature
- Direct Supabase storage integration
- Real-time drawing and measurement on map

PROJECT LIBRARY:
PROJECT LIBRARY is a comprehensive project management and search system for 
geospatial files and drawings. It enables users to:
- Upload and organize project files (CSV, files, DWG, DXF)
- Search projects using multiple criteria
- View project details and metadata
- Download project files
- Visualize project locations on map

Key Features:
- Right-side search panel (400px width)
- Dual-table system (project_files and project_drawings)
- Advanced search with multiple filters
- Map visualization with color-coded pins
- Project details modal with complete metadata
- Direct file download from Supabase storage

================================================================================
2. GSP.NET ASSIST - STEP-BY-STEP WORKFLOW
================================================================================

STEP 1: LAUNCH GSP.NET ASSIST
-------------------------------
1.1. Open webmap.html in your browser
1.2. Look for floating button at bottom-left corner:
    - Small blue circular button (30x30px)
    - ChatGPT logo icon
    - Pulsing glow animation
    - White border (2px)
1.3. Click the floating button
1.4. Left-side panel slides in from left
1.5. Panel contains 4 tabs:
    - File & CSV (default active)
    - DWG & DXF
    - DRAWING
    - MEASURE

STEP 2: SELECT PROJECT LOCATION (REQUIRED FIRST STEP)
------------------------------------------------------
2.1. In File & CSV or DWG & DXF tab:
2.2. Click "Select Project Location on Map" button
2.3. Map cursor changes to crosshair
2.4. Click on map where project is located
2.5. System:
    - Captures click coordinates
    - Transforms to WGS84 (EPSG:4326):
      * Gets map click coordinate (Web Mercator)
      * Transforms: lonLat = ol.proj.transform(coord, 'EPSG:3857', 'EPSG:4326')
    - Stores in projectLibraryState.selectedProjectCoordinate:
      {lat: latitude, lon: longitude}
    - Places temporary pin marker on map
    - Displays coordinates: "Lat: X.XXXX, Lon: Y.YYYY"
2.6. Form becomes enabled (opacity: 1, pointer-events: auto)
2.7. "Save & Upload" button becomes enabled

STEP 3: FILL PROJECT INFORMATION (FILE & CSV)
------------------------------------------------
3.1. In "File & CSV" tab:
3.2. Required Fields:
    - Client: Enter client name (text input)
    - Nature of File/CSV: Select from dropdown:
      * Control Points
      * JRJ
      * Other
3.3. Dynamic Fields (appear based on Nature selection):

    FOR "CONTROL POINTS":
    - Project Name (optional)
    - Project Code (optional)
    - District (dropdown - all Uganda districts)
    - Surveyor (required)
    - Supervisor (required)
    - Survey Date (date picker)
    - Datum (text input)
    - Accuracy Level (dropdown: High, Medium, Low)
    - Number of Points (number input)
    - Additional Info (textarea)

    FOR "JRJ":
    - District (dropdown - required)
    - County (text input)
    - Block Number (text input)
    - Plot Number (text input)
    - Surveyor (required)
    - Supervisor (required)
    - Company (text input)
    - Survey Date (date picker, defaults to today)
    - Coordinate System (dropdown - all Uganda systems)
    - Parish (text input)
    - Village (text input)
    - Land Use Type (text input)
    - Reference Number (text input)
    - Additional Info (textarea)

    FOR "OTHER":
    - Project Name (optional)
    - Coordinate System (dropdown)
    - District (dropdown)
    - Surveyor (required)
    - Supervisor (required)
    - Additional Info (textarea)

3.4. Fill in all required fields
3.5. Fields marked with * are required

STEP 4: UPLOAD FILE/CSV
------------------------
4.1. In file upload area:
4.2. Upload Methods:
    a. Drag & Drop:
       - Drag file into drop area
       - Area highlights when dragging over
       - Drop file to select
    b. Browse Files:
       - Click "Browse Files" button
       - Select file from computer
       - File picker opens
4.3. Supported File Types:
    - CSV files (.csv)
    - Text files (.txt)
    - Excel files (.xlsx)
4.4. File Selection:
    - File name appears in display area
    - File stored in memory for upload
4.5. Verify file is correct before proceeding

STEP 5: SAVE & UPLOAD FILE/CSV
-------------------------------
5.1. Review all form fields are filled correctly
5.2. Click "Save & Upload" button
5.3. System Processing:
    a. Validates:
       - Project location is selected
       - File is selected
       - Client is filled
       - Nature is selected
       - Required fields are filled
    b. Gets Current User:
       - Calls: supabase.auth.getUser()
       - Extracts user ID
       - Validates authentication
    c. Determines File Type:
       - If file.name.endsWith('.csv'): fileType = 'csv'
       - Else: fileType = 'file'
    d. Prepares File Path:
       - Folder: 'files'
       - Timestamp: Date.now()
       - Path: `files/${timestamp}_${filename}`
    e. Uploads to Supabase Storage:
       - Bucket: 'uploads'
       - Method: supabase.storage.from('uploads').upload(filePath, file, {...})
       - Options: cacheControl: '3600', upsert: false
    f. Collects Form Data:
       - Base fields: file_name, file_path, file_type, nature, client, 
         latitude, longitude, uploaded_by
       - Nature-specific fields added based on selection
    g. Saves Metadata to Database:
       - Table: project_files
       - Method: supabase.from('project_files').insert([formData]).select()
       - All fields stored in database record
    h. Success Response:
       - Shows success toast: "Project uploaded successfully!"
       - Resets form
       - Clears location pin
       - Disables form again
5.4. Progress Indicator:
    - Progress bar shows during upload
    - Button shows "Uploading..." with spinner
    - Status message displays

STEP 6: UPLOAD DWG/DXF (ALTERNATIVE WORKFLOW)
----------------------------------------------
6.1. Click "DWG & DXF" tab
6.2. Select Project Location (same as Step 2)
6.3. Fill Required Fields:
    - Client: Enter client name
    - Nature of Drawing: Select from dropdown:
      * Land Survey
      * Other Project
6.4. Dynamic Fields (based on Nature):

    FOR "LAND SURVEY":
    - Nature of Survey (text input)
    - Coordinate System (dropdown)
    - District (dropdown)
    - County (text input)
    - Block Number (text input)
    - Plot Number (text input)
    - Surveyor (required)
    - Supervisor (required)
    - Company (text input)
    - Survey Date (date picker)
    - Survey Method (text input)
    - Accuracy Standard (text input)
    - Reference Number (text input)
    - Survey Status (text input)
    - Additional Info (textarea)

    FOR "OTHER PROJECT":
    - Project Name (optional)
    - Coordinate System (dropdown)
    - Surveyor (required)
    - Supervisor (required)
    - District (dropdown)
    - Additional Info (textarea)

6.5. Upload DWG/DXF File:
    - Drag & drop or browse
    - Supported: .dwg, .dxf files
6.6. Click "Save & Upload"
6.7. System Processing (similar to Step 5):
    - File type: 'dwg' or 'dxf' (based on extension)
    - Folder: 'drawings'
    - Path: `drawings/${timestamp}_${filename}`
    - Table: project_drawings
    - Same upload and save process

STEP 7: USE DRAWING TOOLS
---------------------------
7.1. Click "DRAWING" tab
7.2. Drawing Tools Available:
    - Point: Draw point markers
    - Line: Draw line strings
    - Polygon: Draw polygons
    - Circle: Draw circles
7.3. Drawing Process:
    a. Click tool button (e.g., "Point")
    b. Tool becomes active (highlighted)
    c. Click on map to place feature
    d. For lines/polygons: Click multiple points
    e. Right-click or double-click to finish
    f. Feature appears on map
7.4. Drawing Actions:
    - Modify: Edit existing features (drag vertices)
    - Delete: Remove selected features
    - Clear: Remove all drawings
    - Stop: Stop current drawing operation
7.5. Export/Import:
    - Export: Download drawings as GeoJSON
    - Import: Load GeoJSON file
7.6. Drawing Stats:
    - Shows count: Points, Lines, Polygons
    - Updates in real-time
7.7. Features are saved locally (browser memory)
    - Not saved to database
    - Cleared on page refresh

STEP 8: USE MEASUREMENT TOOLS
-------------------------------
8.1. Click "MEASURE" tab
8.2. Measurement Tools:
    - Distance: Measure distance between points
    - Area: Measure area of polygon
    - Azimuth: Measure bearing/angle
8.3. Measurement Process:
    a. Click tool button (e.g., "Distance")
    b. Click on map to start measurement
    c. Click additional points (for distance/area)
    d. Double-click to finish
    e. Result displays in measurement results panel
8.4. Measurement Actions:
    - Clear: Remove all measurements
    - Toggle: Show/hide measurements
    - Stop: Stop current measurement
8.5. Results Display:
    - Distance: Shows in meters (e.g., "125.50 m")
    - Area: Shows in square meters (e.g., "1,250.00 m²")
    - Azimuth: Shows in degrees (e.g., "45.5°")
8.6. Measurements are temporary (cleared on page refresh)

STEP 9: CLOSE PANEL
--------------------
9.1. Click "×" (close button) in panel header
9.2. Panel slides out to left
9.3. Map returns to full width
9.4. Drawings and measurements remain on map (until cleared)

================================================================================
3. PROJECT LIBRARY - STEP-BY-STEP WORKFLOW
================================================================================

STEP 1: LAUNCH PROJECT LIBRARY
--------------------------------
1.1. Open webmap.html in your browser
1.2. Look for "PROJECT LIBRARY" button in bottom control bar
    - Icon: folder-open (fa-folder-open)
    - Located with other control buttons
1.3. Click "PROJECT LIBRARY" button
1.4. Right-side panel slides in from right (400px width)
1.5. Panel contains:
    - Search tabs (File & CSV / DWG & DXF)
    - Search form with filters
    - Results section

STEP 2: SELECT SEARCH TYPE
----------------------------
2.1. Choose search tab:
    - "File & CSV": Search project_files table
    - "DWG & DXF": Search project_drawings table
2.2. Active tab determines:
    - Which table to query
    - Which nature options are available
    - Which results are displayed

STEP 3: CONFIGURE SEARCH CRITERIA
-----------------------------------
3.1. Fill Search Form Fields (all optional):

    NATURE OF PROJECT:
    - Dropdown populated based on search type
    - File & CSV: Control Points, JRJ, Other
    - DWG & DXF: Land Survey, Other Project
    - Default: "All Types"

    CLIENT:
    - Text input
    - Uses ILIKE for partial matching
    - Case-insensitive search

    DISTRICT:
    - Dropdown with all Uganda districts
    - Exact match (eq)

    COUNTY:
    - Text input
    - Uses ILIKE for partial matching

    BLOCK NUMBER:
    - Text input
    - Uses ILIKE for partial matching

    PLOT NUMBER:
    - Text input
    - Uses ILIKE for partial matching

    PROJECT NAME:
    - Text input
    - Uses ILIKE for partial matching

    SURVEYOR:
    - Text input
    - Uses ILIKE for partial matching

    COORDINATE SYSTEM:
    - Dropdown with all Uganda coordinate systems
    - Exact match (eq)

    DATE FROM / DATE TO:
    - Date pickers
    - Filters by uploaded_at timestamp
    - Uses gte (greater than or equal) and lte (less than or equal)

    SORT BY:
    - Dropdown options:
      * Date (Newest) - uploaded_at DESC
      * Date (Oldest) - uploaded_at ASC
      * Name (A-Z) - project_name ASC
      * Name (Z-A) - project_name DESC
      * District (A-Z) - district ASC

3.2. Fill any combination of fields
3.3. Leave fields empty to search all

STEP 4: EXECUTE SEARCH
-----------------------
4.1. Click "Search" button
4.2. System Processing:
    a. Collects all form values
    b. Determines table: project_files or project_drawings
    c. Builds Supabase Query:
       - Starts with: supabase.from(tableName).select('*')
       - Adds filters based on filled fields:
         * Exact match: .eq('field', value) for enums
         * Partial match: .ilike('field', `%${value}%`) for text
         * Date range: .gte('uploaded_at', dateFrom) and .lte('uploaded_at', dateTo)
       - Applies sorting: .order(column, {ascending: true/false})
    d. Executes Query:
       - Calls: await query
       - Returns array of matching projects
    e. Displays Results:
       - Shows count: "X projects found"
       - Renders result cards
       - Plots projects on map
4.3. Results Display:
    - Each result shows:
      * Project name (or file name)
      * Client name
      * District
      * Upload date
      * Surveyor (if available)
    - Action buttons:
      * View: Open details modal
      * Download: Download file
      * Map: Zoom to project location

STEP 5: VIEW PROJECT DETAILS
------------------------------
5.1. Click "View" button on any result
5.2. System:
    a. Fetches full project record:
       - Table: Based on search type
       - Query: .select('*').eq('id', projectId).single()
    b. Creates/Shows Modal:
       - Modal displays all project metadata
       - Organized in sections:
         * Project Information
         * Location Information
         * Survey Information
         * Technical Details
         * Additional Information (if available)
    c. Modal Actions:
       - Close: Closes modal
       - View on Map: Closes modal and zooms to location
5.3. Details Include:
    - All form fields that were filled during upload
    - Upload timestamp
    - File path and name
    - Coordinate system
    - Survey dates and metadata

STEP 6: DOWNLOAD PROJECT FILE
-------------------------------
6.1. Click "Download" button on any result
6.2. System:
    a. Fetches file metadata:
       - Query: .select('file_path, file_name').eq('id', projectId).single()
    b. Gets Download URL:
       - Method: supabase.storage.from('uploads').getPublicUrl(file_path)
       - Returns public URL for file
    c. Creates Download Link:
       - Creates <a> element
       - Sets href to public URL
       - Sets download attribute to file_name
       - Programmatically clicks link
    d. File Downloads:
       - Browser downloads file
       - Uses original file name
6.3. Success Toast: "Download started"

STEP 7: ZOOM TO PROJECT LOCATION
----------------------------------
7.1. Click "Map" button on any result
7.2. System:
    a. Fetches project location:
       - Query: .select('latitude, longitude, file_name, project_name, nature')
         .eq('id', projectId).single()
    b. Validates Coordinates:
       - Checks latitude and longitude exist
    c. Transforms to Map Coordinates:
       - Transforms: ol.proj.fromLonLat([longitude, latitude])
       - Converts WGS84 to Web Mercator
    d. Creates Highlight Pin:
       - Color based on nature:
         * Control Points: Blue (#3498db)
         * JRJ: Green (#27ae60)
         * Land Survey: Red (#e74c3c)
         * Other: Gray (#95a5a6)
       - Style: Circle (12px radius) with label
       - Label: Project name or file name
    e. Adds Pin to Map:
       - Adds to projectPinsSource
       - Sets isHighlighted: true
    f. Zooms Map:
       - Animates to location
       - Zoom level: 16
       - Duration: 1500ms
       - Centers on project coordinate
7.3. Map Updates:
    - Pin appears at project location
    - Map zooms to show location
    - Success toast: "Zoomed to project location"

STEP 8: RESET SEARCH
---------------------
8.1. Click "Reset" button
8.2. System:
    - Clears all form fields
    - Resets dropdowns to defaults
    - Clears results
    - Removes project pins from map (except temporary)
8.3. Ready for new search

STEP 9: CLOSE PANEL
--------------------
9.1. Click "×" (close button) in panel header
9.2. Panel slides out to right
9.3. Map returns to full width
9.4. Project pins remain on map (until new search or page refresh)

================================================================================
4. BUTTON FUNCTIONS & CALCULATIONS
================================================================================

4.1. "GSP.NET ASSIST" FLOATING BUTTON
--------------------------------------
FUNCTION:
Opens the left-side panel with tools and upload capabilities.

PROCESS:
1. Toggles panel visibility
2. Slides panel in from left
3. Initializes tab system
4. Resets form states
5. Clears temporary markers

4.2. "SELECT PROJECT LOCATION" BUTTON
--------------------------------------
FUNCTION:
Enables map click to capture project location coordinates.

CALCULATION PROCESS:
1. User clicks button
2. Map cursor changes to crosshair
3. User clicks on map
4. System captures click event:
   - Gets click coordinate: evt.coordinate (in Web Mercator)
5. Transforms to WGS84:
   - Source: EPSG:3857 (Web Mercator)
   - Target: EPSG:4326 (WGS84 Geographic)
   - Transformation: lonLat = ol.proj.transform(coord, 'EPSG:3857', 'EPSG:4326')
   - Result: [longitude, latitude] in degrees
6. Stores coordinates:
   - projectLibraryState.selectedProjectCoordinate = {lat, lon}
7. Creates temporary pin:
   - Transforms back to Web Mercator for display
   - Creates Point feature
   - Adds to projectPinsSource
   - Marks as isTemporary: true
8. Displays coordinates:
   - Formats: "Lat: X.XXXX, Lon: Y.YYYY"
9. Enables form:
   - Sets opacity: 1
   - Sets pointer-events: auto
   - Enables Save button

MATHEMATICAL FORMULAS:
- Coordinate Transformation (3857 → 4326):
  Uses Proj4js inverse Web Mercator projection
  lon = x / 111320.0 * cos(lat_rad)
  lat = y / 110540.0
  (Simplified - actual uses complex projection formulas)

4.3. "SAVE & UPLOAD" BUTTON (FILE/CSV)
---------------------------------------
FUNCTION:
Uploads file to Supabase storage and saves metadata to database.

CALCULATION PROCESS:
1. Validation:
   - Checks project location selected
   - Checks file selected
   - Validates required fields
   - Gets authenticated user
2. File Type Detection:
   - fileType = file.name.endsWith('.csv') ? 'csv' : 'file'
3. File Path Generation:
   - folder = 'files'
   - timestamp = Date.now()
   - filePath = `${folder}/${timestamp}_${file.name}`
   - Example: "files/1704067200000_survey_data.csv"
4. Supabase Storage Upload:
   - Bucket: 'uploads'
   - Method: supabase.storage.from('uploads').upload(filePath, file, {...})
   - Options:
     * cacheControl: '3600' (1 hour cache)
     * upsert: false (don't overwrite)
   - Returns: {data: {path, id}, error}
5. Form Data Collection:
   - Base fields:
     * file_name: file.name
     * file_path: filePath
     * file_type: fileType
     * nature: Selected nature
     * client: Client name
     * latitude: projectLibraryState.selectedProjectCoordinate.lat
     * longitude: projectLibraryState.selectedProjectCoordinate.lon
     * uploaded_by: currentUser.id
   - Nature-specific fields added based on selection
6. Database Insert:
   - Table: project_files
   - Method: supabase.from('project_files').insert([formData]).select()
   - Returns inserted record with ID
7. Success Handling:
   - Shows success toast
   - Resets form
   - Clears location pin
   - Disables form

MATHEMATICAL FORMULAS:
- File Path: files/${timestamp}_${filename}
- Timestamp: Date.now() (milliseconds since epoch)

4.4. "SAVE & UPLOAD" BUTTON (DWG/DXF)
--------------------------------------
FUNCTION:
Uploads CAD file to Supabase storage and saves metadata to database.

CALCULATION PROCESS:
1. Similar to File/CSV upload (Steps 1-2)
2. File Type Detection:
   - fileType = file.name.endsWith('.dwg') ? 'dwg' : 'dxf'
3. File Path Generation:
   - folder = 'drawings'
   - filePath = `drawings/${timestamp}_${filename}`
4. Storage Upload:
   - Same process as File/CSV
5. Form Data Collection:
   - Base fields same as File/CSV
   - Nature-specific fields for land_survey or other
6. Database Insert:
   - Table: project_drawings
   - Same insert process

4.5. DRAWING TOOLS
-------------------
FUNCTION:
Allows user to draw features on map for annotation.

CALCULATION PROCESS:
1. Point Drawing:
   - User clicks tool, then clicks map
   - Creates Point geometry at click location
   - Adds to drawing layer
2. Line Drawing:
   - User clicks multiple points
   - Creates LineString geometry: [[x1,y1], [x2,y2], ..., [xn,yn]]
   - Calculates length: geometry.getLength() (in map units)
3. Polygon Drawing:
   - User clicks multiple points, closes polygon
   - Creates Polygon geometry: [[[x1,y1], [x2,y2], ..., [x1,y1]]]
   - Calculates area: geometry.getArea() (in square map units)
   - For Web Mercator, converts to square meters:
     * Uses spherical calculation
     * Accounts for latitude distortion
4. Circle Drawing:
   - User clicks center, then radius point
   - Calculates radius: distance between center and radius point
   - Creates Circle geometry
   - Calculates area: π * r²

MATHEMATICAL FORMULAS:
- Line Length: Uses OpenLayers getLength() (spherical calculation)
- Polygon Area: Uses OpenLayers getArea() (spherical calculation)
- Circle Area: A = π * r²
- Distance: d = √((x₂ - x₁)² + (y₂ - y₁)²)

4.6. MEASUREMENT TOOLS
-----------------------
FUNCTION:
Measures distances, areas, and azimuths on map.

CALCULATION PROCESS:
1. Distance Measurement:
   a. User clicks start point, then end point
   b. Gets coordinates in Web Mercator
   c. Transforms to WGS84:
      start = ol.proj.transform([x1, y1], 'EPSG:3857', 'EPSG:4326')
      end = ol.proj.transform([x2, y2], 'EPSG:3857', 'EPSG:4326')
   d. Calculates Haversine distance:
      R = 6371000 m (Earth radius)
      dLat = (lat2 - lat1) * π/180
      dLon = (lon2 - lon1) * π/180
      a = sin²(dLat/2) + cos(lat1) * cos(lat2) * sin²(dLon/2)
      c = 2 * atan2(√a, √(1-a))
      distance = R * c (in meters)
   e. Displays: "XXX.XX m"

2. Area Measurement:
   a. User clicks multiple points forming polygon
   b. Creates polygon geometry
   c. Calculates area using spherical calculation:
      - Uses OpenLayers getArea() method
      - Accounts for Web Mercator distortion
      - Converts to square meters
   d. Displays: "X,XXX.XX m²"

3. Azimuth Measurement:
   a. User clicks start point, then end point
   b. Gets coordinates in Web Mercator
   c. Transforms to WGS84
   d. Calculates bearing:
      dLon = (lon2 - lon1) * π/180
      lat1_rad = lat1 * π/180
      lat2_rad = lat2 * π/180
      y = sin(dLon) * cos(lat2_rad)
      x = cos(lat1_rad) * sin(lat2_rad) - sin(lat1_rad) * cos(lat2_rad) * cos(dLon)
      bearing = atan2(y, x) * 180/π
      bearing = (bearing + 360) % 360 (normalize to 0-360)
   e. Displays: "XXX.X°"

MATHEMATICAL FORMULAS:
- Haversine Distance:
  d = 2R * atan2(√a, √(1-a))
  where a = sin²(Δlat/2) + cos(lat1) * cos(lat2) * sin²(Δlon/2)
- Azimuth/Bearing:
  θ = atan2(sin(Δlon) * cos(lat2), cos(lat1) * sin(lat2) - sin(lat1) * cos(lat2) * cos(Δlon))
  θ = (θ * 180/π + 360) % 360

4.7. "SEARCH" BUTTON (PROJECT LIBRARY)
---------------------------------------
FUNCTION:
Executes search query and displays matching projects.

CALCULATION PROCESS:
1. Collects Form Values:
   - Gets all search field values
   - Determines search type (files or drawings)
2. Builds Supabase Query:
   - Starts: supabase.from(tableName).select('*')
   - Adds filters:
     * Exact match: .eq('field', value) for:
       - nature, district, coordinate_system
     * Partial match: .ilike('field', `%${value}%`) for:
       - client, county, block_number, plot_number, project_name, surveyor
     * Date range: .gte('uploaded_at', dateFrom) and .lte('uploaded_at', dateTo)
3. Applies Sorting:
   - Parses sortBy: "column ORDER"
   - Splits: [column, order]
   - Applies: .order(column, {ascending: order === 'ASC'})
4. Executes Query:
   - Calls: await query
   - Returns: {data: projects[], error}
5. Displays Results:
   - Count: `${results.length} projects found`
   - Renders result cards
   - Plots on map

MATHEMATICAL FORMULAS:
- ILIKE Pattern: `%${value}%` (matches anywhere in string)
- Date Range: uploaded_at >= dateFrom AND uploaded_at <= dateTo

4.8. "VIEW" BUTTON (PROJECT DETAILS)
-------------------------------------
FUNCTION:
Fetches and displays complete project metadata.

CALCULATION PROCESS:
1. Fetches Project:
   - Table: Based on type (files or drawings)
   - Query: .select('*').eq('id', projectId).single()
   - Returns complete record
2. Formats Data:
   - Formats dates: new Date(dateString).toLocaleString()
   - Formats values: value || 'N/A'
3. Creates Modal:
   - Organizes data into sections
   - Displays in grid layout
4. Shows Modal:
   - Opens modal overlay
   - Displays formatted data

4.9. "DOWNLOAD" BUTTON
-----------------------
FUNCTION:
Downloads project file from Supabase storage.

CALCULATION PROCESS:
1. Fetches File Metadata:
   - Query: .select('file_path, file_name').eq('id', projectId).single()
2. Gets Public URL:
   - Method: supabase.storage.from('uploads').getPublicUrl(file_path)
   - Returns: {publicUrl: 'https://...'}
3. Creates Download Link:
   - Creates <a> element
   - Sets href to publicUrl
   - Sets download attribute to file_name
   - Programmatically clicks: link.click()
4. Browser Downloads File:
   - Uses original file name
   - Downloads to user's default download folder

4.10. "MAP" BUTTON (ZOOM TO PROJECT)
------------------------------------
FUNCTION:
Zooms map to project location and highlights it.

CALCULATION PROCESS:
1. Fetches Project Location:
   - Query: .select('latitude, longitude, file_name, project_name, nature')
     .eq('id', projectId).single()
2. Validates Coordinates:
   - Checks latitude and longitude exist
3. Transforms Coordinates:
   - Source: WGS84 (EPSG:4326)
   - Target: Web Mercator (EPSG:3857)
   - Transformation: ol.proj.fromLonLat([longitude, latitude])
4. Determines Pin Color:
   - Based on nature:
     * control_points: Blue (#3498db)
     * jrj: Green (#27ae60)
     * land_survey: Red (#e74c3c)
     * other: Gray (#95a5a6)
5. Creates Pin Style:
   - Circle: radius 12px, fill with color, stroke
   - Text: Project name, offset -25px, bold 12px
6. Adds Pin to Map:
   - Adds to projectPinsSource
   - Sets isHighlighted: true
7. Animates Map:
   - Center: transformed coordinate
   - Zoom: 16
   - Duration: 1500ms
   - Easing: Default

MATHEMATICAL FORMULAS:
- Coordinate Transformation (4326 → 3857):
  Uses Proj4js Web Mercator projection
  x = lon * 111320.0 * cos(lat_rad)
  y = lat * 110540.0
  (Simplified - actual uses complex projection formulas)

================================================================================
5. ACADEMIC QUESTIONS & ANSWERS
================================================================================

Q1: What is the difference between GSP.NET ASSIST and PROJECT LIBRARY?
A1: GSP.NET ASSIST is a tool panel for creating/uploading projects and drawing 
    on the map. It focuses on input: file uploads, drawing tools, measurements. 
    PROJECT LIBRARY is a search and management system for existing projects. It 
    focuses on output: finding, viewing, downloading projects. ASSIST creates 
    data, LIBRARY manages and retrieves data. They work together: ASSIST uploads 
    projects that LIBRARY can then search and manage.

Q2: Why is project location required before uploading files?
A2: Project location (latitude/longitude) is required because: (1) Enables map 
    visualization - projects can be plotted and found on map, (2) Spatial 
    organization - allows geographic search and filtering, (3) Data integrity - 
    ensures all projects have location context, (4) User experience - helps users 
    identify project location visually. The location is stored in database and 
    used for map pins, search results, and zoom-to-location functionality.

Q3: How does the dynamic form field system work?
A3: Dynamic fields appear based on "Nature" selection. Process: (1) User selects 
    nature from dropdown (e.g., "Control Points"), (2) JavaScript detects 
    change event, (3) System looks up field configuration for that nature, 
    (4) Dynamically creates HTML form elements (inputs, selects, textareas), 
    (5) Inserts elements into dynamicFields container, (6) Fields are shown/hidden 
    as needed. This allows one form to handle multiple project types without 
    hardcoding separate forms. Field configurations are defined in JavaScript 
    objects mapping nature values to field definitions.

Q4: What is the purpose of storing files in Supabase Storage vs. database?
A4: Supabase Storage is for binary file data (CSV, DWG, DXF files), while the 
    database stores metadata (text fields, dates, coordinates). Benefits: 
    (1) Performance - databases are optimized for structured data, storage for 
    files, (2) Scalability - storage handles large files efficiently, 
    (3) Cost - storage is cheaper for binary data, (4) Security - storage has 
    separate access controls, (5) Organization - files stored in folders 
    (files/, drawings/), metadata in tables. The database stores file_path 
    which references the file in storage, creating a link between metadata 
    and actual file.

Q5: How does ILIKE differ from exact match in search?
A5: ILIKE is case-insensitive pattern matching (SQL operator), while exact match 
    uses equality (=). ILIKE with '%value%' finds any string containing 'value' 
    regardless of case. For example, ILIKE '%bank%' matches "ABC Bank", "BANK", 
    "banking", etc. Exact match (=) requires exact string match. The system uses 
    ILIKE for text fields (client, county, project_name, surveyor) to allow 
    partial searches, and exact match for enums (nature, district, 
    coordinate_system) where specific values are expected. This provides flexible 
    search while maintaining precision for structured fields.

Q6: How does the Haversine formula calculate distance accurately?
A6: The Haversine formula calculates great-circle distance between two points on 
    a sphere, accounting for Earth's curvature. Formula: 
    d = 2R * atan2(√a, √(1-a))
    where a = sin²(Δlat/2) + cos(lat1) * cos(lat2) * sin²(Δlon/2)
    and R = 6371000 m (Earth radius). This is more accurate than Euclidean 
    distance for geographic coordinates because: (1) Accounts for Earth's 
    spherical shape, (2) Handles latitude-dependent longitude distances, 
    (3) Provides meter-accurate results for typical survey distances. For very 
    long distances (>1000 km), more complex formulas (Vincenty) may be needed, 
    but Haversine is sufficient for most surveying applications.

Q7: What is the difference between project_files and project_drawings tables?
A7: project_files stores metadata for CSV and general files (control points, JRJ, 
    other files). project_drawings stores metadata for CAD files (DWG, DXF - 
    land surveys, other projects). Differences: (1) File types - files handles 
    CSV/text/Excel, drawings handles CAD formats, (2) Fields - drawings has 
    CAD-specific fields (survey_method, accuracy_standard, survey_status), 
    files has CSV-specific fields (number_of_points, accuracy_level), 
    (3) Storage folders - files stored in 'files/', drawings in 'drawings/', 
    (4) Nature options - files: control_points/jrj/other, drawings: 
    land_survey/other. Both tables share common fields (client, district, 
    surveyor, coordinates) but have nature-specific fields tailored to their 
    use cases.

Q8: How does coordinate transformation work for measurements?
A8: Measurements require transformation because: (1) Map displays in Web Mercator 
    (EPSG:3857) for web compatibility, (2) Calculations need WGS84 (EPSG:4326) 
    for accurate geographic distances. Process: (1) User clicks points in Web 
    Mercator coordinates, (2) System transforms to WGS84 using Proj4js: 
    ol.proj.transform([x, y], 'EPSG:3857', 'EPSG:4326'), (3) Calculates 
    distance/area using geographic formulas (Haversine, spherical area), 
    (4) Results displayed in meters. This ensures measurements are accurate 
    regardless of map projection. Web Mercator distorts distances (especially 
    at high latitudes), so direct measurement in map coordinates would be 
    inaccurate - transformation to WGS84 ensures correct results.

Q9: What is the purpose of the timestamp in file paths?
A9: Timestamps in file paths (e.g., "files/1704067200000_survey_data.csv") serve 
    multiple purposes: (1) Uniqueness - ensures no file overwrites even with 
    same name, (2) Chronological organization - files can be sorted by upload 
    time, (3) Versioning - same file uploaded multiple times gets different 
    paths, (4) Debugging - timestamp helps identify when file was uploaded, 
    (5) Storage management - easier to identify old files for cleanup. The 
    timestamp is Date.now() which returns milliseconds since Unix epoch 
    (January 1, 1970), providing millisecond precision for uniqueness.

Q10: How does the drawing layer persist data?
A10: Drawing features are stored in browser memory (JavaScript variables), not in 
     database. This means: (1) Drawings are temporary - lost on page refresh, 
     (2) Client-side only - not shared between users, (3) Fast performance - no 
     database queries, (4) Export available - can download as GeoJSON, 
     (5) Import available - can load GeoJSON files. For persistence, users must 
     export drawings as GeoJSON and save manually, or import them in future 
     sessions. This design choice keeps drawings lightweight and fast, suitable 
     for temporary annotations and markup. For permanent storage, users should 
     use PROJECT LIBRARY to upload files or use GSP.NET UPDATES for database 
     features.

Q11: What is Row Level Security (RLS) and how does it protect project data?
A11: Row Level Security is a PostgreSQL feature that restricts row access based 
     on policies. For project_files and project_drawings: (1) SELECT policy - 
     authenticated users can read all projects, (2) INSERT policy - authenticated 
     users can insert their own projects, (3) UPDATE policy - users can only 
     update their own projects (uploaded_by = auth.uid()), (4) DELETE policy - 
     users can only delete their own projects. This ensures: (1) Data privacy - 
     users can see all projects but only modify their own, (2) Data integrity - 
     prevents unauthorized modifications, (3) Audit trail - uploaded_by tracks 
     ownership, (4) Multi-user safety - users can't accidentally delete others' 
     work. RLS is enforced at database level, so it works even if application 
     code is bypassed.

Q12: How does the search query handle multiple filters?
A12: The search query uses method chaining to build filters incrementally. 
     Process: (1) Start with base query: supabase.from(table).select('*'), 
     (2) For each filled field, add filter:
        * Text fields: .ilike('field', `%${value}%`)
        * Enum fields: .eq('field', value)
        * Date fields: .gte('field', dateFrom) and .lte('field', dateTo)
     (3) Chain filters: query.eq(...).ilike(...).gte(...), (4) Add sorting: 
     .order(column, {ascending}), (5) Execute: await query. Supabase client 
     library builds SQL query from method chain, combining all filters with AND 
     logic. Empty fields are skipped (no filter added), so user can fill any 
     combination of fields. This provides flexible search without hardcoding 
     query combinations.

Q13: What coordinate systems are supported and why?
A13: Supported systems: (1) EPSG:32636/32736 - WGS84 UTM Zones 36N/36S (standard 
     for Uganda), (2) EPSG:21096/21036 - Arc1960 UTM Zones 36N/36S (legacy 
     Uganda system), (3) EPSG:4326 - WGS84 Geographic (lat/lon, universal), 
     (4) EPSG:3857 - Web Mercator (map display standard). These cover Uganda's 
     surveying needs - UTM for local projects (meter-based, low distortion), 
     Geographic for global compatibility (GPS, databases), Web Mercator for web 
     mapping (standard projection). The system transforms between all supported 
     CRS automatically using Proj4js library, ensuring coordinates are always in 
     correct format for storage (WGS84) and display (Web Mercator).

Q14: How does file download work with Supabase Storage?
A14: File download process: (1) System fetches file_path from database, 
     (2) Gets public URL: supabase.storage.from('uploads').getPublicUrl(file_path), 
     (3) Returns URL like: "https://<project>.supabase.co/storage/v1/object/public/uploads/files/...", 
     (4) Creates temporary <a> element with href=URL and download=filename, 
     (5) Programmatically clicks link: link.click(), (6) Browser downloads file. 
     The getPublicUrl() method generates a signed URL if bucket is private, or 
     public URL if bucket is public. For security, bucket should be private with 
     RLS policies, and getPublicUrl() generates time-limited signed URLs. The 
     download attribute ensures browser uses original filename, not URL path.

Q15: What happens if storage upload fails but database insert succeeds?
A15: If storage upload fails: (1) Error is thrown immediately, (2) Database 
     insert never executes (code doesn't reach that point), (3) User sees error 
     message, (4) No orphaned database records. The system uploads to storage 
     first, then inserts to database - this ensures file exists before metadata 
     is saved. If database insert fails after successful upload: (1) File remains 
     in storage (orphaned), (2) User sees error, (3) File can be manually 
     deleted from storage later, (4) No database record created. For production, 
     consider: (1) Transaction-like behavior (rollback storage on DB failure), 
     (2) Cleanup job for orphaned files, (3) Retry logic for transient errors.

Q16: How does the drawing export/import work?
A16: Export: (1) Collects all drawing features from drawing layer, (2) Converts 
     to GeoJSON format using OpenLayers format.GeoJSON().writeFeatures(features), 
     (3) Creates Blob with GeoJSON text, (4) Creates download link with 
     data URL, (5) Downloads as .geojson file. Import: (1) User selects GeoJSON 
     file, (2) Reads file as text, (3) Parses JSON, (4) Converts to OpenLayers 
     features using format.readFeatures(), (5) Transforms coordinates to map 
     projection, (6) Adds features to drawing layer. GeoJSON is standard format 
     (RFC 7946) for geospatial data exchange, making drawings portable between 
     systems. The export includes all feature properties and geometries in 
     standard format.

Q17: What is the difference between measurement tools and drawing tools?
A17: Measurement tools: (1) Calculate and display values (distance, area, 
     azimuth), (2) Temporary annotations (cleared easily), (3) Focus on 
     numerical results, (4) Single-use (measure, read result, clear), 
     (5) No export needed. Drawing tools: (1) Create persistent features on map, 
     (2) Can be modified and deleted individually, (3) Focus on visual 
     annotation, (4) Multi-use (draw, edit, export), (5) Exportable as GeoJSON. 
     Measurements are for quick calculations, drawings are for map markup and 
     annotation. Both use same underlying OpenLayers interactions (Draw, Modify) 
     but serve different purposes - measurements provide data, drawings provide 
     visual context.

Q18: How does the system handle large file uploads?
A18: Large file handling: (1) Supabase Storage has file size limits (typically 
     50MB for free tier, configurable), (2) No client-side size check currently 
     (relies on storage limits), (3) Upload progress not displayed (would 
     require chunked uploads), (4) Browser may timeout for very large files. 
     For production, consider: (1) Client-side file size validation before 
     upload, (2) Chunked uploads for large files (split into chunks, upload 
     sequentially), (3) Progress indicators using XMLHttpRequest or Fetch API 
     with progress events, (4) Resumable uploads for interrupted transfers, 
     (5) Compression for CSV files before upload. Current implementation is 
     suitable for typical survey files (<10MB) but may need enhancement for 
     very large datasets.

Q19: What is the purpose of the nature field in project organization?
A19: The nature field categorizes projects by type/purpose: (1) For files: 
     control_points (survey control networks), jrj (judicial records/jurisdiction), 
     other (miscellaneous), (2) For drawings: land_survey (cadastral/topographic 
     surveys), other (engineering/planning projects). Benefits: (1) Organization 
     - easier to find specific project types, (2) Filtering - search by nature 
     to narrow results, (3) Field customization - different natures show 
     different form fields, (4) Visualization - map pins can be color-coded by 
     nature, (5) Reporting - can generate reports by project type. The nature 
     field is required and stored as enum (CHECK constraint in database), 
     ensuring data consistency and enabling efficient filtering.

Q20: How does the search result display handle missing data?
A20: Search results display handles missing data gracefully: (1) Project name: 
     Falls back to file_name if project_name is null, (2) District: Shows "N/A" 
     if null, (3) Surveyor: Only displays if value exists (conditional rendering), 
     (4) Dates: Formats with toLocaleDateString(), handles null gracefully, 
     (5) All fields: Uses formatValue() helper: value || 'N/A'. This ensures: 
     (1) Results always display something meaningful, (2) No "undefined" or 
     "null" text shown to users, (3) Consistent formatting across all results, 
     (4) Users can identify missing information easily. The display prioritizes 
     available data while clearly indicating when information is not available, 
     maintaining user experience even with incomplete records.

================================================================================
6. BEST PRACTICES & TIPS
================================================================================

6.1. PROJECT LOCATION SELECTION
--------------------------------
- Select location before filling form (required step)
- Click on approximate center of project area
- Verify coordinates display correctly
- Location can be adjusted by clicking "Select Location" again
- Coordinates are stored in WGS84 (standard format)

6.2. FILE UPLOAD BEST PRACTICES
--------------------------------
- Use descriptive file names (include project code, date)
- Verify file type matches nature selection
- Check file size before upload (large files may timeout)
- Ensure CSV files have proper headers
- For DWG/DXF, verify coordinate system matches project

6.3. FORM FILLING
------------------
- Fill all required fields (marked with *)
- Use consistent naming conventions
- Include project codes for easy identification
- Add additional info for context
- Verify dates are correct (affects search)

6.4. SEARCH STRATEGIES
----------------------
- Start with specific criteria (client, district) for targeted results
- Use nature filter to narrow by project type
- Combine multiple filters for precise searches
- Use date range for recent projects
- Sort by date (newest) to see latest uploads

6.5. DRAWING TOOLS
------------------
- Use Point tool for marking locations
- Use Line tool for routes or boundaries
- Use Polygon tool for areas
- Use Circle tool for radius-based features
- Export drawings as GeoJSON for backup
- Clear drawings when finished to reduce clutter

6.6. MEASUREMENT TOOLS
----------------------
- Use Distance for point-to-point measurements
- Use Area for polygon area calculations
- Use Azimuth for bearing/angle measurements
- Double-click to finish measurements
- Clear measurements when done
- Measurements are accurate for geographic coordinates

6.7. PROJECT ORGANIZATION
-------------------------
- Use consistent client names (avoid variations)
- Include project codes in project names
- Fill district accurately (affects search)
- Add survey dates for chronological organization
- Use nature field correctly (affects available fields)

6.8. FILE NAMING
----------------
- Include project identifier in filename
- Include date in filename (YYYY-MM-DD format)
- Use descriptive names (not "data.csv")
- Avoid special characters in filenames
- Keep filenames under 100 characters

6.9. DATA QUALITY
-----------------
- Verify coordinates are in correct system
- Check that required fields are filled
- Ensure dates are in correct format
- Validate numeric fields (number of points, etc.)
- Review additional info for completeness

6.10. SEARCH EFFICIENCY
-----------------------
- Use specific terms for better results
- Combine filters to narrow results
- Use date range for time-based searches
- Sort results appropriately
- Clear search and start fresh if needed

================================================================================
7. TROUBLESHOOTING
================================================================================

ISSUE: "GSP.NET ASSIST button not visible"
SOLUTION:
- Check browser console for JavaScript errors
- Verify button element exists in DOM
- Check CSS is loaded (button should be at bottom-left)
- Try refreshing page (Ctrl+F5)
- Verify no z-index conflicts with other elements

ISSUE: "Project location not saving"
SOLUTION:
- Ensure you click "Select Project Location" button first
- Verify map click is captured (check console for coordinates)
- Check that coordinates display after clicking
- Try clicking location button again
- Verify form becomes enabled after location selection

ISSUE: "File upload fails"
SOLUTION:
- Check file size (Supabase has limits, typically 50MB)
- Verify file type is supported (.csv, .txt, .xlsx, .dwg, .dxf)
- Ensure user is authenticated (signed in)
- Check Supabase storage bucket 'uploads' exists
- Verify storage policies allow uploads
- Check browser console for detailed error messages
- Verify network connection is stable

ISSUE: "Form fields not appearing for selected nature"
SOLUTION:
- Check browser console for JavaScript errors
- Verify nature selection is registered (check dropdown value)
- Try selecting different nature and back
- Refresh page and try again
- Check that dynamicFields container exists in DOM

ISSUE: "Search returns no results"
SOLUTION:
- Verify search criteria are correct
- Try broader search (remove some filters)
- Check spelling of text fields
- Verify projects exist in database (try empty search)
- Check that table name matches search type
- Verify database connection
- Check RLS policies allow SELECT operations

ISSUE: "Project pins not appearing on map"
SOLUTION:
- Verify projectPinsLayer exists and is visible
- Check that coordinates are valid (not null)
- Verify layer is added to map
- Check browser console for rendering errors
- Try zooming to project location manually
- Verify layer z-index is appropriate

ISSUE: "Download fails or file not found"
SOLUTION:
- Verify file_path exists in database record
- Check that file exists in Supabase storage
- Verify storage bucket 'uploads' is accessible
- Check storage policies allow downloads
- Verify file_path format is correct
- Check browser console for storage errors
- Try getting public URL manually in Supabase dashboard

ISSUE: "Drawing tools not working"
SOLUTION:
- Verify drawing layer is created
- Check that tool button is clicked (becomes active)
- Ensure map is not in other interaction mode
- Try clearing drawings and starting fresh
- Check browser console for OpenLayers errors
- Verify OpenLayers library is loaded

ISSUE: "Measurements show incorrect values"
SOLUTION:
- Verify coordinate transformation is working
- Check that points are clicked in correct order
- Ensure map projection is Web Mercator (EPSG:3857)
- Try measuring known distance to verify accuracy
- Check that Haversine formula is applied correctly
- Verify Earth radius constant (6371000 m)

ISSUE: "Form reset not working"
SOLUTION:
- Check that resetFileCsvForm() or resetDwgDxfForm() is called
- Verify form fields are cleared
- Check that location pin is removed
- Ensure form is disabled after reset
- Try manually clearing fields if reset fails

ISSUE: "Search results not displaying"
SOLUTION:
- Check that displaySearchResults() is called
- Verify results array is not empty
- Check browser console for rendering errors
- Verify resultsList element exists in DOM
- Try displaying results count first
- Check that result cards HTML is generated correctly

ISSUE: "Coordinate transformation errors"
SOLUTION:
- Verify Proj4js library is loaded
- Check that CRS definitions are available
- Verify source and target CRS codes are correct
- Check that coordinates are valid numbers
- Try transforming known coordinates to verify
- Check browser console for Proj4js errors

ISSUE: "Storage upload timeout"
SOLUTION:
- Reduce file size (compress or split files)
- Check network connection speed
- Verify Supabase storage is accessible
- Try uploading smaller file to test
- Consider implementing chunked uploads for large files
- Check Supabase dashboard for storage limits

ISSUE: "Database insert fails with RLS error"
SOLUTION:
- Verify user is authenticated (signed in)
- Check RLS policies allow INSERT for authenticated users
- Verify uploaded_by field is set to current user ID
- Check that user ID is valid UUID
- Review RLS policy definitions in Supabase
- Check browser console for specific RLS error message

ISSUE: "Project details modal not showing"
SOLUTION:
- Check that modal element is created
- Verify modal CSS is loaded
- Check that openModal() function is called
- Verify project data is fetched successfully
- Check browser console for modal errors
- Try manually showing modal to test

ISSUE: "Map zoom animation not working"
SOLUTION:
- Verify coordinate transformation succeeded
- Check that map view exists
- Verify zoom level is valid (not too high/low)
- Check that animation function is called
- Try manual zoom to test coordinate
- Check browser console for animation errors


## GSP.NET_Updates_and_Parcel_Search_Guide.txt


GSP.NET UPDATES & PARCEL SEARCH - Complete Workflow Guide

================================================================================
TABLE OF CONTENTS
================================================================================
1. Overview & Purpose
2. GSP.NET UPDATES - Step-by-Step Workflow
3. PARCEL SEARCH - Step-by-Step Workflow
4. Button Functions & Calculations
5. Academic Questions & Answers
6. Best Practices & Tips
7. Troubleshooting

================================================================================
1. OVERVIEW & PURPOSE
================================================================================

GSP.NET UPDATES:
The GSP.NET Updates system enables users to create and save polygon features to 
Supabase database using CSV point data. The system provides a streamlined workflow:
- CSV import with parcel-organized points
- Polygon creation from point sequences using edge function
- Automatic validation and area calculation
- Direct save to Supabase polygon_features table
- Coordinate system transformations
- Edge distance calculations and labeling

Key Features:
- Right-side panel interface (polygon import workflow)
- Supabase Edge Function for polygon creation (polygon-creator)
- Automatic unique ID generation per layer
- Geometry validation (self-intersection, minimum area)
- Area calculation in hectares
- Edge distance measurements
- Visual polygon preview with labels

PARCEL SEARCH:
The Parcel Search system allows users to search and locate parcels in the database 
using multiple criteria:
- District-based filtering
- Unique identifier search
- Client name search
- Project name search
- Surveyor name search
- Layer-based filtering

Key Features:
- Right-side panel interface
- Real-time search with instant results
- Click-to-zoom functionality
- Parcel highlighting on map
- Results displayed in sortable table

================================================================================
2. GSP.NET UPDATES - STEP-BY-STEP WORKFLOW
================================================================================

STEP 1: LAUNCH GSP.NET UPDATES
-------------------------------
1.1. Open webmap.html in your browser
1.2. Ensure you're signed in (authentication required)
1.3. Look for "GSP.NET UPDATES" button in the header toolbar
    - Button shows database icon (fa-database)
    - Located in main control bar
1.4. Click "GSP.NET UPDATES" button
1.5. Right-side panel slides in from the right
1.6. Panel shows "Polygon Import Workflow" form

STEP 2: FILL PROJECT INFORMATION FORM
-------------------------------------
2.1. Complete the project information form (required fields marked with *):

    REQUIRED FIELDS:
    - Client: Name of client (e.g., "ABC Commercial Bank")
    - Project Name: Name of project (e.g., "Land Survey 2024")
    - Coordinate System: Select from dropdown
      * WGS84 UTM Zone 36N (EPSG:32636)
      * Arc1960 UTM Zone 36N (EPSG:21096)
      * Arc1960 UTM Zone 36S (EPSG:21036)
      * WGS84 UTM Zone 36S (EPSG:32736)
      * WGS84 Geographic (EPSG:4326)
    - District: Select from dropdown (all Uganda districts)
    - Surveyor: Name of surveyor
    - Supervisor: Name of supervisor

    OPTIONAL FIELDS:
    - Block Number: Block identifier
    - Plot Number: Plot identifier
    - County: County name
    - Company: Company name
    - Additional Info: Any additional notes

2.2. Click "Continue" or "Submit" button
2.3. System validates required fields
2.4. Form data stored in polygonImportState
2.5. Panel transitions to workflow sections

STEP 3: SELECT LAYER FOR POLYGON IMPORT
----------------------------------------
3.1. In "Select Layer for Polygon Import" section:
3.2. Select one of the available layers (radio buttons):
    - TITLE TRACTS UTM ZONE 36N
    - TITLE TRACTS UTM ZONE 36S
    - UNTITLED UTM ZONE 36N
    - UNTITLED UTM ZONE 36S
    - BLB-UNTITLED
3.3. Selected layer stored in polygonImportState.selectedLayer
3.4. Layer info displays: "Selected: <layer name>"
3.5. Layer determines unique ID prefix:
    - TT36N for Title Tracts 36N
    - TT36S for Title Tracts 36S
    - UT36N for Untitled 36N
    - UT36S for Untitled 36S
    - BLB for BLB-UNTITLED

STEP 4: CONFIRM COORDINATE SYSTEM
-----------------------------------
4.1. Coordinate system dropdown shows:
    - Pre-filled with value from project form
    - All Uganda coordinate systems available
4.2. Verify coordinate system matches your CSV data
4.3. System displays: "Selected: <CRS code>"
4.4. This CRS will be used for:
    - Transforming CSV coordinates
    - Converting to WGS84 for storage

STEP 5: IMPORT CSV FILE WITH POINTS
------------------------------------
5.1. In "Import CSV" section:
5.2. CSV Format Requirements:
    - Must contain these columns (case-insensitive):
      * parcelnumber (or parcel, plot, parcel_id, plot_id)
      * point_number (or point, pt, pointnumber, pt_no)
      * eastings (or easting, x, e, east)
      * northings (or northing, y, n, north)
      * description (optional - desc, remarks, note, comment)
    - Points are organized by parcel number
    - Each parcel can have multiple points
    - Points should be in order (will be sorted by point_number)
    - Example format:
      parcelnumber,point_number,eastings,northings,description
      1,1,400000,50000,Corner 1
      1,2,400500,50000,Corner 2
      1,3,400500,50500,Corner 3
      1,4,400000,50500,Corner 4
      2,1,401000,50000,Plot 2 Corner 1
      2,2,401500,50000,Plot 2 Corner 2
      2,3,401500,50500,Plot 2 Corner 3
      2,4,401000,50500,Plot 2 Corner 4
5.3. Import Methods:
    a. Drag & Drop:
       - Drag CSV file into drop area
       - Area highlights when dragging over
       - Drop file to upload
    b. Browse Files:
       - Click "Browse Files" button
       - Select CSV file from computer
       - File picker opens
5.4. System Processing:
    a. Reads CSV file content
    b. Parses CSV using parsePolygonCSV function:
       - Detects column indices (flexible naming)
       - Groups points by parcelnumber
       - Sorts points within each parcel by point_number
       - Validates required columns exist
    c. Auto-saves CSV to Supabase:
       - Uploads file to storage bucket (uploads/polygon-imports/)
       - Saves metadata to project_files table
       - Stores file_id for reference
    d. Displays status: "Loaded X parcel(s) with Y total points"
5.5. Results:
    - Parsed data stored in polygonImportState.csvData
    - Parcels array created with points grouped by parcel
    - Total points count calculated
    - Plot section becomes visible

STEP 6: SELECT PARCEL FROM DROPDOWN
------------------------------------
6.1. In "Plot Points" section:
6.2. Parcel Selector dropdown shows:
    - "Parcel 1 (4 points)"
    - "Parcel 2 (4 points)"
    - etc. (one option per parcel)
6.3. Select desired parcel from dropdown
6.4. System:
    - Stores selected parcel in polygonImportState.selectedParcel
    - Updates point count display: "Points: X"
    - Enables "Plot Points on Map" button
6.5. Selected parcel contains:
    - id: parcel number
    - points: array of point objects with:
      * parcelnumber
      * point_number
      * eastings
      * northings
      * description

STEP 7: PLOT POINTS ON MAP
----------------------------
7.1. Click "Plot Points on Map" button
7.2. System:
    a. Gets coordinate system from dropdown
    b. For each point in selected parcel:
       - Extracts eastings and northings
       - Transforms coordinates to Web Mercator (EPSG:3857):
         coord = ol.proj.transform([easting, northing], sourceCRS, 'EPSG:3857')
       - Creates OpenLayers Point feature
       - Applies style: Orange circle (radius 6px) with white stroke
       - Adds point_number label above point
    c. Creates vector layer with all points
    d. Adds layer to map (z-index: 1000)
    e. Calculates extent of all points
    f. Zooms map to extent with padding (50px)
7.3. Points appear as:
    - Orange circular markers (#f39c12)
    - White stroke (2px width)
    - Black text labels showing point_number
    - Labels positioned 15px above points
7.4. Polygon creation section becomes visible
7.5. Selected parcel ID displayed: "Selected Parcel: <id>"
7.6. "Generate Polygon" button becomes enabled
7.7. "Clear Points" button becomes enabled

STEP 8: GENERATE POLYGON FROM POINTS
-------------------------------------
8.1. Click "Generate Polygon" button
8.2. System Processing:
    a. Validates:
       - Selected parcel exists
       - Parcel has at least 3 points
       - Layer is selected
       - Coordinate system is selected
    b. Transforms Points to WGS84:
       - For each point in parcel:
         * Gets eastings, northings from CSV
         * Transforms: wgs84Coord = ol.proj.transform([x, y], sourceCRS, 'EPSG:4326')
         * Creates point object: {x: lon, y: lat, parcelnumber, point_number, description}
    c. Calls Polygon-Creator Edge Function:
       - URL: https://<supabase-url>/functions/v1/polygon-creator
       - Method: POST
       - Headers:
         * Content-Type: application/json
         * Authorization: Bearer <jwt_token>
         * apikey: <supabase_anon_key>
       - Body:
         {
           points: [array of WGS84 points],
           crs: 'EPSG:4326',
           validate: true,
           skipSelfIntersectionCheck: <checkbox value>
         }
    d. Edge Function Processing:
       - Validates minimum 3 points
       - Ensures polygon is closed (adds first point at end if needed)
       - Validates polygon:
         * Minimum 3 vertices
         * Maximum 1000 vertices
         * Self-intersection check (if not skipped)
         * Minimum area: 0.01 hectares
       - Calculates area in hectares (using shoelace formula)
       - Calculates edge distances (Haversine formula)
       - Returns GeoJSON polygon geometry
    e. Response Handling:
       - If success: Receives geometry, area_hectares, num_vertices, edge_distances
       - If error: Receives errors array with validation messages
8.3. Validation Options:
    - "Bypass self-intersection check" checkbox:
      * Check to skip self-intersection validation
      * Useful for complex polygons with intentional crossings
      * Still validates minimum area and vertex count
8.4. On Success:
    a. Polygon data stored in currentPolygonData:
       - geometry: GeoJSON Polygon
       - area_hectares: Calculated area
       - num_vertices: Number of vertices
       - edge_distances: Array of {distance, label, midpoint}
    b. Polygon Preview Displayed:
       - Blue outline (3px width, color: #3498db)
       - Edge distance labels along each edge
       - Area label in center: "X.XXXX ha"
       - Labels rotate to follow edge direction
    c. Preview Info Shows:
       - Area: X.XXXX hectares
       - Vertices: X
    d. Validation Results: "Polygon created successfully!"
    e. Save section becomes visible
8.5. On Error:
    - Validation errors displayed in list
    - Common errors:
      * "Polygon must have at least 3 vertices"
      * "Polygon has self-intersecting edges"
      * "Polygon area below minimum threshold (0.01 ha)"
      * "Polygon cannot have more than 1000 vertices"
    - User can fix issues and retry

STEP 9: REVIEW POLYGON PREVIEW
-------------------------------
9.1. Polygon appears on map:
    - Blue outline (no fill)
    - Edge distance labels on each edge
    - Area label in center
9.2. Verify:
    - Polygon shape is correct
    - All vertices are in right positions
    - Area value is reasonable
    - Edge distances are displayed
9.3. If incorrect:
    - Check CSV point order
    - Verify coordinate system
    - Ensure points are in correct sequence
    - Re-import CSV if needed

STEP 10: SAVE POLYGON TO DATABASE
-----------------------------------
10.1. In "Save Polygon" section:
10.2. Review Summary:
     - Unique ID: Auto-generated (e.g., "TT36N-001")
     - Layer: Selected layer name
     - Area: Calculated area in hectares
10.3. Click "Save to Database" button
10.4. System Processing:
     a. Validates:
        - Polygon data exists
        - Form data exists
        - Layer is selected
        - User is authenticated
     b. Generates Unique ID:
        - Calls Supabase RPC: generate_polygon_unique_id(layer_name)
        - Function:
          * Gets prefix based on layer (TT36N, TT36S, etc.)
          * Finds max number for that prefix
          * Increments and formats: "TT36N-001", "TT36N-002", etc.
          * Returns new unique ID
        - Fallback: Client-side generation if RPC fails
     c. Prepares Database Record:
        - unique_id: Generated ID
        - layer_name: Selected layer
        - client: From form
        - project_name: From form
        - district: From form
        - county: From form (optional)
        - block_number: From form (optional)
        - plot_number: From form (optional)
        - surveyor: From form
        - supervisor: From form
        - company: From form (optional)
        - coordinate_system: From form
        - additional_info: From form (optional)
        - csv_file_id: File ID from CSV upload
        - geometry: GeoJSON Polygon (EPSG:4326)
        - area_hectares: Calculated area
        - num_vertices: Number of vertices
        - edge_distances: Array of edge distance objects
        - created_by: Current user ID
     d. Inserts into Supabase:
        - Table: polygon_features
        - Method: supabase.from('polygon_features').insert({...}).select().single()
        - Uses PostGIS geometry column (GEOMETRY(POLYGON, 4326))
        - Row Level Security (RLS) enforces permissions
     e. Success Response:
        - Record inserted successfully
        - Returns inserted record with ID
        - Success message displayed
        - "Create Another Polygon" button enabled
10.5. Success Message Shows:
     - "✓ Polygon Saved Successfully!"
     - Unique ID
     - Layer name
     - Area in hectares
10.6. Polygon is now:
     - Stored in Supabase database
     - Available for parcel search
     - Visible in polygon_features table
     - Linked to CSV file (if uploaded)

STEP 11: CREATE ANOTHER POLYGON (OPTIONAL)
-------------------------------------------
11.1. Click "Create Another Polygon" button
11.2. System:
     - Clears plotted points from map
     - Resets polygon preview
     - Returns to "Plot Points" section
     - Resets parcel selector
     - Keeps CSV data loaded
11.3. Workflow:
     - Select different parcel from dropdown
     - Plot points
     - Generate polygon
     - Save to database
     - Repeat as needed

STEP 12: CLOSE PANEL
---------------------
12.1. Click "×" (close button) in panel header
12.2. Panel slides out to the right
12.3. Map returns to full width
12.4. All layers remain on map (points, polygon previews)

================================================================================
3. PARCEL SEARCH - STEP-BY-STEP WORKFLOW
================================================================================

STEP 1: LAUNCH PARCEL SEARCH
-----------------------------
1.1. Open webmap.html in your browser
1.2. Look for "Parcel Search" button in header toolbar
    - May be in main control bar or search section
1.3. Click "Parcel Search" button
1.4. Right-side panel slides in from the right
1.5. Panel contains search form and results area

STEP 2: CONFIGURE SEARCH CRITERIA
----------------------------------
2.1. Search Form Fields (all optional, use any combination):

    DISTRICT:
    - Dropdown list of all Uganda districts
    - Select specific district to filter results
    - Leave empty for "All Districts"
    - Exact match filter

    UNIQUE IDENTIFIER:
    - Text input field
    - Enter partial or full unique ID
    - Examples: "TT36N-001", "36N", "001"
    - Case-insensitive partial match (ILIKE)
    - Supports wildcard searching

    CLIENT NAME:
    - Text input field
    - Enter client name or partial name
    - Examples: "ABC Bank", "Ministry"
    - Case-insensitive partial match (ILIKE)

    PROJECT NAME:
    - Text input field
    - Enter project name or partial name
    - Examples: "Road Project", "Survey 2024"
    - Case-insensitive partial match (ILIKE)

    SURVEYOR NAME:
    - Text input field
    - Enter surveyor name or partial name
    - Examples: "John Doe", "Smith"
    - Case-insensitive partial match (ILIKE)

    LAYER:
    - Dropdown list of available layers
    - Options:
      * All Layers (default)
      * TITLE TRACTS UTM ZONE 36N
      * TITLE TRACTS UTM ZONE 36S
      * UNTITLED UTM ZONE 36N
      * UNTITLED UTM ZONE 36S
      * BLB-UNTITLED
    - Exact match filter

2.2. Search Strategy:
    - Use single field for broad search
    - Combine multiple fields for precise search
    - More fields = fewer, more targeted results
    - Fewer fields = more, broader results

STEP 3: EXECUTE SEARCH
----------------------
3.1. Click "Search" button
3.2. System:
    a. Collects all form field values
    b. Builds database query:
       - Base query: SELECT * FROM polygon_features WHERE is_archived = false
       - Adds filters for each filled field:
         * District: WHERE district = '<value>' (exact match)
         * Unique ID: WHERE unique_id ILIKE '%<value>%' (partial match)
         * Client: WHERE client ILIKE '%<value>%' (partial match)
         * Project: WHERE project_name ILIKE '%<value>%' (partial match)
         * Surveyor: WHERE surveyor ILIKE '%<value>%' (partial match)
         * Layer: WHERE layer_name = '<value>' (exact match)
    c. Executes query against Supabase database
    d. Retrieves matching parcels
3.3. Results Display:
    - "Searching..." spinner appears
    - Results table populates when complete
    - Shows "No parcels found" if no matches

STEP 4: REVIEW SEARCH RESULTS
-----------------------------
4.1. Results Table Columns:
    - Unique ID: Parcel identifier
    - Client: Client name
    - Project: Project name
    - District: District name
    - Area (ha): Area in hectares (4 decimal places)
    - Layer: Layer name
4.2. Table Features:
    - Sortable columns (click headers)
    - Scrollable if many results
    - Row highlighting on hover
    - Clickable rows (see Step 5)
4.3. Result Count:
    - Number of matching parcels displayed
    - Updates with each search

STEP 5: ZOOM TO PARCEL
----------------------
5.1. Click on any row in results table
5.2. System:
    a. Retrieves parcel ID and unique ID from row
    b. Fetches parcel geometry from database:
       - SELECT geometry, layer_name FROM polygon_features WHERE id = <parcel_id>
    c. Parses geometry (GeoJSON format)
    d. Transforms to map projection (Web Mercator)
    e. Calculates extent (bounding box)
    f. Zooms map to parcel extent:
       - Padding: 100 pixels on all sides
       - Max zoom: 18 (close-up view)
    g. Highlights parcel polygon:
       - Orange stroke (4px width)
       - Semi-transparent orange fill (20% opacity)
       - High z-index (2000) - appears above other layers
    h. Shows success message: "Zoomed to parcel <unique_id>"
5.3. Highlight Duration:
    - Parcel highlight visible for 5 seconds
    - Automatically removed after timeout
    - Can click another parcel to highlight it
5.4. Visual Feedback:
    - Map smoothly animates to parcel location
    - Parcel clearly highlighted in orange
    - Easy to identify on map

STEP 6: REFINE SEARCH (OPTIONAL)
---------------------------------
6.1. If results are too many or too few:
6.2. Click "Clear" button to reset form
6.3. Adjust search criteria:
    - Add more filters to narrow results
    - Remove filters to broaden results
    - Change field values
6.4. Click "Search" again
6.5. New results displayed

STEP 7: CLOSE PARCEL SEARCH
---------------------------
7.1. Click "×" (close button) in panel header
7.2. Panel slides out to the right
7.3. Map returns to full width
7.4. Parcel highlights removed (if any)

================================================================================
4. BUTTON FUNCTIONS & CALCULATIONS
================================================================================

4.1. "GSP.NET UPDATES" BUTTON
------------------------------
FUNCTION:
Opens the right-side panel for polygon import workflow.

PROCESS:
1. Toggles panel visibility
2. Slides panel in from right side
3. Shows project information form
4. Populates coordinate system dropdown
5. Populates district dropdown
6. Resets polygon import state

4.2. "CONTINUE" / "SUBMIT" BUTTON (Project Form)
-------------------------------------------------
FUNCTION:
Validates and stores project information, transitions to workflow.

PROCESS:
1. Collects all form field values
2. Validates required fields:
   - client, projectName, coordinateSystem, district, surveyor, supervisor
3. Stores in polygonImportState.formData
4. Closes project form modal
5. Opens polygon import workflow panel
6. Initializes workflow sections

4.3. "BROWSE FILES" BUTTON (CSV Import)
---------------------------------------
FUNCTION:
Opens file picker to select CSV file for import.

PROCESS:
1. Triggers hidden file input click
2. File picker dialog opens
3. User selects CSV file
4. File name displayed in UI
5. File stored for parsing

4.4. CSV FILE PARSING (parsePolygonCSV Function)
-------------------------------------------------
FUNCTION:
Parses CSV file and groups points by parcel number.

CALCULATION PROCESS:
1. Reads CSV file as text
2. Splits into lines and filters empty rows
3. Parses header row:
   - Splits by comma
   - Converts to lowercase
   - Finds column indices using flexible matching:
     * parcelnumber: ['parcelnumber', 'parcel', 'plot', 'parcel_id', 'plot_id']
     * point_number: ['point_number', 'point', 'pt', 'pointnumber', 'pt_no']
     * eastings: ['eastings', 'easting', 'x', 'e', 'east']
     * northings: ['northings', 'northing', 'y', 'n', 'north']
     * description: ['description', 'desc', 'remarks', 'note', 'comment']
4. Validates required columns exist
5. Parses data rows:
   - For each row:
     * Splits by comma
     * Extracts values by column index
     * Parses eastings/northings as numbers
     * Groups points by parcelnumber into Map
6. Sorts points within each parcel:
   - By point_number (numeric if possible)
   - Maintains order for polygon creation
7. Returns:
   - parcels: Array of {id, points[]}
   - totalPoints: Sum of all points
   - headers: Original header row

MATHEMATICAL FORMULAS:
- Column Matching: Case-insensitive substring matching
- Point Sorting: parseInt(point_number) || 0 for numeric sorting

4.5. "PLOT POINTS ON MAP" BUTTON
----------------------------------
FUNCTION:
Displays selected parcel's points on map as orange markers.

CALCULATION PROCESS:
1. Gets selected parcel from polygonImportState.selectedParcel
2. Gets coordinate system from dropdown
3. For each point in parcel:
   a. Extracts coordinates:
      - eastings = parseFloat(point.eastings)
      - northings = parseFloat(point.northings)
   b. Transforms to Web Mercator:
      - Source CRS: Selected from dropdown
      - Target CRS: EPSG:3857 (Web Mercator)
      - Transformation: coord = ol.proj.transform([easting, northing], sourceCRS, 'EPSG:3857')
   c. Creates OpenLayers Point feature:
      - Geometry: new ol.geom.Point(coord)
      - Properties: point_number, eastings, northings, description
   d. Applies style:
      - Circle: radius 6px, fill #f39c12, stroke white 2px
      - Text: point_number label, 12px font, offset -15px
4. Creates vector layer with all features
5. Calculates extent:
   - minX = min(all x coordinates)
   - maxX = max(all x coordinates)
   - minY = min(all y coordinates)
   - maxY = max(all y coordinates)
6. Zooms map to extent with 50px padding

MATHEMATICAL FORMULAS:
- Coordinate Transformation: ol.proj.transform([x, y], sourceCRS, 'EPSG:3857')
- Extent: [minX, minY, maxX, maxY]

4.6. "GENERATE POLYGON" BUTTON
--------------------------------
FUNCTION:
Calls polygon-creator edge function to create polygon from points.

CALCULATION PROCESS:
1. Validates:
   - Selected parcel exists
   - Parcel has at least 3 points
   - Layer is selected
   - Coordinate system is selected
2. Transforms Points to WGS84:
   - For each point in selectedParcel.points:
     * Gets eastings, northings
     * Transforms: wgs84Coord = ol.proj.transform([x, y], sourceCRS, 'EPSG:4326')
     * Creates point object: {x: lon, y: lat, parcelnumber, point_number, description}
3. Calls Edge Function:
   - URL: https://<supabase-url>/functions/v1/polygon-creator
   - Method: POST
   - Headers:
     * Content-Type: application/json
     * Authorization: Bearer <jwt_token>
     * apikey: <supabase_anon_key>
   - Body:
     {
       points: [array of {x, y, parcelnumber, point_number, description}],
       crs: 'EPSG:4326',
       validate: true,
       skipSelfIntersectionCheck: boolean
     }
4. Edge Function Processing (polygon-creator/index.ts):
   a. Validates Input:
      - Checks points array exists and has ≥3 points
      - Validates CRS is provided
   b. Transforms Points (if needed):
      - If CRS is not EPSG:4326, transforms using UTM conversion formulas
      - For UTM zones (EPSG:326xx/327xx):
        * Uses UTM to WGS84 conversion formulas
        * Calculates zone number from CRS code
        * Applies inverse UTM projection
      - For Arc1960 (EPSG:210xx):
        * Uses approximate conversion (simplified)
        * In production, should use proper datum transformation
   c. Creates Polygon:
      - Ensures polygon is closed (first point = last point)
      - If not closed, adds first point at end
   d. Validates Polygon:
      - Minimum 3 vertices
      - Maximum 1000 vertices
      - Self-intersection check (if not skipped):
        * Uses doSegmentsIntersect() for each edge pair
        * Checks orientation of points
        * Detects crossing edges
      - Minimum area: 0.01 hectares
   e. Calculates Area:
      - Uses shoelace formula:
        area = 0.5 * |Σ(x_i * y_{i+1} - x_{i+1} * y_i)|
      - Converts from square degrees to hectares:
        * Calculates meters per degree at average latitude
        * metersPerDegreeLat = 111320.0
        * metersPerDegreeLon = 111320.0 * cos(avgLat * π/180)
        * areaSquareMeters = area * metersPerDegreeLat * metersPerDegreeLon
        * areaHectares = areaSquareMeters / 10000
   f. Calculates Edge Distances:
      - For each edge (point i to point i+1):
        * Uses Haversine formula:
          R = 6371000 m (Earth radius)
          dLat = (lat2 - lat1) * π/180
          dLon = (lon2 - lon1) * π/180
          a = sin²(dLat/2) + cos(lat1) * cos(lat2) * sin²(dLon/2)
          c = 2 * atan2(√a, √(1-a))
          distance = R * c (in meters)
        * Calculates midpoint: [(lon1+lon2)/2, (lat1+lat2)/2]
        * Creates label: "XX.XX m"
   g. Creates GeoJSON:
      - geometry = {
          type: 'Polygon',
          coordinates: [[[lon1, lat1], [lon2, lat2], ..., [lon1, lat1]]]
        }
   h. Returns Result:
      {
        success: true,
        geometry: GeoJSON Polygon,
        area_hectares: number,
        num_vertices: number,
        edge_distances: [{distance, label, midpoint}, ...]
      }
5. Client-Side Response Handling:
   - If success: Stores data, displays preview
   - If error: Shows validation errors

MATHEMATICAL FORMULAS:
- Shoelace Formula (Area):
  area = 0.5 * |Σ(x_i * y_{i+1} - x_{i+1} * y_i)|
- Haversine Distance:
  d = 2R * atan2(√a, √(1-a))
  where a = sin²(Δlat/2) + cos(lat1) * cos(lat2) * sin²(Δlon/2)
- Area Conversion (Degrees to Hectares):
  areaHectares = (areaDegrees² * metersPerDegreeLat * metersPerDegreeLon) / 10000

4.7. POLYGON PREVIEW DISPLAY
-----------------------------
FUNCTION:
Displays created polygon on map with labels.

PROCESS:
1. Parses GeoJSON geometry from edge function response
2. Transforms to Web Mercator:
   - format.readFeatures() with dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857'
3. Creates vector layer:
   - Source: Vector source with polygon feature
   - Style function:
     a. Base style: Blue stroke (3px, #3498db), no fill
     b. Edge distance labels:
        * For each edge: Creates LineString geometry
        * Text style: distance label, placement: 'line', rotates along edge
        * Offset: -10px perpendicular to line
     c. Area label:
        * Position: Center of polygon extent
        * Text: "X.XXXX ha", bold 14px, black with white stroke
4. Adds layer to map (z-index: 1001)
5. Zooms to polygon extent

4.8. "SAVE TO DATABASE" BUTTON
-------------------------------
FUNCTION:
Saves polygon to Supabase polygon_features table.

CALCULATION PROCESS:
1. Validates:
   - currentPolygonData exists
   - polygonImportState.formData exists
   - polygonImportState.selectedLayer exists
   - User is authenticated
2. Generates Unique ID:
   - Calls Supabase RPC: generate_polygon_unique_id(layer_name)
   - Function Logic:
     a. Maps layer name to prefix:
        * 'TITLE TRACTS UTM ZONE 36N' → 'TT36N'
        * 'TITLE TRACTS UTM ZONE 36S' → 'TT36S'
        * 'UNTITLED UTM ZONE 36N' → 'UT36N'
        * 'UNTITLED UTM ZONE 36S' → 'UT36S'
        * 'BLB-UNTITLED' → 'BLB'
     b. Finds max number:
        SELECT MAX(CAST(REGEXP_REPLACE(unique_id, '^' || prefix || '-', '') AS INTEGER))
        FROM polygon_features
        WHERE unique_id LIKE prefix || '-%' AND is_archived = FALSE
     c. Increments and formats:
        newNum = maxNum + 1
        Formats with zero padding: '001', '002', ..., '999'
     d. Returns: prefix + '-' + formattedNum
   - Fallback: Client-side generation if RPC fails
3. Prepares Database Record:
   - unique_id: Generated ID
   - layer_name: Selected layer
   - client: From form
   - project_name: From form
   - district: From form
   - county: From form (optional, null if empty)
   - block_number: From form (optional, null if empty)
   - plot_number: From form (optional, null if empty)
   - surveyor: From form
   - supervisor: From form
   - company: From form (optional, null if empty)
   - coordinate_system: From form
   - additional_info: From form (optional, null if empty)
   - csv_file_id: polygonImportState.csvFileId (UUID from project_files)
   - geometry: GeoJSON Polygon from edge function (already EPSG:4326)
   - area_hectares: Calculated area from edge function
   - num_vertices: Number of vertices from edge function
   - edge_distances: Array from edge function (stored as JSONB)
   - created_by: Current user ID (from auth.getUser())
4. Inserts into Supabase:
   - Table: polygon_features
   - Method: supabase.from('polygon_features').insert({...}).select().single()
   - PostGIS automatically converts GeoJSON to GEOMETRY(POLYGON, 4326)
   - Row Level Security (RLS) validates:
     * User is authenticated
     * User can insert (policy: "Authenticated users can insert polygons")
5. Success Response:
   - Returns inserted record
   - Shows success message with details
   - Enables "Create Another Polygon" button

MATHEMATICAL FORMULAS:
- Unique ID Generation:
  newID = prefix + '-' + zeroPad(maxNum + 1, 3)
  where zeroPad(n, width) pads n to width digits with leading zeros
- PostGIS Geometry Storage:
  ST_GeomFromGeoJSON('{"type":"Polygon","coordinates":[[[lon,lat],...]]}')

4.9. "CREATE ANOTHER POLYGON" BUTTON
-------------------------------------
FUNCTION:
Resets workflow to create another polygon from same CSV.

PROCESS:
1. Clears plotted points from map:
   - Removes polygonPointsLayer
   - Removes polygonPreviewLayer
2. Resets state:
   - polygonImportState.selectedParcel = null
   - parcel selector value = ''
3. Shows plot section
4. Hides polygon and save sections
5. Keeps CSV data loaded for reuse

4.11. "PARCEL SEARCH" BUTTON
----------------------------
FUNCTION:
Opens right-side panel for parcel search functionality.

PROCESS:
1. Toggles panel visibility
2. Slides panel in from right side
3. Populates district dropdown
4. Resets search form
5. Clears previous results

4.12. "SEARCH" BUTTON (Parcel Search)
-------------------------------------
FUNCTION:
Executes database query to find matching parcels.

CALCULATION PROCESS:
1. Collects form values:
   - district, uniqueId, client, project, surveyor, layer
2. Builds Supabase Query:
   ```javascript
   let query = supabase
     .from('polygon_features')
     .select('*')
     .eq('is_archived', false);
   
   if (district) query = query.eq('district', district);
   if (uniqueId) query = query.ilike('unique_id', `%${uniqueId}%`);
   if (client) query = query.ilike('client', `%${client}%`);
   if (project) query = query.ilike('project_name', `%${project}%`);
   if (surveyor) query = query.ilike('surveyor', `%${surveyor}%`);
   if (layer) query = query.eq('layer_name', layer);
   ```
3. Executes Query:
   - Sends to Supabase database
   - Returns array of matching parcels
4. Processes Results:
   - Formats area_hectares to 4 decimal places
   - Creates table rows
   - Displays in results table
5. Error Handling:
   - Catches database errors
   - Displays error message
   - Shows "No parcels found" if empty

MATHEMATICAL FORMULAS:
- ILIKE Pattern Matching: '%value%' matches any string containing 'value'
- Area Formatting: area.toFixed(4) - rounds to 4 decimal places

4.13. PARCEL ROW CLICK (Zoom to Parcel)
----------------------------------------
FUNCTION:
Zooms map to selected parcel and highlights it.

CALCULATION PROCESS:
1. Gets parcel ID and unique ID from clicked row
2. Fetches Parcel Geometry:
   ```sql
   SELECT geometry, layer_name 
   FROM polygon_features 
   WHERE id = <parcel_id>
   ```
3. Parses Geometry:
   - GeoJSON format from database
   - Converts to OpenLayers Feature
   - Transforms to Web Mercator (EPSG:3857)
4. Calculates Extent:
   - extent = geometry.getExtent()
   - Returns: [minX, minY, maxX, maxY]
5. Zooms Map:
   - view.fit(extent, {
       padding: [100, 100, 100, 100],  // 100px padding on all sides
       maxZoom: 18                     // Maximum zoom level
     })
6. Highlights Parcel:
   - Creates temporary vector layer
   - Orange stroke (4px width, color: #f39c12)
   - Semi-transparent fill (20% opacity)
   - High z-index (2000)
   - Auto-removes after 5 seconds

MATHEMATICAL FORMULAS:
- Extent Calculation: Uses OpenLayers getExtent() method
- Map Fit: Calculates optimal zoom and center to show extent with padding

================================================================================
5. ACADEMIC QUESTIONS & ANSWERS
================================================================================

Q1: What is a Supabase Edge Function and how does polygon-creator work?
A1: Supabase Edge Functions are serverless functions that run on Deno runtime. 
    The polygon-creator function: (1) Receives point coordinates and CRS via 
    HTTP POST, (2) Transforms coordinates to WGS84 (EPSG:4326) if needed, 
    (3) Creates closed polygon from point sequence, (4) Validates geometry 
    (vertex count, self-intersection, minimum area), (5) Calculates area using 
    shoelace formula, (6) Calculates edge distances using Haversine formula, 
    (7) Returns GeoJSON polygon with metadata. Edge functions provide server-side 
    processing without managing servers - they scale automatically and handle 
    coordinate transformations and validations securely.

Q2: How does the shoelace formula calculate polygon area?
A2: The shoelace formula calculates the signed area of a polygon: 
    area = 0.5 * |Σ(x_i * y_{i+1} - x_{i+1} * y_i)|. For each vertex i, it 
    multiplies x_i by y_{i+1} and subtracts x_{i+1} * y_i, sums all these 
    products, takes absolute value, and divides by 2. The formula works for 
    any polygon (convex or concave) and handles self-intersections. For WGS84 
    coordinates (degrees), the system converts to square meters using: 
    metersPerDegreeLat = 111320.0, metersPerDegreeLon = 111320.0 * cos(lat), 
    then converts to hectares (divide by 10,000).

Q3: How does the system group CSV points by parcel number?
A3: The parsePolygonCSV function uses a Map data structure: (1) Parses CSV 
    header to find parcelnumber column index, (2) For each data row, extracts 
    parcelnumber value, (3) Uses Map.set(parcelnumber, points[]) to group 
    points, (4) If parcelnumber key doesn't exist, creates new array, 
    (5) Appends point to array for that parcel, (6) After parsing all rows, 
    converts Map to array: Array.from(parcelsMap.entries()). This ensures 
    points are grouped correctly even if CSV rows are not sorted by parcel. 
    Points within each parcel are then sorted by point_number for correct 
    polygon vertex order.

Q4: What is the purpose of the self-intersection check?
A4: Self-intersection occurs when polygon edges cross each other, creating 
    invalid geometry. The check: (1) Tests each edge against all non-adjacent 
    edges, (2) Uses orientation test (clockwise/counterclockwise) to detect 
    crossings, (3) Handles special cases (collinear points, shared vertices). 
    Self-intersecting polygons are invalid in GIS - they can cause calculation 
    errors, rendering issues, and database constraint violations. However, some 
    complex polygons (e.g., figure-8 shapes) may intentionally self-intersect, 
    so the system provides a "Bypass self-intersection check" option for 
    advanced users.

Q5: How does the unique ID generation work?
A5: Unique IDs are generated per layer using database function 
    generate_polygon_unique_id(layer_name): (1) Maps layer name to prefix 
    (TT36N, TT36S, UT36N, UT36S, BLB), (2) Queries database for maximum 
    number with that prefix using REGEXP_REPLACE to extract numeric part, 
    (3) Increments max number by 1, (4) Formats with zero padding (001, 002, 
    ..., 999), (5) Returns prefix + '-' + formatted number. Example: If 
    TT36N-042 exists, next ID is TT36N-043. This ensures sequential, 
    unique identifiers per layer without collisions. The function uses 
    PostgreSQL regex and casting for reliable number extraction.

Q6: How does the Haversine formula calculate edge distances?
A6: The Haversine formula calculates great-circle distance between two points 
    on a sphere: (1) Converts lat/lon to radians, (2) Calculates differences: 
    dLat = lat2 - lat1, dLon = lon2 - lon1, (3) Applies formula: 
    a = sin²(dLat/2) + cos(lat1) * cos(lat2) * sin²(dLon/2), 
    c = 2 * atan2(√a, √(1-a)), distance = R * c, where R = 6371000 m 
    (Earth radius). This accounts for Earth's curvature, providing accurate 
    distances for geographic coordinates. The system calculates distance for 
    each polygon edge and displays it as a label (e.g., "125.50 m") along the 
    edge midpoint.

Q7: Why are polygons stored in EPSG:4326 (WGS84) instead of the source CRS?
A7: EPSG:4326 (WGS84 Geographic) is the standard for geospatial databases 
    because: (1) Universal compatibility - all GIS systems support it, 
    (2) No projection distortion - preserves true geographic relationships, 
    (3) Database standard - PostGIS and most spatial databases use it, 
    (4) Interoperability - easy to share with other systems, (5) Future-proof 
    - works with any coordinate system transformation. The system transforms 
    from source CRS (UTM, etc.) to WGS84 on the client side before sending to 
    edge function, ensuring all polygons are stored consistently regardless of 
    input coordinate system.

Q8: What is the difference between ILIKE and exact match in parcel search?
A8: ILIKE is case-insensitive pattern matching (SQL operator), while exact 
    match uses equality (=). ILIKE with '%value%' finds any string containing 
    'value' regardless of case. For example, ILIKE '%bank%' matches "ABC 
    Bank", "BANK", "banking", etc. Exact match (=) requires exact string match. 
    The system uses ILIKE for text fields (unique_id, client, project, surveyor) 
    to allow partial searches, and exact match for enums (district, layer) where 
    specific values are expected. This provides flexible search while maintaining 
    precision for structured fields.

Q9: How does the edge distance labeling work on polygon preview?
A9: Edge distance labels: (1) Edge function calculates distance and midpoint 
    for each edge, (2) Client receives edge_distances array with {distance, 
    label, midpoint}, (3) For display, creates LineString geometry for each 
    edge, (4) Applies text style with placement: 'line' - this automatically 
    aligns text along the line, (5) Text rotates to follow edge direction, 
    (6) Offset: -10px perpendicular to edge (above the line), (7) Uses 
    maxAngle constraint to hide labels on very steep edges. The 'line' placement 
    mode in OpenLayers automatically handles rotation and positioning, making 
    labels readable regardless of edge orientation.

Q10: What is Row Level Security (RLS) and how does it protect polygon data?
A10: Row Level Security is a PostgreSQL feature that restricts row access based 
     on policies. For polygon_features: (1) SELECT policy - users can read all 
     non-archived polygons (is_archived = FALSE), (2) INSERT policy - authenticated 
     users can insert polygons, (3) UPDATE policy - users can only update their 
     own polygons (created_by = auth.uid()), (4) DELETE policy - users can only 
     archive their own polygons. This ensures: (1) Data privacy - users can't 
     see others' polygons unless archived, (2) Data integrity - users can't 
     modify others' work, (3) Audit trail - created_by tracks ownership, 
     (4) Soft deletes - is_archived preserves data. RLS is enforced at database 
     level, so it works even if application code is bypassed.

Q11: How does the system handle coordinate transformation from UTM to WGS84?
A11: The edge function uses UTM to WGS84 conversion formulas: (1) Extracts zone 
     number from CRS code (e.g., EPSG:32636 → zone 36), (2) Determines hemisphere 
     (326xx = North, 327xx = South), (3) Applies inverse UTM projection formulas:
     * Removes false easting (500000) and false northing (0 or 10000000)
     * Calculates meridian distance using series expansion
     * Applies inverse transverse Mercator formulas
     * Converts to latitude/longitude in degrees
     (4) For Arc1960 UTM, uses approximate conversion (simplified - production 
     should use proper datum transformation with shift parameters). The formulas 
     account for ellipsoid parameters (WGS84: a=6378137m, e=0.08181919) and 
     projection constants (k0=0.9996).

Q12: What is the minimum area threshold and why is it enforced?
A12: The minimum area threshold is 0.01 hectares (100 square meters). This 
     prevents: (1) Invalid polygons - very small areas may indicate data errors, 
     (2) Degenerate geometries - polygons with near-zero area are problematic, 
     (3) Performance issues - tiny polygons can cause rendering problems, 
     (4) Measurement errors - areas below threshold are likely survey errors. 
     The threshold is reasonable for land surveying - most legitimate parcels are 
     larger than 100 m². Users creating very small features (e.g., building 
     footprints) should verify their coordinate system and point accuracy.

Q13: How does the system ensure polygon vertices are in correct order?
A13: Polygon vertex order is determined by: (1) CSV point order - points are 
     processed in the order they appear in CSV, (2) Point number sorting - 
     within each parcel, points are sorted by point_number (numeric if possible), 
     (3) Edge function preserves order - polygon is created from point sequence 
     as provided, (4) Auto-closing - if first and last points don't match, first 
     point is added at end. The order matters for: (1) Polygon orientation 
     (clockwise vs counterclockwise), (2) Area calculation (shoelace formula 
     gives signed area), (3) Edge identification (edge i connects point i to 
     i+1). Users should ensure CSV points are in boundary traversal order 
     (clockwise or counterclockwise, consistently).

Q14: What happens if the edge function fails or times out?
A14: If edge function fails: (1) Error response includes errors array with 
     specific validation messages, (2) Client displays errors in validation 
     results section, (3) Polygon creation is aborted, (4) User can fix issues 
     (e.g., add more points, fix coordinates) and retry. If timeout: (1) Network 
     error occurs, (2) Error message displayed, (3) User can retry. Edge 
     functions have execution time limits (typically 10-60 seconds), so very 
     large polygons (>1000 vertices) may timeout. The system validates vertex 
     count (max 1000) to prevent timeouts. For production, consider: (1) 
     Increasing timeout limits, (2) Processing large polygons in chunks, 
     (3) Client-side validation before calling edge function.

Q15: How does the system link polygons to CSV files?
A15: CSV file linking: (1) When CSV is imported, file is uploaded to Supabase 
     Storage (bucket: 'uploads', path: 'polygon-imports/<user_id>/<timestamp>_<filename>'), 
     (2) Metadata saved to project_files table with file details, (3) File ID 
     (UUID) stored in polygonImportState.csvFileId, (4) When polygon is saved, 
     csv_file_id field stores the file ID, (5) Creates foreign key relationship: 
     polygon_features.csv_file_id → project_files.id. This enables: (1) Tracing 
     polygon source data, (2) Re-importing from same CSV, (3) Audit trail, 
     (4) Data lineage. The relationship is optional (nullable) - polygons can 
     be created without CSV import.

Q16: What is the purpose of the edge_distances field in the database?
A16: The edge_distances field stores pre-calculated edge measurements as JSONB: 
     [{distance: 125.50, label: "125.50 m", midpoint: [lon, lat]}, ...]. 
     Benefits: (1) Performance - distances calculated once during polygon creation, 
     not on every query, (2) Consistency - same distances shown in preview and 
     stored in database, (3) Labeling - midpoint coordinates used for label 
     placement, (4) Reporting - distances available for PDF exports or reports. 
     The field is optional (nullable) - older polygons may not have it. Storing 
     as JSONB allows flexible querying and indexing in PostgreSQL.

Q17: How does the system handle coordinate precision in transformations?
A17: Coordinate precision: (1) Client-side uses OpenLayers Proj4js - high 
     precision transformations with full ellipsoid parameters, (2) Edge function 
     uses JavaScript Math with double precision (64-bit floating point), 
     (3) PostGIS stores as GEOMETRY type - maintains full precision, 
     (4) Display uses appropriate decimal places (6 for lat/lon, 3 for UTM). 
     The system maintains sub-meter accuracy: (1) UTM coordinates typically 
     have 0.1m precision, (2) WGS84 lat/lon stored with 6+ decimal places 
     (0.000001° ≈ 0.11m), (3) Transformations preserve precision through 
     proper algorithms. Rounding only occurs for display, not storage.

Q18: What is the difference between the old WFS-T system and current Supabase system?
A18: Old WFS-T system: (1) Used GeoServer WFS-T protocol, (2) Required WFS-T 
     XML transactions, (3) Needed GeoServer configuration, (4) Supported editing 
     (create, modify, delete), (5) Required backend server. Current Supabase 
     system: (1) Uses Supabase Edge Functions (serverless), (2) Direct database 
     inserts via Supabase client, (3) No GeoServer required, (4) Focused on 
     polygon creation from CSV, (5) Simpler architecture - client → edge function 
     → Supabase. Benefits of current: (1) No server management, (2) Automatic 
     scaling, (3) Built-in authentication, (4) Simpler deployment, (5) Direct 
     database access. The current system is optimized for polygon import workflow, 
     not general feature editing.

Q19: How does the system validate polygon area calculation accuracy?
A19: Area calculation validation: (1) Uses shoelace formula - mathematically 
     exact for planar coordinates, (2) For WGS84 (spherical), uses approximate 
     conversion based on average latitude, (3) Conversion factor accounts for 
     latitude: metersPerDegreeLon = 111320 * cos(lat), (4) For Uganda region 
     (around equator, lat ≈ 0-2°), cos(lat) ≈ 0.999, so conversion is accurate. 
     The approximation is valid for small areas (<100 km²) - for larger areas, 
     should use PostGIS ST_Area() with proper spheroid. The system's calculation 
     is suitable for typical land parcels (hectares to square kilometers).

Q20: What is the purpose of the is_archived flag in polygon_features?
A20: The is_archived flag implements soft delete: (1) Parcels marked as archived 
     (is_archived = TRUE) are hidden from search results, (2) Data preserved in 
     database for historical records, (3) Can be restored by setting flag to FALSE, 
     (4) replaced_by_id field links to replacement polygon if updated. Benefits: 
     (1) Preserves audit trail - no data loss, (2) Maintains referential integrity 
     - foreign keys remain valid, (3) Allows versioning - track polygon updates, 
     (4) Enables rollback - restore previous versions. The search query filters 
     .eq('is_archived', false) to show only active polygons. This is better than 
     hard deletion for data governance and compliance.

================================================================================
6. BEST PRACTICES & TIPS
================================================================================

6.1. CSV FORMAT BEST PRACTICES
-------------------------------
- Use required columns: parcelnumber, point_number, eastings, northings
- Include description column for point notes (optional but recommended)
- Ensure points are in correct order (boundary traversal order)
- Use consistent parcel numbering (numeric or text, but consistent)
- Sort points by point_number within each parcel
- Verify coordinate system matches your CSV data
- Check coordinate ranges are reasonable (e.g., UTM eastings ~300000-800000)
- Use clean CSV format (no extra spaces, proper decimal separators)
- Test with small file first (1 parcel, 4-5 points) before large imports
- Ensure each parcel has at least 3 points (minimum for polygon)

6.2. PROJECT INFORMATION
------------------------
- Fill all required fields accurately (client, project, district, surveyor, supervisor)
- Use consistent naming conventions across projects
- Include block/plot numbers if available (helps with organization)
- Add additional info for context (project purpose, special notes)
- Verify coordinate system selection matches your CSV data source
- Double-check district selection (affects search and organization)

6.3. LAYER SELECTION
--------------------
- Select appropriate layer based on land tenure type:
  * TITLE TRACTS: For titled/registered land
  * UNTITLED: For untitled/customary land
  * BLB-UNTITLED: For Buganda Land Board untitled land
- Choose correct UTM zone (36N for northern Uganda, 36S for southern)
- Layer selection determines unique ID prefix (cannot be changed after creation)
- Verify layer matches your project requirements

6.4. PARCEL SELECTION AND PLOTTING
-----------------------------------
- Review parcel list before plotting (check point counts)
- Select parcel with sufficient points (minimum 3, recommend 4+)
- Verify points are in correct order (check point_number sequence)
- Plot points to verify they appear in expected location
- Check that coordinate transformation is correct (points should match survey)
- Clear points if you need to plot different parcel

6.5. POLYGON GENERATION
-----------------------
- Ensure points are plotted correctly before generating polygon
- Review point order - polygon follows point sequence
- Use "Bypass self-intersection check" only if intentional (complex shapes)
- Verify area calculation is reasonable for your parcel size
- Check edge distances are displayed correctly
- If validation fails, review error messages carefully
- Common issues: too few points, self-intersection, area too small

6.6. POLYGON VALIDATION
-----------------------
- Minimum 3 vertices required (triangle minimum)
- Maximum 1000 vertices (very large polygons may timeout)
- Minimum area: 0.01 hectares (100 m²)
- Self-intersection: Edges cannot cross (unless bypassed)
- Verify polygon shape matches expected boundary
- Check area value is reasonable for parcel type

6.7. DATABASE SAVING
--------------------
- Review polygon preview before saving (verify shape and area)
- Ensure all required form fields are filled
- Check unique ID is generated correctly
- Verify user is authenticated (signed in)
- Save immediately after successful polygon generation
- Don't close panel before saving (polygon data is in memory)

6.8. PARCEL SEARCH STRATEGIES
-----------------------------
- Start with specific criteria (unique ID or client name) for targeted search
- Use district filter to narrow results geographically
- Combine multiple filters for precise searches
- Use partial text matching (don't need exact strings)
- Clear filters and try different combinations if no results
- Click results to verify on map

6.9. COORDINATE SYSTEM SELECTION
--------------------------------
- Match CSV coordinate system to your data source
- UTM zones: Use 36N for northern Uganda, 36S for southern
- Geographic (4326): Use for GPS coordinates or global data
- Verify transformation results look correct on map
- Check that points appear in expected location
- Coordinate system is stored with polygon (for reference)

6.10. ERROR PREVENTION
----------------------
- Validate CSV format before import (check required columns)
- Verify coordinates are in correct range for selected CRS
- Ensure points are in correct order (boundary traversal)
- Test with small parcel first (4-5 points) before large polygons
- Check authentication is active (signed in)
- Review validation error messages carefully - they indicate specific issues
- Verify polygon area is reasonable (not too small or too large)

6.11. WORKFLOW EFFICIENCY
-------------------------
- Fill project information completely first time
- Import CSV once, create multiple polygons from it
- Use "Create Another Polygon" to efficiently process multiple parcels
- Keep CSV file organized (one parcel per set of points)
- Save polygons immediately after generation (don't accumulate)
- Close panel when finished to free resources

================================================================================
7. TROUBLESHOOTING
================================================================================

ISSUE: "GSP.NET UPDATES button not working"
SOLUTION:
- Check browser console for JavaScript errors
- Verify button element exists in DOM
- Try refreshing page (Ctrl+F5)
- Check that panel CSS is loaded
- Verify no conflicting event listeners

ISSUE: "CSV file not parsing or no parcels found"
SOLUTION:
- Verify CSV has required columns: parcelnumber, point_number, eastings, northings
- Check column names are spelled correctly (case-insensitive but spelling matters)
- Ensure CSV is comma-separated (not semicolon or tab)
- Verify each row has values for all required columns
- Check that parcelnumber values are not empty
- Ensure coordinates are numeric (not text with units)
- Check browser console for parsing errors

ISSUE: "Points not plotting on map"
SOLUTION:
- Verify parcel is selected from dropdown
- Check coordinate system selection matches your CSV data
- Verify coordinates are in correct range for selected CRS
- Check that points array is not empty
- Ensure coordinate transformation succeeded (check console)
- Try plotting different parcel to isolate issue

ISSUE: "Polygon generation fails with validation error"
SOLUTION:
- Check error message for specific issue:
  * "At least 3 points required" → Add more points to parcel
  * "Self-intersecting edges" → Check point order, use bypass option if intentional
  * "Area below minimum" → Verify coordinates are correct, check for unit errors
  * "More than 1000 vertices" → Simplify polygon or split into multiple
- Verify points are in correct order (boundary traversal)
- Check that coordinate transformation is correct
- Ensure no duplicate points (same coordinates)

ISSUE: "Edge function returns error or timeout"
SOLUTION:
- Check Supabase edge function is deployed and accessible
- Verify JWT token is valid (re-login if expired)
- Check network tab for HTTP errors (403, 500, timeout)
- Reduce polygon complexity (fewer vertices)
- Verify coordinates are valid (not NaN or Infinity)
- Check browser console for detailed error messages
- Ensure Supabase URL and API key are correct

ISSUE: "Polygon not saving to database"
SOLUTION:
- Verify user is authenticated (signed in)
- Check all required form fields are filled
- Verify polygon was generated successfully (preview visible)
- Check browser console for Supabase errors
- Verify unique ID was generated (check RPC function)
- Check Row Level Security policies (user must be authenticated)
- Review Supabase logs for database errors

ISSUE: "Unique ID generation fails"
SOLUTION:
- Check Supabase RPC function exists: generate_polygon_unique_id
- Verify function has proper permissions
- Check browser console for RPC errors
- System falls back to client-side generation if RPC fails
- Verify layer name matches exactly (case-sensitive)
- Check database connection

ISSUE: "Parcel search returns no results"
SOLUTION:
- Verify search criteria are correct
- Try broader search (remove some filters)
- Check spelling of text fields (case-insensitive but spelling matters)
- Verify district/layer selections are correct
- Check that parcels exist in database (try empty search)
- Verify is_archived = false (archived parcels are hidden)
- Check database connection

ISSUE: "Parcel highlight not appearing"
SOLUTION:
- Check that parcel geometry exists in database
- Verify geometry is valid GeoJSON
- Check browser console for errors
- Try clicking another parcel
- Refresh page and search again
- Verify PostGIS geometry column is properly formatted

ISSUE: "Coordinate transformation incorrect"
SOLUTION:
- Verify source coordinate system selection matches CSV data
- Check that coordinates are in correct range for CRS
- Verify Proj4js library is loaded
- Test with known coordinates to validate
- Check that transformation direction is correct (source→WGS84)
- For UTM: Verify zone number matches (36N vs 36S)

ISSUE: "Polygon area seems incorrect"
SOLUTION:
- Verify coordinate system is correct (wrong CRS = wrong area)
- Check that points are in correct order
- Ensure no duplicate or very close points
- Verify coordinates are in correct units (meters for UTM, degrees for geographic)
- For large areas, consider using PostGIS ST_Area() for more accurate calculation
- Check if area conversion factor is appropriate for your latitude

ISSUE: "Edge distances not displaying"
SOLUTION:
- Verify edge_distances array exists in polygon data
- Check that polygon preview layer is created
- Ensure edge distance labels are in style function
- Check browser console for rendering errors
- Verify LineString geometries for edges are created correctly
- Try regenerating polygon

ISSUE: "CSV file upload to Supabase fails"
SOLUTION:
- Verify user is authenticated
- Check Supabase Storage bucket 'uploads' exists
- Verify storage policies allow uploads
- Check file size limits (Supabase has limits)
- Ensure file path is valid
- Check browser console for storage errors
- Note: CSV upload failure doesn't block polygon creation (optional step)

================================================================================
END OF DOCUMENT
================================================================================

This comprehensive guide covers all aspects of GSP.NET Updates and Parcel Search 
functionality. For additional support, feature requests, or to report issues, 
refer to the system documentation or contact the development team.

The systems are designed to provide professional, QGIS-like editing capabilities 
in a web-based environment, with secure, transactional database operations and 
efficient parcel search functionality.

Last Updated: 2024
Version: 1.0


## Locate_Me_Guide.txt


LOCATE ME - Complete Workflow Guide

================================================================================
TABLE OF CONTENTS
================================================================================
1. Overview & Purpose
2. Step-by-Step Workflow
3. Button Functions & Calculations
4. Academic Questions & Answers
5. Best Practices & Tips
6. Troubleshooting

================================================================================
1. OVERVIEW & PURPOSE
================================================================================

LOCATE ME:
The Locate Me feature uses browser geolocation API to determine and display 
the user's current location on the map. It enables users to:
- Get their current GPS location
- Visualize location on map with accuracy circle
- Automatically zoom to their location
- Use location for reference or further operations

Key Features:
- Browser geolocation API integration
- Multiple accuracy attempts for best result
- Accuracy circle visualization
- Automatic zoom based on accuracy
- High accuracy mode (right-click option)
- Error handling with user-friendly messages

================================================================================
2. STEP-BY-STEP WORKFLOW
================================================================================

STEP 1: LAUNCH LOCATE ME
--------------------------
1.1. Open webmap.html in your browser
1.2. Look for "LOCATE ME" button in bottom control bar
    - Icon: location-arrow (fa-location-arrow)
    - Located with other control buttons
1.3. Click "LOCATE ME" button
1.4. Browser requests location permission (if first time)
1.5. Grant location permission when prompted

STEP 2: LOCATION REQUEST PROCESS
----------------------------------
2.1. System Processing:
    a. Checks geolocation support:
       - Verifies navigator.geolocation exists
       - Shows error if not supported
    b. Checks permissions:
       - Uses Permissions API if available
       - Checks if geolocation is granted
       - Shows error if denied
    c. Initiates geolocation request:
       - Options: enableHighAccuracy: true, timeout: 30000, maximumAge: 0
       - Starts multiple attempts (up to 3)
2.2. Toast messages appear:
    - "Requesting your precise location..."
    - "Attempting to get your location (1/3)..."
    - Updates for each attempt

STEP 3: LOCATION ACQUISITION
------------------------------
3.1. System attempts geolocation (up to 3 times):
    a. Attempt 1:
       - Calls navigator.geolocation.getCurrentPosition()
       - Gets position with accuracy
       - If accuracy ≤ 10m: Uses immediately
       - If accuracy > 10m: Tries again
    b. Attempt 2 (if needed):
       - Waits 2 seconds
       - Makes second request
       - Compares accuracy with previous
       - Keeps best position
    c. Attempt 3 (if needed):
       - Waits 2 seconds
       - Makes third request
       - Uses best position from all attempts
3.2. Best Position Selection:
    - Tracks bestPosition and bestAccuracy
    - Compares each attempt's accuracy
    - Uses position with lowest accuracy value
    - If accuracy ≤ 50m: Accepts and uses
    - If accuracy > 50m: Still uses but warns user

STEP 4: LOCATION PROCESSING
-----------------------------
4.1. System processes final location:
    a. Extracts coordinates:
       - lon = position.coords.longitude
       - lat = position.coords.latitude
       - accuracy = position.coords.accuracy (in meters)
    b. Determines accuracy message:
       - ≤ 10m: "Very High Accuracy"
       - ≤ 50m: "High Accuracy"
       - ≤ 100m: "Good Accuracy"
       - > 100m: "Accuracy: Xm - May not be precise"
    c. Transforms coordinates:
       - Source: EPSG:4326 (WGS84 Geographic)
       - Target: EPSG:3857 (Web Mercator)
       - Transformation: ol.proj.fromLonLat([lon, lat])
       - Result: [x, y] in Web Mercator

STEP 5: DISPLAY LOCATION ON MAP
---------------------------------
5.1. System displays location:
    a. Clears previous markers:
       - markerSource.clear()
    b. Creates user location marker:
       - Geometry: Point at transformed coordinate
       - Type: 'user'
       - Adds to markerSource
    c. Creates accuracy circle (if accuracy available):
       - Geometry: Circle(center, radius)
       - Center: Transformed coordinate
       - Radius: Accuracy value (in meters, converted to map units)
       - Type: 'accuracy'
       - Adds to markerSource
5.2. Visual Display:
    - Blue marker at user location
    - Accuracy circle around marker (if accuracy > 0)
    - Circle radius represents uncertainty area

STEP 6: ZOOM TO LOCATION
-------------------------
6.1. System determines zoom level:
    - If accuracy > 100m: zoomLevel = 14
    - If accuracy > 50m: zoomLevel = 15
    - Otherwise: zoomLevel = 16
6.2. Animates map:
    - Center: User location coordinate
    - Zoom: Calculated zoom level
    - Duration: 1500ms
    - Smooth animation to location
6.3. Map view updates:
    - Pans to user location
    - Zooms to appropriate level
    - Shows accuracy circle if applicable

STEP 7: SUCCESS MESSAGE
------------------------
7.1. Toast notification appears:
    - Message: "Your location has been marked on the map (Accuracy message)"
    - Type: success
    - Duration: 5000ms
7.2. Location remains visible:
    - Marker stays on map
    - Accuracy circle visible
    - Can be used for reference

STEP 8: HIGH ACCURACY MODE (OPTIONAL)
---------------------------------------
8.1. Right-click "LOCATE ME" button
8.2. System:
    - Uses watchPosition instead of getCurrentPosition
    - Continuously updates location
    - Stops when accuracy ≤ 10m achieved
    - Or stops after timeout
8.3. High accuracy mode:
    - More accurate but uses more battery
    - Updates location in real-time
    - Stops automatically when accurate enough

================================================================================
3. BUTTON FUNCTIONS & CALCULATIONS
================================================================================

3.1. "LOCATE ME" BUTTON (LEFT-CLICK)
--------------------------------------
FUNCTION:
Requests user's current location using standard geolocation.

PROCESS:
1. Validates geolocation support
2. Checks permissions
3. Calls attemptGeolocation()
4. Makes up to 3 attempts
5. Uses best position
6. Displays on map

3.2. "LOCATE ME" BUTTON (RIGHT-CLICK)
--------------------------------------
FUNCTION:
Requests high-accuracy location using watchPosition.

PROCESS:
1. Calls attemptHighAccuracyGeolocation()
2. Uses watchPosition API
3. Continuously updates until accurate
4. Stops when accuracy ≤ 10m
5. Clears watch on completion

3.3. attemptGeolocation() FUNCTION
------------------------------------
FUNCTION:
Attempts to get user location with multiple retries for best accuracy.

CALCULATION PROCESS:
1. Sets options:
   - enableHighAccuracy: true (use GPS if available)
   - timeout: 30000ms (30 seconds)
   - maximumAge: 0 (don't use cached location)
2. Initializes tracking:
   - attempts = 0
   - maxAttempts = 3
   - bestPosition = null
   - bestAccuracy = Infinity
3. tryGeolocation() function (recursive):
   a. Increments attempts counter
   b. Calls navigator.geolocation.getCurrentPosition()
   c. On success:
      - Extracts: lon, lat, accuracy
      - Updates best position if accuracy improved
      - If accuracy ≤ 10m: Uses immediately (processLocation)
      - If accuracy ≤ 50m OR attempts >= maxAttempts: Uses best position
      - Otherwise: Waits 2 seconds, tries again
   d. On error:
      - Logs error
      - If attempts < maxAttempts: Waits 3 seconds, retries
      - If attempts >= maxAttempts: Shows error message
4. Error handling:
   - PERMISSION_DENIED: "Location access denied..."
   - POSITION_UNAVAILABLE: "Location information unavailable..."
   - TIMEOUT: "Location request timed out..."
   - Default: "Unknown error occurred"

MATHEMATICAL FORMULAS:
- Accuracy Comparison: if (accuracy < bestAccuracy) then update best
- Retry Logic: attempts < maxAttempts AND accuracy > 50m

3.4. processLocation() FUNCTION
---------------------------------
FUNCTION:
Processes final location and displays on map.

CALCULATION PROCESS:
1. Extracts position data:
   - lon = position.coords.longitude
   - lat = position.coords.latitude
   - accuracy = position.coords.accuracy (meters)
2. Determines accuracy message:
   - if accuracy ≤ 10: "Very High Accuracy"
   - else if accuracy ≤ 50: "High Accuracy"
   - else if accuracy ≤ 100: "Good Accuracy"
   - else: `Accuracy: ${Math.round(accuracy)}m - May not be precise`
3. Transforms coordinates:
   - coord = ol.proj.fromLonLat([lon, lat])
   - Converts WGS84 to Web Mercator
4. Clears previous markers:
   - markerSource.clear()
5. Creates user marker:
   - Feature: Point(coord), type: 'user'
   - Adds to markerSource
6. Creates accuracy circle (if accuracy > 0):
   - Circle geometry: new ol.geom.Circle(coord, accuracy)
   - Radius: accuracy in meters (converted to map units)
   - Feature: type: 'accuracy'
   - Adds to markerSource
7. Determines zoom level:
   - if accuracy > 100: zoomLevel = 14
   - else if accuracy > 50: zoomLevel = 15
   - else: zoomLevel = 16
8. Animates map:
   - view.animate({center: coord, zoom: zoomLevel, duration: 1500})
9. Shows success toast:
   - Message: "Your location has been marked on the map" + accuracyMessage

MATHEMATICAL FORMULAS:
- Coordinate Transformation: ol.proj.fromLonLat([lon, lat])
- Accuracy Circle Radius: accuracy (in meters, OpenLayers handles conversion)
- Zoom Level: 
  zoom = 14 if accuracy > 100m
  zoom = 15 if accuracy > 50m
  zoom = 16 otherwise

3.5. attemptHighAccuracyGeolocation() FUNCTION
------------------------------------------------
FUNCTION:
Uses watchPosition for continuous high-accuracy location updates.

CALCULATION PROCESS:
1. Sets options:
   - enableHighAccuracy: true
   - timeout: 15000ms
   - maximumAge: 60000ms
2. Calls navigator.geolocation.watchPosition():
   - Returns watchId
   - Continuously updates position
3. On each position update:
   - Checks accuracy
   - If accuracy ≤ 10m: Clears watch, processes location
   - Updates best position if improved
4. On timeout:
   - Clears watch
   - Uses best position found
5. On error:
   - Clears watch
   - Shows error message

MATHEMATICAL FORMULAS:
- Watch Position: watchId = navigator.geolocation.watchPosition(success, error, options)
- Clear Watch: navigator.geolocation.clearWatch(watchId)

================================================================================
4. ACADEMIC QUESTIONS & ANSWERS
================================================================================

Q1: How does the browser geolocation API work?
A1: The Geolocation API uses multiple data sources: (1) GPS satellites - most 
    accurate (1-10m), (2) Wi-Fi networks - medium accuracy (10-50m), 
    (3) Cell towers - least accurate (100-1000m), (4) IP address - very 
    approximate (city-level). The browser combines these sources using 
    trilateration algorithms to determine position. enableHighAccuracy: true 
    requests GPS when available, but uses more battery. The API returns 
    coordinates in WGS84 (EPSG:4326) with accuracy radius in meters.

Q2: Why does the system make multiple attempts?
A2: Multiple attempts improve accuracy because: (1) First fix may be from 
    Wi-Fi/cell (less accurate), (2) GPS takes time to acquire satellites, 
    (3) Subsequent attempts may get better GPS fix, (4) System keeps best 
    position (lowest accuracy value). The algorithm: Makes up to 3 attempts, 
    tracks best accuracy, uses position with lowest accuracy value. If 
    accuracy ≤ 10m on any attempt, uses immediately. Otherwise, uses best 
    after 3 attempts or when accuracy ≤ 50m.

Q3: What is the accuracy circle and what does it represent?
A3: The accuracy circle is a visual representation of location uncertainty. 
    It's a circle centered on the user's location with radius equal to the 
    accuracy value (in meters). The circle shows the area where the user is 
    likely located - the actual position could be anywhere within the circle. 
    Smaller circle = more accurate (GPS), larger circle = less accurate 
    (Wi-Fi/cell). The circle uses OpenLayers Circle geometry with radius in 
    meters, which OpenLayers converts to map units for display.

Q4: How does the system determine zoom level based on accuracy?
A4: Zoom level is inversely related to accuracy: (1) High accuracy (≤50m) = 
    High zoom (15-16) - shows detailed view, (2) Medium accuracy (50-100m) = 
    Medium zoom (15) - shows neighborhood, (3) Low accuracy (>100m) = Low 
    zoom (14) - shows wider area. This ensures: (1) High accuracy locations 
    zoom in close (user can see exact location), (2) Low accuracy locations 
    zoom out (accuracy circle fits in view), (3) User can see context around 
    their location. The zoom level ensures the accuracy circle is visible and 
    the location is in context.

Q5: What is the difference between getCurrentPosition and watchPosition?
A5: getCurrentPosition: (1) Gets location once, (2) Returns immediately when 
    position available, (3) Lower battery usage, (4) Good for one-time 
    location. watchPosition: (1) Continuously updates location, (2) Calls 
    success callback each time position changes, (3) Higher battery usage, 
    (4) Good for tracking/movement. The system uses getCurrentPosition for 
    standard mode (3 attempts) and watchPosition for high-accuracy mode 
    (continuous until accurate). High-accuracy mode is more battery-intensive 
    but provides better accuracy for stationary users.

Q6: How does coordinate transformation work for geolocation?
A6: Browser geolocation returns coordinates in WGS84 (EPSG:4326): [longitude, 
    latitude] in degrees. The map displays in Web Mercator (EPSG:3857): [x, y] 
    in meters. Transformation: (1) Gets [lon, lat] from position.coords, 
    (2) Transforms using ol.proj.fromLonLat([lon, lat]), (3) Returns [x, y] in 
    Web Mercator. The fromLonLat function is OpenLayers shorthand for 
    ol.proj.transform([lon, lat], 'EPSG:4326', 'EPSG:3857'). This ensures 
    coordinates are in correct format for map display.

Q7: What happens if geolocation permission is denied?
A7: If permission denied: (1) System detects via Permissions API or error 
    code, (2) Shows error toast: "Location access denied. Please enable 
    location access in your browser settings and try again.", (3) No location 
    is acquired, (4) User must enable in browser settings. To fix: (1) Click 
    lock icon in browser address bar, (2) Change location permission to 
    "Allow", (3) Refresh page, (4) Try again. The system checks permissions 
    before attempting geolocation to provide helpful error messages.

Q8: Why does the system use maximumAge: 0?
A8: maximumAge: 0 means "don't use cached location". This ensures: (1) Always 
    gets fresh location, (2) No stale coordinates, (3) Best accuracy possible, 
    (4) No confusion from old cached positions. Trade-off: (1) Slower (must 
    acquire new fix), (2) More battery usage. For high-accuracy mode, 
    maximumAge: 60000 (1 minute) allows using recent cached position if 
    available, speeding up response while maintaining reasonable freshness.

Q9: How accurate is geolocation typically?
A9: Accuracy depends on source: (1) GPS: 1-10 meters (outdoors, clear sky), 
    (2) Wi-Fi: 10-50 meters (indoor/urban), (3) Cell towers: 100-1000 meters 
    (rural areas), (4) IP address: City-level only. Factors affecting 
    accuracy: (1) GPS signal strength (buildings block signals), (2) Number of 
    satellites visible, (3) Wi-Fi network density, (4) Cell tower proximity. 
    The system's multiple attempts help get best available accuracy. High 
    accuracy mode (watchPosition) can achieve GPS-level accuracy (1-10m) if 
    GPS is available and given enough time.

Q10: What is the timeout value and why is it set to 30 seconds?
A10: Timeout: 30000ms (30 seconds) is the maximum time to wait for location. 
     This ensures: (1) System doesn't wait indefinitely, (2) GPS has time to 
     acquire satellites (can take 10-30 seconds), (3) User gets feedback if 
     location unavailable, (4) Reasonable wait time. If timeout occurs: (1) 
     Error callback fires, (2) System shows "Location request timed out", 
     (3) User can retry. The 30-second timeout balances: (1) Giving GPS time 
     to work, (2) Not making user wait too long, (3) Handling slow networks 
     or weak signals.

Q11: How does the accuracy circle radius work in different map projections?
A11: The accuracy value is in meters (real-world distance). OpenLayers Circle 
     geometry: (1) Takes radius in meters, (2) Converts to map units based on 
     projection, (3) For Web Mercator: Meters vary by latitude (1m at equator 
     ≈ 1 pixel, but varies with latitude). The circle appears as accurate 
     representation of uncertainty area. At equator: 1 meter ≈ 1 pixel at 
     zoom 0. At higher latitudes: Circle may appear slightly elliptical due to 
     projection distortion, but area represents correct uncertainty.

Q12: What happens if GPS is not available?
A12: If GPS unavailable: (1) Browser falls back to Wi-Fi positioning, 
     (2) If Wi-Fi unavailable, uses cell tower triangulation, (3) If cell 
     unavailable, uses IP geolocation, (4) Accuracy degrades with each fallback. 
     The system: (1) Still gets location (may be less accurate), (2) Shows 
     accuracy value to user, (3) Warns if accuracy > 100m, (4) User can see 
     accuracy circle size. enableHighAccuracy: true requests GPS but doesn't 
     guarantee it - browser uses best available source.

Q13: Why does high-accuracy mode use watchPosition?
A13: watchPosition provides: (1) Continuous updates - location improves over 
     time as GPS acquires more satellites, (2) Real-time accuracy monitoring - 
     can stop when accuracy threshold reached, (3) Better final accuracy - 
     GPS improves with time, (4) Automatic stopping - clears watch when 
     accurate enough. Standard mode (getCurrentPosition) gets one fix and 
     stops. High-accuracy mode keeps updating until accuracy ≤ 10m or timeout, 
     ensuring best possible accuracy for users who need precision.

Q14: How does the system handle location errors?
A14: Error handling: (1) PERMISSION_DENIED - User denied access, shows 
     instructions to enable, (2) POSITION_UNAVAILABLE - Location unavailable, 
     suggests checking GPS/network, (3) TIMEOUT - Request timed out, suggests 
     retry, (4) Unknown errors - Shows generic message. The system: (1) Catches 
     errors in error callback, (2) Shows user-friendly messages, (3) Logs 
     details to console for debugging, (4) Allows user to retry. Multiple 
     attempts help - one source may fail, but another may succeed.

Q15: What is the purpose of clearing previous markers?
A15: Clearing previous markers: (1) Removes old location markers, (2) Prevents 
     multiple markers on map, (3) Shows only current location, (4) Keeps map 
     clean. If not cleared: (1) Multiple markers would accumulate, (2) User 
     wouldn't know which is current, (3) Map becomes cluttered. The system 
     clears markerSource before adding new marker, ensuring only one user 
     location marker exists at a time.

Q16: How does the zoom level calculation ensure visibility?
A16: Zoom level calculation: (1) High accuracy (≤50m) → zoom 15-16 - accuracy 
     circle is small, zoom in to see detail, (2) Medium accuracy (50-100m) → 
     zoom 15 - circle fits in view with context, (3) Low accuracy (>100m) → 
     zoom 14 - larger circle needs wider view. This ensures: (1) Accuracy circle 
     is always visible, (2) Location is in geographic context, (3) User can see 
     surrounding area, (4) Appropriate detail level for accuracy. The zoom 
     level adapts to accuracy - more accurate locations zoom in more, less 
     accurate zoom out to show uncertainty area.

Q17: What coordinate system does geolocation use?
A17: Browser geolocation always returns WGS84 (EPSG:4326): (1) Longitude: 
     -180 to +180 degrees (east/west), (2) Latitude: -90 to +90 degrees 
     (north/south), (3) Accuracy: meters (real-world distance), (4) Standard 
     GPS format. The system transforms to Web Mercator (EPSG:3857) for map 
     display because: (1) Web maps standard, (2) Better for web rendering, 
     (3) Uniform scale (approximately), (4) Compatible with tile services. 
     Coordinates are stored/used in WGS84 for accuracy, transformed only for 
     display.

Q18: How does the best position tracking work?
A18: Best position tracking: (1) Initializes bestAccuracy = Infinity, 
     (2) On each attempt, compares current accuracy with bestAccuracy, 
     (3) If current < best: Updates bestPosition and bestAccuracy, (4) After 
     all attempts, uses bestPosition. This ensures: (1) Always uses most 
     accurate fix, (2) Even if later attempts are worse, keeps best, 
     (3) Handles varying accuracy between attempts, (4) Provides best 
     possible result. The algorithm is: if (accuracy < bestAccuracy) { 
     bestPosition = position; bestAccuracy = accuracy; }

Q19: What is the difference between accuracy and precision?
A19: Accuracy: How close measured value is to true value (location correctness). 
     Precision: How consistent measurements are (repeatability). For 
     geolocation: (1) Accuracy = distance from true location (in meters), 
     (2) Lower accuracy value = more accurate, (3) GPS has high accuracy 
     (1-10m), (4) Wi-Fi has lower accuracy (10-50m). The system uses accuracy 
     (not precision) - the radius value represents how far the actual location 
     might be from the reported location. A 10m accuracy means the true 
     location is within 10 meters of the reported location.

Q20: How does the system handle location updates in high-accuracy mode?
A20: High-accuracy mode (watchPosition): (1) Calls success callback each time 
     position updates, (2) Checks accuracy on each update, (3) If accuracy ≤ 
     10m: Stops watching, processes location, (4) If accuracy > 10m: Continues 
     watching, (5) Updates best position if improved. This provides: (1) 
     Real-time accuracy improvement, (2) Automatic stopping when accurate, 
     (3) Best possible accuracy, (4) No manual intervention needed. The watch 
     continues until: (1) Accuracy threshold reached, (2) Timeout occurs, 
     (3) Error occurs, (4) User cancels. Then clearWatch() is called to stop 
     updates and save battery.

================================================================================
5. BEST PRACTICES & TIPS
================================================================================

5.1. LOCATION PERMISSIONS
--------------------------
- Grant location permission when prompted
- Check browser settings if permission denied
- Use HTTPS for geolocation (required by browsers)
- Some browsers block geolocation on HTTP

5.2. ACCURACY IMPROVEMENT
--------------------------
- Use outdoors for best GPS accuracy
- Wait for multiple attempts to complete
- Use high-accuracy mode (right-click) for critical operations
- Move to open area if accuracy is poor
- Ensure GPS is enabled on device

5.3. BATTERY CONSIDERATIONS
----------------------------
- Standard mode (left-click) uses less battery
- High-accuracy mode (right-click) uses more battery
- Use standard mode for quick location checks
- Use high-accuracy mode only when needed
- Close browser if not using location features

5.4. ERROR HANDLING
--------------------
- Check browser console for detailed errors
- Verify GPS is enabled on device
- Check internet connection (for Wi-Fi positioning)
- Try again if timeout occurs
- Move to different location if unavailable

5.5. ACCURACY INTERPRETATION
-----------------------------
- ≤ 10m: Very accurate (GPS, good for surveying)
- 10-50m: Good accuracy (GPS/Wi-Fi, good for navigation)
- 50-100m: Acceptable (Wi-Fi, good for general location)
- > 100m: Low accuracy (Cell/IP, use with caution)
- Check accuracy circle size on map

5.6. USE CASES
--------------
- Quick location check: Use standard mode
- Surveying/precision: Use high-accuracy mode
- Navigation: Standard mode is sufficient
- Field work: High-accuracy mode recommended
- Indoor use: Expect lower accuracy (Wi-Fi)

================================================================================
6. TROUBLESHOOTING
================================================================================

ISSUE: "Geolocation is not supported by your browser"
SOLUTION:
- Update browser to latest version
- Use modern browser (Chrome, Firefox, Edge, Safari)
- Check browser supports geolocation API
- Try different browser if issue persists

ISSUE: "Location access denied"
SOLUTION:
- Click lock icon in browser address bar
- Change location permission to "Allow"
- Refresh page
- Check browser privacy settings
- Ensure site is using HTTPS

ISSUE: "Location information is unavailable"
SOLUTION:
- Check GPS is enabled on device
- Move to area with better signal
- Check device location services are on
- Try again after moving to open area
- Verify internet connection (for Wi-Fi positioning)

ISSUE: "Location request timed out"
SOLUTION:
- Move to area with better GPS signal
- Wait longer (GPS can take 30+ seconds)
- Try high-accuracy mode (right-click)
- Check device GPS is functioning
- Ensure device has clear view of sky

ISSUE: "Accuracy is very poor (>100m)"
SOLUTION:
- Move outdoors for GPS signal
- Wait for GPS to acquire satellites
- Use high-accuracy mode (right-click)
- Check device GPS is enabled
- Ensure clear view of sky
- Wait for multiple attempts to complete

ISSUE: "Location marker not appearing"
SOLUTION:
- Check browser console for errors
- Verify geolocation succeeded
- Check markerSource layer is visible
- Try refreshing page
- Verify map is initialized

ISSUE: "Accuracy circle not showing"
SOLUTION:
- Check accuracy value is > 0
- Verify Circle geometry is created
- Check markerSource layer is visible
- Accuracy circle only shows if accuracy available
- Some devices don't provide accuracy

ISSUE: "Map not zooming to location"
SOLUTION:
- Check coordinate transformation succeeded
- Verify view.animate() is called
- Check browser console for errors
- Try manual zoom to test coordinate
- Verify map view is initialized

ISSUE: "High-accuracy mode not working"
SOLUTION:
- Check watchPosition is supported
- Verify GPS is enabled on device
- Ensure device has GPS capability
- Wait longer for GPS to acquire
- Check battery level (GPS uses battery)

ISSUE: "Location keeps updating/changing"
SOLUTION:
- This is normal for high-accuracy mode
- Location improves as GPS acquires satellites
- System stops when accuracy ≤ 10m
- Wait for updates to stabilize
- Can cancel by closing browser

ISSUE: "Permission prompt not appearing"
SOLUTION:
- Check if permission was already set
- Clear browser site settings
- Check browser privacy/security settings
- Try incognito/private mode
- Verify site is using HTTPS

ISSUE: "Location is in wrong place"
SOLUTION:
- Check accuracy value (may be low)
- Verify GPS is actually enabled
- Check device location services
- Try high-accuracy mode for better fix
- Wait for GPS to acquire more satellites
- Move to open area with clear sky view

ISSUE: "Multiple location markers appearing"
SOLUTION:
- System should clear previous markers
- Check markerSource.clear() is called
- Refresh page to clear all markers
- Verify only one marker is added
- Check for multiple geolocation calls

ISSUE: "Battery draining quickly"
SOLUTION:
- Use standard mode instead of high-accuracy
- Close browser when not using location
- Disable location services when done
- High-accuracy mode uses more battery
- GPS is battery-intensive feature

ISSUE: "Location works on one device but not another"
SOLUTION:
- Check device has GPS capability
- Verify location services are enabled
- Check browser version and support
- Some devices have better GPS than others
- Mobile devices typically have better GPS

ISSUE: "Accuracy not improving after multiple attempts"
SOLUTION:
- Move to area with better GPS signal
- Check device GPS hardware is working
- Try high-accuracy mode (right-click)
- Ensure clear view of sky
- Some areas have poor GPS coverage
- Indoor locations have lower accuracy


## Place_Search_Guide.txt


PLACE SEARCH - Complete Workflow Guide

================================================================================
TABLE OF CONTENTS
================================================================================
1. Overview & Purpose
2. Step-by-Step Workflow
3. Button Functions & Calculations
4. Academic Questions & Answers
5. Best Practices & Tips
6. Troubleshooting

================================================================================
1. OVERVIEW & PURPOSE
================================================================================

PLACE SEARCH:
The Place Search feature enables users to search for locations by place name 
and automatically navigate to them on the map. It enables users to:
- Search for places by name (cities, towns, villages, landmarks)
- Find locations within Uganda
- Automatically zoom to found locations
- View place names and details
- Quickly navigate to specific areas

Key Features:
- Nominatim geocoding integration (OpenStreetMap)
- Uganda-specific search (country filter)
- Automatic map navigation
- Place marker display
- Real-time search results
- Enter key support for quick search
- Error handling and timeout management

Technology:
- Uses Nominatim API (OpenStreetMap's geocoding service)
- RESTful API calls with JSON response
- Coordinate transformation (WGS84 to Web Mercator)
- OpenLayers marker display

================================================================================
2. STEP-BY-STEP WORKFLOW
================================================================================

STEP 1: LOCATE PLACE SEARCH INPUT
-----------------------------------
1.1. Open webmap.html in your browser
1.2. Look for place search input in header/search bar
    - Input field: "Search place..." placeholder
    - Search button with search icon (fa-search)
    - Located in main header/search area
1.3. Place search is always visible (no panel to open)

STEP 2: ENTER PLACE NAME
--------------------------
2.1. Click in "Search place..." input field
2.2. Type place name:
    - Examples: "Kampala", "Entebbe", "Jinja", "Gulu"
    - Can include: City names, town names, village names
    - Can include: Landmark names, district names
    - Can include: Street names, area names
2.3. Search is case-insensitive
2.4. Can use partial names (e.g., "Kam" for Kampala)
2.5. Press Enter key OR click Search button

STEP 3: SEARCH EXECUTION
--------------------------
3.1. System Processing:
    a. Validates input:
       - Checks if query is not empty
       - If empty: Shows alert, stops
    b. Constructs API request:
       - Base URL: https://nominatim.openstreetmap.org/search
       - Parameters:
         * format=json (JSON response)
         * limit=1 (return only first result)
         * countrycodes=ug (restrict to Uganda)
         * q=${encodeURIComponent(query)} (search query)
       - Example: 
         "https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=ug&q=Kampala"
    c. Makes HTTP request:
       - Method: GET
       - Headers: Accept: application/json
       - Timeout: 10 seconds (AbortSignal.timeout(10000))
    d. Waits for response
3.2. Toast notification may appear (if implemented)

STEP 4: PROCESS SEARCH RESULTS
--------------------------------
4.1. System receives JSON response
4.2. Validates response:
    a. Checks if response.ok (HTTP 200)
    b. Parses JSON data
    c. Checks if data array has results (data.length > 0)
4.3. If results found:
    a. Gets first result (data[0])
    b. Extracts coordinates:
       - lon = parseFloat(result.lon)
       - lat = parseFloat(result.lat)
    c. Validates coordinates:
       - Checks if lon and lat are finite numbers
       - If invalid: Throws error
    d. Extracts display name:
       - display_name = result.display_name
       - Full address/place name
4.4. If no results found:
    - Shows alert: "Location not found. Please try another search term."
    - Shows error toast
    - Stops processing

STEP 5: DISPLAY LOCATION ON MAP
---------------------------------
5.1. System displays location:
    a. Clears previous markers:
       - markerSource.clear()
       - Removes all existing place markers
    b. Transforms coordinates:
       - Source: WGS84 (EPSG:4326) - lon, lat
       - Target: Web Mercator (EPSG:3857) - x, y
       - Transformation: ol.proj.fromLonLat([lon, lat])
    c. Creates marker:
       - Feature with Point geometry
       - Type: 'coordinate'
       - Label: result.display_name
       - Adds to markerSource
    d. Marker appears on map:
       - Blue pin at location
       - Shows place name (if label displayed)
5.2. Visual Display:
    - Marker at found location
    - Place name visible
    - Previous markers cleared

STEP 6: ZOOM TO LOCATION
--------------------------
6.1. System animates map to location:
    a. Gets transformed coordinate (EPSG:3857)
    b. Sets target zoom: 16 (approximately 50-100m view)
    c. Animates map:
       - center: Transformed coordinate
       - zoom: 16
       - duration: 1500ms (1.5 seconds)
    d. Smooth animation to location
6.2. Map view updates:
    - Pans to found location
    - Zooms to level 16
    - Shows marker in center
    - Provides detailed view of area

STEP 7: SUCCESS NOTIFICATION
------------------------------
7.1. Toast notification appears:
    - Message: "Location found: [display_name]"
    - Type: success
    - Duration: 5000ms (5 seconds)
7.2. Example: "Location found: Kampala, Central Region, Uganda"
7.3. Location remains visible:
    - Marker stays on map
    - Can be used for reference
    - Can search again to move marker

STEP 8: SEARCH AGAIN (OPTIONAL)
---------------------------------
8.1. Enter new place name in search input
8.2. Click Search or press Enter
8.3. Previous marker is cleared
8.4. New location is found and displayed
8.5. Map animates to new location

STEP 9: ERROR HANDLING
-----------------------
9.1. If search fails:
    a. Network error:
       - Shows: "Network error. Please check your connection and try again."
       - Error toast appears
    b. Timeout (10 seconds):
       - Shows: "Search request timed out. Please try again."
       - Error toast appears
    c. Invalid response:
       - Shows: "Error during search. Please try again."
       - Error toast appears
    d. No results:
       - Shows: "Location not found. Please try another search term."
       - Error toast appears
9.2. User can retry search:
    - Check spelling
    - Try different place name
    - Check internet connection
    - Try again

================================================================================
3. BUTTON FUNCTIONS & CALCULATIONS
================================================================================

3.1. "SEARCH" BUTTON
---------------------
FUNCTION:
Executes place name search using Nominatim geocoding API.

PROCESS:
1. Gets search query from input field
2. Validates query (not empty)
3. Constructs Nominatim API URL
4. Makes HTTP GET request
5. Processes JSON response
6. Displays location on map
7. Zooms to location

3.2. placeSearchBtn CLICK EVENT
----------------------------------
FUNCTION:
Handles search button click event.

CALCULATION PROCESS:
1. Gets query:
   - query = document.getElementById('placeSearch').value
   - Gets text from input field
2. Validates query:
   - if (!query): Shows alert, returns
3. Constructs API URL:
   - Base: 'https://nominatim.openstreetmap.org/search'
   - Parameters:
     * format=json
     * limit=1
     * countrycodes=ug
     * q=${encodeURIComponent(query)}
   - Full URL: 
     `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=ug&q=${encodeURIComponent(query)}`
4. Makes fetch request:
   - Method: 'GET'
   - Headers: { 'Accept': 'application/json' }
   - Signal: AbortSignal.timeout(10000) (10 second timeout)
5. Processes response:
   - Checks response.ok
   - Parses JSON
   - Handles results or errors

MATHEMATICAL FORMULAS:
- URL Encoding: encodeURIComponent(query)
- API URL: baseURL + '?format=json&limit=1&countrycodes=ug&q=' + encodedQuery

3.3. API RESPONSE PROCESSING
------------------------------
FUNCTION:
Processes Nominatim API response and extracts location data.

CALCULATION PROCESS:
1. Validates response:
   - Checks response.ok (HTTP 200)
   - If not ok: Throws error with status
2. Parses JSON:
   - data = await response.json()
   - Returns array of results
3. Checks for results:
   - if (data && data.length > 0): Results found
   - else: No results found
4. Extracts first result:
   - result = data[0]
5. Extracts coordinates:
   - lon = parseFloat(result.lon)
   - lat = parseFloat(result.lat)
6. Validates coordinates:
   - if (!Number.isFinite(lon) || !Number.isFinite(lat)): Throws error
7. Extracts display name:
   - display_name = result.display_name
   - Full address string

MATHEMATICAL FORMULAS:
- Coordinate Parsing: lon = parseFloat(result.lon), lat = parseFloat(result.lat)
- Validation: Number.isFinite(value)

3.4. MARKER CREATION AND DISPLAY
----------------------------------
FUNCTION:
Creates map marker for found location.

CALCULATION PROCESS:
1. Clears previous markers:
   - markerSource.clear()
   - Removes all existing markers
2. Transforms coordinates:
   - Source: WGS84 (EPSG:4326) - [lon, lat]
   - Target: Web Mercator (EPSG:3857) - [x, y]
   - coordinate = ol.proj.fromLonLat([lon, lat])
3. Creates marker feature:
   - geometry: new ol.geom.Point(coordinate)
   - type: 'coordinate'
   - label: result.display_name
4. Adds to marker source:
   - markerSource.addFeature(marker)
5. Marker appears on map:
   - Styled by marker layer
   - Shows at transformed coordinate

MATHEMATICAL FORMULAS:
- Coordinate Transformation: coordinate = ol.proj.fromLonLat([lon, lat])
- Point Geometry: new ol.geom.Point(coordinate)

3.5. MAP ANIMATION TO LOCATION
-------------------------------
FUNCTION:
Animates map view to found location.

CALCULATION PROCESS:
1. Gets transformed coordinate (EPSG:3857)
2. Sets target zoom: 16
   - Approximately 50-100 meter view
   - Good detail level for place viewing
3. Animates map view:
   - view.animate({
       center: coordinate,
       zoom: 16,
       duration: 1500
     })
4. Smooth animation:
   - Duration: 1500ms (1.5 seconds)
   - Easing: Default (smooth)
   - Map pans and zooms simultaneously

MATHEMATICAL FORMULAS:
- Target Zoom: 16 (fixed, approximately 50-100m view)
- Animation Duration: 1500ms

3.6. ENTER KEY SUPPORT
-----------------------
FUNCTION:
Allows search execution by pressing Enter key.

PROCESS:
1. Listens for keypress event on input field
2. Checks if key === 'Enter'
3. If Enter: Clicks search button programmatically
4. Executes search same as button click

3.7. ERROR HANDLING
--------------------
FUNCTION:
Handles various error scenarios gracefully.

CALCULATION PROCESS:
1. Catches errors in promise chain
2. Determines error type:
   a. AbortError (timeout):
      - errorMsg = 'Search request timed out. Please try again.'
   b. Network error (Failed to fetch):
      - errorMsg = 'Network error. Please check your connection and try again.'
   c. Other errors:
      - errorMsg = 'Error during search. Please try again.'
3. Shows error:
   - alert(errorMsg)
   - showToast(errorMsg, 'error')
4. Logs error to console:
   - console.error('Error during geocoding:', error)

MATHEMATICAL FORMULAS:
- Error Detection: error.name === 'AbortError'
- Error Message: Conditional based on error type

3.8. URL ENCODING
------------------
FUNCTION:
Encodes search query for URL safety.

PROCULATION PROCESS:
1. Takes user input query
2. Encodes special characters:
   - Spaces → %20
   - Special chars → Percent encoding
   - Example: "New York" → "New%20York"
3. Uses encodeURIComponent():
   - Standard JavaScript function
   - Encodes for URL use
   - Prevents URL injection

MATHEMATICAL FORMULAS:
- URL Encoding: encodeURIComponent(query)
- Example: "Kampala City" → "Kampala%20City"

================================================================================
4. ACADEMIC QUESTIONS & ANSWERS
================================================================================

Q1: How does Nominatim geocoding work?
A1: Nominatim is OpenStreetMap's geocoding service: (1) Searches OSM database 
    for place names, (2) Returns matching locations with coordinates, 
    (3) Uses full-text search on place names, (4) Returns results ranked by 
    relevance. Process: (1) User enters place name, (2) Nominatim searches 
    OSM database, (3) Finds matches (cities, towns, landmarks), (4) Returns 
    JSON with coordinates and display name, (5) Client uses coordinates to 
    display on map. Nominatim is free, open-source, and uses crowd-sourced 
    OpenStreetMap data. The service is rate-limited (1 request per second) 
    to prevent abuse. Results are ranked by relevance - most relevant match 
    first.

Q2: Why is countrycodes=ug used in the API request?
A2: countrycodes=ug restricts search to Uganda: (1) Reduces irrelevant 
    results, (2) Improves search accuracy for Uganda locations, (3) Faster 
    response (smaller search space), (4) Prevents confusion with places in 
    other countries. Without country filter: (1) "Kampala" might return 
    Kampala in other countries, (2) More results to process, (3) Less 
    relevant results. The country code filter ensures results are relevant 
    to Uganda, which is important for a Uganda-focused mapping application. 
    ISO 3166-1 alpha-2 code "ug" represents Uganda.

Q3: How does the limit=1 parameter work?
A3: limit=1 returns only the first (most relevant) result: (1) Nominatim 
    returns results ranked by relevance, (2) First result is best match, 
    (3) limit=1 returns only that result, (4) Reduces response size and 
    processing. Benefits: (1) Faster response (less data), (2) Simpler 
    processing (no result selection needed), (3) Better UX (automatic best 
    match). Trade-off: (1) If first result is wrong, user must refine search, 
    (2) No alternative results shown. For place search, limit=1 is appropriate 
    because users typically want the most relevant match automatically. If 
    multiple results were needed, could increase limit and show result list.

Q4: How does coordinate transformation work?
A4: Coordinate transformation: (1) Nominatim returns WGS84 (EPSG:4326) 
    coordinates [lon, lat], (2) Map displays in Web Mercator (EPSG:3857) 
    [x, y], (3) Transformation converts between projections. Process: 
    (1) Gets lon, lat from Nominatim response, (2) Calls 
    ol.proj.fromLonLat([lon, lat]), (3) Returns [x, y] in Web Mercator, 
    (4) Uses transformed coordinates for map display. Web Mercator is 
    standard for web maps because: (1) Compatible with tile services, 
    (2) Uniform scale (approximately), (3) Efficient rendering. The 
    transformation is handled by OpenLayers Proj4js library, which performs 
    mathematical coordinate system conversion.

Q5: Why is zoom level 16 used?
A5: Zoom level 16 provides appropriate detail: (1) Approximately 50-100 meter 
    view, (2) Shows neighborhood/area detail, (3) Good for place viewing, 
    (4) Not too zoomed in (street level) or out (city level). Zoom levels: 
    (1) 10-12: City level, (2) 13-15: District/neighborhood, (3) 16-18: 
    Street/area detail, (4) 19+: Building level. Zoom 16 is good balance - 
    shows enough detail to identify place location while providing geographic 
    context. For cities, might want lower zoom (14-15), for villages might 
    want higher zoom (17-18), but 16 is good default for most places.

Q6: How does the timeout mechanism work?
A6: Timeout mechanism: (1) AbortSignal.timeout(10000) creates abort signal 
    that triggers after 10 seconds, (2) If request takes longer, signal 
    aborts request, (3) Promise rejects with AbortError, (4) Error handler 
    shows timeout message. Benefits: (1) Prevents hanging requests, 
    (2) Provides user feedback, (3) Allows retry. The 10-second timeout is 
    reasonable for geocoding - Nominatim typically responds in 1-3 seconds, 
    but network issues could cause delays. Timeout ensures user gets feedback 
    if service is slow or unavailable. Without timeout, request could hang 
    indefinitely, leaving user waiting.

Q7: How does error handling work?
A7: Error handling: (1) Catches errors in promise chain (.catch()), 
    (2) Determines error type, (3) Shows appropriate message, (4) Logs error 
    for debugging. Error types: (1) AbortError - Timeout, (2) Failed to 
    fetch - Network error, (3) HTTP error - Server error, (4) Invalid 
    coordinates - Data error, (5) No results - Not found. Process: 
    (1) Error caught in .catch(), (2) Checks error.name or error.message, 
    (3) Sets appropriate error message, (4) Shows alert and toast, 
    (5) Logs to console. This provides user-friendly error messages while 
    maintaining debugging information. Users see helpful messages, developers 
    see detailed errors in console.

Q8: How does the marker clearing work?
A8: Marker clearing: (1) markerSource.clear() removes all features from 
    marker source, (2) Map updates to remove markers, (3) Ensures only one 
    place marker visible. Process: (1) Before adding new marker, clears 
    previous, (2) markerSource is OpenLayers Vector source, (3) clear() 
    removes all features, (4) Map layer updates automatically. This ensures 
    clean display - only current search result is shown. Without clearing, 
    markers would accumulate, cluttering map. The clearing happens before 
    adding new marker, so there's no flicker - old marker removed, new one 
    added immediately.

Q9: How does the display_name work?
A9: display_name is full address string: (1) Nominatim returns formatted 
    address, (2) Includes: Place name, administrative levels, country, 
    (3) Example: "Kampala, Central Region, Uganda", (4) Used for marker 
    label and success message. The display_name provides context - users can 
    see full address, not just coordinates. This helps verify correct 
    location and provides geographic context. The display_name is stored 
    in marker feature as label property, which can be used for popups or 
    tooltips. The success toast shows display_name so users know what was 
    found.

Q10: How does Enter key support work?
A10: Enter key support: (1) Listens for keypress event on input field, 
     (2) Checks if key === 'Enter', (3) If Enter: Programmatically clicks 
     search button, (4) Executes search. Process: (1) 
     placeSearch.addEventListener('keypress', function(e)), (2) if (e.key === 
     'Enter'): document.getElementById('placeSearchBtn').click(), (3) Button 
     click triggers search. This improves UX - users can press Enter instead 
     of clicking button, faster workflow. The keypress event fires when key 
     is pressed, before key is released. Enter key is standard for form 
     submission, so users expect it to work. This is common pattern in web 
     applications.

Q11: How does URL encoding prevent injection?
A11: URL encoding: (1) encodeURIComponent() converts special characters to 
     percent-encoded format, (2) Prevents URL injection attacks, (3) Ensures 
     valid URL format. Examples: (1) Space → %20, (2) & → %26, (3) # → %23, 
     (4) ? → %3F. Without encoding: (1) Special characters could break URL, 
     (2) Could inject malicious parameters, (3) Could cause parsing errors. 
     encodeURIComponent() is JavaScript standard function that safely encodes 
     strings for URL use. This is essential security practice - always encode 
     user input before using in URLs. The encoding ensures user input cannot 
     manipulate API request structure.

Q12: How does the coordinate validation work?
A12: Coordinate validation: (1) Parses lon and lat as floats, 
     (2) Checks if numbers are finite (not NaN, not Infinity), 
     (3) If invalid: Throws error, prevents map errors. Process: 
     (1) lon = parseFloat(result.lon), lat = parseFloat(result.lat), 
     (2) if (!Number.isFinite(lon) || !Number.isFinite(lat)): throw error, 
     (3) Only proceeds if coordinates are valid numbers. This prevents errors 
     - if Nominatim returns invalid data, system catches it before trying to 
     display on map. Invalid coordinates would cause map errors or display 
     wrong location. The validation ensures data integrity before using 
     coordinates. Number.isFinite() checks if value is finite number (not 
     NaN, not Infinity, not -Infinity).

Q13: How does the country filter improve search?
A13: Country filter (countrycodes=ug): (1) Restricts search to Uganda, 
     (2) Reduces irrelevant results, (3) Improves accuracy, (4) Faster 
     response. Without filter: (1) "Kampala" might return Kampala in other 
     countries, (2) More results to process, (3) Less relevant results. With 
     filter: (1) Only Uganda locations returned, (2) Faster search (smaller 
     database), (3) More accurate results. This is important for Uganda-focused 
     application - users expect Uganda locations, not international results. 
     The filter uses ISO 3166-1 alpha-2 country code "ug" for Uganda. This 
     ensures search results are relevant to application's geographic scope.

Q14: How does the animation duration affect UX?
A14: Animation duration (1500ms): (1) Provides smooth transition, 
     (2) Not too fast (jarring) or slow (waiting), (3) Good balance for 
     navigation. Too fast (< 500ms): (1) Jarring, hard to follow, 
     (2) Users might miss transition. Too slow (> 3000ms): (1) Users wait 
     unnecessarily, (2) Feels sluggish. 1500ms (1.5 seconds) is good balance 
     - smooth enough to be pleasant, fast enough to feel responsive. The 
     animation uses OpenLayers view.animate() which provides smooth easing. 
     Users can see map moving to location, providing spatial context. The 
     animation helps users understand where location is relative to current 
     view.

Q15: How does Nominatim ranking work?
A15: Nominatim ranking: (1) Results ranked by relevance score, 
     (2) Factors: Name match, administrative importance, population, 
     (3) Most relevant result first, (4) limit=1 returns best match. Ranking 
     considers: (1) Exact name match (higher score), (2) Administrative level 
     (cities > towns > villages), (3) Population (larger places ranked higher), 
     (4) Name completeness. This ensures best match is returned first - 
     "Kampala" returns Kampala city, not small Kampala village. The ranking 
     algorithm is proprietary to Nominatim but generally prioritizes 
     well-known, important places. For place search with limit=1, this means 
     users get the most relevant result automatically.

Q16: How does the marker type work?
A16: Marker type ('coordinate'): (1) Stored in feature properties, 
     (2) Used for styling/identification, (3) Distinguishes from other marker 
     types. Marker types: (1) 'coordinate' - Place search results, 
     (2) 'user' - User location, (3) Other types for different features. The 
     type property allows different styling for different marker types - place 
     search markers might be styled differently than user location markers. 
     The marker layer can use style function to check type and apply 
     appropriate style. This enables visual distinction between different 
     marker types on map.

Q17: How does the label property work?
A17: Label property: (1) Stores display_name in feature, 
     (2) Can be used for popups/tooltips, (3) Provides place information. 
     Process: (1) marker.set('label', result.display_name), (2) Label stored 
     in feature properties, (3) Can be retrieved: feature.get('label'), 
     (4) Can be displayed in popup or tooltip. The label provides context 
     without cluttering map - users can see place name when hovering or 
     clicking marker. The display_name is full address, providing more 
     information than just place name. This improves UX by providing 
     additional context about found location.

Q18: How does the alert vs toast work?
A18: Alert and toast: (1) alert() - Modal dialog, blocks interaction, 
     (2) showToast() - Non-blocking notification, auto-dismisses. Usage: 
     (1) alert() for critical errors (user must acknowledge), 
     (2) showToast() for informational messages (non-intrusive). In place 
     search: (1) alert() for validation errors (empty query), 
     (2) alert() for not found (user should know), (3) showToast() for 
     success and errors (less intrusive). The combination provides both 
     blocking (alert) and non-blocking (toast) feedback. Alerts ensure user 
     sees important messages, toasts provide less intrusive notifications. 
     This balances user attention - critical messages get alerts, 
     informational messages get toasts.

Q19: How does the response.ok check work?
A19: response.ok check: (1) Checks HTTP status code, (2) true if status 
     200-299, (3) false for error statuses (400+, 500+). Process: 
     (1) After fetch, checks response.ok, (2) If false: Throws error with 
     status, (3) If true: Proceeds to parse JSON. This catches HTTP errors 
     before parsing - if server returns error (404, 500, etc.), response.ok 
     is false, error is thrown. Without check, might try to parse error 
     response as JSON, causing confusion. The check ensures only successful 
     responses are processed. Error responses might have different format, 
     so checking response.ok prevents parsing errors.

Q20: How does the JSON parsing work?
A20: JSON parsing: (1) response.json() parses response body as JSON, 
     (2) Returns JavaScript object/array, (3) Nominatim returns array of 
     results. Process: (1) After response.ok check, calls response.json(), 
     (2) Returns promise that resolves to parsed JSON, (3) Nominatim returns 
     array: [{lon, lat, display_name, ...}, ...], (4) limit=1 means array 
     has 1 element. The JSON parsing converts text response to JavaScript 
     object, enabling access to properties (lon, lat, display_name). The 
     response.json() is async (returns promise), so must await or use .then(). 
     Nominatim always returns array, even with limit=1, so code checks 
     data.length > 0 to ensure results exist. The parsing enables extraction 
     of coordinates and display name from API response.

================================================================================
5. BEST PRACTICES & TIPS
================================================================================

5.1. SEARCH QUERIES
--------------------
- Use specific place names for best results
- Try full names (e.g., "Kampala" not "Kam")
- Include district/region if place name is common
- Use English place names (Nominatim uses English)
- Try alternative spellings if not found

5.2. SEARCH ACCURACY
---------------------
- More specific queries = better results
- City names work best
- Town and village names may need district
- Landmark names may vary
- Street names work if well-known

5.3. ERROR HANDLING
--------------------
- Check internet connection if network error
- Try again if timeout occurs
- Verify place name spelling
- Try different place name if not found
- Check browser console for detailed errors

5.4. PERFORMANCE
-----------------
- Search is fast (typically 1-3 seconds)
- Timeout is 10 seconds (reasonable)
- Single result keeps response small
- Country filter improves speed
- Cached results may be faster

5.5. USER EXPERIENCE
--------------------
- Press Enter for quick search
- Search clears previous markers
- Map animates smoothly to location
- Success message confirms found location
- Error messages guide user to fix issues

5.6. SEARCH REFINEMENT
----------------------
- If wrong result: Refine search query
- Add more context (district, region)
- Try official place names
- Use alternative names if known
- Check OpenStreetMap for place names

================================================================================
6. TROUBLESHOOTING
================================================================================

ISSUE: "Search button not working"
SOLUTION:
- Check browser console for JavaScript errors
- Verify placeSearchBtn element exists
- Check event listener is attached
- Try refreshing page (Ctrl+F5)
- Verify input field has ID "placeSearch"

ISSUE: "Location not found"
SOLUTION:
- Check place name spelling
- Try more specific name (include district)
- Verify place exists in OpenStreetMap
- Try alternative place name
- Check if place is in Uganda (country filter)

ISSUE: "Network error"
SOLUTION:
- Check internet connection
- Verify Nominatim API is accessible
- Check firewall/proxy settings
- Try again after few seconds
- Check browser network tab for failed request

ISSUE: "Search request timed out"
SOLUTION:
- Check internet connection speed
- Nominatim may be slow (try again)
- Check if Nominatim service is down
- Wait and try again
- Timeout is 10 seconds (reasonable)

ISSUE: "Invalid coordinates returned"
SOLUTION:
- Check Nominatim response in browser console
- Verify API returned valid data
- Check coordinate parsing logic
- This is rare (Nominatim usually reliable)
- Report issue if persists

ISSUE: "Marker not appearing on map"
SOLUTION:
- Check markerSource is initialized
- Verify coordinate transformation succeeded
- Check marker layer is visible
- Verify feature is added to source
- Check browser console for errors

ISSUE: "Map not zooming to location"
SOLUTION:
- Check coordinate transformation
- Verify view.animate() is called
- Check zoom level is set (16)
- Verify map view is initialized
- Check browser console for errors

ISSUE: "Enter key not working"
SOLUTION:
- Check keypress event listener is attached
- Verify input field has ID "placeSearch"
- Check event listener code
- Try clicking button instead
- Check browser console for errors

ISSUE: "Previous marker not clearing"
SOLUTION:
- Check markerSource.clear() is called
- Verify markerSource is same instance
- Check markers are in same source
- Try refreshing page
- Check browser console for errors

ISSUE: "Success message not showing"
SOLUTION:
- Check showToast() function exists
- Verify toast notification system works
- Check message format
- Toast may have dismissed quickly
- Check browser console for errors

ISSUE: "Search works but wrong location"
SOLUTION:
- Nominatim may return wrong result
- Try more specific search query
- Add district/region to query
- Check if multiple places with same name
- Verify correct place in OpenStreetMap

ISSUE: "Search is slow"
SOLUTION:
- Nominatim has rate limit (1 req/sec)
- Network speed affects response time
- Try again (may be temporary)
- Check internet connection
- Nominatim typically responds in 1-3 seconds

ISSUE: "Country filter not working"
SOLUTION:
- Verify countrycodes=ug in API URL
- Check URL construction
- Nominatim should respect country filter
- Verify place is actually in Uganda
- Check API response in network tab

ISSUE: "Display name is incorrect"
SOLUTION:
- Display name comes from Nominatim
- Based on OpenStreetMap data
- May vary if OSM data is outdated
- Can report to OpenStreetMap if wrong
- Display name is informational only

ISSUE: "Multiple searches not working"
SOLUTION:
- Each search should clear previous marker
- Verify markerSource.clear() is called
- Check if multiple markers appearing
- Try refreshing page
- Check browser console for errors

ISSUE: "Animation is too fast/slow"
SOLUTION:
- Animation duration is 1500ms (fixed)
- Can be adjusted in code if needed
- Current duration is good balance
- Too fast: jarring, too slow: waiting
- 1.5 seconds is standard for map navigation

ISSUE: "Zoom level is wrong"
SOLUTION:
- Zoom level 16 is fixed (good default)
- Can be adjusted in code if needed
- 16 is good for most places
- Cities might want lower zoom
- Villages might want higher zoom

ISSUE: "API URL is malformed"
SOLUTION:
- Check URL encoding (encodeURIComponent)
- Verify special characters are encoded
- Check URL construction logic
- Verify API parameters are correct
- Check browser network tab for actual URL

ISSUE: "Response parsing fails"
SOLUTION:
- Check response is valid JSON
- Verify response.json() succeeds
- Check Nominatim response format
- Verify data array structure
- Check browser console for parsing errors

ISSUE: "Error messages not helpful"
SOLUTION:
- Error messages are generic
- Check browser console for details
- Error type determines message
- Network errors show connection message
- Timeout errors show timeout message

ISSUE: "Search input not clearing"
SOLUTION:
- Input is not cleared after search (by design)
- User can modify and search again
- Can add input.value = '' if desired
- Current behavior allows easy refinement
- User can manually clear if needed


## Print_Button_Guide.txt


PRINT BUTTON - Complete Workflow Guide

================================================================================
TABLE OF CONTENTS
================================================================================
1. Overview & Purpose
2. Step-by-Step Workflow
3. Button Functions & Calculations
4. Academic Questions & Answers
5. Best Practices & Tips
6. Troubleshooting

================================================================================
1. OVERVIEW & PURPOSE
================================================================================

PRINT BUTTON:
The Print Button provides professional map printing and PDF export 
functionality. It enables users to:
- Configure print layout with project details
- Preview map before printing
- Export maps as PDF files
- Print maps with professional formatting
- Include scale bars, north arrows, and metadata
- Generate QR codes for map references

Key Features:
- Print dialog modal with form inputs
- Live map preview panel
- Project information fields
- Scale bar generation
- North arrow display
- QR code generation
- PDF export using jsPDF
- Print window with professional layout
- Coordinate system grid options

================================================================================
2. STEP-BY-STEP WORKFLOW
================================================================================

STEP 1: LAUNCH PRINT DIALOG
-----------------------------
1.1. Open webmap.html in your browser
1.2. Navigate map to desired area for printing
1.3. Look for "PRINT" button in header toolbar
    - Icon: print (fa-print)
    - Located in main control bar
1.4. Click "PRINT" button
1.5. Print dialog modal appears (printDialogModal)
1.6. Modal contains:
    - Left panel: Form inputs (project details)
    - Right panel: Map preview
    - Bottom: Print options and buttons

STEP 2: FILL PROJECT DETAILS
------------------------------
2.1. In "Project Details" section (left panel):
2.2. Required Fields (marked with *):
    - Heading: Enter project heading/title
    - District: Enter district name
    - County: Enter county name
    - Client Name: Enter client name
    - Client Contact: Enter client contact
    - Surveyor Name: Enter surveyor name
    - Surveyor Contact: Enter surveyor contact
2.3. Optional Fields:
    - Block Number: Enter block number (if applicable)
    - Plot Number/Unique ID: Enter plot number or unique ID
    - Supervisor Name: Enter supervisor name
    - Company: Enter company name
2.4. Fill all required fields
2.5. Fields are validated before printing

STEP 3: CONFIGURE MAP PREVIEW
-------------------------------
3.1. In "Map Preview" section (right panel):
3.2. Preview map shows:
    - Current map view
    - All visible layers
    - Same center and zoom as main map
3.3. Pan preview map:
    - Click and drag to pan
    - Preview updates in real-time
    - Main map remains unchanged
3.4. Reset preview view:
    - Click "Reset View" button
    - Preview syncs back to main map view
3.5. Preview map is interactive:
    - Can pan to adjust center
    - Zoom controls available
    - Shows what will be printed

STEP 4: CONFIGURE PRINT OPTIONS
---------------------------------
4.1. In "Print Options" section (bottom):
4.2. Page Orientation:
    - Portrait: Vertical layout (default)
    - Landscape: Horizontal layout
    - Affects page size and layout
4.3. Map Scale:
    - Auto: Uses current map zoom level
    - 1:500: Very detailed (large scale)
    - 1:1000: Detailed
    - 1:2000: Medium detail
    - 1:5,000: Medium scale
    - 1:10,000: Small scale
    - 1:25,000: Smaller scale
    - 1:50,000: Very small scale
4.4. Export Format:
    - PDF: Exports as PDF file
    - Print: Opens print dialog
4.5. Coordinate System:
    - No Grid: No coordinate grid
    - WGS84 UTM Zone 36N: UTM grid overlay
    - Arc1960 UTM Zone 36N: Arc1960 grid overlay
    - WGS84 Geographic: Lat/lon grid overlay

STEP 5: PREVIEW PRINT (OPTIONAL)
---------------------------------
5.1. Click "Preview" button
5.2. System Processing:
    a. Validates form fields
    b. Collects all form data
    c. Captures map image at high resolution
    d. Generates scale bar SVG
    e. Generates QR code
    f. Creates print window
    g. Displays formatted print layout
5.3. Preview window shows:
    - Header with project details
    - Map image with scale bar
    - Bottom section with signatures
    - North arrow
    - Disclaimer
5.4. Review preview:
    - Check all information is correct
    - Verify map shows desired area
    - Check scale bar is appropriate
    - Review layout and formatting
5.5. Close preview window when done

STEP 6: EXECUTE PRINT/EXPORT
-----------------------------
6.1. Click "Print/Export" button
6.2. System Processing:
    a. Validates all required fields
    b. If validation fails: Shows alert, stops
    c. If validation passes: Proceeds
7.3. For PDF Export:
    a. Collects form data
    b. Captures map at high resolution (2x scale)
    c. Generates scale bar SVG
    d. Generates QR code
    e. Creates PDF using jsPDF
    f. Adds header section
    g. Adds map image
    h. Adds scale bar overlay
    i. Adds bottom section (signatures, north arrow)
    j. Adds disclaimer
    k. Downloads PDF file
7.4. For Print:
    a. Collects form data
    b. Captures map image
    c. Generates scale bar
    d. Generates QR code
    e. Creates print window
    f. Writes HTML with CSS
    g. Opens browser print dialog
    h. User prints from browser

STEP 7: REVIEW PRINTED/EXPORTED MAP
------------------------------------
7.1. For PDF:
    - PDF file downloads automatically
    - Open PDF to review
    - Check all elements are present
    - Verify quality and formatting
7.2. For Print:
    - Print dialog opens
    - Select printer and settings
    - Click Print
    - Review printed copy

STEP 8: CLOSE DIALOG
---------------------
8.1. Click "Cancel" or "×" (close button)
8.2. Modal closes
8.3. Map returns to normal view
8.4. Preview map is destroyed (if created)

================================================================================
3. BUTTON FUNCTIONS & CALCULATIONS
================================================================================

3.1. "PRINT" BUTTON
--------------------
FUNCTION:
Opens print dialog modal and initializes preview map.

PROCESS:
1. Gets print dialog modal element
2. Adds 'active' class to show modal
3. Checks if preview map exists:
   - If not: Initializes preview map (initializePrintPreviewMap)
   - If exists: Syncs preview with main map (syncPreviewMap)
4. Updates preview map size after delay
5. Modal becomes visible

3.2. initializePrintPreviewMap() FUNCTION
------------------------------------------
FUNCTION:
Creates a new OpenLayers map instance for print preview.

CALCULATION PROCESS:
1. Gets main map reference:
   - mainMap = window.map || map
2. Gets current map view:
   - currentView = mainMap.getView()
   - currentCenter = currentView.getCenter()
   - currentZoom = currentView.getZoom()
   - currentProjection = currentView.getProjection()
3. Clones all layers from main map:
   - Iterates through mainMap.getLayers()
   - For each layer type:
     * Tile layers: Clones source, opacity, visible
     * Vector layers: Clones source, style, opacity, visible
     * Image layers: Clones source, opacity, visible
     * Layer groups: Recursively clones all sublayers
4. Creates preview map:
   - Target: 'printMapPreview' container
   - Layers: Cloned layers array
   - View: New View with same center, zoom, projection
   - Controls: Zoom and Rotate controls
5. Stores in window.printPreviewMap
6. Updates map size after delay (ensures container is rendered)

MATHEMATICAL FORMULAS:
- Layer Cloning: Creates new layer instances with same properties
- View Cloning: center, zoom, projection copied from main map

3.3. syncPreviewMap() FUNCTION
--------------------------------
FUNCTION:
Synchronizes preview map view with main map view.

PROCESS:
1. Checks preview map exists
2. Gets main map view center and zoom
3. Sets preview map view to match:
   - previewMap.getView().setCenter(mainCenter)
   - previewMap.getView().setZoom(mainZoom)
4. Updates preview map size

3.4. "PREVIEW" BUTTON
----------------------
FUNCTION:
Generates print preview in new window.

CALCULATION PROCESS:
1. Calls generatePrintPreview(true)
2. previewOnly = true
3. Same processing as Print/Export but opens in window
4. User can review before printing

3.5. "PRINT/EXPORT" BUTTON
---------------------------
FUNCTION:
Validates form and generates print or PDF export.

CALCULATION PROCESS:
1. Validates form:
   - Calls validatePrintForm()
   - Checks all required fields are filled
   - Returns true/false
2. If validation fails:
   - Shows alert: "Please fill in all required fields"
   - Stops processing
3. If validation passes:
   - Calls generatePrintPreview(false)
   - previewOnly = false
   - Proceeds with print/export

3.6. validatePrintForm() FUNCTION
----------------------------------
FUNCTION:
Validates all required form fields are filled.

PROCESS:
1. Defines required fields:
   - ['printHeading', 'printDistrict', 'printCounty', 
      'printClientName', 'printClientContact', 
      'printSurveyorName', 'printSurveyorContact']
2. Checks each field:
   - Gets element by ID
   - Checks value exists and is not empty (trimmed)
3. Returns true if all valid, false otherwise

3.7. generatePrintPreview() FUNCTION
--------------------------------------
FUNCTION:
Generates print preview or executes print/export.

CALCULATION PROCESS:
1. Collects form data:
   - heading, district, county, block, plot
   - clientName, clientContact
   - surveyorName, surveyorContact
   - supervisorName, company
   - orientation, scale, crs, format
   - date: new Date().toLocaleDateString()
2. Captures map image:
   - Calls captureMapImage(2) - 2x scale for high resolution
   - Returns canvas data URL
3. Gets map dimensions:
   - mapSize = printPreviewMap.getSize()
   - mapWidth = mapSize[0] * 2 (high res)
   - mapHeight = mapSize[1] * 2 (high res)
   - resolution = view.getResolution()
4. Generates scale bar:
   - Calls generateScaleBar(scale, mapWidth, mapHeight, resolution)
   - Returns SVG string
5. Generates QR code:
   - Calls generateQRCode('https://webmap.geospatialnetworkug.xyz', 120)
   - Returns QR code image URL
6. Determines page size:
   - If landscape: 'A3 landscape'
   - If portrait: 'A3'
7. Checks format:
   - If PDF: Calls generatePDFFromPreviewWindow()
   - If Print: Creates print window

MATHEMATICAL FORMULAS:
- High Resolution: mapWidth = previewWidth * 2, mapHeight = previewHeight * 2
- Date Format: new Date().toLocaleDateString('en-US', {...})

3.8. captureMapImage() FUNCTION
----------------------------------
FUNCTION:
Captures map as high-resolution image canvas.

CALCULATION PROCESS:
1. Validates preview map exists
2. Gets map size:
   - mapSize = printPreviewMap.getSize()
   - Validates size > 0
3. Calculates high-resolution dimensions:
   - scale = 2 (parameter)
   - width = Math.floor(mapSize[0] * scale)
   - height = Math.floor(mapSize[1] * scale)
4. Gets current view:
   - view = printPreviewMap.getView()
   - extent = view.calculateExtent(mapSize)
   - resolution = view.getResolution()
5. Clones layers for temporary map:
   - Creates new layer instances
   - Copies source, style, opacity, visible
6. Creates temporary container:
   - Creates <div> element
   - Sets width and height
   - Positions off-screen (left: -9999px)
   - Appends to document.body
7. Creates temporary map:
   - New ol.Map instance
   - Uses cloned layers
   - Same view (center, zoom, projection)
   - No controls
   - Target: temporary container
8. Waits for render:
   - Listens for 'rendercomplete' event
   - Creates canvas element
   - Sets canvas dimensions
   - Gets 2D context
9. Renders map to canvas:
   - Uses map renderer
   - Draws all layers to canvas
   - Converts to data URL
10. Cleans up:
    - Removes temporary container
    - Destroys temporary map
11. Returns canvas data URL

MATHEMATICAL FORMULAS:
- High Resolution: width = mapSize[0] * scale, height = mapSize[1] * scale
- Canvas Data URL: canvas.toDataURL('image/png')

3.9. generateScaleBar() FUNCTION
-----------------------------------
FUNCTION:
Generates SVG scale bar based on map scale and resolution.

CALCULATION PROCESS:
1. Validates inputs:
   - If scale === 'auto' or !resolution: Returns empty string
2. Extracts scale value:
   - scaleValue = parseInt(scale.replace(/[^0-9]/g, ''))
   - Example: "1:1000" → 1000
3. Calculates target length:
   - targetLengthPixels = mapWidth * 0.25 (25% of map width)
   - targetLengthMeters = targetLengthPixels * resolution
4. Rounds to nice values:
   - If ≥ 5000m: Rounds to nearest 5000
   - If ≥ 2000m: Rounds to nearest 2000
   - If ≥ 1000m: Rounds to nearest 1000
   - If ≥ 500m: Rounds to nearest 500
   - If ≥ 200m: Rounds to nearest 200
   - If ≥ 100m: Rounds to nearest 100
   - Otherwise: Rounds to nearest 50
5. Converts back to pixels:
   - scaleBarLengthPixels = niceLength / resolution
6. Formats label:
   - If ≥ 1000m: (niceLength / 1000).toFixed() + ' km'
   - Otherwise: niceLength + ' m'
7. Calculates position:
   - x = mapWidth - scaleBarLengthPixels - 20 (right-aligned)
   - y = mapHeight - 35 (bottom-aligned)
8. Generates SVG:
   - Background rectangle (white with border)
   - Segmented bar (half black, half white)
   - Ticks at 0, middle, end
   - Labels: "0", middle value, full value
   - Returns SVG string

MATHEMATICAL FORMULAS:
- Target Length: targetLengthMeters = targetLengthPixels * resolution
- Scale Bar Length: scaleBarLengthPixels = niceLength / resolution
- Nice Rounding: Math.round(value / roundTo) * roundTo

3.10. generateQRCode() FUNCTION
--------------------------------
FUNCTION:
Generates QR code image URL using external API.

PROCESS:
1. Constructs QR code URL:
   - Base: 'https://api.qrserver.com/v1/create-qr-code/'
   - Parameters: size=${size}x${size}&data=${encodeURIComponent(text)}
   - Example: '...?size=120x120&data=https://webmap.geospatialnetworkug.xyz'
2. Returns URL string
3. QR code is generated by external service
4. URL can be used as <img src>

MATHEMATICAL FORMULAS:
- URL Encoding: encodeURIComponent(text)
- QR Code URL: baseURL + '?size=' + size + 'x' + size + '&data=' + encodedText

3.11. generatePDFFromPreviewWindow() FUNCTION
-----------------------------------------------
FUNCTION:
Generates PDF file using jsPDF library.

CALCULATION PROCESS:
1. Gets print data and assets:
   - printData, mapCanvas, qrCodeUrl, scaleBarSVG, dimensions
2. Creates jsPDF instance:
   - Orientation: landscape or portrait
   - Unit: 'mm'
   - Format: 'a3'
3. Calculates layout dimensions:
   - Page width and height in mm
   - Margins
   - Content area dimensions
4. Adds header section:
   - Heading text
   - Project information
   - QR code image
5. Adds map image:
   - Loads mapCanvas as image
   - Calculates image dimensions
   - Fits to content area
   - Adds scale bar overlay
6. Adds bottom section:
   - Surveyor information
   - Supervisor information
   - North arrow
   - Signature spaces
7. Adds disclaimer:
   - Footer text
8. Saves PDF:
   - pdf.save('map-print.pdf')
   - Downloads file

MATHEMATICAL FORMULAS:
- PDF Dimensions: A3 = 297mm × 420mm (portrait) or 420mm × 297mm (landscape)
- Image Scaling: Maintains aspect ratio, fits to content area

3.12. PRINT WINDOW GENERATION
-------------------------------
FUNCTION:
Creates HTML window for browser printing.

CALCULATION PROCESS:
1. Opens new window:
   - printWindow = window.open('', '_blank')
2. Writes HTML document:
   - DOCTYPE, html, head, body
   - CSS styles for print layout
   - @page rules for page size
3. Builds content:
   - Header section with project details
   - Map image section
   - Bottom section with signatures
   - North arrow
   - Disclaimer
4. Includes assets:
   - Map image (data URL)
   - QR code image (URL)
   - Scale bar (SVG)
   - North arrow (SVG)
5. Opens print dialog:
   - printWindow.onload: setTimeout(() => printWindow.print(), 500)
6. User prints from browser dialog

MATHEMATICAL FORMULAS:
- Page Size: @page { size: A3 landscape/portrait; margin: 12mm; }
- Print Window: window.open('', '_blank')

================================================================================
4. ACADEMIC QUESTIONS & ANSWERS
================================================================================

Q1: How does the print preview map work?
A1: The print preview map is a separate OpenLayers map instance cloned from 
    the main map. Process: (1) Gets all layers from main map, (2) Clones each 
    layer (creates new instances with same source/style), (3) Creates new map 
    in preview container, (4) Uses same view (center, zoom, projection), 
    (5) Allows independent panning. Benefits: (1) User can adjust preview 
    without affecting main map, (2) Shows exactly what will print, 
    (3) Real-time preview updates, (4) Independent interaction. The preview 
    map shares layer sources with main map, so changes to data appear in both, 
    but view (center/zoom) is independent.

Q2: How does high-resolution map capture work?
A2: High-resolution capture: (1) Creates temporary map at 2x scale 
    (width*2, height*2), (2) Uses same view (center, zoom), (3) Renders to 
    canvas at high resolution, (4) Converts to data URL. Benefits: (1) 2x 
    resolution = 4x pixels (better quality), (2) Sharper text and lines, 
    (3) Better for printing, (4) Maintains aspect ratio. The temporary map is 
    created off-screen, rendered, then destroyed. This ensures high-quality 
    output without affecting main map performance. Resolution: If preview is 
    800x600, captured image is 1600x1200 pixels.

Q3: How does scale bar calculation work?
A3: Scale bar calculation: (1) Gets map resolution (meters per pixel), 
    (2) Calculates target length (25% of map width in pixels), 
    (3) Converts to meters: targetLengthMeters = pixels * resolution, 
    (4) Rounds to nice value (100, 200, 500, 1000, etc.), (5) Converts back 
    to pixels: scaleBarPixels = niceLength / resolution, (6) Generates SVG 
    with segments and labels. The scale bar represents real-world distance on 
    the map. For example, if resolution = 1m/pixel and map width = 1000px, 
    then 250px = 250m. Rounded to 200m, scale bar shows "200 m" with length 
    = 200/resolution = 200 pixels.

Q4: How does QR code generation work?
A4: QR code generation uses external API: (1) Constructs URL to 
    api.qrserver.com, (2) Parameters: size (120x120) and data (website URL), 
    (3) API generates QR code image, (4) Returns image URL, (5) Used as 
    <img src>. The QR code contains the website URL, allowing users to scan 
    and visit the webmap. The external service generates QR code on-the-fly, 
    no client-side library needed. URL format: 
    'https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=URL'

Q5: What is the difference between PDF export and print?
A5: PDF export: (1) Generates PDF file using jsPDF, (2) Downloads file to 
    computer, (3) Can be saved, shared, edited, (4) Professional PDF format, 
    (5) No printer needed. Print: (1) Opens browser print dialog, (2) User 
    selects printer, (3) Prints directly to printer, (4) No file saved, 
    (5) Requires printer. PDF is better for: (1) Sharing files, (2) Archiving, 
    (3) Email distribution, (4) Digital workflows. Print is better for: 
    (1) Immediate physical copies, (2) Field use, (3) No file management.

Q6: How does the scale bar adapt to different map scales?
A6: Scale bar adapts by: (1) Using map resolution (meters per pixel), 
    (2) Calculating appropriate length based on map width, (3) Rounding to 
    nice values (100, 200, 500, 1000m, etc.), (4) Formatting label (meters 
    or kilometers). For 1:1000 scale: Resolution ≈ 0.25m/pixel, scale bar 
    might show 100m. For 1:50,000 scale: Resolution ≈ 12.5m/pixel, scale bar 
    might show 5km. The algorithm ensures scale bar is always readable and 
    represents meaningful distance (not too small, not too large).

Q7: How does the north arrow work?
A7: North arrow: (1) Generated as SVG using getNorthArrowSVG(), (2) Shows 
    geographic north direction, (3) Compass-style design with N marker, 
    (4) Positioned in bottom section, (5) Always points north regardless of 
    map rotation. The north arrow is static SVG - it doesn't rotate with map. 
    For rotated maps, arrow would need to account for map rotation angle, but 
    current implementation shows geographic north. The SVG includes: (1) Compass 
    circle, (2) Cardinal direction markers, (3) North arrow shape, (4) "N" 
    label.

Q8: How does form validation work?
A8: Form validation: (1) Defines array of required field IDs, (2) Iterates 
    through each field, (3) Gets element by ID, (4) Checks value exists and 
    is not empty (after trim), (5) Returns true if all valid, false otherwise. 
    Required fields: heading, district, county, clientName, clientContact, 
    surveyorName, surveyorContact. Optional fields: block, plot, 
    supervisorName, company. Validation prevents printing with incomplete 
    information, ensuring professional output with all required metadata.

Q9: How does the print layout work?
A9: Print layout uses CSS for professional formatting: (1) @page rules define 
    page size (A3) and margins (12mm), (2) Header section: Border, project 
    details, QR code, (3) Map section: Border, map image, scale bar overlay, 
    (4) Bottom section: Signatures, north arrow, (5) Disclaimer section: 
    Footer text. The layout is designed for A3 paper (297×420mm portrait or 
    420×297mm landscape). CSS ensures: (1) Proper page breaks, (2) Consistent 
    spacing, (3) Professional appearance, (4) Print-friendly colors.

Q10: How does map image quality affect print output?
A10: Map image quality: (1) Standard capture = 1x resolution (may be pixelated 
     when printed), (2) High-resolution capture = 2x resolution (4x pixels, 
     much sharper), (3) For A3 print at 300 DPI: Needs ~3500×4950 pixels, 
     (4) 2x capture provides good quality for most printers. Higher resolution 
     = better quality but larger file size. The system uses 2x scale as 
     balance between quality and performance. For very high-quality prints, 
     could increase to 3x or 4x, but 2x is sufficient for most use cases.

Q11: How does the coordinate system grid work?
A11: Coordinate system grid: (1) User selects CRS from dropdown, (2) System 
     would overlay grid lines on map, (3) Grid shows coordinate values at 
     edges, (4) Helps users read coordinates from printed map. Current 
     implementation: Grid option exists but may not be fully implemented. 
     Grid would show: (1) UTM easting/northing lines, (2) Geographic lat/lon 
     lines, (3) Coordinate labels at map edges, (4) Helps with coordinate 
     reading from printed map.

Q12: How does jsPDF generate the PDF?
A12: jsPDF PDF generation: (1) Creates jsPDF instance with page size (A3), 
     (2) Adds text using pdf.text(), (3) Adds images using pdf.addImage(), 
     (4) Calculates positions for each element, (5) Builds PDF page by page, 
     (6) Saves using pdf.save(). Process: (1) Creates PDF document, (2) Adds 
     header section (text + QR code image), (3) Adds map image (scaled to fit), 
     (4) Adds scale bar overlay, (5) Adds bottom section (text + north arrow), 
     (6) Adds disclaimer, (7) Saves file. jsPDF handles: (1) PDF format 
     generation, (2) Image embedding, (3) Text formatting, (4) Page layout, 
     (5) File download.

Q13: What is the purpose of the QR code?
A13: QR code purpose: (1) Links printed map to online version, (2) Users can 
     scan to visit webmap, (3) Provides digital access to interactive map, 
     (4) Enables sharing and collaboration. The QR code contains URL: 
     'https://webmap.geospatialnetworkug.xyz'. When scanned: (1) Opens website 
     in browser, (2) User can view interactive map, (3) Can access additional 
     features, (4) Bridges print and digital workflows. QR code is 120×120 
     pixels, positioned in header section.

Q14: How does page orientation affect layout?
A14: Page orientation: (1) Portrait: 297mm × 420mm (vertical), (2) Landscape: 
     420mm × 297mm (horizontal). Effects: (1) Map section dimensions change, 
     (2) Layout adjusts to fit orientation, (3) Text sections reposition, 
     (4) Scale bar and north arrow adjust position. Portrait: Better for 
     tall/narrow areas. Landscape: Better for wide areas. The system adjusts 
     CSS @page size and layout calculations based on orientation selection.

Q15: How does the scale selection work?
A15: Scale selection: (1) User selects from dropdown (1:500 to 1:50,000), 
     (2) If "Auto": Uses current map zoom level/resolution, (3) If specific: 
     System would adjust map zoom to match scale (not fully implemented), 
     (4) Scale bar reflects selected scale. Scale represents: 1 unit on map = 
     X units in reality. 1:1000 means 1mm on map = 1000mm (1m) in reality. 
     The scale bar shows this relationship visually. Current implementation: 
     Scale selection may not adjust map zoom, but scale bar calculation uses 
     current resolution.

Q16: How does the signature section work?
A16: Signature section: (1) Displays surveyor and supervisor information, 
     (2) Provides signature lines (blank spaces), (3) Includes date, 
     (4) Professional layout for official documents. Layout: (1) Surveyor 
     section: Name, contact, signature line, date, (2) Supervisor section: 
     Name, company, signature line, (3) North arrow in center, (4) All in 
     bordered boxes. Signature lines are blank spaces (height: 50px) with 
     borders, allowing physical signatures on printed copies. This creates 
     professional survey documents suitable for official use.

Q17: How does the disclaimer protect the organization?
A17: Disclaimer: (1) States map is provided "as is" without warranty, 
     (2) Notes data from multiple sources, (3) Disclaims liability for errors, 
     (4) Requires users to verify information independently. Legal protection: 
     (1) Limits liability, (2) Sets expectations, (3) Encourages verification, 
     (4) Standard practice for geospatial data. The disclaimer appears in 
     footer section, clearly visible but not intrusive. This protects the 
     organization while maintaining transparency about data sources and 
     accuracy.

Q18: How does the map preview stay synchronized?
A18: Preview synchronization: (1) Initial creation: Copies main map view 
     (center, zoom), (2) Manual sync: "Reset View" button calls syncPreviewMap(), 
     (3) syncPreviewMap() updates preview view to match main map, 
     (4) Preview can be panned independently. The preview map shares layer 
     sources, so data updates appear in both, but view (center/zoom) can 
     differ. User can: (1) Pan preview to adjust what prints, (2) Reset to 
     match main map, (3) Preview shows exactly what will print. This gives 
     user control over print area while maintaining connection to main map.

Q19: How does the system handle large map images?
A19: Large map images: (1) High-resolution capture creates large images 
     (1600×1200+ pixels), (2) Canvas data URLs can be large (several MB), 
     (3) PDF generation handles large images, (4) Browser memory limits may 
     apply. Considerations: (1) Large images use more memory, (2) PDF file 
     size increases, (3) Processing may be slower, (4) Some browsers have 
     canvas size limits. The system uses 2x scale as balance. For very large 
     maps, could: (1) Reduce scale factor, (2) Compress images, (3) Use 
     tiling, (4) Optimize PDF generation.

Q20: How does the print window handle page breaks?
A20: Page break handling: (1) CSS @page rules define page size, 
     (2) page-break-inside: avoid prevents breaking within sections, 
     (3) Sections (header, map, bottom) stay together, (4) Browser print 
     dialog handles pagination. The layout is designed for single-page A3 
     output. If content exceeds page: (1) Browser may scale to fit, 
     (2) Or create multiple pages, (3) CSS ensures sections don't break 
     awkwardly. For multi-page prints, layout would need adjustment, but 
     current design targets single-page A3 output.

================================================================================
5. BEST PRACTICES & TIPS
================================================================================

5.1. MAP PREPARATION
---------------------
- Navigate to desired area before opening print dialog
- Ensure all needed layers are visible
- Set appropriate zoom level
- Check map looks good at print size
- Verify no important features are cut off

5.2. FORM FILLING
------------------
- Fill all required fields completely
- Use consistent naming conventions
- Include all relevant project information
- Verify contact information is correct
- Check dates are accurate

5.3. PREVIEW USAGE
-------------------
- Always preview before printing
- Check all information is correct
- Verify map shows desired area
- Review scale bar is appropriate
- Check layout and formatting

5.4. SCALE SELECTION
---------------------
- Use "Auto" for current view scale
- Select specific scale if needed
- Consider map purpose when choosing scale
- Verify scale bar is readable
- Check scale matches map detail level

5.5. ORIENTATION SELECTION
---------------------------
- Use Portrait for tall/narrow areas
- Use Landscape for wide areas
- Consider paper size available
- Match orientation to map extent
- Preview to verify layout

5.6. PDF VS PRINT
------------------
- Use PDF for sharing and archiving
- Use Print for immediate physical copies
- PDF allows editing and annotation
- Print is faster for single copies
- PDF is better for digital workflows

5.7. QUALITY CONSIDERATIONS
----------------------------
- High-resolution capture provides better quality
- Check PDF file size (may be large)
- Verify images are sharp in preview
- Test print on sample paper first
- Adjust zoom if needed for clarity

5.8. COORDINATE SYSTEM
-----------------------
- Select appropriate CRS for grid
- "No Grid" for simple maps
- UTM grid for surveying maps
- Geographic grid for GPS coordinates
- Grid helps with coordinate reading

================================================================================
6. TROUBLESHOOTING
================================================================================

ISSUE: "Print button not working"
SOLUTION:
- Check browser console for JavaScript errors
- Verify print dialog modal exists in DOM
- Try refreshing page (Ctrl+F5)
- Check that modal CSS is loaded
- Verify no conflicting event listeners

ISSUE: "Preview map not showing"
SOLUTION:
- Wait for preview map to initialize (200ms delay)
- Check printMapPreview container exists
- Verify main map is initialized
- Check browser console for map errors
- Try clicking "Reset View" button

ISSUE: "Form validation fails"
SOLUTION:
- Check all required fields are filled
- Verify no fields are just spaces
- Check field values are not empty
- Review required fields list
- Fill missing fields and try again

ISSUE: "Map image not capturing"
SOLUTION:
- Check preview map is rendered
- Verify canvas creation succeeded
- Check browser console for errors
- Ensure map has finished rendering
- Try waiting longer before capture

ISSUE: "PDF export fails"
SOLUTION:
- Check jsPDF library is loaded
- Verify browser supports PDF generation
- Check file size limits
- Try smaller map area
- Check browser console for errors

ISSUE: "Scale bar not appearing"
SOLUTION:
- Verify scale is not "Auto" or resolution is available
- Check scale bar SVG generation succeeded
- Verify map dimensions are > 0
- Check scale bar is positioned correctly
- Review generateScaleBar() function

ISSUE: "QR code not loading"
SOLUTION:
- Check internet connection (external API)
- Verify QR code URL is accessible
- Check api.qrserver.com is reachable
- Try refreshing page
- QR code may load slowly

ISSUE: "Print layout looks wrong"
SOLUTION:
- Check page orientation matches selection
- Verify CSS is loaded correctly
- Check browser print settings
- Try different browser
- Review @page CSS rules

ISSUE: "Map image is pixelated"
SOLUTION:
- System uses 2x resolution capture
- For higher quality, could increase scale factor
- Check printer resolution settings
- Verify image is not being scaled down
- High-resolution capture should be sharp

ISSUE: "Preview map out of sync"
SOLUTION:
- Click "Reset View" to sync
- Preview can be panned independently
- Sync happens on button click
- Main map and preview are independent
- This is by design (allows adjustment)

ISSUE: "PDF file is too large"
SOLUTION:
- Large maps create large PDFs
- Reduce map area if possible
- High-resolution images increase file size
- Consider reducing scale factor
- PDF compression may help

ISSUE: "Print dialog not opening"
SOLUTION:
- Check pop-up blocker settings
- Verify window.open() is allowed
- Try different browser
- Check browser console for errors
- Ensure print window is not blocked

ISSUE: "North arrow not displaying"
SOLUTION:
- Verify getNorthArrowSVG() returns SVG
- Check SVG is inserted in HTML
- Verify north arrow container exists
- Check browser supports SVG
- Review SVG generation code

ISSUE: "Signature lines not showing"
SOLUTION:
- Check CSS for signature-space class
- Verify HTML structure is correct
- Check border styles are applied
- Signature lines are blank spaces
- Should appear as bordered boxes

ISSUE: "Map preview is blank"
SOLUTION:
- Check layers are visible
- Verify layer sources are accessible
- Check preview map has same layers as main
- Try resetting preview view
- Ensure map has finished loading

ISSUE: "Coordinates in wrong format"
SOLUTION:
- Check coordinate system selection
- Verify transformation is correct
- Coordinates are in WGS84 for storage
- Display format depends on CRS
- Review coordinate formatting code

ISSUE: "Print quality is poor"
SOLUTION:
- Check printer settings (DPI)
- Verify high-resolution capture succeeded
- Use PDF export for better quality
- Check image is not being compressed
- Ensure 2x scale factor is applied

ISSUE: "Page breaks in wrong places"
SOLUTION:
- Check @page CSS rules
- Verify page-break-inside: avoid
- A3 size should fit on one page
- Browser may scale to fit
- Adjust content if too large

ISSUE: "Date format is incorrect"
SOLUTION:
- Date uses toLocaleDateString()
- Format depends on browser locale
- Can customize date format if needed
- Check date generation code
- Verify date is current

ISSUE: "QR code links to wrong URL"
SOLUTION:
- Check generateQRCode() function
- Verify URL is correct
- QR code contains website URL
- Should link to webmap.geospatialnetworkug.xyz
- Test QR code by scanning

ISSUE: "Preview takes too long to load"
SOLUTION:
- Preview map initialization takes time
- Large number of layers slows down
- Wait for rendercomplete event
- Check browser performance
- Reduce number of visible layers if needed

ISSUE: "Cannot pan preview map"
SOLUTION:
- Verify preview map has controls
- Check map is fully initialized
- Try clicking on preview area
- Preview should be interactive
- Check OpenLayers controls are added


## Quality_Flags_Guide.txt


QUALITY FLAGS - Complete Workflow Guide

================================================================================
TABLE OF CONTENTS
================================================================================
1. Overview & Purpose
2. Step-by-Step Workflow
3. Button Functions & Calculations
4. Academic Questions & Answers
5. Best Practices & Tips
6. Troubleshooting

================================================================================
1. OVERVIEW & PURPOSE
================================================================================

QUALITY FLAGS:
The Quality Flags feature enables users to report and track data quality 
issues for parcels. It enables users to:
- Flag parcels with quality issues (red/yellow/green)
- Search and view existing flags
- Update flag status
- Add comments to flags
- Track flag history
- View statistics by flag type
- Export flag data

Key Features:
- Flag creation with location selection
- Flag type classification (red/yellow/green)
- District-based filtering
- Flag history tracking
- Comment system
- Statistics dashboard
- Map visualization
- Supabase database integration

Flag Types:
- RED: Bad/Untrusted Data - Critical issues, data should not be used
- YELLOW: Needs Review - Potential issues, requires verification
- GREEN: Verified/Trusted Data - Data has been verified and is trustworthy

================================================================================
2. STEP-BY-STEP WORKFLOW
================================================================================

STEP 1: OPEN QUALITY FLAGS PANEL
----------------------------------
1.1. Open webmap.html in your browser
1.2. Look for "QUALITY FLAGS" button in header toolbar
    - Icon: flag-checkered (fa-flag-checkered)
    - Located in main control bar
    - May show unread badge (red circle with number)
1.3. Click "QUALITY FLAGS" button
1.4. Quality Flags dock/panel slides in from right side
1.5. Panel has two tabs:
    - "Flag Parcel" tab: Create new flags
    - "Check Flags" tab: Search and view existing flags

STEP 2: CREATE NEW FLAG (FLAG PARCEL TAB)
-------------------------------------------
2.1. Ensure "Flag Parcel" tab is active (default)
2.2. Select Parcel Type:
    - Titled: Has block/plot numbers
    - Untitled: No block/plot numbers
2.3. Fill Location Information:
    - District: Select from dropdown (required)
    - County: Enter county name (optional)
    - Block: Enter block number (if titled)
    - Plot: Enter plot number (if titled)
2.4. Select Location on Map:
    - Click "Select Location on Map" button
    - Map enters selection mode
    - Click on map at parcel location
    - Temporary pin appears at selected location
    - Coordinates displayed: "Lat: X, Lng: Y"
    - Click "Cancel Selection" to cancel
2.5. Select Flag Type:
    - Red: Bad/Untrusted Data
    - Yellow: Needs Review
    - Green: Verified/Trusted Data
2.6. Fill Reporter Information:
    - Reporter Name: Enter your name (required)
    - Reporter Contact: Enter phone or email (required)
    - Validates: Phone (+256XXXXXXXXX) or email format
2.7. Enter Reason:
    - Reason: Describe the quality issue (required)
    - Minimum 10 characters
    - Maximum 1000 characters
    - Character counter shows remaining
2.8. Submit Flag:
    - Click "Submit Flag" button
    - System validates all fields
    - Checks for duplicate flags (same coordinates)
    - Creates flag in database
    - Adds flag marker to map
    - Shows success message
    - Resets form

STEP 3: SEARCH FLAGS (CHECK FLAGS TAB)
----------------------------------------
3.1. Click "Check Flags" tab
3.2. Set Search Filters:
    - District: Select district (optional)
    - County: Enter county name (optional, partial match)
    - Flag Type: Select type (optional: All, Red, Yellow, Green)
    - Date From: Select start date (optional)
    - Date To: Select end date (optional)
3.3. Click "Search Flags" button
3.4. System Processing:
    a. Validates filters
    b. Queries Supabase:
       - Table: parcel_flags
       - Applies filters
       - Orders by created_at (newest first)
       - Pagination: 20 flags per page
    c. Displays results:
       - Flags list with details
       - Statistics (red/yellow/green counts)
       - Flags plotted on map
3.5. Results Display:
    - Flag items show:
      * Flag type indicator (colored circle)
      * Location (district, county, block, plot)
      * Reason (truncated to 100 chars)
      * Date created
    - Statistics show:
      * Red flags count
      * Yellow flags count
      * Green flags count
    - Map shows:
      * Flag markers at locations
      * Color-coded by type (red/yellow/green)

STEP 4: VIEW FLAG DETAILS
---------------------------
4.1. Click on flag item in list
4.2. Flag detail view opens
4.3. Shows Flag Information:
    - Flag type (with indicator)
    - Location (district, county, block, plot)
    - Coordinates (lat, lng)
    - Reporter name and contact
    - Reason (full text)
    - Created date
    - Status (active/resolved)
4.4. Shows Flag History:
    - List of all status changes
    - Who changed it
    - When changed
    - Reason for change
    - Old type → New type
4.5. Shows Comments:
    - List of all comments
    - Commenter name and date
    - Comment text
4.6. Map zooms to flag location:
    - Centers on flag coordinates
    - Zooms to level 15 (if current zoom < 15)
    - Highlights flag marker

STEP 5: ADD COMMENT TO FLAG
-----------------------------
5.1. In flag detail view, scroll to "Add Comment" section
5.2. Fill comment form:
    - Your Name: Enter name (required)
    - Contact: Enter phone or email (optional)
    - Comment: Enter comment text (required)
    - Maximum 1000 characters
5.3. Click "Add Comment" button
5.4. System Processing:
    a. Validates comment
    b. Inserts into Supabase:
       - Table: flag_comments
       - Links to flag_id
       - Stores commenter info
    c. Reloads flag detail (shows new comment)
5.5. Comment appears in comments list

STEP 6: CHANGE FLAG TYPE
--------------------------
6.1. In flag detail view, scroll to "Change Flag Type" section
6.2. Select new flag type:
    - Red: Bad/Untrusted Data
    - Yellow: Needs Review
    - Green: Verified/Trusted Data
6.3. Fill changer information:
    - Your Name: Enter name (required)
    - Contact: Enter phone or email (required)
    - Reason for Change: Enter reason (required)
    - Maximum 1000 characters
6.4. Click "Update Flag Type" button
6.5. System Processing:
    a. Validates form
    b. Gets current flag type
    c. Updates flag:
       - Sets current_flag_type to new type
       - Updates updated_at timestamp
    d. Creates history entry:
       - Table: flag_history
       - Stores old type, new type
       - Stores changer info and reason
    e. Updates map marker color
    f. Reloads flag detail
6.6. Flag type changes, history updated

STEP 7: LOAD MORE FLAGS
-------------------------
7.1. Scroll to bottom of flags list
7.2. If more flags available, "Load More" button appears
7.3. Click "Load More" button
7.4. System Processing:
    a. Increments page number
    b. Queries next page (20 flags)
    c. Appends to existing list
    d. Plots new flags on map
7.5. More flags appear in list

STEP 8: EXPORT FLAGS
---------------------
8.1. In "Check Flags" tab, after search
8.2. Click "Export" button (if available)
8.3. System Processing:
    a. Collects all filtered flags
    b. Formats as CSV
    c. Downloads file
8.4. CSV file contains:
    - Flag ID
    - Type
    - Location (district, county, block, plot)
    - Coordinates
    - Reporter info
    - Reason
    - Created date
    - Status

STEP 9: CLOSE PANEL
--------------------
9.1. Click "×" (close) button in panel header
9.2. Or click "QUALITY FLAGS" button again
9.3. Panel slides out
9.4. Map markers remain visible
9.5. Panel state saved to localStorage

================================================================================
3. BUTTON FUNCTIONS & CALCULATIONS
================================================================================

3.1. "QUALITY FLAGS" BUTTON
-----------------------------
FUNCTION:
Opens/closes quality flags panel.

PROCESS:
1. Gets quality flags dock element
2. Toggles aria-hidden attribute
3. Updates qualityFlagsState.isPanelOpen
4. If opening:
   - Loads panel state from localStorage
   - Marks flags as viewed (updates badge)
   - Switches to saved tab (if any)
5. If closing:
   - Saves panel state to localStorage
   - Panel slides out

3.2. "Select Location on Map" BUTTON
---------------------------------------
FUNCTION:
Enables map click to select parcel location.

CALCULATION PROCESS:
1. Calls enableMapSelectionMode()
2. Sets mapSelectionMode = true
3. Adds 'map-selection-mode' class to map
4. Shows "Cancel Selection" button
5. Adds click listener to map:
   a. Gets click coordinate (EPSG:3857)
   b. Converts to lon/lat (EPSG:4326):
      - lonLat = ol.proj.toLonLat(coordinate)
      - lat = lonLat[1]
      - lng = lonLat[0]
   c. Stores in qualityFlagsState.selectedLocation:
      - lat, lng, coordinate
   d. Removes previous temporary pin (if any)
   e. Creates temporary pin:
      - Feature with Point geometry
      - flag_type: 'yellow' (default)
      - is_temp: true
      - Adds to qualityFlagsSource
   f. Updates UI:
      - Shows selectedLocationInfo
      - Displays coordinates
   g. Disables selection mode
6. User clicks on map to select location

MATHEMATICAL FORMULAS:
- Coordinate Conversion: lonLat = ol.proj.toLonLat(coordinate)
- Latitude: lat = lonLat[1]
- Longitude: lng = lonLat[0]

3.3. "Submit Flag" BUTTON
---------------------------
FUNCTION:
Validates form and creates flag in database.

CALCULATION PROCESS:
1. Validates form:
   - Calls validateFlagForm()
   - Returns true/false
2. If validation fails: Shows error, stops
3. If validation passes:
   a. Collects form data:
      - parcelType: 'titled' or 'untitled'
      - district: Selected district
      - county: Entered county (trimmed)
      - block: Entered block (if titled, trimmed)
      - plot: Entered plot (if titled, trimmed)
      - is_untitled: true if untitled
      - flag_type: Selected type (red/yellow/green)
      - reporter_name: Entered name (trimmed)
      - reporter_contact: Entered contact (trimmed)
      - reason: Entered reason (trimmed)
      - lat: qualityFlagsState.selectedLocation.lat
      - lng: qualityFlagsState.selectedLocation.lng
   b. Checks for duplicates:
      - Queries existing flags for district
      - For each flag, extracts coordinates
      - Calculates distance: sqrt((lat1-lat2)² + (lng1-lng2)²)
      - If distance < 0.0001: Duplicate found
      - Shows warning if duplicate
   c. Creates flag:
      - Calls createFlag(flagData)
      - Inserts into Supabase parcel_flags table
   d. On success:
      - Removes temporary pin
      - Creates permanent marker on map
      - Resets form
      - Shows success message
      - Updates notification badge

MATHEMATICAL FORMULAS:
- Duplicate Check: distance = sqrt((lat1-lat2)² + (lng1-lng2)²)
- Duplicate Threshold: distance < 0.0001 (very close coordinates)

3.4. createFlag() FUNCTION
----------------------------
FUNCTION:
Creates flag in Supabase database.

CALCULATION PROCESS:
1. Formats coordinates:
   - pointString = `(${lng},${lat})`
   - PostGIS POINT format
2. Prepares insert data:
   - coordinates: pointString
   - district, block, plot, county
   - is_untitled: boolean
   - flag_type: red/yellow/green
   - current_flag_type: Same as flag_type (initial)
   - reporter_name, reporter_contact, reason
   - created_by: Current user ID (if authenticated)
3. Tries direct insert:
   - supabase.from('parcel_flags').insert([insertData])
4. If direct insert fails (POINT format issue):
   - Tries RPC function: insert_parcel_flag()
   - Passes parameters: p_lng, p_lat, p_district, etc.
   - RPC handles POINT creation server-side
5. Returns created flag data

3.5. "Search Flags" BUTTON
---------------------------
FUNCTION:
Searches flags based on filters.

CALCULATION PROCESS:
1. Collects filters:
   - district: Selected district (or null)
   - county: Entered county (trimmed, or null)
   - flag_type: Selected type (or null)
   - dateFrom: Selected start date (or null)
   - dateTo: Selected end date + 'T23:59:59' (or null)
2. Calls getFlags(filters, page=1, pageSize=20)
3. getFlags() function:
   a. Builds Supabase query:
      - .from('parcel_flags')
      - .select('*', {count: 'exact'})
      - .order('created_at', {ascending: false})
   b. Applies filters:
      - .eq('district', district) if district
      - .ilike('county', `%${county}%`) if county (partial match)
      - .eq('current_flag_type', flag_type) if flag_type
      - .gte('created_at', dateFrom) if dateFrom
      - .lte('created_at', dateTo) if dateTo
   c. Applies pagination:
      - from = (page - 1) * pageSize
      - to = from + pageSize - 1
      - .range(from, to)
   d. Executes query
   e. Returns: {data: flags[], count: total, hasMore: boolean}
4. Processes results:
   a. Stores flags in qualityFlagsState.flags
   b. Clears existing map markers
   c. Plots flags on map:
      - For each flag, extracts coordinates
      - Converts to map projection
      - Creates feature with Point geometry
      - Sets flag_type for styling
      - Adds to qualityFlagsSource
   d. Calculates statistics:
      - red: Count of flags with current_flag_type === 'red'
      - yellow: Count with 'yellow'
      - green: Count with 'green'
   e. Displays flags list
   f. Shows statistics
   g. Shows export button (if flags found)

MATHEMATICAL FORMULAS:
- Pagination: from = (page - 1) * pageSize, to = from + pageSize - 1
- Statistics: count = flags.filter(f => f.current_flag_type === type).length

3.6. getFlags() FUNCTION
--------------------------
FUNCTION:
Queries flags from Supabase with filters and pagination.

CALCULATION PROCESS:
1. Builds base query:
   - supabase.from('parcel_flags')
   - .select('*', {count: 'exact'})
   - .order('created_at', {ascending: false})
2. Applies filters:
   - if filters.district: .eq('district', filters.district)
   - if filters.county: .ilike('county', `%${filters.county}%`)
   - if filters.flag_type: .eq('current_flag_type', filters.flag_type)
   - if filters.dateFrom: .gte('created_at', filters.dateFrom)
   - if filters.dateTo: .lte('created_at', filters.dateTo + 'T23:59:59')
3. Applies pagination:
   - from = (page - 1) * pageSize
   - to = from + pageSize - 1
   - .range(from, to)
4. Executes query:
   - Returns {data, error, count}
5. Returns result:
   - {data: data || [], count: count || 0, hasMore: data.length === pageSize}

MATHEMATICAL FORMULAS:
- Pagination Range: from = (page - 1) * pageSize, to = from + pageSize - 1
- Has More: hasMore = (data.length === pageSize)

3.7. showFlagDetail() FUNCTION
--------------------------------
FUNCTION:
Displays detailed view of flag with history and comments.

CALCULATION PROCESS:
1. Sets selectedFlagId
2. Hides list section, shows detail section
3. Calls getFlagById(flagId):
   a. Queries flag:
      - supabase.from('parcel_flags').select('*').eq('id', id).single()
   b. Queries history:
      - supabase.from('flag_history').select('*').eq('flag_id', id)
        .order('changed_at', {ascending: false})
   c. Queries comments:
      - supabase.from('flag_comments').select('*').eq('flag_id', id)
        .order('created_at', {ascending: false})
   d. Returns: {flag, history, comments}
4. Extracts coordinates:
   - Parses POINT string: coordinates.match(/\(([^,]+),([^)]+)\)/)
   - lng = parseFloat(coords[1])
   - lat = parseFloat(coords[2])
5. Zooms map to flag:
   - coordinate = ol.proj.fromLonLat([lng, lat])
   - map.getView().setCenter(coordinate)
   - map.getView().setZoom(Math.max(currentZoom, 15))
6. Builds HTML:
   - Flag information section
   - Flag history section (if any)
   - Comments section
   - Add comment form
   - Change flag type form
7. Renders HTML in detail view
8. Attaches event listeners:
   - submitCommentBtn → submitComment()
   - submitChangeBtn → submitFlagTypeChange()

MATHEMATICAL FORMULAS:
- Coordinate Parsing: coords = coordinates.match(/\(([^,]+),([^)]+)\)/)
- Longitude: lng = parseFloat(coords[1])
- Latitude: lat = parseFloat(coords[2])
- Zoom: zoom = Math.max(currentZoom, 15)

3.8. submitComment() FUNCTION
-------------------------------
FUNCTION:
Adds comment to flag.

CALCULATION PROCESS:
1. Collects form data:
   - name: commenterName.value.trim()
   - contact: commenterContact.value.trim()
   - comment: commentText.value.trim()
2. Validates:
   - name and comment required
   - comment.length <= 1000
3. Calls addComment(flagId, {name, contact, comment}):
   a. Inserts into Supabase:
      - Table: flag_comments
      - flag_id: flagId
      - commenter_name: name
      - commenter_contact: contact (or null)
      - comment: comment
      - created_by: Current user ID (if authenticated)
   b. Returns inserted comment
4. On success:
   - Shows success message
   - Clears form
   - Reloads flag detail (showFlagDetail)

3.9. submitFlagTypeChange() FUNCTION
--------------------------------------
FUNCTION:
Changes flag type and creates history entry.

CALCULATION PROCESS:
1. Collects form data:
   - newType: newFlagType.value
   - changerName: changerName.value.trim()
   - changerContact: changerContact.value.trim()
   - reason: changeReason.value.trim()
2. Validates:
   - All fields required
   - reason.length <= 1000
3. Calls updateFlagType(flagId, newType, changerInfo, reason):
   a. Gets current flag:
      - Queries current_flag_type
   b. Updates flag:
      - Sets current_flag_type = newType
      - Updates updated_at = NOW()
   c. Creates history entry:
      - Table: flag_history
      - flag_id: flagId
      - changed_by_name: changerName
      - changed_by_contact: changerContact
      - change_reason: reason
      - old_flag_type: Previous type
      - new_flag_type: newType
   d. Returns updated flag
4. On success:
   - Updates map marker color
   - Reloads flag detail
   - Shows success message

3.10. validateFlagForm() FUNCTION
------------------------------------
FUNCTION:
Validates flag creation form.

PROCESS:
1. Gets form values:
   - district, flagType, reporterName, reporterContact, reason
   - parcelType: 'titled' or 'untitled'
2. Validates:
   - district: Required
   - selectedLocation: Required (must select on map)
   - flagType: Required
   - reporterName: Required
   - reporterContact: Required, must be valid phone or email
   - reason: Required, length 10-1000 characters
   - If titled: block or plot required
3. Returns true if all valid, false otherwise

3.11. validateContact() FUNCTION
---------------------------------
FUNCTION:
Validates contact (phone or email).

CALCULATION PROCESS:
1. Validates phone:
   - Pattern: /^(\+?256|0)?[0-9]{9}$/
   - Uganda phone format: +256XXXXXXXXX, 256XXXXXXXXX, or 0XXXXXXXXX
   - Removes spaces before validation
2. Validates email:
   - Pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
3. Returns true if phone OR email valid

MATHEMATICAL FORMULAS:
- Phone Regex: /^(\+?256|0)?[0-9]{9}$/
- Email Regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/

3.12. updateNotificationBadge() FUNCTION
--------------------------------------------
FUNCTION:
Updates unread flag count badge.

CALCULATION PROCESS:
1. Gets current user ID
2. Queries user_flag_views:
   - Gets last_viewed_at timestamp
3. Queries parcel_flags:
   - Count flags created after last_viewed_at
4. Updates badge:
   - Sets badge text to count
   - Shows/hides badge based on count > 0

================================================================================
4. ACADEMIC QUESTIONS & ANSWERS
================================================================================

Q1: How does the quality flag system work?
A1: Quality flags track data quality issues for parcels: (1) Users report 
    issues by creating flags, (2) Flags stored in Supabase with location, 
    type, reporter info, reason, (3) Flags visualized on map with color-coded 
    markers, (4) Flags can be searched, viewed, updated, commented on, 
    (5) Flag history tracks all changes. Flag types: (1) RED - Bad/Untrusted 
    Data (critical issues), (2) YELLOW - Needs Review (potential issues), 
    (3) GREEN - Verified/Trusted Data (verified). This creates collaborative 
    quality control - users can report issues, and administrators can track 
    and resolve them. The system provides transparency and accountability 
    for data quality.

Q2: How does coordinate storage work in Supabase?
A2: Coordinates stored as PostGIS POINT: (1) Format: POINT(lng lat) in 
    WGS84 (EPSG:4326), (2) Inserted as string: "(${lng},${lat})", 
    (3) Supabase/PostGIS converts to POINT type, (4) Can query with spatial 
    functions. If direct insert fails: (1) Uses RPC function 
    insert_parcel_flag(), (2) Passes lng/lat as separate parameters, 
    (3) Server-side creates POINT using ST_MakePoint(lng, lat), (4) Returns 
    flag ID. PostGIS enables: (1) Spatial queries (distance, within, etc.), 
    (2) Spatial indexing (GIST index), (3) Coordinate transformations, 
    (4) Spatial analysis. The POINT type is more efficient than storing 
    lat/lng separately and enables spatial queries.

Q3: How does duplicate flag detection work?
A3: Duplicate detection: (1) After form submission, queries existing flags 
    for same district, (2) For each existing flag, extracts coordinates from 
    POINT string, (3) Calculates distance: sqrt((lat1-lat2)² + (lng1-lng2)²), 
    (4) If distance < 0.0001 (approximately 11 meters): Duplicate found, 
    (5) Shows warning, prevents duplicate creation. The distance calculation 
    uses simple Euclidean distance in lat/lng space - for small distances 
    (< 1km), this is approximately accurate. For more accurate distance, 
    could use Haversine formula, but simple distance is sufficient for 
    duplicate detection. The threshold 0.0001 degrees ≈ 11 meters at equator, 
    appropriate for detecting same-parcel flags.

Q4: How does flag history tracking work?
A4: Flag history: (1) Every flag type change creates history entry, 
    (2) History stored in flag_history table, (3) Links to flag via flag_id, 
    (4) Stores: old type, new type, changer info, reason, timestamp. Process: 
    (1) User changes flag type, (2) System gets current type, (3) Updates 
    flag.current_flag_type, (4) Creates history entry with old/new types, 
    (5) History displayed in flag detail view. This provides audit trail - 
    administrators can see who changed flags, when, and why. History is 
    immutable (never deleted), ensuring complete record of flag lifecycle. 
    The history enables accountability and transparency in quality control.

Q5: How does the comment system work?
A5: Comment system: (1) Users can add comments to flags, (2) Comments stored 
    in flag_comments table, (3) Linked to flag via flag_id, (4) Stores: 
    commenter name, contact, comment text, timestamp. Process: (1) User 
    fills comment form, (2) Validates comment (required, max 1000 chars), 
    (3) Inserts into flag_comments, (4) Reloads flag detail to show new 
    comment. Comments enable discussion about flags - users can provide 
    additional context, ask questions, or provide updates. Comments are 
    displayed in reverse chronological order (newest first) in flag detail 
    view. This creates threaded discussions around specific flags, improving 
    collaboration and information sharing.

Q6: How does flag type classification work?
A6: Flag types: (1) RED - Bad/Untrusted Data (critical issues, data should 
    not be used), (2) YELLOW - Needs Review (potential issues, requires 
    verification), (3) GREEN - Verified/Trusted Data (data verified and 
    trustworthy). Classification: (1) User selects type when creating flag, 
    (2) Type can be changed later (with history), (3) Type determines marker 
    color on map, (4) Type used for filtering and statistics. The three-tier 
    system provides clear quality levels - red flags indicate problems, yellow 
    indicate uncertainty, green indicate verification. This enables quick 
    visual assessment of data quality across the map. Administrators can 
    prioritize red flags for immediate attention, review yellow flags, and 
    trust green flags.

Q7: How does pagination work for flag search?
A7: Pagination: (1) Initial search loads page 1 (20 flags), (2) "Load More" 
    button loads next page, (3) Flags appended to existing list, (4) Map 
    markers accumulate. Process: (1) getFlags() uses .range(from, to) for 
    pagination, (2) from = (page - 1) * pageSize, to = from + pageSize - 1, 
    (3) Returns hasMore = (data.length === pageSize), (4) "Load More" 
    increments page and calls getFlags() again. This enables efficient 
    loading - only 20 flags loaded at a time, reducing initial load time and 
    memory usage. Users can load more as needed. The pagination is 
    client-side (loads all pages eventually), but could be optimized with 
    virtual scrolling for very large result sets.

Q8: How does the statistics calculation work?
A8: Statistics: (1) Calculated from search results, (2) Counts flags by 
    current_flag_type, (3) Displays counts for red/yellow/green. Process: 
    (1) After search, iterates through result flags, (2) Counts: 
    red = flags.filter(f => f.current_flag_type === 'red').length, 
    (3) Same for yellow and green, (4) Updates statistics display. The 
    statistics provide quick overview of data quality - administrators can 
    see distribution of flag types in search results. This helps prioritize 
    work - many red flags indicate serious quality issues, many yellow flags 
    indicate need for review, many green flags indicate good data quality. 
    Statistics update with each search, reflecting current filter results.

Q9: How does map marker styling work?
A9: Map markers: (1) Styled by flag type (red/yellow/green), (2) Color-coded 
    circles with flag emoji, (3) Dynamic styling based on current_flag_type. 
    Process: (1) qualityFlagsLayer uses style function, (2) Gets flag_type 
    from feature, (3) Maps to color: red='#e74c3c', yellow='#f39c12', 
    green='#27ae60', (4) Creates Style with: Circle (radius 10, colored 
    fill/stroke), Text (flag emoji, colored). The styling provides immediate 
    visual feedback - users can see flag types at a glance on the map. 
    Markers are clickable (can show popup or zoom to flag). The color coding 
    matches flag type classification, creating intuitive visual language.

Q10: How does the district filtering work?
A10: District filtering: (1) District dropdown populated from 
     QUALITY_FLAGS_DISTRICTS array, (2) User selects district, (3) Search 
     filters flags by district (exact match), (4) Only flags in selected 
     district shown. Process: (1) populateDistrictDropdowns() adds options 
     to dropdown, (2) User selects district, (3) getFlags() applies 
     .eq('district', district) filter, (4) Results limited to selected 
     district. District filtering enables focused searches - users can 
     view flags for specific districts, reducing clutter and improving 
     performance. The district list is predefined (QUALITY_FLAGS_DISTRICTS), 
     ensuring consistency. This is important for Uganda's administrative 
     structure, where districts are official administrative units.

Q11: How does the temporary pin work during location selection?
A11: Temporary pin: (1) Created when user clicks map in selection mode, 
     (2) Yellow marker at selected location, (3) Removed when flag submitted 
     or selection cancelled, (4) Helps user confirm location. Process: 
     (1) enableMapSelectionMode() adds map click listener, (2) On click: 
     Creates temporary feature with is_temp: true, (3) Adds to 
     qualityFlagsSource, (4) On submit: Removed and replaced with permanent 
     marker, (5) On cancel: Removed. The temporary pin provides visual 
     feedback - users can see exactly where they clicked and confirm before 
     submitting. The pin is styled as yellow (neutral color) to distinguish 
     from permanent flags. This improves UX by showing selection immediately.

Q12: How does the unread badge work?
A12: Unread badge: (1) Tracks flags created since user last viewed, 
     (2) Queries parcel_flags for flags created after last_viewed_at, 
     (3) Displays count on button, (4) Resets when panel opened. Process: 
     (1) updateNotificationBadge() queries user_flag_views for last_viewed_at, 
     (2) Counts flags with created_at > last_viewed_at, (3) Updates badge 
     text, (4) When panel opens: markFlagsAsViewed() updates last_viewed_at, 
     (5) Badge resets. The badge provides notification of new flags - users 
     can see if new quality issues have been reported since last check. This 
     encourages regular monitoring of data quality. The badge count is 
     approximate - based on creation time, not whether user actually viewed 
     each flag.

Q13: How does the county filter work?
A13: County filter: (1) User enters county name (text input), (2) Search 
     uses ILIKE for partial match, (3) Case-insensitive matching, 
     (4) Matches any county containing entered text. Process: (1) User 
     enters county text, (2) getFlags() applies .ilike('county', `%${county}%`) 
     filter, (3) ILIKE is case-insensitive LIKE in PostgreSQL, (4) % wildcards 
     match any characters before/after. This enables flexible searching - 
     users can find flags by partial county name, even if spelling varies. 
     The partial match is useful because county names may have variations or 
     users may not know exact spelling. The case-insensitive matching improves 
     usability.

Q14: How does date range filtering work?
A14: Date range filtering: (1) User selects "Date From" and "Date To", 
     (2) Search filters flags by created_at, (3) Date From: >= selected date, 
     (4) Date To: <= selected date + 'T23:59:59' (end of day). Process: 
     (1) User selects dates from date pickers, (2) getFlags() applies: 
     .gte('created_at', dateFrom) and .lte('created_at', dateTo + 'T23:59:59'), 
     (3) Filters flags within date range. The date range enables time-based 
     analysis - users can see flags created in specific time periods, useful 
     for tracking quality issues over time or reviewing recent flags. The 
     'T23:59:59' ensures Date To includes entire day (not just midnight). 
     This is important for inclusive date ranges.

Q15: How does the flag status work?
A15: Flag status: (1) 'active' - Flag is current and relevant, 
     (2) 'resolved' - Flag has been addressed/resolved. Process: (1) Flags 
     created with status 'active' (default), (2) Status can be updated 
     (if implemented), (3) Status displayed in flag detail view. The status 
     enables workflow management - administrators can mark flags as resolved 
     when issues are fixed, filtering them out from active searches. This 
     helps track which quality issues are still pending vs. resolved. 
     Current implementation may not fully support status updates, but 
     structure exists for future enhancement.

Q16: How does the coordinate parsing work?
A16: Coordinate parsing: (1) PostGIS POINT stored as string: "(${lng},${lat})", 
     (2) Parsed using regex: coordinates.match(/\(([^,]+),([^)]+)\)/), 
     (3) Extracts lng and lat as strings, (4) Converts to numbers: 
     parseFloat(). Process: (1) POINT string format: "(longitude,latitude)", 
     (2) Regex captures: Group 1 = lng, Group 2 = lat, (3) parseFloat() 
     converts to numbers, (4) Used for map display or calculations. The 
     parsing is necessary because PostGIS POINT is returned as string in 
     some queries. The regex pattern matches the standard POINT string format. 
     For more robust parsing, could use PostGIS functions (ST_X, ST_Y) in 
     SQL query, but string parsing works for current use case.

Q17: How does the map zoom work when viewing flag details?
A17: Map zoom: (1) When flag detail opened, zooms to flag location, 
     (2) Gets flag coordinates, (3) Converts to map projection, (4) Sets center 
     to flag location, (5) Sets zoom to max(currentZoom, 15). Process: 
     (1) showFlagDetail() extracts coordinates, (2) Converts to EPSG:3857: 
     ol.proj.fromLonLat([lng, lat]), (3) Sets map center, (4) Sets zoom to 
     at least 15 (ensures flag is visible). The zoom ensures flag is visible 
     and map shows appropriate detail level. The max() ensures zoom doesn't 
     decrease if already zoomed in more. This provides context - users can 
     see flag location on map while viewing details. The zoom level 15 is 
     approximately 50-100m view, appropriate for parcel-level detail.

Q18: How does the form validation work?
A18: Form validation: (1) validateFlagForm() checks all required fields, 
     (2) Validates contact format (phone or email), (3) Validates reason 
     length (10-1000 chars), (4) Validates location selection, (5) Validates 
     titled parcel fields (block or plot). Process: (1) Gets all form values, 
     (2) Checks each required field, (3) Calls validateContact() for contact, 
     (4) Checks reason length, (5) Returns true if all valid, false otherwise. 
     Validation ensures data quality - flags have complete information and 
     valid formats. The validation prevents incomplete or invalid flags from 
     being created. Error messages guide users to fix issues. The validation 
     is client-side (immediate feedback) but could be supplemented with 
     server-side validation for security.

Q19: How does the localStorage state saving work?
A19: localStorage state: (1) Saves current tab (flag/check), 
     (2) Saves selected district, (3) Loads on panel open, (4) Persists across 
     sessions. Process: (1) savePanelState() saves tab and district to 
     localStorage, (2) loadPanelState() loads saved values, (3) Restores tab 
     and district on open. This improves UX - users return to same tab and 
     district they were using, reducing repetitive selections. The state is 
     saved automatically when tab or district changes. This is convenient for 
     users who frequently check specific districts.

Q20: How does the export functionality work?
A20: Export functionality: (1) Collects all filtered flags, (2) Formats as 
     CSV, (3) Downloads file. Process: (1) Gets flags from current search 
     results, (2) Converts to CSV format (headers + rows), (3) Creates blob 
     with CSV data, (4) Creates download link, (5) Triggers download. CSV 
     contains: Flag ID, Type, Location (district, county, block, plot), 
     Coordinates, Reporter info, Reason, Created date, Status. Export enables 
     data analysis - users can download flags for external analysis, reporting, 
     or archival. The CSV format is universal and can be opened in Excel, 
     Google Sheets, or other tools. Export includes all visible flags from 
     current search (respects filters).

================================================================================
5. BEST PRACTICES & TIPS
================================================================================

5.1. FLAG CREATION
------------------
- Select accurate location on map
- Provide detailed reason (helps reviewers)
- Use appropriate flag type
- Include all relevant information
- Check for existing flags before creating

5.2. FLAG TYPES
---------------
- RED: Use for critical issues (wrong data, fraud)
- YELLOW: Use for potential issues (needs verification)
- GREEN: Use for verified/trusted data
- Change type as issues are resolved
- Document reason for type changes

5.3. LOCATION SELECTION
------------------------
- Zoom in for accurate selection
- Click precisely on parcel location
- Verify coordinates before submitting
- Use temporary pin to confirm location
- Cancel and reselect if needed

5.4. SEARCHING FLAGS
---------------------
- Use district filter to narrow results
- Use date range for time-based analysis
- Use flag type filter for specific issues
- Check statistics for overview
- Load more flags if needed

5.5. COMMENTS
-------------
- Add comments to provide context
- Update comments as situation changes
- Use comments for discussion
- Keep comments relevant and professional
- Comments help track flag resolution

5.6. FLAG HISTORY
------------------
- Review history before changing type
- Document reason for changes
- History provides audit trail
- Use history to understand flag lifecycle
- History is permanent (cannot be deleted)

5.7. DATA QUALITY
-----------------
- Flag issues promptly
- Provide accurate information
- Update flags as issues resolved
- Use appropriate flag types
- Collaborate through comments

================================================================================
6. TROUBLESHOOTING
================================================================================

ISSUE: "Quality Flags panel not opening"
SOLUTION:
- Check browser console for JavaScript errors
- Verify quality flags dock element exists
- Check CSS is loaded
- Try refreshing page (Ctrl+F5)
- Verify toggleQualityFlagsPanel() function exists

ISSUE: "Cannot select location on map"
SOLUTION:
- Check map is initialized
- Verify map click listener is added
- Check map-selection-mode class is applied
- Try clicking "Select Location" button again
- Check browser console for errors

ISSUE: "Flag not submitting"
SOLUTION:
- Check all required fields are filled
- Verify location is selected
- Check contact format (phone or email)
- Verify reason length (10-1000 chars)
- Check browser console for validation errors

ISSUE: "Duplicate flag warning"
SOLUTION:
- Check if flag already exists at location
- Search flags for same district
- Verify coordinates are not too close
- Flag may already exist (check existing flags)
- Use existing flag instead of creating duplicate

ISSUE: "Flags not loading in search"
SOLUTION:
- Check Supabase connection
- Verify parcel_flags table exists
- Check filters are not too restrictive
- Verify user has read permissions
- Check browser console for query errors

ISSUE: "Map markers not appearing"
SOLUTION:
- Check qualityFlagsLayer is added to map
- Verify coordinates are valid
- Check marker styling function
- Verify features are added to source
- Check browser console for errors

ISSUE: "Flag detail not loading"
SOLUTION:
- Check flag ID is valid
- Verify getFlagById() query succeeds
- Check flag_history and flag_comments tables exist
- Check browser console for errors
- Verify flag exists in database

ISSUE: "Comment not submitting"
SOLUTION:
- Check name and comment are filled
- Verify comment length <= 1000 chars
- Check flag_comments table exists
- Verify user has insert permissions
- Check browser console for errors

ISSUE: "Flag type not changing"
SOLUTION:
- Check all change form fields are filled
- Verify reason length <= 1000 chars
- Check flag_history table exists
- Verify update permissions
- Check browser console for errors

ISSUE: "Statistics not calculating"
SOLUTION:
- Check flags are loaded
- Verify current_flag_type field exists
- Check statistics calculation logic
- Verify flag types are valid (red/yellow/green)
- Check browser console for errors

ISSUE: "Coordinates not parsing"
SOLUTION:
- Check POINT string format: "(${lng},${lat})"
- Verify regex pattern matches format
- Check parseFloat() conversion
- Verify coordinates are numbers
- Check browser console for parsing errors

ISSUE: "Temporary pin not appearing"
SOLUTION:
- Check map click is captured
- Verify temporary feature is created
- Check qualityFlagsSource is accessible
- Verify feature is added to source
- Check browser console for errors

ISSUE: "Export not working"
SOLUTION:
- Check export function is implemented
- Verify flags are loaded
- Check CSV formatting
- Verify download is triggered
- Check browser console for errors

ISSUE: "Unread badge not updating"
SOLUTION:
- Check user_flag_views table exists
- Verify last_viewed_at is updated
- Check badge update function
- Verify badge element exists
- Check browser console for errors

ISSUE: "District filter not working"
SOLUTION:
- Check district dropdown is populated
- Verify district value matches database
- Check .eq() filter is applied
- Verify district field exists in table
- Check browser console for query errors

ISSUE: "County filter not working"
SOLUTION:
- Check county input value
- Verify .ilike() filter is applied
- Check county field exists in table
- Verify partial match is working
- Check browser console for errors

ISSUE: "Date range filter not working"
SOLUTION:
- Check date picker values
- Verify date format (YYYY-MM-DD)
- Check .gte() and .lte() filters
- Verify created_at field exists
- Check browser console for errors

ISSUE: "Flag history not showing"
SOLUTION:
- Check flag_history table exists
- Verify flag_id links are correct
- Check history query succeeds
- Verify history entries exist
- Check browser console for errors

ISSUE: "Comments not showing"
SOLUTION:
- Check flag_comments table exists
- Verify flag_id links are correct
- Check comments query succeeds
- Verify comments exist for flag
- Check browser console for errors

ISSUE: "Map not zooming to flag"
SOLUTION:
- Check coordinates are extracted
- Verify coordinate conversion (EPSG:3857)
- Check map.getView() is available
- Verify zoom level is set
- Check browser console for errors

ISSUE: "Form validation failing incorrectly"
SOLUTION:
- Check validation logic
- Verify field values
- Check contact validation regex
- Verify reason length calculation
- Check browser console for validation errors

ISSUE: "localStorage state not saving"
SOLUTION:
- Check localStorage is available
- Verify savePanelState() is called
- Check key names are correct
- Verify values are strings
- Check browser localStorage settings


## Valuation_Workflow_Guide.txt


GSP.NET Valuation Toolbox - Complete Workflow Guide

================================================================================
TABLE OF CONTENTS
================================================================================
1. Overview & Purpose
2. Step-by-Step Workflow
3. Button Functions & Calculations
4. Academic Questions & Answers
5. Best Practices & Tips
6. Troubleshooting

================================================================================
1. OVERVIEW & PURPOSE
================================================================================

The GSP.NET Valuation Toolbox enables professional valuers to:
- Build a private, centralized comparable property database
- Perform automated property valuations using comparable sales analysis
- Generate defensible, repeatable valuation reports in minutes
- Export professional PDF and CSV reports with risk indicators
- Maintain complete data privacy (each valuer's data is isolated)
- Capture field data offline and sync when online

The system uses advanced statistical methods including:
- Distance-weighted price calculations (Haversine formula)
- Confidence scoring based on data quality and quantity
- Risk indicator analysis (variance, data freshness, sample size)
- Comparable sales methodology with automated filtering

================================================================================
2. STEP-BY-STEP WORKFLOW
================================================================================

STEP 1: ACCOUNT SETUP & AUTHENTICATION
----------------------------------------
1.1. Open index.html in your browser
1.2. Click "Sign Up" to create an account
1.3. Use your professional email address
1.4. Select "Valuer" role (critical - general users cannot access valuation tools)
1.5. Activate subscription if prompted (valuation tools require active subscription)
1.6. Check email for Supabase verification link
1.7. Click verification link to confirm account
1.8. Sign in with your credentials
1.9. System stores secure session token and unlocks valuation features

STEP 2: LAUNCH VALUATION WORKSPACE
-----------------------------------
2.1. Open webmap.html while signed in
2.2. Look for "Valuation" button in the left dock
2.3. Button only appears/activates for valuer accounts with valid subscription
2.4. Click "Valuation" to open the toolbox panel
2.5. Panel contains three main tabs:
    - Value a Property: Capture new comparable records
    - Auto-Value Property: Generate automated valuations
    - Field Data Capture: Offline survey logging

STEP 3: BUILD YOUR COMPARABLE LIBRARY (Value a Property Tab)
---------------------------------------------------------------
3.1. Click "Start" button in "Value a Property" tab
3.2. Click on the map to place a marker at the property location
3.3. System automatically captures:
    - Latitude and longitude from map click
    - District (if available from map context)
3.4. Fill in the property form:

    REQUIRED FIELDS:
    - District: Select from dropdown or auto-filled
    - Plot Number: Enter plot identifier
    - Block Number: Optional but recommended
    - Tenure: Freehold, Leasehold, Customary, or Mailo
    - Property Type: Residential, Commercial, Agricultural, Industrial, or Mixed
    - Valuation Method: Comparable Sales, Income Approach, Cost Approach, Hybrid, or Auto-Calculated
    - Price (UGX): Total property value in Ugandan Shillings
    - Property Size (sqm): Area in square meters
    - Valuation Date: Date of valuation/sale

    OPTIONAL FIELDS (Recommended for better filtering):
    - Property Size (acres): Alternative area measurement
    - Number of Rooms: For residential properties
    - Number of Floors: Building height
    - Property Age (years): Age of structure
    - Property Condition: Excellent, Good, Fair, or Poor
    - Road Access: Tarmac, Murram, Footpath, or None
    - Has Electricity: Checkbox
    - Has Water: Checkbox
    - Zoning: Planning zone classification
    - Land Use: Current land use designation
    - Legal Status: Titled, Leasehold, Customary, or Pending
    - Proximity to Schools (km): Distance to nearest school
    - Proximity to Hospitals (km): Distance to nearest hospital
    - Proximity to Markets (km): Distance to nearest market
    - Surveyor Name: Name of valuer/surveyor
    - Surveyor ID: Professional registration number
    - Notes: Field observations, condition notes, neighborhood insights

3.5. Click "Save Property"
3.6. System validates all required fields
3.7. Data is saved to Supabase database with:
    - PostGIS geometry (point location)
    - User ID association (private to your account)
    - Timestamp (created_at, updated_at)
3.8. Property immediately appears as a pin on the map
3.9. Repeat for all comparable properties you inspect

STEP 4: PREPARE AUTO-VALUATION (Auto-Value Property Tab)
--------------------------------------------------------
4.1. Switch to "Auto-Value Property" tab
4.2. Click "Start Auto-Valuation" button
4.3. Click on the map to place subject property marker
4.4. System captures location (lat/long) automatically
4.5. Fill in subject property details:

    REQUIRED FIELDS:
    - District: Must match comparables for filtering
    - Plot Number: Subject property identifier
    - Block Number: Optional
    - Tenure: Freehold, Leasehold, Customary, or Mailo
    - Property Type: Residential, Commercial, Agricultural, Industrial, or Mixed
    - Property Size (sqm): Area to be valued
    - Valuation Date: Date of valuation

    OPTIONAL FIELDS (Improves accuracy):
    - All other fields same as Step 3.4
    - These help filter and match comparables

4.6. Configure Comparable Filters:
    - Tenure Filter: Match subject property tenure (recommended)
    - Valuation Method Filter: Filter by method (e.g., Comparable Sales only)
    - Min Price (UGX): Lower bound for comparable prices
    - Max Price (UGX): Upper bound for comparable prices
    - Click "Load Comparables" to fetch matching properties

4.7. System displays:
    - List of filtered comparables in scrollable panel
    - Purple pins on map showing comparable locations
    - Summary: "Loaded X comparable property(ies)"

STEP 5: SELECT COMPARABLES (Manual Selection)
-----------------------------------------------
5.1. Review the loaded comparables list
5.2. Each comparable shows:
    - Price (UGX)
    - Plot and Block numbers
    - District and Property Type
    - Tenure and Valuation Method
    - Valuation Date

5.3. Selection Methods:

    METHOD A: List Selection
    - Tick checkboxes next to desired comparables
    - Selected items highlight in the list
    - Summary updates: "Selected X comparable(s) | Avg price: UGX Y"

    METHOD B: Map Selection
    - Click "Enable Map Selection" button
    - Button changes to "Disable Map Selection" (active state)
    - Click purple pins on map to toggle selection
    - Selected pins become larger and darker purple
    - Click again to deselect

5.4. Use "Clear Selection" to remove all selections
5.5. Click "Use Selected" to confirm your manual selection
5.6. System will prioritize manually selected comparables over radius search

STEP 6: CONFIGURE VALUATION PARAMETERS
--------------------------------------
6.1. Set Calculation Radius:
    - Default: 2 km
    - Range: 0.5 km to 10 km
    - Defines search area if no manual comparables selected
    - Smaller radius = more local, potentially fewer comparables
    - Larger radius = more comparables, potentially less relevant

6.2. Report Branding (Optional but Recommended):
    - Client / Institution: Name of client (e.g., "ABC Commercial Bank")
    - Report Reference: Report number (e.g., "VAL-2025-001")
    - Prepared By: Your firm or valuer name

6.3. These fields appear in exported PDF reports

STEP 7: GENERATE VALUATION REPORT
----------------------------------
7.1. Click "Generate Valuation Report" button
7.2. System validates:
    - All required form fields are filled
    - Location marker is placed
    - At least 3 comparables available (if no manual selection)
7.3. Calculation Process:
    a. If manual comparables selected: Uses those exclusively
    b. If no manual selection: Searches within radius using filters
    c. Calculates distances using Haversine formula
    d. Computes price per square meter for each comparable
    e. Applies distance-weighted averaging
    f. Calculates confidence score
    g. Identifies risk indicators
    h. Generates statistics (mean, median, min, max, std dev)
7.4. Report appears instantly in the report container
7.5. System auto-saves report to Supabase database

STEP 8: INTERPRET THE VALUATION REPORT
---------------------------------------
8.1. Summary Banner (Top Section):
    - Estimated Value: Primary valuation figure in UGX
    - Confidence Level: Percentage (0-100%)
      * High: ≥70% (green)
      * Moderate: 40-69% (yellow)
      * Low: <40% (red)
    - Comparables Count: Number of properties used
    - Search Radius: Distance used for search
    - Prepared For: Client name (if provided)

8.2. Property Details Section:
    - Verifies subject property information
    - Plot, Block, District, Tenure
    - Property Type, Size, Zoning
    - Infrastructure (electricity, water, road access)
    - Legal status and land use

8.3. Valuation Statistics:
    - Average Comparable Price: Mean of all comparable prices
    - Median Comparable Price: Middle value (less affected by outliers)
    - Minimum Comparable Price: Lowest comparable
    - Maximum Comparable Price: Highest comparable
    - Standard Deviation: Measure of price spread
    - Average Price per SQM: Simple mean of price/sqm ratios
    - Weighted Price per SQM: Distance-weighted average (used for final estimate)

8.4. Risk Indicators (Critical Section):
    - High Price Variance: Standard deviation >35% of average
      * Indicates inconsistent comparables
      * Action: Review and remove outliers
    - Low Confidence: Confidence <60%
      * Action: Add more recent comparables or validate inputs
    - Few Comparables: Less than 5 properties
      * Action: Expand radius or relax filters
    - Stale Data: Comparables older than 365 days
      * Action: Add recent sales or adjust for market changes

8.5. Comparable Summary:
    - Dominant Property Type: Most common type and percentage
    - Dominant Tenure: Most common tenure and percentage
    - Average Distance: Mean distance to comparables (km)
    - Median Distance: Middle distance value
    - Price Range: Min to max comparable prices
    - Recent Comparables: Count of properties ≤180 days old

8.6. Valuation Notes:
    - System-generated notes about data quality
    - Recent comparables count
    - Data freshness indicators

8.7. Comparables Table:
    - Detailed list of all comparables used
    - Columns: #, Price, Price/SQM, Size (sqm), Distance (km), Coordinates
    - District, Tenure, Property Type, Valuation Method
    - Plot, Block numbers
    - Sorted by distance (closest first)

8.8. Charts (Two Visualizations):
    a. Price Distribution Histogram:
       - X-axis: Price ranges (buckets)
       - Y-axis: Number of comparables
       - Shows price spread and distribution
       - Helps identify outliers
    b. Distance vs. Price Scatter Plot:
       - X-axis: Distance from subject property (km)
       - Y-axis: Price (UGX)
       - Shows proximity effect on price
       - Trend line indicates distance-price relationship

STEP 9: EXPORT REPORTS
-----------------------
9.1. Export CSV:
    - Click "Export CSV" button
    - Generates structured dataset
    - Contains:
      * Subject property details
      * Estimated value and confidence
      * All statistics (mean, median, std dev)
      * Risk indicators
      * Comparable summary
      * Full comparable details table
    - File name: GSP.NET-AUTO_VALUE_<plot>_<timestamp>.csv
    - Suitable for Excel analysis, further calculations

9.2. Export PDF:
    - Click "Export PDF" button
    - Generates professional report
    - Contains:
      * Branded header (client name, reference, valuer name)
      * Executive summary
      * Property details
      * Valuation statistics
      * Risk indicators
      * Comparable summary
      * Valuation notes
      * High-resolution chart images
      * Full comparables table
    - File name: GSP.NET-AUTO_VALUE_<plot>_<timestamp>.pdf
    - Client-ready, professional format

9.3. Both exports include timestamp and are logged in system

STEP 10: FIELD DATA CAPTURE (Optional - Offline Mode)
-------------------------------------------------------
10.1. Switch to "Field Data Capture" tab
10.2. Use when working offline or in areas with poor connectivity
10.3. Fill in property forms as in Step 3
10.4. Data stored locally in browser
10.5. When online, click "Sync" to upload all captured data
10.6. System validates and saves to database
10.7. Properties appear on map after sync

STEP 11: VIEW SAVED PROPERTIES (Optional)
------------------------------------------
11.1. Use "View Properties" feature (if available)
11.2. Apply filters to browse your comparable library
11.3. Filters: District, Tenure, Property Type, Valuation Method, Price Range
11.4. Properties display as pins on map
11.5. Click pins to view details
11.6. Edit or delete properties as needed

================================================================================
3. BUTTON FUNCTIONS & CALCULATIONS
================================================================================

3.1. "START" BUTTON (Value a Property Tab)
-------------------------------------------
FUNCTION:
Initiates property data capture workflow. Activates map interaction mode.

PROCESS:
1. Enables map click listener
2. User clicks on map to place property location
3. System captures coordinates (lat/long) from map click
4. Opens property data entry form
5. Auto-fills location fields from map context
6. User completes form and saves

3.2. "SAVE PROPERTY" BUTTON
----------------------------
FUNCTION:
Saves new comparable property to database with full validation.

VALIDATION PROCESS:
1. Checks all required fields are filled
2. Validates data types (numbers, dates)
3. Verifies coordinate values are valid
4. Ensures price and size are positive numbers
5. Validates date format and range

SAVE PROCESS:
1. Extracts form data
2. Converts coordinates to PostGIS geography point
3. Prepares database record with:
   - User ID (from session)
   - Location (PostGIS POINT)
   - All property attributes
   - Timestamps (created_at, updated_at)
4. Inserts into property_valuations table
5. Creates map pin at property location
6. Updates comparable library count

DATABASE OPERATION:
INSERT INTO property_valuations (
    user_id, location, district, plot_number, block_number,
    tenure, property_type, valuation_method, price_ugx,
    property_size_sqm, valuation_date, ...
) VALUES (...);

3.3. "LOAD COMPARABLES" BUTTON
-------------------------------
FUNCTION:
Fetches comparable properties from database based on filters.

FILTERING PROCESS:
1. Collects filter criteria:
   - District (exact match)
   - Property Type (exact match)
   - Tenure (exact match)
   - Valuation Method (exact match)
   - Price Min (greater than or equal)
   - Price Max (less than or equal)
2. Builds Supabase query with filters
3. Excludes auto-calculated properties (is_auto_calculated = false)
4. Filters by user_id (only your comparables)
5. Executes database query
6. Returns matching properties

QUERY STRUCTURE:
SELECT * FROM property_valuations
WHERE user_id = <your_user_id>
  AND is_auto_calculated = false
  AND district = <filter_district> (if specified)
  AND property_type = <filter_type> (if specified)
  AND tenure = <filter_tenure> (if specified)
  AND valuation_method = <filter_method> (if specified)
  AND price_ugx >= <min_price> (if specified)
  AND price_ugx <= <max_price> (if specified);

DISPLAY PROCESS:
1. Assigns unique IDs to each comparable
2. Renders list in scrollable panel
3. Creates map pins (purple circles) at each location
4. Shows property summary (price, plot, district, type)
5. Updates count: "Loaded X comparable property(ies)"

3.4. "GENERATE VALUATION REPORT" BUTTON
----------------------------------------
FUNCTION:
Performs automated valuation calculation and generates comprehensive report.

CALCULATION WORKFLOW:

A. COMPARABLE SELECTION:
   1. If manual comparables selected: Use those exclusively
   2. If no manual selection:
      a. Get filtered comparables (from Load Comparables)
      b. Calculate distance from subject to each comparable
      c. Filter by radius: distance <= radiusKm
      d. If still insufficient, try radius-based RPC query
      e. Final filter by criteria (tenure, type, price range)

B. DISTANCE CALCULATION (Haversine Formula):
   For each comparable property:
   - Extract coordinates: (lat1, lon1) = subject, (lat2, lon2) = comparable
   - Calculate distance using Haversine formula:
     
     R = 6371 km (Earth radius)
     dLat = (lat2 - lat1) * π/180
     dLon = (lon2 - lon1) * π/180
     a = sin²(dLat/2) + cos(lat1 * π/180) * cos(lat2 * π/180) * sin²(dLon/2)
     c = 2 * atan2(√a, √(1-a))
     distance = R * c (in kilometers)

C. PRICE PER SQUARE METER CALCULATION:
   For each comparable:
   pricePerSQM = price_ugx / property_size_sqm
   (Only calculated if property_size_sqm > 0)

D. WEIGHTED AVERAGE CALCULATION:
   1. Calculate weights based on inverse distance:
      For each comparable i:
      weight_i = 1 / (distance_i + 0.1)
      (0.1 added to avoid division by zero for exact matches)
   
   2. Calculate weighted sum:
      weightedSum = Σ(pricePerSQM_i * weight_i)
      totalWeight = Σ(weight_i)
   
   3. Weighted average:
      weightedAvgPricePerSQM = weightedSum / totalWeight
   
   4. Estimated total price:
      estimatedPrice = weightedAvgPricePerSQM * subjectPropertySizeSQM

E. SIMPLE STATISTICS:
   1. Simple Average Price per SQM:
      avgPricePerSQM = Σ(pricePerSQM_i) / n
   
   2. Median Price:
      - Sort all prices: [p1, p2, ..., pn]
      - If n is odd: median = p[(n+1)/2]
      - If n is even: median = (p[n/2] + p[n/2+1]) / 2
   
   3. Min/Max Prices:
      minPrice = min(prices)
      maxPrice = max(prices)
   
   4. Average Price:
      avgPrice = Σ(prices) / n
   
   5. Standard Deviation:
      variance = Σ(price_i - avgPrice)² / n
      stdDev = √variance

F. CONFIDENCE SCORE CALCULATION:
   1. Base confidence from sample size:
      baseConfidence = min(100, (n / 10) * 50)
      - 3 comparables = 15%
      - 5 comparables = 25%
      - 10 comparables = 50%
      - 20+ comparables = 100% (capped)
   
   2. Distance score:
      avgDistance = Σ(distances) / n
      distanceScore = max(0, 100 - (avgDistance * 50))
      - 0 km average = 100 points
      - 1 km average = 50 points
      - 2 km average = 0 points
   
   3. Final confidence:
      confidence = baseConfidence + (distanceScore * 0.3)
      confidence = min(100, max(0, round(confidence)))
      - Clamped to 0-100%
      - Rounded to nearest integer

G. RISK INDICATOR ANALYSIS:
   1. Price Variance Risk:
      priceVolatilityRatio = stdDev / avgPrice
      If priceVolatilityRatio > 0.35:
         Risk: "High price variance detected (std dev >35% of average)"
   
   2. Low Confidence Risk:
      If confidence < 60:
         Risk: "Confidence below 60%; add more recent comparables"
   
   3. Insufficient Comparables Risk:
      If n < 5:
         Risk: "Fewer than 5 comparables available"
   
   4. Stale Data Risk:
      staleThresholdDays = 365
      For each comparable:
         daysOld = (today - valuation_date) / (1000 * 60 * 60 * 24)
         If daysOld > 365: count as stale
      If staleCount > 0:
         Risk: "X comparable(s) older than 365 days"

H. COMPARABLE SUMMARY CALCULATION:
   1. Dominant Property Type:
      - Count occurrences of each property_type
      - dominantType = type with highest count
      - dominantTypeShare = (count / n) * 100
   
   2. Dominant Tenure:
      - Count occurrences of each tenure
      - dominantTenure = tenure with highest count
      - dominantTenureShare = (count / n) * 100
   
   3. Distance Statistics:
      - averageDistance = Σ(distances) / n
      - medianDistance = median(distances)
   
   4. Price Range:
      - minPrice = min(prices)
      - maxPrice = max(prices)
   
   5. Recent Comparables:
      - Count comparables with valuation_date ≤ 180 days old
      - recentCount = count

I. REPORT GENERATION:
   1. Assembles all calculated data
   2. Generates HTML report with sections
   3. Creates charts (price distribution, distance vs price)
   4. Displays in report container
   5. Auto-saves to Supabase database

MATHEMATICAL FORMULAS SUMMARY:
- Haversine Distance: d = 2R * atan2(√a, √(1-a))
  where a = sin²(Δlat/2) + cos(lat1) * cos(lat2) * sin²(Δlon/2)
- Weighted Average: x̄_w = Σ(w_i * x_i) / Σ(w_i)
  where w_i = 1 / (distance_i + 0.1)
- Standard Deviation: σ = √(Σ(x_i - x̄)² / n)
- Confidence: C = min(100, (n/10)*50 + max(0, 100-avgDist*50)*0.3)

3.5. "EXPORT CSV" BUTTON
-------------------------
FUNCTION:
Exports valuation report data as comma-separated values file.

EXPORT PROCESS:
1. Collects all report data:
   - Subject property details
   - Estimated value and confidence
   - All statistics
   - Risk indicators
   - Comparable summary
   - Full comparables table
2. Formats as CSV:
   - Headers in first row
   - Values in subsequent rows
   - Proper escaping of commas and quotes
   - UTF-8 encoding
3. Creates download link
4. Triggers browser download
5. File name: GSP.NET-AUTO_VALUE_<plot>_<timestamp>.csv

CSV STRUCTURE:
Section 1: Summary Metrics
  - Estimated Value, Confidence, Comparables Used, Radius
  - Price per SQM (estimated, average, weighted)
  - Statistics (avg, median, min, max, std dev)

Section 2: Risk Indicators
  - One row per risk indicator

Section 3: Comparable Summary
  - Dominant types, distances, price range, recent count

Section 4: Comparables Table
  - One row per comparable
  - Columns: Index, Distance, Price, Price/SQM, Size, District, Tenure, etc.

3.6. "EXPORT PDF" BUTTON
-------------------------
FUNCTION:
Generates professional PDF report using jsPDF library.

PDF GENERATION PROCESS:
1. Creates new PDF document
2. Sets page size (A4: 210mm x 297mm)
3. Adds branded header:
   - Client name (if provided)
   - Report reference (if provided)
   - Valuer name (if provided)
   - Date and time
4. Adds sections:
   a. Executive Summary
      - Estimated value (large, prominent)
      - Confidence level with color coding
      - Key metrics
   b. Property Details
      - All subject property information
      - Formatted table
   c. Valuation Statistics
      - Mean, median, min, max, std dev
      - Price per SQM metrics
   d. Risk Indicators
      - Bullet list of identified risks
   e. Comparable Summary
      - Dominant types, distances, ranges
   f. Valuation Notes
      - System-generated insights
   g. Charts
      - Price distribution histogram (as image)
      - Distance vs price scatter plot (as image)
   h. Comparables Table
      - Full table with all comparable details
5. Adds page numbers
6. Generates PDF blob
7. Triggers download
8. File name: GSP.NET-AUTO_VALUE_<plot>_<timestamp>.pdf

3.7. "USE SELECTED" BUTTON
---------------------------
FUNCTION:
Confirms manual comparable selection for use in valuation.

PROCESS:
1. Checks if any comparables are selected
2. If none: Shows warning message
3. If selected: Confirms selection count
4. Stores selection in valuationState.selectedComparables
5. System will prioritize these over radius search
6. Shows success message: "Will use X manually selected comparable(s)"

3.8. "CLEAR SELECTION" BUTTON
------------------------------
FUNCTION:
Removes all manual comparable selections.

PROCESS:
1. Clears valuationState.selectedComparables Map
2. Unchecks all checkboxes in list
3. Removes 'selected' class from list items
4. Resets map pin styles (smaller, lighter purple)
5. Updates summary: "No comparables selected"
6. Shows confirmation message

3.9. "ENABLE MAP SELECTION" BUTTON
-----------------------------------
FUNCTION:
Toggles map-based comparable selection mode.

PROCESS:
1. When enabled:
   - Activates map click listener
   - Button changes to "Disable Map Selection" (active state)
   - User can click purple pins to toggle selection
   - Selected pins become larger and darker
   - Shows info message: "Click comparable pins on map to toggle selection"
2. When disabled:
   - Removes map click listener
   - Button returns to "Enable Map Selection"
   - Shows info message: "Map selection disabled"

3.10. "SYNC" BUTTON (Field Data Capture)
-----------------------------------------
FUNCTION:
Uploads locally stored field data to database when online.

PROCESS:
1. Retrieves all locally stored property records
2. For each record:
   a. Validates data
   b. Converts to database format
   c. Inserts into property_valuations table
   d. Handles errors gracefully
3. Clears local storage after successful upload
4. Updates map with new properties
5. Shows success message with count: "Synced X properties"

================================================================================
4. ACADEMIC QUESTIONS & ANSWERS
================================================================================

Q1: What is the Comparable Sales Method and how does this system implement it?
A1: The Comparable Sales Method (CSM) estimates property value by analyzing 
    recent sales of similar properties. This system implements CSM by: (1) 
    Filtering comparable properties by location, type, tenure, and price range, 
    (2) Calculating price per square meter for each comparable, (3) Applying 
    distance-weighted averaging to give more weight to closer comparables, 
    (4) Adjusting for property size to estimate total value. The system 
    automates the entire process, making it faster and more consistent than 
    manual calculations.

Q2: Explain the Haversine formula and why it's used for distance calculations.
A2: The Haversine formula calculates the great-circle distance between two 
    points on a sphere (Earth) given their latitudes and longitudes. It accounts 
    for Earth's curvature, making it more accurate than simple Euclidean distance 
    for geographic coordinates. The formula: d = 2R * atan2(√a, √(1-a)), where 
    a = sin²(Δlat/2) + cos(lat1) * cos(lat2) * sin²(Δlon/2), and R = Earth's 
    radius (6371 km). This system uses it to calculate distances between subject 
    and comparable properties, which are then used to weight the comparables 
    (closer = higher weight).

Q3: How does distance weighting work in the valuation calculation?
A3: Distance weighting gives more influence to comparables that are closer to 
    the subject property, based on the principle that nearby properties are more 
    similar in value. The weight formula: w_i = 1 / (distance_i + 0.1). The 0.1 
    constant prevents division by zero for exact matches. The weighted average 
    price per SQM is: x̄_w = Σ(w_i * pricePerSQM_i) / Σ(w_i). This means a 
    comparable 0.5 km away has twice the weight of one 1 km away, reflecting 
    the stronger influence of proximity on property values.

Q4: What is confidence scoring and how is it calculated?
A4: Confidence scoring quantifies the reliability of the valuation estimate. 
    It combines two factors: (1) Sample size: baseConfidence = min(100, (n/10)*50), 
    where n = number of comparables. More comparables = higher confidence. 
    (2) Proximity: distanceScore = max(0, 100 - avgDistance*50), where closer 
    comparables increase confidence. Final confidence = baseConfidence + 
    (distanceScore * 0.3), clamped to 0-100%. A score ≥70% is "High" (green), 
    40-69% is "Moderate" (yellow), <40% is "Low" (red).

Q5: What are risk indicators and why are they important?
A5: Risk indicators flag potential issues that could affect valuation accuracy. 
    The system identifies four types: (1) High Price Variance: Standard deviation 
    >35% of average indicates inconsistent comparables (outliers or different 
    market segments). (2) Low Confidence: <60% suggests insufficient or poor 
    quality data. (3) Few Comparables: <5 properties reduces statistical reliability. 
    (4) Stale Data: Comparables >365 days old may not reflect current market. 
    These indicators help valuers identify when to gather more data or adjust 
    their methodology.

Q6: How does the system handle outliers in comparable prices?
A6: The system identifies outliers through standard deviation analysis. If 
    stdDev/avgPrice > 0.35, it flags "High price variance" as a risk indicator. 
    However, the system doesn't automatically exclude outliers because they may 
    be legitimate (e.g., premium properties, distressed sales). Instead, it 
    provides: (1) Risk warning for valuer review, (2) Median price (less affected 
    by outliers than mean), (3) Price distribution chart showing spread, 
    (4) Full comparable list for manual review. The valuer can manually exclude 
    outliers by selecting specific comparables.

Q7: What is the difference between average and weighted average price per SQM?
A7: Simple average: x̄ = Σ(pricePerSQM_i) / n, treats all comparables equally. 
    Weighted average: x̄_w = Σ(w_i * pricePerSQM_i) / Σ(w_i), gives more weight 
    to closer comparables. The weighted average is used for the final estimate 
    because it better reflects local market conditions. For example, if a 
    comparable 0.5 km away has pricePerSQM = 500,000 and one 2 km away has 
    600,000, the weighted average will be closer to 500,000, reflecting the 
    stronger influence of the nearby property.

Q8: How does the system ensure data privacy between valuers?
A8: Data privacy is enforced at the database level using Row Level Security 
    (RLS). Every property_valuations record includes a user_id field. Database 
    policies ensure: (1) Users can only INSERT records with their own user_id, 
    (2) Users can only SELECT records where user_id matches their session, 
    (3) Users can only UPDATE/DELETE their own records. The application also 
    filters queries by user_id before execution. This means each valuer's 
    comparable library is completely isolated - they cannot see or access other 
    valuers' data.

Q9: What is the purpose of the median price statistic?
A9: The median price is the middle value when all prices are sorted. It's less 
    sensitive to outliers than the mean. For example, if comparables are 
    [100M, 120M, 130M, 140M, 500M], the mean is 198M (skewed by 500M), but the 
    median is 130M (more representative). The system provides both statistics 
    so valuers can: (1) Use median when outliers are present, (2) Compare mean 
    vs median to detect skewness, (3) Make informed decisions about which 
    statistic better represents the market.

Q10: How does the system handle properties with missing data?
A10: The system handles missing data gracefully: (1) Required fields (district, 
     plot, tenure, type, price, size, date) must be provided - form validation 
     prevents submission without them. (2) Optional fields (rooms, floors, age, 
     etc.) can be null - these don't block calculations. (3) Price per SQM is only 
     calculated if property_size_sqm > 0. (4) Distance is calculated if coordinates 
     are available. (5) Statistics exclude null/invalid values. (6) The system 
     still generates reports with available data, but may flag missing information 
     in risk indicators if it affects reliability.

Q11: What is the significance of the 2 km default radius?
A11: The 2 km default radius balances two factors: (1) Local market relevance - 
     properties within 2 km are likely in similar neighborhoods with similar 
     characteristics (schools, infrastructure, accessibility). (2) Sample size - 
     2 km typically provides enough comparables (5-20) for statistical reliability 
     in urban areas. However, valuers should adjust based on: (a) Property type 
     (commercial may need larger radius), (b) Market density (rural areas may 
     need 5-10 km), (c) Data availability (expand if few comparables found). 
     The system allows 0.5-10 km range for flexibility.

Q12: How are charts generated and what do they show?
A12: Charts use Chart.js library. Two charts are generated: (1) Price Distribution 
     Histogram: X-axis = price ranges (buckets), Y-axis = frequency (number of 
     comparables). Shows how prices are distributed - normal distribution suggests 
     good comparables, skewed distribution suggests outliers. (2) Distance vs. 
     Price Scatter Plot: X-axis = distance (km), Y-axis = price (UGX). Each point 
     = one comparable. Trend line shows relationship - negative slope suggests 
     price decreases with distance (expected), flat line suggests distance doesn't 
     affect price (unusual). These visualizations help identify patterns and outliers.

Q13: What is the difference between "Comparable Sales" and "Auto-Calculated" 
     valuation methods?
A13: "Comparable Sales" indicates the property value was determined through 
     traditional comparable sales analysis (manual or professional valuation). 
     "Auto-Calculated" indicates the value was generated by this system's 
     automated algorithm. The system filters out auto-calculated properties 
     (is_auto_calculated = false) when loading comparables to avoid circular 
     references - you don't want to value a property using other auto-valued 
     properties as comparables. Only manually entered or professionally valued 
     properties are used as comparables.

Q14: How does the system calculate price per square meter?
A14: For each comparable: pricePerSQM = price_ugx / property_size_sqm. This 
     normalizes prices by size, allowing comparison of properties with different 
     areas. The subject property's estimated value is then: estimatedPrice = 
     weightedAvgPricePerSQM * subjectPropertySizeSQM. This assumes linear 
     relationship between size and price, which is generally true for similar 
     properties in the same area. However, the system doesn't account for 
     economies of scale (larger properties may have lower price per SQM).

Q15: What is the purpose of the "Recent Comparables" metric (≤180 days)?
A15: Recent comparables (≤180 days old) are more reflective of current market 
     conditions than older sales. Real estate markets can change significantly 
     over time due to economic conditions, infrastructure development, zoning 
     changes, etc. The system tracks how many comparables are recent to help 
     valuers assess data freshness. If most comparables are >180 days old, the 
     valuer should: (1) Add recent sales if available, (2) Consider market 
     adjustments for time, (3) Note this in the risk indicators. The 180-day 
     threshold balances recency with data availability.

Q16: How does the system handle coordinate system transformations?
A16: The map uses Web Mercator (EPSG:3857) for display, but coordinates are 
     stored in WGS84 Geographic (EPSG:4326) in the database. When placing markers: 
     (1) Map click provides Web Mercator coordinates, (2) System transforms to 
     WGS84 using OpenLayers projection, (3) Stores as PostGIS geography point. 
     When calculating distances: (1) Uses WGS84 coordinates directly, (2) Haversine 
     formula works with geographic coordinates (lat/long in degrees). This ensures 
     accurate distance calculations regardless of map projection.

Q17: What validation occurs when saving a property?
A17: Client-side validation: (1) Required fields check (district, plot, tenure, 
     type, price, size, date), (2) Data type validation (numbers are numeric, 
     dates are valid), (3) Range validation (price > 0, size > 0), (4) Coordinate 
     validation (lat: -90 to 90, lon: -180 to 180). Server-side validation: 
     (1) Database constraints (CHECK constraints on enums, numeric ranges), 
     (2) Foreign key validation (user_id exists in auth.users), (3) PostGIS 
     validation (coordinates form valid point). If validation fails, the system 
     shows specific error messages guiding the user to fix issues.

Q18: How does the "Field Data Capture" offline mode work?
A18: Field Data Capture uses browser localStorage to store property data when 
     offline. Process: (1) User fills property form, (2) Data stored in 
     localStorage with timestamp, (3) When online, user clicks "Sync", 
     (4) System retrieves all stored records, (5) For each record: validates, 
     inserts into database, (6) Clears localStorage after successful upload, 
     (7) Updates map with new properties. This allows valuers to work in areas 
     with poor connectivity and sync data when they return to areas with internet. 
     Data persists across browser sessions until synced.

Q19: What is the purpose of the report branding fields (Client, Reference, Valuer)?
A19: These fields customize the PDF export for professional presentation: 
     (1) Client/Institution: Appears in report header, personalizes report for 
     recipient. (2) Report Reference: Unique identifier (e.g., "VAL-2025-001") 
     for tracking and filing. (3) Prepared By: Valuer or firm name, establishes 
     authorship and responsibility. These fields are optional but recommended for 
     professional reports. They appear prominently in the PDF header and help 
     maintain professional standards and audit trails.

Q20: How does the system determine which comparables to use when both manual 
     selection and radius search are available?
A20: The system prioritizes manual selection. Logic: (1) If manual comparables 
     are selected (valuationState.selectedComparables.size > 0), use those 
     exclusively - ignore radius search. (2) If no manual selection, perform 
     radius search with filters. (3) If radius search finds comparables, use those. 
     (4) If radius search finds none, try broader RPC query. This design gives 
     valuers full control - they can override automated selection by manually 
     choosing the most relevant comparables, which is important when automated 
     selection might include inappropriate properties.

================================================================================
5. BEST PRACTICES & TIPS
================================================================================

5.1. BUILDING YOUR COMPARABLE LIBRARY
--------------------------------------
- Capture comparables immediately after field inspection while details are fresh
- Include comprehensive notes about property condition, neighborhood, and unique 
  features - these help with future filtering and analysis
- Use consistent terminology for property types and conditions across all entries
- Record surveyor name and ID for audit trails and compliance
- Enter accurate coordinates - use GPS or map precision, not estimates
- Update comparables regularly - markets change, and stale data reduces accuracy
- Aim for at least 10-20 comparables per district for robust analysis

5.2. SELECTING COMPARABLES FOR VALUATION
------------------------------------------
- Match subject property characteristics as closely as possible:
  * Same or similar property type
  * Same tenure type (Freehold vs Leasehold can have significant price differences)
  * Similar size (within 50% if possible)
  * Similar condition and age
- Prefer recent sales (≤180 days) over older ones
- Use manual selection when automated selection includes inappropriate properties
- Review each comparable's details before including it
- Remove outliers manually if they represent different market segments
- Aim for 5-10 comparables minimum, 10-15 ideal for high confidence

5.3. FILTER CONFIGURATION
--------------------------
- Start with strict filters (same district, tenure, type) and relax if needed
- Use price range filters to exclude outliers (e.g., exclude very high-end or 
  distressed sales if not representative)
- Match subject property's valuation method when possible
- If few comparables found, gradually relax filters (e.g., remove property type 
  filter, then tenure filter)
- Document filter choices in notes for audit trail

5.4. RADIUS SELECTION
----------------------
- Start with default 2 km for urban areas
- Use 0.5-1 km for dense urban centers with many comparables
- Use 3-5 km for suburban areas with fewer comparables
- Use 5-10 km for rural areas or specialized properties
- Adjust based on results: if too few comparables, increase; if too many 
  irrelevant ones, decrease
- Consider property type: commercial properties may need larger radius than 
  residential

5.5. INTERPRETING RESULTS
--------------------------
- Always review risk indicators first - address high-risk items before finalizing
- Compare weighted average vs simple average - large difference suggests distance 
  effect is significant
- Review median vs mean - if very different, outliers are present
- Check price distribution chart for normal distribution vs skewness
- Review distance vs price chart - negative trend is expected (closer = higher price)
- Confidence ≥70% is ideal, but 40-69% can be acceptable with good comparables
- Low confidence (<40%) requires more data or manual adjustment

5.6. RISK MANAGEMENT
---------------------
- High price variance (>35%): Review comparables, remove outliers, or note in 
  report that market has wide range
- Low confidence (<60%): Add more comparables, expand radius, or relax filters
- Few comparables (<5): Expand radius, relax filters, or note limitation in report
- Stale data (>365 days): Add recent sales, apply market adjustment factor, or 
  note data age in report
- Always document risk mitigation actions in valuation notes

5.7. REPORT GENERATION
-----------------------
- Fill in branding fields (client, reference, valuer) for professional reports
- Review report thoroughly before exporting
- Export both CSV (for analysis) and PDF (for clients)
- Save reports locally - system auto-saves to database but local copies are 
  recommended
- Include risk indicators in client communications when significant
- Use report reference numbers for tracking and filing

5.8. DATA QUALITY
------------------
- Verify coordinates are accurate (use GPS or precise map placement)
- Double-check prices and sizes - errors in these fields cascade through 
  calculations
- Ensure valuation dates are correct - affects "recent comparables" metric
- Use consistent units (sqm vs acres) - system handles both but consistency 
  helps
- Review saved properties periodically for errors or updates
- Delete or update incorrect entries rather than leaving them

5.9. PRIVACY & SECURITY
------------------------
- Never share your login credentials
- Be aware that all data is private to your account - other valuers cannot see it
- Export and share reports explicitly when needed - don't rely on system access
- Keep subscription active - loss of subscription hides valuation tools
- Log out when finished, especially on shared computers
- Report any suspicious activity or data access issues

5.10. WORKFLOW EFFICIENCY
---------------------------
- Build comparable library proactively - don't wait until you need a valuation
- Use consistent data entry patterns - speeds up future entries
- Save frequently used filter combinations mentally or in notes
- Use map selection mode for quick comparable review when many are loaded
- Export CSV for bulk analysis in Excel if needed
- Keep field data capture synced regularly when working offline

================================================================================
6. TROUBLESHOOTING
================================================================================

ISSUE: "Valuation button not visible or disabled"
SOLUTION: 
- Verify you're signed in with a valuer account (not general user)
- Check that subscription is active (if required)
- Refresh page and sign in again
- Clear browser cache and cookies, then sign in
- Contact administrator if issue persists

ISSUE: "No comparables found when loading"
SOLUTION:
- Verify you have saved properties in "Value a Property" tab first
- Check that district filter matches your saved properties
- Relax filters (remove property type, tenure, or price range filters)
- Expand search radius if using radius-based search
- Verify you're signed in with the same account that saved the properties

ISSUE: "Insufficient data: Only X comparables found"
SOLUTION:
- Minimum 3 comparables required for calculation
- Add more comparable properties to your library
- Expand search radius (increase from 2 km to 5 km or more)
- Relax filters (remove property type, tenure filters)
- Use manual selection if you have comparables from different districts

ISSUE: "Low confidence score (<40%)"
SOLUTION:
- Add more comparables (aim for 10+ for high confidence)
- Use comparables closer to subject property (reduce average distance)
- Ensure comparables are recent (≤180 days old)
- Match subject property characteristics more closely
- Consider manual adjustment if data quality is good but confidence is low

ISSUE: "High price variance risk indicator"
SOLUTION:
- Review comparables list for outliers
- Remove comparables that represent different market segments
- Check for data entry errors (wrong prices or sizes)
- Use median price instead of mean if outliers are legitimate
- Note in report that market has wide price range

ISSUE: "Property not saving to database"
SOLUTION:
- Check all required fields are filled (red borders indicate missing fields)
- Verify coordinates are valid (check map marker placement)
- Ensure you're signed in (session may have expired)
- Check browser console for error messages
- Try refreshing page and signing in again

ISSUE: "Map pins not appearing after saving property"
SOLUTION:
- Verify property saved successfully (check for success message)
- Refresh map view (zoom out/in)
- Check that property is within current map viewport
- Verify coordinates are valid (not null or zero)
- Clear browser cache if issue persists

ISSUE: "Export PDF/CSV not working"
SOLUTION:
- Check browser allows downloads (check popup blocker settings)
- Verify report was generated successfully first
- Try different browser if issue persists
- Check browser console for JavaScript errors
- Ensure sufficient disk space for download

ISSUE: "Distance calculations seem incorrect"
SOLUTION:
- Verify coordinates are accurate (use GPS or precise map placement)
- Check that subject and comparables are in same coordinate system
- System uses Haversine formula (accounts for Earth curvature)
- Very close properties (<100m) may show 0.0 km due to rounding
- For precise distances, use external tools to verify

ISSUE: "Selected comparables not being used in calculation"
SOLUTION:
- Verify you clicked "Use Selected" button after selecting
- Check that selected comparables are within radius (if radius search also active)
- Ensure comparables are valid (have coordinates and prices)
- Review calculation - manually selected comparables take priority
- Clear selection and re-select if needed

ISSUE: "Field data not syncing"
SOLUTION:
- Verify you're online (check internet connection)
- Check browser console for error messages
- Ensure you're signed in (session may have expired)
- Try syncing individual properties if bulk sync fails
- Check localStorage isn't full (clear other site data if needed)

ISSUE: "Report shows incorrect estimated value"
SOLUTION:
- Verify subject property size is correct (errors here multiply through calculation)
- Check that comparables are appropriate (similar type, tenure, condition)
- Review weighted vs simple average - large difference suggests distance weighting 
  is strong
- Verify no data entry errors in comparables (wrong prices or sizes)
- Recalculate with different comparables to validate

ISSUE: "Charts not displaying in report"
SOLUTION:
- Charts require Chart.js library - check internet connection
- Try refreshing the report
- Check browser console for JavaScript errors
- Charts may not render in some older browsers
- Export PDF includes chart images as fallback

ISSUE: "Cannot edit or delete saved properties"
SOLUTION:
- Verify you're signed in with the account that created the property
- Properties are private to creator - you cannot edit others' properties
- Check that property details panel is open
- Refresh page if edit/delete buttons not appearing
- Contact administrator if you need to modify another valuer's data

================================================================================
END OF DOCUMENT
================================================================================

This comprehensive guide covers all aspects of the GSP.NET Valuation Toolbox. 
For additional support, feature requests, or to report issues, refer to the 
system documentation or contact the development team.

The valuation system is designed to support professional valuers in creating 
defensible, repeatable valuations while maintaining complete data privacy and 
workflow efficiency.

Last Updated: 2024
Version: 2.0 (Detailed Edition)

## 3D_Condominium_Registration_Guide.txt

### Overview
GSP.NET includes a comprehensive 3D Condominium property management system. This tool allows users to register multi-level buildings, customize floors, import CSV coordinates for both the building footprint and individual units, define amenities, and instantly visualize the entire structure in a fully interactive 3D environment. 

### Step-by-Step Registration Wizard (7 Steps)
To register a new condominium building, open the **3D Condominium Panel** by clicking the 🏢 (Building) icon in the main toolbar, then click the **New Condominium** tab. Follow these 7 steps:

**1. Property Information:** Enter the building name, prefix, plot ID, block, and select the location (District, County, Sub-county, Parish, Village).
**2. Building Footprint:** Upload a CSV containing the external boundary of the building. 
   - CSV Format Required: `point,easting,northing`
   - Select the correct Coordinate Reference System (e.g., Arc 1960 UTM Zone 36N).
   - Once imported, the footprint polygon will automatically appear on the map.
**3. Vertical Configuration:** Define the building's height and structure. Enter the number of floors above ground, number of basements (below ground), and the standard floor height in meters (e.g., 3 meters).
**4. Images:** Upload facade photographs or architectural renders of the building.
**5. Units Registration:** Upload a CSV containing the coordinates for each individual unit/apartment inside the building.
   - CSV Format Required: `floor,unit,point,easting,northing,description`
   - The tool will automatically parse the file, calculate the area/perimeter of each unit based on the shoelace formula, and organize them by floor. Click "Plot" on a unit to verify its shape on the map.
**6. Unit Attributes:** For every registered unit, define its details: Type (Commercial, Residential, Mixed), Status (Sold, Available, Rented), Room Counts (Bedrooms, Bathrooms, En-suite, Sitting Rooms), Amenities (Kitchen, Balcony, Store Room, Servant Quarters, Garage) and Owner Information.
**7. Review & Save:** Review all imported data. Click **Save Condominium** to store the building and all units securely into the unified cloud database.

### Viewing and Searching 3D Condominiums
- **Search Tab:** To find a registered building, open the 🏢 panel and click the **Search** tab. Type the building name, prefix, or plot ID. Results will appear instantly. Clicking "View on Map" will auto-pan and zoom to the building.
- **Interactive 3D View:** Click on any condominium footprint directly on the 2D map, or use the Search tab, to open the **3D View**. In the 3D Viewer:
   - Use your mouse to rotate (drag), pan (right-click drag), and zoom (scroll) around the 3D model.
   - Use the **Floor Slider** to slice the building vertically and inspect specific floor plans.
   - Hover and click on individual units within the 3D model to see a pop-up card detailing its attributes, owner info, and calculated area.
