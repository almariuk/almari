-- Revised: block on ALL non-terminal transactions including pending_payment.
-- The user must resolve their own orders before deleting.
-- Active listings are removed silently — they have no seller once the account is gone.

CREATE OR REPLACE FUNCTION delete_own_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_uid        UUID := auth.uid();
  v_open_count INT;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Block if any transaction is non-terminal (as buyer or seller)
  SELECT COUNT(*) INTO v_open_count
  FROM transactions
  WHERE (seller_id = v_uid OR buyer_id = v_uid)
    AND status NOT IN ('completed', 'refunded', 'cancelled');

  IF v_open_count > 0 THEN
    RAISE EXCEPTION 'open_transactions'
      USING HINT = 'You have open orders. Please resolve them before deleting your account.';
  END IF;

  -- Remove active listings — no seller remaining to fulfil any orders placed against them
  UPDATE listings
  SET status = 'removed'
  WHERE seller_id = v_uid AND status = 'active';

  -- Anonymise identity — row kept for provenance chain integrity
  UPDATE user_identity
  SET
    first_name        = 'Deleted',
    last_name_initial = 'U',
    email             = 'deleted+' || v_uid::TEXT || '@deleted.almari'
  WHERE id = v_uid;

  -- Clear sensitive profile data
  UPDATE user_profile
  SET
    bust_cm              = NULL,
    waist_cm             = NULL,
    hips_cm              = NULL,
    height_cm            = NULL,
    uk_shoe_size         = NULL,
    payment_instructions = NULL,
    profile_photo_url    = NULL
  WHERE user_id = v_uid;

  -- Delete auth user — invalidates all sessions
  DELETE FROM auth.users WHERE id = v_uid;
END;
$$;
