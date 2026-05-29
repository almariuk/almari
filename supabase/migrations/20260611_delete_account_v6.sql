-- Fix: resolve user_identity.id via auth_id before checking listings/transactions.
-- auth.uid() = user_identity.auth_id, not user_identity.id.
-- All FK references (seller_id, buyer_id) use user_identity.id.

CREATE OR REPLACE FUNCTION delete_own_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_auth_uid      UUID := auth.uid();
  v_identity_id   UUID;
  v_open_count    INT;
  v_listing_count INT;
BEGIN
  IF v_auth_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT id INTO v_identity_id
  FROM user_identity WHERE auth_id = v_auth_uid;

  IF v_identity_id IS NULL THEN
    RAISE EXCEPTION 'Identity not found';
  END IF;

  SELECT COUNT(*) INTO v_open_count
  FROM transactions
  WHERE (seller_id = v_identity_id OR buyer_id = v_identity_id)
    AND status NOT IN ('completed', 'refunded', 'cancelled');

  IF v_open_count > 0 THEN
    RAISE EXCEPTION 'open_transactions'
      USING HINT = 'You have open orders. Please resolve them before deleting your account.';
  END IF;

  SELECT COUNT(*) INTO v_listing_count
  FROM listings
  WHERE seller_id = v_identity_id AND status = 'active';

  IF v_listing_count > 0 THEN
    RAISE EXCEPTION 'active_listings'
      USING HINT = 'You have active listings. Please remove them before deleting your account.';
  END IF;

  -- Anonymise identity — row kept for provenance chain integrity
  UPDATE user_identity
  SET
    first_name        = 'Deleted',
    last_name_initial = 'U',
    email             = 'deleted+' || v_auth_uid::TEXT || '@deleted.almari'
  WHERE id = v_identity_id;

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
  WHERE user_id = v_identity_id;

  -- Delete auth user — invalidates all sessions
  DELETE FROM auth.users WHERE id = v_auth_uid;
END;
$$;
