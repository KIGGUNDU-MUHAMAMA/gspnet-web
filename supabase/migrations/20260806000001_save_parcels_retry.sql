-- The ultimate fail-safe save_parcels RPC with an internal collision-retry loop.
-- If an ID already exists for ANY bizarre reason (local testing, database inconsistencies, manual inserts),
-- this function will simply catch the duplicate key error, instantly increment the ID, and try again!

CREATE OR REPLACE FUNCTION public.save_parcels(
  p_layer_name TEXT,
  p_parcels JSONB, 
  p_user_id UUID,
  p_form_data JSONB,
  p_parent_id UUID DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_unique_id TEXT;
  v_parcel JSONB;
  v_count INT := 0;
  v_geom GEOMETRY;
  v_area NUMERIC;
  v_vertices INT;
  v_success BOOLEAN;
  v_attempts INT;
BEGIN
  FOR v_parcel IN SELECT * FROM jsonb_array_elements(p_parcels)
  LOOP
    v_success := FALSE;
    v_attempts := 0;

    -- Retry loop: if we hit a duplicate key, we just ask for the next ID and try again, up to 20 times.
    WHILE NOT v_success AND v_attempts < 20 LOOP
      v_attempts := v_attempts + 1;
      
      -- Generate ID (this state is preserved even if the insert below fails)
      v_unique_id := public.generate_polygon_unique_id(p_layer_name);

      -- Build geometry and calculate metrics
      v_geom := ST_SetSRID(ST_GeomFromGeoJSON(v_parcel->>'geometry'), 4326);
      v_area := ST_Area(v_geom::geography) / 10000.0;
      v_vertices := ST_NPoints(v_geom) - 1;

      BEGIN
        INSERT INTO public.polygon_features (
          unique_id, layer_name, client, project_name, district, surveyor, supervisor,
          coordinate_system, parent_parcel_id, geometry, area_hectares, num_vertices, created_by
        ) VALUES (
          v_unique_id, 
          p_layer_name, 
          p_form_data->>'client', 
          p_form_data->>'projectName', 
          p_form_data->>'district', 
          p_form_data->>'surveyor', 
          p_form_data->>'supervisor', 
          'EPSG:4326', 
          p_parent_id,
          v_geom, 
          v_area, 
          v_vertices, 
          p_user_id
        );
        
        -- If we reach here, the insert succeeded!
        v_success := TRUE;
        v_count := v_count + 1;
        
      EXCEPTION WHEN unique_violation THEN
        -- The insert failed due to a duplicate key.
        -- We do nothing here! The loop will restart, generate the NEXT ID, and try again.
      END;
    END LOOP;

    IF NOT v_success THEN
      -- If it fails 20 times in a row, something is deeply wrong.
      RETURN jsonb_build_object('savedCount', v_count, 'error', 'Failed to generate a unique ID after 20 attempts. Last attempted: ' || v_unique_id);
    END IF;
  END LOOP;

  RETURN jsonb_build_object('savedCount', v_count);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Reload schema cache to apply immediately
NOTIFY pgrst, 'reload schema';
