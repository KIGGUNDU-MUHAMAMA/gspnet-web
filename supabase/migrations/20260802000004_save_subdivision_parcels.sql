-- Create RPC to save subdivision parcels safely via Database (bypassing edge function deploy limits)

CREATE OR REPLACE FUNCTION public.save_subdivision_parcels(
  p_layer_name TEXT,
  p_parent_unique_id TEXT,
  p_parent_id UUID,
  p_parcels JSONB, 
  p_user_id UUID,
  p_form_data JSONB
) RETURNS JSONB AS $$
DECLARE
  v_child_seq INT := 0;
  v_unique_id TEXT;
  v_parcel JSONB;
  v_count INT := 0;
  v_escaped_parent TEXT;
BEGIN
  -- We need to find the max child seq using regex or simple REPLACE if it's strictly Parent-1
  -- Find max seq number from existing children
  SELECT COALESCE(MAX(NULLIF(regexp_replace(unique_id, '^' || p_parent_unique_id || '-', ''), '')::INT), 0)
  INTO v_child_seq
  FROM public.polygon_features
  WHERE unique_id LIKE p_parent_unique_id || '-%'
  AND unique_id ~ ('^' || p_parent_unique_id || '-[0-9]+$');

  FOR v_parcel IN SELECT * FROM jsonb_array_elements(p_parcels)
  LOOP
    v_child_seq := v_child_seq + 1;
    v_unique_id := p_parent_unique_id || '-' || v_child_seq;

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
      ST_GeomFromGeoJSON(v_parcel->>'geometry'), 
      (v_parcel->>'area_hectares')::NUMERIC, 
      (v_parcel->>'num_vertices')::INT, 
      p_user_id
    );

    v_count := v_count + 1;
  END LOOP;

  RETURN jsonb_build_object('savedCount', v_count);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
