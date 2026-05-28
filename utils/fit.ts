import type { FeedItem, FitLabel, ListingCardMeasurements } from '@/types/feed'

// PRD thresholds (inches converted to cm)
const EXACT_CM = 2.54       // 1 inch
const QUICK_PIN_CM = 5.08   // 2 inches
const QUICK_STITCH_CM = 10.16 // 4 inches

interface UserMeasurements {
  bustCm: number | null
  waistCm: number | null
  hipsCm: number | null
}

export function getFitLabel(
  user: UserMeasurements,
  listing: ListingCardMeasurements | null,
): FitLabel {
  if (!listing) return null

  const diffs: number[] = []

  if (user.bustCm !== null && listing.bustCm !== null) {
    diffs.push(Math.abs(user.bustCm - listing.bustCm))
  }
  if (user.waistCm !== null && listing.waistCm !== null) {
    diffs.push(Math.abs(user.waistCm - listing.waistCm))
  }
  if (user.hipsCm !== null && listing.hipsCm !== null) {
    diffs.push(Math.abs(user.hipsCm - listing.hipsCm))
  }

  if (diffs.length === 0) return null

  const maxDiff = Math.max(...diffs)

  if (maxDiff <= EXACT_CM) return 'exact'
  if (maxDiff <= QUICK_PIN_CM) return 'quick_pin'
  if (maxDiff <= QUICK_STITCH_CM) return 'quick_stitch'
  return null
}

// Reorders items into PRD tier order: exact → quick_pin → quick_stitch → rest.
// Items within each tier keep their original relative order (newest first from the query).
// null-labelled items are never hidden — they appear below the fit tiers.
export function applyFitsMe(items: FeedItem[]): FeedItem[] {
  const exact: FeedItem[] = []
  const quickPin: FeedItem[] = []
  const quickStitch: FeedItem[] = []
  const rest: FeedItem[] = []

  for (const item of items) {
    if (item.fitLabel === 'exact') exact.push(item)
    else if (item.fitLabel === 'quick_pin') quickPin.push(item)
    else if (item.fitLabel === 'quick_stitch') quickStitch.push(item)
    else rest.push(item)
  }

  return [...exact, ...quickPin, ...quickStitch, ...rest]
}
