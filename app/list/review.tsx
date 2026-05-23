import { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { IconChevronLeft, IconAlertTriangle } from '@tabler/icons-react-native';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/hooks/useTheme';
import { useListingDraftStore } from '@/store/listing-draft';
import type { ListingDraftState } from '@/store/listing-draft';
import { useAuthStore } from '@/store/auth';
import FireworkTrust from '@/components/brand/FireworkTrust';
import type {
  CategoryRow,
  SubcategoryRow,
  ConditionTierRow,
  ItemCareStatusRow,
  WorkTypeRow,
  PatternRow,
  FabricTypeRow,
  OccasionBucketRow,
  ColourSwatchRow,
  ProvenanceCityRow,
  ProvenanceAreaRow,
  SellerTypeRow,
  PackageBandRow,
  PostageServiceRow,
  PostagePriceRow,
} from '@/types/database';

const STALE = 10 * 60 * 1000;
const BUCKET = 'listing-photos';

// ── Trust (same computation as pricing screen) ────────────────

type TrustComponent = { label: string; earned: number; max: number };

const PHOTO_PTS: Record<number, number> = { 4: 10, 5: 12, 6: 15 };
const STATE_LABELS = ['Just listed', 'Starting', 'Building', 'Strong', 'Brilliant'];

function getStateLabel(score: number, maxScore: number): string {
  const pct = maxScore > 0 ? score / maxScore : 0;
  if (pct < 0.2) return STATE_LABELS[0];
  if (pct < 0.4) return STATE_LABELS[1];
  if (pct < 0.6) return STATE_LABELS[2];
  if (pct < 0.8) return STATE_LABELS[3];
  return STATE_LABELS[4];
}

function computeTrust(
  draft: ReturnType<typeof useListingDraftStore.getState>,
  conditionRows: ConditionTierRow[],
  careRows: ItemCareStatusRow[],
): TrustComponent[] {
  const photoCount = Math.min(draft.photoUris.length, 6);
  const photoEarned = PHOTO_PTS[photoCount] ?? (photoCount >= 4 ? 10 : 0);
  const craftEarned =
    (draft.workTypeId !== null ? 5 : 0) +
    (draft.patternId !== null ? 3 : 0) +
    (draft.fabricTypeId !== null ? 3 : 0);
  const occasionEarned = draft.occasionBucketId !== null ? 4 : 0;
  const colourEarned = draft.colourId !== null ? 4 : 0;
  const conditionRow = conditionRows.find((r) => r.id === draft.conditionId);
  const conditionEarned = conditionRow?.listing_trust_contribution ?? 0;
  const conditionMax = conditionRows.length > 0 ? Math.max(...conditionRows.map((r) => r.listing_trust_contribution)) : 10;
  let provenanceEarned = 0;
  if (draft.isHeirloom) {
    provenanceEarned = draft.heirloomStory.trim().length > 0 ? 20 : 0;
  } else {
    if (draft.provenanceCityId !== null) provenanceEarned += 5;
    if (draft.provenanceAreaId !== null) provenanceEarned += 3;
    if (draft.sellerTypeId !== null) provenanceEarned += 3;
    if (draft.purchaseYear.trim().length > 0) provenanceEarned += 4;
    if (draft.originalPriceInr.trim().length > 0) provenanceEarned += 5;
  }
  const careRow = careRows.find((r) => r.id === draft.careStatusId);
  const careEarned = careRow?.listing_trust_contribution ?? 0;
  const careMax = careRows.length > 0 ? Math.max(...careRows.map((r) => r.listing_trust_contribution)) : 10;
  const measurements: [string, number][] = [
    [draft.listingBustCm, 3], [draft.listingWaistCm, 3], [draft.listingHipsCm, 3],
    [draft.listingChestCm, 3], [draft.listingHeightCm, 3], [draft.listingUkShoeSize, 2],
    [draft.listingLabelSize, 1],
  ];
  const measurementsEarned = measurements.reduce((acc: number, [v, pts]: [string, number]) => acc + (v.trim().length > 0 ? pts : 0), 0);
  const setEarned = (draft.whatIsIncluded.trim().length > 0 ? 3 : 0) + (draft.isSetComplete !== null ? 5 : 0);
  const motivationEarned = draft.motivationTypeId !== null ? 5 : 0;
  const notesEarned = draft.additionalNotes.trim().length > 0 ? 5 : 0;
  return [
    { label: 'Photos', earned: photoEarned, max: 15 },
    { label: 'Craft detail', earned: craftEarned, max: 11 },
    { label: 'Occasion', earned: occasionEarned, max: 4 },
    { label: 'Colour', earned: colourEarned, max: 4 },
    { label: 'Condition', earned: conditionEarned, max: conditionMax },
    { label: 'Provenance', earned: provenanceEarned, max: 20 },
    { label: 'Care', earned: careEarned, max: careMax },
    { label: 'Measurements', earned: measurementsEarned, max: 18 },
    { label: 'Set info', earned: setEarned, max: 8 },
    { label: 'Why selling', earned: motivationEarned, max: 5 },
    { label: 'Additional notes', earned: notesEarned, max: 5 },
  ];
}

// ── Photo upload ───────────────────────────────────────────────

async function uploadPhoto(uri: string, userId: string, index: number): Promise<string> {
  const ext = uri.split('.').pop()?.toLowerCase() ?? 'jpg';
  const contentType = ext === 'png' ? 'image/png' : 'image/jpeg';
  const path = `${userId}/${Date.now()}_${index}.${ext}`;

  const response = await fetch(uri);
  const blob = await response.blob();

  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, { contentType });
  if (error) throw new Error(`Photo upload failed: ${error.message}`);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

// ── Helpers ───────────────────────────────────────────────────

function pence(p: number): string {
  return `£${(p / 100).toFixed(2)}`;
}

function parseCm(v: string): number | null {
  const n = parseFloat(v);
  return isNaN(n) ? null : n;
}

// ── Screen ────────────────────────────────────────────────────

export default function ListReview() {
  const theme = useTheme();
  const router = useRouter();
  const s = makeStyles(theme);

  const draft = useListingDraftStore();
  const setListingId = useListingDraftStore((st: ListingDraftState) => st.setListingId);
  const resetDraft = useListingDraftStore((st: ListingDraftState) => st.reset);
  const session = useAuthStore((st: ReturnType<typeof useAuthStore.getState>) => st.session);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // ── Config queries (all cache hits from prior steps) ─────────

  const { data: categories = [] } = useQuery<CategoryRow[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await supabase.from('categories').select('*').eq('is_active', true).order('display_order');
      return (data ?? []) as CategoryRow[];
    },
    staleTime: STALE,
  });

  const { data: subcategories = [] } = useQuery<SubcategoryRow[]>({
    queryKey: ['subcategories', draft.categoryId],
    queryFn: async () => {
      if (!draft.categoryId) return [];
      const { data } = await supabase.from('subcategories').select('*').eq('category_id', draft.categoryId).eq('is_active', true).order('display_order');
      return (data ?? []) as SubcategoryRow[];
    },
    enabled: draft.categoryId !== null,
    staleTime: STALE,
  });

  const { data: conditionTiers = [] } = useQuery<ConditionTierRow[]>({
    queryKey: ['condition_tiers'],
    queryFn: async () => {
      const { data } = await supabase.from('condition_tiers').select('*');
      return (data ?? []) as ConditionTierRow[];
    },
    staleTime: STALE,
  });

  const { data: careStatuses = [] } = useQuery<ItemCareStatusRow[]>({
    queryKey: ['item_care_status'],
    queryFn: async () => {
      const { data } = await supabase.from('item_care_status').select('*');
      return (data ?? []) as ItemCareStatusRow[];
    },
    staleTime: STALE,
  });

  const { data: workTypes = [] } = useQuery<WorkTypeRow[]>({
    queryKey: ['work_types'],
    queryFn: async () => {
      const { data } = await supabase.from('work_types').select('*');
      return (data ?? []) as WorkTypeRow[];
    },
    staleTime: STALE,
  });

  const { data: patterns = [] } = useQuery<PatternRow[]>({
    queryKey: ['patterns'],
    queryFn: async () => {
      const { data } = await supabase.from('patterns').select('*');
      return (data ?? []) as PatternRow[];
    },
    staleTime: STALE,
  });

  const { data: fabricTypes = [] } = useQuery<FabricTypeRow[]>({
    queryKey: ['fabric_types'],
    queryFn: async () => {
      const { data } = await supabase.from('fabric_types').select('*');
      return (data ?? []) as FabricTypeRow[];
    },
    staleTime: STALE,
  });

  const { data: occasionBuckets = [] } = useQuery<OccasionBucketRow[]>({
    queryKey: ['occasion_buckets'],
    queryFn: async () => {
      const { data } = await supabase.from('occasion_buckets').select('*');
      return (data ?? []) as OccasionBucketRow[];
    },
    staleTime: STALE,
  });

  const { data: colours = [] } = useQuery<ColourSwatchRow[]>({
    queryKey: ['colour_swatches'],
    queryFn: async () => {
      const { data } = await supabase.from('colour_swatches').select('*');
      return (data ?? []) as ColourSwatchRow[];
    },
    staleTime: STALE,
  });

  const { data: cities = [] } = useQuery<ProvenanceCityRow[]>({
    queryKey: ['provenance_cities'],
    queryFn: async () => {
      const { data } = await supabase.from('provenance_cities').select('*').order('name');
      return (data ?? []) as ProvenanceCityRow[];
    },
    staleTime: 60 * 60 * 1000,
  });

  const { data: allAreas = [] } = useQuery<ProvenanceAreaRow[]>({
    queryKey: ['provenance_areas'],
    queryFn: async () => {
      const { data } = await supabase.from('provenance_areas').select('*').order('name');
      return (data ?? []) as ProvenanceAreaRow[];
    },
    staleTime: 60 * 60 * 1000,
  });

  const { data: sellerTypes = [] } = useQuery<SellerTypeRow[]>({
    queryKey: ['seller_types'],
    queryFn: async () => {
      const { data } = await supabase.from('seller_types').select('*');
      return (data ?? []) as SellerTypeRow[];
    },
    staleTime: 60 * 60 * 1000,
  });

  const { data: packageBands = [] } = useQuery<PackageBandRow[]>({
    queryKey: ['package_bands'],
    queryFn: async () => {
      const { data } = await supabase.from('package_bands').select('*');
      return (data ?? []) as PackageBandRow[];
    },
    staleTime: 60 * 60 * 1000,
  });

  const { data: postageServices = [] } = useQuery<PostageServiceRow[]>({
    queryKey: ['postage_services'],
    queryFn: async () => {
      const { data } = await supabase.from('postage_services').select('*').eq('is_active', true);
      return (data ?? []) as PostageServiceRow[];
    },
    staleTime: 60 * 60 * 1000,
  });

  const { data: postagePrices = [] } = useQuery<PostagePriceRow[]>({
    queryKey: ['postage_prices'],
    queryFn: async () => {
      const { data } = await supabase.from('postage_prices').select('*').is('effective_to', null);
      return (data ?? []) as PostagePriceRow[];
    },
    staleTime: 5 * 60 * 1000,
  });

  // ── Derived display values ────────────────────────────────────

  const category = categories.find((c: CategoryRow) => c.id === draft.categoryId);
  const subcategory = subcategories.find((c: SubcategoryRow) => c.id === draft.subcategoryId);
  const condition = conditionTiers.find((c: ConditionTierRow) => c.id === draft.conditionId);
  const care = careStatuses.find((c: ItemCareStatusRow) => c.id === draft.careStatusId);
  const workType = workTypes.find((w: WorkTypeRow) => w.id === draft.workTypeId);
  const pattern = patterns.find((p: PatternRow) => p.id === draft.patternId);
  const fabric = fabricTypes.find((f: FabricTypeRow) => f.id === draft.fabricTypeId);
  const occasion = occasionBuckets.find((o: OccasionBucketRow) => o.id === draft.occasionBucketId);
  const colour = colours.find((c: ColourSwatchRow) => c.id === draft.colourId);
  const city = cities.find((c: ProvenanceCityRow) => c.id === draft.provenanceCityId);
  const area = allAreas.find((a: ProvenanceAreaRow) => a.id === draft.provenanceAreaId);
  const sellerType = sellerTypes.find((s: SellerTypeRow) => s.id === draft.sellerTypeId);
  const band = packageBands.find((b: PackageBandRow) => b.id === draft.packageBandId);
  const service = postageServices.find((s: PostageServiceRow) => s.id === draft.postageServiceId);
  const postagePrice = postagePrices.find(
    (p: PostagePriceRow) => p.band_id === draft.packageBandId && p.service_id === draft.postageServiceId,
  );

  const underinsured =
    draft.askingPricePence !== null &&
    service !== undefined &&
    draft.askingPricePence > service.max_compensation_pence;

  // ── Trust score ───────────────────────────────────────────────

  const components = useMemo(
    () => computeTrust(draft, conditionTiers, careStatuses),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [conditionTiers, careStatuses, draft.photoUris.length, draft.workTypeId, draft.patternId,
     draft.fabricTypeId, draft.occasionBucketId, draft.colourId, draft.conditionId,
     draft.isHeirloom, draft.heirloomStory, draft.provenanceCityId, draft.provenanceAreaId,
     draft.sellerTypeId, draft.purchaseYear, draft.originalPriceInr, draft.careStatusId,
     draft.listingBustCm, draft.listingWaistCm, draft.listingHipsCm, draft.listingChestCm,
     draft.listingHeightCm, draft.listingUkShoeSize, draft.listingLabelSize,
     draft.whatIsIncluded, draft.isSetComplete, draft.motivationTypeId, draft.additionalNotes],
  );

  const totalScore = components.reduce((acc: number, c: TrustComponent) => acc + c.earned, 0);
  const maxScore = components.reduce((acc: number, c: TrustComponent) => acc + c.max, 0);
  const stateLabel = getStateLabel(totalScore, maxScore);

  // ── Submit ────────────────────────────────────────────────────

  async function submit() {
    if (!session) return;
    const userId = session.user.id;
    setSubmitting(true);
    setSubmitError(null);

    try {
      // 1. Upload photos in parallel
      const photoUrls = await Promise.all(
        draft.photoUris.map((uri: string, i: number) => uploadPhoto(uri, userId, i)),
      );

      // 2. Insert listing row
      const { data: listing, error: listingError } = await supabase
        .from('listings')
        .insert({
          seller_id: userId,
          category_id: draft.categoryId!,
          subcategory_id: draft.subcategoryId!,
          occasion_bucket_id: draft.occasionBucketId,
          colour_id: draft.colourId,
          condition_id: draft.conditionId!,
          pattern_id: draft.patternId,
          work_type_id: draft.workTypeId,
          fabric_type_id: draft.fabricTypeId,
          care_status_id: draft.careStatusId,
          seller_motivation_type_id: draft.motivationTypeId,
          set_contents: draft.whatIsIncluded.trim() || null,
          set_complete: draft.isSetComplete,
          additional_notes: draft.additionalNotes.trim() || null,
          asking_price_pence: draft.askingPricePence,
          package_band_id: draft.packageBandId,
          postage_service_id: draft.postageServiceId,
          postage_price_pence: postagePrice?.price_pence ?? null,
          underinsured_warning_shown: underinsured,
          status: 'active',
          listing_type: 'standard',
        })
        .select('id')
        .single();

      if (listingError || !listing) throw new Error(listingError?.message ?? 'Listing insert failed');
      const listingId = listing.id;

      // 3. Insert listing_photos
      await supabase.from('listing_photos').insert(
        photoUrls.map((url: string, i: number) => ({
          listing_id: listingId,
          url,
          display_order: i,
          photo_type: null as null,
        })),
      );

      // 4. Insert provenance row (always — even if all fields are null)
      await supabase.from('provenance').insert({
        listing_id: listingId,
        city_id: draft.provenanceCityId,
        area_id: draft.provenanceAreaId,
        seller_type_id: draft.sellerTypeId,
        purchase_year: draft.purchaseYear ? parseInt(draft.purchaseYear, 10) : null,
        original_price_inr: draft.originalPriceInr ? parseFloat(draft.originalPriceInr) : null,
        original_price_approximate: draft.originalPriceApproximate,
        is_heirloom: draft.isHeirloom,
        heirloom_story: draft.heirloomStory.trim() || null,
      });

      // 5. Insert measurements (only if at least one field filled)
      const hasMeasurements = [
        draft.listingBustCm, draft.listingWaistCm, draft.listingHipsCm,
        draft.listingChestCm, draft.listingHeightCm, draft.listingUkShoeSize,
        draft.listingLabelSize,
      ].some((v) => v.trim().length > 0);

      if (hasMeasurements) {
        await supabase.from('listing_measurements').insert({
          listing_id: listingId,
          bust_cm: parseCm(draft.listingBustCm),
          waist_cm: parseCm(draft.listingWaistCm),
          hips_cm: parseCm(draft.listingHipsCm),
          chest_cm: parseCm(draft.listingChestCm),
          height_cm: parseCm(draft.listingHeightCm),
          uk_shoe_size: parseCm(draft.listingUkShoeSize),
          label_size: draft.listingLabelSize.trim() || null,
        });
      }

      // 6. Insert private seller motivation
      if (draft.motivationTypeId !== null) {
        await supabase.from('private_seller_motivation').insert({
          listing_id: listingId,
          user_id: userId,
          motivation_type_id: draft.motivationTypeId,
        });
      }

      // 7. Insert trust score
      await supabase.from('listing_trust_scores').insert({
        listing_id: listingId,
        total_score: totalScore,
      });

      // 8. Insert trust components
      await supabase.from('listing_trust_components').insert(
        components.map((c: TrustComponent) => ({
          listing_id: listingId,
          component_name: c.label,
          max_score: c.max,
          earned_score: c.earned,
          is_complete: c.earned === c.max,
          nudge_text: null,
        })),
      );

      setListingId(listingId);
      setSubmitted(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  // ── Success state ─────────────────────────────────────────────

  if (submitted) {
    return (
      <SafeAreaView style={s.root} edges={['top', 'bottom']}>
        <View style={s.successRoot}>
          <FireworkTrust score={maxScore} maxScore={maxScore} size={100} />
          <Text style={s.successTitle}>Your listing is live!</Text>
          <Text style={s.successSubtitle}>
            It's now visible to buyers across the Almari community.
          </Text>
          <TouchableOpacity
            style={s.successBtn}
            onPress={() => {
              resetDraft();
              router.replace('/');
            }}
            activeOpacity={0.85}
          >
            <Text style={s.successBtnText}>Done</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Review UI ─────────────────────────────────────────────────

  return (
    <SafeAreaView style={s.root} edges={['top', 'bottom']}>
      <View style={s.progressTrack}>
        <View style={[s.progressFill, { width: '100%' }]} />
      </View>

      <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn} hitSlop={12}>
            <IconChevronLeft size={22} color={theme.text} />
          </TouchableOpacity>
          <Text style={s.title}>Review your listing</Text>
          <View style={{ width: 34 }} />
        </View>

        {/* Photos strip */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.photoStrip}
          style={s.photoStripWrap}
        >
          {draft.photoUris.map((uri: string, i: number) => (
            <Image key={i} source={{ uri }} style={s.photo} contentFit="cover" />
          ))}
        </ScrollView>

        {/* Trust score */}
        <View style={s.trustRow}>
          <FireworkTrust score={totalScore} maxScore={maxScore} size={52} />
          <View style={s.trustText}>
            <Text style={s.trustLabel}>{stateLabel}</Text>
            <Text style={s.trustSub}>
              {totalScore} / {maxScore} pts
            </Text>
          </View>
        </View>

        {/* Item */}
        <View style={s.card}>
          <Text style={s.cardTitle}>What it is</Text>
          <Row label="Category" value={[category?.name, subcategory?.name].filter(Boolean).join(' › ')} />
          <Row label="Condition" value={condition?.display_text} />
          {care && <Row label="Care status" value={care.display_text} />}
          {workType && <Row label="Work" value={workType.display_name} />}
          {pattern && <Row label="Pattern" value={pattern.display_name} />}
          {fabric && <Row label="Fabric" value={fabric.display_name} />}
          {occasion && <Row label="Occasion" value={occasion.display_name} />}
          {colour && (
            <View style={s.row}>
              <Text style={s.rowLabel}>Colour</Text>
              <View style={s.colourRow}>
                <View style={[s.colourDot, { backgroundColor: colour.hex_code }]} />
                <Text style={s.rowValue}>{colour.name}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Provenance */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Provenance</Text>
          {draft.isHeirloom ? (
            <>
              <Row label="Type" value="Heirloom or inherited" />
              {draft.heirloomStory.trim().length > 0 && (
                <Row label="Story" value={draft.heirloomStory.trim()} />
              )}
            </>
          ) : (
            <>
              {city && <Row label="City" value={[city.name, area?.name].filter(Boolean).join(', ')} />}
              {sellerType && <Row label="Bought from" value={sellerType.name} />}
              {draft.purchaseYear && <Row label="Year" value={draft.purchaseYear} />}
              {draft.originalPriceInr && (
                <Row
                  label="Original price"
                  value={`₹${draft.originalPriceInr}${draft.originalPriceApproximate ? ' (approx.)' : ''}`}
                />
              )}
              {!city && !draft.purchaseYear && (
                <Text style={s.emptyNote}>No provenance added</Text>
              )}
            </>
          )}
        </View>

        {/* Measurements */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Measurements</Text>
          {(
            [
              { label: 'Bust', value: draft.listingBustCm, suffix: 'cm' },
              { label: 'Waist', value: draft.listingWaistCm, suffix: 'cm' },
              { label: 'Hips', value: draft.listingHipsCm, suffix: 'cm' },
              { label: 'Chest', value: draft.listingChestCm, suffix: 'cm' },
              { label: 'Height', value: draft.listingHeightCm, suffix: 'cm' },
              { label: 'UK shoe', value: draft.listingUkShoeSize, suffix: '' },
              { label: 'Label size', value: draft.listingLabelSize, suffix: '' },
            ] as { label: string; value: string; suffix: string }[]
          )
            .filter((m) => m.value.trim().length > 0)
            .map((m) => (
              <Row key={m.label} label={m.label} value={`${m.value}${m.suffix}`} />
            ))}
          {[draft.listingBustCm, draft.listingWaistCm, draft.listingHipsCm,
            draft.listingChestCm, draft.listingHeightCm, draft.listingUkShoeSize,
            draft.listingLabelSize].every((v) => v.trim().length === 0) && (
            <Text style={s.emptyNote}>No measurements added</Text>
          )}
        </View>

        {/* Set contents */}
        {draft.whatIsIncluded.trim().length > 0 && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Set contents</Text>
            <Text style={s.bodyText}>{draft.whatIsIncluded.trim()}</Text>
            {draft.isSetComplete !== null && (
              <View style={[s.badge, { backgroundColor: draft.isSetComplete ? theme.success : theme.error }]}>
                <Text style={s.badgeText}>
                  {draft.isSetComplete ? 'Complete set' : 'Parts missing'}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Additional notes */}
        {draft.additionalNotes.trim().length > 0 && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Additional notes</Text>
            <Text style={s.bodyText}>{draft.additionalNotes.trim()}</Text>
          </View>
        )}

        {/* Postage */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Postage</Text>
          {band && <Row label="Package" value={`${band.size_label} — ${band.weight_label}`} />}
          {service && <Row label="Service" value={service.name} />}
          {postagePrice && <Row label="Postage cost" value={pence(postagePrice.price_pence)} />}
          {service && (
            <Row
              label="Compensation"
              value={`Up to £${Math.floor(service.max_compensation_pence / 100).toLocaleString()}`}
            />
          )}
        </View>

        {/* Underinsured warning */}
        {underinsured && service && (
          <View style={[s.warningBanner, { borderColor: theme.error, backgroundColor: theme.error + '18' }]}>
            <IconAlertTriangle size={18} color={theme.error} />
            <Text style={[s.warningText, { color: theme.error }]}>
              Your asking price ({pence(draft.askingPricePence!)}) exceeds Royal Mail's compensation
              limit of £{Math.floor(service.max_compensation_pence / 100).toLocaleString()} for this
              service. Consider upgrading your postage service or reducing your asking price.
            </Text>
          </View>
        )}

        {/* Asking price */}
        <View style={[s.card, s.priceCard]}>
          <Text style={s.priceCardLabel}>Asking price</Text>
          <Text style={s.priceCardValue}>
            {draft.askingPricePence !== null ? pence(draft.askingPricePence) : '—'}
          </Text>
          <Text style={s.priceCardNote}>Buyers pay this. Postage is added at checkout.</Text>
        </View>

        {/* Error */}
        {submitError && (
          <View style={[s.errorBanner, { borderColor: theme.error }]}>
            <Text style={[s.warningText, { color: theme.error }]}>{submitError}</Text>
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom bar */}
      <View style={s.bottomBar}>
        <TouchableOpacity
          style={[s.listBtn, submitting && s.listBtnDisabled]}
          onPress={submit}
          disabled={submitting}
          activeOpacity={0.85}
        >
          {submitting ? (
            <ActivityIndicator color={theme.accentText} />
          ) : (
            <Text style={s.listBtnText}>List it</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ── Row helper ────────────────────────────────────────────────

function Row({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <View style={rowStyle.row}>
      <Text style={rowStyle.label}>{label}</Text>
      <Text style={rowStyle.value}>{value}</Text>
    </View>
  );
}

const rowStyle = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 5 },
  label: { fontFamily: 'Inter_400Regular', fontSize: 13, color: '#888', flex: 1 },
  value: { fontFamily: 'Inter_500Medium', fontSize: 13, color: '#1a1a1a', flex: 2, textAlign: 'right' },
});

// ── Styles ────────────────────────────────────────────────────

function makeStyles(theme: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.background },

    progressTrack: { height: 3, backgroundColor: theme.border },
    progressFill: { height: 3, backgroundColor: theme.accent },

    scrollContent: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 24 },

    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      marginBottom: 12,
    },
    backBtn: { padding: 6 },
    title: { fontFamily: 'CormorantGaramond_700Bold', fontSize: 22, color: theme.text },

    photoStripWrap: { marginHorizontal: -20, marginBottom: 16 },
    photoStrip: { paddingHorizontal: 20, gap: 8 },
    photo: { width: 120, height: 160, borderRadius: 10 },

    trustRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      backgroundColor: theme.surface,
      borderRadius: 14,
      padding: 14,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.border,
    },
    trustText: { flex: 1 },
    trustLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 15, color: theme.accent },
    trustSub: { fontFamily: 'Inter_400Regular', fontSize: 13, color: theme.textSecondary, marginTop: 2 },

    card: {
      backgroundColor: theme.surface,
      borderRadius: 14,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.border,
    },
    cardTitle: {
      fontFamily: 'Inter_600SemiBold',
      fontSize: 11,
      color: theme.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginBottom: 10,
    },

    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 5 },
    rowLabel: { fontFamily: 'Inter_400Regular', fontSize: 13, color: theme.textSecondary, flex: 1 },
    rowValue: { fontFamily: 'Inter_500Medium', fontSize: 13, color: theme.text, flex: 2, textAlign: 'right' },

    colourRow: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'flex-end', flex: 2 },
    colourDot: { width: 14, height: 14, borderRadius: 7, borderWidth: 1, borderColor: 'rgba(0,0,0,0.12)' },

    emptyNote: { fontFamily: 'Inter_400Regular', fontSize: 13, color: theme.textDisabled, fontStyle: 'italic' },

    bodyText: { fontFamily: 'Inter_400Regular', fontSize: 14, color: theme.text, lineHeight: 20 },

    badge: {
      alignSelf: 'flex-start',
      borderRadius: 6,
      paddingHorizontal: 10,
      paddingVertical: 4,
      marginTop: 8,
    },
    badgeText: { fontFamily: 'Inter_600SemiBold', fontSize: 12, color: '#fff' },

    warningBanner: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      borderWidth: 1,
      borderRadius: 12,
      padding: 14,
      marginBottom: 12,
    },
    warningText: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19 },

    errorBanner: {
      borderWidth: 1,
      borderRadius: 12,
      padding: 14,
      marginBottom: 12,
    },

    priceCard: { alignItems: 'center', paddingVertical: 24 },
    priceCardLabel: {
      fontFamily: 'Inter_400Regular',
      fontSize: 13,
      color: theme.textSecondary,
      marginBottom: 4,
    },
    priceCardValue: {
      fontFamily: 'CormorantGaramond_700Bold',
      fontSize: 48,
      color: theme.text,
      lineHeight: 56,
    },
    priceCardNote: {
      fontFamily: 'Inter_400Regular',
      fontSize: 12,
      color: theme.textSecondary,
      marginTop: 4,
    },

    bottomBar: {
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderTopWidth: 1,
      borderTopColor: theme.border,
      backgroundColor: theme.background,
    },
    listBtn: {
      backgroundColor: theme.accent,
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: 'center',
    },
    listBtnDisabled: { opacity: 0.6 },
    listBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 16, color: theme.accentText },

    successRoot: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
    successTitle: {
      fontFamily: 'CormorantGaramond_700Bold',
      fontSize: 34,
      color: theme.text,
      marginTop: 24,
      marginBottom: 8,
      textAlign: 'center',
    },
    successSubtitle: {
      fontFamily: 'Inter_400Regular',
      fontSize: 15,
      color: theme.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: 32,
    },
    successBtn: {
      backgroundColor: theme.accent,
      borderRadius: 12,
      paddingHorizontal: 48,
      paddingVertical: 15,
    },
    successBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 16, color: theme.accentText },
  });
}
