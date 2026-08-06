-- Create the Ultimate Self-Healing Sequence Generator
-- This completely solves the poisoned cache issue by ALWAYS verifying the cache against the live database table!

CREATE OR REPLACE FUNCTION public.generate_polygon_unique_id(layer_name TEXT)
RETURNS TEXT AS $$
DECLARE
    v_prefix TEXT;
    v_cache_max INT;
    v_db_max INT;
    v_new_val INT;
    v_new_id TEXT;
BEGIN
    -- 1. Determine prefix
    v_prefix := CASE layer_name 
        WHEN 'UNTITLED UTM ZONE 36S' THEN 'UT36S'
        WHEN 'UNTITLED UTM ZONE 36N' THEN 'UT36N'
        WHEN 'TITLE TRACTS UTM ZONE 36S' THEN 'TT36S'
        WHEN 'TITLE TRACTS UTM ZONE 36N' THEN 'TT36N'
        WHEN 'BLB-UNTITLED' THEN 'BLB'
        ELSE 'POLY'
    END;

    -- 2. Lock the cache row to prevent concurrent race conditions
    SELECT current_val INTO v_cache_max FROM public.layer_sequences WHERE prefix = v_prefix FOR UPDATE;
    
    -- 3. ALWAYS scan the live database to find the absolute highest true ID!
    -- This guarantees we never use a stale or poisoned cache value (like 135 instead of 1358)
    SELECT COALESCE(MAX(
        NULLIF(REGEXP_REPLACE(SPLIT_PART(unique_id, '-', 2), '[^0-9]', '', 'g'), '')::INT
    ), 0)
    INTO v_db_max
    FROM public.polygon_features
    WHERE unique_id LIKE v_prefix || '-%';
    
    -- 4. Self-Heal: If the live DB max is higher than our cache (or cache is missing), force an update!
    IF v_cache_max IS NULL THEN
        v_cache_max := v_db_max;
        INSERT INTO public.layer_sequences (prefix, current_val) VALUES (v_prefix, v_cache_max);
    ELSIF v_db_max > v_cache_max THEN
        v_cache_max := v_db_max;
        UPDATE public.layer_sequences SET current_val = v_cache_max WHERE prefix = v_prefix;
    END IF;

    -- 5. Safely increment from the true maximum
    v_new_val := v_cache_max + 1;
    UPDATE public.layer_sequences SET current_val = v_new_val WHERE prefix = v_prefix;
    v_new_id := v_prefix || '-' || lpad(v_new_val::TEXT, 3, '0');
    
    RETURN v_new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Reload schema cache to apply immediately
NOTIFY pgrst, 'reload schema';
