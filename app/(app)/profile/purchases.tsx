import { useState, useMemo } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Image } from 'expo-image'
import { IconArrowLeft } from '@tabler/icons-react-native'
import { supabase } from '@/lib/supabase'
import { useTheme } from '@/hooks/useTheme'
import { useAuthStore } from '@/store/auth'
import type { Theme } from '@/constants/theme'

// S22 — My purchases (buyer view)

const ACTIVE_STATUSES = ['pending_payment', 'paid', 'dispatched', 'delivered', 'concern_open', 'concern_resolved']
const DONE_STATUSES   = ['completed', 'refunded', 'cancelled']

const STATUS_LABELS: Record<string, string> = {
  pending_payment:  'Awaiting payment',
  paid:             'Payment confirmed',
  dispatched:       'Dispatched',
  delivered:        'Delivered',
  concern_open:     'Concern raised',
  concern_resolved: 'Concern resolved',
  completed:        'Completed',
  refunded:         'Refunded',
  cancelled:        'Cancelled',
}

function statusColour(status: string, theme: Theme): string {
  switch (status) {
    case 'pending_payment':  return theme.gold
    case 'paid':             return theme.success
    case 'dispatched':       return theme.accent
    case 'delivered':        return theme.accent
    case 'concern_open':     return theme.error
    case 'completed':        return theme.gold
    default:                 return theme.textDisabled
  }
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatGbp(pence: number): string {
  return `£${(pence / 100).toFixed(2)}`
}

interface TxRow {
  id: string
  status: string
  total_paid_pence: number
  payment_reference: string | null
  created_at: string
  sellerName: string
  itemName: string
  photoUrl: string | null
}

function usePurchases(userId: string) {
  return useQuery<TxRow[]>({
    queryKey: ['my_purchases', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('transactions')
        .select(`
          id, status, total_paid_pence, payment_reference, created_at,
          seller:user_identity!seller_id ( first_name, last_name_initial ),
          listing:listings!listing_id (
            subcategories ( name ),
            listing_photos ( url, display_order )
          )
        `)
        .eq('buyer_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error

      return (data ?? []).map((row: any): TxRow => {
        const seller = row.seller
        const photos: any[] = Array.isArray(row.listing?.listing_photos) ? row.listing.listing_photos : []
        const primaryPhoto = photos.sort((a: any, b: any) => a.display_order - b.display_order)[0]
        return {
          id: row.id,
          status: row.status,
          total_paid_pence: row.total_paid_pence,
          payment_reference: row.payment_reference,
          created_at: row.created_at,
          sellerName: seller ? `${seller.first_name} ${seller.last_name_initial}.` : 'Seller',
          itemName: row.listing?.subcategories?.name ?? 'Item',
          photoUrl: primaryPhoto?.url ?? null,
        }
      })
    },
  })
}

export default function MyPurchases() {
  const theme = useTheme()
  const router = useRouter()
  const { identity } = useAuthStore()
  const s = makeStyles(theme)
  const qc = useQueryClient()
  const [tab, setTab] = useState<'active' | 'done'>('active')
  const [refreshing, setRefreshing] = useState(false)
  const { data: transactions = [], isLoading } = usePurchases(identity?.id ?? '')

  const onRefresh = async () => {
    setRefreshing(true)
    await qc.invalidateQueries({ queryKey: ['my_purchases'] })
    await qc.invalidateQueries({ queryKey: ['order_counts'] })
    setRefreshing(false)
  }

  const filtered = useMemo(() => {
    const statuses = tab === 'active' ? ACTIVE_STATUSES : DONE_STATUSES
    return transactions.filter(t => statuses.includes(t.status))
  }, [transactions, tab])

  return (
    <SafeAreaView style={[s.root, { backgroundColor: theme.background }]} edges={['top']}>
      {/* Nav */}
      <View style={[s.nav, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <IconArrowLeft size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={[s.navTitle, { color: theme.text, fontFamily: 'Inter_600SemiBold' }]}>My purchases</Text>
        <View style={s.navSpacer} />
      </View>

      {/* Tabs */}
      <View style={[s.tabRow, { borderBottomColor: theme.border }]}>
        {(['active', 'done'] as const).map(t => (
          <TouchableOpacity
            key={t}
            style={[s.tab, tab === t && { borderBottomColor: theme.accent, borderBottomWidth: 2 }]}
            onPress={() => setTab(t)}
            activeOpacity={0.7}
          >
            <Text style={[s.tabText, { color: tab === t ? theme.accent : theme.textSecondary, fontFamily: tab === t ? 'Inter_600SemiBold' : 'Inter_400Regular' }]}>
              {t === 'active' ? 'Active' : 'Done'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <ActivityIndicator style={s.loader} color={theme.accent} size="large" />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} />}
          ItemSeparatorComponent={() => <View style={[s.separator, { backgroundColor: theme.border }]} />}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={s.row}
              onPress={() => router.push(`/transaction/${item.id}/buyer` as any)}
              activeOpacity={0.7}
            >
              <Image
                source={item.photoUrl ? { uri: item.photoUrl } : null}
                style={[s.photo, { backgroundColor: theme.surface }]}
                contentFit="cover"
              />
              <View style={s.rowBody}>
                <View style={s.rowMain}>
                  <View style={s.rowLeft}>
                    <Text style={[s.itemName, { color: theme.text, fontFamily: 'CormorantGaramond_700Bold' }]} numberOfLines={1}>
                      {item.itemName}
                    </Text>
                    <Text style={[s.counterparty, { color: theme.textSecondary, fontFamily: 'Inter_400Regular' }]} numberOfLines={1}>
                      from {item.sellerName}
                    </Text>
                    <Text style={[s.price, { color: theme.text, fontFamily: 'Inter_600SemiBold' }]}>
                      {formatGbp(item.total_paid_pence)}
                    </Text>
                  </View>
                  <View style={s.rightCol}>
                    <View style={[s.statusBadge, { borderColor: statusColour(item.status, theme) }]}>
                      <Text style={[s.statusText, { color: statusColour(item.status, theme), fontFamily: 'Inter_500Medium' }]}>
                        {STATUS_LABELS[item.status] ?? item.status}
                      </Text>
                    </View>
                    {item.status === 'pending_payment' && (() => {
                      const minsLeft = Math.max(0, Math.floor((new Date(item.created_at).getTime() + 20 * 60 * 1000 - Date.now()) / 60000))
                      return (
                        <Text style={[s.payTimer, { color: minsLeft > 0 ? theme.gold : theme.error, fontFamily: 'Inter_400Regular' }]}>
                          {minsLeft > 0 ? `${minsLeft}m left` : 'Expired'}
                        </Text>
                      )
                    })()}
                    <Text style={[s.date, { color: theme.textDisabled, fontFamily: 'Inter_400Regular' }]}>
                      {fmtDate(item.created_at)}
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={[s.emptyText, { color: theme.textSecondary, fontFamily: 'CormorantGaramond_400Regular_Italic' }]}>
              {tab === 'active' ? 'No active orders.' : 'No completed orders yet.'}
            </Text>
          }
        />
      )}
    </SafeAreaView>
  )
}

function makeStyles(theme: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    root:      { flex: 1 },
    loader:    { flex: 1 },
    nav: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 16, paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
    },
    navTitle:  { flex: 1, textAlign: 'center', fontSize: 16 },
    navSpacer: { width: 22 },

    tabRow: {
      flexDirection: 'row',
      borderBottomWidth: StyleSheet.hairlineWidth,
    },
    tab:     { flex: 1, alignItems: 'center', paddingVertical: 12 },
    tabText: { fontSize: 14 },

    list:      { paddingVertical: 8 },
    separator: { height: StyleSheet.hairlineWidth, marginLeft: 88 },

    row: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      paddingHorizontal: 16,
      paddingVertical: 14,
      gap: 14,
    },
    photo: {
      width: 62,
      height: 80,
      borderRadius: 8,
    },
    rowBody:      { flex: 1 },
    rowMain:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
    rowLeft:      { flex: 1, gap: 3 },
    itemName:     { fontSize: 18, lineHeight: 22 },
    counterparty: { fontSize: 12 },
    price:        { fontSize: 15, marginTop: 2 },
    rightCol:     { alignItems: 'flex-end', gap: 3 },
    statusBadge:  { borderRadius: 4, borderWidth: 1, paddingHorizontal: 7, paddingVertical: 2 },
    statusText:   { fontSize: 11 },
    payTimer:     { fontSize: 11 },
    date:         { fontSize: 11 },

    emptyText:    { textAlign: 'center', fontSize: 18, paddingTop: 60, paddingHorizontal: 32 },
  })
}
