# Geospatial Network Uganda (GSP.NET) - Complete AI Assistant Knowledge Base

> **AI INSTRUCTION:** You are the official AI Assistant for GSP.NET (geospatialnetworkug.xyz). Answer ONLY using the information in this document. Be concise, professional, and use Markdown formatting. Do not invent features or tools not listed here.

---

## 1. About GSP.NET & Core Architecture
**GSP.NET** is Uganda's premier web-based Cadastral & Geospatial Intelligence platform, unifying the entire surveying workflow from raw data ingestion to professional reporting.
- **Authorship:** Led by **Kiggundu Muhamad** of N.A.S. Surveyors Ltd under the guidance of **Surveyor R.S.U. Katabu Simon**.
- **Tech Stack:** OpenLayers 9 (2D), CesiumJS & Three.js (3D), Supabase & PostgreSQL (Backend), Cloudflare Workers (Edge Computing), jsPDF & Chart.js (Reporting).
- **Core Mission:** To eliminate redundant surveys, safely archive cadastral data, and empower professionals with real-time collaboration tools.

---

## 2. User Accounts, Roles, & The Clerk Function

### How to Create an Account (Step-by-Step)
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

### Coordinate Search & Extractor
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

---

## 5. 3D Condominium Module
GSP.NET fully supports vertical property registration (Condominiums).
- **Importance:** As urban density increases, 2D mapping fails to represent stacked property ownership. The 3D Condominium module solves this by mapping individual units on specific floors.
- **How to use:** Use the Building icon to start a "New Condominium". Follow the 7-step wizard: Property Info, Building Footprint (CSV), Vertical Configuration (floors/heights), Facade Images, Units Registration (CSV of unit coordinates), Unit Attributes, and Save. 
- **Viewing:** Click on a condominium footprint to open the 3D viewer. Use the Floor Slider to slice through the building and inspect individual units.

---

## 6. The Mathematics Behind GSP.NET (Survey-Grade Math)

GSP.NET does not use standard, inaccurate web-mapping formulas (like Haversine). It uses strict survey-grade math:

- **Distance Calculations:** Uses the **Vincenty Inverse Formula** on the WGS84 ellipsoid. This computes exact geodesic edge distances, achieving accuracy of **±0.5 mm**.
- **Area Computations:** Standard spherical area calculations yield up to 0.8% error near the equator. GSP.NET solves this by projecting coordinates from WGS84 (Lat/Lng) to the correct local UTM Cartesian plane (e.g., UTM Zone 36N). It then applies the **Shoelace Formula** to calculate the planar area. This yields <0.01% error compared to AutoCAD.
- **Interpolation Methods (DTMs):**
  - **TIN (Triangulated Irregular Network):** Uses Delaunay triangulation for sharp, realistic terrain generation.
  - **IDW (Inverse Distance Weighting):** Uses Power=2 (Smooth) or Power=4 (Sharp) to estimate unknown grid points based on the weighted distance of known points.
- **Volume Calculations (Earthworks):** To compute Cut/Fill volumes or Stockpiles, the system integrates the volume delta between the generated DTM surface mesh and a user-defined reference plane or a secondary comparison DTM surface.
- **Property Valuation Algorithm:** Uses **Distance-Weighted Averaging**. The system queries historical sales comparables within a defined radius, applying a mathematical weight based on the proximity to the subject property to auto-calculate the estimated value.

---

## 7. GSP SurveySync Plugins

GSP SurveySync is a real-time data bridge between professional desktop surveying software (QGIS and AutoCAD/Civil 3D) and the GSPNET cloud webmap. It eliminates manual file transfer — polygons drawn in the field are broadcast live to the webmap for immediate review and database saving.

**How to access downloads:** Click the **PLUGINS** button in the navigation bar on the login page (`index.html`). A professional modal opens with two tabs — one for each plugin.

---

### 7.1 QGIS Plugin (v3.0)

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

### 7.2 AutoCAD / Civil 3D Plugin (v2.0)

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

### 7.3 Typical End-to-End Workflow

**QGIS → Webmap:**
Field surveyor loads reference layer → fills project details → draws parcels → clicks Send All → webmap reviewer sees live polygons → saves all to database.

**AutoCAD → CSV:**
Open drawing → type GSPEXPORT → select closed parcels → save CSV → CSV has all coordinates in standard format, ready for import into any GIS or survey system.

---

### 7.4 Troubleshooting

| Problem | Solution |
|---------|---------|
| QGIS plugin not visible after install | Restart QGIS; check *Plugins → Manage* that GSP SurveySync is enabled |
| "Must be logged in to save" on webmap | Log in to GSPNET on the webmap first, then re-send from QGIS |
| AutoCAD command not recognised | Verify the `.bundle` folder is in the correct `ApplicationPlugins` path and AutoCAD was restarted |
| Open polylines skipped by GSPEXPORT | Close them first using `PEDIT → Close` or redraw as closed polygons |
| Webmap save panel not appearing | Check internet connection; Supabase Realtime must be connected |
| Send button disabled in QGIS | Complete Step 2 (project details) first, then click Start Editing |
