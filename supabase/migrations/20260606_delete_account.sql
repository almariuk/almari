-- GDPR right to erasure.
-- Blocks deletion if any transaction has money in flight (paid, dispatched,
-- delivered, concern_open, concern_resolved). Cancels pending_payment
-- transactions where no money has moved. Removes all active listings.
-- Then anonymises personal data and deletes the auth user.

CREATE OR REPLACE FUNCTION delete_own_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_uid              UUID := auth.uid();
  v_open_count       INT;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Block if any transaction has money in flight (as buyer or seller)
  SELECT COUNT(*) INTO v_open_count
  FROM transactions
  WHERE (seller_id = v_uid OR buyer_id = v_uid)
    AND status IN ('paid', 'dispatched', 'delivered', 'concern_open', 'concern_resolved');

  IF v_open_count > 0 THEN
    RAISE EXCEPTION 'open_transactions'
      USING HINT = 'You have open orders. Please resolve them before deleting your account.';
  END IF;

  -- Cancel any pending_payment transactions (no money moved yet)
  UPDATE transactions
  SET status = 'cancelled', cancellation_reason = 'seller_account_deleted'
  WHERE seller_id = v_uid AND status = 'pending_payment';

  UPDATE transactions
  SET status = 'cancelled', cancellation_reason = 'buyer_account_deleted'
  WHERE buyer_id = v_uid AND status = 'pending_payment';

  -- Remove all active/reserved listings
  UPDATE listings
  SET status = 'removed'
  WHERE seller_id = v_uid AND status IN ('active', 'reserved', 'draft');

  -- Anonymise identity — keeps the row for provenance chain integrity
  UPDATE user_identity
  SET
    first_name        = 'Deleted',
    last_name_initial = 'U',
    email             = 'deleted+' || v_uid::TEXT || '@deleted.almari'
  WHERE id = v_uid;

  -- Clear all sensitive profile data
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

  -- Delete auth user — invalidates all sessions and JWT tokens
  DELETE FROM auth.users WHERE id = v_uid;
END;
$$;
