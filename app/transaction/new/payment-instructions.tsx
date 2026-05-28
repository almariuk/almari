import { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView, Clipboard } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { IconCopy, IconCheck } from '@tabler/icons-react-native'
import { supabase } from '@/lib/supabase'
import { useTheme } from '@/hooks/useTheme'

// Payment instructions shown to buyer immediately after placing an order

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

      return {
        paymentReference: row.payment_reference as string,
        salePricePence: row.sale_price_pence as number,
        postagePricePence: row.postage_price_pence as number,
        totalPaidPence: row.total_paid_pence as number,
        sellerName: seller ? `${seller.first_name} ${seller.last_name_initial}.` : 'Seller',
        paymentInstructions: sellerProfile?.payment_instructions as string | null,
        itemName: row.listing?.subcategories?.name as string ?? 'Item',
      }
    },
  })
}

function formatGbp(pence: number): string {
  return `£${(pence / 100).toFixed(2)}`
}

export default function PaymentInstructions() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const theme = useTheme()
  const router = useRouter()
  const s = makeStyles(theme)
  const { data, isLoading, error } = usePaymentInstructions(id ?? '')
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    if (!data?.paymentReference) return
    Clipboard.setString(data.paymentReference)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDone = () => {
    router.replace('/' as any)
  }

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
          <Text style={[s.doneBtnText, { color: theme.accentText, fontFamily: 'Inter_600SemiBold' }]}>
            Go home
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    )
  }

  const hasPostage = (data.postagePricePence ?? 0) > 0

  return (
    <SafeAreaView style={[s.root, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>

        {/* Heading */}
        <Text style={[s.heading, { color: theme.text, fontFamily: 'CormorantGaramond_700Bold' }]}>
          Almost there
        </Text>
        <Text style={[s.subheading, { color: theme.textSecondary, fontFamily: 'Inter_400Regular' }]}>
          Transfer the amount below to {data.sellerName} and your order will be confirmed once they receive payment.
        </Text>

        {/* Item + price breakdown */}
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
          {copied
            ? <IconCheck size={18} color={theme.accent} />
            : <IconCopy size={18} color={theme.accent} />
          }
        </TouchableOpacity>
        <Text style={[s.referenceHint, { color: theme.textDisabled, fontFamily: 'Inter_400Regular' }]}>
          Include this reference with your payment so the seller can identify it.
        </Text>

        {/* Seller payment details */}
        <Text style={[s.sectionLabel, { color: theme.textDisabled, fontFamily: 'Inter_500Medium' }]}>
          SEND PAYMENT TO
        </Text>
        <View style={[s.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {data.paymentInstructions
            ? <Text style={[s.instructionsText, { color: theme.text, fontFamily: 'Inter_400Regular' }]}>
                {data.paymentInstructions}
              </Text>
            : <Text style={[s.instructionsText, { color: theme.textSecondary, fontFamily: 'Inter_400Regular_Italic' }]}>
                Contact {data.sellerName} directly to arrange payment.
              </Text>
          }
        </View>

        {/* Info note */}
        <View style={[s.noteBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[s.noteText, { color: theme.textSecondary, fontFamily: 'Inter_400Regular' }]}>
            Your order is reserved for 48 hours. The seller will mark it as confirmed once payment is received. You can track your order under My Purchases.
          </Text>
        </View>

      </ScrollView>

      {/* Done button */}
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
    root:   { flex: 1 },
    loader: { flex: 1 },
    errorText: { flex: 1, textAlign: 'center', marginTop: 80, fontSize: 15, paddingHorizontal: 24 },

    body: { paddingHorizontal: 24, paddingTop: 32, paddingBottom: 24 },

    heading:    { fontSize: 34, lineHeight: 40, marginBottom: 10 },
    subheading: { fontSize: 14, lineHeight: 21, marginBottom: 28 },

    card: {
      borderRadius: 12,
      borderWidth: 1,
      padding: 16,
      marginBottom: 24,
    },
    itemName: { fontSize: 22, lineHeight: 28, marginBottom: 12 },
    divider:  { height: StyleSheet.hairlineWidth, marginVertical: 10 },
    priceRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 3 },
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

    instructionsText: { fontSize: 14, lineHeight: 22 },

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
