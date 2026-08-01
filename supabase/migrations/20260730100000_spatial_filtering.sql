-- ============================================================
-- Migration: Fix unclosed polygon rings (IllegalArgumentException)
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Enable PostGIS if not already enabled
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create spatial index for fast bounding box queries on polygon_features
CREATE INDEX IF NOT EXISTS polygon_features_geom_idx 
ON public.polygon_features USING GIST (geometry);

-- Step 1: Permanently repair all broken geometries in the table.
-- This fixes unclosed rings, self-intersections, and other topology
-- issues that cause the "Points of LinearRing do not form a closed
-- linestring" error from PostGIS GEOS.
UPDATE public.polygon_features
SET geometry = ST_MakeValid(geometry)
WHERE NOT ST_IsValid(geometry);

-- Step 2: Replace the RPC function to also guard future bad geometries
-- by wrapping geometry with ST_MakeValid() before calling ST_Intersects.
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
    ST_MakeValid(geometry), 
    ST_MakeEnvelope(min_lon, min_lat, max_lon, max_lat, 4326)
  )
  ORDER BY created_at DESC;
$$;

