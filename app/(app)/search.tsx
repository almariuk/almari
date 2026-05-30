import { useState, useMemo, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  StyleSheet,
} from 'react-native'
import type { SortBy } from '@/types/feed'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth'
import { useTheme } from '@/hooks/useTheme'
import { useFeedListings } from '@/hooks/useFeedListings'
import { getFitLabel, applyFitsMe } from '@/utils/fit'
import { FeedList } from '@/components/listings/FeedList'
import { IconSearch, IconX, IconChevronDown, IconChevronUp, IconRulerMeasure } from '@tabler/icons-react-native'
import type { FeedItem, FeedFilters } from '@/types/feed'

// ── Config ────────────────────────────────────────────────────

interface ConfigRow {
  id: number
  name?: string
  display_name?: string
  display_text?: string
  hex_code?: string
  name_hindi?: string
  category_id?: number
}

interface SearchConfig {
  categories:      ConfigRow[]
  subcategories:   ConfigRow[]
  occasionBuckets: ConfigRow[]
  colours:         ConfigRow[]
  conditionTiers:  ConfigRow[]
  patterns:        ConfigRow[]
  workTypes:       ConfigRow[]
  fabricTypes:     ConfigRow[]
}

function useSearchConfig() {
  return useQuery<SearchConfig>({
    queryKey: ['search_config'],
    queryFn: async () => {
      const [cats, subs, occ, cols, conds, pats, works, fabs] = await Promise.all([
        supabase.from('categories').select('id, name').eq('is_active', true).order('display_order'),
        supabase.from('subcategories').select('id, name, category_id').eq('is_active', true).order('display_order'),
        supabase.from('occasion_buckets').select('id, display_name').eq('is_active', true).order('display_order'),
        supabase.from('colour_swatches').select('id, name, name_hindi, hex_code').eq('is_active', true).order('display_order'),
        supabase.from('condition_tiers').select('id, display_text').eq('is_active', true).order('display_order'),
        supabase.from('patterns').select('id, display_name').eq('is_active', true).order('display_order'),
        supabase.from('work_types').select('id, display_name').eq('is_active', true).order('display_order'),
        supabase.from('fabric_types').select('id, display_name').eq('is_active', true).order('display_order'),
      ])
      return {
        categories:      (cats.data  ?? []) as ConfigRow[],
        subcategories:   (subs.data  ?? []) as ConfigRow[],
        occasionBuckets: (occ.data   ?? []) as ConfigRow[],
        colours:         (cols.data  ?? []) as ConfigRow[],
        conditionTiers:  (conds.data ?? []) as ConfigRow[],
        patterns:        (pats.data  ?? []) as ConfigRow[],
        workTypes:       (works.data ?? []) as ConfigRow[],
        fabricTypes:     (fabs.data  ?? []) as ConfigRow[],
      }
    },
    staleTime: Infinity,
  })
}

// ── Helpers ───────────────────────────────────────────────────

function toggle(arr: number[], id: number): number[] {
  return arr.includes(id) ? arr.filter(x => x !== id) : [...arr, id]
}

function toggleStr(arr: string[], val: string): string[] {
  return arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]
}

function merge(a: number[], b: number[]): number[] {
  return [...new Set([...a, ...b])]
}

const SIZE_CHIPS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '36', '38', '40', '42', '44', '46']

// ── Local components ──────────────────────────────────────────

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const theme = useTheme()
  return (
    <TouchableOpacity
      style={[chip.wrap, {
        backgroundColor: selected ? theme.accent : theme.surface,
        borderColor:     selected ? theme.accent : theme.border,
      }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[chip.text, {
        color:      selected ? theme.accentText : theme.text,
        fontFamily: selected ? 'Inter_600SemiBold' : 'Inter_400Regular',
      }]}>
        {label}
      </Text>
    </TouchableOpacity>
  )
}
const chip = StyleSheet.create({
  wrap: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 7 },
  text: { fontSize: 13 },
})

function ColourDot({ hex, selected, onPress }: { hex: string; selected: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <View style={[
        dot.circle,
        { backgroundColor: hex, borderColor: selected ? '#000' : (hex === '#FFFFFF' ? '#ccc' : hex), borderWidth: selected ? 3 : 1 },
      ]} />
    </TouchableOpacity>
  )
}
const dot = StyleSheet.create({
  circle: { width: 30, height: 30, borderRadius: 15 },
})

function FilterLabel({ text }: { text: string }) {
  const theme = useTheme()
  return <Text style={[fl.text, { color: theme.textSecondary }]}>{text.toUpperCase()}</Text>
}
const fl = StyleSheet.create({
  text: { fontFamily: 'Inter_500Medium', fontSize: 11, letterSpacing: 0.7, paddingHorizontal: 14, marginBottom: 8 },
})

// ── Screen ────────────────────────────────────────────────────

export default function Search() {
  const theme  = useTheme()
  const { identity, profile } = useAuthStore()
  const identityId = identity?.id ?? ''
  const s = makeStyles(theme)

  const { data: config } = useSearchConfig()

  // ── Filter state ──────────────────────────────────────────
  const [textQuery,      setTextQuery]      = useState('')
  const [debouncedText,  setDebouncedText]  = useState('')
  const [categoryId,     setCategoryId]     = useState<number | null>(null)
  const [subcategoryIds, setSubcategoryIds] = useState<number[]>([])
  const [occasionIds,    setOccasionIds]    = useState<number[]>([])
  const [colourIds,      setColourIds]      = useState<number[]>([])
  const [conditionIds,   setConditionIds]   = useState<number[]>([])
  const [patternIds,     setPatternIds]     = useState<number[]>([])
  const [workTypeIds,    setWorkTypeIds]    = useState<number[]>([])
  const [fabricTypeIds,  setFabricTypeIds]  = useState<number[]>([])
  const [labelSizes,     setLabelSizes]     = useState<string[]>([])
  const [fitsMeActive,   setFitsMeActive]   = useState(false)
  const [minPriceText,   setMinPriceText]   = useState('')
  const [maxPriceText,   setMaxPriceText]   = useState('')
  const [minPricePence,  setMinPricePence]  = useState<number | undefined>(undefined)
  const [maxPricePence,  setMaxPricePence]  = useState<number | undefined>(undefined)
  const [showMore,       setShowMore]       = useState(false)
  const [sortBy,         setSortBy]         = useState<SortBy>('newest')

  const resetAll = useCallback(() => {
    setTextQuery(''); setDebouncedText('')
    setCategoryId(null)
    setSubcategoryIds([]); setOccasionIds([]); setColourIds([])
    setConditionIds([]); setPatternIds([]); setWorkTypeIds([]); setFabricTypeIds([])
    setLabelSizes([])
    setFitsMeActive(false)
    setMinPriceText(''); setMaxPriceText('')
    setMinPricePence(undefined); setMaxPricePence(undefined)
    setShowMore(false); setSortBy('newest')
  }, [])

  const hasActiveFilters =
    textQuery.length > 0 || categoryId !== null ||
    subcategoryIds.length > 0 || occasionIds.length > 0 || colourIds.length > 0 ||
    conditionIds.length > 0 || patternIds.length > 0 || workTypeIds.length > 0 ||
    fabricTypeIds.length > 0 || labelSizes.length > 0 || fitsMeActive ||
    minPricePence !== undefined || maxPricePence !== undefined

  // ── Debounce text ─────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => setDebouncedText(textQuery), 500)
    return () => clearTimeout(t)
  }, [textQuery])

  // ── Debounce budget ───────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => {
      setMinPricePence(minPriceText ? Math.round(parseFloat(minPriceText) * 100) : undefined)
    }, 500)
    return () => clearTimeout(t)
  }, [minPriceText])

  useEffect(() => {
    const t = setTimeout(() => {
      setMaxPricePence(maxPriceText ? Math.round(parseFloat(maxPriceText) * 100) : undefined)
    }, 500)
    return () => clearTimeout(t)
  }, [maxPriceText])

  // ── Log search events ─────────────────────────────────────
  useEffect(() => {
    if (!debouncedText.trim()) return
    ;(supabase as any).from('search_events').insert({
      user_id: identityId || null,
      query: debouncedText,
      filters: {},
      results_count: 0,
    })
  }, [debouncedText, identityId])

  // ── Text search: resolve words across all dimensions ──────
  // Each word is matched independently. Matches are merged per dimension.
  // e.g. "silk saree" finds fabric "Silk" + subcategory "Saree"
  const textResolved = useMemo(() => {
    const q = debouncedText.trim().toLowerCase()
    if (!q || !config) return {}

    const words = q.split(/\s+/)
    let subIds:   number[] = []
    let colIds:   number[] = []
    let fabIds:   number[] = []
    let occIds:   number[] = []

    for (const word of words) {
      subIds = merge(subIds, config.subcategories.filter(x => x.name?.toLowerCase().includes(word)).map(x => x.id))
      colIds = merge(colIds, config.colours.filter(x =>
        x.name?.toLowerCase().includes(word) || x.name_hindi?.toLowerCase().includes(word)
      ).map(x => x.id))
      fabIds = merge(fabIds, config.fabricTypes.filter(x => x.display_name?.toLowerCase().includes(word)).map(x => x.id))
      occIds = merge(occIds, config.occasionBuckets.filter(x => x.display_name?.toLowerCase().includes(word)).map(x => x.id))
    }

    return {
      subcategoryIds:  subIds.length  > 0 ? subIds  : undefined,
      colourIds:       colIds.length  > 0 ? colIds  : undefined,
      fabricTypeIds:   fabIds.length  > 0 ? fabIds  : undefined,
      occasionBucketIds: occIds.length > 0 ? occIds : undefined,
    }
  }, [debouncedText, config])

  // ── Merge text-resolved + manual filters ─────────────────
  const visibleSubcategories = useMemo(() =>
    !categoryId || !config?.subcategories ? [] :
    config.subcategories.filter(s => s.category_id === categoryId),
  [categoryId, config])

  const mergedSubcategoryIds = useMemo(() =>
    merge(subcategoryIds, textResolved.subcategoryIds ?? []),
  [subcategoryIds, textResolved.subcategoryIds])

  const mergedColourIds = useMemo(() =>
    merge(colourIds, textResolved.colourIds ?? []),
  [colourIds, textResolved.colourIds])

  const mergedFabricTypeIds = useMemo(() =>
    merge(fabricTypeIds, textResolved.fabricTypeIds ?? []),
  [fabricTypeIds, textResolved.fabricTypeIds])

  const mergedOccasionIds = useMemo(() =>
    merge(occasionIds, textResolved.occasionBucketIds ?? []),
  [occasionIds, textResolved.occasionBucketIds])

  // ── Build filters object ──────────────────────────────────
  const filters: FeedFilters = {
    categoryId:        categoryId ?? undefined,
    subcategoryIds:    mergedSubcategoryIds.length > 0 ? mergedSubcategoryIds : undefined,
    occasionBucketIds: mergedOccasionIds.length   > 0 ? mergedOccasionIds   : undefined,
    colourIds:         mergedColourIds.length      > 0 ? mergedColourIds     : undefined,
    conditionIds:      conditionIds.length         > 0 ? conditionIds        : undefined,
    patternIds:        patternIds.length           > 0 ? patternIds          : undefined,
    workTypeIds:       workTypeIds.length          > 0 ? workTypeIds         : undefined,
    fabricTypeIds:     mergedFabricTypeIds.length  > 0 ? mergedFabricTypeIds : undefined,
    labelSizes:        labelSizes.length           > 0 ? labelSizes          : undefined,
    minPricePence,
    maxPricePence,
    sortBy,
  }

  const { data, hasNextPage, fetchNextPage, isFetchingNextPage, isLoading, refetch, isFetching } = useFeedListings(filters)
  const isRefreshing = isFetching && !isLoading && !isFetchingNextPage
  const totalLoaded = data?.pages.flat().length ?? 0

  const hasMeasurements = !!(profile?.bust_cm || profile?.waist_cm || profile?.hips_cm)
  const userMeasurements = hasMeasurements
    ? { bustCm: profile?.bust_cm ?? null, waistCm: profile?.waist_cm ?? null, hipsCm: profile?.hips_cm ?? null }
    : null

  const items = useMemo((): FeedItem[] => {
    const all = data?.pages.flat() ?? []
    const withLabels: FeedItem[] = all.map(l => ({
      ...l,
      fitLabel: fitsMeActive && userMeasurements ? getFitLabel(userMeasurements, l.measurements) : null,
    }))
    return fitsMeActive && userMeasurements ? applyFitsMe(withLabels) : withLabels
  }, [data, fitsMeActive, userMeasurements])

  const clearText = useCallback(() => { setTextQuery(''); setDebouncedText('') }, [])

  const SORT_OPTIONS: { key: SortBy; label: string }[] = [
    { key: 'newest',    label: 'Newest' },
    { key: 'price_asc', label: 'Price ↑' },
    { key: 'price_desc',label: 'Price ↓' },
  ]

  const filtersHeader = (
    <View style={s.filtersWrap}>

      {/* Sort + result count */}
      <View style={s.sortCountRow}>
        <View style={s.sortRow}>
          {SORT_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt.key}
              onPress={() => setSortBy(opt.key)}
              style={[s.sortBtn, sortBy === opt.key && { borderBottomColor: theme.accent, borderBottomWidth: 2 }]}
              activeOpacity={0.7}
            >
              <Text style={[s.sortBtnText, {
                color: sortBy === opt.key ? theme.accent : theme.textSecondary,
                fontFamily: sortBy === opt.key ? 'Inter_600SemiBold' : 'Inter_400Regular',
              }]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {(hasActiveFilters || debouncedText.length > 0) && !isLoading && (
          <Text style={[s.resultCount, { color: theme.textSecondary }]}>
            {hasNextPage ? `${totalLoaded}+` : `${totalLoaded}`} {totalLoaded === 1 ? 'result' : 'results'}
          </Text>
        )}
      </View>

      {/* Category */}
      <FilterLabel text="Category" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipRow}>
        {(config?.categories ?? []).map(c => (
          <Chip
            key={c.id}
            label={c.name ?? ''}
            selected={categoryId === c.id}
            onPress={() => {
              setCategoryId(prev => prev === c.id ? null : c.id)
              setSubcategoryIds([])
            }}
          />
        ))}
      </ScrollView>

      {/* Subcategory */}
      {categoryId != null && visibleSubcategories.length > 0 && (
        <>
          <FilterLabel text="Type" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipRow}>
            {visibleSubcategories.map(sc => (
              <Chip
                key={sc.id}
                label={sc.name ?? ''}
                selected={subcategoryIds.includes(sc.id)}
                onPress={() => setSubcategoryIds(prev => toggle(prev, sc.id))}
              />
            ))}
          </ScrollView>
        </>
      )}

      {/* Occasion */}
      <FilterLabel text="Occasion" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipRow}>
        {(config?.occasionBuckets ?? []).map(o => (
          <Chip
            key={o.id}
            label={o.display_name ?? ''}
            selected={occasionIds.includes(o.id)}
            onPress={() => setOccasionIds(prev => toggle(prev, o.id))}
          />
        ))}
      </ScrollView>

      {/* Colour */}
      <FilterLabel text="Colour" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.dotRow}>
        {(config?.colours ?? []).map(c => (
          <ColourDot
            key={c.id}
            hex={c.hex_code ?? '#ccc'}
            selected={colourIds.includes(c.id)}
            onPress={() => setColourIds(prev => toggle(prev, c.id))}
          />
        ))}
      </ScrollView>

      {/* Fits me + Budget */}
      <View style={s.utilRow}>
        {hasMeasurements && (
          <View style={s.fitsMeWrap}>
            <IconRulerMeasure size={15} color={fitsMeActive ? theme.accent : theme.textSecondary} />
            <Text style={[s.fitsMeLabel, { color: fitsMeActive ? theme.accent : theme.text }]}>Fits me</Text>
            <Switch
              value={fitsMeActive}
              onValueChange={setFitsMeActive}
              trackColor={{ false: theme.border, true: theme.accentSubtle }}
              thumbColor={fitsMeActive ? theme.accent : theme.surfaceRaised}
              ios_backgroundColor={theme.border}
            />
          </View>
        )}
        <View style={s.budgetWrap}>
          <TextInput
            style={[s.budgetInput, { borderColor: theme.border, backgroundColor: theme.inputBackground, color: theme.text }]}
            value={minPriceText}
            onChangeText={setMinPriceText}
            keyboardType="decimal-pad"
            placeholder="£ min"
            placeholderTextColor={theme.textDisabled}
          />
          <Text style={[s.budgetDash, { color: theme.textDisabled }]}>—</Text>
          <TextInput
            style={[s.budgetInput, { borderColor: theme.border, backgroundColor: theme.inputBackground, color: theme.text }]}
            value={maxPriceText}
            onChangeText={setMaxPriceText}
            keyboardType="decimal-pad"
            placeholder="£ max"
            placeholderTextColor={theme.textDisabled}
          />
        </View>
      </View>

      {/* More filters toggle */}
      <TouchableOpacity style={s.moreBtn} onPress={() => setShowMore(v => !v)} activeOpacity={0.7}>
        <Text style={[s.moreBtnText, { color: theme.accent }]}>
          {showMore ? 'Fewer filters' : 'More filters'}
        </Text>
        {showMore
          ? <IconChevronUp size={15} color={theme.accent} />
          : <IconChevronDown size={15} color={theme.accent} />
        }
      </TouchableOpacity>

      {showMore && (
        <>
          <FilterLabel text="Condition" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipRow}>
            {(config?.conditionTiers ?? []).map(c => (
              <Chip
                key={c.id}
                label={c.display_text ?? ''}
                selected={conditionIds.includes(c.id)}
                onPress={() => setConditionIds(prev => toggle(prev, c.id))}
              />
            ))}
          </ScrollView>

          <FilterLabel text="Pattern" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipRow}>
            {(config?.patterns ?? []).map(p => (
              <Chip
                key={p.id}
                label={p.display_name ?? ''}
                selected={patternIds.includes(p.id)}
                onPress={() => setPatternIds(prev => toggle(prev, p.id))}
              />
            ))}
          </ScrollView>

          <FilterLabel text="Work type" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipRow}>
            {(config?.workTypes ?? []).map(w => (
              <Chip
                key={w.id}
                label={w.display_name ?? ''}
                selected={workTypeIds.includes(w.id)}
                onPress={() => setWorkTypeIds(prev => toggle(prev, w.id))}
              />
            ))}
          </ScrollView>

          <FilterLabel text="Fabric" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipRow}>
            {(config?.fabricTypes ?? []).map(f => (
              <Chip
                key={f.id}
                label={f.display_name ?? ''}
                selected={fabricTypeIds.includes(f.id)}
                onPress={() => setFabricTypeIds(prev => toggle(prev, f.id))}
              />
            ))}
          </ScrollView>

          <FilterLabel text="Size" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipRow}>
            {SIZE_CHIPS.map(sz => (
              <Chip
                key={sz}
                label={sz}
                selected={labelSizes.includes(sz)}
                onPress={() => setLabelSizes(prev => toggleStr(prev, sz))}
              />
            ))}
          </ScrollView>
        </>
      )}

      <View style={s.resultsDivider} />
    </View>
  )

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <View style={[s.searchBarWrap, { borderBottomColor: theme.border }]}>
        <View style={s.searchBarRow}>
          <View style={[s.searchBar, { backgroundColor: theme.searchSurface, borderColor: theme.borderFocused }]}>
            <IconSearch size={16} color={theme.accent} />
            <TextInput
              style={[s.searchInput, { color: theme.text, fontFamily: 'Inter_400Regular' }]}
              value={textQuery}
              onChangeText={setTextQuery}
              placeholder="Search on almari"
              placeholderTextColor={theme.textSecondary}
              autoFocus
              returnKeyType="search"
              autoCorrect={false}
            />
            {textQuery.length > 0 && (
              <TouchableOpacity onPress={clearText} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <IconX size={16} color={theme.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
          {hasActiveFilters && (
            <TouchableOpacity onPress={resetAll} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={[s.clearBtn, { color: theme.accent, fontFamily: 'Inter_500Medium' }]}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FeedList
        items={items}
        isLoading={isLoading}
        isFetchingNextPage={isFetchingNextPage}
        isRefreshing={isRefreshing}
        onEndReached={() => { if (hasNextPage) fetchNextPage() }}
        onRefresh={refetch}
        emptyText="Nothing found. But someone might list exactly this tomorrow."
        ListHeaderComponent={filtersHeader}
      />
    </SafeAreaView>
  )
}

function makeStyles(theme: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.background },

    searchBarWrap: { paddingHorizontal: 12, paddingTop: 10, paddingBottom: 10, borderBottomWidth: StyleSheet.hairlineWidth },
    searchBarRow:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
    searchBar:     { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
    searchInput:   { flex: 1, fontSize: 15 },
    clearBtn:      { fontSize: 14 },

    filtersWrap:   { paddingTop: 16 },
    chipRow:       { paddingHorizontal: 14, gap: 8, paddingBottom: 16 },
    dotRow:        { paddingHorizontal: 14, gap: 10, paddingBottom: 16 },

    sortCountRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingRight: 14, paddingBottom: 14, paddingTop: 4 },
    sortRow:       { flexDirection: 'row', paddingHorizontal: 14, gap: 20 },
    sortBtn:       { paddingBottom: 6 },
    sortBtnText:   { fontSize: 13 },
    resultCount:   { fontFamily: 'Inter_400Regular', fontSize: 12 },

    utilRow:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 12, marginBottom: 16 },
    fitsMeWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    fitsMeLabel:{ fontFamily: 'Inter_400Regular', fontSize: 13 },
    budgetWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
    budgetInput:{ flex: 1, borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 9, fontSize: 14, fontFamily: 'Inter_400Regular' },
    budgetDash: { fontFamily: 'Inter_400Regular', fontSize: 14 },

    moreBtn:     { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 4 },
    moreBtnText: { fontFamily: 'Inter_500Medium', fontSize: 13 },

    resultsDivider: { height: 12 },
  })
}
