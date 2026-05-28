-- 1. Update reserve_listing trigger function to set reserved_until (20 minutes)
CREATE OR REPLACE FUNCTION reserve_listing()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE listings
  SET status = 'reserved',
      reserved_until = NOW() + interval '20 minutes'
  WHERE id = NEW.listing_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. RPC: expire a reservation if the 20-minute window has passed
--    Also cancels the pending_payment transaction so the listing can be re-bought
CREATE OR REPLACE FUNCTION expire_listing_reservation(p_listing_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE transactions
  SET status = 'cancelled',
      cancellation_reason = 'Payment not received within 20-minute reservation window'
  WHERE listing_id = p_listing_id
    AND status = 'pending_payment';

  UPDATE listings
  SET status = 'active',
      reserved_until = NULL
  WHERE id = p_listing_id
    AND status = 'reserved'
    AND reserved_until IS NOT NULL
    AND reserved_until < NOW();
END;
$$;

-- 3. Add paypal_handle and revolut_handle to user_profile (replaces free-text payment_instructions)
ALTER TABLE user_profile
  ADD COLUMN IF NOT EXISTS paypal_handle TEXT,
  ADD COLUMN IF NOT EXISTS revolut_handle TEXT;
