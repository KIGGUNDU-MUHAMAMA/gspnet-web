-- Add error handling to save_parcels to explicitly return the failing ID
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
BEGIN
  FOR v_parcel IN SELECT * FROM jsonb_array_elements(p_parcels)
  LOOP
    -- Generate standard sequence ID securely in the DB
    v_unique_id := public.generate_polygon_unique_id(p_layer_name);

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
        ST_SetSRID(ST_GeomFromGeoJSON(v_parcel->>'geometry'), 4326), 
        (v_parcel->>'area_hectares')::NUMERIC, 
        (v_parcel->>'num_vertices')::INT, 
        p_user_id
      );
      v_count := v_count + 1;
    EXCEPTION WHEN unique_violation THEN
      -- If it fails, explicitly return the EXACT ID that caused the conflict!
      RETURN jsonb_build_object('savedCount', 0, 'error', 'Duplicate key collision on ID: ' || v_unique_id);
    END;
  END LOOP;

  RETURN jsonb_build_object('savedCount', v_count);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Force PostgREST cache reload
NOTIFY pgrst, 'reload schema';
