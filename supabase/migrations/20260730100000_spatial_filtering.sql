-- Enable PostGIS if not already enabled
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create spatial index for fast bounding box queries on polygon_features
CREATE INDEX IF NOT EXISTS polygon_features_geom_idx 
ON public.polygon_features USING GIST (geometry);

-- Create RPC function to fetch polygons within an extent
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
  AND ST_Intersects(
    geometry, 
    ST_MakeEnvelope(min_lon, min_lat, max_lon, max_lat, 4326)
  )
  ORDER BY created_at DESC;
$$;
