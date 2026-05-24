import { useInfiniteQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { FeedFilters, ListingCardData } from '@/types/feed'
import type { ListingStatus } from '@/types/database'

const PAGE_SIZE = 20

export function useFeedListings(filters: FeedFilters = {}) {
  return useInfiniteQuery<ListingCardData[]>({
    queryKey: ['feed_listings', filters],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const offset = pageParam as number

      // Nested embed: listings → user_identity (via seller_id FK)
      //                        → user_profile (via user_profile.user_id FK)
      // PostgREST supports this two-hop traversal. user_profile returns as an
      // array even though it's 1-1 (UNIQUE constraint); we access [0].
      let query = supabase
        .from('listings')
        .select(`
          id,
          asking_price_pence,
          waitlist_count,
          status,
          created_at,
          listing_photos ( url, display_order ),
          subcategories ( name ),
          occasion_buckets ( display_name ),
          colour_swatches ( hex_code, name, name_hindi ),
          condition_tiers ( display_text ),
          why_selling_copy:micro_copy!why_selling_copy_id ( display_text ),
          seller:user_identity!seller_id (
            first_name,
            last_name_initial,
            user_profile ( trust_score_cached )
          ),
          listing_measurements ( bust_cm, waist_cm, hips_cm, height_cm, uk_shoe_size ),
          listing_trust_scores ( total_score )
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1)

      if (filters.categoryId != null) query = query.eq('category_id', filters.categoryId)
      if (filters.subcategoryId != null) query = query.eq('subcategory_id', filters.subcategoryId)
      if (filters.occasionBucketId != null) query = query.eq('occasion_bucket_id', filters.occasionBucketId)
      if (filters.colourId != null) query = query.eq('colour_id', filters.colourId)
      if (filters.conditionId != null) query = query.eq('condition_id', filters.conditionId)
      if (filters.patternId != null) query = query.eq('pattern_id', filters.patternId)
      if (filters.workTypeId != null) query = query.eq('work_type_id', filters.workTypeId)
      if (filters.fabricTypeId != null) query = query.eq('fabric_type_id', filters.fabricTypeId)
      if (filters.minPricePence != null) query = query.gte('asking_price_pence', filters.minPricePence)
      if (filters.maxPricePence != null) query = query.lte('asking_price_pence', filters.maxPricePence)

      const { data, error } = await query
      if (error) throw error

      return (data ?? []).map((row: any): ListingCardData => {
        const photos: any[] = Array.isArray(row.listing_photos) ? row.listing_photos : []
        const primaryPhoto = photos.sort((a, b) => a.display_order - b.display_order)[0]

        const seller = row.seller
        const sellerProfile: any[] = Array.isArray(seller?.user_profile) ? seller.user_profile : []

        const trustScores: any[] = Array.isArray(row.listing_trust_scores) ? row.listing_trust_scores : []

        // listing_measurements has UNIQUE on listing_id; PostgREST may return array or object
        const mRaw = row.listing_measurements
        const mRow = Array.isArray(mRaw) ? mRaw[0] : mRaw

        return {
          id: row.id,
          primaryPhotoUrl: primaryPhoto?.url ?? null,
          sellerName: seller
            ? `${seller.first_name} ${seller.last_name_initial}.`
            : 'Seller',
          sellerTrustScore: sellerProfile[0]?.trust_score_cached ?? 0,
          listingTrustScore: trustScores[0]?.total_score ?? 0,
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
              }
            : null,
        }
      })
    },
    getNextPageParam: (lastPage, _allPages, lastPageParam) =>
      lastPage.length < PAGE_SIZE ? undefined : (lastPageParam as number) + PAGE_SIZE,
  })
}
