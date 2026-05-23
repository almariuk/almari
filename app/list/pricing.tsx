import { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { IconChevronLeft } from '@tabler/icons-react-native';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/hooks/useTheme';
import { useListingDraftStore } from '@/store/listing-draft';
import type { ListingDraftState } from '@/store/listing-draft';
import FireworkTrust from '@/components/brand/FireworkTrust';
import type {
  ConditionTierRow,
  ItemCareStatusRow,
  BenchmarkPriceRow,
  DailyExchangeRateRow,
} from '@/types/database';

const STALE = 10 * 60 * 1000;

// ── Trust computation ─────────────────────────────────────────

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
  // Photos — 15 pts max
  const photoCount = Math.min(draft.photoUris.length, 6);
  const photoEarned = PHOTO_PTS[photoCount] ?? (photoCount >= 4 ? 10 : 0);

  // Craft detail — 11 pts max (work=5, pattern=3, fabric=3)
  const craftEarned =
    (draft.workTypeId !== null ? 5 : 0) +
    (draft.patternId !== null ? 3 : 0) +
    (draft.fabricTypeId !== null ? 3 : 0);

  // Occasion — 4 pts
  const occasionEarned = draft.occasionBucketId !== null ? 4 : 0;

  // Colour — 4 pts
  const colourEarned = draft.colourId !== null ? 4 : 0;

  // Condition — from DB row (same pattern as care status)
  const conditionRow = conditionRows.find((r) => r.id === draft.conditionId);
  const conditionEarned = conditionRow?.listing_trust_contribution ?? 0;
  const conditionMax =
    conditionRows.length > 0
      ? Math.max(...conditionRows.map((r) => r.listing_trust_contribution))
      : 10;

  // Provenance — 20 pts max
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

  // Care status — from DB row
  const careRow = careRows.find((r) => r.id === draft.careStatusId);
  const careEarned = careRow?.listing_trust_contribution ?? 0;
  const careMax =
    careRows.length > 0 ? Math.max(...careRows.map((r) => r.listing_trust_contribution)) : 10;

  // Measurements — 18 pts max
  const measurements: [string, number][] = [
    [draft.listingBustCm, 3],
    [draft.listingWaistCm, 3],
    [draft.listingHipsCm, 3],
    [draft.listingChestCm, 3],
    [draft.listingHeightCm, 3],
    [draft.listingUkShoeSize, 2],
    [draft.listingLabelSize, 1],
  ];
  const measurementsEarned = measurements.reduce(
    (acc: number, [v, pts]: [string, number]) => acc + (v.trim().length > 0 ? pts : 0),
    0,
  );

  // Set contents — 8 pts max
  const setEarned =
    (draft.whatIsIncluded.trim().length > 0 ? 3 : 0) +
    (draft.isSetComplete !== null ? 5 : 0);

  // Why selling — 5 pts
  const motivationEarned = draft.motivationTypeId !== null ? 5 : 0;

  // Additional notes — 5 pts
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

// ── Helpers ───────────────────────────────────────────────────

function bestBenchmark(
  rows: BenchmarkPriceRow[],
  fabricTypeId: number | null,
  patternId: number | null,
): BenchmarkPriceRow | null {
  if (rows.length === 0) return null;
  const exactMatch = rows.find(
    (r) => r.fabric_type_id === fabricTypeId && r.pattern_id === patternId,
  );
  if (exactMatch) return exactMatch;
  const fabricMatch =
    fabricTypeId !== null ? rows.find((r) => r.fabric_type_id === fabricTypeId) : null;
  if (fabricMatch) return fabricMatch;
  const patternMatch =
    patternId !== null ? rows.find((r) => r.pattern_id === patternId) : null;
  if (patternMatch) return patternMatch;
  return rows[0];
}

function isProvenanceComplete(draft: ReturnType<typeof useListingDraftStore.getState>): boolean {
  if (draft.isHeirloom) return draft.heirloomStory.trim().length > 0;
  return draft.provenanceCityId !== null;
}

// ── Screen ────────────────────────────────────────────────────

export default function ListPricing() {
  const theme = useTheme();
  const router = useRouter();
  const s = makeStyles(theme);

  const draft = useListingDraftStore();
  const setAskingPricePence = useListingDraftStore((st: ListingDraftState) => st.setAskingPricePence);

  const [priceText, setPriceText] = useState<string>(
    draft.askingPricePence !== null ? String(draft.askingPricePence / 100) : '',
  );

  // ── Queries ────────────────────────────────────────────────

  const conditionQuery = useQuery<ConditionTierRow[]>({
    queryKey: ['condition_tiers'],
    queryFn: async () => {
      const { data, error } = await supabase.from('condition_tiers').select('*');
      if (error) throw error;
      return data ?? [];
    },
    staleTime: STALE,
  });

  const careQuery = useQuery<ItemCareStatusRow[]>({
    queryKey: ['item_care_status'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('item_care_status')
        .select('*')
        .order('listing_trust_contribution', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    staleTime: STALE,
  });

  const benchmarkQuery = useQuery<BenchmarkPriceRow[]>({
    queryKey: ['benchmark_prices', draft.subcategoryId],
    queryFn: async () => {
      if (!draft.subcategoryId) return [];
      const { data, error } = await supabase
        .from('benchmark_prices')
        .select('*')
        .eq('almari_subcategory_id', draft.subcategoryId);
      if (error) throw error;
      return data ?? [];
    },
    enabled: draft.subcategoryId !== null && isProvenanceComplete(draft),
    staleTime: STALE,
  });

  const rateQuery = useQuery<DailyExchangeRateRow | null>({
    queryKey: ['exchange_rate', 'INR', 'GBP'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_exchange_rates')
        .select('*')
        .eq('from_currency', 'INR')
        .eq('to_currency', 'GBP')
        .order('rate_date', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: isProvenanceComplete(draft),
    staleTime: STALE,
  });

  // ── Trust score ─────────────────────────────────────────────

  const components = useMemo(
    () => computeTrust(draft, conditionQuery.data ?? [], careQuery.data ?? []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      draft.photoUris.length,
      draft.workTypeId,
      draft.patternId,
      draft.fabricTypeId,
      draft.occasionBucketId,
      draft.colourId,
      draft.conditionId,
      draft.isHeirloom,
      draft.heirloomStory,
      draft.provenanceCityId,
      draft.provenanceAreaId,
      draft.sellerTypeId,
      draft.purchaseYear,
      draft.originalPriceInr,
      draft.careStatusId,
      draft.listingBustCm,
      draft.listingWaistCm,
      draft.listingHipsCm,
      draft.listingChestCm,
      draft.listingHeightCm,
      draft.listingUkShoeSize,
      draft.listingLabelSize,
      draft.whatIsIncluded,
      draft.isSetComplete,
      draft.motivationTypeId,
      draft.additionalNotes,
      conditionQuery.data,
      careQuery.data,
    ],
  );

  const totalScore = components.reduce((acc: number, c: TrustComponent) => acc + c.earned, 0);
  const maxScore = components.reduce((acc: number, c: TrustComponent) => acc + c.max, 0);
  const stateLabel = getStateLabel(totalScore, maxScore);

  // ── Price guide ──────────────────────────────────────────────

  const provenanceComplete = isProvenanceComplete(draft);

  const benchmark = useMemo(
    () => bestBenchmark(benchmarkQuery.data ?? [], draft.fabricTypeId, draft.patternId),
    [benchmarkQuery.data, draft.fabricTypeId, draft.patternId],
  );

  useEffect(() => {
    if (benchmark?.price_mid_gbp && draft.askingPricePence === null) {
      const midPence = Math.round(benchmark.price_mid_gbp * 100);
      setAskingPricePence(midPence);
      setPriceText(benchmark.price_mid_gbp.toFixed(2));
    }
  }, [benchmark]);

  const originalCostGbp = useMemo(() => {
    const inrStr = draft.originalPriceInr.trim();
    const rate = rateQuery.data?.rate;
    if (!inrStr || !rate || rate === 0) return null;
    const inr = parseFloat(inrStr);
    if (isNaN(inr)) return null;
    return inr / rate;
  }, [draft.originalPriceInr, rateQuery.data]);

  // ── Price input ───────────────────────────────────────────────

  const onPriceChange = (raw: string) => {
    const cleaned = raw.replace(/[^0-9.]/g, '').replace(/^(\d*\.\d{0,2}).*$/, '$1');
    setPriceText(cleaned);
    const parsed = parseFloat(cleaned);
    if (!isNaN(parsed) && parsed > 0) {
      setAskingPricePence(Math.round(parsed * 100));
    } else {
      setAskingPricePence(null);
    }
  };

  const canProceed = draft.askingPricePence !== null && draft.askingPricePence > 0;

  function dotColour(earned: number, max: number): string {
    if (earned === 0) return theme.border;
    if (earned === max) return theme.success;
    return theme.gold;
  }

  return (
    <SafeAreaView style={s.root} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={s.progressTrack}>
          <View style={[s.progressFill, { width: '75%' }]} />
        </View>

        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={s.header}>
            <TouchableOpacity onPress={() => router.back()} style={s.backBtn} hitSlop={12}>
              <IconChevronLeft size={22} color={theme.text} />
            </TouchableOpacity>
            <Text style={s.title}>Set your price</Text>
            <View style={{ width: 34 }} />
          </View>

          {/* ── Trust score ─────────────────────────────────────── */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Listing strength</Text>
            <View style={s.trustCard}>
              <View style={s.trustVisual}>
                <FireworkTrust score={totalScore} maxScore={maxScore} size={80} />
                <View style={s.trustLabelWrap}>
                  <Text style={s.trustScore}>
                    {totalScore}
                    <Text style={s.trustScoreOf}> / {maxScore}</Text>
                  </Text>
                  <Text style={s.trustStateLabel}>{stateLabel}</Text>
                </View>
              </View>

              <View style={s.componentList}>
                {components.map((c: TrustComponent) => (
                  <View key={c.label} style={s.componentRow}>
                    <View style={[s.dot, { backgroundColor: dotColour(c.earned, c.max) }]} />
                    <Text style={s.componentLabel}>{c.label}</Text>
                    <Text style={s.componentPts}>
                      {c.earned}
                      <Text style={s.componentPtsOf}> / {c.max}</Text>
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* ── Price guide — only when provenance complete ──────── */}
          {provenanceComplete && benchmark && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>What's it worth?</Text>
              <View style={s.priceGuideCard}>
                {benchmark.price_low_gbp !== null && benchmark.price_high_gbp !== null && (
                  <View style={s.priceRangeRow}>
                    <Text style={s.priceRangeLabel}>Similar items sell for</Text>
                    <Text style={s.priceRangeValue}>
                      £{benchmark.price_low_gbp.toFixed(0)} – £{benchmark.price_high_gbp.toFixed(0)}
                    </Text>
                  </View>
                )}
                {originalCostGbp !== null && (
                  <View style={[s.priceRangeRow, { marginTop: 10 }]}>
                    <Text style={s.priceRangeLabel}>
                      What you paid{draft.originalPriceApproximate ? ' (approx.)' : ''}
                    </Text>
                    <Text style={s.priceRangeValue}>≈ £{originalCostGbp.toFixed(0)}</Text>
                  </View>
                )}
                {benchmark.price_low_gbp !== null && benchmark.price_high_gbp !== null && (
                  <View style={s.rangeBar}>
                    <View style={s.rangeBarFill} />
                  </View>
                )}
              </View>
            </View>
          )}

          {/* ── Asking price ─────────────────────────────────────── */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Asking price</Text>
            <View style={s.priceInputCard}>
              <View style={s.priceInputRow}>
                <Text style={s.poundSign}>£</Text>
                <TextInput
                  style={s.priceInput}
                  value={priceText}
                  onChangeText={onPriceChange}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor={theme.textDisabled}
                  returnKeyType="done"
                  maxLength={8}
                />
              </View>
              <Text style={s.priceInputHint}>Buyers pay this price. Postage is on top.</Text>
            </View>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>

        <View style={s.bottomBar}>
          <TouchableOpacity
            style={[s.nextBtn, !canProceed && s.nextBtnDisabled]}
            onPress={() => canProceed && router.push('/list/review')}
            disabled={!canProceed}
            activeOpacity={0.85}
          >
            <Text style={[s.nextBtnText, !canProceed && s.nextBtnTextDisabled]}>Next</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────

function makeStyles(theme: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.background },

    progressTrack: { height: 3, backgroundColor: theme.border },
    progressFill: { height: 3, backgroundColor: theme.accent },

    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24 },

    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      marginBottom: 8,
    },
    backBtn: { padding: 6 },
    title: {
      fontFamily: 'CormorantGaramond_700Bold',
      fontSize: 22,
      color: theme.text,
    },

    section: { marginBottom: 24 },
    sectionTitle: {
      fontFamily: 'Inter_600SemiBold',
      fontSize: 13,
      color: theme.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginBottom: 12,
    },

    trustCard: {
      backgroundColor: theme.surface,
      borderRadius: 16,
      padding: 20,
      borderWidth: 1,
      borderColor: theme.border,
    },
    trustVisual: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 20,
      marginBottom: 20,
      paddingBottom: 20,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    trustLabelWrap: { flex: 1 },
    trustScore: {
      fontFamily: 'CormorantGaramond_700Bold',
      fontSize: 36,
      color: theme.text,
      lineHeight: 40,
    },
    trustScoreOf: {
      fontFamily: 'Inter_400Regular',
      fontSize: 18,
      color: theme.textSecondary,
    },
    trustStateLabel: {
      fontFamily: 'Inter_500Medium',
      fontSize: 15,
      color: theme.accent,
      marginTop: 2,
    },

    componentList: { gap: 10 },
    componentRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    dot: { width: 8, height: 8, borderRadius: 4 },
    componentLabel: {
      flex: 1,
      fontFamily: 'Inter_400Regular',
      fontSize: 14,
      color: theme.text,
    },
    componentPts: {
      fontFamily: 'Inter_600SemiBold',
      fontSize: 13,
      color: theme.text,
    },
    componentPtsOf: {
      fontFamily: 'Inter_400Regular',
      fontSize: 13,
      color: theme.textSecondary,
    },

    priceGuideCard: {
      backgroundColor: theme.surface,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.border,
    },
    priceRangeRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    priceRangeLabel: {
      fontFamily: 'Inter_400Regular',
      fontSize: 14,
      color: theme.textSecondary,
    },
    priceRangeValue: {
      fontFamily: 'Inter_600SemiBold',
      fontSize: 15,
      color: theme.text,
    },
    rangeBar: {
      height: 4,
      backgroundColor: theme.border,
      borderRadius: 2,
      marginTop: 16,
      overflow: 'hidden',
    },
    rangeBarFill: {
      width: '60%',
      height: 4,
      backgroundColor: theme.accent,
      borderRadius: 2,
    },

    priceInputCard: {
      backgroundColor: theme.surface,
      borderRadius: 16,
      padding: 20,
      borderWidth: 1,
      borderColor: theme.border,
    },
    priceInputRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    poundSign: {
      fontFamily: 'CormorantGaramond_700Bold',
      fontSize: 48,
      color: theme.text,
      lineHeight: 56,
      marginRight: 4,
    },
    priceInput: {
      flex: 1,
      fontFamily: 'CormorantGaramond_700Bold',
      fontSize: 48,
      color: theme.text,
      lineHeight: 56,
      padding: 0,
    },
    priceInputHint: {
      fontFamily: 'Inter_400Regular',
      fontSize: 13,
      color: theme.textSecondary,
      marginTop: 8,
    },

    bottomBar: {
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderTopWidth: 1,
      borderTopColor: theme.border,
      backgroundColor: theme.background,
    },
    nextBtn: {
      backgroundColor: theme.accent,
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: 'center',
    },
    nextBtnDisabled: { backgroundColor: theme.surface },
    nextBtnText: {
      fontFamily: 'Inter_600SemiBold',
      fontSize: 16,
      color: theme.accentText,
    },
    nextBtnTextDisabled: { color: theme.textDisabled },
  });
}
