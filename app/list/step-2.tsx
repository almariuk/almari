import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { IconChevronLeft } from '@tabler/icons-react-native';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/hooks/useTheme';
import { useListingDraftStore } from '@/store/listing-draft';
import type {
  ProvenanceAreaRow,
  ProvenanceCityRow,
  SellerTypeRow,
} from '@/types/database';

export default function ListStep2() {
  const theme = useTheme();
  const router = useRouter();
  const draft = useListingDraftStore();
  const s = makeStyles(theme);

  const [focusedField, setFocusedField] = useState<string | null>(null);
  const inputBorder = (field: string) =>
    focusedField === field ? theme.borderFocused : theme.border;

  // ── Config queries ────────────────────────────────────────────

  const { data: cities = [], isLoading: loadingCities } = useQuery<ProvenanceCityRow[]>({
    queryKey: ['provenance_cities'],
    queryFn: async () => {
      const { data } = await supabase.from('provenance_cities').select('*').order('name');
      return ((data ?? []) as ProvenanceCityRow[]).filter((c) => c.name.toLowerCase() !== 'other');
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

  const { data: selectedCategory } = useQuery<{ category_type: string } | null>({
    queryKey: ['category_type', draft.categoryId],
    enabled: draft.categoryId !== null,
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from('categories')
        .select('category_type')
        .eq('id', draft.categoryId)
        .single();
      return data ?? null;
    },
    staleTime: 60 * 60 * 1000,
  });

  const isKids = selectedCategory?.category_type === 'kids';

  // ── Derived data ──────────────────────────────────────────────

  const areas = allAreas.filter((a) => a.city_id === draft.provenanceCityId);
  const pricePrefix = draft.originalPriceCurrency === 'GBP' ? '£' : '₹';
  const canProceed = true;

  return (
    <SafeAreaView style={s.root}>
      {/* ── Header ───────────────────────────────────────────── */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <IconChevronLeft size={22} color={theme.text} />
        </TouchableOpacity>
        <View style={s.progressWrap}>
          <View style={[s.progressTrack, { backgroundColor: theme.border }]}>
            <View style={[s.progressFill, { backgroundColor: theme.accent }]} />
          </View>
          <Text style={[s.stepLabel, { color: theme.textSecondary }]}>Step 2 of 4</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={[s.pageTitle, { color: theme.text }]}>A bit more about it</Text>

          {/* ── Provenance ────────────────────────────────────── */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>
              Where did it come from?{' '}
              <Text style={[s.optionalLabel, { color: theme.accent }]}>optional</Text>
            </Text>

            {/* Heirloom toggle */}
            <View style={[s.toggleRow, { borderColor: theme.border, backgroundColor: theme.surface }]}>
              <View style={s.toggleTextWrap}>
                <Text style={[s.toggleLabel, { color: theme.text }]}>Heirloom or inherited</Text>
                <Text style={[s.toggleHint, { color: theme.textDisabled }]}>
                  I don't know where it was bought
                </Text>
              </View>
              <Switch
                value={draft.isHeirloom}
                onValueChange={draft.setIsHeirloom}
                trackColor={{ false: theme.border, true: theme.accent }}
                ios_backgroundColor={theme.border}
              />
            </View>

            {draft.isHeirloom ? (
              /* Heirloom story */
              <TextInput
                style={[
                  s.textArea,
                  {
                    borderColor: inputBorder('story'),
                    backgroundColor: theme.inputBackground,
                    color: theme.text,
                    marginTop: 12,
                  },
                ]}
                value={draft.heirloomStory}
                onChangeText={draft.setHeirloomStory}
                placeholder="Tell us the story — where it's from, who owned it, what it means."
                placeholderTextColor={theme.textDisabled}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                onFocus={() => setFocusedField('story')}
                onBlur={() => setFocusedField(null)}
              />
            ) : (
              <>
                {/* City */}
                {loadingCities ? (
                  <ActivityIndicator size="small" color={theme.accent} style={s.loader} />
                ) : cities.length > 0 ? (
                  <View style={s.subSection}>
                    <Text style={[s.subSectionLabel, { color: theme.textSecondary }]}>City</Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={s.chipsRow}
                    >
                      {cities.map((city) => {
                        const selected = draft.provenanceCityId === city.id;
                        return (
                          <TouchableOpacity
                            key={city.id}
                            style={[
                              s.chip,
                              { borderColor: selected ? theme.accent : theme.border },
                              selected && { backgroundColor: theme.accent },
                            ]}
                            onPress={() => {
                              if (selected) {
                                draft.setProvenanceCityId(null);
                                draft.setOriginalPriceCurrency('INR');
                              } else {
                                draft.setProvenanceCityId(city.id);
                                draft.setOriginalPriceCurrency(city.country === 'UK' ? 'GBP' : 'INR');
                              }
                            }}
                            activeOpacity={0.8}
                          >
                            <Text
                              style={[
                                s.chipText,
                                { color: selected ? theme.accentText : theme.text },
                              ]}
                            >
                              {city.name}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                      <TouchableOpacity
                        style={[
                          s.chip,
                          { borderColor: draft.provenanceCityOther ? theme.accent : theme.border },
                          draft.provenanceCityOther && { backgroundColor: theme.accent },
                        ]}
                        onPress={() => {
                          if (draft.provenanceCityOther) {
                            draft.setProvenanceCityOther(false);
                          } else {
                            draft.setProvenanceCityId(null);
                            draft.setProvenanceCityOther(true);
                            draft.setOriginalPriceCurrency('INR');
                          }
                        }}
                        activeOpacity={0.8}
                      >
                        <Text style={[s.chipText, { color: draft.provenanceCityOther ? theme.accentText : theme.text }]}>
                          Other
                        </Text>
                      </TouchableOpacity>
                    </ScrollView>
                  </View>
                ) : null}

                {/* Currency toggle — only when Other is selected */}
                {draft.provenanceCityOther && (
                  <View style={s.subSection}>
                    <Text style={[s.subSectionLabel, { color: theme.textSecondary }]}>Currency</Text>
                    <View style={s.chipsRow}>
                      {(['INR', 'GBP'] as const).map((currency) => {
                        const selected = draft.originalPriceCurrency === currency;
                        return (
                          <TouchableOpacity
                            key={currency}
                            style={[
                              s.chip,
                              { borderColor: selected ? theme.accent : theme.border },
                              selected && { backgroundColor: theme.accent },
                            ]}
                            onPress={() => draft.setOriginalPriceCurrency(currency)}
                            activeOpacity={0.8}
                          >
                            <Text style={[s.chipText, { color: selected ? theme.accentText : theme.text }]}>
                              {currency === 'INR' ? '₹ INR' : '£ GBP'}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                )}

                {/* Area (cascades from city) */}
                {draft.provenanceCityId !== null && areas.length > 0 && (
                  <View style={s.subSection}>
                    <Text style={[s.subSectionLabel, { color: theme.textSecondary }]}>Area</Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={s.chipsRow}
                    >
                      {areas.map((area) => {
                        const selected = draft.provenanceAreaId === area.id;
                        return (
                          <TouchableOpacity
                            key={area.id}
                            style={[
                              s.chip,
                              { borderColor: selected ? theme.accent : theme.border },
                              selected && { backgroundColor: theme.accent },
                            ]}
                            onPress={() =>
                              draft.setProvenanceAreaId(selected ? null : area.id)
                            }
                            activeOpacity={0.8}
                          >
                            <Text
                              style={[
                                s.chipText,
                                { color: selected ? theme.accentText : theme.text },
                              ]}
                            >
                              {area.name}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>
                )}

                {/* Seller type */}
                {sellerTypes.length > 0 && (
                  <View style={s.subSection}>
                    <Text style={[s.subSectionLabel, { color: theme.textSecondary }]}>
                      Bought from
                    </Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={s.chipsRow}
                    >
                      {sellerTypes.map((st) => {
                        const selected = draft.sellerTypeId === st.id;
                        return (
                          <TouchableOpacity
                            key={st.id}
                            style={[
                              s.chip,
                              { borderColor: selected ? theme.accent : theme.border },
                              selected && { backgroundColor: theme.accent },
                            ]}
                            onPress={() => draft.setSellerTypeId(selected ? null : st.id)}
                            activeOpacity={0.8}
                          >
                            <Text
                              style={[
                                s.chipText,
                                { color: selected ? theme.accentText : theme.text },
                              ]}
                            >
                              {st.name}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>
                )}

                {/* Year + original price */}
                <View style={s.subSection}>
                  <View style={s.twoColRow}>
                    {/* Year */}
                    <View style={s.twoColCell}>
                      <Text style={[s.subSectionLabel, { color: theme.textSecondary }]}>Year</Text>
                      <View
                        style={[
                          s.inputWrap,
                          {
                            borderColor: inputBorder('year'),
                            backgroundColor: theme.inputBackground,
                          },
                        ]}
                      >
                        <TextInput
                          style={[s.input, { color: theme.text }]}
                          value={draft.purchaseYear}
                          onChangeText={draft.setPurchaseYear}
                          keyboardType="number-pad"
                          maxLength={4}
                          placeholder="e.g. 2019"
                          placeholderTextColor={theme.textDisabled}
                          onFocus={() => setFocusedField('year')}
                          onBlur={() => setFocusedField(null)}
                        />
                      </View>
                    </View>

                    {/* Original price INR */}
                    <View style={s.twoColCell}>
                      <Text style={[s.subSectionLabel, { color: theme.textSecondary }]}>
                        Original price
                      </Text>
                      <View
                        style={[
                          s.inputWrap,
                          {
                            borderColor: inputBorder('priceInr'),
                            backgroundColor: theme.inputBackground,
                          },
                        ]}
                      >
                        <Text style={[s.inputPrefix, { color: theme.textSecondary }]}>{pricePrefix}</Text>
                        <TextInput
                          style={[s.input, { color: theme.text }]}
                          value={draft.originalPriceInr}
                          onChangeText={draft.setOriginalPriceInr}
                          keyboardType="number-pad"
                          placeholder="e.g. 15000"
                          placeholderTextColor={theme.textDisabled}
                          onFocus={() => setFocusedField('priceInr')}
                          onBlur={() => setFocusedField(null)}
                        />
                      </View>
                    </View>
                  </View>

                  {/* Approximate toggle — only show if a price has been entered */}
                  {draft.originalPriceInr.length > 0 && (
                    <View style={s.approxRow}>
                      <Text style={[s.approxLabel, { color: theme.textSecondary }]}>
                        Approximate price
                      </Text>
                      <Switch
                        value={draft.originalPriceApproximate}
                        onValueChange={draft.setOriginalPriceApproximate}
                        trackColor={{ false: theme.border, true: theme.accent }}
                        ios_backgroundColor={theme.border}
                      />
                    </View>
                  )}
                </View>
              </>
            )}
          </View>

          {/* ── Measurements ──────────────────────────────────── */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>
              {isKids ? 'Size & age' : 'Garment measurements'}{' '}
              <Text style={[s.optionalLabel, { color: theme.accent }]}>optional</Text>
            </Text>
            <Text style={[s.hint, { color: theme.textDisabled }]}>
              {isKids
                ? 'Age and height this item fits. Helps parents find the right size.'
                : 'These are the garment\'s dimensions, not your body. Helps buyers get the right fit.'}
            </Text>

            {isKids ? (
              <>
                <View style={s.measureGrid}>
                  {[
                    { key: 'ageFrom', label: 'Age from (years)', value: draft.listingAgeFromYears, set: draft.setListingAgeFromYears },
                    { key: 'ageTo',   label: 'Age to (years)',   value: draft.listingAgeToYears,   set: draft.setListingAgeToYears },
                    { key: 'htFrom',  label: 'Height from (cm)', value: draft.listingHeightFromCm, set: draft.setListingHeightFromCm },
                    { key: 'htTo',    label: 'Height to (cm)',   value: draft.listingHeightToCm,   set: draft.setListingHeightToCm },
                  ].map(({ key, label, value, set }) => (
                    <View key={key} style={s.measureCell}>
                      <Text style={[s.measureLabel, { color: theme.textSecondary }]}>{label}</Text>
                      <TextInput
                        style={[s.measureInput, { borderColor: inputBorder(key), backgroundColor: theme.inputBackground, color: theme.text }]}
                        value={value}
                        onChangeText={set}
                        keyboardType="number-pad"
                        placeholder="—"
                        placeholderTextColor={theme.textDisabled}
                        onFocus={() => setFocusedField(key)}
                        onBlur={() => setFocusedField(null)}
                      />
                    </View>
                  ))}
                </View>
                {/* Shoe size for kids footwear */}
                <View style={s.labelSizeRow}>
                  <Text style={[s.measureLabel, { color: theme.textSecondary }]}>UK shoe size</Text>
                  <View style={[s.inputWrap, s.inputWrapFull, { borderColor: inputBorder('shoe'), backgroundColor: theme.inputBackground }]}>
                    <TextInput
                      style={[s.input, { color: theme.text }]}
                      value={draft.listingUkShoeSize}
                      onChangeText={draft.setListingUkShoeSize}
                      keyboardType="decimal-pad"
                      placeholder="e.g. 2"
                      placeholderTextColor={theme.textDisabled}
                      onFocus={() => setFocusedField('shoe')}
                      onBlur={() => setFocusedField(null)}
                    />
                  </View>
                </View>
              </>
            ) : (
              <>
                <View style={s.measureGrid}>
                  {[
                    { key: 'bust',   label: 'Bust cm',      value: draft.listingBustCm,     set: draft.setListingBustCm },
                    { key: 'waist',  label: 'Waist cm',     value: draft.listingWaistCm,    set: draft.setListingWaistCm },
                    { key: 'hips',   label: 'Hips cm',      value: draft.listingHipsCm,     set: draft.setListingHipsCm },
                    { key: 'chest',  label: 'Chest cm',     value: draft.listingChestCm,    set: draft.setListingChestCm },
                    { key: 'height', label: 'Height cm',    value: draft.listingHeightCm,   set: draft.setListingHeightCm },
                    { key: 'shoe',   label: 'UK shoe size', value: draft.listingUkShoeSize, set: draft.setListingUkShoeSize },
                  ].map(({ key, label, value, set }) => (
                    <View key={key} style={s.measureCell}>
                      <Text style={[s.measureLabel, { color: theme.textSecondary }]}>{label}</Text>
                      <TextInput
                        style={[s.measureInput, { borderColor: inputBorder(key), backgroundColor: theme.inputBackground, color: theme.text }]}
                        value={value}
                        onChangeText={set}
                        keyboardType={key === 'shoe' ? 'decimal-pad' : 'number-pad'}
                        placeholder="—"
                        placeholderTextColor={theme.textDisabled}
                        onFocus={() => setFocusedField(key)}
                        onBlur={() => setFocusedField(null)}
                      />
                    </View>
                  ))}
                </View>
                <View style={s.labelSizeRow}>
                  <Text style={[s.measureLabel, { color: theme.textSecondary }]}>Label size</Text>
                  <View style={[s.inputWrap, s.inputWrapFull, { borderColor: inputBorder('labelSize'), backgroundColor: theme.inputBackground }]}>
                    <TextInput
                      style={[s.input, { color: theme.text }]}
                      value={draft.listingLabelSize}
                      onChangeText={draft.setListingLabelSize}
                      placeholder="e.g. S, M, 38, XL, Free size"
                      placeholderTextColor={theme.textDisabled}
                      autoCapitalize="characters"
                      onFocus={() => setFocusedField('labelSize')}
                      onBlur={() => setFocusedField(null)}
                    />
                  </View>
                </View>
              </>
            )}
          </View>

          {/* ── Set contents ──────────────────────────────────── */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>
              What's in the set?{' '}
              <Text style={[s.optionalLabel, { color: theme.accent }]}>optional</Text>
            </Text>
            <Text style={[s.hint, { color: theme.textDisabled }]}>
              Skip if it's a single piece.
            </Text>

            <TextInput
              style={[
                s.textArea,
                {
                  borderColor: inputBorder('inclusions'),
                  backgroundColor: theme.inputBackground,
                  color: theme.text,
                },
              ]}
              value={draft.whatIsIncluded}
              onChangeText={draft.setWhatIsIncluded}
              placeholder="e.g. Lehenga, blouse, dupatta"
              placeholderTextColor={theme.textDisabled}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              onFocus={() => setFocusedField('inclusions')}
              onBlur={() => setFocusedField(null)}
            />

            {draft.whatIsIncluded.trim().length > 0 && (
              <View style={[s.chipsRow, { marginTop: 10 }]}>
                {([
                  { value: true as boolean | null, label: 'Complete set' },
                  { value: false as boolean | null, label: 'Parts missing' },
                ] as const).map((opt) => {
                  const selected = draft.isSetComplete === opt.value;
                  return (
                    <TouchableOpacity
                      key={String(opt.value)}
                      style={[
                        s.chip,
                        { borderColor: selected ? theme.accent : theme.border },
                        selected && { backgroundColor: theme.accent },
                      ]}
                      onPress={() => draft.setIsSetComplete(selected ? null : opt.value)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          s.chipText,
                          { color: selected ? theme.accentText : theme.text },
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          {/* ── Additional notes ─────────────────────────────── */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>
              Anything else to add?{' '}
              <Text style={[s.optionalLabel, { color: theme.accent }]}>optional</Text>
            </Text>
            <Text style={[s.hint, { color: theme.textDisabled }]}>
              Anything a buyer should know — minor marks, alterations, sentimental details.
            </Text>
            <TextInput
              style={[
                s.textArea,
                {
                  borderColor: inputBorder('notes'),
                  backgroundColor: theme.inputBackground,
                  color: theme.text,
                },
              ]}
              value={draft.additionalNotes}
              onChangeText={draft.setAdditionalNotes}
              placeholder="e.g. Small mark on inner hem, not visible when worn."
              placeholderTextColor={theme.textDisabled}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              onFocus={() => setFocusedField('notes')}
              onBlur={() => setFocusedField(null)}
            />
          </View>

          {/* ── Next ────────────────────────────────────────────── */}
          <TouchableOpacity
            style={[
              s.nextBtn,
              { backgroundColor: canProceed ? theme.accent : theme.surface },
            ]}
            onPress={() => canProceed && router.push('/list/pricing')}
            disabled={!canProceed}
            activeOpacity={0.85}
          >
            <Text
              style={[
                s.nextBtnText,
                { color: canProceed ? theme.accentText : theme.textDisabled },
              ]}
            >
              Next
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function makeStyles(theme: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.background },
    flex: { flex: 1 },

    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 14,
      gap: 16,
    },
    progressWrap: { flex: 1, gap: 6 },
    progressTrack: { height: 3, borderRadius: 2 },
    progressFill: { height: 3, width: '50%', borderRadius: 2 },
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

    subSection: { marginTop: 12 },
    subSectionLabel: {
      fontFamily: 'Inter_500Medium',
      fontSize: 12,
      marginBottom: 8,
    },

    toggleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1.5,
      borderRadius: 12,
      padding: 14,
      gap: 12,
    },
    toggleTextWrap: { flex: 1 },
    toggleLabel: { fontFamily: 'Inter_500Medium', fontSize: 14, marginBottom: 2 },
    toggleHint: { fontFamily: 'Inter_400Regular', fontSize: 12 },

    approxRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 10,
    },
    approxLabel: { fontFamily: 'Inter_400Regular', fontSize: 13 },

    twoColRow: { flexDirection: 'row', gap: 10 },
    twoColCell: { flex: 1 },

    chipsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
    chip: {
      borderWidth: 1.5,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    chipText: { fontFamily: 'Inter_400Regular', fontSize: 13 },

    inputWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1.5,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 13,
      gap: 6,
    },
    inputWrapFull: { flex: 1 },
    input: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 15 },
    inputPrefix: { fontFamily: 'Inter_400Regular', fontSize: 15 },

    textArea: {
      borderWidth: 1.5,
      borderRadius: 10,
      padding: 14,
      fontFamily: 'Inter_400Regular',
      fontSize: 15,
      minHeight: 96,
    },

    measureGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      marginBottom: 12,
    },
    measureCell: { width: '47%' },
    measureLabel: {
      fontFamily: 'Inter_400Regular',
      fontSize: 12,
      marginBottom: 4,
    },
    measureInput: {
      borderWidth: 1.5,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontFamily: 'Inter_400Regular',
      fontSize: 15,
    },

    labelSizeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
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
