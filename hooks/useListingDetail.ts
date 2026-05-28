import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { ListingDetail } from '@/types/listing-detail'
import type { ListingStatus } from '@/types/database'

export function useListingDetail(id: string) {
  return useQuery<ListingDetail>({
    queryKey: ['listing_detail', id],
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('listings')
        .select(`
          id, status, negotiation_active, waitlist_count,
          asking_price_pence, postage_price_pence,
          additional_notes, set_contents, set_complete,
          listing_photos ( url, display_order ),
          subcategories ( name ),
          occasion_buckets ( display_name ),
          colour_swatches ( hex_code, name, name_hindi ),
          condition_tiers ( display_text ),
          patterns ( display_name ),
          work_types ( display_name ),
          fabric_types ( display_name ),
          item_care_status ( display_text, detail_text ),
          why_selling_copy:micro_copy!why_selling_copy_id ( display_text ),
          seller_id,
          seller:user_identity!seller_id (
            id, first_name, last_name_initial,
            user_profile ( trust_score_cached )
          ),
          listing_measurements ( bust_cm, waist_cm, hips_cm, height_cm, uk_shoe_size, label_size ),
          listing_trust_scores ( total_score ),
          postage_services ( name ),
          provenance (
            purchase_year, original_price_inr, original_price_approximate,
            is_heirloom, heirloom_story,
            provenance_cities ( name, country ),
            provenance_areas ( name )
          )
        `)
        .eq('id', id)
        .single()

      if (error) throw error

      const row = data as any
      const photos: any[] = Array.isArray(row.listing_photos) ? row.listing_photos : []
      const seller = row.seller
      const sellerProfile = Array.isArray(seller?.user_profile)
        ? seller.user_profile[0]
        : seller?.user_profile
      const tsRaw = row.listing_trust_scores
      const tsRow = Array.isArray(tsRaw) ? tsRaw[0] : tsRaw
      const mRaw = row.listing_measurements
      const mRow = Array.isArray(mRaw) ? mRaw[0] : mRaw
      const pRaw = row.provenance
      const pRow = Array.isArray(pRaw) ? pRaw[0] : pRaw

      return {
        id: row.id,
        sellerId: row.seller_id ?? null,
        status: row.status as ListingStatus,
        negotiationActive: row.negotiation_active ?? false,
        waitlistCount: row.waitlist_count ?? 0,
        askingPricePence: row.asking_price_pence,
        postagePricePence: row.postage_price_pence,
        postageServiceName: row.postage_services?.name ?? null,
        additionalNotes: row.additional_notes ?? null,
        setContents: row.set_contents ?? null,
        setComplete: row.set_complete ?? null,
        photos: photos
          .sort((a, b) => a.display_order - b.display_order)
          .map(p => ({ url: p.url, displayOrder: p.display_order })),
        subcategoryName: row.subcategories?.name ?? '',
        occasionDisplayName: row.occasion_buckets?.display_name ?? null,
        conditionDisplayText: row.condition_tiers?.display_text ?? '',
        colourHex: row.colour_swatches?.hex_code ?? null,
        colourName: row.colour_swatches?.name ?? null,
        colourNameHindi: row.colour_swatches?.name_hindi ?? null,
        patternDisplayName: row.patterns?.display_name ?? null,
        workTypeDisplayName: row.work_types?.display_name ?? null,
        fabricDisplayName: row.fabric_types?.display_name ?? null,
        careDisplayText: row.item_care_status?.display_text ?? null,
        careDetailText: row.item_care_status?.detail_text ?? null,
        whySellingText: row.why_selling_copy?.display_text ?? null,
        sellerName: seller
          ? `${seller.first_name} ${seller.last_name_initial}.`
          : 'Seller',
        sellerTrustScore: sellerProfile?.trust_score_cached ?? 0,
        listingTrustScore: tsRow?.total_score ?? 0,
        measurements: mRow
          ? {
              bustCm: mRow.bust_cm ?? null,
              waistCm: mRow.waist_cm ?? null,
              hipsCm: mRow.hips_cm ?? null,
              heightCm: mRow.height_cm ?? null,
              ukShoeSize: mRow.uk_shoe_size ?? null,
              labelSize: mRow.label_size ?? null,
            }
          : null,
        provenance: pRow
          ? {
              cityName: pRow.provenance_cities?.name ?? null,
              areaName: pRow.provenance_areas?.name ?? null,
              country: pRow.provenance_cities?.country ?? null,
              purchaseYear: pRow.purchase_year ?? null,
              originalPriceInr: pRow.original_price_inr ?? null,
              isApproximate: pRow.original_price_approximate ?? false,
              isHeirloom: pRow.is_heirloom ?? false,
              heirloomStory: pRow.heirloom_story ?? null,
            }
          : null,
      }
    },
  })
}
