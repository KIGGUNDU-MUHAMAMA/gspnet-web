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
-- ST_MakeValid can sometimes return a MultiPolygon when fixing a broken
-- Polygon ring. We use a CASE expression to handle both outcomes:
--   - If the repair result is still a Polygon → use it directly
--   - If it became a MultiPolygon → extract the sub-polygon with the
--     largest area (ST_GeometryN on the result of ST_DumpPoints is complex,
--     so we use a lateral trick with generate_series)
UPDATE public.polygon_features
SET geometry = (
    CASE
        WHEN ST_GeometryType(ST_MakeValid(geometry)) = 'ST_Polygon'
            THEN ST_MakeValid(geometry)
        WHEN ST_GeometryType(ST_MakeValid(geometry)) IN ('ST_MultiPolygon', 'ST_GeometryCollection')
            THEN (
                -- Extract the single sub-geometry with the largest area
                SELECT ST_GeometryN(ST_MakeValid(pf2.geometry), n)
                FROM public.polygon_features pf2,
                     generate_series(1, ST_NumGeometries(ST_MakeValid(pf2.geometry))) AS n
                WHERE pf2.id = polygon_features.id
                  AND ST_GeometryType(ST_GeometryN(ST_MakeValid(pf2.geometry), n)) = 'ST_Polygon'
                ORDER BY ST_Area(ST_GeometryN(ST_MakeValid(pf2.geometry), n)) DESC
                LIMIT 1
            )
        ELSE geometry  -- leave unchanged if repair fails unexpectedly
    END
)
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

