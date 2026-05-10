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
