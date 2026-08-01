-- Fix function overloading ambiguity that causes RPC failure and fallback to broken edge function logic

DROP FUNCTION IF EXISTS public.generate_polygon_unique_id(TEXT);
DROP FUNCTION IF EXISTS public.generate_polygon_unique_id(VARCHAR);
DROP FUNCTION IF EXISTS public.generate_polygon_unique_id();

CREATE TABLE IF NOT EXISTS public.layer_sequences (
    prefix TEXT PRIMARY KEY,
    current_val INT NOT NULL DEFAULT 0
);
ALTER TABLE public.layer_sequences DISABLE ROW LEVEL SECURITY;

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
        SELECT COALESCE(MAX(NULLIF(regexp_replace(unique_id, '^' || v_prefix || '-', ''), '')::INT), 0)
        INTO v_max
        FROM public.polygon_features
        WHERE unique_id LIKE v_prefix || '-%' AND unique_id ~ ('^' || v_prefix || '-[0-9]+$');
        
        INSERT INTO public.layer_sequences (prefix, current_val) VALUES (v_prefix, v_max);
    END IF;

    v_new_val := v_max + 1;
    UPDATE public.layer_sequences SET current_val = v_new_val WHERE prefix = v_prefix;
    v_new_id := v_prefix || '-' || lpad(v_new_val::TEXT, 3, '0');
    
    RETURN v_new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
