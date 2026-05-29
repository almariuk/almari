-- Don't auto-cancel transactions where the buyer has already claimed to have
-- sent payment. The reservation stays open until the seller confirms receipt.
-- Previously the cron would cancel even paid orders if the seller didn't
-- confirm within 20 minutes.
CREATE OR REPLACE FUNCTION expire_stale_reservations()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE transactions
  SET status = 'cancelled',
      cancellation_reason = 'buyer_did_not_pay'
  WHERE status IN ('pending_payment', 'held')
    AND buyer_payment_claimed_at IS NULL
    AND listing_id IN (
      SELECT id FROM listings
      WHERE status = 'reserved'
        AND (reserved_until < NOW() OR reserved_until IS NULL)
    );

  UPDATE listings
  SET status = 'active',
      reserved_until = NULL
  WHERE status = 'reserved'
    AND (reserved_until < NOW() OR reserved_until IS NULL)
    AND id NOT IN (
      SELECT listing_id FROM transactions
      WHERE status IN ('pending_payment', 'held')
        AND buyer_payment_claimed_at IS NOT NULL
    );
END;
$$;
