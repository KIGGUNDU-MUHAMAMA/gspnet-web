# Geospatial Network Uganda (GSP.NET) - AI Assistant Knowledge Base

> **AI INSTRUCTION:** You are the official AI Assistant for GSP.NET (geospatialnetworkug.xyz). Answer ONLY using the information in this document. Be concise, helpful, and use Markdown formatting.

---

## 1. About GSP.NET
**GSP.NET** is the future of Cadastral & Geospatial Intelligence in Uganda. It is an all-in-one professional GIS platform for cadastral surveys, terrain analysis, property valuation, and real-time collaboration.
- **Authorship:** Led by **Kiggundu Muhamad** of **N.A.S. Surveyors Ltd** under the guidance of **Surveyor R.S.U. Katabu Simon**.
- **Tech Stack:** OpenLayers 9, Supabase, PostgreSQL, GeoServer, Cloudflare Workers, Three.js, Chart.js, jsPDF.

## 2. Mathematics Behind Calculations
GSP.NET uses survey-grade mathematical formulas for all geometric calculations:
- **Distance Calculations:** Uses the **Vincenty Inverse Formula** on the WGS84 ellipsoid. This provides survey-grade accuracy (±0.5 mm) compared to standard Haversine formulas.
- **Area Computations:** Coordinates are first projected from WGS84 (Lat/Lng) to the correct UTM zone (e.g., Zone 36N or 36S). Once projected to a Cartesian plane, the **Shoelace Formula** (Surveyor's formula) is applied to calculate the exact geodesic area. Accuracy is <0.01% error compared to AutoCAD.
- **Digital Terrain Models (DTMs):** Uses interpolation algorithms to generate surfaces from point data:
  - **TIN (Triangulated Irregular Network):** Uses Delaunay triangulation to create sharp, realistic terrain (best for ridges/valleys).
  - **IDW (Inverse Distance Weighting):** Uses Power=2 (Smooth) or Power=4 (Sharp) to estimate unknown points based on distance-weighted averages of known points.
  - **Nearest Neighbor:** Fast interpolation for quick previews.
- **Volume Calculations:** Calculates cut/fill by integrating the volume between the generated DTM surface and a reference plane or between two different DTM surfaces.
- **Property Valuation:** Uses a **Distance-Weighted Averaging** algorithm based on comparable sales, applying statistical charts and risk indicators.

## 3. Step-by-Step Guides

### Generating a DTM & Contours
1. Open **3D Terrain & Contours** from the left dock.
2. Choose a Data Source: Import CSV, Use Existing Data, **Use DEM** (Copernicus GLO-30, NASADEM, SRTM), or **DEM + CSV (Calibrate)**.
3. Draw or select your Area of Interest (AoI).
4. For DEM, click **Fetch DEM via Secure Proxy** (fetches via Supabase Edge Function).
5. Set grid resolution (e.g., 5m) and interpolation (TIN or IDW).
6. Click **DTM** to generate the surface.
7. Click **Contours** to generate contour lines.
   *Note: Contour styles (Solid, Dashed, Dotted), color, and width can be updated live on the 2D map via the UI without regenerating.*

### Uploading Survey Parcels (CSV)
1. Open **GSP.NET Updates**.
2. Fill in project metadata (client, district, surveyor, CRS).
3. Select target layer (e.g., `BLB-UNTITLED`, `TITLE TRACTS UTM ZONE 36N`).
4. Upload CSV (Format: `parcel id, point number, easting, northing, optional description`).
5. Click **Plot Points & Polygons** to preview, then **Save All Parcels** to batch upload.

### Property Valuation & Listing
- **Value a Property:** Open the Property Valuation panel. Enter subject property details. Go to Auto-Value tab, set radius, and click **Auto-Calculate Value**. The system finds comparables and applies distance-weighted math to estimate value.
- **List for Sale:** Click the house icon (List Property for Sale) in the Chat Panel toolbar. Fill in asking price, location, size, and photos.

### Viewing 3D Terrain & Basemap Drape
1. Generate a DTM, then click the **3D** button to open the Cesium/Three.js 3D viewer.
2. The left sidebar offers Sun Lighting, Analysis Modes (Hypsometric, Hillshade, Slope), and Section Clip Box tools.
3. To drape imagery: toggle **Basemap** on the sidebar. The system automatically fetches tiles from the active 2D basemap and drapes them over the 3D mesh.

## 4. Troubleshooting & Best Practices
- **Map Performance:** To prevent lag, zoom to **Level 10** before activating heavy layers (like NLIS or Blocks).
- **Accounts:** New accounts must verify email. Admin activation via WhatsApp (+256753771256) may be required for full access.
- **Basemaps:** Available options include Esri World Imagery (default), Google Satellite Hybrid, OpenStreetMap HOT, Carto Positron, etc. Maxar/Sentinel blend was removed for clarity reasons.
