import type { ListingStatus } from './database'

export type FitLabel = 'exact' | 'quick_pin' | 'quick_stitch' | null

export interface ListingCardMeasurements {
  bustCm: number | null
  waistCm: number | null
  hipsCm: number | null
  heightCm: number | null
  ukShoeSize: number | null
  labelSize: string | null
  ageFromYears: number | null
  ageToYears: number | null
}

export interface ListingCardData {
  id: string
  sellerId: string
  primaryPhotoUrl: string | null
  sellerName: string
  sellerTrustScore: number
  listingTrustScore: number
  subcategoryName: string
  occasionDisplayName: string | null
  conditionDisplayText: string
  colourHex: string | null
  colourName: string | null
  colourNameHindi: string | null
  askingPricePence: number | null
  whySellingText: string | null
  waitlistCount: number
  status: ListingStatus
  createdAt: string
  measurements: ListingCardMeasurements | null
}

// FeedItem extends ListingCardData with a computed fit label — the screen
// computes this and passes FeedItem[] to FeedList, which stays filter-agnostic.
export interface FeedItem extends ListingCardData {
  fitLabel: FitLabel
}

export type SortBy = 'newest' | 'price_asc' | 'price_desc'

export interface FeedFilters {
  categoryId?: number
  subcategoryId?: number
  subcategoryIds?: number[]
  occasionBucketId?: number
  colourId?: number
  conditionId?: number
  patternId?: number
  workTypeId?: number
  fabricTypeId?: number
  minPricePence?: number
  maxPricePence?: number
  searchText?: string
  sortBy?: SortBy
  labelSize?: string
}
