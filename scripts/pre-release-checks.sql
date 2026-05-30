-- Almari pre-release DB integrity checks
-- Run with: npx supabase db query --linked "$(cat scripts/pre-release-checks.sql)"
-- Every query should return 0 rows. Any rows returned = a problem to fix before releasing.

-- ─────────────────────────────────────────────────────────────
-- CHECK 1: Active/reserved/sold listings missing a trust score
-- ─────────────────────────────────────────────────────────────
SELECT 'CHECK 1: listings missing trust score' AS check_name, id, status
FROM listings
WHERE status IN ('active', 'reserved', 'sold')
  AND id NOT IN (SELECT listing_id FROM listing_trust_scores);

-- ─────────────────────────────────────────────────────────────
-- CHECK 2: Trust scores outside valid range (0–60)
-- ─────────────────────────────────────────────────────────────
SELECT 'CHECK 2: trust score out of range' AS check_name, listing_id, total_score
FROM listing_trust_scores
WHERE total_score < 0 OR total_score > 60;

-- ─────────────────────────────────────────────────────────────
-- CHECK 3: Transactions with an invalid status
-- ─────────────────────────────────────────────────────────────
SELECT 'CHECK 3: invalid transaction status' AS check_name, id, status
FROM transactions
WHERE status NOT IN (
  'pending_payment','paid','dispatched','delivered',
  'concern_open','concern_resolved','completed','refunded','cancelled'
);

-- ─────────────────────────────────────────────────────────────
-- CHECK 4: Reserved listings where reservation has expired (stale lock)
-- ─────────────────────────────────────────────────────────────
SELECT 'CHECK 4: stale reservation' AS check_name, id, reserved_until
FROM listings
WHERE status = 'reserved'
  AND (reserved_until IS NULL OR reserved_until < NOW());

-- ─────────────────────────────────────────────────────────────
-- CHECK 5: pending_payment transaction but listing is not reserved
-- ─────────────────────────────────────────────────────────────
SELECT 'CHECK 5: pending_payment but listing not reserved' AS check_name,
       t.id AS transaction_id, t.listing_id, l.status AS listing_status
FROM transactions t
JOIN listings l ON l.id = t.listing_id
WHERE t.status = 'pending_payment'
  AND l.status != 'reserved';

-- ─────────────────────────────────────────────────────────────
-- CHECK 6: Reserved listing with no matching pending_payment transaction
-- ─────────────────────────────────────────────────────────────
SELECT 'CHECK 6: reserved listing with no transaction' AS check_name, id, reserved_until
FROM listings
WHERE status = 'reserved'
  AND id NOT IN (
    SELECT listing_id FROM transactions WHERE status = 'pending_payment'
  );

-- ─────────────────────────────────────────────────────────────
-- CHECK 7: Active listings with fewer than 4 photos
-- ─────────────────────────────────────────────────────────────
SELECT 'CHECK 7: active listing with too few photos' AS check_name,
       l.id, COUNT(lp.url) AS photo_count
FROM listings l
LEFT JOIN listing_photos lp ON lp.listing_id = l.id
WHERE l.status = 'active'
GROUP BY l.id
HAVING COUNT(lp.url) < 4;

-- ─────────────────────────────────────────────────────────────
-- CHECK 8: Users with no user_profile row
-- ─────────────────────────────────────────────────────────────
SELECT 'CHECK 8: user_identity without user_profile' AS check_name,
       ui.id, ui.first_name
FROM user_identity ui
LEFT JOIN user_profile up ON up.user_id = ui.id
WHERE up.user_id IS NULL;

-- ─────────────────────────────────────────────────────────────
-- CHECK 9: Orphaned provenance rows (listing deleted or missing)
-- ─────────────────────────────────────────────────────────────
SELECT 'CHECK 9: orphaned provenance row' AS check_name, p.listing_id
FROM provenance p
LEFT JOIN listings l ON l.id = p.listing_id
WHERE l.id IS NULL;

-- ─────────────────────────────────────────────────────────────
-- CHECK 10: Transactions referencing a non-existent listing
-- ─────────────────────────────────────────────────────────────
SELECT 'CHECK 10: transaction with missing listing' AS check_name, t.id, t.listing_id
FROM transactions t
LEFT JOIN listings l ON l.id = t.listing_id
WHERE l.id IS NULL;

-- ─────────────────────────────────────────────────────────────
-- CHECK 11: Completed transactions where trust scores were not written
-- Sale_completed event should exist for every completed transaction's seller
-- ─────────────────────────────────────────────────────────────
-- Known pre-existing: transaction aafcb6bf completed before trust events trigger was built — ignore that one
SELECT 'CHECK 11: completed transaction missing trust event' AS check_name,
       t.id AS transaction_id, t.seller_id
FROM transactions t
WHERE t.status = 'completed'
  AND t.id != 'aafcb6bf-d3c6-49c3-a47e-3657f05bf3cf'
  AND NOT EXISTS (
    SELECT 1 FROM trust_events te
    WHERE te.reference_id = t.id AND te.event_type = 'sale_completed'
  );

-- ─────────────────────────────────────────────────────────────
-- CHECK 12: RLS gap — tables with INSERT/UPDATE in app but missing UPDATE policy
-- ─────────────────────────────────────────────────────────────
SELECT 'CHECK 12: table missing UPDATE policy' AS check_name, t.tablename
FROM pg_tables t
WHERE t.schemaname = 'public'
  AND t.rowsecurity = true
  AND t.tablename IN (
    'listings','listing_trust_scores','listing_measurements',
    'provenance','user_profile','user_identity','user_addresses','transactions'
  )
  AND t.tablename NOT IN (
    SELECT tablename FROM pg_policies WHERE cmd = 'UPDATE'
  );
