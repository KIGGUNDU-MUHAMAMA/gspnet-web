-- ============================================================
-- Migration: Parcel Archiving & Subdivision Workflow
-- ============================================================

-- 1. Add new columns to polygon_features
ALTER TABLE public.polygon_features
ADD COLUMN IF NOT EXISTS parent_parcel_id UUID REFERENCES public.polygon_features(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS archive_reason TEXT;

-- 2. Add case_type to parcel_cases
ALTER TABLE public.parcel_cases
ADD COLUMN IF NOT EXISTS case_type TEXT NOT NULL DEFAULT 'flag'
CHECK (case_type IN ('flag', 'archive_parcel', 'subdivision'));

-- 3. Create an RPC to quickly check if new geometries overlap with any archived subdivision parcels
CREATE OR REPLACE FUNCTION public.find_intersecting_subdivisions(
    geojson_geometry JSONB,
    current_user_id UUID
)
RETURNS TABLE (
    id UUID,
    unique_id TEXT,
    layer_name TEXT
)
LANGUAGE sql
AS $$
  -- We use ST_Intersects to check overlap between the incoming GeoJSON geometry and existing archived polygons.
  SELECT p.id, p.unique_id, p.layer_name
  FROM public.polygon_features p
  WHERE p.is_archived = true
    AND p.archive_reason = 'Subdivision'
    -- Only suggest parent parcels archived by the same user to prevent crossing projects
    AND p.created_by = current_user_id
    -- Quick bounding box pre-filter using index
    AND p.geometry && ST_GeomFromGeoJSON(geojson_geometry)
    -- Precise intersection check
    AND ST_Intersects(p.geometry, ST_GeomFromGeoJSON(geojson_geometry))
    AND ST_IsValid(p.geometry)
  LIMIT 1;
$$;
