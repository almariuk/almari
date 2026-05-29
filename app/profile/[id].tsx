import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { IconCandleFilled, IconArrowLeft } from '@tabler/icons-react-native'
import { supabase } from '@/lib/supabase'
import { useTheme } from '@/hooks/useTheme'
import { useTrustTiers, getDiyaColour } from '@/hooks/useTrustTiers'
import ListingCard from '@/components/listings/ListingCard'
import { CARD_WIDTH } from '@/components/listings/FeedList'
import type { FeedItem, ListingCardData } from '@/types/feed'
import type { ListingStatus } from '@/types/database'

// S27 — Seller public profile

interface SellerProfileData {
  id: string
  firstName: string
  lastNameInitial: string
  memberSince: string
  trustScore: number
  completedSalesCount: number
  activeListings: ListingCardData[]
}

function useSellerProfileData(sellerId: string) {
  return useQuery<SellerProfileData>({
    queryKey: ['seller_public_profile', sellerId],
    enabled: !!sellerId,
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      const [sellerResult, listingsResult, salesResult] = await Promise.all([
        supabase
          .from('user_identity')
          .select('id, first_name, last_name_initial, created_at, user_profile ( trust_score_cached )')
          .eq('id', sellerId)
          .single(),
        supabase
          .from('listings')
          .select(`
            id, asking_price_pence, waitlist_count, status, created_at,
            listing_photos ( url, display_order ),
            subcategories ( name ),
            occasion_buckets ( display_name ),
            colour_swatches ( hex_code, name, name_hindi ),
            condition_tiers ( display_text ),
            why_selling_copy:micro_copy!why_selling_copy_id ( display_text ),
            listing_measurements ( bust_cm, waist_cm, hips_cm, height_cm, uk_shoe_size ),
            listing_trust_scores ( total_score )
          `)
          .eq('seller_id', sellerId)
          .eq('status', 'active')
          .order('created_at', { ascending: false }),
        supabase
          .from('transactions')
          .select('id', { count: 'exact', head: true })
          .eq('seller_id', sellerId)
          .eq('status', 'completed'),
      ])

      if (sellerResult.error) throw sellerResult.error

      const sellerRow = sellerResult.data as any
      const sellerProfile = Array.isArray(sellerRow.user_profile)
        ? sellerRow.user_profile[0]
        : sellerRow.user_profile

      const sellerName = `${sellerRow.first_name} ${sellerRow.last_name_initial}.`
      const sellerTrustScore = sellerProfile?.trust_score_cached ?? 0

      const activeListings: ListingCardData[] = (listingsResult.data ?? []).map((row: any): ListingCardData => {
        const photos: any[] = Array.isArray(row.listing_photos) ? row.listing_photos : []
        const primaryPhoto = photos.sort((a, b) => a.display_order - b.display_order)[0]
        const tsRaw = row.listing_trust_scores
        const tsRow = Array.isArray(tsRaw) ? tsRaw[0] : tsRaw
        const mRaw = row.listing_measurements
        const mRow = Array.isArray(mRaw) ? mRaw[0] : mRaw

        return {
          id: row.id,
          sellerId,
          primaryPhotoUrl: primaryPhoto?.url ?? null,
          sellerName,
          sellerTrustScore,
          listingTrustScore: tsRow?.total_score ?? 0,
          subcategoryName: row.subcategories?.name ?? '',
          occasionDisplayName: row.occasion_buckets?.display_name ?? null,
          conditionDisplayText: row.condition_tiers?.display_text ?? '',
          colourHex: row.colour_swatches?.hex_code ?? null,
          colourName: row.colour_swatches?.name ?? null,
          colourNameHindi: row.colour_swatches?.name_hindi ?? null,
          askingPricePence: row.asking_price_pence,
          whySellingText: row.why_selling_copy?.display_text ?? null,
          waitlistCount: row.waitlist_count ?? 0,
          status: row.status as ListingStatus,
          createdAt: row.created_at,
          measurements: mRow
            ? {
                bustCm: mRow.bust_cm ?? null,
                waistCm: mRow.waist_cm ?? null,
                hipsCm: mRow.hips_cm ?? null,
                heightCm: mRow.height_cm ?? null,
                ukShoeSize: mRow.uk_shoe_size ?? null,
                labelSize: mRow.label_size ?? null,
                ageFromYears: mRow.age_from_years ?? null,
                ageToYears: mRow.age_to_years ?? null,
              }
            : null,
        }
      })

      return {
        id: sellerRow.id,
        firstName: sellerRow.first_name,
        lastNameInitial: sellerRow.last_name_initial,
        memberSince: sellerRow.created_at,
        trustScore: sellerTrustScore,
        completedSalesCount: salesResult.count ?? 0,
        activeListings,
      }
    },
  })
}

export default function SellerPublicProfile() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const theme = useTheme()
  const router = useRouter()
  const { data: tiers = [] } = useTrustTiers()
  const { data, isLoading, error } = useSellerProfileData(id ?? '')
  const s = makeStyles(theme)

  const diyaColour = getDiyaColour(data?.trustScore ?? 0, tiers)
  const feedItems: FeedItem[] = (data?.activeListings ?? []).map(l => ({ ...l, fitLabel: null }))

  if (isLoading) {
    return (
      <SafeAreaView style={[s.root, { backgroundColor: theme.background }]} edges={['top']}>
        <View style={[s.nav, { borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <IconArrowLeft size={22} color={theme.text} />
          </TouchableOpacity>
        </View>
        <ActivityIndicator style={s.loader} color={theme.accent} size="large" />
      </SafeAreaView>
    )
  }

  if (error || !data) {
    return (
      <SafeAreaView style={[s.root, { backgroundColor: theme.background }]} edges={['top']}>
        <View style={[s.nav, { borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <IconArrowLeft size={22} color={theme.text} />
          </TouchableOpacity>
        </View>
        <Text style={[s.errorText, { color: theme.textSecondary, fontFamily: 'Inter_400Regular' }]}>
          This seller profile could not be loaded.
        </Text>
      </SafeAreaView>
    )
  }

  const memberSinceLabel = new Date(data.memberSince).toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
  })

  const header = (
    <View style={s.profileHeader}>
      <View style={s.sellerRow}>
        <IconCandleFilled size={22} color={diyaColour} />
        <Text style={[s.name, { color: theme.text, fontFamily: 'CormorantGaramond_700Bold' }]}>
          {'  '}{data.firstName} {data.lastNameInitial}.
        </Text>
      </View>
      <Text style={[s.memberSince, { color: theme.textSecondary, fontFamily: 'Inter_400Regular' }]}>
        Member since {memberSinceLabel}
      </Text>
      <View style={s.statsRow}>
        <Text style={[s.statText, { color: theme.text, fontFamily: 'Inter_500Medium' }]}>
          {data.completedSalesCount} {data.completedSalesCount === 1 ? 'sale' : 'sales'} completed
        </Text>
        <View style={[s.statDot, { backgroundColor: theme.textDisabled }]} />
        <Text style={[s.statText, { color: theme.text, fontFamily: 'Inter_500Medium' }]}>
          {data.activeListings.length} active {data.activeListings.length === 1 ? 'listing' : 'listings'}
        </Text>
      </View>
      {data.activeListings.length > 0 && (
        <View style={[s.sectionDivider, { backgroundColor: theme.border }]} />
      )}
    </View>
  )

  return (
    <SafeAreaView style={[s.root, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={[s.nav, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <IconArrowLeft size={22} color={theme.text} />
        </TouchableOpacity>
      </View>
      <FlatList
        data={feedItems}
        keyExtractor={item => item.id}
        numColumns={2}
        columnWrapperStyle={s.row}
        contentContainerStyle={s.listContent}
        ListHeaderComponent={header}
        renderItem={({ item }) => (
          <ListingCard
            data={item}
            cardWidth={CARD_WIDTH}
            onPress={() => router.push(`/listing/${item.id}` as any)}
          />
        )}
        ListEmptyComponent={
          <Text style={[s.emptyText, { color: theme.textSecondary, fontFamily: 'CormorantGaramond_400Regular_Italic' }]}>
            No active listings at the moment.
          </Text>
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  )
}

function makeStyles(theme: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    root:      { flex: 1 },
    loader:    { flex: 1 },
    errorText: { textAlign: 'center', marginTop: 80, fontSize: 15, paddingHorizontal: 24 },

    nav: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
    },

    profileHeader: {
      paddingHorizontal: 16,
      paddingTop: 24,
      paddingBottom: 8,
    },
    sellerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 6,
    },
    name: {
      fontSize: 28,
      lineHeight: 34,
    },
    memberSince: {
      fontSize: 13,
      marginBottom: 12,
    },
    statsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 20,
    },
    statText: { fontSize: 13 },
    statDot:  { width: 3, height: 3, borderRadius: 1.5 },
    sectionDivider: { height: StyleSheet.hairlineWidth, marginBottom: 12 },

    listContent: { paddingHorizontal: 12, paddingBottom: 32 },
    row:         { gap: 10, marginBottom: 10 },
    emptyText:   { textAlign: 'center', fontSize: 16, lineHeight: 24, paddingHorizontal: 24, paddingTop: 20 },
  })
}
