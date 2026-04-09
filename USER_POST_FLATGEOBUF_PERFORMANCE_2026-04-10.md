## FlatGeobuf Performance Upgrade Is Live in GSP.NET

We have deployed a major performance upgrade for **GSPNET LAYERS** and **NLIS LAYERS** in the Layer Switcher.

### What improved

- Faster first response when turning layers on.
- Smoother map interaction at medium and far zoom levels.
- Reduced browser lag on heavy district/block datasets.

### What changed under the hood

- Added **bbox-based FlatGeobuf loading** and immediate source refresh on toggle.
- Added a **fast first paint** window (quick boundary render first, full detail next).
- Added **style caching** for heavy edge labels and corner marker rendering.
- Added **zoom-gated detail rendering** so expensive distance and marker detail appears only when zoomed in close.
- Added **layer switcher warmup prefetch** to reduce first-hit latency.
- Added **interaction gates** to avoid expensive GSPNET snapping/feature-info work at far zoom.

### Recommended user workflow

1. Zoom or search to area of interest first.
2. Open the Layer Switcher and toggle only the needed heavy layers.
3. Zoom in closer to view advanced edge-distance and vertex detail.

### Cloudflare readiness

For best results, keep `.fgb` traffic proxied in Cloudflare, enable cache rules for `.fgb`, and preserve byte-range support (`Accept-Ranges: bytes`) with proper CORS headers.

Thank you for building with GSP.NET.
