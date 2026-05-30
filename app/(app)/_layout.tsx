import { useEffect } from 'react';
import { View, StyleSheet, type ColorValue } from 'react-native';
import { Tabs } from 'expo-router';
import {
  IconHome,
  IconSearch,
  IconHanger,
  IconBell,
  IconUser,
} from '@tabler/icons-react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/auth';
import { supabase } from '@/lib/supabase';

function useUnreadCount(userId: string): number {
  const queryClient = useQueryClient();

  const { data = 0 } = useQuery({
    queryKey: ['notif_unread_count', userId],
    queryFn: async () => {
      const { count: n } = await (supabase as any)
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);
      return n ?? 0;
    },
    enabled: !!userId,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`notif_badge_${userId}_${Date.now()}`)
      .on(
        'postgres_changes' as any,
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        () => queryClient.invalidateQueries({ queryKey: ['notif_unread_count', userId] })
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId, queryClient]);

  return data;
}

function BellIcon({ color, size, badge }: { color: ColorValue; size: number; badge: number }) {
  const theme = useTheme();
  return (
    <View>
      <IconBell size={size} color={color} />
      {badge > 0 && (
        <View style={[bs.badge, { backgroundColor: theme.error }]}>
        </View>
      )}
    </View>
  );
}

const bs = StyleSheet.create({
  badge: { position: 'absolute', top: -2, right: -4, width: 8, height: 8, borderRadius: 4 },
});

export default function AppLayout() {
  const theme = useTheme();
  const { identity } = useAuthStore();
  const unread = useUnreadCount(identity?.id ?? '');

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.textDisabled,
        tabBarStyle: {
          backgroundColor: theme.background,
          borderTopColor: theme.border,
        },
        tabBarLabelStyle: {
          fontFamily: 'Inter_400Regular',
          fontSize: 11,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <IconHome size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ color, size }) => <IconSearch size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="sell"
        options={{
          title: 'Sell',
          tabBarIcon: ({ color, size }) => <IconHanger size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Alerts',
          tabBarIcon: ({ color, size }) => <BellIcon color={color} size={size} badge={unread} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <IconUser size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
