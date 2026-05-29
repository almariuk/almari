import { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { IconArrowLeft, IconMapPin } from '@tabler/icons-react-native'
import { Image } from 'expo-image'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useTheme } from '@/hooks/useTheme'
import { useAuthStore } from '@/store/auth'
import { useListingDetail } from '@/hooks/useListingDetail'
import type { UserAddressRow } from '@/types/database'

function formatGbp(pence: number): string {
  return `£${(pence / 100).toFixed(2)}`
}

function useDefaultAddress(identityId: string) {
  return useQuery<UserAddressRow | null>({
    queryKey: ['user_default_address', identityId],
    enabled: !!identityId,
    queryFn: async () => {
      const { data } = await supabase
        .from('user_addresses')
        .select('*')
        .eq('user_id', identityId)
        .order('is_default', { ascending: false })
        .limit(1)
        .maybeSingle()
      return data ?? null
    },
  })
}

export default function ConfirmOrder() {
  const theme = useTheme()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { listingId } = useLocalSearchParams<{ listingId: string }>()
  const { identity } = useAuthStore()
  const { data: listing, isLoading: listingLoading } = useListingDetail(listingId ?? '')
  const { data: address, isLoading: addrLoading } = useDefaultAddress(identity?.id ?? '')
  const [placing, setPlacing] = useState(false)

  const handleConfirm = async () => {
    if (!identity?.id || !listing?.sellerId) return
    if (!address) {
      Alert.alert('Delivery address needed', 'Please add a delivery address in your profile before placing an order.')
      return
    }
    setPlacing(true)

    const ref = 'ALM-' + Math.random().toString(36).substring(2, 7).toUpperCase()
    const salePrice = listing.askingPricePence ?? 0

    const deliverySnapshot = {
      line1: address.address_line_1,
      line2: address.address_line_2 ?? null,
      city: address.city,
      postcode: address.postcode,
      phone: (address as any).contact_phone ?? null,
    }

    const { data: txn, error: txnError } = await (supabase as any)
      .from('transactions')
      .insert({
        listing_id: listing.id,
        buyer_id: identity.id,
        seller_id: listing.sellerId,
        status: 'pending_payment',
        payment_reference: ref,
        sale_price_pence: salePrice,
        postage_price_pence: 0,
        total_paid_pence: salePrice,
        delivery_address: deliverySnapshot,
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
    queryClient.invalidateQueries({ queryKey: ['order_counts'] })
    queryClient.invalidateQueries({ queryKey: ['my_purchases'] })
    setPlacing(false)
    router.replace(`/transaction/new/payment-instructions?id=${txn.id}` as any)
  }

  if (listingLoading || addrLoading || !listing) {
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
            <Image source={{ uri: primaryPhoto }} style={s.photo} contentFit="cover" />
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

        {/* Price */}
        <View style={[s.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={s.priceRow}>
            <Text style={[s.totalLabel, { color: theme.text, fontFamily: 'Inter_600SemiBold' }]}>Total</Text>
            <Text style={[s.totalValue, { color: theme.text, fontFamily: 'Inter_600SemiBold' }]}>{formatGbp(salePrice)}</Text>
          </View>
        </View>

        {/* Delivery address */}
        <View style={[s.card, { backgroundColor: theme.surface, borderColor: address ? theme.border : theme.error }]}>
          <View style={s.addrHeader}>
            <IconMapPin size={14} color={address ? theme.textSecondary : theme.error} />
            <Text style={[s.addrLabel, { color: address ? theme.textSecondary : theme.error, fontFamily: 'Inter_500Medium' }]}>
              DELIVER TO
            </Text>
          </View>
          {address ? (
            <>
              <Text style={[s.addrLine, { color: theme.text, fontFamily: 'Inter_400Regular' }]}>
                {address.address_line_1}
                {address.address_line_2 ? `, ${address.address_line_2}` : ''}
              </Text>
              <Text style={[s.addrLine, { color: theme.text, fontFamily: 'Inter_400Regular' }]}>
                {address.city}, {address.postcode}
              </Text>
              {(address as any).contact_phone && (
                <Text style={[s.addrLine, { color: theme.textSecondary, fontFamily: 'Inter_400Regular', marginTop: 2 }]}>
                  {(address as any).contact_phone}
                </Text>
              )}
              <TouchableOpacity onPress={() => router.push('/profile' as any)} style={s.changeAddr}>
                <Text style={[s.changeAddrText, { color: theme.accent, fontFamily: 'Inter_500Medium' }]}>
                  Change address
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={[s.addrMissing, { color: theme.error, fontFamily: 'Inter_400Regular' }]}>
                No delivery address saved.
              </Text>
              <TouchableOpacity onPress={() => router.push('/profile' as any)} style={s.changeAddr}>
                <Text style={[s.changeAddrText, { color: theme.accent, fontFamily: 'Inter_500Medium' }]}>
                  Add address in profile →
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <Text style={[s.hint, { color: theme.textSecondary, fontFamily: 'Inter_400Regular' }]}>
          You'll be shown the seller's payment details on the next screen.
        </Text>
      </View>

      {/* Actions */}
      <View style={[s.footer, { borderTopColor: theme.border, backgroundColor: theme.background }]}>
        <TouchableOpacity
          style={[s.confirmBtn, { backgroundColor: address ? theme.accent : theme.border }]}
          onPress={handleConfirm}
          disabled={placing || !address}
          activeOpacity={0.85}
        >
          {placing
            ? <ActivityIndicator color={theme.accentText} size="small" />
            : <Text style={[s.confirmBtnText, { color: address ? theme.accentText : theme.textDisabled, fontFamily: 'Inter_600SemiBold' }]}>
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
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  navTitle: { flex: 1, textAlign: 'center', fontSize: 16 },

  body: { flex: 1, paddingHorizontal: 20, paddingTop: 24, gap: 16 },

  itemRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: 12, borderWidth: 1, padding: 14,
  },
  photo:    { width: 56, height: 72, borderRadius: 8 },
  itemInfo: { flex: 1, gap: 3 },
  itemName: { fontSize: 22, lineHeight: 26 },
  sellerName: { fontSize: 13 },

  card: { borderRadius: 12, borderWidth: 1, padding: 16, gap: 4 },
  priceRow:   { flexDirection: 'row', justifyContent: 'space-between' },
  totalLabel: { fontSize: 15 },
  totalValue: { fontSize: 15 },

  addrHeader:  { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  addrLabel:   { fontSize: 10, letterSpacing: 0.8 },
  addrLine:    { fontSize: 14, lineHeight: 20 },
  addrMissing: { fontSize: 14, lineHeight: 20 },
  changeAddr:  { marginTop: 8 },
  changeAddrText: { fontSize: 13 },

  hint: { fontSize: 13, lineHeight: 20 },

  footer: {
    paddingHorizontal: 20, paddingVertical: 16,
    borderTopWidth: StyleSheet.hairlineWidth, gap: 10,
  },
  confirmBtn:     { borderRadius: 12, paddingVertical: 15, alignItems: 'center' },
  confirmBtnText: { fontSize: 15 },
  cancelBtn:      { borderRadius: 12, paddingVertical: 13, alignItems: 'center', borderWidth: 1 },
  cancelBtnText:  { fontSize: 15 },
})
