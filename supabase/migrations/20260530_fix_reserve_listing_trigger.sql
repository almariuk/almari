-- The reserve_listing() function existed but the trigger calling it was never created.
-- This caused reserved_until to remain NULL on new transactions, which the cron job
-- then treated as expired and immediately cancelled.

-- 1. Create the trigger
CREATE OR REPLACE TRIGGER on_transaction_insert
  AFTER INSERT ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION reserve_listing();

-- 2. Fix expire_listing_reservation RPC — cancellation_reason was a free-text string
--    which violates the check constraint. Must be 'buyer_did_not_pay'.
CREATE OR REPLACE FUNCTION expire_listing_reservation(p_listing_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE transactions
  SET status = 'cancelled',
      cancellation_reason = 'buyer_did_not_pay'
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
