-- Forcefully reset the layer_sequences cache for TT36N directly!
-- This bypasses any previous logic and explicitly updates the tracking table.

DO $$
DECLARE
  v_true_max INT;
BEGIN
  -- 1. Find the absolute highest number in the polygon_features table for TT36N
  SELECT COALESCE(MAX(SUBSTRING(unique_id FROM 'TT36N-([0-9]+)')::INT), 0)
  INTO v_true_max
  FROM public.polygon_features
  WHERE unique_id LIKE 'TT36N-%';

  -- 2. If it doesn't exist in layer_sequences, insert it
  IF NOT EXISTS (SELECT 1 FROM public.layer_sequences WHERE prefix = 'TT36N') THEN
    INSERT INTO public.layer_sequences (prefix, current_val) VALUES ('TT36N', v_true_max);
  ELSE
    -- 3. If it does exist, forcefully update it to the true max!
    UPDATE public.layer_sequences 
    SET current_val = v_true_max 
    WHERE prefix = 'TT36N';
  END IF;

  RAISE NOTICE 'Reset TT36N sequence to %', v_true_max;
END;
$$;
