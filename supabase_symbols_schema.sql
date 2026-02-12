-- ============================================
-- Symbols Library Database Schema
-- ============================================
-- This schema supports a QGIS-like collaborative mapping feature
-- with point/line/polygon features, rich symbol catalog, and community flagging.

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================
-- 1. SYMBOL CATALOG TABLE
-- ============================================
-- Stores rich symbol presets (similar to QGIS symbol library)
CREATE TABLE IF NOT EXISTS public.symbol_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol_key TEXT UNIQUE NOT NULL, -- e.g., "tree_deciduous", "road_major", "building_residential"
  category TEXT NOT NULL, -- "point", "line", "polygon"
  name TEXT NOT NULL, -- Display name, e.g., "Tree (Deciduous)"
  description TEXT,
  svg TEXT, -- SVG icon (for points only, single-color for tinting)
  default_style JSONB NOT NULL, -- Default style (color, size, stroke, fill, opacity, dash)
  tags TEXT[], -- Search tags
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_symbol_catalog_category ON public.symbol_catalog(category);
CREATE INDEX IF NOT EXISTS idx_symbol_catalog_key ON public.symbol_catalog(symbol_key);

-- ============================================
-- 2. MAP FEATURES TABLE
-- ============================================
-- Stores user-created point/line/polygon features
CREATE TABLE IF NOT EXISTS public.map_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol_key TEXT NOT NULL REFERENCES public.symbol_catalog(symbol_key) ON DELETE RESTRICT,
  geom geometry(Geometry, 4326) NOT NULL, -- PostGIS geometry (EPSG:4326)
  geom_type TEXT NOT NULL CHECK (geom_type IN ('Point', 'LineString', 'Polygon')),
  name TEXT,
  description TEXT,
  status TEXT DEFAULT 'existing' CHECK (status IN ('existing', 'proposed', 'demolished', 'under_construction')),
  style JSONB, -- Per-feature style overrides (merged with default_style)
  metadata JSONB, -- Additional user data
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_map_features_geom ON public.map_features USING GIST(geom);
CREATE INDEX IF NOT EXISTS idx_map_features_user ON public.map_features(user_id);
CREATE INDEX IF NOT EXISTS idx_map_features_symbol ON public.map_features(symbol_key);
CREATE INDEX IF NOT EXISTS idx_map_features_type ON public.map_features(geom_type);

-- ============================================
-- 3. FEATURE FLAGS TABLE
-- ============================================
-- Community flagging for quality control
CREATE TABLE IF NOT EXISTS public.feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_id UUID NOT NULL REFERENCES public.map_features(id) ON DELETE CASCADE,
  flagged_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (reason IN ('wrong_location', 'wrong_type', 'duplicate', 'outdated', 'needs_review', 'other')),
  comment TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_feature_flags_feature ON public.feature_flags(feature_id);
CREATE INDEX IF NOT EXISTS idx_feature_flags_flagged_by ON public.feature_flags(flagged_by);
CREATE INDEX IF NOT EXISTS idx_feature_flags_status ON public.feature_flags(status);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.symbol_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.map_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

-- Symbol Catalog: Authenticated users can read
DROP POLICY IF EXISTS "symbol_catalog_select" ON public.symbol_catalog;
CREATE POLICY "symbol_catalog_select" ON public.symbol_catalog
  FOR SELECT TO authenticated USING (true);

-- Map Features: Authenticated users can read all
DROP POLICY IF EXISTS "map_features_select" ON public.map_features;
CREATE POLICY "map_features_select" ON public.map_features
  FOR SELECT TO authenticated USING (true);

-- Map Features: Users can insert their own
DROP POLICY IF EXISTS "map_features_insert" ON public.map_features;
CREATE POLICY "map_features_insert" ON public.map_features
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Map Features: Users can update their own
DROP POLICY IF EXISTS "map_features_update" ON public.map_features;
CREATE POLICY "map_features_update" ON public.map_features
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Map Features: Users can delete their own
DROP POLICY IF EXISTS "map_features_delete" ON public.map_features;
CREATE POLICY "map_features_delete" ON public.map_features
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Feature Flags: Authenticated users can read all
DROP POLICY IF EXISTS "feature_flags_select" ON public.feature_flags;
CREATE POLICY "feature_flags_select" ON public.feature_flags
  FOR SELECT TO authenticated USING (true);

-- Feature Flags: Authenticated users can insert (flag any feature)
DROP POLICY IF EXISTS "feature_flags_insert" ON public.feature_flags;
CREATE POLICY "feature_flags_insert" ON public.feature_flags
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = flagged_by);

-- Feature Flags: Users can update flags they created
DROP POLICY IF EXISTS "feature_flags_update" ON public.feature_flags;
CREATE POLICY "feature_flags_update" ON public.feature_flags
  FOR UPDATE TO authenticated USING (auth.uid() = flagged_by);

-- ============================================
-- RPC FUNCTIONS
-- ============================================

-- Get features within bbox (with buffer support)
CREATE OR REPLACE FUNCTION public.get_features_bbox(
  min_lon DOUBLE PRECISION,
  min_lat DOUBLE PRECISION,
  max_lon DOUBLE PRECISION,
  max_lat DOUBLE PRECISION,
  lim INTEGER DEFAULT 1000
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  -- Build GeoJSON FeatureCollection
  SELECT json_build_object(
    'type', 'FeatureCollection',
    'features', COALESCE(json_agg(feature), '[]'::json)
  ) INTO result
  FROM (
    SELECT json_build_object(
      'type', 'Feature',
      'id', f.id,
      'geometry', ST_AsGeoJSON(f.geom)::json,
      'properties', json_build_object(
        'user_id', f.user_id,
        'symbol_key', f.symbol_key,
        'geom_type', f.geom_type,
        'name', f.name,
        'description', f.description,
        'status', f.status,
        'style', f.style,
        'metadata', f.metadata,
        'created_at', f.created_at,
        'updated_at', f.updated_at
      )
    ) AS feature
    FROM public.map_features f
    WHERE ST_Intersects(
      f.geom,
      ST_MakeEnvelope(min_lon, min_lat, max_lon, max_lat, 4326)
    )
    LIMIT lim
  ) sub;
  
  RETURN result;
END;
$$;

-- Insert new map feature from GeoJSON
CREATE OR REPLACE FUNCTION public.insert_map_feature(
  geom_geojson JSON,
  geom_type TEXT,
  symbol_key TEXT,
  name TEXT DEFAULT NULL,
  description TEXT DEFAULT NULL,
  status TEXT DEFAULT 'existing',
  style JSONB DEFAULT NULL,
  metadata JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_id UUID;
  geom_wkt geometry;
BEGIN
  -- Convert GeoJSON to PostGIS geometry
  geom_wkt := ST_SetSRID(ST_GeomFromGeoJSON(geom_geojson::text), 4326);
  
  -- Insert feature
  INSERT INTO public.map_features (
    user_id, symbol_key, geom, geom_type, name, description, status, style, metadata
  ) VALUES (
    auth.uid(), symbol_key, geom_wkt, geom_type, name, description, status, style, metadata
  ) RETURNING id INTO new_id;
  
  RETURN new_id;
END;
$$;

-- Update existing map feature
CREATE OR REPLACE FUNCTION public.update_map_feature(
  feature_id UUID,
  geom_geojson JSON DEFAULT NULL,
  name TEXT DEFAULT NULL,
  description TEXT DEFAULT NULL,
  status TEXT DEFAULT NULL,
  style JSONB DEFAULT NULL,
  metadata JSONB DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  geom_wkt geometry;
  current_user_id UUID;
BEGIN
  current_user_id := auth.uid();
  
  -- Check ownership
  IF NOT EXISTS (
    SELECT 1 FROM public.map_features 
    WHERE id = feature_id AND user_id = current_user_id
  ) THEN
    RAISE EXCEPTION 'Not authorized to update this feature';
  END IF;
  
  -- Convert GeoJSON if provided
  IF geom_geojson IS NOT NULL THEN
    geom_wkt := ST_SetSRID(ST_GeomFromGeoJSON(geom_geojson::text), 4326);
  END IF;
  
  -- Update feature (only update provided fields)
  UPDATE public.map_features
  SET
    geom = COALESCE(geom_wkt, geom),
    name = COALESCE(update_map_feature.name, map_features.name),
    description = COALESCE(update_map_feature.description, map_features.description),
    status = COALESCE(update_map_feature.status, map_features.status),
    style = COALESCE(update_map_feature.style, map_features.style),
    metadata = COALESCE(update_map_feature.metadata, map_features.metadata),
    updated_at = NOW()
  WHERE id = feature_id;
  
  RETURN TRUE;
END;
$$;

-- ============================================
-- SEED DATA: Rich Symbol Catalog
-- ============================================

-- Clean existing data (optional, for fresh install)
-- DELETE FROM public.symbol_catalog;

-- POINT SYMBOLS
INSERT INTO public.symbol_catalog (symbol_key, category, name, description, svg, default_style, tags) VALUES
('tree_deciduous', 'point', 'Tree (Deciduous)', 'Deciduous tree', 
  '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="6"/><rect x="10" y="14" width="4" height="10"/></svg>',
  '{"color": "#22c55e", "size": 24, "opacity": 1.0}'::jsonb,
  ARRAY['tree', 'vegetation', 'nature']),
  
('tree_evergreen', 'point', 'Tree (Evergreen)', 'Evergreen tree',
  '<svg viewBox="0 0 24 24"><path d="M12 2 L18 10 L16 10 L20 16 L14 16 L16 22 L8 22 L10 16 L4 16 L8 10 L6 10 Z"/></svg>',
  '{"color": "#059669", "size": 24, "opacity": 1.0}'::jsonb,
  ARRAY['tree', 'vegetation', 'nature']),

('utility_pole', 'point', 'Utility Pole', 'Electricity or telecom pole',
  '<svg viewBox="0 0 24 24"><rect x="10" y="2" width="4" height="20"/><line x1="6" y1="8" x2="18" y2="8" stroke-width="2"/></svg>',
  '{"color": "#78716c", "size": 20, "opacity": 1.0}'::jsonb,
  ARRAY['utility', 'infrastructure', 'pole']),

('manhole', 'point', 'Manhole', 'Sewer or utility access',
  '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="3"/></svg>',
  '{"color": "#44403c", "size": 18, "opacity": 1.0}'::jsonb,
  ARRAY['utility', 'infrastructure', 'sewer']),

('water_well', 'point', 'Water Well', 'Water source',
  '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 8 Q10 12 12 16 Q14 12 12 8"/></svg>',
  '{"color": "#0ea5e9", "size": 22, "opacity": 1.0}'::jsonb,
  ARRAY['water', 'well', 'source']),

('bench', 'point', 'Bench', 'Seating',
  '<svg viewBox="0 0 24 24"><rect x="4" y="10" width="16" height="3"/><rect x="6" y="13" width="2" height="6"/><rect x="16" y="13" width="2" height="6"/></svg>',
  '{"color": "#92400e", "size": 18, "opacity": 1.0}'::jsonb,
  ARRAY['furniture', 'seating', 'urban']),

('street_light', 'point', 'Street Light', 'Public lighting',
  '<svg viewBox="0 0 24 24"><rect x="11" y="8" width="2" height="14"/><circle cx="12" cy="6" r="3"/></svg>',
  '{"color": "#fbbf24", "size": 20, "opacity": 1.0}'::jsonb,
  ARRAY['lighting', 'street', 'urban']),

('parking', 'point', 'Parking', 'Parking area marker',
  '<svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><text x="12" y="16" text-anchor="middle" font-size="12" font-weight="bold">P</text></svg>',
  '{"color": "#3b82f6", "size": 24, "opacity": 1.0}'::jsonb,
  ARRAY['parking', 'transport', 'urban'])
ON CONFLICT (symbol_key) DO NOTHING;

-- LINE SYMBOLS
INSERT INTO public.symbol_catalog (symbol_key, category, name, description, svg, default_style, tags) VALUES
('road_major', 'line', 'Road (Major)', 'Primary road or highway',
  NULL,
  '{"strokeColor": "#dc2626", "strokeWidth": 4, "strokeOpacity": 1.0, "strokeDash": null}'::jsonb,
  ARRAY['road', 'highway', 'transport']),

('road_minor', 'line', 'Road (Minor)', 'Secondary or local road',
  NULL,
  '{"strokeColor": "#fb923c", "strokeWidth": 2, "strokeOpacity": 1.0, "strokeDash": null}'::jsonb,
  ARRAY['road', 'street', 'transport']),

('footpath', 'line', 'Footpath', 'Walking path or trail',
  NULL,
  '{"strokeColor": "#854d0e", "strokeWidth": 1.5, "strokeOpacity": 1.0, "strokeDash": [5, 5]}'::jsonb,
  ARRAY['path', 'trail', 'walking']),

('railway', 'line', 'Railway', 'Train tracks',
  NULL,
  '{"strokeColor": "#1f2937", "strokeWidth": 3, "strokeOpacity": 1.0, "strokeDash": [10, 5]}'::jsonb,
  ARRAY['railway', 'train', 'transport']),

('powerline', 'line', 'Power Line', 'Electrical transmission',
  NULL,
  '{"strokeColor": "#7c2d12", "strokeWidth": 2, "strokeOpacity": 1.0, "strokeDash": [8, 4]}'::jsonb,
  ARRAY['power', 'electricity', 'utility']),

('fence', 'line', 'Fence', 'Property boundary fence',
  NULL,
  '{"strokeColor": "#44403c", "strokeWidth": 1.5, "strokeOpacity": 1.0, "strokeDash": [3, 3]}'::jsonb,
  ARRAY['fence', 'boundary', 'property']),

('stream', 'line', 'Stream', 'Small watercourse',
  NULL,
  '{"strokeColor": "#0284c7", "strokeWidth": 2.5, "strokeOpacity": 0.8, "strokeDash": null}'::jsonb,
  ARRAY['water', 'stream', 'river']),

('pipeline', 'line', 'Pipeline', 'Water or gas pipeline',
  NULL,
  '{"strokeColor": "#6b7280", "strokeWidth": 2, "strokeOpacity": 1.0, "strokeDash": [6, 6]}'::jsonb,
  ARRAY['pipeline', 'utility', 'infrastructure'])
ON CONFLICT (symbol_key) DO NOTHING;

-- POLYGON SYMBOLS
INSERT INTO public.symbol_catalog (symbol_key, category, name, description, svg, default_style, tags) VALUES
('building_residential', 'polygon', 'Building (Residential)', 'House or residential building',
  NULL,
  '{"fillColor": "#fbbf24", "fillOpacity": 0.4, "strokeColor": "#92400e", "strokeWidth": 2, "strokeOpacity": 1.0}'::jsonb,
  ARRAY['building', 'residential', 'house']),

('building_commercial', 'polygon', 'Building (Commercial)', 'Shop, office, or commercial building',
  NULL,
  '{"fillColor": "#3b82f6", "fillOpacity": 0.4, "strokeColor": "#1e40af", "strokeWidth": 2, "strokeOpacity": 1.0}'::jsonb,
  ARRAY['building', 'commercial', 'office']),

('building_industrial', 'polygon', 'Building (Industrial)', 'Factory or warehouse',
  NULL,
  '{"fillColor": "#6b7280", "fillOpacity": 0.4, "strokeColor": "#1f2937", "strokeWidth": 2, "strokeOpacity": 1.0}'::jsonb,
  ARRAY['building', 'industrial', 'factory']),

('waterbody', 'polygon', 'Water Body', 'Lake, pond, or reservoir',
  NULL,
  '{"fillColor": "#0ea5e9", "fillOpacity": 0.5, "strokeColor": "#0284c7", "strokeWidth": 1.5, "strokeOpacity": 1.0}'::jsonb,
  ARRAY['water', 'lake', 'pond']),

('forest', 'polygon', 'Forest', 'Wooded area',
  NULL,
  '{"fillColor": "#22c55e", "fillOpacity": 0.4, "strokeColor": "#15803d", "strokeWidth": 1.5, "strokeOpacity": 0.8}'::jsonb,
  ARRAY['forest', 'vegetation', 'trees']),

('grassland', 'polygon', 'Grassland', 'Open grass area',
  NULL,
  '{"fillColor": "#84cc16", "fillOpacity": 0.3, "strokeColor": "#4d7c0f", "strokeWidth": 1, "strokeOpacity": 0.7}'::jsonb,
  ARRAY['grass', 'field', 'vegetation']),

('agricultural', 'polygon', 'Agricultural Land', 'Farmland or cropland',
  NULL,
  '{"fillColor": "#fde047", "fillOpacity": 0.35, "strokeColor": "#a16207", "strokeWidth": 1.5, "strokeOpacity": 0.8}'::jsonb,
  ARRAY['agriculture', 'farm', 'crop']),

('parking_lot', 'polygon', 'Parking Lot', 'Vehicle parking area',
  NULL,
  '{"fillColor": "#9ca3af", "fillOpacity": 0.4, "strokeColor": "#4b5563", "strokeWidth": 1.5, "strokeOpacity": 1.0}'::jsonb,
  ARRAY['parking', 'transport', 'urban'])
ON CONFLICT (symbol_key) DO NOTHING;

-- ============================================
-- COMPLETION MESSAGE
-- ============================================
DO $$
BEGIN
  RAISE NOTICE 'Symbols Library schema created successfully!';
  RAISE NOTICE 'Tables: symbol_catalog, map_features, feature_flags';
  RAISE NOTICE 'RPC Functions: get_features_bbox, insert_map_feature, update_map_feature';
  RAISE NOTICE 'Seed data: % symbols loaded', (SELECT COUNT(*) FROM public.symbol_catalog);
END $$;
