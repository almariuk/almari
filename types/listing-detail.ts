import type { ListingStatus } from './database'

export interface ListingDetailMeasurements {
  bustCm: number | null
  waistCm: number | null
  hipsCm: number | null
  heightCm: number | null
  ukShoeSize: number | null
  labelSize: string | null
}

export interface ListingDetailProvenance {
  cityName: string | null
  areaName: string | null
  country: string | null
  purchaseYear: number | null
  originalPriceInr: number | null
  isApproximate: boolean
  isHeirloom: boolean
  heirloomStory: string | null
}

export interface ListingDetail {
  id: string
  sellerId: string | null
  status: ListingStatus
  negotiationActive: boolean
  waitlistCount: number
  askingPricePence: number | null
  postagePricePence: number | null
  postageServiceName: string | null
  additionalNotes: string | null
  setContents: string | null
  setComplete: boolean | null

  photos: { url: string; displayOrder: number }[]

  subcategoryName: string
  occasionDisplayName: string | null

  conditionDisplayText: string
  colourHex: string | null
  colourName: string | null
  colourNameHindi: string | null

  patternDisplayName: string | null
  workTypeDisplayName: string | null
  fabricDisplayName: string | null
  careDisplayText: string | null
  careDetailText: string | null

  whySellingText: string | null

  sellerName: string
  sellerTrustScore: number
  listingTrustScore: number

  reservedUntil: string | null

  measurements: ListingDetailMeasurements | null
  provenance: ListingDetailProvenance | null
}
