import { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { IconArrowLeft } from '@tabler/icons-react-native'
import { Image } from 'expo-image'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useTheme } from '@/hooks/useTheme'
import { useAuthStore } from '@/store/auth'
import { useListingDetail } from '@/hooks/useListingDetail'

function formatGbp(pence: number): string {
  return `£${(pence / 100).toFixed(2)}`
}

export default function ConfirmOrder() {
  const theme = useTheme()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { listingId } = useLocalSearchParams<{ listingId: string }>()
  const { identity } = useAuthStore()
  const { data: listing, isLoading } = useListingDetail(listingId ?? '')
  const [placing, setPlacing] = useState(false)

  const handleConfirm = async () => {
    if (!identity?.id || !listing?.sellerId) return
    setPlacing(true)

    const ref = 'ALM-' + Math.random().toString(36).substring(2, 7).toUpperCase()
    const salePrice = listing.askingPricePence ?? 0

    const { data: txn, error: txnError } = await (supabase as any)
      .from('transactions')
      .insert({
        listing_id: listing.id,
        buyer_id: identity.id,
        seller_id: listing.sellerId,
        status: 'pending_payment',
        payment_reference: ref,
        sale_price_pence: salePrice,
        total_paid_pence: salePrice,
      })
      .select('id')
      .single()

    if (txnError) {
      setPlacing(false)
      Alert.alert('Error', 'Could not place order. Please try again.')
      return
    }

    queryClient.invalidateQueries({ queryKey: ['feed_listings'] })
    queryClient.invalidateQueries({ queryKey: ['listing_detail', listingId] })
    setPlacing(false)
    router.replace(`/transaction/new/payment-instructions?id=${txn.id}` as any)
  }

  if (isLoading || !listing) {
    return (
      <SafeAreaView style={[s.root, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
        <ActivityIndicator style={s.loader} color={theme.accent} size="large" />
      </SafeAreaView>
    )
  }

  const salePrice = listing.askingPricePence ?? 0
  const primaryPhoto = listing.photos?.[0]?.url ?? null

  return (
    <SafeAreaView style={[s.root, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      {/* Nav */}
      <View style={[s.nav, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <IconArrowLeft size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={[s.navTitle, { color: theme.text, fontFamily: 'Inter_600SemiBold' }]}>
          Confirm order
        </Text>
        <View style={{ width: 22 }} />
      </View>

      <View style={s.body}>
        {/* Item summary */}
        <View style={[s.itemRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {primaryPhoto && (
            <Image
              source={{ uri: primaryPhoto }}
              style={s.photo}
              contentFit="cover"
            />
          )}
          <View style={s.itemInfo}>
            <Text style={[s.itemName, { color: theme.text, fontFamily: 'CormorantGaramond_700Bold' }]}>
              {listing.subcategoryName}
            </Text>
            <Text style={[s.sellerName, { color: theme.textSecondary, fontFamily: 'Inter_400Regular' }]}>
              from {listing.sellerName}
            </Text>
          </View>
        </View>

        {/* Price breakdown */}
        <View style={[s.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={s.priceRow}>
            <Text style={[s.totalLabel, { color: theme.text, fontFamily: 'Inter_600SemiBold' }]}>Total</Text>
            <Text style={[s.totalValue, { color: theme.text, fontFamily: 'Inter_600SemiBold' }]}>{formatGbp(salePrice)}</Text>
          </View>
        </View>

        {/* What happens next */}
        <Text style={[s.hint, { color: theme.textSecondary, fontFamily: 'Inter_400Regular' }]}>
          You'll be shown the seller's payment details on the next screen. You can always find this order in My Purchases if you need to come back to it.
        </Text>
      </View>

      {/* Actions */}
      <View style={[s.footer, { borderTopColor: theme.border, backgroundColor: theme.background }]}>
        <TouchableOpacity
          style={[s.confirmBtn, { backgroundColor: theme.accent }]}
          onPress={handleConfirm}
          disabled={placing}
          activeOpacity={0.85}
        >
          {placing
            ? <ActivityIndicator color={theme.accentText} size="small" />
            : <Text style={[s.confirmBtnText, { color: theme.accentText, fontFamily: 'Inter_600SemiBold' }]}>
                Place order
              </Text>
          }
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.cancelBtn, { borderColor: theme.border }]}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Text style={[s.cancelBtnText, { color: theme.textSecondary, fontFamily: 'Inter_400Regular' }]}>
            Cancel
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  root:   { flex: 1 },
  loader: { flex: 1 },

  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  navTitle: { flex: 1, textAlign: 'center', fontSize: 16 },

  body: { flex: 1, paddingHorizontal: 20, paddingTop: 24, gap: 16 },

  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
  },
  photo: { width: 56, height: 72, borderRadius: 8 },
  itemInfo: { flex: 1, gap: 3 },
  itemName: { fontSize: 22, lineHeight: 26 },
  sellerName: { fontSize: 13 },

  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    gap: 6,
  },
  priceRow:   { flexDirection: 'row', justifyContent: 'space-between' },
  priceLabel: { fontSize: 14 },
  priceValue: { fontSize: 14 },
  divider:    { height: StyleSheet.hairlineWidth, marginVertical: 4 },
  totalLabel: { fontSize: 15 },
  totalValue: { fontSize: 15 },

  hint: { fontSize: 13, lineHeight: 20 },

  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  confirmBtn: {
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
  },
  confirmBtnText: { fontSize: 15 },
  cancelBtn: {
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    borderWidth: 1,
  },
  cancelBtnText: { fontSize: 15 },
})
