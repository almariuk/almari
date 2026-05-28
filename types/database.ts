// ============================================================
// ALMARI DATABASE TYPES
// Generated to match ALMARI_SCHEMA.sql exactly.
// GBP amounts: pence (integer). INR amounts: integer rupees.
// ============================================================

// ── Users ────────────────────────────────────────────────────

export interface UserIdentityRow {
  id: string;
  auth_id: string;
  first_name: string;
  last_name_initial: string;
  created_at: string;
  updated_at: string;
}

export interface UserAddressRow {
  id: string;
  user_id: string;
  address_line_1: string;
  address_line_2: string | null;
  city: string;
  postcode: string;
  contact_phone: string | null;
  is_default: boolean;
  created_at: string;
}

export interface UserProfileRow {
  id: string;
  user_id: string;
  bust_cm: number | null;
  waist_cm: number | null;
  hips_cm: number | null;
  height_cm: number | null;
  uk_shoe_size: number | null;
  trust_score_cached: number;
  trust_score_updated_at: string | null;
  removal_score: number;
  free_listing_active: boolean;
  free_listing_suspended_at: string | null;
  free_listing_reinstated_at: string | null;
  stripe_account_id: string | null;
  bank_details_provided: boolean;
  payment_instructions: string | null;
  active_listing_count: number;
  created_at: string;
  updated_at: string;
}

export interface TrustScoreEventRow {
  id: number;
  user_id: string;
  event_type_id: number;
  score_delta: number;
  reference_id: string | null;
  notes: string | null;
  created_at: string;
}

export interface RemovalScoreEventRow {
  id: number;
  user_id: string;
  listing_id: string;
  reason: string;
  score_delta: number;
  created_at: string;
}

// ── Config tables ────────────────────────────────────────────

export interface CategoryRow {
  id: number;
  name: string;
  display_order: number | null;
  is_active: boolean;
  created_at: string;
}

export interface SubcategoryRow {
  id: number;
  category_id: number;
  name: string;
  display_order: number | null;
  is_active: boolean;
  created_at: string;
}

export interface OccasionBucketRow {
  id: number;
  name: string;
  display_name: string;
  description: string;
  display_order: number | null;
  is_active: boolean;
  created_at: string;
}

export interface ColourSwatchRow {
  id: number;
  name: string;
  name_hindi: string | null;
  hex_code: string;
  colour_family: string | null;
  display_order: number | null;
  is_active: boolean;
  created_at: string;
}

export interface ConditionTierRow {
  id: number;
  name: string;
  display_text: string;
  detail_text: string | null;
  listing_trust_contribution: number;
  display_order: number | null;
  is_active: boolean;
  created_at: string;
}

export interface ItemCareStatusRow {
  id: number;
  name: string;
  display_text: string;
  detail_text: string | null;
  listing_trust_contribution: number;
  display_order: number | null;
  is_active: boolean;
  created_at: string;
}

export interface PatternRow {
  id: number;
  name: string;
  display_name: string;
  description: string | null;
  myntra_terms: string | null;
  ajio_terms: string | null;
  nalli_terms: string | null;
  manyavar_terms: string | null;
  display_order: number | null;
  is_active: boolean;
  created_at: string;
}

export interface WorkTypeRow {
  id: number;
  name: string;
  display_name: string;
  description: string | null;
  myntra_terms: string | null;
  ajio_terms: string | null;
  nalli_terms: string | null;
  manyavar_terms: string | null;
  display_order: number | null;
  is_active: boolean;
  created_at: string;
}

export interface FabricTypeRow {
  id: number;
  name: string;
  display_name: string;
  description: string | null;
  myntra_terms: string | null;
  ajio_terms: string | null;
  nalli_terms: string | null;
  manyavar_terms: string | null;
  display_order: number | null;
  is_active: boolean;
  created_at: string;
}

export interface TrustEventTypeRow {
  id: number;
  name: string;
  display_name: string;
  score_delta: number;
  category: 'verification' | 'activity' | 'behaviour';
  is_one_time: boolean;
  is_active: boolean;
  created_at: string;
}

export interface TrustTierRow {
  id: number;
  name: string;
  display_name: string;
  hindi_name: string | null;
  description: string | null;
  diya_colour_hex: string | null;
  min_score: number;
  max_score: number;
  is_visible: boolean;
  display_order: number | null;
  is_active: boolean;
  created_at: string;
}

export interface SellerMotivationTypeRow {
  id: number;
  name: string;
  display_text: string;
  is_time_sensitive: boolean;
  display_order: number | null;
  is_active: boolean;
  created_at: string;
}

// ── Content ───────────────────────────────────────────────────

export interface MicroCopyRow {
  id: number;
  context: string;
  key: string;
  display_text: string;
  detail_text: string | null;
  display_order: number | null;
  is_active: boolean;
  created_at: string;
}

export interface SeasonalEventRow {
  id: number;
  name: string;
  notify_sellers_at: string;
  notify_buyers_at: string;
  event_date: string | null;
  relevant_occasion_ids: number[] | null;
  seller_message: string;
  buyer_message: string;
  is_active: boolean;
  created_at: string;
}

export interface DailyExchangeRateRow {
  id: number;
  from_currency: string;
  to_currency: string;
  rate: number;
  rate_date: string;
  created_at: string;
}

// ── Listings ──────────────────────────────────────────────────

export type ListingStatus = 'draft' | 'active' | 'reserved' | 'sold' | 'removed' | 'suspended';
export type ListingRemovalReason = 'mistake' | 'changed_mind' | 'sold_elsewhere' | 'damaged' | 'other';

export interface ListingRow {
  id: string;
  seller_id: string;
  category_id: number;
  subcategory_id: number;
  occasion_bucket_id: number | null;
  colour_id: number | null;
  condition_id: number;
  pattern_id: number | null;
  work_type_id: number | null;
  fabric_type_id: number | null;
  care_status_id: number | null;
  why_selling_copy_id: number | null;
  seller_motivation_type_id: number | null;
  set_contents: string | null;
  set_complete: boolean | null;
  additional_notes: string | null;
  asking_price_pence: number | null;
  status: ListingStatus;
  negotiation_active: boolean;
  waitlist_count: number;
  listing_type: string;
  relist_count: number;
  removal_reason: ListingRemovalReason | null;
  removed_at: string | null;
  package_band_id: number | null;
  postage_service_id: number | null;
  postage_price_pence: number | null;
  underinsured_warning_shown: boolean;
  created_at: string;
  updated_at: string;
}

export interface ListingPhotoRow {
  id: number;
  listing_id: string;
  url: string;
  display_order: number;
  photo_type: 'front' | 'back' | 'detail' | 'label' | 'full_length' | 'other' | null;
  created_at: string;
}

export interface ListingMeasurementsRow {
  id: number;
  listing_id: string;
  bust_cm: number | null;
  waist_cm: number | null;
  hips_cm: number | null;
  chest_cm: number | null;
  height_cm: number | null;
  uk_shoe_size: number | null;
  label_size: string | null;
  created_at: string;
}

export interface ListingMeasurementDetailsRow {
  id: number;
  listing_id: string;
  garment_type: string;
  details: Record<string, unknown>;
  created_at: string;
}

export interface ListingWaitlistRow {
  id: number;
  listing_id: string;
  user_id: string;
  position: number;
  joined_at: string;
  notified_at: string | null;
  converted_at: string | null;
}

export interface ListingTrustScoreRow {
  id: number;
  listing_id: string;
  total_score: number;
  last_calculated_at: string;
}

export interface ListingTrustComponentRow {
  id: number;
  listing_id: string;
  component_name: string;
  max_score: number;
  earned_score: number;
  is_complete: boolean;
  nudge_text: string | null;
  updated_at: string;
}

export interface PrivateSellerMotivationRow {
  id: number;
  listing_id: string;
  user_id: string;
  motivation_type_id: number;
  created_at: string;
}

// ── Provenance ────────────────────────────────────────────────

export interface ProvenanceCityRow {
  id: number;
  name: string;
  country: string;
  created_at: string;
}

export interface ProvenanceAreaRow {
  id: number;
  city_id: number;
  name: string;
  created_at: string;
}

export interface SellerTypeRow {
  id: number;
  name: string;
  created_at: string;
}

export interface ProvenanceRow {
  id: number;
  listing_id: string;
  city_id: number | null;
  area_id: number | null;
  seller_type_id: number | null;
  purchase_year: number | null;
  original_price_inr: number | null;
  original_price_approximate: boolean;
  is_heirloom: boolean;
  heirloom_story: string | null;
  created_at: string;
}

export interface ExternalPlatformRow {
  id: number;
  name: string;
  base_url: string;
  last_scraped_at: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
}

export interface BenchmarkPriceRow {
  id: number;
  platform_id: number;
  almari_subcategory_id: number;
  fabric_type_id: number | null;
  pattern_id: number | null;
  price_low_inr: number | null;
  price_mid_inr: number | null;
  price_high_inr: number | null;
  gbp_inr_rate: number | null;
  price_low_gbp: number | null;
  price_mid_gbp: number | null;
  price_high_gbp: number | null;
  scraped_at: string;
  created_at: string;
}

// ── Postage ───────────────────────────────────────────────────

export interface PostageServiceRow {
  id: number;
  name: string;
  description: string;
  max_compensation_pence: number;
  is_active: boolean;
  created_at: string;
}

export interface PackageBandRow {
  id: number;
  size_label: 'Small' | 'Medium' | 'Large';
  weight_label: 'Light' | 'Medium' | 'Heavy';
  size_description: string;
  weight_description: string;
  created_at: string;
}

export interface PostagePriceRow {
  id: number;
  service_id: number;
  band_id: number;
  price_pence: number;
  cost_pence: number;
  margin_pence: number;
  effective_from: string;
  effective_to: string | null;
}

// ── Offers and Transactions ───────────────────────────────────

export type OfferStatus = 'pending' | 'accepted' | 'declined' | 'expired' | 'completed';

export interface OfferRow {
  id: string;
  listing_id: string;
  buyer_id: string;
  buyer_offer_pence: number;
  buyer_note: string | null;
  buyer_offered_at: string;
  buyer_offer_expires_at: string | null;
  status: OfferStatus;
  created_at: string;
  updated_at: string;
}

export type TransactionStatus =
  | 'paid'
  | 'dispatched'
  | 'in_transit'
  | 'delivered'
  | 'completed'
  | 'concern_raised'
  | 'lost_in_post'
  | 'refunded';

export type EscrowStatus = 'held' | 'released' | 'refunded' | 'disputed';

export interface TransactionRow {
  id: string;
  listing_id: string;
  seller_id: string;
  buyer_id: string;
  offer_id: string | null;
  delivery_address_id: string | null;
  sale_price_pence: number;
  postage_price_pence: number;
  postage_cost_pence: number;
  total_paid_pence: number;
  seller_receives_pence: number;
  postage_service_id: number | null;
  tracking_number: string | null;
  dispatched_at: string | null;
  estimated_delivery_date: string | null;
  tracking_confirmed_delivered_at: string | null;
  buyer_confirmed_delivered_at: string | null;
  concern_window_started_at: string | null;
  concern_window_closes_at: string | null;
  eta_nudge_sent_at: string | null;
  lost_in_post_eligible_at: string | null;
  stripe_payment_intent_id: string | null;
  escrow_status: EscrowStatus;
  funds_released_at: string | null;
  status: TransactionStatus;
  created_at: string;
  updated_at: string;
}

export type LostInPostCaseStatus = 'open' | 'awaiting_agreement' | 'agreed' | 'resolved';

export interface LostInPostCaseRow {
  id: number;
  transaction_id: string;
  opened_by_buyer_id: string;
  opened_at: string;
  seller_agreed: boolean | null;
  seller_agreed_at: string | null;
  buyer_agreed: boolean | null;
  buyer_agreed_at: string | null;
  status: LostInPostCaseStatus;
  royal_mail_claim_reference: string | null;
  resolved_at: string | null;
  created_at: string;
}

// ── Payouts and Concerns ──────────────────────────────────────

export type PayoutStatus = 'pending' | 'processing' | 'paid' | 'failed';

export interface PayoutRow {
  id: number;
  seller_id: string;
  total_pence: number;
  transaction_count: number;
  stripe_payout_id: string | null;
  status: PayoutStatus;
  scheduled_for: string;
  paid_at: string | null;
  failed_reason: string | null;
  created_at: string;
}

export interface PayoutItemRow {
  id: number;
  payout_id: number;
  transaction_id: string;
  item_reference: string;
  item_description: string;
  sale_price_pence: number;
  postage_paid_by_buyer_pence: number;
  seller_receives_pence: number;
  created_at: string;
}

export type ConcernReason =
  | 'condition_worse_than_described'
  | 'set_incomplete'
  | 'vendor_suspected';

export interface ConcernRow {
  id: number;
  transaction_id: string;
  raised_by_id: string;
  reason: ConcernReason;
  reviewed_by: string | null;
  reviewed_at: string | null;
  upheld: boolean | null;
  trust_score_impact: number | null;
  created_at: string;
}

export interface NotificationRow {
  id: number;
  user_id: string;
  type: string;
  title: string;
  body: string;
  channel: 'push' | 'email';
  reference_type: string | null;
  reference_id: string | null;
  is_read: boolean;
  read_at: string | null;
  push_sent: boolean;
  push_sent_at: string | null;
  created_at: string;
}

// ── Analytics ─────────────────────────────────────────────────

export interface SearchEventRow {
  id: number;
  user_id: string | null;
  session_id: string | null;
  query: string | null;
  filters: Record<string, unknown>;
  results_count: number;
  created_at: string;
}

export interface ListingViewRow {
  id: number;
  listing_id: string;
  user_id: string | null;
  session_id: string | null;
  created_at: string;
}

// ── Views ─────────────────────────────────────────────────────

export interface UserTrustScoreView {
  user_id: string;
  trust_score: number;
  event_count: number;
}

// ── Supabase Database type ────────────────────────────────────

export type Database = {
  public: {
    Tables: {
      user_identity: {
        Row: UserIdentityRow;
        Insert: Omit<UserIdentityRow, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<UserIdentityRow, 'id' | 'created_at'>>;
      };
      user_addresses: {
        Row: UserAddressRow;
        Insert: Omit<UserAddressRow, 'id' | 'created_at'>;
        Update: Partial<Omit<UserAddressRow, 'id' | 'created_at'>>;
      };
      user_profile: {
        Row: UserProfileRow;
        Insert: Pick<UserProfileRow, 'user_id'> & Partial<Omit<UserProfileRow, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;
        Update: Partial<Omit<UserProfileRow, 'id' | 'created_at'>>;
      };
      trust_score_events: {
        Row: TrustScoreEventRow;
        Insert: Omit<TrustScoreEventRow, 'id' | 'created_at'>;
        Update: never;
      };
      removal_score_events: {
        Row: RemovalScoreEventRow;
        Insert: Omit<RemovalScoreEventRow, 'id' | 'created_at'>;
        Update: never;
      };
      categories: {
        Row: CategoryRow;
        Insert: Omit<CategoryRow, 'id' | 'created_at'>;
        Update: Partial<Omit<CategoryRow, 'id' | 'created_at'>>;
      };
      subcategories: {
        Row: SubcategoryRow;
        Insert: Omit<SubcategoryRow, 'id' | 'created_at'>;
        Update: Partial<Omit<SubcategoryRow, 'id' | 'created_at'>>;
      };
      occasion_buckets: {
        Row: OccasionBucketRow;
        Insert: Omit<OccasionBucketRow, 'id' | 'created_at'>;
        Update: Partial<Omit<OccasionBucketRow, 'id' | 'created_at'>>;
      };
      colour_swatches: {
        Row: ColourSwatchRow;
        Insert: Omit<ColourSwatchRow, 'id' | 'created_at'>;
        Update: Partial<Omit<ColourSwatchRow, 'id' | 'created_at'>>;
      };
      condition_tiers: {
        Row: ConditionTierRow;
        Insert: Omit<ConditionTierRow, 'id' | 'created_at'>;
        Update: Partial<Omit<ConditionTierRow, 'id' | 'created_at'>>;
      };
      item_care_status: {
        Row: ItemCareStatusRow;
        Insert: Omit<ItemCareStatusRow, 'id' | 'created_at'>;
        Update: Partial<Omit<ItemCareStatusRow, 'id' | 'created_at'>>;
      };
      patterns: {
        Row: PatternRow;
        Insert: Omit<PatternRow, 'id' | 'created_at'>;
        Update: Partial<Omit<PatternRow, 'id' | 'created_at'>>;
      };
      work_types: {
        Row: WorkTypeRow;
        Insert: Omit<WorkTypeRow, 'id' | 'created_at'>;
        Update: Partial<Omit<WorkTypeRow, 'id' | 'created_at'>>;
      };
      fabric_types: {
        Row: FabricTypeRow;
        Insert: Omit<FabricTypeRow, 'id' | 'created_at'>;
        Update: Partial<Omit<FabricTypeRow, 'id' | 'created_at'>>;
      };
      trust_event_types: {
        Row: TrustEventTypeRow;
        Insert: Omit<TrustEventTypeRow, 'id' | 'created_at'>;
        Update: Partial<Omit<TrustEventTypeRow, 'id' | 'created_at'>>;
      };
      trust_tiers: {
        Row: TrustTierRow;
        Insert: Omit<TrustTierRow, 'id' | 'created_at'>;
        Update: Partial<Omit<TrustTierRow, 'id' | 'created_at'>>;
      };
      seller_motivation_types: {
        Row: SellerMotivationTypeRow;
        Insert: Omit<SellerMotivationTypeRow, 'id' | 'created_at'>;
        Update: Partial<Omit<SellerMotivationTypeRow, 'id' | 'created_at'>>;
      };
      micro_copy: {
        Row: MicroCopyRow;
        Insert: Omit<MicroCopyRow, 'id' | 'created_at'>;
        Update: Partial<Omit<MicroCopyRow, 'id' | 'created_at'>>;
      };
      seasonal_events: {
        Row: SeasonalEventRow;
        Insert: Omit<SeasonalEventRow, 'id' | 'created_at'>;
        Update: Partial<Omit<SeasonalEventRow, 'id' | 'created_at'>>;
      };
      daily_exchange_rates: {
        Row: DailyExchangeRateRow;
        Insert: Omit<DailyExchangeRateRow, 'id' | 'created_at'>;
        Update: Partial<Omit<DailyExchangeRateRow, 'id' | 'created_at'>>;
      };
      listings: {
        Row: ListingRow;
        Insert: Pick<ListingRow, 'seller_id' | 'category_id' | 'subcategory_id' | 'condition_id'> &
          Partial<Omit<ListingRow, 'id' | 'seller_id' | 'category_id' | 'subcategory_id' | 'condition_id' | 'created_at' | 'updated_at'>>;
        Update: Partial<Omit<ListingRow, 'id' | 'created_at'>>;
      };
      listing_photos: {
        Row: ListingPhotoRow;
        Insert: Omit<ListingPhotoRow, 'id' | 'created_at'>;
        Update: Partial<Omit<ListingPhotoRow, 'id' | 'created_at'>>;
      };
      listing_measurements: {
        Row: ListingMeasurementsRow;
        Insert: Omit<ListingMeasurementsRow, 'id' | 'created_at'>;
        Update: Partial<Omit<ListingMeasurementsRow, 'id' | 'created_at'>>;
      };
      listing_measurement_details: {
        Row: ListingMeasurementDetailsRow;
        Insert: Omit<ListingMeasurementDetailsRow, 'id' | 'created_at'>;
        Update: Partial<Omit<ListingMeasurementDetailsRow, 'id' | 'created_at'>>;
      };
      listing_waitlist: {
        Row: ListingWaitlistRow;
        Insert: Omit<ListingWaitlistRow, 'id' | 'joined_at'>;
        Update: Partial<Omit<ListingWaitlistRow, 'id' | 'joined_at'>>;
      };
      listing_trust_scores: {
        Row: ListingTrustScoreRow;
        Insert: Omit<ListingTrustScoreRow, 'id' | 'last_calculated_at'>;
        Update: Partial<Omit<ListingTrustScoreRow, 'id'>>;
      };
      listing_trust_components: {
        Row: ListingTrustComponentRow;
        Insert: Omit<ListingTrustComponentRow, 'id' | 'updated_at'>;
        Update: Partial<Omit<ListingTrustComponentRow, 'id'>>;
      };
      private_seller_motivation: {
        Row: PrivateSellerMotivationRow;
        Insert: Omit<PrivateSellerMotivationRow, 'id' | 'created_at'>;
        Update: never;
      };
      provenance_cities: {
        Row: ProvenanceCityRow;
        Insert: Omit<ProvenanceCityRow, 'id' | 'created_at'>;
        Update: Partial<Omit<ProvenanceCityRow, 'id' | 'created_at'>>;
      };
      provenance_areas: {
        Row: ProvenanceAreaRow;
        Insert: Omit<ProvenanceAreaRow, 'id' | 'created_at'>;
        Update: Partial<Omit<ProvenanceAreaRow, 'id' | 'created_at'>>;
      };
      seller_types: {
        Row: SellerTypeRow;
        Insert: Omit<SellerTypeRow, 'id' | 'created_at'>;
        Update: Partial<Omit<SellerTypeRow, 'id' | 'created_at'>>;
      };
      provenance: {
        Row: ProvenanceRow;
        Insert: Pick<ProvenanceRow, 'listing_id'> & Partial<Omit<ProvenanceRow, 'id' | 'listing_id' | 'created_at'>>;
        Update: Partial<Omit<ProvenanceRow, 'id' | 'created_at'>>;
      };
      external_platforms: {
        Row: ExternalPlatformRow;
        Insert: Omit<ExternalPlatformRow, 'id' | 'created_at'>;
        Update: Partial<Omit<ExternalPlatformRow, 'id' | 'created_at'>>;
      };
      benchmark_prices: {
        Row: BenchmarkPriceRow;
        Insert: Omit<BenchmarkPriceRow, 'id' | 'created_at'>;
        Update: Partial<Omit<BenchmarkPriceRow, 'id' | 'created_at'>>;
      };
      postage_services: {
        Row: PostageServiceRow;
        Insert: Omit<PostageServiceRow, 'id' | 'created_at'>;
        Update: Partial<Omit<PostageServiceRow, 'id' | 'created_at'>>;
      };
      package_bands: {
        Row: PackageBandRow;
        Insert: Omit<PackageBandRow, 'id' | 'created_at'>;
        Update: Partial<Omit<PackageBandRow, 'id' | 'created_at'>>;
      };
      postage_prices: {
        Row: PostagePriceRow;
        Insert: Omit<PostagePriceRow, 'id' | 'margin_pence'>;
        Update: Partial<Omit<PostagePriceRow, 'id' | 'margin_pence'>>;
      };
      offers: {
        Row: OfferRow;
        Insert: Pick<OfferRow, 'listing_id' | 'buyer_id' | 'buyer_offer_pence'> &
          Partial<Omit<OfferRow, 'id' | 'listing_id' | 'buyer_id' | 'buyer_offer_pence' | 'created_at' | 'updated_at'>>;
        Update: Partial<Omit<OfferRow, 'id' | 'created_at'>>;
      };
      transactions: {
        Row: TransactionRow;
        Insert: Pick<TransactionRow,
          'listing_id' | 'seller_id' | 'buyer_id' |
          'sale_price_pence' | 'postage_price_pence' | 'postage_cost_pence' |
          'total_paid_pence' | 'seller_receives_pence'
        > & Partial<Omit<TransactionRow,
          'id' | 'listing_id' | 'seller_id' | 'buyer_id' |
          'sale_price_pence' | 'postage_price_pence' | 'postage_cost_pence' |
          'total_paid_pence' | 'seller_receives_pence' | 'created_at' | 'updated_at'
        >>;
        Update: Partial<Omit<TransactionRow, 'id' | 'created_at'>>;
      };
      lost_in_post_cases: {
        Row: LostInPostCaseRow;
        Insert: Pick<LostInPostCaseRow, 'transaction_id' | 'opened_by_buyer_id'> &
          Partial<Omit<LostInPostCaseRow, 'id' | 'transaction_id' | 'opened_by_buyer_id' | 'created_at' | 'opened_at'>>;
        Update: Partial<Omit<LostInPostCaseRow, 'id' | 'created_at' | 'opened_at'>>;
      };
      payouts: {
        Row: PayoutRow;
        Insert: Pick<PayoutRow, 'seller_id' | 'total_pence' | 'transaction_count' | 'scheduled_for'> &
          Partial<Omit<PayoutRow, 'id' | 'seller_id' | 'total_pence' | 'transaction_count' | 'scheduled_for' | 'created_at'>>;
        Update: Partial<Omit<PayoutRow, 'id' | 'created_at'>>;
      };
      payout_items: {
        Row: PayoutItemRow;
        Insert: Omit<PayoutItemRow, 'id' | 'created_at'>;
        Update: never;
      };
      concerns: {
        Row: ConcernRow;
        Insert: Pick<ConcernRow, 'transaction_id' | 'raised_by_id' | 'reason'> &
          Partial<Omit<ConcernRow, 'id' | 'transaction_id' | 'raised_by_id' | 'reason' | 'created_at'>>;
        Update: Partial<Omit<ConcernRow, 'id' | 'created_at'>>;
      };
      notifications: {
        Row: NotificationRow;
        Insert: Omit<NotificationRow, 'id' | 'created_at'>;
        Update: Partial<Omit<NotificationRow, 'id' | 'created_at'>>;
      };
      search_events: {
        Row: SearchEventRow;
        Insert: Omit<SearchEventRow, 'id' | 'created_at'>;
        Update: never;
      };
      listing_views: {
        Row: ListingViewRow;
        Insert: Omit<ListingViewRow, 'id' | 'created_at'>;
        Update: never;
      };
    };
    Views: {
      user_trust_scores: {
        Row: UserTrustScoreView;
      };
    };
    Functions: {
      almari_user_id: {
        Args: Record<string, never>;
        Returns: string;
      };
      get_public_profile: {
        Args: { user_uuid: string };
        Returns: {
          id: string;
          first_name: string;
          last_name_initial: string;
          trust_score: number;
          trust_tier_name: string;
          trust_tier_hindi: string;
          diya_colour_hex: string;
          active_listing_count: number;
        };
      };
    };
    Enums: Record<string, never>;
  };
};

// ── Named aliases (use these in screen code) ──────────────────

export type UserIdentity = Database['public']['Tables']['user_identity']['Row'];
export type UserAddress = Database['public']['Tables']['user_addresses']['Row'];
export type UserProfile = Database['public']['Tables']['user_profile']['Row'];
export type Listing = Database['public']['Tables']['listings']['Row'];
export type ListingInsert = Database['public']['Tables']['listings']['Insert'];
export type ListingUpdate = Database['public']['Tables']['listings']['Update'];
export type ListingPhoto = Database['public']['Tables']['listing_photos']['Row'];
export type ListingMeasurements = Database['public']['Tables']['listing_measurements']['Row'];
export type ListingWaitlist = Database['public']['Tables']['listing_waitlist']['Row'];
export type ListingTrustScore = Database['public']['Tables']['listing_trust_scores']['Row'];
export type ListingTrustComponent = Database['public']['Tables']['listing_trust_components']['Row'];
export type Provenance = Database['public']['Tables']['provenance']['Row'];
export type Offer = Database['public']['Tables']['offers']['Row'];
export type Transaction = Database['public']['Tables']['transactions']['Row'];
export type LostInPostCase = Database['public']['Tables']['lost_in_post_cases']['Row'];
export type Notification = Database['public']['Tables']['notifications']['Row'];
export type Concern = Database['public']['Tables']['concerns']['Row'];
export type Payout = Database['public']['Tables']['payouts']['Row'];
export type Category = Database['public']['Tables']['categories']['Row'];
export type Subcategory = Database['public']['Tables']['subcategories']['Row'];
export type OccasionBucket = Database['public']['Tables']['occasion_buckets']['Row'];
export type ColourSwatch = Database['public']['Tables']['colour_swatches']['Row'];
export type ConditionTier = Database['public']['Tables']['condition_tiers']['Row'];
export type ItemCareStatus = Database['public']['Tables']['item_care_status']['Row'];
export type Pattern = Database['public']['Tables']['patterns']['Row'];
export type WorkType = Database['public']['Tables']['work_types']['Row'];
export type FabricType = Database['public']['Tables']['fabric_types']['Row'];
export type PostageService = Database['public']['Tables']['postage_services']['Row'];
export type PackageBand = Database['public']['Tables']['package_bands']['Row'];
export type PostagePrice = Database['public']['Tables']['postage_prices']['Row'];
export type ProvenanceCity = Database['public']['Tables']['provenance_cities']['Row'];
export type ProvenanceArea = Database['public']['Tables']['provenance_areas']['Row'];
export type SellerType = Database['public']['Tables']['seller_types']['Row'];
export type MicroCopy = Database['public']['Tables']['micro_copy']['Row'];
export type TrustTier = Database['public']['Tables']['trust_tiers']['Row'];
