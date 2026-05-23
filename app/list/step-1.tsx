import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconCamera, IconChevronLeft, IconX } from '@tabler/icons-react-native';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/hooks/useTheme';
import { useListingDraftStore } from '@/store/listing-draft';
import type {
  CategoryRow,
  ColourSwatchRow,
  ConditionTierRow,
  FabricTypeRow,
  ItemCareStatusRow,
  OccasionBucketRow,
  PatternRow,
  SellerMotivationTypeRow,
  SubcategoryRow,
  WorkTypeRow,
} from '@/types/database';

const MIN_PHOTOS = 4;
const MAX_PHOTOS = 6;
const PHOTO_SLOT = 90;
const SWATCH_WRAP = 46;
const SWATCH_SIZE = 34;

export default function ListStep1() {
  const theme = useTheme();
  const router = useRouter();
  const draft = useListingDraftStore();
  const s = makeStyles(theme);

  const pickPhotos = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.85,
      selectionLimit: MAX_PHOTOS - draft.photoUris.length,
    });
    if (!result.canceled) {
      draft.setPhotoUris([...draft.photoUris, ...result.assets.map((a) => a.uri)]);
    }
  };

  const removePhoto = (index: number) =>
    draft.setPhotoUris(draft.photoUris.filter((_, i) => i !== index));

  const { data: categories = [], isLoading: loadingCats } = useQuery<CategoryRow[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order');
      return (data ?? []) as CategoryRow[];
    },
    staleTime: 10 * 60 * 1000,
  });

  const { data: allSubcategories = [] } = useQuery<SubcategoryRow[]>({
    queryKey: ['subcategories'],
    queryFn: async () => {
      const { data } = await supabase
        .from('subcategories')
        .select('*')
        .eq('is_active', true)
        .order('display_order');
      return (data ?? []) as SubcategoryRow[];
    },
    staleTime: 10 * 60 * 1000,
  });

  const { data: workTypes = [] } = useQuery<WorkTypeRow[]>({
    queryKey: ['work_types'],
    queryFn: async () => {
      const { data } = await supabase
        .from('work_types')
        .select('*')
        .eq('is_active', true)
        .order('display_order');
      return (data ?? []) as WorkTypeRow[];
    },
    staleTime: 10 * 60 * 1000,
  });

  const { data: patterns = [] } = useQuery<PatternRow[]>({
    queryKey: ['patterns'],
    queryFn: async () => {
      const { data } = await supabase
        .from('patterns')
        .select('*')
        .eq('is_active', true)
        .order('display_order');
      return (data ?? []) as PatternRow[];
    },
    staleTime: 10 * 60 * 1000,
  });

  const { data: fabricTypes = [] } = useQuery<FabricTypeRow[]>({
    queryKey: ['fabric_types'],
    queryFn: async () => {
      const { data } = await supabase
        .from('fabric_types')
        .select('*')
        .eq('is_active', true)
        .order('display_order');
      return (data ?? []) as FabricTypeRow[];
    },
    staleTime: 10 * 60 * 1000,
  });

  const { data: occasions = [] } = useQuery<OccasionBucketRow[]>({
    queryKey: ['occasion_buckets'],
    queryFn: async () => {
      const { data } = await supabase
        .from('occasion_buckets')
        .select('*')
        .eq('is_active', true)
        .order('display_order');
      return (data ?? []) as OccasionBucketRow[];
    },
    staleTime: 10 * 60 * 1000,
  });

  const { data: colours = [] } = useQuery<ColourSwatchRow[]>({
    queryKey: ['colour_swatches'],
    queryFn: async () => {
      const { data } = await supabase
        .from('colour_swatches')
        .select('*')
        .eq('is_active', true)
        .order('display_order');
      return (data ?? []) as ColourSwatchRow[];
    },
    staleTime: 10 * 60 * 1000,
  });

  const { data: conditions = [], isLoading: loadingConditions } = useQuery<ConditionTierRow[]>({
    queryKey: ['condition_tiers'],
    queryFn: async () => {
      const { data } = await supabase
        .from('condition_tiers')
        .select('*')
        .eq('is_active', true)
        .order('display_order');
      return (data ?? []) as ConditionTierRow[];
    },
    staleTime: 10 * 60 * 1000,
  });

  const { data: careStatuses = [] } = useQuery<ItemCareStatusRow[]>({
    queryKey: ['item_care_status'],
    queryFn: async () => {
      const { data } = await supabase
        .from('item_care_status')
        .select('*')
        .eq('is_active', true)
        .order('display_order');
      return (data ?? []) as ItemCareStatusRow[];
    },
    staleTime: 10 * 60 * 1000,
  });

  const { data: motivations = [] } = useQuery<SellerMotivationTypeRow[]>({
    queryKey: ['seller_motivation_types'],
    queryFn: async () => {
      const { data } = await supabase
        .from('seller_motivation_types')
        .select('*')
        .eq('is_active', true)
        .order('display_order');
      return (data ?? []) as SellerMotivationTypeRow[];
    },
    staleTime: 10 * 60 * 1000,
  });

  const subcategories = allSubcategories.filter((sc) => sc.category_id === draft.categoryId);

  const canProceed =
    draft.photoUris.length >= MIN_PHOTOS &&
    draft.categoryId !== null &&
    draft.subcategoryId !== null &&
    draft.conditionId !== null;

  return (
    <SafeAreaView style={s.root}>
      {/* ── Header ─────────────────────────────────────────────── */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <IconChevronLeft size={22} color={theme.text} />
        </TouchableOpacity>
        <View style={s.progressWrap}>
          <View style={[s.progressTrack, { backgroundColor: theme.border }]}>
            <View style={[s.progressFill, { backgroundColor: theme.accent }]} />
          </View>
          <Text style={[s.stepLabel, { color: theme.textSecondary }]}>Step 1 of 4</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={[s.pageTitle, { color: theme.text }]}>Tell us about your item</Text>

        {/* ── Photos ─────────────────────────────────────────────── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>
            Photos <Text style={{ color: theme.error }}>*</Text>
          </Text>
          <Text style={[s.hint, { color: theme.textDisabled }]}>
            Add at least {MIN_PHOTOS} photos (up to {MAX_PHOTOS}). Full length, back, detail, and
            label. First photo is the cover.
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.photosRow}
          >
            {draft.photoUris.map((uri, index) => (
              <View key={`${uri}-${index}`} style={s.photoSlot}>
                <Image source={{ uri }} style={s.photoThumb} contentFit="cover" />
                <TouchableOpacity
                  style={s.removePhotoBtn}
                  onPress={() => removePhoto(index)}
                  hitSlop={8}
                >
                  <IconX size={10} color="#fff" strokeWidth={3} />
                </TouchableOpacity>
                {index === 0 && (
                  <View style={s.coverBadge}>
                    <Text style={s.coverText}>Cover</Text>
                  </View>
                )}
              </View>
            ))}

            {draft.photoUris.length < MAX_PHOTOS && (
              <TouchableOpacity
                style={[
                  s.photoSlot,
                  s.addPhotoSlot,
                  { borderColor: theme.border, backgroundColor: theme.surface },
                ]}
                onPress={pickPhotos}
                activeOpacity={0.7}
              >
                <IconCamera size={24} color={theme.textSecondary} />
                <Text style={[s.addPhotoLabel, { color: theme.textSecondary }]}>Add photo</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
          {draft.photoUris.length > 0 && draft.photoUris.length < MIN_PHOTOS && (
            <Text style={[s.photoCountHint, { color: theme.textSecondary }]}>
              {MIN_PHOTOS - draft.photoUris.length} more photo
              {MIN_PHOTOS - draft.photoUris.length === 1 ? '' : 's'} needed
            </Text>
          )}
        </View>

        {/* ── Category ───────────────────────────────────────────── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>
            Category <Text style={{ color: theme.error }}>*</Text>
          </Text>
          {loadingCats ? (
            <ActivityIndicator size="small" color={theme.accent} style={s.loader} />
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.chipsRow}
            >
              {categories.map((cat) => {
                const selected = draft.categoryId === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      s.chip,
                      { borderColor: selected ? theme.accent : theme.border },
                      selected && { backgroundColor: theme.accent },
                    ]}
                    onPress={() => draft.setCategoryId(selected ? null : cat.id)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[s.chipText, { color: selected ? theme.accentText : theme.text }]}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>

        {/* ── Subcategory ─────────────────────────────────────────── */}
        {draft.categoryId !== null && subcategories.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>
              Type <Text style={{ color: theme.error }}>*</Text>
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.chipsRow}
            >
              {subcategories.map((sub) => {
                const selected = draft.subcategoryId === sub.id;
                return (
                  <TouchableOpacity
                    key={sub.id}
                    style={[
                      s.chip,
                      { borderColor: selected ? theme.accent : theme.border },
                      selected && { backgroundColor: theme.accent },
                    ]}
                    onPress={() => draft.setSubcategoryId(selected ? null : sub.id)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[s.chipText, { color: selected ? theme.accentText : theme.text }]}
                    >
                      {sub.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* ── Style (work type) ──────────────────────────────────── */}
        {workTypes.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>
              Style <Text style={[s.optionalLabel, { color: theme.accent }]}>optional</Text>
            </Text>
            {workTypes.map((wt) => {
              const selected = draft.workTypeId === wt.id;
              return (
                <TouchableOpacity
                  key={wt.id}
                  style={[
                    s.card,
                    { borderColor: selected ? theme.accent : theme.border },
                    selected && { backgroundColor: theme.accentSubtle },
                  ]}
                  onPress={() => draft.setWorkTypeId(selected ? null : wt.id)}
                  activeOpacity={0.85}
                >
                  <Text style={[s.cardTitle, { color: selected ? theme.accent : theme.text }]}>
                    {wt.display_name}
                  </Text>
                  {wt.description ? (
                    <Text style={[s.cardBody, { color: theme.textSecondary }]}>
                      {wt.description}
                    </Text>
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* ── Pattern ────────────────────────────────────────────── */}
        {patterns.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>
              Pattern <Text style={[s.optionalLabel, { color: theme.accent }]}>optional</Text>
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.chipsRow}
            >
              {patterns.map((pat) => {
                const selected = draft.patternId === pat.id;
                return (
                  <TouchableOpacity
                    key={pat.id}
                    style={[
                      s.chip,
                      { borderColor: selected ? theme.accent : theme.border },
                      selected && { backgroundColor: theme.accent },
                    ]}
                    onPress={() => draft.setPatternId(selected ? null : pat.id)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[s.chipText, { color: selected ? theme.accentText : theme.text }]}
                    >
                      {pat.display_name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* ── Fabric ─────────────────────────────────────────────── */}
        {fabricTypes.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>
              Fabric <Text style={[s.optionalLabel, { color: theme.accent }]}>optional</Text>
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.chipsRow}
            >
              {fabricTypes.map((fab) => {
                const selected = draft.fabricTypeId === fab.id;
                return (
                  <TouchableOpacity
                    key={fab.id}
                    style={[
                      s.chip,
                      { borderColor: selected ? theme.accent : theme.border },
                      selected && { backgroundColor: theme.accent },
                    ]}
                    onPress={() => draft.setFabricTypeId(selected ? null : fab.id)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[s.chipText, { color: selected ? theme.accentText : theme.text }]}
                    >
                      {fab.display_name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* ── Occasion ───────────────────────────────────────────── */}
        {occasions.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>
              Occasion{' '}
              <Text style={[s.optionalLabel, { color: theme.accent }]}>optional</Text>
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.chipsRow}
            >
              {occasions.map((occ) => {
                const selected = draft.occasionBucketId === occ.id;
                return (
                  <TouchableOpacity
                    key={occ.id}
                    style={[
                      s.chip,
                      { borderColor: selected ? theme.accent : theme.border },
                      selected && { backgroundColor: theme.accent },
                    ]}
                    onPress={() => draft.setOccasionBucketId(selected ? null : occ.id)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[s.chipText, { color: selected ? theme.accentText : theme.text }]}
                    >
                      {occ.display_name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* ── Colour ─────────────────────────────────────────────── */}
        {colours.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>
              Colour{' '}
              <Text style={[s.optionalLabel, { color: theme.accent }]}>optional</Text>
            </Text>
            <View style={s.swatchGrid}>
              {colours.map((swatch) => {
                const selected = draft.colourId === swatch.id;
                return (
                  <TouchableOpacity
                    key={swatch.id}
                    style={[s.swatchWrap, selected && { borderColor: theme.accent }]}
                    onPress={() => draft.setColourId(selected ? null : swatch.id)}
                    activeOpacity={0.8}
                  >
                    <View style={[s.swatchCircle, { backgroundColor: swatch.hex_code }]} />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* ── Condition ──────────────────────────────────────────── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>
            Condition <Text style={{ color: theme.error }}>*</Text>
          </Text>
          {loadingConditions ? (
            <ActivityIndicator size="small" color={theme.accent} style={s.loader} />
          ) : (
            conditions.map((cond) => {
              const selected = draft.conditionId === cond.id;
              return (
                <TouchableOpacity
                  key={cond.id}
                  style={[
                    s.card,
                    { borderColor: selected ? theme.accent : theme.border },
                    selected && { backgroundColor: theme.accentSubtle },
                  ]}
                  onPress={() => draft.setConditionId(selected ? null : cond.id)}
                  activeOpacity={0.85}
                >
                  <Text style={[s.cardTitle, { color: selected ? theme.accent : theme.text }]}>
                    {cond.display_text}
                  </Text>
                  {cond.detail_text ? (
                    <Text style={[s.cardBody, { color: theme.textSecondary }]}>
                      {cond.detail_text}
                    </Text>
                  ) : null}
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* ── Item care ──────────────────────────────────────────── */}
        {careStatuses.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>
              Item care{' '}
              <Text style={[s.optionalLabel, { color: theme.accent }]}>optional</Text>
            </Text>
            <Text style={[s.hint, { color: theme.textDisabled }]}>
              Affects your listing trust score.
            </Text>
            {careStatuses.map((cs) => {
              const selected = draft.careStatusId === cs.id;
              return (
                <TouchableOpacity
                  key={cs.id}
                  style={[
                    s.card,
                    { borderColor: selected ? theme.accent : theme.border },
                    selected && { backgroundColor: theme.accentSubtle },
                  ]}
                  onPress={() => draft.setCareStatusId(selected ? null : cs.id)}
                  activeOpacity={0.85}
                >
                  <View style={s.cardRow}>
                    <Text
                      style={[s.cardTitle, { color: selected ? theme.accent : theme.text, flex: 1 }]}
                    >
                      {cs.display_text}
                    </Text>
                    {cs.listing_trust_contribution > 0 && (
                      <View style={[s.trustPill, { backgroundColor: theme.success }]}>
                        <Text style={s.trustPillText}>+{cs.listing_trust_contribution}</Text>
                      </View>
                    )}
                  </View>
                  {cs.detail_text ? (
                    <Text style={[s.cardBody, { color: theme.textSecondary }]}>
                      {cs.detail_text}
                    </Text>
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* ── Why selling ────────────────────────────────────────── */}
        {motivations.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>
              Why are you selling?{' '}
              <Text style={[s.optionalLabel, { color: theme.accent }]}>optional</Text>
            </Text>
            <Text style={[s.hint, { color: theme.textDisabled }]}>
              Only visible to you. Helps us suggest the right price.
            </Text>
            {motivations.map((mot) => {
              const selected = draft.motivationTypeId === mot.id;
              return (
                <TouchableOpacity
                  key={mot.id}
                  style={[
                    s.card,
                    { borderColor: selected ? theme.accent : theme.border },
                    selected && { backgroundColor: theme.accentSubtle },
                  ]}
                  onPress={() => draft.setMotivationTypeId(selected ? null : mot.id)}
                  activeOpacity={0.85}
                >
                  <Text style={[s.cardTitle, { color: selected ? theme.accent : theme.text }]}>
                    {mot.display_text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* ── Next ───────────────────────────────────────────────── */}
        <TouchableOpacity
          style={[
            s.nextBtn,
            { backgroundColor: canProceed ? theme.accent : theme.surface },
          ]}
          onPress={() => canProceed && router.push('/list/step-2')}
          disabled={!canProceed}
          activeOpacity={0.85}
        >
          <Text
            style={[s.nextBtnText, { color: canProceed ? theme.accentText : theme.textDisabled }]}
          >
            Next
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(theme: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.background },

    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 14,
      gap: 16,
    },
    progressWrap: { flex: 1, gap: 6 },
    progressTrack: { height: 3, borderRadius: 2 },
    progressFill: { height: 3, width: '25%', borderRadius: 2 },
    stepLabel: { fontFamily: 'Inter_400Regular', fontSize: 12 },

    scroll: { paddingHorizontal: 20, paddingBottom: 48 },
    pageTitle: {
      fontFamily: 'CormorantGaramond_700Bold',
      fontSize: 28,
      marginBottom: 24,
      marginTop: 4,
    },

    section: { marginBottom: 28 },
    sectionTitle: {
      fontFamily: 'Inter_500Medium',
      fontSize: 13,
      color: theme.textSecondary,
      marginBottom: 10,
    },
    optionalLabel: { fontFamily: 'Inter_400Regular', fontSize: 11 },
    hint: {
      fontFamily: 'Inter_400Regular',
      fontSize: 12,
      lineHeight: 17,
      marginBottom: 10,
    },
    loader: { marginTop: 4, alignSelf: 'flex-start' },

    photosRow: { gap: 10, paddingVertical: 2 },
    photoSlot: {
      width: PHOTO_SLOT,
      height: PHOTO_SLOT,
      borderRadius: 10,
      overflow: 'hidden',
    },
    photoThumb: { width: '100%', height: '100%' },
    removePhotoBtn: {
      position: 'absolute',
      top: 5,
      right: 5,
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: 'rgba(0,0,0,0.55)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    coverBadge: {
      position: 'absolute',
      bottom: 5,
      left: 5,
      backgroundColor: 'rgba(0,0,0,0.55)',
      borderRadius: 4,
      paddingHorizontal: 5,
      paddingVertical: 2,
    },
    coverText: { fontFamily: 'Inter_500Medium', fontSize: 10, color: '#fff' },
    addPhotoSlot: {
      borderWidth: 1.5,
      borderStyle: 'dashed',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
    },
    addPhotoLabel: { fontFamily: 'Inter_400Regular', fontSize: 11 },
    photoCountHint: {
      fontFamily: 'Inter_400Regular',
      fontSize: 12,
      marginTop: 8,
    },

    chipsRow: { gap: 8, paddingVertical: 2 },
    chip: {
      borderWidth: 1.5,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    chipText: { fontFamily: 'Inter_400Regular', fontSize: 13 },

    swatchGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginTop: 4,
    },
    swatchWrap: {
      width: SWATCH_WRAP,
      height: SWATCH_WRAP,
      borderRadius: SWATCH_WRAP / 2,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: 'transparent',
    },
    swatchCircle: {
      width: SWATCH_SIZE,
      height: SWATCH_SIZE,
      borderRadius: SWATCH_SIZE / 2,
      borderWidth: 0.5,
      borderColor: 'rgba(0,0,0,0.12)',
    },

    card: {
      borderWidth: 1.5,
      borderRadius: 12,
      padding: 14,
      marginBottom: 8,
    },
    cardRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 2,
    },
    cardTitle: {
      fontFamily: 'Inter_500Medium',
      fontSize: 14,
      marginBottom: 2,
    },
    cardBody: {
      fontFamily: 'Inter_400Regular',
      fontSize: 12,
      lineHeight: 17,
    },
    trustPill: {
      paddingHorizontal: 7,
      paddingVertical: 3,
      borderRadius: 8,
    },
    trustPillText: {
      fontFamily: 'Inter_500Medium',
      fontSize: 11,
      color: '#fff',
    },

    nextBtn: {
      borderRadius: 12,
      paddingVertical: 15,
      alignItems: 'center',
      marginTop: 8,
    },
    nextBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 16 },
  });
}
