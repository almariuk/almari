import { useEffect, useState } from 'react';
import { View, StyleSheet, type ColorValue } from 'react-native';
import { Tabs } from 'expo-router';
import {
  IconHome,
  IconSearch,
  IconHanger,
  IconBell,
  IconUser,
} from '@tabler/icons-react-native';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/auth';
import { supabase } from '@/lib/supabase';

function useUnreadCount(userId: string): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!userId) return;

    const fetch = async () => {
      const { count: n } = await (supabase as any)
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);
      setCount(n ?? 0);
    };
    fetch();

    const channel = supabase
      .channel('notif_badge')
      .on(
        'postgres_changes' as any,
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        () => fetch()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  return count;
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
          ...({ unmountOnBlur: true } as any),
        }}
      />
    </Tabs>
  );
}
