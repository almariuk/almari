-- Writes trust_score_events for both seller and buyer when a transaction reaches
-- 'completed'. Runs SECURITY DEFINER so it can write both parties' rows and
-- update trust_score_cached regardless of who triggered the status change.

CREATE OR REPLACE FUNCTION handle_transaction_completed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sale     trust_event_types%ROWTYPE;
  v_purchase trust_event_types%ROWTYPE;
BEGIN
  IF NEW.status != 'completed' OR OLD.status = 'completed' THEN
    RETURN NEW;
  END IF;

  SELECT * INTO v_sale     FROM trust_event_types WHERE name = 'sale_completed'     AND is_active LIMIT 1;
  SELECT * INTO v_purchase FROM trust_event_types WHERE name = 'purchase_completed' AND is_active LIMIT 1;

  IF v_sale.id IS NOT NULL THEN
    INSERT INTO trust_score_events (user_id, event_type_id, score_delta, reference_id)
    VALUES (NEW.seller_id, v_sale.id, v_sale.score_delta, NEW.id::TEXT);

    UPDATE user_profile
    SET trust_score_cached = COALESCE(trust_score_cached, 0) + v_sale.score_delta
    WHERE user_id = NEW.seller_id;
  END IF;

  IF v_purchase.id IS NOT NULL THEN
    INSERT INTO trust_score_events (user_id, event_type_id, score_delta, reference_id)
    VALUES (NEW.buyer_id, v_purchase.id, v_purchase.score_delta, NEW.id::TEXT);

    UPDATE user_profile
    SET trust_score_cached = COALESCE(trust_score_cached, 0) + v_purchase.score_delta
    WHERE user_id = NEW.buyer_id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_transaction_completed
  AFTER UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION handle_transaction_completed();
