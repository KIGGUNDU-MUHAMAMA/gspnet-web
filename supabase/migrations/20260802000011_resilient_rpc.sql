-- Final bulletproof sequence generator.
-- Uses ultra-resilient regex to extract the number, ignoring invisible characters, spaces, and subdivision suffixes.

TRUNCATE TABLE public.layer_sequences;

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
        -- Ultra-resilient extraction: grabs the first number immediately following the prefix.
        -- Ignores trailing spaces, invisible characters (\r), and subdivision suffixes (like -1).
        SELECT COALESCE(MAX(
            SUBSTRING(unique_id FROM v_prefix || '-([0-9]+)')::INT
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

NOTIFY pgrst, 'reload schema';
