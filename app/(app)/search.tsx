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
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQuery } from '@tanstack/react-query'
import { useFocusEffect } from 'expo-router'
import { IconSearch, IconX, IconChevronDown, IconChevronUp, IconRulerMeasure } from '@tabler/icons-react-native'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth'
import { useTheme } from '@/hooks/useTheme'
import { useFeedListings } from '@/hooks/useFeedListings'
import { getFitLabel, applyFitsMe } from '@/utils/fit'
import { FeedList } from '@/components/listings/FeedList'
import type { FeedItem, FeedFilters } from '@/types/feed'

// ── Config ──────────────────────────────────────────────────

interface ConfigRow { id: number; name?: string; display_name?: string; display_text?: string; hex_code?: string; name_hindi?: string; category_id?: number }

interface SearchConfig {
  categories:     ConfigRow[]
  subcategories:  ConfigRow[]
  occasionBuckets:ConfigRow[]
  colours:        ConfigRow[]
  conditionTiers: ConfigRow[]
  patterns:       ConfigRow[]
  workTypes:      ConfigRow[]
  fabricTypes:    ConfigRow[]
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
        categories:      (cats.data ?? [])  as ConfigRow[],
        subcategories:   (subs.data ?? [])  as ConfigRow[],
        occasionBuckets: (occ.data  ?? [])  as ConfigRow[],
        colours:         (cols.data  ?? [])  as ConfigRow[],
        conditionTiers:  (conds.data ?? [])  as ConfigRow[],
        patterns:        (pats.data  ?? [])  as ConfigRow[],
        workTypes:       (works.data ?? [])  as ConfigRow[],
        fabricTypes:     (fabs.data  ?? [])  as ConfigRow[],
      }
    },
    staleTime: Infinity,
  })
}

// ── Local components ─────────────────────────────────────────

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
      <Text style={[chip.text, { color: selected ? theme.accentText : theme.text, fontFamily: selected ? 'Inter_600SemiBold' : 'Inter_400Regular' }]}>
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
  return (
    <Text style={[fl.text, { color: theme.textSecondary }]}>{text.toUpperCase()}</Text>
  )
}

const fl = StyleSheet.create({
  text: { fontFamily: 'Inter_500Medium', fontSize: 11, letterSpacing: 0.7, paddingHorizontal: 14, marginBottom: 8 },
})

// ── Screen ────────────────────────────────────────────────────

export default function Search() {
  const theme = useTheme()
  const { identity, profile } = useAuthStore()
  const identityId = identity?.id ?? ''
  const s = makeStyles(theme)

  const { data: config } = useSearchConfig()

  // Filter state
  const [textQuery,       setTextQuery]       = useState('')
  const [debouncedText,   setDebouncedText]   = useState('')
  const [categoryId,      setCategoryId]      = useState<number | null>(null)
  const [subcategoryId,   setSubcategoryId]   = useState<number | null>(null)
  const [occasionId,      setOccasionId]      = useState<number | null>(null)
  const [colourId,        setColourId]        = useState<number | null>(null)
  const [fitsMeActive,    setFitsMeActive]    = useState(false)
  const [minPriceText,    setMinPriceText]    = useState('')
  const [maxPriceText,    setMaxPriceText]    = useState('')
  const [minPricePence,   setMinPricePence]   = useState<number | undefined>(undefined)
  const [maxPricePence,   setMaxPricePence]   = useState<number | undefined>(undefined)
  const [conditionId,     setConditionId]     = useState<number | null>(null)
  const [patternId,       setPatternId]       = useState<number | null>(null)
  const [workTypeId,      setWorkTypeId]      = useState<number | null>(null)
  const [fabricTypeId,    setFabricTypeId]    = useState<number | null>(null)
  const [showMore,        setShowMore]        = useState(false)

  const resetAll = useCallback(() => {
    setTextQuery(''); setDebouncedText('')
    setCategoryId(null); setSubcategoryId(null)
    setOccasionId(null); setColourId(null)
    setFitsMeActive(false)
    setMinPriceText(''); setMaxPriceText('')
    setMinPricePence(undefined); setMaxPricePence(undefined)
    setConditionId(null); setPatternId(null)
    setWorkTypeId(null); setFabricTypeId(null)
    setShowMore(false)
  }, [])

  useFocusEffect(useCallback(() => {
    resetAll()
  }, [resetAll]))

  const hasActiveFilters =
    textQuery.length > 0 || categoryId !== null || subcategoryId !== null ||
    occasionId !== null || colourId !== null || fitsMeActive ||
    minPricePence !== undefined || maxPricePence !== undefined ||
    conditionId !== null || patternId !== null || workTypeId !== null || fabricTypeId !== null

  // Debounce text
  useEffect(() => {
    const t = setTimeout(() => setDebouncedText(textQuery), 500)
    return () => clearTimeout(t)
  }, [textQuery])

  // Log search events
  useEffect(() => {
    if (!debouncedText.trim()) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(supabase as any).from('search_events').insert({
      user_id: identityId || null,
      query: debouncedText,
      filters: {},
      results_count: 0,
    })
  }, [debouncedText, identityId])

  // Derive subcategoryIds from text search
  const textSubcategoryIds = useMemo(() => {
    const q = debouncedText.trim().toLowerCase()
    if (!q || !config?.subcategories) return undefined
    const matches = config.subcategories
      .filter(s => s.name?.toLowerCase().includes(q))
      .map(s => s.id)
    return matches.length > 0 ? matches : [-1] // -1 = no match, returns nothing
  }, [debouncedText, config?.subcategories])

  // Subcategories for the selected category
  const visibleSubcategories = useMemo(() => {
    if (!categoryId || !config?.subcategories) return []
    return config.subcategories.filter(s => s.category_id === categoryId)
  }, [categoryId, config?.subcategories])

  const hasMeasurements = !!(profile?.bust_cm || profile?.waist_cm || profile?.hips_cm)
  const userMeasurements = hasMeasurements
    ? { bustCm: profile?.bust_cm ?? null, waistCm: profile?.waist_cm ?? null, hipsCm: profile?.hips_cm ?? null }
    : null

  const filters: FeedFilters = {
    categoryId:      categoryId      ?? undefined,
    subcategoryId:   subcategoryId   ?? undefined,
    subcategoryIds:  textSubcategoryIds,
    occasionBucketId:occasionId      ?? undefined,
    colourId:        colourId        ?? undefined,
    conditionId:     conditionId     ?? undefined,
    patternId:       patternId       ?? undefined,
    workTypeId:      workTypeId      ?? undefined,
    fabricTypeId:    fabricTypeId    ?? undefined,
    minPricePence,
    maxPricePence,
  }

  const { data, hasNextPage, fetchNextPage, isFetchingNextPage, isLoading, refetch, isFetching } = useFeedListings(filters)
  const isRefreshing = isFetching && !isLoading && !isFetchingNextPage

  const items = useMemo((): FeedItem[] => {
    const all = data?.pages.flat() ?? []
    const withLabels: FeedItem[] = all.map(l => ({
      ...l,
      fitLabel: fitsMeActive && userMeasurements ? getFitLabel(userMeasurements, l.measurements) : null,
    }))
    return fitsMeActive && userMeasurements ? applyFitsMe(withLabels) : withLabels
  }, [data, fitsMeActive, userMeasurements])

  const clearText = useCallback(() => { setTextQuery(''); setDebouncedText('') }, [])


  const handleCategoryPress = (id: number) => {
    setCategoryId(prev => prev === id ? null : id)
    setSubcategoryId(null)
  }

  const handleSubcategoryPress = (id: number) => {
    setSubcategoryId(prev => prev === id ? null : id)
  }

  const filtersHeader = (
    <View style={s.filtersWrap}>

      {/* Category */}
      <FilterLabel text="Category" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipRow}>
        {(config?.categories ?? []).map(c => (
          <Chip
            key={c.id}
            label={c.name ?? ''}
            selected={categoryId === c.id}
            onPress={() => handleCategoryPress(c.id)}
          />
        ))}
      </ScrollView>

      {/* Subcategory (only when category selected) */}
      {categoryId != null && visibleSubcategories.length > 0 && (
        <>
          <FilterLabel text="Type" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipRow}>
            {visibleSubcategories.map(s => (
              <Chip
                key={s.id}
                label={s.name ?? ''}
                selected={subcategoryId === s.id}
                onPress={() => handleSubcategoryPress(s.id)}
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
            selected={occasionId === o.id}
            onPress={() => setOccasionId(prev => prev === o.id ? null : o.id)}
          />
        ))}
      </ScrollView>

      {/* Colours */}
      <FilterLabel text="Colour" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.dotRow}>
        {(config?.colours ?? []).map(c => (
          <ColourDot
            key={c.id}
            hex={c.hex_code ?? '#ccc'}
            selected={colourId === c.id}
            onPress={() => setColourId(prev => prev === c.id ? null : c.id)}
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
            onBlur={() => setMinPricePence(minPriceText ? Math.round(parseFloat(minPriceText) * 100) : undefined)}
            keyboardType="decimal-pad"
            placeholder="£ min"
            placeholderTextColor={theme.textDisabled}
          />
          <Text style={[s.budgetDash, { color: theme.textDisabled }]}>—</Text>
          <TextInput
            style={[s.budgetInput, { borderColor: theme.border, backgroundColor: theme.inputBackground, color: theme.text }]}
            value={maxPriceText}
            onChangeText={setMaxPriceText}
            onBlur={() => setMaxPricePence(maxPriceText ? Math.round(parseFloat(maxPriceText) * 100) : undefined)}
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
                selected={conditionId === c.id}
                onPress={() => setConditionId(prev => prev === c.id ? null : c.id)}
              />
            ))}
          </ScrollView>

          <FilterLabel text="Pattern" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipRow}>
            {(config?.patterns ?? []).map(p => (
              <Chip
                key={p.id}
                label={p.display_name ?? ''}
                selected={patternId === p.id}
                onPress={() => setPatternId(prev => prev === p.id ? null : p.id)}
              />
            ))}
          </ScrollView>

          <FilterLabel text="Work type" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipRow}>
            {(config?.workTypes ?? []).map(w => (
              <Chip
                key={w.id}
                label={w.display_name ?? ''}
                selected={workTypeId === w.id}
                onPress={() => setWorkTypeId(prev => prev === w.id ? null : w.id)}
              />
            ))}
          </ScrollView>

          <FilterLabel text="Fabric" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipRow}>
            {(config?.fabricTypes ?? []).map(f => (
              <Chip
                key={f.id}
                label={f.display_name ?? ''}
                selected={fabricTypeId === f.id}
                onPress={() => setFabricTypeId(prev => prev === f.id ? null : f.id)}
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
      {/* Search bar — fixed above scroll */}
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

    filtersWrap: { paddingTop: 16 },
    chipRow:     { paddingHorizontal: 14, gap: 8, paddingBottom: 16 },
    dotRow:      { paddingHorizontal: 14, gap: 10, paddingBottom: 16 },

    utilRow:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 12, marginBottom: 16 },
    fitsMeWrap:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
    fitsMeLabel: { fontFamily: 'Inter_400Regular', fontSize: 13 },
    budgetWrap:  { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
    budgetInput: { flex: 1, borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 9, fontSize: 14, fontFamily: 'Inter_400Regular' },
    budgetDash:  { fontFamily: 'Inter_400Regular', fontSize: 14 },

    moreBtn:     { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 4 },
    moreBtnText: { fontFamily: 'Inter_500Medium', fontSize: 13 },

    resultsDivider: { height: 12 },
  })
}
