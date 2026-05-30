-- Almari pre-release DB integrity checks
-- Run with: npx supabase db query --linked --file scripts/pre-release-checks.sql
-- Every query must return 0 rows. Any rows returned = a problem to fix before releasing.

-- ═══════════════════════════════════════════════════════════════
-- SECTION 1: LISTING INTEGRITY
-- ═══════════════════════════════════════════════════════════════

-- CHECK 1: Active/reserved/sold listings missing a trust score
SELECT 'CHECK 1: listing missing trust score' AS check_name, id, status
FROM listings
WHERE status IN ('active', 'reserved', 'sold')
  AND id NOT IN (SELECT listing_id FROM listing_trust_scores);

-- CHECK 2: Trust scores outside valid range (0–60)
SELECT 'CHECK 2: trust score out of range' AS check_name, listing_id, total_score
FROM listing_trust_scores
WHERE total_score < 0 OR total_score > 60;

-- CHECK 3: Trust score total does not match sum of components
-- (Only checks listings that have components — listings before component tracking are excluded)
SELECT 'CHECK 3: trust score/component mismatch' AS check_name,
       ts.listing_id, ts.total_score, SUM(tc.earned_score) AS component_sum
FROM listing_trust_scores ts
JOIN listing_trust_components tc ON tc.listing_id = ts.listing_id
GROUP BY ts.listing_id, ts.total_score
HAVING ts.total_score != SUM(tc.earned_score);

-- CHECK 4: Active listings with fewer than 4 photos
SELECT 'CHECK 4: active listing with too few photos' AS check_name,
       l.id, COUNT(lp.url) AS photo_count
FROM listings l
LEFT JOIN listing_photos lp ON lp.listing_id = l.id
WHERE l.status = 'active'
GROUP BY l.id
HAVING COUNT(lp.url) < 4;

-- CHECK 5: Active listings missing a provenance row
SELECT 'CHECK 5: active listing missing provenance' AS check_name, id
FROM listings
WHERE status = 'active'
  AND id NOT IN (SELECT listing_id FROM provenance);

-- CHECK 6: Listings with an invalid status value
SELECT 'CHECK 6: invalid listing status' AS check_name, id, status
FROM listings
WHERE status NOT IN ('active', 'reserved', 'sold', 'removed', 'draft');

-- ═══════════════════════════════════════════════════════════════
-- SECTION 2: TRANSACTION INTEGRITY
-- ═══════════════════════════════════════════════════════════════

-- CHECK 7: Transactions with an invalid status
SELECT 'CHECK 7: invalid transaction status' AS check_name, id, status
FROM transactions
WHERE status NOT IN (
  'pending_payment','paid','dispatched','delivered',
  'concern_open','concern_resolved','completed','refunded','cancelled'
);

-- CHECK 8: Reserved listings where reservation has expired (stale lock)
SELECT 'CHECK 8: stale reservation' AS check_name, id, reserved_until
FROM listings
WHERE status = 'reserved'
  AND (reserved_until IS NULL OR reserved_until < NOW());

-- CHECK 9: pending_payment transaction but listing is not reserved
SELECT 'CHECK 9: pending_payment but listing not reserved' AS check_name,
       t.id AS transaction_id, t.listing_id, l.status AS listing_status
FROM transactions t
JOIN listings l ON l.id = t.listing_id
WHERE t.status = 'pending_payment'
  AND l.status != 'reserved';

-- CHECK 10: Reserved listing with no matching pending_payment transaction
SELECT 'CHECK 10: reserved listing with no transaction' AS check_name, id, reserved_until
FROM listings
WHERE status = 'reserved'
  AND id NOT IN (
    SELECT listing_id FROM transactions WHERE status = 'pending_payment'
  );

-- CHECK 11: Transaction status/timestamp mismatches
-- dispatched_at set but status is still 'paid' (dispatch recorded but status not updated)
SELECT 'CHECK 11a: dispatched_at set but status=paid' AS check_name, id, status, dispatched_at
FROM transactions
WHERE dispatched_at IS NOT NULL AND status = 'paid';

-- buyer_confirmed_delivered_at set but status is still 'dispatched'
SELECT 'CHECK 11b: delivered_at set but status=dispatched' AS check_name, id, status, buyer_confirmed_delivered_at
FROM transactions
WHERE buyer_confirmed_delivered_at IS NOT NULL AND status = 'dispatched';

-- status='paid' but buyer never claimed they sent payment
-- (seller confirmed receipt that buyer never initiated — unusual, flag for review)
SELECT 'CHECK 11c: status=paid but buyer_payment_claimed_at is null' AS check_name, id, status, buyer_payment_claimed_at
FROM transactions
WHERE status IN ('paid','dispatched','delivered','completed')
  AND buyer_payment_claimed_at IS NULL;

-- CHECK 12: Transactions referencing a non-existent listing
SELECT 'CHECK 12: transaction with missing listing' AS check_name, t.id, t.listing_id
FROM transactions t
LEFT JOIN listings l ON l.id = t.listing_id
WHERE l.id IS NULL;

-- CHECK 13: Completed transactions where trust events were not written
-- Known pre-existing: transaction aafcb6bf completed before trust events trigger was built
SELECT 'CHECK 13: completed transaction missing trust event' AS check_name,
       t.id AS transaction_id, t.seller_id
FROM transactions t
WHERE t.status = 'completed'
  AND t.id != 'aafcb6bf-d3c6-49c3-a47e-3657f05bf3cf'
  AND NOT EXISTS (
    SELECT 1 FROM trust_events te
    WHERE te.reference_id = t.id AND te.event_type = 'sale_completed'
  );

-- ═══════════════════════════════════════════════════════════════
-- SECTION 3: ORPHANED ROWS
-- ═══════════════════════════════════════════════════════════════

-- CHECK 14: Orphaned listing photos (listing deleted or missing)
SELECT 'CHECK 14: orphaned listing_photos' AS check_name, lp.listing_id
FROM listing_photos lp
LEFT JOIN listings l ON l.id = lp.listing_id
WHERE l.id IS NULL;

-- CHECK 15: Orphaned listing measurements
SELECT 'CHECK 15: orphaned listing_measurements' AS check_name, lm.listing_id
FROM listing_measurements lm
LEFT JOIN listings l ON l.id = lm.listing_id
WHERE l.id IS NULL;

-- CHECK 16: Orphaned trust score components (score row deleted but components remain)
SELECT 'CHECK 16: orphaned listing_trust_components' AS check_name, tc.listing_id
FROM listing_trust_components tc
LEFT JOIN listing_trust_scores ts ON ts.listing_id = tc.listing_id
WHERE ts.listing_id IS NULL;

-- CHECK 17: Orphaned provenance rows
SELECT 'CHECK 17: orphaned provenance' AS check_name, p.listing_id
FROM provenance p
LEFT JOIN listings l ON l.id = p.listing_id
WHERE l.id IS NULL;

-- CHECK 18: Orphaned notifications pointing to non-existent transactions
SELECT 'CHECK 18: orphaned notification (missing transaction)' AS check_name, n.id, n.reference_id
FROM notifications n
LEFT JOIN transactions t ON t.id::text = n.reference_id
WHERE n.reference_type = 'transaction'
  AND n.reference_id IS NOT NULL
  AND t.id IS NULL;

-- CHECK 19: Notifications with reference_type set but NULL reference_id
SELECT 'CHECK 19: notification with reference_type but null reference_id' AS check_name, id, type, reference_type
FROM notifications
WHERE reference_type IS NOT NULL AND reference_id IS NULL;

-- ═══════════════════════════════════════════════════════════════
-- SECTION 4: USER DATA INTEGRITY
-- ═══════════════════════════════════════════════════════════════

-- CHECK 20: Users with no user_profile row
SELECT 'CHECK 20: user_identity without user_profile' AS check_name,
       ui.id, ui.first_name
FROM user_identity ui
LEFT JOIN user_profile up ON up.user_id = ui.id
WHERE up.user_id IS NULL;

-- CHECK 21: user_profile rows with no matching user_identity (orphaned profiles)
SELECT 'CHECK 21: orphaned user_profile' AS check_name, up.user_id
FROM user_profile up
LEFT JOIN user_identity ui ON ui.id = up.user_id
WHERE ui.id IS NULL;

-- ═══════════════════════════════════════════════════════════════
-- SECTION 5: RLS AUDIT
-- ═══════════════════════════════════════════════════════════════

-- CHECK 22: Tables with RLS enabled but NO policies at all
-- These are completely locked — no app user can read or write them.
-- Intentional exceptions: app_config (service role only).
SELECT 'CHECK 22: RLS enabled but no policies (locked out)' AS check_name, tablename
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = true
  AND tablename NOT IN ('app_config')
  AND tablename NOT IN (
    SELECT DISTINCT tablename FROM pg_policies WHERE schemaname = 'public'
  );

-- CHECK 23: User-owned tables missing SELECT policy
-- Tables that store user data but have no SELECT policy = owner cannot read their own data.
SELECT 'CHECK 23: user-owned table missing SELECT policy' AS check_name, tablename
FROM (VALUES
  ('listings'), ('transactions'), ('notifications'), ('user_identity'),
  ('user_profile'), ('user_addresses'), ('listing_photos'), ('listing_measurements'),
  ('listing_trust_scores'), ('listing_trust_components'), ('provenance'),
  ('trust_events'), ('trust_score_events'), ('private_seller_motivation')
) AS t(tablename)
WHERE tablename NOT IN (
  SELECT DISTINCT tablename FROM pg_policies
  WHERE schemaname = 'public' AND cmd = 'SELECT'
);

-- CHECK 24: User-owned tables missing UPDATE policy
-- Tables the app updates that have no UPDATE policy = updates fail silently.
SELECT 'CHECK 24: user-owned table missing UPDATE policy' AS check_name, tablename
FROM (VALUES
  ('listings'), ('transactions'), ('user_identity'), ('user_profile'),
  ('user_addresses'), ('listing_measurements'), ('listing_trust_scores'), ('provenance'),
  ('notifications')
) AS t(tablename)
WHERE tablename NOT IN (
  SELECT DISTINCT tablename FROM pg_policies
  WHERE schemaname = 'public' AND cmd = 'UPDATE'
);

-- CHECK 25: User-owned tables missing INSERT policy
-- Tables the app directly inserts into (not trigger-only) that have no INSERT policy.
-- Excludes trigger-only tables: notifications, trust_events (SECURITY DEFINER triggers bypass RLS).
SELECT 'CHECK 25: user-owned table missing INSERT policy' AS check_name, tablename
FROM (VALUES
  ('listings'), ('transactions'), ('user_identity'), ('user_profile'),
  ('user_addresses'), ('listing_photos'), ('listing_measurements'),
  ('listing_trust_scores'), ('listing_trust_components'), ('provenance'),
  ('trust_score_events'), ('private_seller_motivation')
) AS t(tablename)
WHERE tablename NOT IN (
  SELECT DISTINCT tablename FROM pg_policies
  WHERE schemaname = 'public' AND cmd = 'INSERT'
);

-- CHECK 26: User-owned tables missing DELETE policy where delete is expected
SELECT 'CHECK 26: user-owned table missing DELETE policy' AS check_name, tablename
FROM (VALUES
  ('listing_photos'),        -- seller removes photos on edit
  ('listing_measurements'),  -- seller replaces measurements on edit
  ('listing_trust_components'), -- replaced on re-score
  ('notifications'),         -- swipe to delete
  ('user_addresses')         -- address management
) AS t(tablename)
WHERE tablename NOT IN (
  SELECT DISTINCT tablename FROM pg_policies
  WHERE schemaname = 'public' AND cmd = 'DELETE'
);

-- ═══════════════════════════════════════════════════════════════
-- SECTION 6: TRIGGER PRESENCE
-- ═══════════════════════════════════════════════════════════════

-- CHECK 27: Expected triggers are present
-- Returns any trigger that is missing from the DB.
SELECT 'CHECK 27: missing trigger' AS check_name, expected_trigger AS trigger_name
FROM (VALUES
  ('trg_reserve_listing'),
  ('on_concern_raised'),
  ('on_transaction_completed'),
  ('on_transaction_insert'),
  ('on_transaction_paid'),
  ('trg_notify_payment_sent'),
  ('trg_notify_payment_confirmed'),
  ('trg_notify_dispatched'),
  ('trg_notify_delivered'),
  ('trg_notify_concern_raised'),
  ('trg_email_payment_sent'),
  ('trg_email_payment_confirmed'),
  ('trg_email_dispatched'),
  ('trg_email_delivered')
) AS t(expected_trigger)
WHERE expected_trigger NOT IN (
  SELECT trigger_name FROM information_schema.triggers WHERE trigger_schema = 'public'
);

-- ═══════════════════════════════════════════════════════════════
-- SECTION 7: APP CONFIG
-- ═══════════════════════════════════════════════════════════════

-- CHECK 28: Required app_config keys are present
-- Missing keys mean transactional emails stop working silently.
SELECT 'CHECK 28: missing app_config key' AS check_name, required_key
FROM (VALUES ('resend_api_key')) AS t(required_key)
WHERE required_key NOT IN (SELECT key FROM app_config);
