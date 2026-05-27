import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { IconArrowLeft } from '@tabler/icons-react-native'
import { supabase } from '@/lib/supabase'
import { useTheme } from '@/hooks/useTheme'
import { useAuthStore } from '@/store/auth'

const MAX_CHARS = 300

// S19 — Payment details (offline payment instructions shown to buyers)
export default function PaymentDetails() {
  const theme = useTheme()
  const router = useRouter()
  const { identity, profile, setProfile } = useAuthStore()
  const s = makeStyles(theme)

  const [instructions, setInstructions] = useState(profile?.payment_instructions ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    if (!identity?.id) return
    setSaving(true)
    setError(null)
    setSaved(false)

    const trimmed = instructions.trim()

    const { data, error: updateError } = await (supabase as any)
      .from('user_profile')
      .update({
        payment_instructions: trimmed || null,
        bank_details_provided: trimmed.length > 0,
      })
      .eq('user_id', identity.id)
      .select()
      .single()

    setSaving(false)

    if (updateError) {
      setError('Could not save. Please try again.')
      return
    }

    if (data && profile) {
      setProfile({ ...profile, payment_instructions: (data as any).payment_instructions, bank_details_provided: (data as any).bank_details_provided })
    }

    setSaved(true)
  }

  const hasChanges = instructions.trim() !== (profile?.payment_instructions ?? '')

  return (
    <SafeAreaView style={[s.root, { backgroundColor: theme.background }]} edges={['top']}>
      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

        {/* Nav */}
        <View style={[s.nav, { borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <IconArrowLeft size={22} color={theme.text} />
          </TouchableOpacity>
          <Text style={[s.navTitle, { color: theme.text, fontFamily: 'Inter_600SemiBold' }]}>
            Payment details
          </Text>
          <View style={s.navSpacer} />
        </View>

        <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">
          <Text style={[s.heading, { color: theme.text, fontFamily: 'CormorantGaramond_700Bold' }]}>
            How do you want to be paid?
          </Text>
          <Text style={[s.hint, { color: theme.textSecondary, fontFamily: 'Inter_400Regular' }]}>
            Buyers will see this when they purchase one of your listings. Include your PayPal, Revolut, or bank transfer details.
          </Text>

          <View style={[s.examples, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[s.exampleLabel, { color: theme.textDisabled, fontFamily: 'Inter_500Medium' }]}>
              EXAMPLES
            </Text>
            <Text style={[s.exampleText, { color: theme.textSecondary, fontFamily: 'Inter_400Regular' }]}>
              PayPal: yourname@email.com{'\n'}
              Revolut: @yourhandle{'\n'}
              Bank transfer: Jane Smith · 20-00-00 · 12345678
            </Text>
          </View>

          <TextInput
            style={[s.input, {
              backgroundColor: theme.inputBackground,
              borderColor: theme.border,
              color: theme.text,
              fontFamily: 'Inter_400Regular',
            }]}
            value={instructions}
            onChangeText={t => { setInstructions(t.slice(0, MAX_CHARS)); setSaved(false) }}
            placeholder="Enter your payment details…"
            placeholderTextColor={theme.textDisabled}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            autoCorrect={false}
          />

          <Text style={[s.charCount, { color: theme.textDisabled, fontFamily: 'Inter_400Regular' }]}>
            {instructions.length}/{MAX_CHARS}
          </Text>

          {error && (
            <Text style={[s.errorText, { color: theme.error, fontFamily: 'Inter_400Regular' }]}>
              {error}
            </Text>
          )}

          {saved && (
            <Text style={[s.savedText, { color: theme.success, fontFamily: 'Inter_500Medium' }]}>
              Saved.
            </Text>
          )}

          <TouchableOpacity
            style={[s.saveBtn, {
              backgroundColor: hasChanges ? theme.accent : theme.surface,
              borderColor: hasChanges ? theme.accent : theme.border,
            }]}
            onPress={handleSave}
            disabled={!hasChanges || saving}
            activeOpacity={0.8}
          >
            {saving
              ? <ActivityIndicator color={theme.accentText} size="small" />
              : <Text style={[s.saveBtnText, {
                  color: hasChanges ? theme.accentText : theme.textDisabled,
                  fontFamily: 'Inter_600SemiBold',
                }]}>
                  Save
                </Text>
            }
          </TouchableOpacity>
        </ScrollView>

      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

function makeStyles(theme: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    root:    { flex: 1 },
    flex:    { flex: 1 },

    nav: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
    },
    navTitle:   { flex: 1, textAlign: 'center', fontSize: 16 },
    navSpacer:  { width: 22 },

    body: { paddingHorizontal: 24, paddingTop: 28, paddingBottom: 40 },

    heading: { fontSize: 28, lineHeight: 34, marginBottom: 10 },
    hint:    { fontSize: 14, lineHeight: 21, marginBottom: 20 },

    examples: {
      borderRadius: 10,
      borderWidth: 1,
      padding: 14,
      marginBottom: 20,
    },
    exampleLabel: { fontSize: 10, letterSpacing: 0.8, marginBottom: 6 },
    exampleText:  { fontSize: 13, lineHeight: 20 },

    input: {
      borderWidth: 1.5,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 14,
      lineHeight: 22,
      minHeight: 120,
      marginBottom: 6,
    },
    charCount: { fontSize: 11, textAlign: 'right', marginBottom: 20 },

    errorText: { fontSize: 13, marginBottom: 12 },
    savedText: { fontSize: 13, marginBottom: 12 },

    saveBtn: {
      borderRadius: 12,
      borderWidth: 1.5,
      paddingVertical: 14,
      alignItems: 'center',
    },
    saveBtnText: { fontSize: 15 },
  })
}
