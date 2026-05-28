import { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView, Clipboard } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { IconCopy, IconCheck, IconInfoCircle, IconClock } from '@tabler/icons-react-native'
import { supabase } from '@/lib/supabase'
import { useTheme } from '@/hooks/useTheme'

function usePaymentInstructions(transactionId: string) {
  return useQuery({
    queryKey: ['payment_instructions', transactionId],
    enabled: !!transactionId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('transactions')
        .select(`
          id,
          payment_reference,
          sale_price_pence,
          postage_price_pence,
          total_paid_pence,
          seller:user_identity!seller_id (
            first_name,
            last_name_initial,
            user_profile ( payment_instructions )
          ),
          listing:listings!listing_id (
            reserved_until,
            subcategories ( name )
          )
        `)
        .eq('id', transactionId)
        .single()

      if (error) throw error

      const row = data as any
      const seller = row.seller
      const sellerProfile = Array.isArray(seller?.user_profile)
        ? seller.user_profile[0]
        : seller?.user_profile
      const listing = Array.isArray(row.listing) ? row.listing[0] : row.listing

      let paypal: string | null = null
      let revolut: string | null = null
      const raw: string | null = sellerProfile?.payment_instructions ?? null
      if (raw) {
        try {
          const parsed = JSON.parse(raw)
          paypal = parsed.paypal ?? null
          revolut = parsed.revolut ?? null
        } catch {
          // legacy free text — show as-is in paypal slot
          paypal = raw
        }
      }

      return {
        paymentReference: row.payment_reference as string,
        salePricePence: row.sale_price_pence as number,
        postagePricePence: row.postage_price_pence as number,
        totalPaidPence: row.total_paid_pence as number,
        sellerFirstName: seller?.first_name ?? 'the seller',
        sellerName: seller ? `${seller.first_name} ${seller.last_name_initial}.` : 'Seller',
        paypal,
        revolut,
        itemName: listing?.subcategories?.name as string ?? 'Item',
        reservedUntil: listing?.reserved_until as string | null ?? null,
      }
    },
  })
}

function formatGbp(pence: number): string {
  return `£${(pence / 100).toFixed(2)}`
}

function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function useCountdown(reservedUntil: string | null) {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null)

  useEffect(() => {
    if (!reservedUntil) return
    const target = new Date(reservedUntil).getTime()
    const calc = () => Math.max(0, Math.floor((target - Date.now()) / 1000))
    setSecondsLeft(calc())
    const id = setInterval(() => {
      const remaining = calc()
      setSecondsLeft(remaining)
      if (remaining <= 0) clearInterval(id)
    }, 1000)
    return () => clearInterval(id)
  }, [reservedUntil])

  return secondsLeft
}

export default function PaymentInstructions() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const theme = useTheme()
  const router = useRouter()
  const s = makeStyles(theme)
  const { data, isLoading, error } = usePaymentInstructions(id ?? '')
  const [copied, setCopied] = useState(false)
  const secondsLeft = useCountdown(data?.reservedUntil ?? null)

  const handleCopy = () => {
    if (!data?.paymentReference) return
    Clipboard.setString(data.paymentReference)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDone = () => router.replace('/' as any)

  if (isLoading) {
    return (
      <SafeAreaView style={[s.root, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
        <ActivityIndicator style={s.loader} color={theme.accent} size="large" />
      </SafeAreaView>
    )
  }

  if (error || !data) {
    return (
      <SafeAreaView style={[s.root, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
        <Text style={[s.errorText, { color: theme.textSecondary, fontFamily: 'Inter_400Regular' }]}>
          Order placed but could not load details. Check My Purchases.
        </Text>
        <TouchableOpacity style={[s.doneBtn, { backgroundColor: theme.accent }]} onPress={handleDone}>
          <Text style={[s.doneBtnText, { color: theme.accentText, fontFamily: 'Inter_600SemiBold' }]}>Go home</Text>
        </TouchableOpacity>
      </SafeAreaView>
    )
  }

  const expired = secondsLeft !== null && secondsLeft <= 0
  const hasPostage = (data.postagePricePence ?? 0) > 0
  const hasPaypal = !!data.paypal
  const hasRevolut = !!data.revolut
  const hasAnyMethod = hasPaypal || hasRevolut

  return (
    <SafeAreaView style={[s.root, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>

        {/* Countdown banner */}
        {secondsLeft !== null && (
          <View style={[
            s.countdownBanner,
            { backgroundColor: expired ? theme.error + '18' : theme.gold + '18', borderColor: expired ? theme.error : theme.gold }
          ]}>
            <IconClock size={16} color={expired ? theme.error : theme.gold} />
            <Text style={[s.countdownText, { color: expired ? theme.error : theme.text, fontFamily: 'Inter_600SemiBold' }]}>
              {expired
                ? 'Reservation expired — please contact the seller'
                : `Held for you for ${formatCountdown(secondsLeft)}`
              }
            </Text>
          </View>
        )}

        {/* Heading */}
        <Text style={[s.heading, { color: theme.text, fontFamily: 'CormorantGaramond_700Bold' }]}>
          Almost there
        </Text>
        <Text style={[s.subheading, { color: theme.textSecondary, fontFamily: 'Inter_400Regular' }]}>
          Transfer the amount below to {data.sellerFirstName} and your order will be confirmed once they receive it.
        </Text>

        {/* Scarcity */}
        <Text style={[s.scarcity, { color: theme.textSecondary, fontFamily: 'Inter_400Regular_Italic' }]}>
          This is the only one — once it's gone, it's gone.
        </Text>

        {/* Price breakdown */}
        <View style={[s.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[s.itemName, { color: theme.text, fontFamily: 'CormorantGaramond_700Bold' }]}>
            {data.itemName}
          </Text>
          <View style={[s.divider, { backgroundColor: theme.border }]} />
          <View style={s.priceRow}>
            <Text style={[s.priceLabel, { color: theme.textSecondary, fontFamily: 'Inter_400Regular' }]}>Item</Text>
            <Text style={[s.priceValue, { color: theme.text, fontFamily: 'Inter_400Regular' }]}>{formatGbp(data.salePricePence)}</Text>
          </View>
          {hasPostage && (
            <View style={s.priceRow}>
              <Text style={[s.priceLabel, { color: theme.textSecondary, fontFamily: 'Inter_400Regular' }]}>Postage</Text>
              <Text style={[s.priceValue, { color: theme.text, fontFamily: 'Inter_400Regular' }]}>{formatGbp(data.postagePricePence)}</Text>
            </View>
          )}
          <View style={[s.divider, { backgroundColor: theme.border }]} />
          <View style={s.priceRow}>
            <Text style={[s.totalLabel, { color: theme.text, fontFamily: 'Inter_600SemiBold' }]}>Total</Text>
            <Text style={[s.totalValue, { color: theme.text, fontFamily: 'Inter_600SemiBold' }]}>{formatGbp(data.totalPaidPence)}</Text>
          </View>
        </View>

        {/* Payment reference */}
        <Text style={[s.sectionLabel, { color: theme.textDisabled, fontFamily: 'Inter_500Medium' }]}>
          PAYMENT REFERENCE
        </Text>
        <TouchableOpacity
          style={[s.referenceBox, { backgroundColor: theme.surface, borderColor: theme.accent }]}
          onPress={handleCopy}
          activeOpacity={0.7}
        >
          <Text style={[s.referenceText, { color: theme.accent, fontFamily: 'Inter_600SemiBold' }]}>
            {data.paymentReference}
          </Text>
          {copied ? <IconCheck size={18} color={theme.accent} /> : <IconCopy size={18} color={theme.accent} />}
        </TouchableOpacity>
        <Text style={[s.referenceHint, { color: theme.textDisabled, fontFamily: 'Inter_400Regular' }]}>
          Include this reference so {data.sellerFirstName} can identify your payment.
        </Text>

        {/* Payment methods */}
        <Text style={[s.sectionLabel, { color: theme.textDisabled, fontFamily: 'Inter_500Medium' }]}>
          SEND PAYMENT TO
        </Text>

        {hasAnyMethod ? (
          <>
            {hasPaypal && (
              <View style={[s.methodCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Text style={[s.methodLabel, { color: theme.textDisabled, fontFamily: 'Inter_500Medium' }]}>
                  PAYPAL
                </Text>
                <Text style={[s.methodValue, { color: theme.text, fontFamily: 'Inter_600SemiBold' }]}>
                  {data.paypal}
                </Text>
                {/* F&F strong hint */}
                <View style={[s.ffWarning, { backgroundColor: theme.gold + '15', borderColor: theme.gold }]}>
                  <IconInfoCircle size={14} color={theme.gold} />
                  <Text style={[s.ffText, { color: theme.text, fontFamily: 'Inter_400Regular' }]}>
                    <Text style={{ fontFamily: 'Inter_600SemiBold' }}>Send as "Friends &amp; Family" — not "Goods &amp; Services".</Text>
                    {' '}In PayPal, tap{' '}
                    <Text style={{ fontFamily: 'Inter_600SemiBold' }}>"Send to a friend"</Text>
                    {' '}when choosing payment type. Goods &amp; Services adds a fee for the seller and creates a separate PayPal dispute process that bypasses Almari's buyer protection.
                  </Text>
                </View>
              </View>
            )}

            {hasPaypal && hasRevolut && (
              <Text style={[s.orDivider, { color: theme.textDisabled, fontFamily: 'Inter_400Regular' }]}>
                — or —
              </Text>
            )}

            {hasRevolut && (
              <View style={[s.methodCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Text style={[s.methodLabel, { color: theme.textDisabled, fontFamily: 'Inter_500Medium' }]}>
                  REVOLUT
                </Text>
                <Text style={[s.methodValue, { color: theme.text, fontFamily: 'Inter_600SemiBold' }]}>
                  @{data.revolut}
                </Text>
              </View>
            )}
          </>
        ) : (
          <View style={[s.methodCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[s.noMethodText, { color: theme.textSecondary, fontFamily: 'Inter_400Regular_Italic' }]}>
              Contact {data.sellerName} directly to arrange payment.
            </Text>
          </View>
        )}

        <View style={[s.noteBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[s.noteText, { color: theme.textSecondary, fontFamily: 'Inter_400Regular' }]}>
            Your order will be confirmed once {data.sellerFirstName} marks payment received. You can track progress under My Purchases.
          </Text>
        </View>

      </ScrollView>

      <View style={[s.footer, { borderTopColor: theme.border, backgroundColor: theme.background }]}>
        <TouchableOpacity
          style={[s.doneBtn, { backgroundColor: theme.accent }]}
          onPress={handleDone}
          activeOpacity={0.85}
        >
          <Text style={[s.doneBtnText, { color: theme.accentText, fontFamily: 'Inter_600SemiBold' }]}>
            Done — I've sent payment
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

function makeStyles(theme: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    root:      { flex: 1 },
    loader:    { flex: 1 },
    errorText: { flex: 1, textAlign: 'center', marginTop: 80, fontSize: 15, paddingHorizontal: 24 },

    body: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 24 },

    countdownBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      borderWidth: 1,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 10,
      marginBottom: 20,
    },
    countdownText: { fontSize: 14 },

    heading:    { fontSize: 34, lineHeight: 40, marginBottom: 8 },
    subheading: { fontSize: 14, lineHeight: 21, marginBottom: 10 },
    scarcity:   { fontSize: 13, lineHeight: 20, marginBottom: 24 },

    card: {
      borderRadius: 12,
      borderWidth: 1,
      padding: 16,
      marginBottom: 24,
    },
    itemName:   { fontSize: 22, lineHeight: 28, marginBottom: 12 },
    divider:    { height: StyleSheet.hairlineWidth, marginVertical: 10 },
    priceRow:   { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 3 },
    priceLabel: { fontSize: 14 },
    priceValue: { fontSize: 14 },
    totalLabel: { fontSize: 15 },
    totalValue: { fontSize: 15 },

    sectionLabel: { fontSize: 10, letterSpacing: 0.8, marginBottom: 8 },

    referenceBox: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderRadius: 10,
      borderWidth: 1.5,
      paddingHorizontal: 16,
      paddingVertical: 14,
      marginBottom: 8,
    },
    referenceText: { fontSize: 20, letterSpacing: 1 },
    referenceHint: { fontSize: 12, lineHeight: 18, marginBottom: 24 },

    methodCard: {
      borderRadius: 12,
      borderWidth: 1,
      padding: 16,
      marginBottom: 8,
    },
    methodLabel: { fontSize: 10, letterSpacing: 0.8, marginBottom: 6 },
    methodValue: { fontSize: 17, marginBottom: 12 },

    ffWarning: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
      borderWidth: 1,
      borderRadius: 8,
      padding: 10,
    },
    ffText: { flex: 1, fontSize: 12, lineHeight: 18 },

    orDivider: { textAlign: 'center', fontSize: 12, marginVertical: 8 },

    noMethodText: { fontSize: 14, lineHeight: 22 },

    noteBox: {
      borderRadius: 10,
      borderWidth: 1,
      padding: 14,
      marginTop: 8,
    },
    noteText: { fontSize: 12, lineHeight: 19 },

    footer: {
      paddingHorizontal: 24,
      paddingVertical: 16,
      borderTopWidth: StyleSheet.hairlineWidth,
    },
    doneBtn: {
      borderRadius: 12,
      paddingVertical: 15,
      alignItems: 'center',
    },
    doneBtnText: { fontSize: 15 },
  })
}
