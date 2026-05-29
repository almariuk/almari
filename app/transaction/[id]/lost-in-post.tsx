import { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { IconArrowLeft, IconCheck } from '@tabler/icons-react-native'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useTheme } from '@/hooks/useTheme'
import { useAuthStore } from '@/store/auth'

// S26 — Lost in post
// Both buyer and seller must confirm. When both confirmed → status: refunded.

interface LostInPostDetail {
  id: string
  status: string
  buyerLostConfirmedAt: string | null
  sellerLostConfirmedAt: string | null
  buyerName: string
  sellerName: string
  itemName: string
}

function useLostInPostDetail(transactionId: string, userId: string) {
  return useQuery<LostInPostDetail>({
    queryKey: ['lost_in_post', transactionId],
    enabled: !!transactionId && !!userId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('transactions')
        .select(`
          id, status, buyer_lost_confirmed_at, seller_lost_confirmed_at,
          buyer:user_identity!buyer_id ( first_name, last_name_initial ),
          seller:user_identity!seller_id ( first_name, last_name_initial ),
          listing:listings!listing_id ( subcategories ( name ) )
        `)
        .eq('id', transactionId)
        .single()
      if (error) throw error
      const row = data as any
      return {
        id: row.id,
        status: row.status,
        buyerLostConfirmedAt: row.buyer_lost_confirmed_at ?? null,
        sellerLostConfirmedAt: row.seller_lost_confirmed_at ?? null,
        buyerName: row.buyer ? `${row.buyer.first_name} ${row.buyer.last_name_initial}.` : 'Buyer',
        sellerName: row.seller ? `${row.seller.first_name} ${row.seller.last_name_initial}.` : 'Seller',
        itemName: row.listing?.subcategories?.name ?? 'Item',
      }
    },
  })
}

export default function LostInPost() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const theme = useTheme()
  const router = useRouter()
  const { identity } = useAuthStore()
  const queryClient = useQueryClient()
  const s = makeStyles(theme)

  const { data: detail, isLoading, error } = useLostInPostDetail(id ?? '', identity?.id ?? '')
  const [confirming, setConfirming] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  if (isLoading) {
    return (
      <SafeAreaView style={[s.root, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
        <ActivityIndicator style={s.loader} color={theme.accent} size="large" />
      </SafeAreaView>
    )
  }

  if (error || !detail) {
    return (
      <SafeAreaView style={[s.root, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
        <View style={[s.nav, { borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <IconArrowLeft size={22} color={theme.text} />
          </TouchableOpacity>
        </View>
        <Text style={[s.errorText, { color: theme.textSecondary, fontFamily: 'Inter_400Regular' }]}>
          Could not load order details.
        </Text>
      </SafeAreaView>
    )
  }

  // Determine if current user is buyer or seller
  // We check both orders — RLS ensures the user can only see their own transactions
  const isBuyer = !detail.buyerLostConfirmedAt
  const hasBuyerConfirmed = !!detail.buyerLostConfirmedAt
  const hasSellerConfirmed = !!detail.sellerLostConfirmedAt
  const bothConfirmed = detail.status === 'refunded'

  const handleConfirm = async () => {
    if (!id) return
    setSubmitting(true)

    const now = new Date().toISOString()
    // Determine which field to set based on what's already confirmed
    // We try buyer first, seller second — RLS + DB logic handles the rest
    const updateField = !hasBuyerConfirmed ? 'buyer_lost_confirmed_at' : 'seller_lost_confirmed_at'
    const bothWillBeConfirmed = hasBuyerConfirmed || hasSellerConfirmed

    const update: any = { [updateField]: now }
    if (bothWillBeConfirmed) {
      update.status = 'refunded'
    }

    const { error } = await (supabase as any)
      .from('transactions')
      .update(update)
      .eq('id', id)

    setSubmitting(false)
    if (error) {
      Alert.alert('Error', 'Could not submit confirmation. Please try again.')
      return
    }
    queryClient.invalidateQueries({ queryKey: ['lost_in_post', id] })
    queryClient.invalidateQueries({ queryKey: ['order_buyer', id] })
    queryClient.invalidateQueries({ queryKey: ['order_seller', id] })
    queryClient.invalidateQueries({ queryKey: ['my_purchases'] })
    queryClient.invalidateQueries({ queryKey: ['my_sales'] })
    setConfirming(false)
  }

  if (bothConfirmed) {
    return (
      <SafeAreaView style={[s.root, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
        <View style={[s.nav, { borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <IconArrowLeft size={22} color={theme.text} />
          </TouchableOpacity>
          <Text style={[s.navTitle, { color: theme.text, fontFamily: 'Inter_600SemiBold' }]}>Lost in post</Text>
          <View style={s.navSpacer} />
        </View>
        <View style={s.doneWrap}>
          <View style={[s.doneIcon, { backgroundColor: theme.accent + '18', borderColor: theme.accent }]}>
            <IconCheck size={28} color={theme.accent} />
          </View>
          <Text style={[s.doneHeading, { color: theme.text, fontFamily: 'CormorantGaramond_700Bold' }]}>
            Both parties confirmed
          </Text>
          <Text style={[s.doneBody, { color: theme.textSecondary, fontFamily: 'Inter_400Regular' }]}>
            Almari will process a refund manually within 5 working days. The seller should claim compensation directly from Royal Mail.
          </Text>
          <TouchableOpacity
            style={[s.doneBtn, { backgroundColor: theme.accent }]}
            onPress={() => router.back()}
            activeOpacity={0.85}
          >
            <Text style={[s.doneBtnText, { color: theme.accentText, fontFamily: 'Inter_600SemiBold' }]}>
              Done
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={[s.root, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      <View style={[s.nav, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <IconArrowLeft size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={[s.navTitle, { color: theme.text, fontFamily: 'Inter_600SemiBold' }]}>Lost in post</Text>
        <View style={s.navSpacer} />
      </View>

      <View style={s.body}>
        <Text style={[s.heading, { color: theme.text, fontFamily: 'CormorantGaramond_700Bold' }]}>
          {detail.itemName}
        </Text>
        <Text style={[s.subheading, { color: theme.textSecondary, fontFamily: 'Inter_400Regular' }]}>
          If this item appears to be lost in post, both the buyer and seller must confirm before Almari can process a refund.
        </Text>

        {/* Confirmation status */}
        <View style={s.statusList}>
          <ConfirmRow
            label={`${detail.buyerName} (buyer)`}
            confirmed={hasBuyerConfirmed}
            theme={theme}
          />
          <ConfirmRow
            label={`${detail.sellerName} (seller)`}
            confirmed={hasSellerConfirmed}
            theme={theme}
          />
        </View>

        <Text style={[s.note, { color: theme.textDisabled, fontFamily: 'Inter_400Regular' }]}>
          Almari will process a manual refund once both parties confirm. The seller should keep their proof of postage and claim compensation from Royal Mail directly.
        </Text>
      </View>

      <View style={[s.footer, { borderTopColor: theme.border, backgroundColor: theme.background }]}>
        {confirming ? (
          <>
            <Text style={[s.confirmPrompt, { color: theme.text, fontFamily: 'Inter_500Medium' }]}>
              Confirm this item is lost in post?
            </Text>
            <TouchableOpacity
              style={[s.confirmBtn, { backgroundColor: theme.error }]}
              onPress={handleConfirm}
              disabled={submitting}
              activeOpacity={0.85}
            >
              {submitting
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={[s.confirmBtnText, { color: '#fff', fontFamily: 'Inter_600SemiBold' }]}>
                    Yes, confirm lost in post
                  </Text>
              }
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.cancelBtn, { borderColor: theme.border }]}
              onPress={() => setConfirming(false)}
              activeOpacity={0.7}
            >
              <Text style={[s.cancelBtnText, { color: theme.textSecondary, fontFamily: 'Inter_400Regular' }]}>
                Cancel
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            style={[s.confirmBtn, { backgroundColor: theme.accent }]}
            onPress={() => setConfirming(true)}
            activeOpacity={0.85}
          >
            <Text style={[s.confirmBtnText, { color: theme.accentText, fontFamily: 'Inter_600SemiBold' }]}>
              Confirm my side
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  )
}

function ConfirmRow({ label, confirmed, theme }: { label: string; confirmed: boolean; theme: any }) {
  return (
    <View style={[cr.row, { borderColor: confirmed ? theme.success : theme.border, backgroundColor: confirmed ? theme.success + '10' : theme.surface }]}>
      <View style={[cr.dot, { backgroundColor: confirmed ? theme.success : theme.border }]} />
      <Text style={[cr.label, { color: confirmed ? theme.text : theme.textSecondary, fontFamily: confirmed ? 'Inter_600SemiBold' : 'Inter_400Regular' }]}>
        {label}
      </Text>
      <Text style={[cr.status, { color: confirmed ? theme.success : theme.textDisabled, fontFamily: 'Inter_500Medium' }]}>
        {confirmed ? 'Confirmed' : 'Pending'}
      </Text>
    </View>
  )
}

const cr = StyleSheet.create({
  row:    { flexDirection: 'row', alignItems: 'center', borderRadius: 10, borderWidth: 1, padding: 14, gap: 10 },
  dot:    { width: 8, height: 8, borderRadius: 4 },
  label:  { flex: 1, fontSize: 14 },
  status: { fontSize: 12 },
})

function makeStyles(theme: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    root:      { flex: 1 },
    loader:    { flex: 1 },
    errorText: { textAlign: 'center', marginTop: 80, fontSize: 15, paddingHorizontal: 24 },

    nav: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 16, paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
    },
    navTitle:  { flex: 1, textAlign: 'center', fontSize: 15 },
    navSpacer: { width: 22 },

    body: { flex: 1, paddingHorizontal: 24, paddingTop: 28, gap: 20 },

    heading:    { fontSize: 28, lineHeight: 34 },
    subheading: { fontSize: 14, lineHeight: 21 },
    statusList: { gap: 10 },
    note:       { fontSize: 12, lineHeight: 19 },

    doneWrap:    { flex: 1, paddingHorizontal: 32, justifyContent: 'center', alignItems: 'center', gap: 16 },
    doneIcon:    { width: 64, height: 64, borderRadius: 32, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
    doneHeading: { fontSize: 28, textAlign: 'center' },
    doneBody:    { fontSize: 14, lineHeight: 22, textAlign: 'center' },
    doneBtn:     { borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32, alignItems: 'center', marginTop: 8 },
    doneBtnText: { fontSize: 15 },

    footer: {
      paddingHorizontal: 24, paddingVertical: 16,
      borderTopWidth: StyleSheet.hairlineWidth, gap: 10,
    },
    confirmPrompt:  { fontSize: 14, textAlign: 'center', paddingBottom: 4 },
    confirmBtn:     { borderRadius: 12, paddingVertical: 15, alignItems: 'center' },
    confirmBtnText: { fontSize: 15 },
    cancelBtn:      { borderRadius: 12, paddingVertical: 13, alignItems: 'center', borderWidth: 1 },
    cancelBtnText:  { fontSize: 15 },
  })
}
