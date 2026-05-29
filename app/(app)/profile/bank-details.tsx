import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useQueryClient } from '@tanstack/react-query'
import { IconArrowLeft, IconInfoCircle } from '@tabler/icons-react-native'
import { supabase } from '@/lib/supabase'
import { useTheme } from '@/hooks/useTheme'
import { useAuthStore } from '@/store/auth'

// S19 — Payment details: PayPal + Revolut handles only (no bank account numbers)

function parseHandles(raw: string | null | undefined): { paypal: string; revolut: string } {
  if (!raw) return { paypal: '', revolut: '' }
  try {
    const parsed = JSON.parse(raw)
    if (typeof parsed === 'object' && parsed !== null) {
      return { paypal: parsed.paypal ?? '', revolut: parsed.revolut ?? '' }
    }
  } catch {
    // Legacy free-text — ignore, start fresh
  }
  return { paypal: '', revolut: '' }
}

export default function PaymentDetails() {
  const theme = useTheme()
  const router = useRouter()
  const { identity, profile, setProfile } = useAuthStore()
  const s = makeStyles(theme)

  const initial = parseHandles((profile as any)?.payment_instructions)
  const [paypal, setPaypal] = useState(initial.paypal)
  const [revolut, setRevolut] = useState(initial.revolut)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const queryClient = useQueryClient()
  const cleanRevolut = (v: string) => v.startsWith('@') ? v.slice(1) : v

  const hasAtLeastOne = paypal.trim().length > 0 || revolut.trim().length > 0
  const savedPaypal = initial.paypal
  const savedRevolut = initial.revolut
  const hasChanges = paypal.trim() !== savedPaypal || revolut.trim() !== savedRevolut

  const handleSave = async () => {
    if (!identity?.id) return
    if (!hasAtLeastOne) {
      setError('Add at least one payment method so buyers can pay you.')
      return
    }

    setSaving(true)
    setError(null)
    setSaved(false)

    const payload = JSON.stringify({
      ...(paypal.trim() ? { paypal: paypal.trim() } : {}),
      ...(revolut.trim() ? { revolut: cleanRevolut(revolut.trim()) } : {}),
    })

    const { data, error: updateError } = await (supabase as any)
      .from('user_profile')
      .update({
        payment_instructions: payload,
        bank_details_provided: true,
      })
      .eq('user_id', identity.id)
      .select()
      .single()

    setSaving(false)

    if (updateError) {
      setError('Could not save. Please try again.')
      return
    }

    if (profile) {
      setProfile({ ...profile, payment_instructions: payload, bank_details_provided: true } as any)
    }
    queryClient.invalidateQueries({ queryKey: ['listing_detail'] })

    setSaved(true)
  }

  return (
    <SafeAreaView style={[s.root, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

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
            Buyers see these details when they purchase one of your listings. We only support PayPal and Revolut — no bank account numbers needed.
          </Text>

          {/* PayPal */}
          <Text style={[s.fieldLabel, { color: theme.textSecondary, fontFamily: 'Inter_500Medium' }]}>
            PayPal email or username
          </Text>
          <TextInput
            style={[s.input, {
              backgroundColor: theme.inputBackground,
              borderColor: paypal ? theme.borderFocused : theme.border,
              color: theme.text,
              fontFamily: 'Inter_400Regular',
            }]}
            value={paypal}
            onChangeText={v => { setPaypal(v); setSaved(false) }}
            placeholder="yourname@email.com"
            placeholderTextColor={theme.textDisabled}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
          />

          {/* F&F warning */}
          <View style={[s.warningBox, { backgroundColor: theme.surface, borderColor: theme.gold }]}>
            <IconInfoCircle size={16} color={theme.gold} style={s.warningIcon} />
            <Text style={[s.warningText, { color: theme.text, fontFamily: 'Inter_400Regular' }]}>
              <Text style={{ fontFamily: 'Inter_600SemiBold' }}>Important: </Text>
              Ask buyers to send as{' '}
              <Text style={{ fontFamily: 'Inter_600SemiBold' }}>"Friends &amp; Family"</Text>
              {' '}in PayPal. Goods &amp; Services payments include a fee and can trigger PayPal disputes outside our concerns process.
            </Text>
          </View>

          {/* Revolut */}
          <Text style={[s.fieldLabel, { color: theme.textSecondary, fontFamily: 'Inter_500Medium', marginTop: 20 }]}>
            Revolut username
          </Text>
          <View style={[s.revInput, { backgroundColor: theme.inputBackground, borderColor: revolut ? theme.borderFocused : theme.border }]}>
            <Text style={[s.revAt, { color: theme.textDisabled, fontFamily: 'Inter_400Regular' }]}>@</Text>
            <TextInput
              style={[s.revField, { color: theme.text, fontFamily: 'Inter_400Regular' }]}
              value={revolut.startsWith('@') ? revolut.slice(1) : revolut}
              onChangeText={v => { setRevolut(v); setSaved(false) }}
              placeholder="yourhandle"
              placeholderTextColor={theme.textDisabled}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

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
              backgroundColor: (hasChanges && hasAtLeastOne) ? theme.accent : theme.surface,
              borderColor: (hasChanges && hasAtLeastOne) ? theme.accent : theme.border,
            }]}
            onPress={handleSave}
            disabled={!hasChanges || saving}
            activeOpacity={0.8}
          >
            {saving
              ? <ActivityIndicator color={theme.accentText} size="small" />
              : <Text style={[s.saveBtnText, {
                  color: (hasChanges && hasAtLeastOne) ? theme.accentText : theme.textDisabled,
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
    root:  { flex: 1 },
    flex:  { flex: 1 },

    nav: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
    },
    navTitle:  { flex: 1, textAlign: 'center', fontSize: 16 },
    navSpacer: { width: 22 },

    body: { paddingHorizontal: 24, paddingTop: 28, paddingBottom: 40 },

    heading: { fontSize: 28, lineHeight: 34, marginBottom: 10 },
    hint:    { fontSize: 14, lineHeight: 21, marginBottom: 24 },

    fieldLabel: { fontSize: 12, letterSpacing: 0.3, marginBottom: 8 },

    input: {
      borderWidth: 1.5,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 13,
      fontSize: 15,
      marginBottom: 12,
    },

    warningBox: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      borderWidth: 1,
      borderRadius: 10,
      padding: 12,
      gap: 8,
      marginBottom: 4,
    },
    warningIcon: { marginTop: 1 },
    warningText: { flex: 1, fontSize: 13, lineHeight: 19 },

    revInput: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1.5,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 13,
      marginBottom: 12,
    },
    revAt:    { fontSize: 15, marginRight: 2 },
    revField: { flex: 1, fontSize: 15, padding: 0 },

    errorText: { fontSize: 13, marginBottom: 12 },
    savedText: { fontSize: 13, marginBottom: 12 },

    saveBtn: {
      borderRadius: 12,
      borderWidth: 1.5,
      paddingVertical: 14,
      alignItems: 'center',
      marginTop: 8,
    },
    saveBtnText: { fontSize: 15 },
  })
}
