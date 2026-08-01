-- Fix the unique ID generator to always check the table for the true max sequence 
-- instead of relying on a potentially desynced PostgreSQL sequence.

CREATE TABLE IF NOT EXISTS public.layer_sequences (
    prefix TEXT PRIMARY KEY,
    current_val INT NOT NULL DEFAULT 0
);

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

    -- Lock the row for this prefix to handle concurrent batch inserts safely
    SELECT current_val INTO v_max FROM public.layer_sequences WHERE prefix = v_prefix FOR UPDATE;
    
    IF NOT FOUND THEN
        -- Auto-sync by finding the true max sequence number currently in the table
        SELECT COALESCE(MAX(NULLIF(regexp_replace(unique_id, '^' || v_prefix || '-', ''), '')::INT), 0)
        INTO v_max
        FROM public.polygon_features
        WHERE unique_id LIKE v_prefix || '-%' AND unique_id ~ ('^' || v_prefix || '-[0-9]+$');
        
        INSERT INTO public.layer_sequences (prefix, current_val) VALUES (v_prefix, v_max);
    END IF;

    -- Increment
    v_new_val := v_max + 1;
    
    -- Update the sequence table
    UPDATE public.layer_sequences SET current_val = v_new_val WHERE prefix = v_prefix;

    -- Format the new ID (e.g., TT36N-1359)
    v_new_id := v_prefix || '-' || lpad(v_new_val::TEXT, 3, '0');
    
    RETURN v_new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
