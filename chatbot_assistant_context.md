# Geospatial Network Uganda (GSP.NET) - Complete AI Assistant Knowledge Base

> **AI INSTRUCTION:** You are the official AI Assistant for GSP.NET (geospatialnetworkug.xyz). Answer ONLY using the information in this document. Be concise, professional, and use Markdown formatting. Do not invent features or tools not listed here. **When answering "how-to" questions or explaining features, ALWAYS check if a relevant Video Tutorial link is available in the documentation and provide it to the user at the end of your response.** Key platform features include: 2D/3D mapping, DTM/Contour generation, Satellite Analytics (NDVI/NDMI/NDRE/NDWI from Sentinel-2), 3D Condominium module, SurveySync Plugins, and professional PDF reporting.

---

## 1. About GSP.NET & Core Architecture
**GSP.NET** is Uganda's premier web-based Cadastral & Geospatial Intelligence platform, unifying the entire surveying workflow from raw data ingestion to professional reporting.
- **Video Tutorial:** [LOCATING GEOSPATIALNETWORKUG WEBMAP](https://youtu.be/ut-tX7GDSFs?si=yh7OfeQRXt5aavJ5)
- **Video Tutorial:** [FEATURES ON GEOSPATIALNETWORKUG LOGIN PAGE](https://youtu.be/RXAnJtH8RH4?si=pLLizJ-W97oJwDxO)
- **Authorship:** Led by **Kiggundu Muhamad** of N.A.S. Surveyors Ltd under the guidance of **Surveyor R.S.U. Katabu Simon**.
- **Tech Stack:** OpenLayers 9 (2D), CesiumJS & Three.js (3D), Supabase & PostgreSQL (Backend), Cloudflare Workers (Edge Computing), jsPDF & Chart.js (Reporting).
- **Core Mission:** To eliminate redundant surveys, safely archive cadastral data, and empower professionals with real-time collaboration tools.

---

## 2. User Accounts, Roles, & The Clerk Function

### How to Create an Account (Step-by-Step)
- **Video Tutorial:** [SIGN UP AND CREATING ACCOUNT IN GEOSPATIALNETWORKUG](https://youtu.be/smPQolHA3uw?si=3PcbLJGdvPVFbYet)

1. Navigate to the login page (`index.html`).
2. Fill in your email, set a secure password, and select your **Account Type** (Role).
3. Click "Create Professional Account".
4. **Important:** A verification email is sent automatically. You must click the verification link in your email (check Spam/Junk) before logging in.
5. Some accounts require **Admin Activation** to access advanced tools. You can request activation via WhatsApp to the Admin (+256753771256).

### Platform Roles
- **General User (Land Surveyor):** The standard professional role. Can access NLIS data, create subdivisions, perform boundary openings, and map untitled land (bibanja).
- **Valuation Surveyor:** Has access to the private Valuation Dashboard to store comparables, run auto-valuations, and generate professional PDF reports.
- **Land Clerk:** A critical administrative role. The Clerk tracks land transactions, registers buyers for untitled bibanja parcels, manages land administration duties, and ensures data entered into the system matches the legal paper trail. This function is vital for maintaining the chain of custody for untitled land.
- **RSU (Registered Surveyor of Uganda):** A restricted, high-level role acting as an independent reviewer for parcel corroboration, quality assurance, and technical dispute resolution.

---

## 3. Map Interaction & Toolsets

- **Video Tutorial:** [HOW TO LOGIN, USES OF PARCEL SEARCH, LOCATE, PRINT, AND INFO BUTTON IN GEOSPATIALNETWORKUG](https://youtu.be/jbEN4PoLUQ0?si=lW-vHT9JPQ3oqtCq)
- **Video Tutorial:** [PURPOSE OF LAYER SWITCHER, PROJECT LIBRARY, SYMBOLS, COORDSEARCH, EXTRACTOR, GSPNET UPDATES AND 3D CONDO](https://youtu.be/2c7-Y2ZbgrE?si=UxHZ6YRyqf3QF2Y6)

### GSP.NET Assist (The Floating Action Button)
The GSP.NET Assist button acts as a floating command center. It provides:
- **File Uploads (CSV, DXF, DWG, GeoJSON):** Allows surveyors to instantly overlay CAD/survey data onto the map. The system automatically detects coordinate systems (like Arc 1960 UTM Zone 36N) and reprojects them to WGS84 for web rendering.
- **Drawing Tools:** Offers point, line, and polygon drawing features. It includes advanced snapping (vertex and edge) to ensure new subdivisions perfectly align with existing boundaries.
- **Measurement Tools:** Allows you to measure distances and calculate polygon areas on the fly. 

### CAD Integration & DXF Interpolation
GSP.NET includes a powerful native **CAD Inspector** for working directly with CAD files:
- **Interpolation:** When uploading DXF files, the system parses the raw CAD entities and interpolates complex geometries (like arcs and splines) into web-compatible Vector geometries (LineStrings/Polygons).
- **Direct Rendering:** DXF files are rendered locally via a blazing-fast Canvas2D engine, while complex DWG files utilize a secure cloud-based ShareCAD integration via Supabase.
- **How to Use (Tracing & Digitizing):** Once a DXF/DWG is uploaded, the entities are overlaid onto the map. The system automatically attaches a **Snapping Interaction** to these CAD lines, allowing you to use the Drawing Tools to flawlessly trace survey polygons over the CAD geometry, extract the coordinates, or save them directly into the database.

### GSP Rover (Field Survey Mode)
GSP Rover transforms your mobile device or PC into a professional GNSS surveying tool by connecting directly to external high-precision GNSS receivers (e.g., Emlid, Trimble, u-blox) or utilizing your device's internal GPS.

**Importance:**
Standard web maps rely on low-accuracy phone GPS (±5 meters), which is insufficient for cadastral boundaries. GSP Rover bridges the gap by allowing you to connect survey-grade RTK rovers via Bluetooth or USB to the web browser, bringing centimeter-level accuracy directly into GSP.NET.

**How to Use (Step-by-Step Guide):**
1. Click the **GSP ROVER** button in the top navigation panel.
2. In the GNSS Connection panel, choose your data source:
   - **Internal Phone GPS**: Uses your device's built-in location.
   - **External Receiver (USB/Bluetooth)**: Connects to a professional RTK GNSS receiver.
3. If using an **External Receiver**:
   - Ensure your receiver is turned on and paired with your device.
   - Click **"Connect External Device"**.
   - A browser popup will appear. On PC, select the virtual COM port for your receiver. On mobile (Android Chrome), select your paired Bluetooth device (SPP) or USB OTG adapter.
   - The connection receives NMEA data via Web Serial API.
4. Once connected, your high-precision coordinates will appear in the panel (Latitude, Longitude, Altitude, Satellites, and Accuracy).
5. The crosshair on the map will now track your position using the external RTK data, allowing you to walk boundaries or capture high-precision points!

### Coordinate Search & Extractor
- **Video Tutorial:** [LOCATE AND COORD SEARCH BUTTON FUNCTIONALITY. HOW TO USE](https://youtu.be/Qm-I5EgVPKc?si=CSHWqerhAq_m9z3a)
- **Video Tutorial:** [COORD SEARCH AND INFO BUTTON WORK FLOWS](https://youtu.be/RLen8aigI5w?si=7IOG3nbwFk4yzGgS)
- **Video Tutorial:** [EXTRACTOR BUTTON FOR GEOTIFF, PNG AND JPG SATELLITE IMAGES EXPORT](https://youtu.be/8luK0ke1bFQ?si=MbbaGnL5Ad4qLHQV)
- **Video Tutorial:** [EXTRACTOR FOR DXF, GEOJSON AND KML IN SELECTED COORDINATE SYSTEM](https://youtu.be/wuXveXzZUzs?si=1xXrHO2eesIXalJ0)

- **Coordinate Search:** Navigate to an exact point on Earth. Select your CRS (e.g., Arc 1960 UTM Zone 36N), enter Eastings/Northings, and the map instantly flies to that coordinate.
- **Coordinate Extractor:** A reverse tool. Click anywhere on the map, or select a drawn polygon, to extract its coordinates into a formatted table (CSV/Excel) for export directly to field controllers or AutoCAD.

### Project Library
A centralized repository for surveyors to save and manage their datasets. You can query past projects by District, Nature of Survey, Project Name, or Date Range. This ensures field data is never lost and can be reloaded to the map at any time.

### Symbols Library
A massive collaborative cartographic catalog featuring 240+ standardized symbols (transport, utilities, hydrology, QA flags). 
- **How to use:** Open the Symbols Library, select a category, and click the map to place a symbol. 
- **Collaboration:** Symbols placed on the map are visible to all users (collaborative mode), enabling real-time multi-user mapping and quality control.

---

## 4. Terrain Intelligence & 3D Tools

### Generating DTMs (Digital Terrain Models)
1. Open the **3D Terrain & Contours** toolbox.
2. **Data Source:** You can upload your own XYZ CSV, or select **"Use DEM"** to fetch cloud elevation data via Supabase Edge Functions (Copernicus GLO-30, NASADEM, SRTM). You can also use **DEM + CSV (Calibrate)** to calibrate cloud DEMs with your local survey control points.
3. Set grid resolution (e.g., 5m) and select an interpolation method.
4. Click **DTM** to generate.

### Contours, Profiles, and Cross-Sections
- **Contours:** Click the Contours button after DTM generation. You can live-edit contour styles (Solid, Dashed, Dotted), widths, and colors directly from the UI without regenerating.
- **Profiles & Cross-Sections:** Draw an alignment line across the map. The system samples elevations along the line and generates a graphical profile chart showing elevation vs. distance. 
- **Terrain Analysis:** Calculates slope (steepness), aspect (direction), and classifies terrain features (peaks, valleys, ridges).

### Cesium 3D Viewer & Exports
Clicking **"3D"** after DTM generation opens an interactive Cesium/Three.js 3D Viewer.
- **Features:** It includes sun lighting simulation, analysis modes (Hypsometric, Hillshade, Slope), a Section Clip Box to slice the terrain, and 3D distance measurements.
- **Basemap Draping:** Toggle "Basemap" to automatically drape the current 2D satellite imagery directly over the 3D mesh.
- **3D Exports:** You can capture viewpoints and export them as a professional **3D PDF**, or export the raw 3D mesh as STL, OBJ, GeoTIFF, or LAS.
- **Sentinel Satellite Analytics (NEW):** The 3D Terrain panel includes a dedicated **"Satellite Analytics"** section (Section 12 in the left panel). This allows surveyors to load real Sentinel-2 multispectral imagery and compute vegetation, moisture, and water index statistics directly over the active project area. See **Section 5** below for full details and step-by-step instructions.

---

## 5. Sentinel Satellite Analytics

GSP.NET integrates directly with the **Copernicus Data Space Ecosystem (CDSE)** to compute and visualise **Sentinel-2 multispectral vegetation and moisture indices** over any user-defined area of interest (AOI). This is found inside the **3D Terrain panel → Section 12: Satellite Analytics**.

### What It Does
- Fetches real Sentinel-2 Level-2A satellite imagery over your AOI from ESA's Copernicus archive.
- Computes four key indices as time-series statistics:
  - **NDVI** — Normalised Difference Vegetation Index (vegetation density & health)
  - **NDMI** — Normalised Difference Moisture Index (vegetation water stress)
  - **NDRE** — Normalised Difference Red-Edge Index (chlorophyll and crop stress)
  - **NDWI** — Normalised Difference Water Index (open water and flooding)
- Displays results as an **interactive time-series chart** and a **statistics table** (Min, Max, Mean, Scenes).
- Allows surveyors to overlay the spectral layer live on the 2D map and drape it on the **Cesium 3D terrain**.
- Generates a professional **multi-page A4 PDF Surveyor Report** with a cover page, statistics, interpretation notes, chart, and map snapshots.

### System Limits (Token Conservation)
| Limit | Value |
|---|---|
| Maximum AOI area | **50 km²** |
| Maximum date range | **2 years** |
| Minimum time interval | **10 days (P10D)** |
| WMS map preview minimum zoom | **Zoom level 12** |

---

### Step-by-Step: Using Satellite Analytics (Under 3D Terrain)

**Step 1 — Open the 3D Terrain Panel**
1. In the main webmap, locate the right-side toolbar and click the **3D Terrain** button (mountain icon).
2. The 3D Terrain panel opens on the left side of the screen.
3. Scroll down inside the panel until you reach **Section 12: Satellite Analytics**.
4. Click the section header to expand it.

**Step 2 — Define Your Area of Interest (AOI)**

You must define an AOI before running analytics. You have two options:

- **Option A — Draw a Polygon:** Click **"✏ Draw AOI"**. Click on the map to place vertices and **double-click** to finish. The drawn polygon becomes your AOI. A size check confirms it is within the 50 km² limit.
- **Option B — Use DTM Extent:** Click **"Use DTM Extent"**. The system automatically uses your existing terrain project boundary (or the current map view if no terrain extent exists) as the AOI.
- To remove the AOI and start over, click **"Clear AOI"**.

The AOI area is confirmed in the status indicator (e.g., `✓ 12.45 km²`).

**Step 3 — Configure the Satellite Layer**
1. In the **Spectral Index** dropdown, choose which index to display:
   - `TRUE_COLOR` — Natural colour satellite view
   - `FALSE_COLOR` — Colour Infrared (CIR) for vegetation assessment
   - `NDVI` — Vegetation health map
   - `NDMI` — Moisture stress map
   - `NDWI` — Water/flooding extent map
   - `SWIR` — Short-Wave Infrared for soil and geology
2. Set the **Date Range** (From / To) for the satellite imagery. Dates should not exceed a 2-year window.
3. Adjust the **Cloud Cover** slider (default 20%). Lower values return clearer scenes; higher values increase data availability in cloudy regions.
4. Adjust the **Opacity** slider to blend the satellite layer with the basemap.
5. Click **"Show Layer"** to load the satellite imagery onto the map. The layer will only display at **Zoom Level 12 or higher** to conserve API tokens.
6. To update the layer after changing dates or index, click **"Apply"**.

**Step 4 — Generate Time-Series Analytics**
1. Ensure your AOI is set (Step 2) and your date range is configured (Step 3).
2. Select a **Time Interval** from the dropdown:
   - `10-day (P10D)` — Most detailed, best for short date ranges
   - `16-day (P16D)` — Default, good balance of detail and token use
   - `1-month (P1M)` — Best for long date ranges (> 1 year)
3. Click **"Generate Analytics"**. A loading spinner will appear — this calls the CDSE Statistics API via a secure Supabase Edge Function. Typical response time is 15–45 seconds depending on AOI size and date range.
4. Once complete, the following appear automatically:
   - **Time-Series Chart** — Interactive Chart.js line chart showing NDVI, NDMI, NDRE, NDWI over time. Click legend entries to toggle individual indices on/off.
   - **Statistics Summary Table** — Shows Min, Max, Mean, and number of Scenes for each index.

**Step 5 — Capture Map Snapshots for Report**
1. With the satellite layer showing on the map, click **"📷 Capture Map Snapshot"**.
2. The system captures the current map view as an image and adds it to the **Snapshot Strip** below the button.
3. Switch to a different spectral index (e.g., from NDVI to NDMI), apply the layer, and capture again.
4. Repeat for each layer you want in the report. You can remove any snapshot by clicking the **×** on its thumbnail.

**Step 6 — Generate the PDF Surveyor Report**
1. Click **"⬇ Download Surveyor Report (PDF)"**.
2. A professional multi-page A4 PDF is generated containing:
   - **Page 1: Cover Page** — Project metadata, date range, AOI area, resolution, and index descriptions. Black & white for clean printing.
   - **Page 2: Statistics & Chart** — Full statistics table, per-index interpretation notes (e.g., "High vegetation stress detected"), and the time-series chart.
   - **Subsequent pages: Map Snapshots** — One page per captured snapshot, centred and aspect-ratio preserved with captions.
3. The PDF is automatically named `GSPNET_Satellite_Report_<from>_to_<to>.pdf` and downloaded to your browser's download folder.

**Step 7 — View on 3D Terrain (Optional)**
1. After setting up the satellite layer, open the **Cesium 3D Viewer** by clicking the **3D** button.
2. The active Sentinel imagery is automatically draped over the 3D terrain mesh, giving a stunning 3D perspective on vegetation health, moisture patterns, or flooding.
3. You can rotate, tilt, and zoom the 3D globe to inspect the index from any angle.

---

### Common Questions

**Q: Why does the satellite layer not appear on the map?**
A: The Sentinel WMS layer only loads at **Zoom Level 12 or higher** to conserve processing tokens. Zoom in further on your project area and it will appear.

**Q: Why does Generate Analytics return no data?**
A: Possible reasons: (1) No AOI is set — draw a polygon or use DTM Extent first. (2) Cloud cover is too low for the region/period — increase the Max Cloud Cover slider. (3) Date range too short — try a longer range. (4) Network error — check your internet connection and try again.

**Q: What are good NDVI values for healthy vegetation in Uganda?**
A: NDVI > 0.6 = Dense healthy forest/vegetation. 0.4–0.6 = Moderate cropland/mixed canopy. 0.2–0.4 = Sparse vegetation/grassland. < 0.2 = Bare soil, urban, or water.

**Q: Can I use this for crop monitoring?**
A: Yes. Set monthly intervals (P1M) over a growing season to track NDVI changes. NDRE is especially useful for detecting nitrogen/chlorophyll deficiencies in crops before they are visible to the naked eye.

**Q: Does using this feature consume tokens/credits?**
A: Yes. Each "Generate Analytics" call uses CDSE Processing Units (PUs). To minimise usage: keep AOI areas small (< 10 km² for maximum savings), use longer intervals (P16D or P1M), and avoid very short date ranges. The map WMS preview is also restricted to Zoom 12+ to avoid unnecessary tile requests.

---

## 6. 3D Condominium Module
GSP.NET fully supports vertical property registration (Condominiums).
- **Importance:** As urban density increases, 2D mapping fails to represent stacked property ownership. The 3D Condominium module solves this by mapping individual units on specific floors.
- **How to use:** Use the Building icon to start a "New Condominium". Follow the 7-step wizard: Property Info, Building Footprint (CSV), Vertical Configuration (floors/heights), Facade Images, Units Registration (CSV of unit coordinates), Unit Attributes, and Save. 
- **Viewing:** Click on a condominium footprint to open the 3D viewer. Use the Floor Slider to slice through the building and inspect individual units.

---

## 7. The Mathematics Behind GSP.NET (Survey-Grade Math)

GSP.NET does not use standard, inaccurate web-mapping formulas (like Haversine). It uses strict survey-grade math:

- **Distance Calculations:** Uses the **Vincenty Inverse Formula** on the WGS84 ellipsoid. This computes exact geodesic edge distances, achieving accuracy of **±0.5 mm**.
- **Area Computations:** Standard spherical area calculations yield up to 0.8% error near the equator. GSP.NET solves this by projecting coordinates from WGS84 (Lat/Lng) to the correct local UTM Cartesian plane (e.g., UTM Zone 36N). It then applies the **Shoelace Formula** to calculate the planar area. This yields <0.01% error compared to AutoCAD.
- **Interpolation Methods (DTMs):**
  - **TIN (Triangulated Irregular Network):** Uses Delaunay triangulation for sharp, realistic terrain generation.
  - **IDW (Inverse Distance Weighting):** Uses Power=2 (Smooth) or Power=4 (Sharp) to estimate unknown grid points based on the weighted distance of known points.
- **Volume Calculations (Earthworks):** To compute Cut/Fill volumes or Stockpiles, the system integrates the volume delta between the generated DTM surface mesh and a user-defined reference plane or a secondary comparison DTM surface.
- **Property Valuation Algorithm:** Uses **Distance-Weighted Averaging**. The system queries historical sales comparables within a defined radius, applying a mathematical weight based on the proximity to the subject property to auto-calculate the estimated value.

---

## 8. GSP SurveySync Plugins

GSP SurveySync is a real-time data bridge between professional desktop surveying software (QGIS and AutoCAD/Civil 3D) and the GSPNET cloud webmap. It eliminates manual file transfer — polygons drawn in the field are broadcast live to the webmap for immediate review and database saving.

**How to access downloads:** Click the **PLUGINS** button in the navigation bar on the login page (`index.html`). A professional modal opens with two tabs — one for each plugin.

---

### 8.1 QGIS Plugin (v3.0)

**What it does:**
- Loads existing NLIS/survey parcels from the GSPNET database into QGIS as a read-only reference layer.
- Lets surveyors draw new parcels inside QGIS, queue them locally, then broadcast the entire batch to the live GSPNET webmap in one click.
- Attaches full project metadata (client, district, surveyor, supervisor, CRS, etc.) to every polygon.

**Installation:**
1. Download `gsp_surveysync_qgis_plugin.zip` from the PLUGINS modal → QGIS Plugin tab.
2. Open QGIS → **Plugins → Manage and Install Plugins → Install from ZIP**.
3. Browse to the downloaded ZIP and click **Install Plugin**.
4. The plugin panel appears in the QGIS toolbar as **GSP SurveySync**.

**Step 1 – Load a Survey Layer:**
1. Open the GSP SurveySync panel in QGIS.
2. Select a layer from the dropdown (e.g. *Kampala NLIS*).
3. Click **⬇ Load Layer into QGIS** — existing parcels load as read-only; they will NOT be re-sent.

**Step 2 – Fill Project Details** *(required before editing)*
Complete all required fields: Client Name, Project Name, Coordinate System, District, Surveyor's Name, Supervisor's Name. Optional: County, Block Number, Plot Number, Company.

**Step 3 – Draw Parcels & Send:**
1. Click **✏ Start Editing**.
2. Use QGIS toolbar → **Add Polygon Feature** (or `Ctrl+.`) to draw each parcel. Right-click to finish each polygon.
3. Polygons queue locally — nothing is sent until you choose to.
4. The Send button shows the count: *📡 Send All (3) to Webmap*.
5. Click **📡 Send All (N) to Webmap** — all parcels broadcast instantly to the live GSPNET webmap.

**Webmap side (what the reviewer does):**
- All sent parcels appear highlighted on the map, labelled #1, #2, #3…
- A batch save panel shows the project details from the field.
- Reviewer clicks **💾 Save All N Parcels** to commit everything to the database, or **✕ Discard** to reject.

**Requirements:** QGIS 3.16+, Windows/macOS/Linux, internet connection, GSPNET account.

---

### 8.2 AutoCAD / Civil 3D Plugin (v2.0)

**What it does:** Adds 3 professional commands to AutoCAD and Civil 3D for exporting parcel coordinates and inserting formatted coordinate tables directly in the drawing.

**Installation:**
1. Download and unzip the AutoCAD plugin from the PLUGINS modal → AutoCAD Plugin tab.
2. Copy the `GSPSurveySync.bundle` folder to: `%APPDATA%\Autodesk\ApplicationPlugins\GSPSurveySync.bundle`
3. Restart AutoCAD. All three commands are immediately available.

**Requirements:** AutoCAD 2018+ or Civil 3D 2018+, Windows 64-bit, .NET Framework 4.x.

---

**Command: GSPEXPORT**
Select closed polylines → label parcel centroids → export a CSV of all coordinates.

Steps:
1. Type `GSPEXPORT` and press `Enter`.
2. Select one or more closed polylines (open polylines are skipped automatically). Press `Enter`.
3. A Save dialog opens — choose a filename and location. Click **Save**.
4. The CSV is written instantly and parcel labels (P001, P002…) are placed at each centroid on layer `GSP-PARCEL-LABELS` (green).

CSV output format:
```
parcel_id,point_number,eastings,northings,description
P001,1,756123.0000,37890.0000,CM1
P001,2,756180.0000,37890.0000,CM2
P001,3,756180.0000,37850.0000,CM3
P001,4,756123.0000,37850.0000,CM4
P001,5,756123.0000,37890.0000,CM1   ← first point repeated to close the parcel
P002,1,756400.0000,38000.0000,CM5
...
```
- `point_number` resets to 1 for each new parcel.
- `description` (CM1, CM2…) is a global counter across all parcels.
- Each parcel automatically closes by repeating its first coordinate at the end.

---

**Command: GSPTABLE**
Insert a formatted coordinate table for one selected parcel.

Steps:
1. Type `GSPTABLE` and press `Enter`.
2. Select one closed polyline. Press `Enter`.
3. Click the insertion point (top-left corner of the table).
4. A formatted table with columns **Mark | Easting | Northing | Elevation** is drawn on layer `GSP-TABLES`.

---

**Command: GSPTABLES**
Batch-insert coordinate tables for multiple parcels in one operation.

Steps:
1. Type `GSPTABLES` and press `Enter`.
2. Select all closed polylines. Press `Enter`.
3. Click the top-left origin point.
4. Tables are stacked downward automatically with a 2-unit gap between each.

---

### 8.3 Typical End-to-End Workflow

**QGIS → Webmap:**
Field surveyor loads reference layer → fills project details → draws parcels → clicks Send All → webmap reviewer sees live polygons → saves all to database.

**AutoCAD → CSV:**
Open drawing → type GSPEXPORT → select closed parcels → save CSV → CSV has all coordinates in standard format, ready for import into any GIS or survey system.

---

### 8.4 Troubleshooting

| Problem | Solution |
|---------|---------|
| QGIS plugin not visible after install | Restart QGIS; check *Plugins → Manage* that GSP SurveySync is enabled |
| "Must be logged in to save" on webmap | Log in to GSPNET on the webmap first, then re-send from QGIS |
| AutoCAD command not recognised | Verify the `.bundle` folder is in the correct `ApplicationPlugins` path and AutoCAD was restarted |
| Open polylines skipped by GSPEXPORT | Close them first using `PEDIT → Close` or redraw as closed polygons |
| Webmap save panel not appearing | Check internet connection; Supabase Realtime must be connected |
| Send button disabled in QGIS | Complete Step 2 (project details) first, then click Start Editing |

---

## 9. Video Tutorials & Media Library
For visual guidance, always provide users with the following relevant video links based on their question:
- **Locating Webmap:** [LOCATING GEOSPATIALNETWORKUG WEBMAP](https://youtu.be/ut-tX7GDSFs?si=yh7OfeQRXt5aavJ5)
- **Login Page Features:** [FEATURES ON GEOSPATIALNETWORKUG LOGIN PAGE](https://youtu.be/RXAnJtH8RH4?si=pLLizJ-W97oJwDxO)
- **Sign Up & Account Creation:** [SIGN UP AND CREATING ACCOUNT IN GEOSPATIALNETWORKUG](https://youtu.be/smPQolHA3uw?si=3PcbLJGdvPVFbYet)
- **Login, Parcel Search, Locate, Print & Info:** [HOW TO LOGIN, USES OF PARCEL SEARCH, LOCATE, PRINT, AND INFO BUTTON](https://youtu.be/jbEN4PoLUQ0?si=lW-vHT9JPQ3oqtCq)
- **Layer Switcher, Project Library, Symbols, 3D Condo, Extractor & Updates:** [PURPOSE OF LAYER SWITCHER, PROJECT LIBRARY, SYMBOLS, COORDSEARCH, EXTRACTOR, GSPNET UPDATES AND 3D CONDO](https://youtu.be/2c7-Y2ZbgrE?si=UxHZ6YRyqf3QF2Y6)
- **Locate and Coord Search Use:** [LOCATE AND COORD SEARCH BUTTON FUNCTIONALITY. HOW TO USE](https://youtu.be/Qm-I5EgVPKc?si=CSHWqerhAq_m9z3a)
- **Coord Search & Info Workflows:** [COORD SEARCH AND INFO BUTTON WORK FLOWS](https://youtu.be/RLen8aigI5w?si=7IOG3nbwFk4yzGgS)
- **Exporting Satellite Images (GeoTIFF/PNG/JPG):** [EXTRACTOR BUTTON FOR GEOTIFF, PNG AND JPG SATELLITE IMAGES EXPORT](https://youtu.be/8luK0ke1bFQ?si=MbbaGnL5Ad4qLHQV)
- **Exporting CAD/GIS Data (DXF/GeoJSON/KML):** [EXTRACTOR FOR DXF, GEOJSON AND KML IN SELECTED COORDINATE SYSTEM](https://youtu.be/wuXveXzZUzs?si=1xXrHO2eesIXalJ0)
- **Satellite Analytics (NDVI/NDMI/NDWI):** No video tutorial yet — refer the user to the step-by-step guide in **Section 5** of this knowledge base.
