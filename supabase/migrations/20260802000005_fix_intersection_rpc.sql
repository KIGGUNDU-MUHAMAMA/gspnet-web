-- Fix the intersection RPC to handle JSONB to text conversion, SRID setting, and proper ordering

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
  SELECT p.id, p.unique_id, p.layer_name
  FROM public.polygon_features p
  WHERE p.is_archived = true
    AND p.archive_reason = 'Subdivision'
    AND p.created_by = current_user_id
    AND p.geometry && ST_SetSRID(ST_GeomFromGeoJSON(geojson_geometry::text), 4326)
    AND ST_Intersects(p.geometry, ST_SetSRID(ST_GeomFromGeoJSON(geojson_geometry::text), 4326))
    AND ST_IsValid(p.geometry)
  ORDER BY p.updated_at DESC
  LIMIT 1;
$$;
