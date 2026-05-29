import { memo } from 'react'
import { View, Text, StyleSheet, Pressable } from 'react-native'
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated'
import { Image } from 'expo-image'
import { IconCandleFilled } from '@tabler/icons-react-native'
import { useTheme } from '@/hooks/useTheme'
import { useTrustTiers, getDiyaColour } from '@/hooks/useTrustTiers'
import FireworkTrust from '@/components/brand/FireworkTrust'
import type { FeedItem, FitLabel } from '@/types/feed'
import type { Theme } from '@/constants/theme'

interface Props {
  data: FeedItem
  cardWidth: number
  onPress: () => void
}

// PRD-exact labels — do not change wording
const FIT_LABELS: Record<NonNullable<FitLabel>, string> = {
  exact: 'Exact fit',
  quick_pin: 'Quick pin',
  quick_stitch: 'Quick stitch',
}

function FitBadge({ label, theme }: { label: NonNullable<FitLabel>; theme: Theme }) {
  const isExact = label === 'exact'
  const colour = isExact ? theme.gold : theme.textDisabled
  return (
    <View style={[s.fitBadge, { borderColor: colour }]}>
      <Text style={[s.fitBadgeText, { color: colour, fontFamily: 'Inter_500Medium' }]}>
        {FIT_LABELS[label]}
      </Text>
    </View>
  )
}

function ListingCard({ data, cardWidth, onPress }: Props) {
  const theme = useTheme()
  const { data: tiers = [] } = useTrustTiers()
  const diyaColour = getDiyaColour(data.sellerTrustScore, tiers)

  const scale = useSharedValue(1)
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))
  const photoHeight = Math.round(cardWidth * 1.28)

  const price =
    data.askingPricePence != null
      ? `£${Math.round(data.askingPricePence / 100)}`
      : '—'

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => { scale.value = withSpring(0.97, { damping: 20, stiffness: 400 }) }}
      onPressOut={() => { scale.value = withSpring(1.0, { damping: 20, stiffness: 400 }) }}
    >
      <Animated.View style={[s.card, { width: cardWidth, backgroundColor: theme.surfaceRaised }, animStyle]}>
      {/* Photo */}
      <View>
        <Image
          source={data.primaryPhotoUrl ? { uri: data.primaryPhotoUrl } : null}
          style={[s.photo, { width: cardWidth, height: photoHeight, backgroundColor: theme.surface }]}
          contentFit="cover"
          transition={250}
        />
        {data.waitlistCount > 0 && (
          <View style={[s.waitlistPill, { backgroundColor: theme.accent }]}>
            <Text style={[s.waitlistText, { fontFamily: 'Inter_500Medium' }]}>
              {data.waitlistCount} waiting
            </Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View style={[s.content, { backgroundColor: theme.surfaceRaised }]}>
        {/* Top row: category + colour · price */}
        <View style={s.topRow}>
          <Text
            style={[s.subcategory, { color: theme.text, fontFamily: 'CormorantGaramond_700Bold' }]}
            numberOfLines={1}
          >
            {data.subcategoryName}
          </Text>
          <View style={s.priceInline}>
            {data.colourHex != null && (
              <View style={[s.colourDot, { backgroundColor: data.colourHex, borderColor: theme.border }]} />
            )}
            <Text style={[s.price, { color: theme.text, fontFamily: 'Inter_600SemiBold' }]}>
              {price}
            </Text>
          </View>
        </View>

        {/* Occasion */}
        {data.occasionDisplayName != null && (
          <Text
            style={[s.occasion, { color: theme.textSecondary, fontFamily: 'Inter_400Regular' }]}
            numberOfLines={1}
          >
            {data.occasionDisplayName}
          </Text>
        )}

        {/* Size / age — always rendered so all cards have equal height */}
        <Text
          style={[s.sizeLine, { color: theme.text, fontFamily: 'Inter_600SemiBold' }]}
          numberOfLines={1}
        >
          {data.measurements?.ageFromYears != null
            ? `${data.measurements.ageFromYears}–${data.measurements.ageToYears} yrs`
            : data.measurements?.labelSize
            ? `Size ${data.measurements.labelSize}`
            : ''}
        </Text>

        {/* Condition */}
        <Text
          style={[s.condition, { color: theme.textDisabled, fontFamily: 'Inter_400Regular' }]}
          numberOfLines={1}
        >
          {data.conditionDisplayText}
        </Text>

        {/* Seller row: diya · name · firework */}
        <View style={s.sellerRow}>
          <IconCandleFilled size={13} color={diyaColour} />
          <Text
            style={[s.sellerName, { color: theme.textSecondary, fontFamily: 'Inter_400Regular' }]}
            numberOfLines={1}
          >
            {'  '}{data.sellerName}
          </Text>
          <FireworkTrust score={data.listingTrustScore} maxScore={62} size={36} />
        </View>

        {/* Why selling — the human touch */}
        {data.whySellingText != null && (
          <Text
            style={[
              s.whySelling,
              { color: theme.textSecondary, fontFamily: 'CormorantGaramond_400Regular_Italic' },
            ]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {`"${data.whySellingText}"`}
          </Text>
        )}

        {/* Fit badge — only when Fits Me toggle is active */}
        {data.fitLabel != null && (
          <FitBadge label={data.fitLabel} theme={theme} />
        )}
      </View>
      </Animated.View>
    </Pressable>
  )
}

export default memo(ListingCard)

const s = StyleSheet.create({
  card: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  photo: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  waitlistPill: {
    position: 'absolute',
    top: 8,
    right: 8,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  waitlistText: {
    color: '#fff',
    fontSize: 10,
  },
  content: {
    paddingHorizontal: 10,
    paddingTop: 9,
    paddingBottom: 11,
    gap: 3,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  priceInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flexShrink: 0,
  },
  subcategory: {
    fontSize: 14,
    lineHeight: 18,
    flex: 1,
  },
  occasion: {
    fontSize: 11,
    lineHeight: 15,
  },
  sizeLine: {
    fontSize: 13,
    lineHeight: 17,
  },
  condition: {
    fontSize: 10,
    lineHeight: 14,
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  sellerName: {
    fontSize: 11,
    flex: 1,
  },
  whySelling: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 1,
  },
  colourDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: StyleSheet.hairlineWidth,
  },
  price: {
    fontSize: 16,
  },
  fitBadge: {
    alignSelf: 'flex-start',
    borderRadius: 4,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 5,
  },
  fitBadgeText: {
    fontSize: 10,
  },
})
