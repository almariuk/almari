import { useState, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, ActivityIndicator, Alert, Linking, KeyboardAvoidingView, Platform } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Image } from 'expo-image'
import { IconArrowLeft, IconChevronRight, IconExternalLink, IconPencil } from '@tabler/icons-react-native'
import { supabase } from '@/lib/supabase'
import { useTheme } from '@/hooks/useTheme'
import { useAuthStore } from '@/store/auth'
import type { Theme } from '@/constants/theme'

// S24 — Order detail, seller view

interface DeliveryAddress {
  line1: string
  line2?: string | null
  city: string
  postcode: string
  phone?: string | null
}

interface SaleDetail {
  id: string
  status: string
  paymentReference: string | null
  salePricePence: number
  postagePricePence: number
  totalPaidPence: number
  trackingNumber: string | null
  dispatchedAt: string | null
  buyerPaymentClaimedAt: string | null
  buyerConfirmedDeliveredAt: string | null
  concernWindowClosesAt: string | null
  concernRaisedAt: string | null
  createdAt: string
  buyerName: string
  itemName: string
  photoUrl: string | null
  listingId: string | null
  deliveryAddress: DeliveryAddress | null
}

function useSaleDetail(transactionId: string, sellerId: string) {
  return useQuery<SaleDetail>({
    queryKey: ['order_seller', transactionId],
    enabled: !!transactionId && !!sellerId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('transactions')
        .select(`
          id, status, payment_reference, listing_id,
          sale_price_pence, postage_price_pence, total_paid_pence,
          tracking_number, dispatched_at, buyer_payment_claimed_at,
          buyer_confirmed_delivered_at,
          concern_window_closes_at, concern_raised_at, created_at, delivery_address,
          buyer:user_identity!buyer_id ( first_name, last_name_initial ),
          listing:listings!listing_id (
            subcategories ( name ),
            listing_photos ( url, display_order )
          )
        `)
        .eq('id', transactionId)
        .eq('seller_id', sellerId)
        .single()

      if (error) throw error

      const row = data as any
      const buyer = row.buyer
      const photos: any[] = Array.isArray(row.listing?.listing_photos) ? row.listing.listing_photos : []
      const primaryPhoto = photos.sort((a: any, b: any) => a.display_order - b.display_order)[0]

      return {
        id: row.id,
        status: row.status,
        paymentReference: row.payment_reference,
        salePricePence: row.sale_price_pence,
        postagePricePence: row.postage_price_pence,
        totalPaidPence: row.total_paid_pence,
        trackingNumber: row.tracking_number,
        dispatchedAt: row.dispatched_at,
        buyerPaymentClaimedAt: row.buyer_payment_claimed_at,
        buyerConfirmedDeliveredAt: row.buyer_confirmed_delivered_at,
        concernWindowClosesAt: row.concern_window_closes_at,
        concernRaisedAt: row.concern_raised_at ?? null,
        createdAt: row.created_at,
        buyerName: buyer ? `${buyer.first_name} ${buyer.last_name_initial}.` : 'Buyer',
        itemName: row.listing?.subcategories?.name ?? 'Item',
        photoUrl: primaryPhoto?.url ?? null,
        listingId: row.listing_id ?? null,
        deliveryAddress: row.delivery_address ?? null,
      }
    },
  })
}

// ── Status timeline ───────────────────────────────────────────

const STEPS = [
  { key: 'pending_payment', label: 'Order received' },
  { key: 'paid',            label: 'Payment confirmed' },
  { key: 'dispatched',      label: 'Item dispatched' },
  { key: 'delivered',       label: 'Buyer confirmed receipt' },
  { key: 'completed',       label: 'Complete' },
]

const STATUS_ORDER = ['pending_payment', 'paid', 'dispatched', 'delivered', 'concern_open', 'concern_resolved', 'completed']

function stepReached(status: string, stepKey: string): boolean {
  const si = STATUS_ORDER.indexOf(status)
  const ki = STATUS_ORDER.indexOf(stepKey)
  if (stepKey === 'completed') return status === 'completed'
  return si >= ki
}

function StatusTimeline({ status, theme, s }: { status: string; theme: Theme; s: any }) {
  return (
    <View style={s.timeline}>
      {STEPS.map((step, i) => {
        const reached = stepReached(status, step.key)
        const isLast = i === STEPS.length - 1
        return (
          <View key={step.key} style={s.timelineStep}>
            <View style={s.timelineLeft}>
              <View style={[
                s.timelineDot,
                { borderColor: reached ? theme.accent : theme.border,
                  backgroundColor: reached ? theme.accent : theme.background },
              ]} />
              {!isLast && <View style={[s.timelineLine, { backgroundColor: reached ? theme.accent : theme.border }]} />}
            </View>
            <Text style={[
              s.timelineLabel,
              { color: reached ? theme.text : theme.textDisabled,
                fontFamily: reached ? 'Inter_500Medium' : 'Inter_400Regular' },
            ]}>
              {step.label}
            </Text>
          </View>
        )
      })}
      {status === 'concern_open' && (
        <View style={[s.concernBanner, { backgroundColor: theme.error + '18', borderColor: theme.error }]}>
          <Text style={[s.concernText, { color: theme.error, fontFamily: 'Inter_500Medium' }]}>
            Concern raised — Almari is reviewing
          </Text>
        </View>
      )}
    </View>
  )
}

function formatGbp(pence: number): string {
  return `£${(pence / 100).toFixed(2)}`
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ── Screen ────────────────────────────────────────────────────

export default function SellerOrderDetail() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const theme = useTheme()
  const router = useRouter()
  const { identity } = useAuthStore()
  const queryClient = useQueryClient()
  const s = makeStyles(theme)

  const { data: order, isLoading, error } = useSaleDetail(id ?? '', identity?.id ?? '')
  const [saving, setSaving] = useState(false)
  const [trackingInput, setTrackingInput] = useState('')
  const [editingTracking, setEditingTracking] = useState(false)
  const [trackingEdit, setTrackingEdit] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)

  // Lazily close concern window when seller views this screen
  useEffect(() => {
    if (!order || order.status !== 'delivered') return
    if (!order.concernWindowClosesAt || new Date(order.concernWindowClosesAt) > new Date()) return
    if (order.concernRaisedAt) return
    ;(supabase as any).rpc('close_concern_window', { p_transaction_id: order.id })
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ['order_seller', order.id] })
        queryClient.invalidateQueries({ queryKey: ['my_sales'] })
      })
  }, [order?.id, order?.status, order?.concernWindowClosesAt])

  if (isLoading) {
    return (
      <SafeAreaView style={[s.root, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
        <ActivityIndicator style={s.loader} color={theme.accent} size="large" />
      </SafeAreaView>
    )
  }

  if (error || !order) {
    return (
      <SafeAreaView style={[s.root, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
        <View style={[s.nav, { borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <IconArrowLeft size={22} color={theme.text} />
          </TouchableOpacity>
        </View>
        <Text style={[s.errorText, { color: theme.textSecondary, fontFamily: 'Inter_400Regular' }]}>
          Order could not be loaded.
        </Text>
      </SafeAreaView>
    )
  }

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['order_seller', order.id] })
    queryClient.invalidateQueries({ queryKey: ['order_buyer', order.id] })
    queryClient.invalidateQueries({ queryKey: ['my_sales'] })
    queryClient.invalidateQueries({ queryKey: ['my_purchases'] })
    queryClient.invalidateQueries({ queryKey: ['order_counts'] })
  }

  const handleConfirmPayment = () => {
    Alert.alert(
      'Confirm payment received',
      `Confirm you have received ${formatGbp(order.totalPaidPence)} from ${order.buyerName} using reference ${order.paymentReference}.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setSaving(true)
            await (supabase as any)
              .from('transactions')
              .update({ status: 'paid' })
              .eq('id', order.id)
            setSaving(false)
            invalidate()
          },
        },
      ]
    )
  }

  const handleDispatch = () => {
    const tracking = trackingInput.trim()
    if (!tracking) {
      Alert.alert('Tracking number required', 'Enter a tracking number before marking as dispatched.')
      return
    }
    Alert.alert(
      'Mark as dispatched',
      `Confirm you have posted this item with tracking number ${tracking}.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setSaving(true)
            await (supabase as any)
              .from('transactions')
              .update({
                status: 'dispatched',
                tracking_number: tracking,
                dispatched_at: new Date().toISOString(),
              })
              .eq('id', order.id)
            setSaving(false)
            setTrackingInput('')
            invalidate()
          },
        },
      ]
    )
  }

  return (
    <KeyboardAvoidingView style={[s.root, { backgroundColor: theme.background }]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
    <SafeAreaView style={s.root} edges={['top']} >
      {/* Nav */}
      <View style={[s.nav, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <IconArrowLeft size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={[s.navTitle, { color: theme.text, fontFamily: 'Inter_600SemiBold' }]}>
          {order.paymentReference ?? 'Order'}
        </Text>
        <View style={s.navSpacer} />
      </View>

      <ScrollView contentContainerStyle={s.body} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* Status timeline */}
        <StatusTimeline status={order.status} theme={theme} s={s} />

        {/* Item card */}
        <View style={[s.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <TouchableOpacity
            style={s.itemRow}
            onPress={() => order.listingId && router.push(`/listing/${order.listingId}` as any)}
            activeOpacity={order.listingId ? 0.7 : 1}
          >
            <Image
              source={order.photoUrl ? { uri: order.photoUrl } : null}
              style={[s.itemPhoto, { backgroundColor: theme.background }]}
              contentFit="cover"
            />
            <View style={s.itemInfo}>
              <Text style={[s.itemName, { color: theme.text, fontFamily: 'CormorantGaramond_700Bold' }]} numberOfLines={2}>
                {order.itemName}
              </Text>
              <Text style={[s.itemBuyer, { color: theme.textSecondary, fontFamily: 'Inter_400Regular' }]}>
                sold to {order.buyerName}
              </Text>
              <Text style={[s.itemDate, { color: theme.textDisabled, fontFamily: 'Inter_400Regular' }]}>
                {fmtDate(order.createdAt)}
              </Text>
            </View>
            {order.listingId && <IconChevronRight size={18} color={theme.textDisabled} style={{ alignSelf: 'center' }} />}
          </TouchableOpacity>
          <View style={[s.divider, { backgroundColor: theme.border }]} />
          <View style={s.priceRow}>
            <Text style={[s.totalLabel, { color: theme.text, fontFamily: 'Inter_600SemiBold' }]}>You receive</Text>
            <Text style={[s.totalValue, { color: theme.accent, fontFamily: 'Inter_600SemiBold' }]}>{formatGbp(order.totalPaidPence)}</Text>
          </View>
        </View>

        {/* Action: confirm payment */}
        {order.status === 'pending_payment' && (
          <>
            <Text style={[s.sectionLabel, { color: order.buyerPaymentClaimedAt ? theme.accent : theme.textDisabled, fontFamily: 'Inter_500Medium' }]}>
              {order.buyerPaymentClaimedAt ? 'PAYMENT SENT BY BUYER' : 'ACTION REQUIRED'}
            </Text>
            <View style={[s.card, { backgroundColor: theme.surface, borderColor: order.buyerPaymentClaimedAt ? theme.accent : theme.border }]}>
              <Text style={[s.actionHeading, { color: theme.text, fontFamily: 'Inter_600SemiBold' }]}>
                {order.buyerPaymentClaimedAt ? 'Buyer says payment is sent' : 'Awaiting payment'}
              </Text>
              <Text style={[s.actionNote, { color: theme.textSecondary, fontFamily: 'Inter_400Regular' }]}>
                {order.buyerPaymentClaimedAt
                  ? `Check your PayPal or Revolut for ${formatGbp(order.totalPaidPence)} with reference `
                  : `${order.buyerName} will transfer ${formatGbp(order.totalPaidPence)} to you using reference `}
                <Text style={{ fontFamily: 'Inter_600SemiBold', color: theme.text }}>{order.paymentReference}</Text>
                {order.buyerPaymentClaimedAt ? '. Once confirmed, tap below.' : '. Once received, confirm below.'}
              </Text>
              <View style={[s.deliveryBox, { backgroundColor: theme.background, borderColor: theme.border }]}>
                <Text style={[s.deliveryLabel, { color: theme.textDisabled, fontFamily: 'Inter_500Medium' }]}>DELIVER TO</Text>
                <Text style={[s.deliveryLine, { color: theme.textDisabled, fontFamily: 'Inter_400Regular_Italic' }]}>
                  Address will show here once payment is confirmed
                </Text>
              </View>
              <TouchableOpacity
                style={[s.actionBtn, { backgroundColor: theme.accent }]}
                onPress={handleConfirmPayment}
                disabled={saving}
                activeOpacity={0.85}
              >
                {saving
                  ? <ActivityIndicator color={theme.accentText} size="small" />
                  : <Text style={[s.actionBtnText, { color: theme.accentText, fontFamily: 'Inter_600SemiBold' }]}>
                      Confirm payment received
                    </Text>
                }
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Action: dispatch */}
        {order.status === 'paid' && (
          <>
            <Text style={[s.sectionLabel, { color: theme.textDisabled, fontFamily: 'Inter_500Medium' }]}>ACTION REQUIRED</Text>
            <View style={[s.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[s.actionHeading, { color: theme.text, fontFamily: 'Inter_600SemiBold' }]}>
                Post this item
              </Text>
              {order.deliveryAddress ? (
                <View style={[s.deliveryBox, { backgroundColor: theme.background, borderColor: theme.border }]}>
                  <Text style={[s.deliveryLabel, { color: theme.textDisabled, fontFamily: 'Inter_500Medium' }]}>DELIVER TO</Text>
                  <Text style={[s.deliveryLine, { color: theme.text, fontFamily: 'Inter_400Regular' }]}>
                    {order.deliveryAddress.line1}{order.deliveryAddress.line2 ? `, ${order.deliveryAddress.line2}` : ''}
                  </Text>
                  <Text style={[s.deliveryLine, { color: theme.text, fontFamily: 'Inter_400Regular' }]}>
                    {order.deliveryAddress.city}, {order.deliveryAddress.postcode}
                  </Text>
                  {order.deliveryAddress.phone && (
                    <Text style={[s.deliveryLine, { color: theme.textSecondary, fontFamily: 'Inter_400Regular' }]}>
                      {order.deliveryAddress.phone}
                    </Text>
                  )}
                </View>
              ) : (
                <Text style={[s.actionNote, { color: theme.textSecondary, fontFamily: 'Inter_400Regular' }]}>
                  Contact {order.buyerName} directly for their delivery address.
                </Text>
              )}
              <Text style={[s.actionNote, { color: theme.textSecondary, fontFamily: 'Inter_400Regular' }]}>
                Enter the tracking number from your postage label below.
              </Text>
              <TextInput
                style={[s.trackingInput, {
                  backgroundColor: theme.inputBackground,
                  borderColor: theme.border,
                  color: theme.text,
                  fontFamily: 'Inter_400Regular',
                }]}
                value={trackingInput}
                onChangeText={setTrackingInput}
                placeholder="Tracking number"
                placeholderTextColor={theme.textDisabled}
                autoCapitalize="characters"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={[s.actionBtn, { backgroundColor: trackingInput.trim() ? theme.accent : theme.surface, borderWidth: trackingInput.trim() ? 0 : 1.5, borderColor: theme.border }]}
                onPress={handleDispatch}
                disabled={saving}
                activeOpacity={0.85}
              >
                {saving
                  ? <ActivityIndicator color={theme.accentText} size="small" />
                  : <Text style={[s.actionBtnText, { color: trackingInput.trim() ? theme.accentText : theme.textDisabled, fontFamily: 'Inter_600SemiBold' }]}>
                      Mark as dispatched
                    </Text>
                }
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Dispatched info */}
        {order.status === 'dispatched' && (
          <>
            <Text style={[s.sectionLabel, { color: theme.textDisabled, fontFamily: 'Inter_500Medium' }]}>DISPATCHED</Text>
            <View style={[s.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[s.trackingLabel, { color: theme.textSecondary, fontFamily: 'Inter_400Regular' }]}>Tracking number</Text>

              {editingTracking ? (
                <>
                  <TextInput
                    style={[s.trackingInput, {
                      backgroundColor: theme.inputBackground,
                      borderColor: theme.borderFocused,
                      color: theme.text,
                      fontFamily: 'Inter_400Regular',
                    }]}
                    value={trackingEdit}
                    onChangeText={setTrackingEdit}
                    autoCapitalize="characters"
                    autoCorrect={false}
                    autoFocus
                  />
                  <View style={s.editActions}>
                    <TouchableOpacity
                      style={[s.editBtn, { backgroundColor: theme.accent, opacity: savingEdit || !trackingEdit.trim() ? 0.45 : 1 }]}
                      disabled={savingEdit || !trackingEdit.trim()}
                      onPress={async () => {
                        const val = trackingEdit.trim()
                        if (!val) return
                        setSavingEdit(true)
                        await (supabase as any)
                          .from('transactions')
                          .update({ tracking_number: val })
                          .eq('id', order.id)
                        setSavingEdit(false)
                        setEditingTracking(false)
                        invalidate()
                      }}
                      activeOpacity={0.85}
                    >
                      {savingEdit
                        ? <ActivityIndicator size="small" color={theme.accentText} />
                        : <Text style={[s.editBtnText, { color: theme.accentText, fontFamily: 'Inter_600SemiBold' }]}>Save</Text>
                      }
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[s.editBtn, { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border }]}
                      onPress={() => setEditingTracking(false)}
                      activeOpacity={0.85}
                    >
                      <Text style={[s.editBtnText, { color: theme.textSecondary, fontFamily: 'Inter_500Medium' }]}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <View style={s.trackingRow}>
                  <TouchableOpacity
                    style={s.trackingLink}
                    onPress={() => order.trackingNumber && Linking.openURL(`https://www.royalmail.com/track-your-item#/tracking-results/${order.trackingNumber}`)}
                    activeOpacity={0.7}
                  >
                    <Text style={[s.trackingNumber, { color: theme.accent, fontFamily: 'Inter_600SemiBold' }]}>{order.trackingNumber}</Text>
                    <IconExternalLink size={14} color={theme.accent} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    onPress={() => { setTrackingEdit(order.trackingNumber ?? ''); setEditingTracking(true) }}
                  >
                    <IconPencil size={16} color={theme.textDisabled} />
                  </TouchableOpacity>
                </View>
              )}

              {!editingTracking && order.dispatchedAt && (
                <Text style={[s.trackingDate, { color: theme.textDisabled, fontFamily: 'Inter_400Regular' }]}>
                  Posted {fmtDate(order.dispatchedAt)}
                </Text>
              )}
              <View style={[s.divider, { backgroundColor: theme.border }]} />
              <Text style={[s.actionNote, { color: theme.textSecondary, fontFamily: 'Inter_400Regular' }]}>
                Waiting for {order.buyerName} to confirm receipt.
              </Text>
            </View>
          </>
        )}

        {/* Lost in post — available when dispatched */}
        {order.status === 'dispatched' && (
          <TouchableOpacity
            style={[s.lostLink, { borderColor: theme.border }]}
            onPress={() => router.push(`/transaction/${order.id}/lost-in-post` as any)}
            activeOpacity={0.7}
          >
            <Text style={[s.lostLinkText, { color: theme.textSecondary, fontFamily: 'Inter_400Regular' }]}>
              Think this is lost in post?
            </Text>
          </TouchableOpacity>
        )}

        {/* Delivered — concern window */}
        {order.status === 'delivered' && (
          <View style={[s.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[s.actionHeading, { color: theme.text, fontFamily: 'Inter_600SemiBold' }]}>
              Delivered
            </Text>
            <Text style={[s.actionNote, { color: theme.textSecondary, fontFamily: 'Inter_400Regular' }]}>
              {order.buyerName} has confirmed receipt.
              {order.concernWindowClosesAt
                ? ` The concern window closes on ${fmtDate(order.concernWindowClosesAt)}.`
                : ' The order will complete once the concern window closes.'
              }
            </Text>
          </View>
        )}

        {/* Completed */}
        {order.status === 'completed' && (
          <View style={[s.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[s.actionHeading, { color: theme.text, fontFamily: 'Inter_600SemiBold' }]}>
              Order complete
            </Text>
            <Text style={[s.actionNote, { color: theme.textSecondary, fontFamily: 'Inter_400Regular' }]}>
              The buyer has confirmed receipt. This transaction is now closed.
            </Text>
          </View>
        )}

        {/* Refunded */}
        {(order.status === 'refunded' || order.status === 'cancelled') && (
          <View style={[s.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[s.actionHeading, { color: theme.textSecondary, fontFamily: 'Inter_600SemiBold' }]}>
              {order.status === 'refunded' ? 'Order refunded' : 'Order cancelled'}
            </Text>
            <Text style={[s.actionNote, { color: theme.textSecondary, fontFamily: 'Inter_400Regular' }]}>
              No payout will be issued for this order.
            </Text>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
    </KeyboardAvoidingView>
  )
}

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
    navTitle:  { flex: 1, textAlign: 'center', fontSize: 15, letterSpacing: 0.5 },
    navSpacer: { width: 22 },

    body: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 40 },

    timeline:     { marginBottom: 28 },
    timelineStep: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, minHeight: 36 },
    timelineLeft: { alignItems: 'center', width: 16 },
    timelineDot:  { width: 14, height: 14, borderRadius: 7, borderWidth: 2, marginTop: 2 },
    timelineLine: { width: 2, flex: 1, marginTop: 2, minHeight: 20 },
    timelineLabel:{ fontSize: 14, paddingBottom: 8 },
    concernBanner:{ marginTop: 12, borderRadius: 8, borderWidth: 1, padding: 12 },
    concernText:  { fontSize: 13 },

    card:     { borderRadius: 12, borderWidth: 1, padding: 16, marginBottom: 24 },
    itemRow:  { flexDirection: 'row', gap: 14, marginBottom: 14 },
    itemPhoto:{ width: 70, height: 90, borderRadius: 8 },
    itemInfo: { flex: 1, gap: 4 },
    itemName: { fontSize: 20, lineHeight: 24 },
    itemBuyer:{ fontSize: 12 },
    itemDate: { fontSize: 11, marginTop: 2 },

    divider:    { height: StyleSheet.hairlineWidth, marginVertical: 10 },
    priceRow:   { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 3 },
    priceLabel: { fontSize: 14 },
    priceValue: { fontSize: 14 },
    totalLabel: { fontSize: 15 },
    totalValue: { fontSize: 15 },

    sectionLabel:  { fontSize: 10, letterSpacing: 0.8, marginBottom: 8 },
    actionHeading: { fontSize: 16, marginBottom: 8 },
    actionNote:    { fontSize: 13, lineHeight: 20, marginBottom: 14 },

    trackingInput: {
      borderWidth: 1.5, borderRadius: 10,
      paddingHorizontal: 14, paddingVertical: 11,
      fontSize: 14, marginBottom: 12,
    },
    trackingLabel:  { fontSize: 12, marginBottom: 4 },
    trackingRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
    trackingLink:   { flexDirection: 'row', alignItems: 'center', gap: 6 },
    trackingNumber: { fontSize: 16 },
    trackingDate:   { fontSize: 12, marginBottom: 4 },
    editActions:    { flexDirection: 'row', gap: 10, marginTop: 8, marginBottom: 4 },
    editBtn:        { flex: 1, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
    editBtnText:    { fontSize: 14 },

    actionBtn:     { borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
    actionBtnText: { fontSize: 15 },

    deliveryBox:   { borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 14, gap: 2 },
    deliveryLabel: { fontSize: 10, letterSpacing: 0.8, marginBottom: 4 },
    deliveryLine:  { fontSize: 14, lineHeight: 20 },

    lostLink:     { borderWidth: 1, borderRadius: 10, padding: 14, alignItems: 'center', marginBottom: 8 },
    lostLinkText: { fontSize: 13 },
  })
}
