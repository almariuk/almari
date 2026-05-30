-- DELETE policy for swipe-to-delete in the app
CREATE POLICY notifications_delete_own ON notifications
  FOR DELETE USING (user_id = almari_user_id());

-- ─── Helper: resolve item name from a listing id ───────────────────────────
CREATE OR REPLACE FUNCTION _notif_item_name(p_listing_id UUID)
RETURNS TEXT
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT COALESCE(sc.name, 'your item')
  FROM   listings l
  JOIN   subcategories sc ON sc.id = l.subcategory_id
  WHERE  l.id = p_listing_id;
$$;

-- ─── 1. Buyer marks payment sent → notify seller ────────────────────────────
CREATE OR REPLACE FUNCTION trg_fn_notify_payment_sent()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.buyer_payment_claimed_at IS NULL OR OLD.buyer_payment_claimed_at IS NOT NULL THEN
    RETURN NEW;
  END IF;
  INSERT INTO notifications (user_id, type, title, body, channel, reference_type, reference_id, is_read)
  VALUES (
    NEW.seller_id,
    'payment_sent',
    'Payment is on its way',
    'The buyer has sent payment for ' || _notif_item_name(NEW.listing_id) || '. Check your PayPal or Revolut and confirm when it arrives.',
    'in_app', 'transaction', NEW.id::text, false
  );
  RETURN NEW;
END;
$$;
CREATE OR REPLACE TRIGGER trg_notify_payment_sent
  AFTER UPDATE ON transactions FOR EACH ROW
  EXECUTE FUNCTION trg_fn_notify_payment_sent();

-- ─── 2. Seller confirms payment → notify buyer ──────────────────────────────
CREATE OR REPLACE FUNCTION trg_fn_notify_payment_confirmed()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF OLD.status = NEW.status OR NEW.status != 'paid' THEN RETURN NEW; END IF;
  INSERT INTO notifications (user_id, type, title, body, channel, reference_type, reference_id, is_read)
  VALUES (
    NEW.buyer_id,
    'payment_confirmed',
    'Payment confirmed',
    'Your payment for ' || _notif_item_name(NEW.listing_id) || ' has been confirmed. The seller will dispatch it soon.',
    'in_app', 'transaction', NEW.id::text, false
  );
  RETURN NEW;
END;
$$;
CREATE OR REPLACE TRIGGER trg_notify_payment_confirmed
  AFTER UPDATE ON transactions FOR EACH ROW
  EXECUTE FUNCTION trg_fn_notify_payment_confirmed();

-- ─── 3. Seller dispatches → notify buyer ────────────────────────────────────
CREATE OR REPLACE FUNCTION trg_fn_notify_dispatched()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.dispatched_at IS NULL OR OLD.dispatched_at IS NOT NULL THEN RETURN NEW; END IF;
  INSERT INTO notifications (user_id, type, title, body, channel, reference_type, reference_id, is_read)
  VALUES (
    NEW.buyer_id,
    'dispatched',
    'Your item is on its way',
    _notif_item_name(NEW.listing_id) || ' has been dispatched. Keep an eye out for it.',
    'in_app', 'transaction', NEW.id::text, false
  );
  RETURN NEW;
END;
$$;
CREATE OR REPLACE TRIGGER trg_notify_dispatched
  AFTER UPDATE ON transactions FOR EACH ROW
  EXECUTE FUNCTION trg_fn_notify_dispatched();

-- ─── 4. Buyer confirms received → notify seller ─────────────────────────────
CREATE OR REPLACE FUNCTION trg_fn_notify_delivered()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF OLD.status = NEW.status OR NEW.status != 'delivered' THEN RETURN NEW; END IF;
  INSERT INTO notifications (user_id, type, title, body, channel, reference_type, reference_id, is_read)
  VALUES (
    NEW.seller_id,
    'delivered',
    'Item delivered',
    'The buyer has confirmed they received ' || _notif_item_name(NEW.listing_id) || '. The order will complete after 48 hours.',
    'in_app', 'transaction', NEW.id::text, false
  );
  RETURN NEW;
END;
$$;
CREATE OR REPLACE TRIGGER trg_notify_delivered
  AFTER UPDATE ON transactions FOR EACH ROW
  EXECUTE FUNCTION trg_fn_notify_delivered();

-- ─── 5. Concern raised → notify seller (buyer is always the raiser currently)
CREATE OR REPLACE FUNCTION trg_fn_notify_concern_raised()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.concern_raised_at IS NULL OR OLD.concern_raised_at IS NOT NULL THEN RETURN NEW; END IF;
  INSERT INTO notifications (user_id, type, title, body, channel, reference_type, reference_id, is_read)
  VALUES (
    NEW.seller_id,
    'concern_raised',
    'A concern has been raised',
    'The buyer has raised a concern about ' || _notif_item_name(NEW.listing_id) || '. Almari will be in touch.',
    'in_app', 'transaction', NEW.id::text, false
  );
  RETURN NEW;
END;
$$;
CREATE OR REPLACE TRIGGER trg_notify_concern_raised
  AFTER UPDATE ON transactions FOR EACH ROW
  EXECUTE FUNCTION trg_fn_notify_concern_raised();
