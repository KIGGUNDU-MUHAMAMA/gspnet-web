-- ============================================================
-- Migration: Fix unclosed polygon rings (IllegalArgumentException)
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Enable PostGIS if not already enabled
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create spatial index for fast bounding box queries on polygon_features
CREATE INDEX IF NOT EXISTS polygon_features_geom_idx
ON public.polygon_features USING GIST (geometry);

-- Step 1: Repair rows where geometry is still a plain Polygon after ST_MakeValid.
-- This covers the common case (unclosed ring, minor topology error).
UPDATE public.polygon_features
SET geometry = ST_MakeValid(geometry)
WHERE NOT ST_IsValid(geometry)
  AND ST_GeometryType(ST_MakeValid(geometry)) = 'ST_Polygon';

-- Step 2: For rows where ST_MakeValid produced a MultiPolygon or
-- GeometryCollection, extract the largest polygon sub-part by area.
-- ST_Dump explodes any geometry into its component parts, letting us
-- pick the biggest polygon with a simple ORDER BY / LIMIT.
UPDATE public.polygon_features pf
SET geometry = (
  SELECT (dp).geom
  FROM ST_Dump(ST_MakeValid(pf2.geometry)) dp
  WHERE pf2.id = pf.id
    AND ST_GeometryType((dp).geom) = 'ST_Polygon'
  ORDER BY ST_Area((dp).geom) DESC
  LIMIT 1
)
FROM public.polygon_features pf2
WHERE pf2.id = pf.id
  AND NOT ST_IsValid(pf.geometry)
  AND ST_GeometryType(ST_MakeValid(pf.geometry)) IN ('ST_MultiPolygon', 'ST_GeometryCollection');

-- Step 3: RPC function to fetch polygons within a bounding box extent.
-- ST_IsValid guard prevents any remaining bad rows from crashing GEOS.
CREATE OR REPLACE FUNCTION public.get_polygons_in_extent(
  min_lon float,
  min_lat float,
  max_lon float,
  max_lat float,
  target_layer text
)
RETURNS SETOF public.polygon_features
LANGUAGE sql
AS $$
  SELECT *
  FROM public.polygon_features
  WHERE layer_name = target_layer
    AND is_archived = false
    AND ST_IsValid(geometry)
    AND ST_Intersects(
      geometry,
      ST_MakeEnvelope(min_lon, min_lat, max_lon, max_lat, 4326)
    )
  ORDER BY created_at DESC;
$$;
