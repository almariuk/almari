-- ============================================================
-- ALMARI DATABASE SCHEMA — LAUNCH VERSION
-- Supabase / PostgreSQL
-- All GBP amounts in pence (integer)
-- All INR amounts as integer rupees
-- UUID primary keys on core entities
-- SERIAL primary keys on config/reference tables
-- ============================================================

-- ============================================================
-- DOMAIN 1: USERS AND IDENTITY
-- ============================================================

-- Supabase Auth handles passwords, sessions, tokens
-- We reference auth.users via auth_id

CREATE TABLE user_identity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_id UUID UNIQUE NOT NULL,
    first_name TEXT NOT NULL,
    last_name_initial CHAR(1) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES user_identity(id) NOT NULL,
    address_line_1 TEXT NOT NULL,
    address_line_2 TEXT,
    city TEXT NOT NULL,
    postcode TEXT NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_profile (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES user_identity(id) UNIQUE NOT NULL,
    bust_cm INT,
    waist_cm INT,
    hips_cm INT,
    height_cm INT,
    uk_shoe_size NUMERIC(4,1),
    trust_score_cached INT DEFAULT 0,
    trust_score_updated_at TIMESTAMPTZ,
    removal_score INT DEFAULT 0,
    free_listing_active BOOLEAN DEFAULT TRUE,
    free_listing_suspended_at TIMESTAMPTZ,
    free_listing_reinstated_at TIMESTAMPTZ,
    stripe_account_id TEXT,
    bank_details_provided BOOLEAN DEFAULT FALSE,
    active_listing_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE trust_score_events (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES user_identity(id) NOT NULL,
    event_type_id INT NOT NULL,
    score_delta INT NOT NULL,
    reference_id TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE removal_score_events (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES user_identity(id) NOT NULL,
    listing_id UUID NOT NULL,
    reason TEXT NOT NULL,
    score_delta INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Computed trust score view
CREATE VIEW user_trust_scores AS
SELECT user_id, SUM(score_delta) AS trust_score, COUNT(*) AS event_count
FROM trust_score_events GROUP BY user_id;

-- ============================================================
-- DOMAIN 2: CONFIGURATION TABLES
-- All editable via Supabase dashboard — no code deploy needed
-- ============================================================

CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    display_order INT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE subcategories (
    id SERIAL PRIMARY KEY,
    category_id INT REFERENCES categories(id) NOT NULL,
    name TEXT NOT NULL,
    display_order INT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE occasion_buckets (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    display_name TEXT NOT NULL,
    description TEXT NOT NULL,
    display_order INT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE colour_swatches (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    name_hindi TEXT,
    hex_code CHAR(7) NOT NULL,
    colour_family TEXT,
    display_order INT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE condition_tiers (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    display_text TEXT NOT NULL,
    detail_text TEXT,
    listing_trust_contribution INT DEFAULT 0,
    display_order INT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE item_care_status (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    display_text TEXT NOT NULL,
    detail_text TEXT,
    listing_trust_contribution INT DEFAULT 0,
    display_order INT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE patterns (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    display_name TEXT NOT NULL,
    description TEXT,
    myntra_terms TEXT,
    ajio_terms TEXT,
    nalli_terms TEXT,
    manyavar_terms TEXT,
    display_order INT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE work_types (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    display_name TEXT NOT NULL,
    description TEXT,
    myntra_terms TEXT,
    ajio_terms TEXT,
    nalli_terms TEXT,
    manyavar_terms TEXT,
    display_order INT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE fabric_types (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    display_name TEXT NOT NULL,
    description TEXT,
    myntra_terms TEXT,
    ajio_terms TEXT,
    nalli_terms TEXT,
    manyavar_terms TEXT,
    display_order INT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE trust_event_types (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    display_name TEXT NOT NULL,
    score_delta INT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('verification','activity','behaviour')),
    is_one_time BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE trust_tiers (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    display_name TEXT NOT NULL,
    hindi_name TEXT,
    description TEXT,
    diya_colour_hex CHAR(7),
    min_score INT NOT NULL,
    max_score INT NOT NULL,
    is_visible BOOLEAN DEFAULT TRUE,
    display_order INT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE seller_motivation_types (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    display_text TEXT NOT NULL,
    is_time_sensitive BOOLEAN DEFAULT FALSE,
    display_order INT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- DOMAIN 3: CONTENT AND SEASONAL
-- ============================================================

CREATE TABLE micro_copy (
    id SERIAL PRIMARY KEY,
    context TEXT NOT NULL,
    key TEXT NOT NULL,
    display_text TEXT NOT NULL,
    detail_text TEXT,
    display_order INT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (context, key)
);

CREATE TABLE seasonal_events (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    notify_sellers_at DATE NOT NULL,
    notify_buyers_at DATE NOT NULL,
    event_date DATE,
    relevant_occasion_ids INT[],
    seller_message TEXT NOT NULL,
    buyer_message TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE daily_exchange_rates (
    id SERIAL PRIMARY KEY,
    from_currency CHAR(3) NOT NULL,
    to_currency CHAR(3) NOT NULL,
    rate NUMERIC(10,4) NOT NULL,
    rate_date DATE NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- DOMAIN 4: LISTINGS
-- ============================================================

CREATE TABLE listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID REFERENCES user_identity(id) NOT NULL,
    category_id INT REFERENCES categories(id) NOT NULL,
    subcategory_id INT REFERENCES subcategories(id) NOT NULL,
    occasion_bucket_id INT REFERENCES occasion_buckets(id),
    colour_id INT REFERENCES colour_swatches(id),
    condition_id INT REFERENCES condition_tiers(id) NOT NULL,
    pattern_id INT REFERENCES patterns(id),
    work_type_id INT REFERENCES work_types(id),
    fabric_type_id INT REFERENCES fabric_types(id),
    care_status_id INT REFERENCES item_care_status(id),
    why_selling_copy_id INT REFERENCES micro_copy(id),
    seller_motivation_type_id INT REFERENCES seller_motivation_types(id),
    set_contents TEXT,
    set_complete BOOLEAN,
    additional_notes TEXT,
    asking_price_pence INT,
    status TEXT NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft','active','reserved','sold','removed','suspended')),
    negotiation_active BOOLEAN DEFAULT FALSE,
    waitlist_count INT DEFAULT 0,
    listing_type TEXT DEFAULT 'detailed',
    relist_count INT DEFAULT 0,
    removal_reason TEXT
        CHECK (removal_reason IN ('mistake','changed_mind','sold_elsewhere','damaged','other')),
    removed_at TIMESTAMPTZ,
    package_band_id INT REFERENCES package_bands(id),
    postage_service_id INT REFERENCES postage_services(id),
    postage_price_pence INT,
    underinsured_warning_shown BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Maintain active_listing_count
CREATE OR REPLACE FUNCTION update_listing_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.status = 'active' THEN
        UPDATE user_profile SET active_listing_count = active_listing_count + 1 WHERE user_id = NEW.seller_id;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.status != 'active' AND NEW.status = 'active' THEN
            UPDATE user_profile SET active_listing_count = active_listing_count + 1 WHERE user_id = NEW.seller_id;
        ELSIF OLD.status = 'active' AND NEW.status != 'active' THEN
            UPDATE user_profile SET active_listing_count = active_listing_count - 1 WHERE user_id = NEW.seller_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER maintain_listing_count
    AFTER INSERT OR UPDATE ON listings
    FOR EACH ROW EXECUTE FUNCTION update_listing_count();

CREATE TABLE listing_photos (
    id SERIAL PRIMARY KEY,
    listing_id UUID REFERENCES listings(id) NOT NULL,
    url TEXT NOT NULL,
    display_order INT NOT NULL,
    photo_type TEXT CHECK (photo_type IN ('front','back','detail','label','full_length','other')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE listing_measurements (
    id SERIAL PRIMARY KEY,
    listing_id UUID REFERENCES listings(id) UNIQUE NOT NULL,
    bust_cm INT,
    waist_cm INT,
    hips_cm INT,
    chest_cm INT,
    height_cm INT,
    uk_shoe_size NUMERIC(4,1),
    label_size TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE listing_measurement_details (
    id SERIAL PRIMARY KEY,
    listing_id UUID REFERENCES listings(id) UNIQUE NOT NULL,
    garment_type TEXT NOT NULL,
    details JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE listing_waitlist (
    id SERIAL PRIMARY KEY,
    listing_id UUID REFERENCES listings(id) NOT NULL,
    user_id UUID REFERENCES user_identity(id) NOT NULL,
    position INT NOT NULL,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    notified_at TIMESTAMPTZ,
    converted_at TIMESTAMPTZ,
    UNIQUE (listing_id, user_id)
);

CREATE TABLE listing_trust_scores (
    id SERIAL PRIMARY KEY,
    listing_id UUID REFERENCES listings(id) UNIQUE NOT NULL,
    total_score INT DEFAULT 0,
    last_calculated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE listing_trust_components (
    id SERIAL PRIMARY KEY,
    listing_id UUID REFERENCES listings(id) NOT NULL,
    component_name TEXT NOT NULL,
    max_score INT NOT NULL,
    earned_score INT NOT NULL DEFAULT 0,
    is_complete BOOLEAN DEFAULT FALSE,
    nudge_text TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (listing_id, component_name)
);

CREATE TABLE private_seller_motivation (
    id SERIAL PRIMARY KEY,
    listing_id UUID REFERENCES listings(id) UNIQUE NOT NULL,
    user_id UUID REFERENCES user_identity(id) NOT NULL,
    motivation_type_id INT REFERENCES seller_motivation_types(id) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- DOMAIN 5: PROVENANCE REFERENCE DATA
-- ============================================================

CREATE TABLE provenance_cities (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    country TEXT NOT NULL DEFAULT 'India',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE provenance_areas (
    id SERIAL PRIMARY KEY,
    city_id INT REFERENCES provenance_cities(id) NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE seller_types (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE provenance (
    id SERIAL PRIMARY KEY,
    listing_id UUID REFERENCES listings(id) UNIQUE NOT NULL,
    city_id INT REFERENCES provenance_cities(id),
    area_id INT REFERENCES provenance_areas(id),
    seller_type_id INT REFERENCES seller_types(id),
    purchase_year INT,
    original_price_inr INT,
    original_price_approximate BOOLEAN DEFAULT FALSE,
    is_heirloom BOOLEAN DEFAULT FALSE,
    heirloom_story TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE external_platforms (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    base_url TEXT NOT NULL,
    last_scraped_at TIMESTAMPTZ,
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE platform_category_mapping (
    id SERIAL PRIMARY KEY,
    platform_id INT REFERENCES external_platforms(id) NOT NULL,
    platform_category_name TEXT NOT NULL,
    almari_subcategory_id INT REFERENCES subcategories(id) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE benchmark_prices (
    id SERIAL PRIMARY KEY,
    platform_id INT REFERENCES external_platforms(id) NOT NULL,
    almari_subcategory_id INT REFERENCES subcategories(id) NOT NULL,
    fabric_type_id INT REFERENCES fabric_types(id),
    pattern_id INT REFERENCES patterns(id),
    price_low_inr INT,
    price_mid_inr INT,
    price_high_inr INT,
    gbp_inr_rate NUMERIC(10,4),
    price_low_gbp NUMERIC(10,2),
    price_mid_gbp NUMERIC(10,2),
    price_high_gbp NUMERIC(10,2),
    scraped_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- DOMAIN 6: POSTAGE
-- ============================================================

CREATE TABLE postage_services (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    max_compensation_pence INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE package_bands (
    id SERIAL PRIMARY KEY,
    size_label TEXT NOT NULL CHECK (size_label IN ('Small','Medium','Large')),
    weight_label TEXT NOT NULL CHECK (weight_label IN ('Light','Medium','Heavy')),
    size_description TEXT NOT NULL,
    weight_description TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (size_label, weight_label)
);

CREATE TABLE postage_prices (
    id SERIAL PRIMARY KEY,
    service_id INT REFERENCES postage_services(id) NOT NULL,
    band_id INT REFERENCES package_bands(id) NOT NULL,
    price_pence INT NOT NULL,
    cost_pence INT NOT NULL,
    margin_pence INT GENERATED ALWAYS AS (price_pence - cost_pence) STORED,
    effective_from TIMESTAMPTZ DEFAULT NOW(),
    effective_to TIMESTAMPTZ,
    UNIQUE (service_id, band_id, effective_from)
);

-- ============================================================
-- DOMAIN 7: OFFERS AND TRANSACTIONS
-- ============================================================

CREATE TABLE offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID REFERENCES listings(id) NOT NULL,
    buyer_id UUID REFERENCES user_identity(id) NOT NULL,
    buyer_offer_pence INT NOT NULL,
    buyer_note TEXT,
    buyer_offered_at TIMESTAMPTZ DEFAULT NOW(),
    buyer_offer_expires_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending','accepted','declined','expired','completed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID REFERENCES listings(id) NOT NULL,
    seller_id UUID REFERENCES user_identity(id) NOT NULL,
    buyer_id UUID REFERENCES user_identity(id) NOT NULL,
    offer_id UUID REFERENCES offers(id),
    delivery_address_id UUID REFERENCES user_addresses(id),
    sale_price_pence INT NOT NULL,
    postage_price_pence INT NOT NULL,
    postage_cost_pence INT NOT NULL,
    total_paid_pence INT NOT NULL,
    seller_receives_pence INT NOT NULL,
    postage_service_id INT REFERENCES postage_services(id),
    tracking_number TEXT,
    dispatched_at TIMESTAMPTZ,
    estimated_delivery_date DATE,
    tracking_confirmed_delivered_at TIMESTAMPTZ,
    buyer_confirmed_delivered_at TIMESTAMPTZ,
    concern_window_started_at TIMESTAMPTZ,
    concern_window_closes_at TIMESTAMPTZ,
    eta_nudge_sent_at TIMESTAMPTZ,
    lost_in_post_eligible_at TIMESTAMPTZ,
    stripe_payment_intent_id TEXT,
    escrow_status TEXT NOT NULL DEFAULT 'held'
        CHECK (escrow_status IN ('held','released','refunded','disputed')),
    funds_released_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'paid'
        CHECK (status IN ('paid','dispatched','in_transit','delivered','completed','concern_raised','lost_in_post','refunded')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE lost_in_post_cases (
    id SERIAL PRIMARY KEY,
    transaction_id UUID REFERENCES transactions(id) UNIQUE NOT NULL,
    opened_by_buyer_id UUID REFERENCES user_identity(id) NOT NULL,
    opened_at TIMESTAMPTZ DEFAULT NOW(),
    seller_agreed BOOLEAN,
    seller_agreed_at TIMESTAMPTZ,
    buyer_agreed BOOLEAN,
    buyer_agreed_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'open'
        CHECK (status IN ('open','awaiting_agreement','agreed','resolved')),
    royal_mail_claim_reference TEXT,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- DOMAIN 8: PAYOUTS AND CONCERNS
-- ============================================================

CREATE TABLE payouts (
    id SERIAL PRIMARY KEY,
    seller_id UUID REFERENCES user_identity(id) NOT NULL,
    total_pence INT NOT NULL,
    transaction_count INT NOT NULL,
    stripe_payout_id TEXT,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending','processing','paid','failed')),
    scheduled_for TIMESTAMPTZ NOT NULL,
    paid_at TIMESTAMPTZ,
    failed_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE payout_items (
    id SERIAL PRIMARY KEY,
    payout_id INT REFERENCES payouts(id) NOT NULL,
    transaction_id UUID REFERENCES transactions(id) NOT NULL,
    item_reference TEXT NOT NULL,
    item_description TEXT NOT NULL,
    sale_price_pence INT NOT NULL,
    postage_paid_by_buyer_pence INT NOT NULL,
    seller_receives_pence INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE concerns (
    id SERIAL PRIMARY KEY,
    transaction_id UUID REFERENCES transactions(id) NOT NULL,
    raised_by_id UUID REFERENCES user_identity(id) NOT NULL,
    reason TEXT NOT NULL
        CHECK (reason IN ('condition_worse_than_described','set_incomplete','vendor_suspected')),
    reviewed_by TEXT,
    reviewed_at TIMESTAMPTZ,
    upheld BOOLEAN,
    trust_score_impact INT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES user_identity(id) NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    channel TEXT NOT NULL DEFAULT 'push' CHECK (channel IN ('push','email')),
    reference_type TEXT,
    reference_id TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    push_sent BOOLEAN DEFAULT FALSE,
    push_sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE promoted_listings (
    id SERIAL PRIMARY KEY,
    listing_id UUID REFERENCES listings(id) NOT NULL,
    seller_id UUID REFERENCES user_identity(id) NOT NULL,
    fee_pence INT NOT NULL,
    stripe_charge_id TEXT,
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- DOMAIN 9: ANALYTICS
-- ============================================================

CREATE TABLE search_events (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES user_identity(id),
    session_id TEXT,
    query TEXT,
    filters JSONB DEFAULT '{}',
    results_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE listing_views (
    id SERIAL PRIMARY KEY,
    listing_id UUID REFERENCES listings(id) NOT NULL,
    user_id UUID REFERENCES user_identity(id),
    session_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_listings_status ON listings(status);
CREATE INDEX idx_listings_category ON listings(category_id, subcategory_id);
CREATE INDEX idx_listings_seller ON listings(seller_id);
CREATE INDEX idx_listings_trust ON listings(status) WHERE status = 'active';
CREATE INDEX idx_listings_created ON listings(created_at DESC);
CREATE INDEX idx_listing_measurements_fit ON listing_measurements(waist_cm, bust_cm, hips_cm, chest_cm, uk_shoe_size);
CREATE INDEX idx_offers_listing ON offers(listing_id, status);
CREATE INDEX idx_offers_buyer ON offers(buyer_id);
CREATE INDEX idx_offers_expires ON offers(buyer_offer_expires_at) WHERE status = 'pending';
CREATE INDEX idx_transactions_seller ON transactions(seller_id);
CREATE INDEX idx_transactions_buyer ON transactions(buyer_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_escrow ON transactions(escrow_status);
CREATE INDEX idx_trust_events_user ON trust_score_events(user_id);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX idx_search_events_created ON search_events(created_at DESC);
CREATE INDEX idx_listing_views_listing ON listing_views(listing_id, created_at DESC);
CREATE INDEX idx_benchmark_prices_lookup ON benchmark_prices(almari_subcategory_id, fabric_type_id);

-- ============================================================
-- ALMARI SEED DATA
-- ============================================================

INSERT INTO categories (name, display_order) VALUES
('Women', 1), ('Men', 2), ('Kids', 3);

INSERT INTO subcategories (category_id, name, display_order) VALUES
(1,'Saree',1),(1,'Lehenga set',2),(1,'Salwar kameez set',3),(1,'Anarkali set',4),
(1,'Kurta',5),(1,'Dupatta',6),(1,'Blouse',7),(1,'Co-ord set',8),
(1,'Sharara set',9),(1,'Gharara set',10),(1,'Indo western gown',11),
(1,'Dress material',12),(1,'Footwear',13),
(2,'Sherwani set',1),(2,'Kurta pyjama set',2),(2,'Nehru jacket',3),
(2,'Bandhgala suit',4),(2,'Jodhpuri suit',5),(2,'Indo western',6),(2,'Footwear',7),
(3,'Girls ethnic wear',1),(3,'Boys ethnic wear',2),(3,'Kids footwear',3);

INSERT INTO occasion_buckets (name, display_name, description, display_order) VALUES
('grand_occasion','Grand Occasion','Dulha / Dulhan. Shaadi ka joda. The most special outfit of your life.',1),
('wedding_functions','Wedding Functions','Shaadi ke rangi. For the family and friends who make the celebrations.',2),
('festive','Festive','Tyohaar. Diwali, Eid, Navratri, Karva Chauth. Time to shine.',3),
('religious_puja','Religious and Puja','Pooja aur mandir. Modest, traditional, respectful.',4),
('family_social','Family and Social','Ghar aur yaar. Gatherings, dinners, get togethers.',5),
('everyday','Everyday','Rozana. Beautiful, comfortable, yours.',6);

INSERT INTO condition_tiers (name, display_text, detail_text, listing_trust_contribution, display_order) VALUES
('new_with_tags','Brand new with tags. Never worn.','Tags still attached.',15,1),
('new_without_tags','Bought new, never worn.','Tags removed or lost but unworn.',12,2),
('worn_once','I wore it once. It''s basically new.','One occasion. Cleaned and stored.',10,3),
('worn_few_times','I''ve worn it a handful of times. Still beautiful.','Gently used. No damage.',7,4),
('well_loved','It''s been well loved.','Worn regularly. May show some wear.',4,5);

INSERT INTO item_care_status (name, display_text, detail_text, listing_trust_contribution, display_order) VALUES
('dry_cleaned','Dry cleaned and packed','Ready to wear',10,1),
('washed_pressed','Freshly washed and pressed','Ready to wear',8,2),
('needs_cleaning','Needs a clean or press before wearing','Factor this into your offer',0,3);

INSERT INTO patterns (name, display_name, description, myntra_terms, ajio_terms, nalli_terms, manyavar_terms, display_order) VALUES
('printed','Printed','Pattern on the fabric. Block print, floral, geometric.','Printed,Floral,Geometric,Digital Print,Block Print,Paisley','Printed,Floral,Digital,Block Print','Printed,Floral,Geometric','Printed,Floral',1),
('woven','Woven pattern','The pattern is part of the weave itself.','Woven,Jacquard,Brocade,Self Design,Ikat','Woven,Jacquard,Self Design','Kanjivaram,Banarasi,Ikat,Paithani,Tussar,Chanderi','Jacquard,Brocade',2),
('embroidered','Embroidered','Thread or needle work stitched onto the fabric.','Embroidered,Chikankari,Phulkari,Kantha','Embroidered,Chikankari','Embroidered,Chikankari,Kantha','Embroidered,Resham',3),
('bandhani','Bandhani and tie dye','Resist dyeing techniques.','Bandhani,Leheriya,Tie and Dye,Shibori','Bandhani,Tie Dye','Bandhani,Leheriya',NULL,4),
('kalamkari','Kalamkari and hand painted','Hand drawn or painted designs on fabric.','Kalamkari,Hand Painted,Ajrakh','Kalamkari,Hand Painted','Kalamkari',NULL,5),
('plain','Plain and solid','No pattern — pure fabric and colour.','Solid,Plain','Solid,Plain','Plain,Solid','Solid',6);

INSERT INTO work_types (name, display_name, description, myntra_terms, ajio_terms, nalli_terms, manyavar_terms, display_order) VALUES
('zari','Zari and gold work','Metallic thread work — gold or silver.','Zari,Zari Work,Badla,Tilla,Mukaish','Zari,Metallic Work','Zari,Kota Zari,Zardozi','Zari,Zardozi',1),
('sequins','Sequins and stones','Anything that sparkles and is attached.','Sequins,Embellished,Stone Work,Cutdana,Kundan,Moti','Sequins,Embellished,Stone','Sequins,Stone Work','Sequins,Stone',2),
('mirror','Mirror work','Mirrors stitched into the fabric.','Mirror Work,Shisha','Mirror Work','Mirror Work',NULL,3),
('gota','Gota and ribbon','Flat metallic ribbon applique.','Gota Patti,Gota Work,Applique,Patch Work','Gota,Applique','Gota Patti',NULL,4),
('thread','Thread embroidery','Needle and coloured thread work only.','Thread Work,Resham,Aari Work,Crewel','Thread Work,Aari','Thread Embroidery,Resham','Thread Work,Aari',5),
('handloom','Handloom and craft','Work is in the weaving itself.','Handloom,Hand Woven,Khadi','Handloom,Hand Woven','Handloom,Hand Woven',NULL,6),
('no_work','No work','Plain fabric, no embellishment.','No Embellishment,Plain','Plain,No Work','Plain','Plain',7);

INSERT INTO fabric_types (name, display_name, description, myntra_terms, ajio_terms, nalli_terms, manyavar_terms, display_order) VALUES
('silk','Silk','Pure silk — premium, lustrous, heavy.','Silk,Pure Silk','Silk','Kanjivaram Silk,Banarasi Silk,Soft Silk,Raw Silk,Tussar Silk','Silk,Brocade Silk',1),
('cotton','Cotton','Natural cotton — breathable, everyday.','Cotton,Pure Cotton','Cotton','Cotton,Cotton Silk','Cotton',2),
('georgette','Georgette','Lightweight, flowy, slightly sheer.','Georgette','Georgette','Georgette','Georgette',3),
('chiffon','Chiffon','Very light, sheer, delicate.','Chiffon','Chiffon','Chiffon',NULL,4),
('net','Net','Open weave, sheer — lehengas and dupattas.','Net,Tulle','Net','Net','Net',5),
('velvet','Velvet','Heavy, rich, winter wear.','Velvet','Velvet','Velvet','Velvet',6),
('crepe','Crepe','Slightly textured, fluid, mid weight.','Crepe','Crepe','Crepe',NULL,7),
('organza','Organza','Crisp, sheer, structured.','Organza','Organza','Organza Silk',NULL,8),
('chanderi','Chanderi','Fine handwoven silk and cotton blend.','Chanderi,Chanderi Silk','Chanderi','Chanderi',NULL,9),
('khadi','Khadi','Hand spun, hand woven — sustainable.','Khadi,Khadi Cotton','Khadi','Khadi',NULL,10),
('linen','Linen','Natural, textured, breathable.','Linen','Linen','Linen',NULL,11),
('rayon','Rayon','Lightweight, smooth, affordable.','Rayon,Viscose','Rayon',NULL,NULL,12),
('brocade','Brocade','Heavy woven with raised patterns.','Brocade,Jacquard','Brocade','Brocade Silk','Brocade,Jacquard',13),
('satin','Satin','Smooth, glossy, luxurious.','Satin','Satin','Satin Silk','Satin',14),
('cotton_silk','Cotton silk','Blend of cotton and silk.','Cotton Silk,Silk Cotton','Cotton Silk','Cotton Silk,Soft Silk',NULL,15);

INSERT INTO trust_event_types (name, display_name, score_delta, category, is_one_time) VALUES
('email_verified','Email verified',2,'verification',true),
('address_provided','UK address added',3,'verification',true),
('measurements_saved','Measurements saved',2,'verification',true),
('bank_details_provided','Bank details added',3,'verification',true),
('phone_verified','Phone number verified',3,'verification',true),
('first_listing','First listing created',2,'activity',true),
('first_purchase','First purchase completed',2,'activity',true),
('sale_completed','Completed a sale',5,'activity',false),
('purchase_completed','Completed a purchase',3,'activity',false),
('detailed_listing','Created a detailed listing',1,'activity',false),
('measurements_provided','Added full measurements to listing',1,'activity',false),
('waitlist_converted','Waitlist buyer converted',2,'activity',false),
('concern_upheld','Concern upheld against them',-10,'behaviour',false),
('listing_removed_changed_mind','Removed listing — changed mind',-2,'behaviour',false),
('listing_removed_sold_elsewhere','Sold elsewhere — bypassed Almari',-5,'behaviour',false);

INSERT INTO trust_tiers (name, display_name, hindi_name, description, diya_colour_hex, min_score, max_score, is_visible, display_order) VALUES
('new_beginning','Nayi Shuruwat','नयी शुरुआत','Welcome to Almari','#CC0000',0,20,true,1),
('apna','Apna','अपना','One of ours','#CD7F32',21,50,true,2),
('bharosa','Bharosa','भरोसा','The community trusts you','#C0C0C0',51,100,true,3),
('izzat','Izzat','इज़्ज़त','Respect','#4169E1',101,200,false,4),
('aanch','Aanch','आँच','The flame itself','#FFD700',201,999999,false,5);

INSERT INTO seller_motivation_types (name, display_text, is_time_sensitive, display_order) VALUES
('kids_grown','Kids have grown out of it',true,1),
('moving_house','Moving house',true,2),
('upgrading','Upgrading my wardrobe',false,3),
('gift_unworn','It was a gift — never worn',false,4),
('financial','Financial reasons',false,5),
('emotional','Ready to let go',false,6),
('other','Other',false,7);

INSERT INTO colour_swatches (name, name_hindi, hex_code, colour_family, display_order) VALUES
('Bridal Red','Laal','#CC0000','Reds',1),
('Wine','Gehra Laal','#722F37','Reds',2),
('Maroon','Maroon','#800000','Reds',3),
('Burgundy','Gehra Maroon','#800020','Reds',4),
('Coral','Moonga','#FF6B6B','Reds',5),
('Blush Pink','Gulabi','#FFB6C1','Pinks',6),
('Rose Gold','Gulaabi Sona','#B76E79','Pinks',7),
('Magenta','Rani Pink','#C2185B','Pinks',8),
('Dusty Rose','Phiki Gulabi','#DCAE96','Pinks',9),
('Saffron','Kesariya','#FF6600','Yellows',10),
('Yellow','Peela','#FFD700','Yellows',11),
('Mustard','Sarson','#FFDB58','Yellows',12),
('Orange','Narangi','#FFA500','Oranges',13),
('Peach','Aadu','#FFCBA4','Oranges',14),
('Mehendi Green','Mehendi','#4B6F44','Greens',15),
('Emerald','Zamurrud','#50C878','Greens',16),
('Forest Green','Haraa','#228B22','Greens',17),
('Peacock','Mor Neela','#005F6A','Greens',18),
('Teal','Firozi','#008080','Greens',19),
('Royal Blue','Shahi Neela','#4169E1','Blues',20),
('Navy','Gehra Neela','#000080','Blues',21),
('Sapphire','Neelam','#0F52BA','Blues',22),
('Indigo','Neel','#4B0082','Blues',23),
('Purple','Baingani','#800080','Purples',24),
('Amethyst','Jamuni','#9966CC','Purples',25),
('Ivory','Malai','#FFFFF0','Neutrals',26),
('Champagne','Phiki Malai','#F7E7CE','Neutrals',27),
('White','Safed','#FFFFFF','Neutrals',28),
('Black','Kaala','#000000','Neutrals',29),
('Gold','Sona','#FFD700','Metallics',30),
('Silver','Chandi','#C0C0C0','Metallics',31);

INSERT INTO provenance_cities (name, country) VALUES
('Delhi','India'),('Mumbai','India'),('Jaipur','India'),('Surat','India'),
('Hyderabad','India'),('Kolkata','India'),('Chennai','India'),('Bangalore','India'),
('Lucknow','India'),('Amritsar','India'),('Lahore','Pakistan'),('Karachi','Pakistan'),
('London','UK'),('Leicester','UK'),('Birmingham','UK'),('Other','Other');

INSERT INTO provenance_areas (city_id, name) VALUES
(1,'Chandni Chowk'),(1,'Lajpat Nagar'),(1,'Sarojini Nagar'),(1,'Karol Bagh'),
(1,'Khan Market'),(2,'Linking Road'),(2,'Bandra'),(2,'Colaba'),
(3,'Johari Bazaar'),(3,'Bapu Bazaar'),(4,'Surat Textile Market'),
(10,'Hall Bazaar'),(10,'Lawrence Road');

INSERT INTO seller_types (name) VALUES
('Street market'),('Boutique'),('Mall brand'),('Tailor made'),('Gift — not sure'),('Online');

INSERT INTO postage_services (name, description, max_compensation_pence) VALUES
('Royal Mail Signed For','3 to 5 days · Signature on delivery · Covered up to £100',10000),
('Royal Mail Special Delivery','Next day by 1pm · Signature on delivery · Covered up to £750',75000);

INSERT INTO package_bands (size_label, weight_label, size_description, weight_description) VALUES
('Small','Light','Fits in a large envelope — a dupatta or single kurta','Under 1kg'),
('Small','Medium','Fits in a large envelope — a dupatta or single kurta','1 to 2kg'),
('Small','Heavy','Fits in a large envelope — a dupatta or single kurta','Over 2kg'),
('Medium','Light','Shoebox size — a salwar set or saree','Under 1kg'),
('Medium','Medium','Shoebox size — a salwar set or saree','1 to 2kg'),
('Medium','Heavy','Shoebox size — a salwar set or saree','Over 2kg'),
('Large','Light','Bigger than a shoebox — a lehenga or sherwani set','Under 1kg'),
('Large','Medium','Bigger than a shoebox — a lehenga or sherwani set','1 to 2kg'),
('Large','Heavy','Bigger than a shoebox — a lehenga or sherwani set','Over 2kg');

INSERT INTO external_platforms (name, base_url, notes) VALUES
('Myntra','https://www.myntra.com','Ethnic wear section. Monthly scrape.'),
('Ajio','https://www.ajio.com','Ethnic wear section. Monthly scrape.'),
('Nalli','https://www.nalli.com','Silk sarees specifically. Monthly scrape.'),
('Manyavar','https://www.manyavar.com','Men ethnic wear. Monthly scrape.');

INSERT INTO micro_copy (context, key, display_text, display_order) VALUES
('why_selling','option_1','It came from India. Now it needs a new story.',1),
('why_selling','option_2','I just want it to go to a good home.',2),
('why_selling','option_3','It was my mother''s. Time to pass it on.',3),
('why_selling','option_4','It''s been well loved. Someone else should enjoy it.',4),
('why_selling','option_5','Just give me something for it.',5),
('why_selling','option_6','It deserves to be worn again.',6),
('why_selling','option_7','My children will never wear it. Someone''s should.',7),
('offer_declined','message','Thank you. The seller isn''t able to accept this offer right now.',1),
('offer_declined','suggestion','Why not join the waitlist in case something changes?',2),
('offer_accepted','message','It''s yours. A beautiful piece found a new home.',1),
('offer_accepted','next_step','Complete your payment to secure it.',2),
('waitlist_join','confirmation','You''re on the waitlist. We''ll let you know if it becomes available.',1),
('waitlist_join','encouragement','These things do fall through.',2),
('waitlist_notify','message','Good news — the piece you were waiting for is available. You''re first in the queue.',1),
('listing_nudge','add_measurements','Add measurements to reach 88 and unlock your price suggestion.',1),
('listing_nudge','add_provenance','Tell us where this came from to build buyer confidence.',2),
('listing_nudge','add_photos','More photos means more trust. Add a detail or label shot.',3),
('listing_nudge','add_care_status','Let buyers know it''s ready to wear.',4),
('onboarding','slide_1_title','From our cupboards to yours.',1),
('onboarding','slide_1_body','A community marketplace for Indian ethnic wear in the UK. Real people. Real wardrobes. Real stories.',1),
('onboarding','slide_2_title','Every piece has a story.',2),
('onboarding','slide_2_body','Where it came from. Who wore it. What it meant. Almari captures it all.',2),
('onboarding','slide_3_title','The diaspora looking after its own.',3),
('onboarding','slide_3_body','No shops. No vendors. Just us passing beautiful clothes to each other.',3),
('dispatch','prompt','Your item sold. Get it posted within 48 hours.',1),
('dispatch','encouragement','Someone is excited to receive this.',2),
('dispatch','confirmation','Dispatched. The next chapter begins.',3),
('delivery','arriving','Your item is on its way.',1),
('delivery','confirm_prompt','Has it arrived? Let us know so the seller can be paid.',2),
('delivery','confirmed','Enjoy it. Wear it. Pass it on one day.',3),
('lost_in_post','nudge','Your parcel was expected by now. Has it arrived?',1),
('lost_in_post','sorry','We are so sorry your package hasn''t arrived.',2),
('lost_in_post','guidance','Please raise a claim directly with Royal Mail using your tracking number. We cannot contact them on your behalf but we are here to support you.',3),
('tier_unlock','apna','You''ve become Apna. The community knows you.',1),
('tier_unlock','bharosa','Bharosa. The community trusts you.',2),
('payout','sent','Your payment is on its way. Should be with you by tomorrow.',1),
('payout','no_bank_details','Add your bank details so we can pay you.',2),
('empty_state','no_listings','Nothing here yet. Be the first to list something.',1),
('empty_state','no_purchases','You haven''t bought anything yet. Something beautiful is waiting.',2),
('empty_state','no_sales','No sales yet. Your first one is coming.',3),
('empty_state','no_search_results','Nothing found. But someone might list exactly this tomorrow.',4),
('seasonal','diwali_buyer','Diwali is coming. Something festive is waiting for you.',1),
('seasonal','diwali_seller','Diwali in three weeks. Your festive pieces could find a new home.',2),
('seasonal','wedding_buyer','Wedding season is here. Find your outfit on Almari.',3),
('seasonal','wedding_seller','Wedding season is starting. Your occasion wear could be perfect for someone''s big day.',4);

INSERT INTO seasonal_events (name, notify_sellers_at, notify_buyers_at, seller_message, buyer_message, relevant_occasion_ids) VALUES
('Diwali','2025-10-01','2025-10-08','Diwali is coming. Your festive pieces could find a new home.','Diwali is three weeks away. Looking for something festive?',ARRAY[3]),
('Eid','2026-03-01','2026-03-08','Eid is coming. Your festive pieces could find a new home.','Eid is approaching. Beautiful pieces listed this week.',ARRAY[3]),
('Wedding Season Spring','2026-02-01','2026-02-15','Wedding season is starting. List your occasion pieces now.','Wedding season is here. Find your outfit on Almari.',ARRAY[1,2]),
('Wedding Season Autumn','2026-09-01','2026-09-15','Autumn wedding season is coming. List your occasion pieces now.','Autumn weddings are here. Something beautiful is waiting.',ARRAY[1,2]);

