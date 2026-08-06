-- Switch to native PostgreSQL Sequences for bulletproof, rollback-immune ID generation!
-- Sequences operate OUTSIDE the transaction block, meaning even if an insert fails and rolls back,
-- the sequence permanently advances. This completely eliminates the stuck cache loop.

-- 1. Initialize native sequences for all layers
DO $$
DECLARE
  v_prefix TEXT;
  v_seq_name TEXT;
  v_db_max INT;
BEGIN
  FOR v_prefix IN SELECT unnest(ARRAY['UT36S', 'UT36N', 'TT36S', 'TT36N', 'BLB', 'POLY']) LOOP
    v_seq_name := 'seq_layer_' || lower(v_prefix);
    
    -- Find true absolute max using the indestructible logic
    SELECT COALESCE(MAX(
        NULLIF(REGEXP_REPLACE(SPLIT_PART(unique_id, '-', 2), '[^0-9]', '', 'g'), '')::INT
    ), 0) INTO v_db_max
    FROM public.polygon_features
    WHERE unique_id LIKE v_prefix || '-%';

    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = v_seq_name AND relkind = 'S') THEN
      EXECUTE 'CREATE SEQUENCE ' || quote_ident(v_seq_name) || ' START WITH ' || (v_db_max + 1);
    ELSE
      -- Force sequence to jump to the true max so the nextval is max + 1
      EXECUTE 'SELECT setval(' || quote_literal(v_seq_name) || ', ' || GREATEST(v_db_max, 1) || ')';
    END IF;
  END LOOP;
END;
$$;

-- 2. Update the generator to use the native sequence
CREATE OR REPLACE FUNCTION public.generate_polygon_unique_id(layer_name TEXT)
RETURNS TEXT AS $$
DECLARE
    v_prefix TEXT;
    v_seq_name TEXT;
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

    v_seq_name := 'seq_layer_' || lower(v_prefix);

    -- nextval() is atomic and NEVER rolls back, even if the parent transaction aborts!
    EXECUTE 'SELECT nextval(' || quote_literal(v_seq_name) || ')' INTO v_new_val;
    
    v_new_id := v_prefix || '-' || lpad(v_new_val::TEXT, 3, '0');
    
    RETURN v_new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Reload PostgREST cache
NOTIFY pgrst, 'reload schema';
