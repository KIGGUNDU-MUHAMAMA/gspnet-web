-- Fix save_parcels to properly extract all metadata and avoid hardcoding coordinate_system to EPSG:4326
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

    WHILE NOT v_success AND v_attempts < 20 LOOP
      v_attempts := v_attempts + 1;
      
      -- Generate ID
      v_unique_id := public.generate_polygon_unique_id(p_layer_name);

      -- Build geometry and calculate metrics
      v_geom := ST_SetSRID(ST_GeomFromGeoJSON(v_parcel->>'geometry'), 4326);
      v_area := ST_Area(v_geom::geography) / 10000.0;
      v_vertices := ST_NPoints(v_geom) - 1;

      BEGIN
        INSERT INTO public.polygon_features (
          unique_id, 
          layer_name, 
          client, 
          project_name, 
          district, 
          surveyor, 
          supervisor,
          coordinate_system, 
          parent_parcel_id, 
          geometry, 
          area_hectares, 
          num_vertices, 
          created_by,
          company,
          county,
          block_number,
          plot_number,
          additional_info,
          edge_distances
        ) VALUES (
          v_unique_id, 
          p_layer_name, 
          p_form_data->>'client', 
          p_form_data->>'projectName', 
          p_form_data->>'district', 
          p_form_data->>'surveyor', 
          p_form_data->>'supervisor', 
          COALESCE(p_form_data->>'coordinateSystem', 'EPSG:4326'), 
          p_parent_id,
          v_geom, 
          COALESCE((v_parcel->>'area_hectares')::numeric, v_area), 
          COALESCE((v_parcel->>'num_vertices')::int, v_vertices), 
          p_user_id,
          p_form_data->>'company',
          p_form_data->>'county',
          p_form_data->>'blockNumber',
          COALESCE(p_form_data->>'plotNumber', v_parcel->>'parcelId'),
          p_form_data->>'additionalInfo',
          (v_parcel->>'edge_distances')::jsonb
        );
        
        v_success := TRUE;
        v_count := v_count + 1;
        
      EXCEPTION WHEN unique_violation THEN
        -- Retry on duplicate ID
      END;
    END LOOP;

    IF NOT v_success THEN
      RETURN jsonb_build_object('savedCount', v_count, 'error', 'Failed to generate a unique ID after 20 attempts. Last attempted: ' || v_unique_id);
    END IF;
  END LOOP;

  RETURN jsonb_build_object('savedCount', v_count);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix the coordinate_system for recently added polygons that got EPSG:4326 by mistake
UPDATE public.polygon_features
SET coordinate_system = CASE 
    WHEN layer_name LIKE '%36N%' THEN 'EPSG:32636'
    WHEN layer_name LIKE '%36S%' THEN 'EPSG:32736'
    WHEN layer_name = 'BLB-UNTITLED' THEN 'EPSG:32636'
    ELSE 'EPSG:32636'
END
WHERE coordinate_system = 'EPSG:4326' AND layer_name != 'POLY';

NOTIFY pgrst, 'reload schema';
