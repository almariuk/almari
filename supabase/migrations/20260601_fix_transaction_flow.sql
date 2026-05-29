-- 1. close_concern_window RPC — called lazily from buyer/seller order detail
--    screens when the 48h concern window has passed without a concern raised.
--    Was referenced in the app but never created.
CREATE OR REPLACE FUNCTION close_concern_window(p_transaction_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE transactions
  SET status = 'completed'
  WHERE id = p_transaction_id
    AND status = 'delivered'
    AND concern_raised_at IS NULL
    AND concern_window_closes_at IS NOT NULL
    AND concern_window_closes_at < NOW();
END;
$$;

-- 2. Mark listing as sold when seller confirms payment.
--    Previously listing stayed 'reserved' indefinitely after the transaction
--    moved to 'paid', meaning the cron job could accidentally expire it.
CREATE OR REPLACE FUNCTION mark_listing_sold_on_payment()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'paid' AND (OLD.status IS DISTINCT FROM 'paid') THEN
    UPDATE listings SET status = 'sold', reserved_until = NULL
    WHERE id = NEW.listing_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_transaction_paid
  AFTER UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION mark_listing_sold_on_payment();

-- 3. Cron job to auto-complete delivered orders after 48h concern window.
--    Lazy close (triggered on screen view) is a fallback — this ensures
--    orders complete even if neither party re-opens the order detail.
SELECT cron.schedule(
  'complete-delivered-orders',
  '*/5 * * * *',
  $$
    UPDATE transactions
    SET status = 'completed'
    WHERE status = 'delivered'
      AND concern_raised_at IS NULL
      AND concern_window_closes_at IS NOT NULL
      AND concern_window_closes_at < NOW();
  $$
);
