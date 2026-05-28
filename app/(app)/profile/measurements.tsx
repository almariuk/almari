import { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { IconArrowLeft, IconCheck } from '@tabler/icons-react-native'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth'
import { useTheme } from '@/hooks/useTheme'
import { MeasurementsForm, type MeasurementValues } from '@/components/profile/MeasurementsForm'

export default function Measurements() {
  const theme = useTheme()
  const router = useRouter()
  const { identity, profile, setProfile } = useAuthStore()

  const [measurements, setMeasurements] = useState<MeasurementValues>({
    bust:     profile?.bust_cm?.toString()      ?? '',
    waist:    profile?.waist_cm?.toString()     ?? '',
    hips:     profile?.hips_cm?.toString()      ?? '',
    height:   profile?.height_cm?.toString()    ?? '',
    shoeSize: profile?.uk_shoe_size?.toString() ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)

  const save = async () => {
    if (!identity) return
    setSaving(true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
      .from('user_profile')
      .update({
        bust_cm:      measurements.bust      ? parseInt(measurements.bust,      10) : null,
        waist_cm:     measurements.waist     ? parseInt(measurements.waist,     10) : null,
        hips_cm:      measurements.hips      ? parseInt(measurements.hips,      10) : null,
        height_cm:    measurements.height    ? parseInt(measurements.height,    10) : null,
        uk_shoe_size: measurements.shoeSize  ? parseFloat(measurements.shoeSize)   : null,
      })
      .eq('user_id', identity.id)
      .select()
      .single()
    setSaving(false)
    if (data) {
      setProfile(data)
      setSaved(true)
      setTimeout(() => router.back(), 700)
    }
  }

  const s = makeStyles(theme)

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          <TouchableOpacity style={s.back} onPress={() => router.back()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <IconArrowLeft size={20} color={theme.textSecondary} />
          </TouchableOpacity>

          <Text style={[s.heading, { color: theme.text }]}>Measurements</Text>
          <Text style={[s.hint, { color: theme.textSecondary }]}>
            Only you can see these. We use them to sort listings by fit.
          </Text>

          <MeasurementsForm
            values={measurements}
            onChange={setMeasurements}
            focusedField={focusedField}
            onFocusField={setFocusedField}
          />

          <TouchableOpacity
            style={[s.btn, { backgroundColor: theme.accent, opacity: saving || saved ? 0.8 : 1 }]}
            onPress={save}
            disabled={saving || saved}
            activeOpacity={0.85}
          >
            {saving ? (
              <ActivityIndicator color={theme.accentText} />
            ) : saved ? (
              <IconCheck size={20} color={theme.accentText} />
            ) : (
              <Text style={[s.btnText, { color: theme.accentText }]}>Save measurements</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

function makeStyles(theme: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    root:     { flex: 1, backgroundColor: theme.background },
    flex:     { flex: 1 },
    scroll:   { paddingHorizontal: 24, paddingBottom: 40 },
    back:     { paddingTop: 16, paddingBottom: 8, alignSelf: 'flex-start' },
    heading:  { fontFamily: 'CormorantGaramond_700Bold', fontSize: 34, marginBottom: 6 },
    hint:     { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 18, marginBottom: 28 },
    btn:      { borderRadius: 12, paddingVertical: 15, alignItems: 'center', marginTop: 16 },
    btnText:  { fontFamily: 'Inter_600SemiBold', fontSize: 16 },
  })
}
