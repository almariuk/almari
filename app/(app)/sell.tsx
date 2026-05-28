import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { IconPlus } from '@tabler/icons-react-native';
import { useTheme } from '@/hooks/useTheme';
import { useListingDraftStore } from '@/store/listing-draft';

export default function Sell() {
  const theme = useTheme();
  const router = useRouter();
  const reset = useListingDraftStore((s) => s.reset);
  const s = makeStyles(theme);

  const startListing = () => {
    reset();
    router.push('/list/step-1');
  };

  return (
    <SafeAreaView style={s.root}>
      <View style={s.inner}>
        <Text style={s.title}>List an item</Text>
        <Text style={s.subtitle}>
          Share a piece from your wardrobe and find it a new home.
        </Text>
        <TouchableOpacity style={s.btn} onPress={startListing} activeOpacity={0.85}>
          <IconPlus size={18} color={theme.accentText} />
          <Text style={s.btnText}>Start listing</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function makeStyles(theme: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.background },
    inner: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 32,
    },
    title: {
      fontFamily: 'CormorantGaramond_700Bold',
      fontSize: 32,
      color: theme.text,
      marginBottom: 8,
      textAlign: 'center',
    },
    subtitle: {
      fontFamily: 'Inter_400Regular',
      fontSize: 15,
      color: theme.textSecondary,
      textAlign: 'center',
      marginBottom: 32,
      lineHeight: 22,
    },
    btn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: theme.accent,
      paddingHorizontal: 28,
      paddingVertical: 15,
      borderRadius: 12,
    },
    btnText: {
      fontFamily: 'Inter_600SemiBold',
      fontSize: 16,
      color: theme.accentText,
    },
  });
}
