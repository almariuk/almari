import { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { IconArrowLeft, IconCheck } from '@tabler/icons-react-native'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useTheme } from '@/hooks/useTheme'

// S25 — Raise a concern

const REASONS = [
  {
    id: 'not_as_described',
    title: 'Item not as described',
    detail: 'The condition or description was significantly misleading.',
  },
  {
    id: 'incomplete_set',
    title: 'Set was incomplete',
    detail: 'Parts were missing that were not declared by the seller.',
  },
  {
    id: 'suspected_vendor',
    title: 'Suspected vendor listing',
    detail: 'This appears to be a commercial seller, not an individual.',
  },
]

export default function RaiseConcern() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const theme = useTheme()
  const router = useRouter()
  const queryClient = useQueryClient()
  const s = makeStyles(theme)

  const [selectedReason, setSelectedReason] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  const handleSubmit = async () => {
    if (!selectedReason || !id) return
    setSubmitting(true)
    const { error } = await (supabase as any)
      .from('transactions')
      .update({
        status: 'concern_open',
        concern_raised_at: new Date().toISOString(),
        concern_reason: selectedReason,
      })
      .eq('id', id)

    setSubmitting(false)
    if (error) {
      Alert.alert('Error', 'Could not submit concern. Please try again.')
      return
    }
    queryClient.invalidateQueries({ queryKey: ['order_buyer', id] })
    queryClient.invalidateQueries({ queryKey: ['my_purchases'] })
    setDone(true)
  }

  if (done) {
    return (
      <SafeAreaView style={[s.root, { backgroundColor: theme.background }]} edges={['top']}>
        <View style={s.doneWrap}>
          <View style={[s.doneIcon, { backgroundColor: theme.accent + '18', borderColor: theme.accent }]}>
            <IconCheck size={28} color={theme.accent} />
          </View>
          <Text style={[s.doneHeading, { color: theme.text, fontFamily: 'CormorantGaramond_700Bold' }]}>
            Concern raised
          </Text>
          <Text style={[s.doneBody, { color: theme.textSecondary, fontFamily: 'Inter_400Regular' }]}>
            Almari will review your concern and contact you within 5 working days. You can track the status under My Purchases.
          </Text>
          <TouchableOpacity
            style={[s.doneBtn, { backgroundColor: theme.accent }]}
            onPress={() => router.back()}
            activeOpacity={0.85}
          >
            <Text style={[s.doneBtnText, { color: theme.accentText, fontFamily: 'Inter_600SemiBold' }]}>
              Back to order
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  if (confirming) {
    const reason = REASONS.find(r => r.id === selectedReason)
    return (
      <SafeAreaView style={[s.root, { backgroundColor: theme.background }]} edges={['top']}>
        <View style={[s.nav, { borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={() => setConfirming(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <IconArrowLeft size={22} color={theme.text} />
          </TouchableOpacity>
          <Text style={[s.navTitle, { color: theme.text, fontFamily: 'Inter_600SemiBold' }]}>Confirm concern</Text>
          <View style={s.navSpacer} />
        </View>
        <View style={s.body}>
          <Text style={[s.confirmHeading, { color: theme.text, fontFamily: 'CormorantGaramond_700Bold' }]}>
            Are you sure?
          </Text>
          <Text style={[s.confirmBody, { color: theme.textSecondary, fontFamily: 'Inter_400Regular' }]}>
            You are raising a concern for:
          </Text>
          <View style={[s.confirmCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[s.confirmReason, { color: theme.text, fontFamily: 'Inter_600SemiBold' }]}>
              {reason?.title}
            </Text>
            <Text style={[s.confirmDetail, { color: theme.textSecondary, fontFamily: 'Inter_400Regular' }]}>
              {reason?.detail}
            </Text>
          </View>
          <Text style={[s.confirmNote, { color: theme.textDisabled, fontFamily: 'Inter_400Regular' }]}>
            Almari will review this and contact both parties within 5 working days. Raising a false concern affects your trust score.
          </Text>
        </View>
        <View style={[s.footer, { borderTopColor: theme.border, backgroundColor: theme.background }]}>
          <TouchableOpacity
            style={[s.submitBtn, { backgroundColor: theme.error }]}
            onPress={handleSubmit}
            disabled={submitting}
            activeOpacity={0.85}
          >
            {submitting
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={[s.submitBtnText, { color: '#fff', fontFamily: 'Inter_600SemiBold' }]}>
                  Submit concern
                </Text>
            }
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.cancelBtn, { borderColor: theme.border }]}
            onPress={() => setConfirming(false)}
            activeOpacity={0.7}
          >
            <Text style={[s.cancelBtnText, { color: theme.textSecondary, fontFamily: 'Inter_400Regular' }]}>
              Go back
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={[s.root, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={[s.nav, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <IconArrowLeft size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={[s.navTitle, { color: theme.text, fontFamily: 'Inter_600SemiBold' }]}>Raise a concern</Text>
        <View style={s.navSpacer} />
      </View>

      <View style={s.body}>
        <Text style={[s.heading, { color: theme.text, fontFamily: 'CormorantGaramond_700Bold' }]}>
          What's the issue?
        </Text>
        <Text style={[s.subheading, { color: theme.textSecondary, fontFamily: 'Inter_400Regular' }]}>
          Select the reason that best describes your concern.
        </Text>

        <View style={s.reasons}>
          {REASONS.map(reason => {
            const selected = selectedReason === reason.id
            return (
              <TouchableOpacity
                key={reason.id}
                style={[
                  s.reasonCard,
                  {
                    backgroundColor: theme.surface,
                    borderColor: selected ? theme.accent : theme.border,
                    borderWidth: selected ? 2 : 1,
                  },
                ]}
                onPress={() => setSelectedReason(reason.id)}
                activeOpacity={0.7}
              >
                <View style={s.reasonRow}>
                  <View style={s.reasonText}>
                    <Text style={[s.reasonTitle, { color: theme.text, fontFamily: 'Inter_600SemiBold' }]}>
                      {reason.title}
                    </Text>
                    <Text style={[s.reasonDetail, { color: theme.textSecondary, fontFamily: 'Inter_400Regular' }]}>
                      {reason.detail}
                    </Text>
                  </View>
                  <View style={[
                    s.radioOuter,
                    { borderColor: selected ? theme.accent : theme.border },
                  ]}>
                    {selected && <View style={[s.radioInner, { backgroundColor: theme.accent }]} />}
                  </View>
                </View>
              </TouchableOpacity>
            )
          })}
        </View>
      </View>

      <View style={[s.footer, { borderTopColor: theme.border, backgroundColor: theme.background }]}>
        <TouchableOpacity
          style={[s.submitBtn, { backgroundColor: selectedReason ? theme.accent : theme.border }]}
          onPress={() => selectedReason && setConfirming(true)}
          disabled={!selectedReason}
          activeOpacity={0.85}
        >
          <Text style={[s.submitBtnText, { color: selectedReason ? theme.accentText : theme.textDisabled, fontFamily: 'Inter_600SemiBold' }]}>
            Continue
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

function makeStyles(theme: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    root: { flex: 1 },

    nav: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 16, paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
    },
    navTitle:  { flex: 1, textAlign: 'center', fontSize: 15, letterSpacing: 0.3 },
    navSpacer: { width: 22 },

    body: { flex: 1, paddingHorizontal: 24, paddingTop: 28, gap: 16 },

    heading:    { fontSize: 32, lineHeight: 38 },
    subheading: { fontSize: 14, lineHeight: 21, marginBottom: 4 },

    reasons: { gap: 12 },
    reasonCard: { borderRadius: 12, padding: 16 },
    reasonRow:  { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
    reasonText: { flex: 1 },
    reasonTitle:  { fontSize: 15, marginBottom: 3 },
    reasonDetail: { fontSize: 13, lineHeight: 19 },
    radioOuter: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
    radioInner: { width: 10, height: 10, borderRadius: 5 },

    // Confirm step
    confirmHeading: { fontSize: 32, lineHeight: 38, marginBottom: 8 },
    confirmBody:    { fontSize: 14, lineHeight: 21 },
    confirmCard:    { borderRadius: 12, borderWidth: 1, padding: 16, gap: 6 },
    confirmReason:  { fontSize: 15 },
    confirmDetail:  { fontSize: 13, lineHeight: 19 },
    confirmNote:    { fontSize: 12, lineHeight: 18 },

    // Done state
    doneWrap:    { flex: 1, paddingHorizontal: 32, justifyContent: 'center', alignItems: 'center', gap: 16 },
    doneIcon:    { width: 64, height: 64, borderRadius: 32, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
    doneHeading: { fontSize: 32, textAlign: 'center' },
    doneBody:    { fontSize: 14, lineHeight: 22, textAlign: 'center' },
    doneBtn:     { borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32, alignItems: 'center', marginTop: 8 },
    doneBtnText: { fontSize: 15 },

    footer: {
      paddingHorizontal: 24, paddingVertical: 16,
      borderTopWidth: StyleSheet.hairlineWidth, gap: 10,
    },
    submitBtn:     { borderRadius: 12, paddingVertical: 15, alignItems: 'center' },
    submitBtnText: { fontSize: 15 },
    cancelBtn:     { borderRadius: 12, paddingVertical: 13, alignItems: 'center', borderWidth: 1 },
    cancelBtnText: { fontSize: 15 },
  })
}
