import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';

// S4 — Home feed (not yet built)
export default function Home() {
  const theme = useTheme();
  return (
    <SafeAreaView style={[s.root, { backgroundColor: theme.background }]}>
      <View style={s.inner}>
        <Text style={[s.heading, { color: theme.text, fontFamily: 'CormorantGaramond_700Bold' }]}>
          Home
        </Text>
        <Text style={[s.body, { color: theme.textSecondary, fontFamily: 'Inter_400Regular' }]}>
          Your feed is coming soon.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:  { flex: 1 },
  inner: { flex: 1, paddingHorizontal: 28, paddingTop: 24 },
  heading: { fontSize: 34, marginBottom: 8 },
  body:    { fontSize: 15, lineHeight: 22 },
});
