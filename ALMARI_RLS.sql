-- ============================================================
-- ALMARI ROW LEVEL SECURITY POLICIES
-- Supabase / PostgreSQL
-- Apply after ALMARI_SCHEMA.sql
-- ============================================================

-- ============================================================
-- HELPER FUNCTION
-- Resolves auth.uid() to user_identity.id
-- Used by all policies. SECURITY DEFINER bypasses RLS on
-- user_identity so the lookup always works.
-- ============================================================

CREATE OR REPLACE FUNCTION almari_user_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT id FROM user_identity WHERE auth_id = auth.uid()
$$;

-- ============================================================
-- PUBLIC PROFILE FUNCTION
-- Safe columns only. Raw trust score never exposed.
-- Trust tier resolved via join to trust_tiers.
-- SECURITY DEFINER required — a regular view would inherit the
-- calling user's RLS context and only return their own profile.
-- This function runs as its owner (postgres, BYPASSRLS) while
-- auth.uid() session context remains correct.
-- Call via: supabase.rpc('get_public_profile', { target_user_id })
-- ============================================================

CREATE OR REPLACE FUNCTION get_public_profile(target_user_id UUID)
RETURNS TABLE (
    user_id          UUID,
    display_name     TEXT,
    member_since     TIMESTAMPTZ,
    trust_tier       TEXT,
    trust_tier_hindi TEXT,
    diya_colour_hex  CHAR(7),
    active_listing_count INT,
    total_sales      BIGINT,
    total_purchases  BIGINT
)
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
    SELECT
        ui.id,
        ui.first_name || ' ' || ui.last_name_initial || '.',
        ui.created_at,
        tt.display_name,
        tt.hindi_name,
        tt.diya_colour_hex,
        up.active_listing_count,
        (SELECT count(*) FROM transactions t
         WHERE t.seller_id = ui.id AND t.status = 'completed'),
        (SELECT count(*) FROM transactions t
         WHERE t.buyer_id  = ui.id AND t.status = 'completed')
    FROM user_identity ui
    JOIN user_profile up ON up.user_id = ui.id
    JOIN trust_tiers tt
      ON up.trust_score_cached >= tt.min_score
     AND up.trust_score_cached <= tt.max_score
    WHERE ui.id = target_user_id;
$$;

-- ============================================================
-- DOMAIN 1: USERS AND IDENTITY
-- ============================================================

ALTER TABLE user_identity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "identity_read_own"
ON user_identity FOR SELECT
USING (auth_id = auth.uid());

CREATE POLICY "identity_insert_own"
ON user_identity FOR INSERT
WITH CHECK (auth_id = auth.uid());

CREATE POLICY "identity_update_own"
ON user_identity FOR UPDATE
USING    (auth_id = auth.uid())
WITH CHECK (auth_id = auth.uid());


ALTER TABLE user_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "addresses_read_own"
ON user_addresses FOR SELECT
USING (user_id = almari_user_id());

CREATE POLICY "addresses_insert_own"
ON user_addresses FOR INSERT
WITH CHECK (user_id = almari_user_id());

CREATE POLICY "addresses_update_own"
ON user_addresses FOR UPDATE
USING    (user_id = almari_user_id())
WITH CHECK (user_id = almari_user_id());

-- Seller reads buyer delivery address while transaction is in flight
CREATE POLICY "addresses_seller_read_for_dispatch"
ON user_addresses FOR SELECT
USING (
    id IN (
        SELECT delivery_address_id FROM transactions
        WHERE  seller_id = almari_user_id()
        AND    status NOT IN ('completed','refunded')
        AND    delivery_address_id IS NOT NULL
    )
);


ALTER TABLE user_profile ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_profile_read_own"
ON user_profile FOR SELECT
USING (user_id = almari_user_id());

CREATE POLICY "user_profile_insert_own"
ON user_profile FOR INSERT
WITH CHECK (user_id = almari_user_id());

CREATE POLICY "user_profile_update_own"
ON user_profile FOR UPDATE
USING    (user_id = almari_user_id())
WITH CHECK (user_id = almari_user_id());


ALTER TABLE trust_score_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "trust_events_read_own"
ON trust_score_events FOR SELECT
USING (user_id = almari_user_id());


ALTER TABLE removal_score_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "removal_events_read_own"
ON removal_score_events FOR SELECT
USING (user_id = almari_user_id());

-- ============================================================
-- DOMAIN 2: CONFIGURATION TABLES — public read, no client writes
-- ============================================================

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories_public_read" ON categories FOR SELECT USING (true);

ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subcategories_public_read" ON subcategories FOR SELECT USING (true);

ALTER TABLE occasion_buckets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "occasion_buckets_public_read" ON occasion_buckets FOR SELECT USING (true);

ALTER TABLE colour_swatches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "colour_swatches_public_read" ON colour_swatches FOR SELECT USING (true);

ALTER TABLE condition_tiers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "condition_tiers_public_read" ON condition_tiers FOR SELECT USING (true);

ALTER TABLE item_care_status ENABLE ROW LEVEL SECURITY;
CREATE POLICY "item_care_status_public_read" ON item_care_status FOR SELECT USING (true);

ALTER TABLE patterns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "patterns_public_read" ON patterns FOR SELECT USING (true);

ALTER TABLE work_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "work_types_public_read" ON work_types FOR SELECT USING (true);

ALTER TABLE fabric_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fabric_types_public_read" ON fabric_types FOR SELECT USING (true);

ALTER TABLE trust_event_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "trust_event_types_public_read" ON trust_event_types FOR SELECT USING (true);

ALTER TABLE trust_tiers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "trust_tiers_public_read" ON trust_tiers FOR SELECT USING (true);

ALTER TABLE seller_motivation_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "seller_motivation_types_public_read" ON seller_motivation_types FOR SELECT USING (true);

-- ============================================================
-- DOMAIN 3: CONTENT AND SEASONAL
-- ============================================================

ALTER TABLE micro_copy ENABLE ROW LEVEL SECURITY;
CREATE POLICY "micro_copy_public_read" ON micro_copy FOR SELECT USING (true);

ALTER TABLE seasonal_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "seasonal_events_public_read" ON seasonal_events FOR SELECT USING (true);

ALTER TABLE daily_exchange_rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "daily_exchange_rates_public_read" ON daily_exchange_rates FOR SELECT USING (true);

-- ============================================================
-- DOMAIN 4: POSTAGE LOOKUP TABLES
-- ============================================================

ALTER TABLE postage_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "postage_services_public_read" ON postage_services FOR SELECT USING (true);

ALTER TABLE package_bands ENABLE ROW LEVEL SECURITY;
CREATE POLICY "package_bands_public_read" ON package_bands FOR SELECT USING (true);

-- ============================================================
-- DOMAIN 5: LISTINGS
-- ============================================================

ALTER TABLE listings ENABLE ROW LEVEL SECURITY;

-- Active and reserved listings visible to everyone
CREATE POLICY "listings_public_read"
ON listings FOR SELECT
USING (status IN ('active','reserved'));

-- Sellers see all their own listings regardless of status
CREATE POLICY "listings_seller_read_own"
ON listings FOR SELECT
USING (seller_id = almari_user_id());

CREATE POLICY "listings_seller_insert"
ON listings FOR INSERT
WITH CHECK (seller_id = almari_user_id());

CREATE POLICY "listings_seller_update"
ON listings FOR UPDATE
USING    (seller_id = almari_user_id())
WITH CHECK (seller_id = almari_user_id());


ALTER TABLE listing_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "listing_photos_public_read"
ON listing_photos FOR SELECT
USING (
    listing_id IN (
        SELECT id FROM listings WHERE status IN ('active','reserved')
    )
);

CREATE POLICY "listing_photos_seller_read"
ON listing_photos FOR SELECT
USING (
    listing_id IN (
        SELECT id FROM listings WHERE seller_id = almari_user_id()
    )
);

CREATE POLICY "listing_photos_seller_insert"
ON listing_photos FOR INSERT
WITH CHECK (
    listing_id IN (
        SELECT id FROM listings WHERE seller_id = almari_user_id()
    )
);

CREATE POLICY "listing_photos_seller_delete"
ON listing_photos FOR DELETE
USING (
    listing_id IN (
        SELECT id FROM listings WHERE seller_id = almari_user_id()
    )
);


ALTER TABLE listing_measurements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "listing_measurements_public_read"
ON listing_measurements FOR SELECT
USING (
    listing_id IN (
        SELECT id FROM listings WHERE status IN ('active','reserved')
    )
);

CREATE POLICY "listing_measurements_seller_read"
ON listing_measurements FOR SELECT
USING (
    listing_id IN (
        SELECT id FROM listings WHERE seller_id = almari_user_id()
    )
);

CREATE POLICY "listing_measurements_seller_insert"
ON listing_measurements FOR INSERT
WITH CHECK (
    listing_id IN (
        SELECT id FROM listings WHERE seller_id = almari_user_id()
    )
);

CREATE POLICY "listing_measurements_seller_update"
ON listing_measurements FOR UPDATE
USING (
    listing_id IN (
        SELECT id FROM listings WHERE seller_id = almari_user_id()
    )
)
WITH CHECK (
    listing_id IN (
        SELECT id FROM listings WHERE seller_id = almari_user_id()
    )
);


ALTER TABLE listing_measurement_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "listing_measurement_details_public_read"
ON listing_measurement_details FOR SELECT
USING (
    listing_id IN (
        SELECT id FROM listings WHERE status IN ('active','reserved')
    )
);

CREATE POLICY "listing_measurement_details_seller_read"
ON listing_measurement_details FOR SELECT
USING (
    listing_id IN (
        SELECT id FROM listings WHERE seller_id = almari_user_id()
    )
);

CREATE POLICY "listing_measurement_details_seller_insert"
ON listing_measurement_details FOR INSERT
WITH CHECK (
    listing_id IN (
        SELECT id FROM listings WHERE seller_id = almari_user_id()
    )
);

CREATE POLICY "listing_measurement_details_seller_update"
ON listing_measurement_details FOR UPDATE
USING (
    listing_id IN (
        SELECT id FROM listings WHERE seller_id = almari_user_id()
    )
)
WITH CHECK (
    listing_id IN (
        SELECT id FROM listings WHERE seller_id = almari_user_id()
    )
);


ALTER TABLE listing_waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "listing_waitlist_read_own"
ON listing_waitlist FOR SELECT
USING (user_id = almari_user_id());

-- Seller sees who is waiting on their listings
CREATE POLICY "listing_waitlist_seller_read"
ON listing_waitlist FOR SELECT
USING (
    listing_id IN (
        SELECT id FROM listings WHERE seller_id = almari_user_id()
    )
);

-- Any authenticated user can join a waitlist on a listing that isn't theirs
CREATE POLICY "listing_waitlist_insert"
ON listing_waitlist FOR INSERT
WITH CHECK (
    user_id = almari_user_id()
    AND listing_id IN (
        SELECT id FROM listings
        WHERE status IN ('active','reserved')
        AND seller_id != almari_user_id()
    )
);

CREATE POLICY "listing_waitlist_delete_own"
ON listing_waitlist FOR DELETE
USING (user_id = almari_user_id());


ALTER TABLE listing_trust_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "listing_trust_scores_public_read"
ON listing_trust_scores FOR SELECT
USING (
    listing_id IN (
        SELECT id FROM listings WHERE status IN ('active','reserved')
    )
);

CREATE POLICY "listing_trust_scores_seller_read"
ON listing_trust_scores FOR SELECT
USING (
    listing_id IN (
        SELECT id FROM listings WHERE seller_id = almari_user_id()
    )
);


ALTER TABLE listing_trust_components ENABLE ROW LEVEL SECURITY;

-- Internal nudges — seller only, not public
CREATE POLICY "listing_trust_components_seller_read"
ON listing_trust_components FOR SELECT
USING (
    listing_id IN (
        SELECT id FROM listings WHERE seller_id = almari_user_id()
    )
);


ALTER TABLE private_seller_motivation ENABLE ROW LEVEL SECURITY;

CREATE POLICY "motivation_read_own"
ON private_seller_motivation FOR SELECT
USING (user_id = almari_user_id());

CREATE POLICY "motivation_insert_own"
ON private_seller_motivation FOR INSERT
WITH CHECK (user_id = almari_user_id());

CREATE POLICY "motivation_update_own"
ON private_seller_motivation FOR UPDATE
USING    (user_id = almari_user_id())
WITH CHECK (user_id = almari_user_id());

-- ============================================================
-- DOMAIN 6: PROVENANCE REFERENCE DATA
-- ============================================================

ALTER TABLE provenance_cities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "provenance_cities_public_read" ON provenance_cities FOR SELECT USING (true);

ALTER TABLE provenance_areas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "provenance_areas_public_read" ON provenance_areas FOR SELECT USING (true);

ALTER TABLE seller_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "seller_types_public_read" ON seller_types FOR SELECT USING (true);

ALTER TABLE provenance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "provenance_public_read"
ON provenance FOR SELECT
USING (
    listing_id IN (
        SELECT id FROM listings WHERE status IN ('active','reserved')
    )
);

CREATE POLICY "provenance_seller_read"
ON provenance FOR SELECT
USING (
    listing_id IN (
        SELECT id FROM listings WHERE seller_id = almari_user_id()
    )
);

CREATE POLICY "provenance_seller_insert"
ON provenance FOR INSERT
WITH CHECK (
    listing_id IN (
        SELECT id FROM listings WHERE seller_id = almari_user_id()
    )
);

CREATE POLICY "provenance_seller_update"
ON provenance FOR UPDATE
USING (
    listing_id IN (
        SELECT id FROM listings WHERE seller_id = almari_user_id()
    )
)
WITH CHECK (
    listing_id IN (
        SELECT id FROM listings WHERE seller_id = almari_user_id()
    )
);

ALTER TABLE external_platforms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "external_platforms_public_read" ON external_platforms FOR SELECT USING (true);

ALTER TABLE platform_category_mapping ENABLE ROW LEVEL SECURITY;
CREATE POLICY "platform_category_mapping_public_read" ON platform_category_mapping FOR SELECT USING (true);

ALTER TABLE benchmark_prices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "benchmark_prices_public_read" ON benchmark_prices FOR SELECT USING (true);

-- ============================================================
-- DOMAIN 7: POSTAGE PRICES
-- ============================================================

ALTER TABLE postage_prices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "postage_prices_public_read" ON postage_prices FOR SELECT USING (true);

-- ============================================================
-- DOMAIN 8: OFFERS AND TRANSACTIONS
-- ============================================================

ALTER TABLE offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "offers_buyer_read"
ON offers FOR SELECT
USING (buyer_id = almari_user_id());

CREATE POLICY "offers_seller_read"
ON offers FOR SELECT
USING (
    listing_id IN (
        SELECT id FROM listings WHERE seller_id = almari_user_id()
    )
);

CREATE POLICY "offers_buyer_insert"
ON offers FOR INSERT
WITH CHECK (buyer_id = almari_user_id());


ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "transactions_buyer_read"
ON transactions FOR SELECT
USING (buyer_id = almari_user_id());

CREATE POLICY "transactions_seller_read"
ON transactions FOR SELECT
USING (seller_id = almari_user_id());


ALTER TABLE lost_in_post_cases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lost_in_post_parties_read"
ON lost_in_post_cases FOR SELECT
USING (
    transaction_id IN (
        SELECT id FROM transactions
        WHERE buyer_id  = almari_user_id()
        OR    seller_id = almari_user_id()
    )
);

-- ============================================================
-- DOMAIN 9: PAYOUTS AND CONCERNS
-- ============================================================

ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payouts_seller_read"
ON payouts FOR SELECT
USING (seller_id = almari_user_id());


ALTER TABLE payout_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payout_items_seller_read"
ON payout_items FOR SELECT
USING (
    payout_id IN (
        SELECT id FROM payouts WHERE seller_id = almari_user_id()
    )
);


ALTER TABLE concerns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "concerns_parties_read"
ON concerns FOR SELECT
USING (
    transaction_id IN (
        SELECT id FROM transactions
        WHERE buyer_id  = almari_user_id()
        OR    seller_id = almari_user_id()
    )
);

-- Buyer raises a concern — restricted to their own transactions
CREATE POLICY "concerns_buyer_insert"
ON concerns FOR INSERT
WITH CHECK (
    raised_by_id = almari_user_id()
    AND transaction_id IN (
        SELECT id FROM transactions WHERE buyer_id = almari_user_id()
    )
);


ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_read_own"
ON notifications FOR SELECT
USING (user_id = almari_user_id());

CREATE POLICY "notifications_update_own"
ON notifications FOR UPDATE
USING    (user_id = almari_user_id())
WITH CHECK (user_id = almari_user_id());


ALTER TABLE promoted_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "promoted_listings_public_read"
ON promoted_listings FOR SELECT
USING (
    is_active = true
    AND listing_id IN (
        SELECT id FROM listings WHERE status IN ('active','reserved')
    )
);

CREATE POLICY "promoted_listings_seller_read"
ON promoted_listings FOR SELECT
USING (seller_id = almari_user_id());

-- ============================================================
-- DOMAIN 10: ANALYTICS — insert own only, no client reads
-- ============================================================

ALTER TABLE search_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "search_events_insert_own"
ON search_events FOR INSERT
WITH CHECK (user_id = almari_user_id());


ALTER TABLE listing_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "listing_views_insert_own"
ON listing_views FOR INSERT
WITH CHECK (user_id = almari_user_id());
