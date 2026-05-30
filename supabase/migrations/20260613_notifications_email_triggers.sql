-- Transactional email triggers via pg_net → Resend.
-- Same pattern as trg_concern_email in 20260604_concern_email_notify.sql.
-- Emails go to the recipient user's email (looked up from auth.users via user_identity).

CREATE OR REPLACE FUNCTION _notif_user_email(p_user_id UUID)
RETURNS TEXT
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT au.email
  FROM   user_identity ui
  JOIN   auth.users au ON au.id = ui.auth_id
  WHERE  ui.id = p_user_id;
$$;

-- ─── 1. Buyer marks payment sent → email seller ─────────────────────────────
CREATE OR REPLACE FUNCTION trg_fn_email_payment_sent()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_api_key TEXT;
  v_email   TEXT;
  v_item    TEXT;
BEGIN
  IF NEW.buyer_payment_claimed_at IS NULL OR OLD.buyer_payment_claimed_at IS NOT NULL THEN
    RETURN NEW;
  END IF;
  SELECT value INTO v_api_key FROM app_config WHERE key = 'resend_api_key';
  IF v_api_key IS NULL THEN RETURN NEW; END IF;
  v_email := _notif_user_email(NEW.seller_id);
  IF v_email IS NULL THEN RETURN NEW; END IF;
  v_item := _notif_item_name(NEW.listing_id);
  PERFORM net.http_post(
    url     := 'https://api.resend.com/emails',
    headers := jsonb_build_object('Authorization', 'Bearer ' || v_api_key, 'Content-Type', 'application/json'),
    body    := jsonb_build_object(
      'from',    'Almari <onboarding@resend.dev>',
      'to',      ARRAY[v_email],
      'subject', 'Payment is on its way — ' || v_item,
      'html',    '<p>The buyer has sent payment for <strong>' || v_item || '</strong> (ref: ' || COALESCE(NEW.payment_reference, '—') || ').</p>'
              || '<p>Check your PayPal or Revolut and confirm in the app when it arrives.</p>'
    )
  );
  RETURN NEW;
END;
$$;
CREATE OR REPLACE TRIGGER trg_email_payment_sent
  AFTER UPDATE ON transactions FOR EACH ROW
  EXECUTE FUNCTION trg_fn_email_payment_sent();

-- ─── 2. Seller confirms payment → email buyer ───────────────────────────────
CREATE OR REPLACE FUNCTION trg_fn_email_payment_confirmed()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_api_key TEXT;
  v_email   TEXT;
  v_item    TEXT;
BEGIN
  IF OLD.status = NEW.status OR NEW.status != 'paid' THEN RETURN NEW; END IF;
  SELECT value INTO v_api_key FROM app_config WHERE key = 'resend_api_key';
  IF v_api_key IS NULL THEN RETURN NEW; END IF;
  v_email := _notif_user_email(NEW.buyer_id);
  IF v_email IS NULL THEN RETURN NEW; END IF;
  v_item := _notif_item_name(NEW.listing_id);
  PERFORM net.http_post(
    url     := 'https://api.resend.com/emails',
    headers := jsonb_build_object('Authorization', 'Bearer ' || v_api_key, 'Content-Type', 'application/json'),
    body    := jsonb_build_object(
      'from',    'Almari <onboarding@resend.dev>',
      'to',      ARRAY[v_email],
      'subject', 'Your order is confirmed — ' || v_item,
      'html',    '<p>Your payment for <strong>' || v_item || '</strong> has been confirmed by the seller.</p>'
              || '<p>They will dispatch it shortly. We''ll let you know when it''s on its way.</p>'
    )
  );
  RETURN NEW;
END;
$$;
CREATE OR REPLACE TRIGGER trg_email_payment_confirmed
  AFTER UPDATE ON transactions FOR EACH ROW
  EXECUTE FUNCTION trg_fn_email_payment_confirmed();

-- ─── 3. Seller dispatches → email buyer ─────────────────────────────────────
CREATE OR REPLACE FUNCTION trg_fn_email_dispatched()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_api_key TEXT;
  v_email   TEXT;
  v_item    TEXT;
BEGIN
  IF NEW.dispatched_at IS NULL OR OLD.dispatched_at IS NOT NULL THEN RETURN NEW; END IF;
  SELECT value INTO v_api_key FROM app_config WHERE key = 'resend_api_key';
  IF v_api_key IS NULL THEN RETURN NEW; END IF;
  v_email := _notif_user_email(NEW.buyer_id);
  IF v_email IS NULL THEN RETURN NEW; END IF;
  v_item := _notif_item_name(NEW.listing_id);
  PERFORM net.http_post(
    url     := 'https://api.resend.com/emails',
    headers := jsonb_build_object('Authorization', 'Bearer ' || v_api_key, 'Content-Type', 'application/json'),
    body    := jsonb_build_object(
      'from',    'Almari <onboarding@resend.dev>',
      'to',      ARRAY[v_email],
      'subject', 'Your ' || v_item || ' is on its way',
      'html',    '<p><strong>' || v_item || '</strong> has been dispatched by the seller.</p>'
              || CASE WHEN NEW.tracking_number IS NOT NULL
                 THEN '<p>Tracking number: <strong>' || NEW.tracking_number || '</strong></p>'
                 ELSE '' END
              || '<p>Keep an eye out for it!</p>'
    )
  );
  RETURN NEW;
END;
$$;
CREATE OR REPLACE TRIGGER trg_email_dispatched
  AFTER UPDATE ON transactions FOR EACH ROW
  EXECUTE FUNCTION trg_fn_email_dispatched();

-- ─── 4. Buyer confirms received → email seller ──────────────────────────────
CREATE OR REPLACE FUNCTION trg_fn_email_delivered()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_api_key TEXT;
  v_email   TEXT;
  v_item    TEXT;
BEGIN
  IF OLD.status = NEW.status OR NEW.status != 'delivered' THEN RETURN NEW; END IF;
  SELECT value INTO v_api_key FROM app_config WHERE key = 'resend_api_key';
  IF v_api_key IS NULL THEN RETURN NEW; END IF;
  v_email := _notif_user_email(NEW.seller_id);
  IF v_email IS NULL THEN RETURN NEW; END IF;
  v_item := _notif_item_name(NEW.listing_id);
  PERFORM net.http_post(
    url     := 'https://api.resend.com/emails',
    headers := jsonb_build_object('Authorization', 'Bearer ' || v_api_key, 'Content-Type', 'application/json'),
    body    := jsonb_build_object(
      'from',    'Almari <onboarding@resend.dev>',
      'to',      ARRAY[v_email],
      'subject', 'Order complete — ' || v_item,
      'html',    '<p>The buyer has confirmed they received <strong>' || v_item || '</strong>.</p>'
              || '<p>The order will complete automatically after the 48-hour concern window closes.</p>'
    )
  );
  RETURN NEW;
END;
$$;
CREATE OR REPLACE TRIGGER trg_email_delivered
  AFTER UPDATE ON transactions FOR EACH ROW
  EXECUTE FUNCTION trg_fn_email_delivered();
