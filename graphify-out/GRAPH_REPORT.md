# Graph Report - .  (2026-05-10)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 329 nodes · 492 edges · 26 communities (20 shown, 6 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 12 edges (avg confidence: 0.82)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `43c47adc`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]

## God Nodes (most connected - your core abstractions)
1. `showMessage()` - 19 edges
2. `init()` - 14 edges
3. `renderDXF()` - 9 edges
4. `setStatus()` - 9 edges
5. `openCAD()` - 8 edges
6. `initMap()` - 8 edges
7. `initSymbolsLibrary()` - 7 edges
8. `clearStatus()` - 7 edges
9. `Deployment Documentation` - 7 edges
10. `parseDXF()` - 6 edges

## Surprising Connections (you probably didn't know these)
- `Valuation Dashboard Screenshot` --conceptually_related_to--> `Deployment Documentation`  [INFERRED]
  assets/valuation_dashboard.png → docs/DEPLOYMENT.md
- `Victoria Sugar Logo` --conceptually_related_to--> `Deployment Documentation`  [INFERRED]
  assets/icons/logo.png → docs/DEPLOYMENT.md
- `Deployment Documentation` --references--> `VSL Schema SQL`  [EXTRACTED]
  docs/DEPLOYMENT.md → sql/001_vsl_schema.sql
- `Deployment Documentation` --references--> `App Configuration`  [EXTRACTED]
  docs/DEPLOYMENT.md → config/app-config.js
- `FlatGeobuf Performance Upgrade` --semantically_similar_to--> `Land Clerk System`  [INFERRED] [semantically similar]
  USER_POST_FLATGEOBUF_PERFORMANCE_2026-04-10.md → webmap.html

## Communities (26 total, 6 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.07
Nodes (54): buildLabelTextStyle(), clearDrawingSnapping(), collectPointSnapSources(), createLineStyle(), createPointStyle(), createPolygonStyle(), deleteFeature(), deleteFeatureConfirm() (+46 more)

### Community 1 - "Community 1"
Cohesion: 0.06
Nodes (32): baseLayers, basemapSelect, blocksLayer, blocksSource, cfg, coordLat, coordLon, coordSearchBtn (+24 more)

### Community 2 - "Community 2"
Cohesion: 0.14
Nodes (31): boot(), buildLayer(), getCADFile(), handleFile(), hideModal(), initBadge(), initCADClose(), initDrop() (+23 more)

### Community 3 - "Community 3"
Cohesion: 0.08
Nodes (26): API_KEY, area, { bbox, demtype }, CORS_HEADERS, DEM_SOURCES, triedSources, admin, ALLOWED_LAYERS (+18 more)

### Community 4 - "Community 4"
Cohesion: 0.07
Nodes (14): BASEMAPS, captures, captureViewpoint(), container, existingWidget, launchBtn, loading, modal (+6 more)

### Community 5 - "Community 5"
Cohesion: 0.12
Nodes (6): _addFloorLabel(), buildFromData(), _fitCameraToBuilding(), normalizeForViewer(), _onClick(), _selectUnit()

### Community 6 - "Community 6"
Cohesion: 0.15
Nodes (16): email, forgotBtn, handleForgotPassword(), handleSignIn(), handleSignUp(), newEmail, newPassword, password (+8 more)

### Community 7 - "Community 7"
Cohesion: 0.12
Nodes (17): App Configuration, Authentication Module, CesiumJS Globe Engine, Cloudflare Pages Deployment, Cloudflare Image Upload Worker, CSV Template, Deployment Documentation, Land Registrations Table (+9 more)

### Community 8 - "Community 8"
Cohesion: 0.21
Nodes (12): blurGrid(), distance(), generateContours(), getEdgeKeys(), mergeLineEndpoints(), perpendicularDistance(), simplifyDouglasPeucker(), traceContourFromEdge() (+4 more)

### Community 9 - "Community 9"
Cohesion: 0.29
Nodes (3): computeArea(), constructor(), JRJPdfGenerator

### Community 10 - "Community 10"
Cohesion: 0.25
Nodes (8): applyRoleUi(), bindUi(), createBaseLayers(), initMap(), initUser(), populateBasemapSelect(), setupPopup(), start()

### Community 11 - "Community 11"
Cohesion: 0.25
Nodes (8): GSP.NET — Geospatial Network Uganda, AI Assistant Knowledge Base, GSP.NET Chatbot Knowledge Base, FIG FFPLA Report Alignment Outline, GSP.NET Professional GIS Login, N.A.S. Surveyors Ltd, Privacy & Data Protection Notice, Supabase SMTP + Domain Auth Setup

### Community 12 - "Community 12"
Cohesion: 0.29
Nodes (6): cellAddress, cellRef, fs, range, workbook, XLSX

### Community 13 - "Community 13"
Cohesion: 0.33
Nodes (5): createSupabaseClient(), getConfig(), FlatGeobuf Performance Upgrade, Cloudflare Upload System, Land Clerk System

### Community 14 - "Community 14"
Cohesion: 0.4
Nodes (5): Land Administration System Diagram, Real-time Sync Engine, Real-time Synchronization Workflow, Terrain Analysis Module, Terrain Analysis Visualization

### Community 15 - "Community 15"
Cohesion: 0.4
Nodes (5): Terrain Analysis Report, Data Protection and Privacy Act, 2019 (Uganda), Geospatial Network Uganda, NAS Surveyors Ltd, Basemap Upgrades 2026-04-10

### Community 16 - "Community 16"
Cohesion: 0.67
Nodes (3): loadLayersFromDb(), saveGeometry(), toGeoJsonFeature()

### Community 17 - "Community 17"
Cohesion: 0.67
Nodes (3): drawGeometry(), startMeasure(), stopCurrentInteraction()

### Community 18 - "Community 18"
Cohesion: 0.67
Nodes (3): Victoria Sugar Sign In, Victoria Sugar Project README, Victoria Sugar Limited

## Knowledge Gaps
- **112 isolated node(s):** `captures`, `BASEMAPS`, `overlay`, `modal`, `loading` (+107 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `init()` connect `Community 2` to `Community 9`, `Community 5`, `Community 6`?**
  _High betweenness centrality (0.333) - this node is a cross-community bridge._
- **Why does `submitFlag()` connect `Community 0` to `Community 1`?**
  _High betweenness centrality (0.253) - this node is a cross-community bridge._
- **Why does `constructor()` connect `Community 9` to `Community 2`, `Community 5`?**
  _High betweenness centrality (0.240) - this node is a cross-community bridge._
- **What connects `captures`, `BASEMAPS`, `overlay` to the rest of the system?**
  _112 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.07 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.14 - nodes in this community are weakly interconnected._