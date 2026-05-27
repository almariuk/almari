import { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { IconCandleFilled } from '@tabler/icons-react-native'
import { useTheme } from '@/hooks/useTheme'
import { useAuthStore } from '@/store/auth'
import { useListingDetail } from '@/hooks/useListingDetail'
import { useTrustTiers, getDiyaColour, getMaxTrustScore } from '@/hooks/useTrustTiers'
import { getFitLabel } from '@/utils/fit'
import { PhotoCarousel } from '@/components/listings/PhotoCarousel'
import FireworkTrust from '@/components/brand/FireworkTrust'
import type { Theme } from '@/constants/theme'
import type { FitLabel } from '@/types/feed'
import type { ListingDetailMeasurements } from '@/types/listing-detail'

// S6 — Listing detail (photos, story, price context, offer slider)

const FIT_LABELS: Record<NonNullable<FitLabel>, string> = {
  exact: 'Exact fit',
  quick_pin: 'Quick pin',
  quick_stitch: 'Quick stitch',
}

const FIT_COLOURS = (theme: Theme): Record<NonNullable<FitLabel>, string> => ({
  exact: theme.gold,
  quick_pin: theme.textDisabled,
  quick_stitch: theme.textDisabled,
})

function SectionLabel({ text }: { text: string }) {
  const theme = useTheme()
  return (
    <Text style={[s.sectionLabel, { color: theme.textDisabled, fontFamily: 'Inter_500Medium' }]}>
      {text.toUpperCase()}
    </Text>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  const theme = useTheme()
  return (
    <View style={s.detailRow}>
      <Text style={[s.detailLabel, { color: theme.textSecondary, fontFamily: 'Inter_400Regular' }]}>
        {label}
      </Text>
      <Text style={[s.detailValue, { color: theme.text, fontFamily: 'Inter_400Regular' }]}>
        {value}
      </Text>
    </View>
  )
}

function Divider() {
  const theme = useTheme()
  return <View style={[s.divider, { backgroundColor: theme.border }]} />
}

function FitBadge({ label, theme }: { label: NonNullable<FitLabel>; theme: Theme }) {
  const colour = FIT_COLOURS(theme)[label]
  return (
    <View style={[s.fitBadge, { borderColor: colour }]}>
      <Text style={[s.fitBadgeText, { color: colour, fontFamily: 'Inter_500Medium' }]}>
        {FIT_LABELS[label]}
      </Text>
    </View>
  )
}

function formatMeasurement(cm: number | null): string {
  if (cm === null) return '—'
  return `${cm} cm`
}

function formatInr(amount: number, approximate: boolean): string {
  const formatted = amount.toLocaleString('en-IN')
  return `${approximate ? '~' : ''}₹${formatted}`
}

function formatGbp(pence: number): string {
  return `£${(pence / 100).toFixed(2)}`
}

export default function ListingDetail() {
  const theme = useTheme()
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const { profile, identity } = useAuthStore()
  const { data: listing, isLoading, error } = useListingDetail(id ?? '')
  const { data: tiers = [] } = useTrustTiers()

  if (isLoading) {
    return (
      <SafeAreaView style={[s.root, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
        <ActivityIndicator style={s.loader} color={theme.accent} size="large" />
      </SafeAreaView>
    )
  }

  if (error || !listing) {
    return (
      <SafeAreaView style={[s.root, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
        <Text style={[s.errorText, { color: theme.textSecondary, fontFamily: 'Inter_400Regular' }]}>
          This listing could not be loaded.
        </Text>
      </SafeAreaView>
    )
  }

  const diyaColour = getDiyaColour(listing.sellerTrustScore, tiers)
  const maxTrustScore = getMaxTrustScore(tiers)

  // Fit label vs buyer's own measurements
  const userMeasurements =
    profile?.bust_cm || profile?.waist_cm || profile?.hips_cm
      ? { bustCm: profile.bust_cm ?? null, waistCm: profile.waist_cm ?? null, hipsCm: profile.hips_cm ?? null }
      : null

  const fitLabel = userMeasurements
    ? getFitLabel(userMeasurements, listing.measurements as ListingDetailMeasurements | null)
    : null

  // Price breakdown
  const itemPrice = listing.askingPricePence ?? 0
  const postagePrice = listing.postagePricePence ?? 0
  const totalPrice = itemPrice + postagePrice

  // Has details section
  const hasDetails =
    listing.patternDisplayName ||
    listing.workTypeDisplayName ||
    listing.fabricDisplayName ||
    listing.careDisplayText

  // Provenance display
  const prov = listing.provenance
  const provLocation = prov
    ? [prov.areaName, prov.cityName, prov.country !== 'India' ? prov.country : null]
        .filter(Boolean)
        .join(', ')
    : null

  // Waitlist state
  const isWaitlisted = listing.negotiationActive || listing.waitlistCount > 0

  const isAvailable = listing.status === 'active'
  const isSeller = !!identity?.id && identity.id === listing.sellerId

  const handleBuyNow = () => {
    router.push(`/transaction/new/confirm?listingId=${listing.id}` as any)
  }

  const handleJoinWaitlist = () => {
    Alert.alert('Join waitlist', 'Waitlist joining is coming soon.', [{ text: 'OK' }])
  }

  return (
    <SafeAreaView style={[s.root, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Photos */}
        <PhotoCarousel urls={listing.photos.map(p => p.url)} />

        {/* Body */}
        <View style={s.body}>
          {/* Title */}
          <Text
            style={[s.subcategory, { color: theme.text, fontFamily: 'CormorantGaramond_700Bold' }]}
          >
            {listing.subcategoryName}
          </Text>
          {listing.occasionDisplayName && (
            <Text
              style={[s.occasion, { color: theme.textSecondary, fontFamily: 'Inter_400Regular' }]}
            >
              {listing.occasionDisplayName}
            </Text>
          )}

          {/* Condition + colour */}
          <View style={s.conditionRow}>
            {listing.colourHex && (
              <View style={[s.colourDot, { backgroundColor: listing.colourHex, borderColor: theme.border }]} />
            )}
            <Text style={[s.condition, { color: theme.textSecondary, fontFamily: 'Inter_400Regular' }]}>
              {listing.conditionDisplayText}
              {listing.colourName ? `  ·  ${listing.colourName}` : ''}
            </Text>
          </View>

          <Divider />

          {/* Seller row */}
          <TouchableOpacity
            style={s.sellerRow}
            onPress={() => listing.sellerId && router.push(`/profile/${listing.sellerId}` as any)}
            activeOpacity={0.7}
          >
            <IconCandleFilled size={16} color={diyaColour} />
            <Text style={[s.sellerName, { color: theme.text, fontFamily: 'Inter_500Medium' }]}>
              {'  '}{listing.sellerName}
            </Text>
            <FireworkTrust score={listing.listingTrustScore} maxScore={maxTrustScore} size={84} />
          </TouchableOpacity>

          {/* Why selling */}
          {listing.whySellingText && (
            <Text
              style={[s.whySelling, { color: theme.textSecondary, fontFamily: 'CormorantGaramond_400Regular_Italic' }]}
            >
              {`"${listing.whySellingText}"`}
            </Text>
          )}

          {/* Details section */}
          {hasDetails && (
            <>
              <Divider />
              <SectionLabel text="Details" />
              {listing.patternDisplayName && (
                <DetailRow label="Pattern" value={listing.patternDisplayName} />
              )}
              {listing.workTypeDisplayName && (
                <DetailRow label="Work type" value={listing.workTypeDisplayName} />
              )}
              {listing.fabricDisplayName && (
                <DetailRow label="Fabric" value={listing.fabricDisplayName} />
              )}
              {listing.careDisplayText && (
                <DetailRow label="Care" value={listing.careDisplayText} />
              )}
            </>
          )}

          {/* Measurements */}
          {listing.measurements && (
            <>
              <Divider />
              <SectionLabel text="Measurements" />
              {listing.measurements.bustCm !== null && (
                <DetailRow label="Bust" value={formatMeasurement(listing.measurements.bustCm)} />
              )}
              {listing.measurements.waistCm !== null && (
                <DetailRow label="Waist" value={formatMeasurement(listing.measurements.waistCm)} />
              )}
              {listing.measurements.hipsCm !== null && (
                <DetailRow label="Hips" value={formatMeasurement(listing.measurements.hipsCm)} />
              )}
              {listing.measurements.heightCm !== null && (
                <DetailRow label="Height" value={formatMeasurement(listing.measurements.heightCm)} />
              )}
              {listing.measurements.ukShoeSize !== null && (
                <DetailRow label="UK shoe size" value={String(listing.measurements.ukShoeSize)} />
              )}
              {listing.measurements.labelSize && (
                <DetailRow label="Label size" value={listing.measurements.labelSize} />
              )}
              {fitLabel && <FitBadge label={fitLabel} theme={theme} />}
            </>
          )}

          {/* Provenance */}
          {prov && (
            <>
              <Divider />
              <SectionLabel text="Provenance" />
              {provLocation && (
                <DetailRow label="From" value={provLocation} />
              )}
              {prov.purchaseYear && (
                <DetailRow label="Purchased" value={String(prov.purchaseYear)} />
              )}
              {prov.originalPriceInr && (
                <DetailRow
                  label="Original price"
                  value={formatInr(prov.originalPriceInr, prov.isApproximate)}
                />
              )}
              {prov.isHeirloom && (
                <Text style={[s.heirloom, { color: theme.gold, fontFamily: 'CormorantGaramond_400Regular_Italic' }]}>
                  This is a family heirloom.
                </Text>
              )}
              {prov.heirloomStory && (
                <Text style={[s.heirloomStory, { color: theme.textSecondary, fontFamily: 'CormorantGaramond_400Regular_Italic' }]}>
                  {prov.heirloomStory}
                </Text>
              )}
            </>
          )}

          {/* Set info */}
          {listing.setContents && (
            <>
              <Divider />
              <SectionLabel text="Set contents" />
              <Text style={[s.setContents, { color: theme.text, fontFamily: 'Inter_400Regular' }]}>
                {listing.setContents}
              </Text>
              {listing.setComplete === false && (
                <Text style={[s.setIncomplete, { color: theme.textSecondary, fontFamily: 'Inter_400Regular' }]}>
                  Incomplete set — some pieces missing.
                </Text>
              )}
            </>
          )}

          {/* Seller notes */}
          {listing.additionalNotes && (
            <>
              <Divider />
              <SectionLabel text="Seller's note" />
              <Text style={[s.notes, { color: theme.textSecondary, fontFamily: 'Inter_400Regular' }]}>
                {listing.additionalNotes}
              </Text>
            </>
          )}

          {/* Waitlist count */}
          {listing.waitlistCount > 0 && (
            <View style={[s.waitlistBanner, { backgroundColor: theme.accentSubtle }]}>
              <Text style={[s.waitlistText, { color: theme.accent, fontFamily: 'Inter_500Medium' }]}>
                {listing.waitlistCount} {listing.waitlistCount === 1 ? 'person' : 'people'} waiting for this piece
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom price + action bar */}
      <View style={[s.bottomBar, { borderTopColor: theme.border, backgroundColor: theme.background }]}>
        {isSeller ? (
          <TouchableOpacity
            style={[s.buyBtn, s.editBtn, { backgroundColor: theme.accent }]}
            onPress={() => router.push(`/list/edit/${listing.id}` as any)}
            activeOpacity={0.85}
          >
            <Text style={[s.buyBtnText, { color: theme.accentText, fontFamily: 'Inter_600SemiBold' }]}>
              Edit listing
            </Text>
          </TouchableOpacity>
        ) : !isAvailable ? (
          <Text style={[s.unavailableText, { color: theme.textSecondary, fontFamily: 'CormorantGaramond_400Regular_Italic' }]}>
            This piece is no longer available.
          </Text>
        ) : (
          <>
            <View style={s.priceBlock}>
              <View style={s.priceRow}>
                <Text style={[s.priceItem, { color: theme.text, fontFamily: 'Inter_600SemiBold' }]}>
                  {formatGbp(itemPrice)}
                </Text>
                {postagePrice > 0 && (
                  <Text style={[s.postageText, { color: theme.textSecondary, fontFamily: 'Inter_400Regular' }]}>
                    {'  +  '}{formatGbp(postagePrice)} postage
                  </Text>
                )}
              </View>
              <Text style={[s.totalText, { color: theme.textDisabled, fontFamily: 'Inter_400Regular' }]}>
                Total {formatGbp(totalPrice)}
              </Text>
            </View>

            <TouchableOpacity
              style={[
                s.buyBtn,
                { backgroundColor: isWaitlisted ? theme.surface : theme.accent },
              ]}
              onPress={isWaitlisted ? handleJoinWaitlist : handleBuyNow}
              activeOpacity={0.85}
            >
              <Text
                style={[
                  s.buyBtnText,
                  {
                    color: isWaitlisted ? theme.accent : theme.accentText,
                    fontFamily: 'Inter_600SemiBold',
                  },
                ]}
              >
                {isWaitlisted ? 'Join waitlist' : 'Buy now'}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  root: { flex: 1 },
  loader: { flex: 1 },
  errorText: { flex: 1, textAlign: 'center', marginTop: 80, fontSize: 15 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 16 },

  body: { paddingHorizontal: 20, paddingTop: 18, gap: 0 },

  subcategory: { fontSize: 28, lineHeight: 34, marginBottom: 4 },
  occasion: { fontSize: 13, marginBottom: 12 },

  conditionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  colourDot: { width: 12, height: 12, borderRadius: 6, borderWidth: StyleSheet.hairlineWidth },
  condition: { fontSize: 13 },

  divider: { height: StyleSheet.hairlineWidth, marginVertical: 16 },
  sectionLabel: { fontSize: 10, letterSpacing: 1, marginBottom: 10 },

  sellerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  sellerName: { fontSize: 14, flex: 1 },

  whySelling: {
    fontSize: 15,
    lineHeight: 22,
    marginTop: 4,
  },

  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  detailLabel: { fontSize: 13 },
  detailValue: { fontSize: 13 },

  fitBadge: {
    alignSelf: 'flex-start',
    borderRadius: 4,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 8,
  },
  fitBadgeText: { fontSize: 11 },

  heirloom: { fontSize: 14, marginTop: 4 },
  heirloomStory: { fontSize: 14, lineHeight: 22, marginTop: 6 },

  setContents: { fontSize: 13, lineHeight: 20 },
  setIncomplete: { fontSize: 12, marginTop: 4 },

  notes: { fontSize: 13, lineHeight: 20 },

  waitlistBanner: {
    marginTop: 20,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  waitlistText: { fontSize: 13 },

  // Bottom bar
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 16,
  },
  priceBlock: { flex: 1 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline' },
  priceItem: { fontSize: 22 },
  postageText: { fontSize: 13 },
  totalText: { fontSize: 11, marginTop: 2 },
  buyBtn: {
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 13,
  },
  editBtn: {
    flex: 1,
    alignItems: 'center',
  },
  buyBtnText: { fontSize: 15 },
  unavailableText: { flex: 1, textAlign: 'center', fontSize: 16 },
})
