-- ============================================================
-- Migration: Fix polygon loading errors for all layers
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Enable PostGIS if not already enabled
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create spatial index for fast bounding box queries on polygon_features
CREATE INDEX IF NOT EXISTS polygon_features_geom_idx
ON public.polygon_features USING GIST (geometry);

-- Update the RPC function to use the && bounding-box operator.
--
-- WHY: The previous version used ST_Intersects() which calls the GEOS
-- library internally. GEOS crashes on geometries with unclosed rings
-- (stored from old imports), producing:
--   "Points of LinearRing do not form a closed linestring XX000"
--
-- The && operator ONLY compares bounding boxes using the spatial index.
-- It never calls GEOS, so it cannot crash on invalid geometry data.
-- It is also faster because it uses the GIST index directly.
-- The client already does its own precise polygon-in-extent check,
-- so a bbox pre-filter on the server is all we need here.
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
    AND geometry && ST_MakeEnvelope(min_lon, min_lat, max_lon, max_lat, 4326)
  ORDER BY created_at DESC;
$$;

-- ============================================================
-- OPTIONAL: If you still see errors on specific polygons whose
-- geometry is completely unrepairable, you can archive them by
-- running this separate query in the SQL editor:
--
-- UPDATE public.polygon_features
-- SET is_archived = true
-- WHERE id = 'ea2fe006-89f4-4a65-952f-6341d95a2a69';
--
-- This hides the broken record from the map without deleting it.
-- ============================================================
