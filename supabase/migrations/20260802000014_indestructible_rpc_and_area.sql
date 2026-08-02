-- 1. Create the most indestructible sequence generator ever conceived.
-- This uses SPLIT_PART and REGEXP_REPLACE to forcefully extract only the digits after the first hyphen.
CREATE OR REPLACE FUNCTION public.generate_polygon_unique_id(layer_name TEXT)
RETURNS TEXT AS $$
DECLARE
    v_prefix TEXT;
    v_max INT;
    v_new_val INT;
    v_new_id TEXT;
BEGIN
    v_prefix := CASE layer_name 
        WHEN 'UNTITLED UTM ZONE 36S' THEN 'UT36S'
        WHEN 'UNTITLED UTM ZONE 36N' THEN 'UT36N'
        WHEN 'TITLE TRACTS UTM ZONE 36S' THEN 'TT36S'
        WHEN 'TITLE TRACTS UTM ZONE 36N' THEN 'TT36N'
        WHEN 'BLB-UNTITLED' THEN 'BLB'
        ELSE 'POLY'
    END;

    SELECT current_val INTO v_max FROM public.layer_sequences WHERE prefix = v_prefix FOR UPDATE;
    
    IF NOT FOUND THEN
        -- Absolutely indestructible regex: split on hyphen, take the 2nd part, strip ALL non-digits, cast to INT.
        SELECT COALESCE(MAX(
            NULLIF(REGEXP_REPLACE(SPLIT_PART(unique_id, '-', 2), '[^0-9]', '', 'g'), '')::INT
        ), 0)
        INTO v_max
        FROM public.polygon_features
        WHERE unique_id LIKE v_prefix || '-%';
        
        INSERT INTO public.layer_sequences (prefix, current_val) VALUES (v_prefix, v_max);
    END IF;

    v_new_val := v_max + 1;
    UPDATE public.layer_sequences SET current_val = v_new_val WHERE prefix = v_prefix;
    v_new_id := v_prefix || '-' || lpad(v_new_val::TEXT, 3, '0');
    
    RETURN v_new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Forcefully reset the cache right now using the exact same indestructible logic!
DO $$
DECLARE
  v_true_max INT;
BEGIN
  SELECT COALESCE(MAX(
      NULLIF(REGEXP_REPLACE(SPLIT_PART(unique_id, '-', 2), '[^0-9]', '', 'g'), '')::INT
  ), 0)
  INTO v_true_max
  FROM public.polygon_features
  WHERE unique_id LIKE 'TT36N-%';

  UPDATE public.layer_sequences SET current_val = v_true_max WHERE prefix = 'TT36N';
  IF NOT FOUND THEN
    INSERT INTO public.layer_sequences (prefix, current_val) VALUES ('TT36N', v_true_max);
  END IF;
END;
$$;

-- 3. Update save_parcels to calculate exact accurate Area and Vertices using PostGIS!
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
BEGIN
  FOR v_parcel IN SELECT * FROM jsonb_array_elements(p_parcels)
  LOOP
    v_unique_id := public.generate_polygon_unique_id(p_layer_name);

    -- Build geometry
    v_geom := ST_SetSRID(ST_GeomFromGeoJSON(v_parcel->>'geometry'), 4326);
    
    -- Calculate precise area in hectares using PostGIS Geography (on the spheroid)
    v_area := ST_Area(v_geom::geography) / 10000.0;
    
    -- Calculate exact number of vertices (ignoring the duplicated closing vertex)
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
      v_count := v_count + 1;
    EXCEPTION WHEN unique_violation THEN
      RETURN jsonb_build_object('savedCount', 0, 'error', 'Duplicate key collision on ID: ' || v_unique_id);
    END;
  END LOOP;

  RETURN jsonb_build_object('savedCount', v_count);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Reload PostgREST
NOTIFY pgrst, 'reload schema';
