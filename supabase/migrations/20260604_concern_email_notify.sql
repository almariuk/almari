-- Internal config table — no RLS policies = only service role / postgres can read.
-- Actual secret values are inserted outside of migrations (never in git).
CREATE TABLE IF NOT EXISTS app_config (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

-- Trigger function: fires when concern_raised_at is newly stamped.
-- Calls Resend to notify reachalmari@gmail.com.
CREATE OR REPLACE FUNCTION notify_almari_on_concern()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_api_key TEXT;
  v_subject TEXT;
  v_html    TEXT;
BEGIN
  IF NEW.concern_raised_at IS NULL OR OLD.concern_raised_at IS NOT NULL THEN
    RETURN NEW;
  END IF;

  SELECT value INTO v_api_key FROM app_config WHERE key = 'resend_api_key';
  IF v_api_key IS NULL THEN RETURN NEW; END IF;

  v_subject := 'Concern raised — ' || COALESCE(NEW.payment_reference, NEW.id::text);
  v_html    := '<p>A concern has been raised.</p>'
            || '<p><strong>Reference:</strong> ' || COALESCE(NEW.payment_reference, '—') || '</p>'
            || '<p><strong>Reason:</strong> ' || COALESCE(NEW.concern_reason, 'not specified') || '</p>'
            || '<p><strong>Transaction ID:</strong> ' || NEW.id::text || '</p>'
            || '<p>Log in to Supabase to view the full transaction.</p>';

  PERFORM net.http_post(
    url     := 'https://api.resend.com/emails',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || v_api_key,
      'Content-Type',  'application/json'
    ),
    body    := jsonb_build_object(
      'from',    'Almari <onboarding@resend.dev>',
      'to',      ARRAY['reachalmari@gmail.com'],
      'subject', v_subject,
      'html',    v_html
    )
  );

  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_concern_raised
  AFTER UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION notify_almari_on_concern();
