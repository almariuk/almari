import { useEffect, useCallback, useRef } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter, useFocusEffect } from 'expo-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { IconBell } from '@tabler/icons-react-native'
import { Swipeable } from 'react-native-gesture-handler'
import { supabase } from '@/lib/supabase'
import { useTheme } from '@/hooks/useTheme'
import { useAuthStore } from '@/store/auth'
import type { Theme } from '@/constants/theme'

// S17 — Notifications

interface Notification {
  id: number
  type: string
  title: string
  body: string
  is_read: boolean
  created_at: string
  reference_type: string | null
  reference_id: string | null
}

function useNotifications(userId: string) {
  return useQuery<Notification[]>({
    queryKey: ['notifications', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('notifications')
        .select('id, type, title, body, is_read, created_at, reference_type, reference_id')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data ?? []
    },
  })
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins < 1)   return 'just now'
  if (mins < 60)  return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7)   return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function NotificationRow({
  item,
  onPress,
  onDelete,
  theme,
}: {
  item: Notification
  onPress: (n: Notification) => void
  onDelete: (id: number) => void
  theme: Theme
}) {
  const swipeRef = useRef<Swipeable>(null)

  const renderRightActions = () => (
    <TouchableOpacity
      style={[s.deleteAction, { backgroundColor: theme.error }]}
      onPress={() => {
        swipeRef.current?.close()
        onDelete(item.id)
      }}
    >
      <Text style={[s.deleteText, { fontFamily: 'Inter_500Medium' }]}>Delete</Text>
    </TouchableOpacity>
  )

  return (
    <Swipeable ref={swipeRef} renderRightActions={renderRightActions} overshootRight={false}>
      <TouchableOpacity
        style={[s.row, { backgroundColor: theme.background, borderBottomColor: theme.border }]}
        onPress={() => onPress(item)}
        activeOpacity={0.7}
      >
        <View style={[s.dot, { backgroundColor: !item.is_read ? theme.accent : 'transparent' }]} />
        <View style={s.rowContent}>
          <Text style={[s.rowTitle, { color: theme.text, fontFamily: 'Inter_500Medium' }]} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={[s.rowBody, { color: theme.textSecondary, fontFamily: 'Inter_400Regular' }]} numberOfLines={2}>
            {item.body}
          </Text>
          <Text style={[s.rowTime, { color: theme.textDisabled, fontFamily: 'Inter_400Regular' }]}>
            {relativeTime(item.created_at)}
          </Text>
        </View>
      </TouchableOpacity>
    </Swipeable>
  )
}

export default function Notifications() {
  const theme       = useTheme()
  const router      = useRouter()
  const queryClient = useQueryClient()
  const { identity } = useAuthStore()
  const userId = identity?.id ?? ''

  const { data: notifications = [], isLoading } = useNotifications(userId)

  // Refetch on tab focus
  useFocusEffect(useCallback(() => {
    if (userId) queryClient.invalidateQueries({ queryKey: ['notifications', userId] })
  }, [userId, queryClient]))

  // Real-time: new notification → refresh list
  useEffect(() => {
    if (!userId) return
    const channel = supabase
      .channel('notifications_realtime')
      .on(
        'postgres_changes' as any,
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        () => queryClient.invalidateQueries({ queryKey: ['notifications', userId] })
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [userId, queryClient])

  const markRead = async (id: number) => {
    await (supabase as any)
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', id)
    queryClient.invalidateQueries({ queryKey: ['notifications', userId] })
  }

  const markAllRead = async () => {
    await (supabase as any)
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('is_read', false)
    queryClient.invalidateQueries({ queryKey: ['notifications', userId] })
  }

  const deleteNotification = async (id: number) => {
    await (supabase as any).from('notifications').delete().eq('id', id)
    queryClient.invalidateQueries({ queryKey: ['notifications', userId] })
  }

  const handlePress = async (n: Notification) => {
    if (!n.is_read) await markRead(n.id)
    if (n.reference_type === 'transaction' && n.reference_id) {
      // Determine role: check if the current user is buyer or seller on this transaction
      const { data } = await (supabase as any)
        .from('transactions')
        .select('buyer_id, seller_id')
        .eq('id', n.reference_id)
        .maybeSingle()
      if (data) {
        const screen = data.buyer_id === userId ? 'buyer' : 'seller'
        router.push(`/transaction/${n.reference_id}/${screen}` as any)
      }
    }
  }

  const hasUnread = notifications.some(n => !n.is_read)

  if (isLoading) {
    return (
      <SafeAreaView style={[s.root, { backgroundColor: theme.background }]}>
        <ActivityIndicator style={s.loader} color={theme.accent} />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={[s.root, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[s.header, { borderBottomColor: theme.border }]}>
        <Text style={[s.heading, { color: theme.text, fontFamily: 'CormorantGaramond_700Bold' }]}>
          Notifications
        </Text>
        {hasUnread && (
          <TouchableOpacity onPress={markAllRead} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={[s.markAll, { color: theme.accent, fontFamily: 'Inter_500Medium' }]}>
              Mark all read
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {notifications.length === 0 ? (
        <View style={s.empty}>
          <IconBell size={40} color={theme.textDisabled} />
          <Text style={[s.emptyText, { color: theme.textSecondary, fontFamily: 'Inter_400Regular' }]}>
            You're all caught up
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={item => String(item.id)}
          renderItem={({ item }) => (
            <NotificationRow
              item={item}
              onPress={handlePress}
              onDelete={deleteNotification}
              theme={theme}
            />
          )}
          contentContainerStyle={s.list}
        />
      )}
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  root:            { flex: 1 },
  loader:          { flex: 1 },
  header:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  heading:         { fontSize: 28 },
  markAll:         { fontSize: 14 },
  empty:           { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyText:       { fontSize: 16 },
  list:            { paddingBottom: 40 },
  row:             { paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'flex-start' },
  dot:             { width: 8, height: 8, borderRadius: 4, marginTop: 6, marginRight: 10, flexShrink: 0 },
  rowContent:      { flex: 1 },
  rowTitle:        { fontSize: 15, marginBottom: 3 },
  rowBody:         { fontSize: 14, lineHeight: 20, marginBottom: 4 },
  rowTime:         { fontSize: 12 },
  deleteAction:    { justifyContent: 'center', alignItems: 'center', width: 80, marginVertical: 0 },
  deleteText:      { color: '#fff', fontSize: 14 },
})
