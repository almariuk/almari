-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Bulk function to expire all stale reservations
CREATE OR REPLACE FUNCTION expire_stale_reservations()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Cancel transactions whose 20-min window has passed (or reserved_until is NULL = orphaned)
  UPDATE transactions
  SET status = 'cancelled',
      cancellation_reason = 'buyer_did_not_pay'
  WHERE status IN ('pending_payment', 'held')
    AND listing_id IN (
      SELECT id FROM listings
      WHERE status = 'reserved'
        AND (reserved_until < NOW() OR reserved_until IS NULL)
    );

  -- Revert those listings back to active
  UPDATE listings
  SET status = 'active',
      reserved_until = NULL
  WHERE status = 'reserved'
    AND (reserved_until < NOW() OR reserved_until IS NULL);
END;
$$;

-- Run every minute
SELECT cron.schedule(
  'expire-stale-reservations',
  '* * * * *',
  $$SELECT expire_stale_reservations();$$
);
