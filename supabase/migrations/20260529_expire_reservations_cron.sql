-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Bulk function to expire all stale reservations
CREATE OR REPLACE FUNCTION expire_stale_reservations()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Cancel pending_payment transactions whose 20-min window has passed
  UPDATE transactions
  SET status = 'cancelled',
      cancellation_reason = 'Payment not received within 20-minute reservation window'
  WHERE status = 'pending_payment'
    AND listing_id IN (
      SELECT id FROM listings
      WHERE status = 'reserved'
        AND reserved_until < NOW()
    );

  -- Revert those listings back to active
  UPDATE listings
  SET status = 'active',
      reserved_until = NULL
  WHERE status = 'reserved'
    AND reserved_until < NOW();
END;
$$;

-- Run every minute
SELECT cron.schedule(
  'expire-stale-reservations',
  '* * * * *',
  $$SELECT expire_stale_reservations();$$
);
