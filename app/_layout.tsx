import { useEffect, useRef } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
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
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

export default function RootLayout() {
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
      const { data: identityRow } = await supabase
        .from('user_identity')
        .select('*')
        .eq('auth_id', userId)
        .maybeSingle();
      setIdentity(identityRow ?? null);

      if (identityRow) {
        const { data: profileRow } = await supabase
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
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session) {
        setIdentityLoading(true);
        await loadUserData(session.user.id);
        setIdentityLoading(false);
      } else {
        setIdentity(null);
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!initialized || (!fontsLoaded && !fontError)) return;

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
  }, [session, identity, identityLoading, segments, initialized, fontsLoaded, fontError]);

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="removal-reason" options={{ presentation: 'modal' }} />
      </Stack>
    </QueryClientProvider>
  );
}
