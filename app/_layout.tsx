import { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, AppState } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import AlmariIcon from '@/components/brand/AlmariIcon';
import { QueryClient, QueryClientProvider, focusManager } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import {
  CormorantGaramond_400Regular,
  CormorantGaramond_400Regular_Italic,
  CormorantGaramond_600SemiBold,
  CormorantGaramond_700Bold,
} from '@expo-google-fonts/cormorant-garamond';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from '@expo-google-fonts/inter';
import { GreatVibes_400Regular } from '@expo-google-fonts/great-vibes';
import * as Linking from 'expo-linking';
import { useAuthStore } from '@/store/auth';
import { supabase } from '@/lib/supabase';
SplashScreen.preventAutoHideAsync().catch(() => {});

focusManager.setEventListener(onFocus => {
  const sub = AppState.addEventListener('change', state => onFocus(state === 'active'))
  return () => sub.remove()
})

const queryClient = new QueryClient();

export default function RootLayout() {
  const [fontTimedOut, setFontTimedOut] = useState(false);
  const [fontsLoaded, fontError] = useFonts({
    CormorantGaramond_400Regular,
    CormorantGaramond_400Regular_Italic,
    CormorantGaramond_600SemiBold,
    CormorantGaramond_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    GreatVibes_400Regular,
  });

  useEffect(() => {
    const t = setTimeout(() => setFontTimedOut(true), 8000);
    return () => clearTimeout(t);
  }, []);

  const { session, initialized, identityLoading, identity, setSession, setInitialized, setIdentityLoading, setIdentity, setProfile } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();
  const splashHidden = useRef(false);

  useEffect(() => {
    const handleAuthUrl = (url: string) => {
      supabase.auth.exchangeCodeForSession(url).catch(() => {});
    };
    Linking.getInitialURL().then(url => { if (url) handleAuthUrl(url); });
    const sub = Linking.addEventListener('url', ({ url }) => handleAuthUrl(url));
    return () => sub.remove();
  }, []);

  useEffect(() => {
    const loadUserData = async (userId: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: identityRow } = await (supabase as any)
        .from('user_identity')
        .select('*')
        .eq('auth_id', userId)
        .maybeSingle();
      setIdentity(identityRow ?? null);

      if (identityRow) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: profileRow } = await (supabase as any)
          .from('user_profile')
          .select('*')
          .eq('user_id', identityRow.id)
          .maybeSingle();
        setProfile(profileRow ?? null);
      } else {
        setProfile(null);
      }
    };

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      if (session) await loadUserData(session.user.id);
      setInitialized(true);
    }).catch(() => {
      setInitialized(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session) {
        setIdentityLoading(true);
        try {
          await loadUserData(session.user.id);
        } finally {
          setIdentityLoading(false);
        }
      } else {
        setIdentity(null);
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!initialized || (!fontsLoaded && !fontError && !fontTimedOut)) return;

    if (!splashHidden.current) {
      splashHidden.current = true;
      SplashScreen.hideAsync();
    }

    const seg = segments as string[];
    const inAuthGroup = seg[0] === '(auth)';
    const onWelcome = seg[1] === 'welcome';

    if (!session && !inAuthGroup) {
      router.replace('/(auth)');
    } else if (session && !identity && !identityLoading && !onWelcome) {
      // Authenticated but no profile yet — new user needs onboarding
      router.replace('/(auth)/welcome');
    } else if (session && identity && inAuthGroup) {
      // Returning user who just signed in
      router.replace('/(app)');
    }
  }, [session, identity, identityLoading, segments, initialized, fontsLoaded, fontError, fontTimedOut]);

  const ready = initialized && (fontsLoaded || fontError || fontTimedOut);

  if (!ready) {
    return (
      <View style={splash.root}>
        <AlmariIcon size={80} />
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />
    </QueryClientProvider>
  );
}

const splash = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0D1B3E',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
