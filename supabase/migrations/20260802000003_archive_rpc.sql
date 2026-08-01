-- Create an RPC to safely archive a parcel and create the necessary cases and messages
-- This runs as SECURITY DEFINER to bypass complex RLS and ensure an atomic transaction.

CREATE OR REPLACE FUNCTION public.archive_parcel_transaction(
  p_unique_id TEXT,
  p_layer_name TEXT,
  p_reason TEXT,
  p_status TEXT,
  p_user_id UUID
) RETURNS json AS $$
DECLARE
  v_parcel_id UUID;
  v_case_id UUID;
BEGIN
  -- 1. Update polygon_features
  UPDATE public.polygon_features
  SET is_archived = true,
      archive_reason = p_reason
  WHERE unique_id = p_unique_id AND layer_name = p_layer_name
  RETURNING id INTO v_parcel_id;

  IF v_parcel_id IS NULL THEN
    RAISE EXCEPTION 'Parcel not found or already archived';
  END IF;

  -- 2. Create the case
  INSERT INTO public.parcel_cases (
    parcel_unique_id, survey_layer, current_status, reason, created_by, case_type
  ) VALUES (
    p_unique_id, p_layer_name, p_status, 'Archived: ' || p_reason, p_user_id, 'archive_parcel'
  ) RETURNING id INTO v_case_id;

  -- 3. Add system message
  INSERT INTO public.case_messages (
    case_id, sender_id, message_type, content
  ) VALUES (
    v_case_id, p_user_id, 'system', 
    'Parcel archived. Reason: ' || p_reason || '. Status set to ' || 
    CASE WHEN p_status = 'yellow' THEN 'Pending Subdivision' ELSE 'Resolved' END || '.'
  );

  RETURN json_build_object('success', true, 'case_id', v_case_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
