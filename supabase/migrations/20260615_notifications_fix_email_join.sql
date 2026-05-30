-- Fix _notif_user_email: use LEFT JOIN consistent with _notif_item_name.
-- In practice the guard (IF v_email IS NULL THEN RETURN NEW) already handles missing rows,
-- but INNER JOIN is misleading about intent.
--
-- Also fix trg_fn_email_dispatched subject: "Your your item is on its way" when
-- _notif_item_name returns the 'your item' fallback.

CREATE OR REPLACE FUNCTION _notif_user_email(p_user_id UUID)
RETURNS TEXT
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT COALESCE(
    (SELECT au.email
     FROM   user_identity ui
     LEFT JOIN auth.users au ON au.id = ui.auth_id
     WHERE  ui.id = p_user_id),
    NULL
  );
$$;

CREATE OR REPLACE FUNCTION trg_fn_email_dispatched()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_api_key TEXT;
  v_email   TEXT;
  v_item    TEXT;
  v_subject TEXT;
BEGIN
  IF NEW.dispatched_at IS NULL OR OLD.dispatched_at IS NOT NULL THEN RETURN NEW; END IF;
  SELECT value INTO v_api_key FROM app_config WHERE key = 'resend_api_key';
  IF v_api_key IS NULL THEN RETURN NEW; END IF;
  v_email := _notif_user_email(NEW.buyer_id);
  IF v_email IS NULL THEN RETURN NEW; END IF;
  v_item    := _notif_item_name(NEW.listing_id);
  v_subject := CASE WHEN v_item = 'your item'
               THEN 'Your item is on its way'
               ELSE 'Your ' || v_item || ' is on its way'
               END;
  PERFORM net.http_post(
    url     := 'https://api.resend.com/emails',
    headers := jsonb_build_object('Authorization', 'Bearer ' || v_api_key, 'Content-Type', 'application/json'),
    body    := jsonb_build_object(
      'from',    'Almari <onboarding@resend.dev>',
      'to',      ARRAY[v_email],
      'subject', v_subject,
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
