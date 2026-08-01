-- Fix PostgreSQL optimizer pushdown bug where ::INT cast crashes on badly formatted unique_ids
-- by using a CASE statement which guarantees short-circuit evaluation.

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
        -- Safe query using CASE to prevent invalid input syntax for type integer exceptions
        SELECT COALESCE(MAX(
            CASE 
                WHEN unique_id ~ ('^' || v_prefix || '-[0-9]+$') 
                THEN SUBSTRING(unique_id FROM '-([0-9]+)$')::INT 
                ELSE 0 
            END
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
