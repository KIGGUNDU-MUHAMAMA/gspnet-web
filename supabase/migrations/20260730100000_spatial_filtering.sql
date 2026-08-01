-- ============================================================
-- Migration: Fix unclosed polygon rings (IllegalArgumentException)
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Enable PostGIS if not already enabled
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create spatial index for fast bounding box queries on polygon_features
CREATE INDEX IF NOT EXISTS polygon_features_geom_idx
ON public.polygon_features USING GIST (geometry);

-- Step 1: Repair simple cases — unclosed rings and minor topology errors
-- where ST_MakeValid still returns a clean Polygon.
UPDATE public.polygon_features
SET geometry = ST_MakeValid(geometry)
WHERE NOT ST_IsValid(geometry)
  AND ST_GeometryType(ST_MakeValid(geometry)) = 'ST_Polygon';

-- Step 2: For rows where ST_MakeValid produced a MultiPolygon or
-- GeometryCollection, extract the largest polygon sub-part by area.
-- The EXISTS guard ensures we only update rows that actually have at
-- least one recoverable polygon part — prevents NULL constraint violation.
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
  AND ST_GeometryType(ST_MakeValid(pf.geometry)) IN ('ST_MultiPolygon', 'ST_GeometryCollection')
  AND EXISTS (
    -- Only proceed if there is at least one polygon part to recover
    SELECT 1
    FROM ST_Dump(ST_MakeValid(pf2.geometry)) dp2
    WHERE ST_GeometryType((dp2).geom) = 'ST_Polygon'
  );

-- Step 3: Archive completely irreparable geometries — rows where
-- ST_MakeValid produced only Points/Lines (no polygon parts at all).
-- These cannot be displayed on a map and are hidden from users.
-- They are NOT deleted so the data record is preserved.
UPDATE public.polygon_features
SET is_archived = true
WHERE NOT ST_IsValid(geometry)
  AND NOT EXISTS (
    SELECT 1
    FROM ST_Dump(ST_MakeValid(geometry)) dp
    WHERE ST_GeometryType((dp).geom) = 'ST_Polygon'
  );

-- Step 4: RPC function to fetch polygons within a bounding box extent.
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
