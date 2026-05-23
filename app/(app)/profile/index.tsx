import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/auth';
import { supabase } from '@/lib/supabase';

// S16 — Profile (not yet built)
export default function Profile() {
  const theme = useTheme();
  const { identity, clear } = useAuthStore();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    clear();
  };

  return (
    <SafeAreaView style={[s.root, { backgroundColor: theme.background }]}>
      <View style={s.inner}>
        <Text style={[s.heading, { color: theme.text, fontFamily: 'CormorantGaramond_700Bold' }]}>
          Profile
        </Text>
        {identity && (
          <Text style={[s.name, { color: theme.textSecondary, fontFamily: 'Inter_400Regular' }]}>
            {identity.first_name} {identity.last_name_initial}.
          </Text>
        )}
        <TouchableOpacity style={[s.signOutBtn, { borderColor: theme.border }]} onPress={handleSignOut}>
          <Text style={[s.signOutText, { color: theme.error, fontFamily: 'Inter_500Medium' }]}>
            Sign out
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:       { flex: 1 },
  inner:      { flex: 1, paddingHorizontal: 28, paddingTop: 24 },
  heading:    { fontSize: 34, marginBottom: 4 },
  name:       { fontSize: 15, marginBottom: 32 },
  signOutBtn: { borderWidth: 1.5, borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  signOutText:{ fontSize: 15 },
});
