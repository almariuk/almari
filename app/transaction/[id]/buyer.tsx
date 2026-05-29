import { useState, useEffect, useRef } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Clipboard } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Image } from 'expo-image'
import { IconArrowLeft, IconCopy, IconCheck, IconInfoCircle, IconClock } from '@tabler/icons-react-native'
import { supabase } from '@/lib/supabase'
import { useTheme } from '@/hooks/useTheme'
import { useAuthStore } from '@/store/auth'
import type { Theme } from '@/constants/theme'

// S23 — Order detail, buyer view

interface OrderDetail {
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
  sellerName: string
  sellerFirstName: string
  sellerPaypal: string | null
  sellerRevolut: string | null
  itemName: string
  photoUrl: string | null
}

function useOrderDetail(transactionId: string, buyerId: string) {
  return useQuery<OrderDetail>({
    queryKey: ['order_buyer', transactionId],
    enabled: !!transactionId && !!buyerId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('transactions')
        .select(`
          id, status, payment_reference,
          sale_price_pence, postage_price_pence, total_paid_pence,
          tracking_number, dispatched_at, buyer_payment_claimed_at,
          buyer_confirmed_delivered_at,
          concern_window_closes_at, concern_raised_at, created_at,
          seller:user_identity!seller_id (
            first_name, last_name_initial,
            user_profile ( payment_instructions )
          ),
          listing:listings!listing_id (
            subcategories ( name ),
            listing_photos ( url, display_order )
          )
        `)
        .eq('id', transactionId)
        .eq('buyer_id', buyerId)
        .single()

      if (error) throw error

      const row = data as any
      const seller = row.seller
      const sellerProfile = Array.isArray(seller?.user_profile) ? seller.user_profile[0] : seller?.user_profile
      const photos: any[] = Array.isArray(row.listing?.listing_photos) ? row.listing.listing_photos : []
      const primaryPhoto = photos.sort((a: any, b: any) => a.display_order - b.display_order)[0]

      let sellerPaypal: string | null = null
      let sellerRevolut: string | null = null
      const raw: string | null = sellerProfile?.payment_instructions ?? null
      if (raw) {
        try {
          const parsed = JSON.parse(raw)
          sellerPaypal = parsed.paypal ?? null
          sellerRevolut = parsed.revolut ?? null
        } catch {
          sellerPaypal = raw
        }
      }

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
        concernRaisedAt: row.concern_raised_at,
        createdAt: row.created_at,
        sellerName: seller ? `${seller.first_name} ${seller.last_name_initial}.` : 'Seller',
        sellerFirstName: seller?.first_name ?? 'the seller',
        sellerPaypal,
        sellerRevolut,
        itemName: row.listing?.subcategories?.name ?? 'Item',
        photoUrl: primaryPhoto?.url ?? null,
      }
    },
  })
}

// ── Status timeline ──────────────────────────────────────────

const STEPS = [
  { key: 'pending_payment', label: 'Order placed' },
  { key: 'paid',            label: 'Payment confirmed' },
  { key: 'dispatched',      label: 'Dispatched' },
  { key: 'delivered',       label: 'Delivered' },
  { key: 'completed',       label: 'Complete' },
]

const STATUS_ORDER = ['pending_payment', 'paid', 'dispatched', 'delivered', 'concern_open', 'concern_resolved', 'completed']

function stepReached(status: string, stepKey: string): boolean {
  const statusIdx = STATUS_ORDER.indexOf(status)
  const stepIdx   = STATUS_ORDER.indexOf(stepKey)
  if (stepKey === 'completed') return status === 'completed'
  return statusIdx >= stepIdx
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

function formatCountdown(secs: number): string {
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

// ── Screen ────────────────────────────────────────────────────

export default function BuyerOrderDetail() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const theme = useTheme()
  const router = useRouter()
  const { identity } = useAuthStore()
  const queryClient = useQueryClient()
  const s = makeStyles(theme)

  const { data: order, isLoading, error } = useOrderDetail(id ?? '', identity?.id ?? '')
  const [confirming, setConfirming] = useState(false)
  const [copied, setCopied] = useState(false)
  const [paySecondsLeft, setPaySecondsLeft] = useState<number | null>(null)
  const payExpiredRef = useRef(false)

  useEffect(() => {
    if (!order || order.status !== 'pending_payment') { setPaySecondsLeft(null); return }
    const expiry = new Date(order.createdAt).getTime() + 20 * 60 * 1000
    const calc = () => Math.max(0, Math.floor((expiry - Date.now()) / 1000))
    setPaySecondsLeft(calc())
    payExpiredRef.current = false
    const timer = setInterval(() => {
      const left = calc()
      setPaySecondsLeft(left)
      if (left === 0 && !payExpiredRef.current) {
        payExpiredRef.current = true
        queryClient.invalidateQueries({ queryKey: ['order_buyer', order.id] })
        queryClient.invalidateQueries({ queryKey: ['my_purchases'] })
        queryClient.invalidateQueries({ queryKey: ['order_counts'] })
      }
    }, 1000)
    return () => clearInterval(timer)
  }, [order?.id, order?.status, order?.createdAt])

  // Lazily close concern window when buyer views this screen after window expires
  useEffect(() => {
    if (!order || order.status !== 'delivered') return
    if (!order.concernWindowClosesAt || new Date(order.concernWindowClosesAt) > new Date()) return
    if (order.concernRaisedAt) return
    ;(supabase as any).rpc('close_concern_window', { p_transaction_id: order.id })
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ['order_buyer', order.id] })
        queryClient.invalidateQueries({ queryKey: ['order_seller', order.id] })
        queryClient.invalidateQueries({ queryKey: ['my_purchases'] })
        queryClient.invalidateQueries({ queryKey: ['my_sales'] })
        queryClient.invalidateQueries({ queryKey: ['order_counts'] })
      })
  }, [order?.id, order?.status, order?.concernWindowClosesAt])

  if (isLoading) {
    return (
      <SafeAreaView style={[s.root, { backgroundColor: theme.background }]} edges={['top']}>
        <ActivityIndicator style={s.loader} color={theme.accent} size="large" />
      </SafeAreaView>
    )
  }

  if (error || !order) {
    return (
      <SafeAreaView style={[s.root, { backgroundColor: theme.background }]} edges={['top']}>
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

  const withinConcernWindow = order.concernWindowClosesAt != null
    && new Date(order.concernWindowClosesAt) > new Date()

  const canConfirmDelivery = order.status === 'dispatched' && !order.buyerConfirmedDeliveredAt
  const canRaiseConcern   = order.status === 'delivered' && withinConcernWindow && !order.concernRaisedAt

  const handleCopy = () => {
    if (!order.paymentReference) return
    Clipboard.setString(order.paymentReference)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleConfirmDelivery = () => {
    Alert.alert(
      'Confirm received',
      'Confirm you have received this item. You will have 48 hours to raise a concern if there is a problem.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setConfirming(true)
            const now = new Date()
            const windowCloses = new Date(now.getTime() + 48 * 60 * 60 * 1000)
            await (supabase as any)
              .from('transactions')
              .update({
                status: 'delivered',
                buyer_confirmed_delivered_at: now.toISOString(),
                concern_window_started_at: now.toISOString(),
                concern_window_closes_at: windowCloses.toISOString(),
              })
              .eq('id', order.id)
            setConfirming(false)
            queryClient.invalidateQueries({ queryKey: ['order_buyer', order.id] })
            queryClient.invalidateQueries({ queryKey: ['order_seller', order.id] })
            queryClient.invalidateQueries({ queryKey: ['my_purchases'] })
            queryClient.invalidateQueries({ queryKey: ['my_sales'] })
            queryClient.invalidateQueries({ queryKey: ['order_counts'] })
          },
        },
      ]
    )
  }

  return (
    <SafeAreaView style={[s.root, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
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

      <ScrollView contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>

        {/* Status timeline */}
        <StatusTimeline status={order.status} theme={theme} s={s} />

        {/* Item card */}
        <View style={[s.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={s.itemRow}>
            <Image
              source={order.photoUrl ? { uri: order.photoUrl } : null}
              style={[s.itemPhoto, { backgroundColor: theme.background }]}
              contentFit="cover"
            />
            <View style={s.itemInfo}>
              <Text style={[s.itemName, { color: theme.text, fontFamily: 'CormorantGaramond_700Bold' }]} numberOfLines={2}>
                {order.itemName}
              </Text>
              <Text style={[s.itemSeller, { color: theme.textSecondary, fontFamily: 'Inter_400Regular' }]}>
                from {order.sellerName}
              </Text>
              <Text style={[s.itemDate, { color: theme.textDisabled, fontFamily: 'Inter_400Regular' }]}>
                Ordered {fmtDate(order.createdAt)}
              </Text>
            </View>
          </View>
          <View style={[s.divider, { backgroundColor: theme.border }]} />
          <View style={s.priceRow}>
            <Text style={[s.totalLabel, { color: theme.text, fontFamily: 'Inter_600SemiBold' }]}>Total</Text>
            <Text style={[s.totalValue, { color: theme.text, fontFamily: 'Inter_600SemiBold' }]}>{formatGbp(order.totalPaidPence)}</Text>
          </View>
        </View>

        {/* Payment reminder — only while awaiting payment */}
        {order.status === 'pending_payment' && (
          <>
            <Text style={[s.sectionLabel, { color: theme.textDisabled, fontFamily: 'Inter_500Medium' }]}>
              {order.buyerPaymentClaimedAt ? 'PAYMENT SENT' : 'PAYMENT DUE'}
            </Text>
            <View style={[s.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              {paySecondsLeft !== null && (
                <View style={[s.countdownRow, {
                  backgroundColor: paySecondsLeft <= 120 ? theme.error + '15' : theme.gold + '15',
                  borderColor: paySecondsLeft <= 120 ? theme.error : theme.gold,
                }]}>
                  <IconClock size={14} color={paySecondsLeft <= 120 ? theme.error : theme.gold} />
                  <Text style={[s.countdownText, {
                    color: paySecondsLeft <= 120 ? theme.error : theme.gold,
                    fontFamily: 'Inter_600SemiBold',
                  }]}>
                    {paySecondsLeft > 0
                      ? `${formatCountdown(paySecondsLeft)} left to pay — item reserved for you`
                      : 'Reservation expired — item may no longer be available'}
                  </Text>
                </View>
              )}
              <Text style={[s.payNote, { color: theme.textSecondary, fontFamily: 'Inter_400Regular' }]}>
                Transfer {formatGbp(order.totalPaidPence)} to {order.sellerFirstName} and include this reference:
              </Text>
              <TouchableOpacity style={[s.refBox, { borderColor: theme.accent }]} onPress={handleCopy} activeOpacity={0.7}>
                <Text style={[s.refText, { color: theme.accent, fontFamily: 'Inter_600SemiBold' }]}>{order.paymentReference}</Text>
                {copied ? <IconCheck size={16} color={theme.accent} /> : <IconCopy size={16} color={theme.accent} />}
              </TouchableOpacity>

              {order.sellerPaypal && (
                <View style={[s.methodBlock, { borderColor: theme.border }]}>
                  <Text style={[s.methodLabel, { color: theme.textDisabled, fontFamily: 'Inter_500Medium' }]}>PAYPAL</Text>
                  <Text style={[s.methodValue, { color: theme.text, fontFamily: 'Inter_600SemiBold' }]}>{order.sellerPaypal}</Text>
                  <View style={[s.ffHint, { backgroundColor: theme.gold + '15', borderColor: theme.gold }]}>
                    <IconInfoCircle size={13} color={theme.gold} />
                    <Text style={[s.ffText, { color: theme.text, fontFamily: 'Inter_600SemiBold' }]}>Send as Friends &amp; Family</Text>
                  </View>
                </View>
              )}

              {order.sellerPaypal && order.sellerRevolut && (
                <Text style={[s.orDivider, { color: theme.textDisabled, fontFamily: 'Inter_400Regular' }]}>— or —</Text>
              )}

              {order.sellerRevolut && (
                <View style={[s.methodBlock, { borderColor: theme.border }]}>
                  <Text style={[s.methodLabel, { color: theme.textDisabled, fontFamily: 'Inter_500Medium' }]}>REVOLUT</Text>
                  <Text style={[s.methodValue, { color: theme.text, fontFamily: 'Inter_600SemiBold' }]}>@{order.sellerRevolut}</Text>
                </View>
              )}

              <Text style={[s.payNote, { color: theme.textDisabled, fontFamily: 'Inter_400Regular', marginTop: 8 }]}>
                Once {order.sellerFirstName} receives payment they will confirm it and your order will progress.
              </Text>
            </View>
          </>
        )}

        {/* Tracking — when dispatched */}
        {order.trackingNumber && (
          <>
            <Text style={[s.sectionLabel, { color: theme.textDisabled, fontFamily: 'Inter_500Medium' }]}>TRACKING</Text>
            <View style={[s.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[s.trackingLabel, { color: theme.textSecondary, fontFamily: 'Inter_400Regular' }]}>Tracking number</Text>
              <Text style={[s.trackingNumber, { color: theme.text, fontFamily: 'Inter_600SemiBold' }]}>{order.trackingNumber}</Text>
              {order.dispatchedAt && (
                <Text style={[s.trackingDate, { color: theme.textDisabled, fontFamily: 'Inter_400Regular' }]}>
                  Dispatched {fmtDate(order.dispatchedAt)}
                </Text>
              )}
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

        {/* Concern window countdown */}
        {order.status === 'delivered' && withinConcernWindow && (
          <View style={[s.windowBanner, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[s.windowText, { color: theme.textSecondary, fontFamily: 'Inter_400Regular' }]}>
              You have until {fmtDate(order.concernWindowClosesAt!)} to raise a concern if there is a problem.
            </Text>
          </View>
        )}

        <View style={s.spacer} />
      </ScrollView>

      {/* Action buttons */}
      {(order.status === 'pending_payment' || canConfirmDelivery || canRaiseConcern) && (
        <View style={[s.footer, { borderTopColor: theme.border, backgroundColor: theme.background }]}>
          {order.status === 'pending_payment' && !order.buyerPaymentClaimedAt && (
            <TouchableOpacity
              style={[s.actionBtn, { backgroundColor: theme.accent }]}
              onPress={async () => {
                await (supabase as any)
                  .from('transactions')
                  .update({ buyer_payment_claimed_at: new Date().toISOString() })
                  .eq('id', order.id)
                queryClient.invalidateQueries({ queryKey: ['order_buyer', order.id] })
                queryClient.invalidateQueries({ queryKey: ['my_purchases'] })
                Alert.alert(
                  'Thanks for sending payment!',
                  `Once ${order.sellerFirstName} confirms they've received it, your order will progress automatically.`,
                  [{ text: 'OK' }]
                )
              }}
              activeOpacity={0.85}
            >
              <Text style={[s.actionBtnText, { color: theme.accentText, fontFamily: 'Inter_600SemiBold' }]}>
                Done — I've sent payment
              </Text>
            </TouchableOpacity>
          )}
          {order.status === 'pending_payment' && !!order.buyerPaymentClaimedAt && (
            <View style={[s.actionBtn, s.claimedBanner, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[s.actionBtnText, { color: theme.textSecondary, fontFamily: 'Inter_500Medium' }]}>
                Payment sent — waiting for {order.sellerFirstName} to confirm
              </Text>
            </View>
          )}
          {canConfirmDelivery && (
            <TouchableOpacity
              style={[s.actionBtn, { backgroundColor: theme.accent }]}
              onPress={handleConfirmDelivery}
              disabled={confirming}
              activeOpacity={0.85}
            >
              {confirming
                ? <ActivityIndicator color={theme.accentText} size="small" />
                : <Text style={[s.actionBtnText, { color: theme.accentText, fontFamily: 'Inter_600SemiBold' }]}>
                    Confirm received
                  </Text>
              }
            </TouchableOpacity>
          )}
          {canRaiseConcern && (
            <TouchableOpacity
              style={[s.actionBtn, s.concernBtn, { borderColor: theme.error }]}
              onPress={() => router.push(`/transaction/${order.id}/concern` as any)}
              activeOpacity={0.85}
            >
              <Text style={[s.actionBtnText, { color: theme.error, fontFamily: 'Inter_600SemiBold' }]}>
                Raise a concern
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </SafeAreaView>
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

    body: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 24 },

    // Timeline
    timeline:     { marginBottom: 28 },
    timelineStep: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, minHeight: 36 },
    timelineLeft: { alignItems: 'center', width: 16 },
    timelineDot:  { width: 14, height: 14, borderRadius: 7, borderWidth: 2, marginTop: 2 },
    timelineLine: { width: 2, flex: 1, marginTop: 2, minHeight: 20 },
    timelineLabel:{ fontSize: 14, paddingBottom: 8 },
    concernBanner:{ marginTop: 12, borderRadius: 8, borderWidth: 1, padding: 12 },
    concernText:  { fontSize: 13 },

    // Cards
    card:     { borderRadius: 12, borderWidth: 1, padding: 16, marginBottom: 24 },
    itemRow:  { flexDirection: 'row', gap: 14, marginBottom: 14 },
    itemPhoto:{ width: 70, height: 90, borderRadius: 8 },
    itemInfo: { flex: 1, gap: 4 },
    itemName: { fontSize: 20, lineHeight: 24 },
    itemSeller:{ fontSize: 12 },
    itemDate: { fontSize: 11, marginTop: 2 },

    divider:    { height: StyleSheet.hairlineWidth, marginVertical: 10 },
    priceRow:   { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 3 },
    priceLabel: { fontSize: 14 },
    priceValue: { fontSize: 14 },
    totalLabel: { fontSize: 15 },
    totalValue: { fontSize: 15 },

    sectionLabel: { fontSize: 10, letterSpacing: 0.8, marginBottom: 8 },

    countdownRow: { flexDirection: 'row', alignItems: 'center', gap: 7, borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, marginBottom: 14 },
    countdownText: { flex: 1, fontSize: 13, lineHeight: 18 },

    payNote:    { fontSize: 13, lineHeight: 20, marginBottom: 12 },
    refBox:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1.5, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 12 },
    refText:    { fontSize: 18, letterSpacing: 0.8 },

    methodBlock: { borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 8 },
    methodLabel: { fontSize: 10, letterSpacing: 0.8, marginBottom: 4 },
    methodValue: { fontSize: 15, marginBottom: 8 },
    ffHint:      { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 6 },
    ffText:      { fontSize: 12 },
    orDivider:   { textAlign: 'center', fontSize: 12, marginVertical: 6 },

    trackingLabel:  { fontSize: 12, marginBottom: 4 },
    trackingNumber: { fontSize: 16, marginBottom: 4 },
    trackingDate:   { fontSize: 12 },

    windowBanner: { borderRadius: 10, borderWidth: 1, padding: 14, marginBottom: 16 },
    windowText:   { fontSize: 13, lineHeight: 19 },

    lostLink:     { borderWidth: 1, borderRadius: 10, padding: 14, alignItems: 'center', marginBottom: 8 },
    lostLinkText: { fontSize: 13 },

    spacer: { height: 16 },

    footer: {
      paddingHorizontal: 20, paddingVertical: 14,
      borderTopWidth: StyleSheet.hairlineWidth,
      gap: 10,
    },
    actionBtn:     { borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
    concernBtn:    { backgroundColor: 'transparent', borderWidth: 1.5 },
    claimedBanner: { borderWidth: 1 },
    actionBtnText: { fontSize: 15 },
  })
}
