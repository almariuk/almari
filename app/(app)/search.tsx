import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';

// S5 — Search and filters
export default function Search() {
  const theme = useTheme();
  return (
    <SafeAreaView style={[s.root, { backgroundColor: theme.background }]}>
      <View style={s.inner}>
        <Text style={[s.heading, { color: theme.text, fontFamily: 'CormorantGaramond_700Bold' }]}>Search</Text>
        <Text style={[s.body, { color: theme.textSecondary, fontFamily: 'Inter_400Regular' }]}>Coming soon.</Text>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:    { flex: 1 },
  inner:   { flex: 1, paddingHorizontal: 28, paddingTop: 24 },
  heading: { fontSize: 34, marginBottom: 8 },
  body:    { fontSize: 15 },
});
