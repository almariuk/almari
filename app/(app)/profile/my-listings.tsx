import { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { Image } from 'expo-image'
import { IconArrowLeft, IconChevronRight } from '@tabler/icons-react-native'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth'
import { useTheme } from '@/hooks/useTheme'

type Tab = 'active' | 'sold' | 'removed'

interface MyListing {
  id: string
  askingPricePence: number | null
  status: string
  subcategoryName: string
  primaryPhotoUrl: string | null
  createdAt: string
  removalReason: string | null
}

const TABS: { key: Tab; label: string }[] = [
  { key: 'active',  label: 'Active'  },
  { key: 'sold',    label: 'Sold'    },
  { key: 'removed', label: 'Removed' },
]

const STATUS_FILTER: Record<Tab, string[]> = {
  active:  ['active', 'reserved'],
  sold:    ['sold'],
  removed: ['removed'],
}

const EMPTY_TEXT: Record<Tab, string> = {
  active:  'No active listings. Start selling.',
  sold:    'No sales yet. Your first one is coming.',
  removed: 'No removed listings.',
}

const REMOVAL_LABELS: Record<string, string> = {
  changed_mind:    'Changed mind',
  sold_elsewhere:  'Sold elsewhere',
  mistake:         'Listed by mistake',
  damaged:         'Damaged',
  other:           'Other reason',
}

export default function MyListings() {
  const theme = useTheme()
  const router = useRouter()
  const { identity } = useAuthStore()
  const identityId = identity?.id ?? ''
  const [tab, setTab] = useState<Tab>('active')

  const s = makeStyles(theme)

  const { data, isLoading } = useQuery<MyListing[]>({
    queryKey: ['my_listings', identityId, tab],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('listings')
        .select(`
          id,
          asking_price_pence,
          status,
          created_at,
          removal_reason,
          listing_photos ( url, display_order ),
          subcategories ( name )
        `)
        .eq('seller_id', identityId)
        .in('status', STATUS_FILTER[tab])
        .order('created_at', { ascending: false })
      if (error) throw error
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (data ?? []).map((row: any): MyListing => {
        const photos = Array.isArray(row.listing_photos) ? row.listing_photos : []
        const primary = photos.sort((a: any, b: any) => a.display_order - b.display_order)[0]
        return {
          id:               row.id,
          askingPricePence: row.asking_price_pence,
          status:           row.status,
          subcategoryName:  row.subcategories?.name ?? '',
          primaryPhotoUrl:  primary?.url ?? null,
          createdAt:        row.created_at,
          removalReason:    row.removal_reason,
        }
      })
    },
    enabled: !!identityId,
  })

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <IconArrowLeft size={20} color={theme.textSecondary} />
        </TouchableOpacity>
        <Text style={[s.heading, { color: theme.text }]}>My listings</Text>
      </View>

      <View style={[s.tabBar, { borderBottomColor: theme.border }]}>
        {TABS.map(t => (
          <TouchableOpacity
            key={t.key}
            style={[s.tab, tab === t.key && [s.tabActive, { borderBottomColor: theme.accent }]]}
            onPress={() => setTab(t.key)}
            activeOpacity={0.7}
          >
            <Text style={[s.tabText, { color: tab === t.key ? theme.accent : theme.textSecondary, fontFamily: tab === t.key ? 'Inter_600SemiBold' : 'Inter_400Regular' }]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <View style={s.center}>
          <ActivityIndicator color={theme.accent} />
        </View>
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={item => item.id}
          contentContainerStyle={s.list}
          ListEmptyComponent={
            <Text style={[s.empty, { color: theme.textDisabled, fontFamily: 'CormorantGaramond_400Regular_Italic' }]}>
              {EMPTY_TEXT[tab]}
            </Text>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[s.card, { backgroundColor: theme.surface, borderColor: theme.border }]}
              onPress={() => router.push((tab === 'active' ? `/list/edit/${item.id}` : `/listing/${item.id}`) as any)}
              activeOpacity={0.8}
            >
              <View style={[s.photoWrap, { backgroundColor: theme.surfaceRaised }]}>
                {item.primaryPhotoUrl ? (
                  <Image source={{ uri: item.primaryPhotoUrl }} style={s.photo} contentFit="cover" />
                ) : (
                  <View style={[s.photoPlaceholder, { backgroundColor: theme.border }]} />
                )}
              </View>

              <View style={s.cardBody}>
                <Text style={[s.subcategory, { color: theme.text }]}>{item.subcategoryName}</Text>
                {item.askingPricePence != null && (
                  <Text style={[s.price, { color: theme.accent, fontFamily: 'CormorantGaramond_700Bold' }]}>
                    £{Math.round(item.askingPricePence / 100)}
                  </Text>
                )}
                {item.status === 'reserved' && (
                  <Text style={[s.badge, { color: theme.gold }]}>Reserved</Text>
                )}
                {item.removalReason && (
                  <Text style={[s.removalNote, { color: theme.textDisabled }]}>
                    {REMOVAL_LABELS[item.removalReason] ?? item.removalReason}
                  </Text>
                )}
              </View>

              <IconChevronRight size={16} color={theme.border} style={{ alignSelf: 'center', marginRight: 12 }} />
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  )
}

function makeStyles(theme: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    root:    { flex: 1, backgroundColor: theme.background },
    header:  { flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
    heading: { fontFamily: 'CormorantGaramond_700Bold', fontSize: 28, color: theme.text },

    tabBar:   { flexDirection: 'row', borderBottomWidth: StyleSheet.hairlineWidth },
    tab:      { flex: 1, alignItems: 'center', paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: 'transparent' },
    tabActive:{ borderBottomWidth: 2 },
    tabText:  { fontSize: 14 },

    center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
    list:   { padding: 16, gap: 10 },
    empty:  { fontSize: 18, textAlign: 'center', paddingTop: 48, paddingHorizontal: 32 },

    card:         { flexDirection: 'row', borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
    photoWrap:    { width: 88, height: 88 },
    photo:        { width: 88, height: 88 },
    photoPlaceholder: { flex: 1 },
    cardBody:     { flex: 1, paddingVertical: 10, paddingHorizontal: 12, justifyContent: 'center', gap: 3 },
    subcategory:  { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
    price:        { fontSize: 22 },
    badge:        { fontFamily: 'Inter_500Medium', fontSize: 12 },
    removalNote:  { fontFamily: 'Inter_400Regular', fontSize: 12 },
  })
}
