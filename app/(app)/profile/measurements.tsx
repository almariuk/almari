import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { IconArrowLeft } from '@tabler/icons-react-native';
import { useTheme } from '@/hooks/useTheme';

export default function Measurements() {
  const theme = useTheme();
  const router = useRouter();
  return (
    <SafeAreaView style={[s.root, { backgroundColor: theme.background }]}>
      <View style={s.inner}>
        <TouchableOpacity style={s.back} onPress={() => router.back()}>
          <IconArrowLeft size={20} color={theme.textSecondary} />
        </TouchableOpacity>
        <Text style={[s.heading, { color: theme.text, fontFamily: 'CormorantGaramond_700Bold' }]}>Measurements</Text>
        <Text style={[s.body, { color: theme.textSecondary, fontFamily: 'Inter_400Regular' }]}>Coming soon.</Text>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:  { flex: 1 },
  inner: { flex: 1, paddingHorizontal: 28, paddingTop: 16 },
  back:  { marginBottom: 20, alignSelf: 'flex-start' },
  heading: { fontSize: 34, marginBottom: 8 },
  body:    { fontSize: 15 },
});
