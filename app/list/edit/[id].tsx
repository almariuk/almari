import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { IconArrowLeft, IconCheck } from '@tabler/icons-react-native'
import { supabase } from '@/lib/supabase'
import { useTheme } from '@/hooks/useTheme'
import type { ItemCareStatusRow, MicroCopyRow } from '@/types/database'

export default function EditListing() {
  const theme = useTheme()
  const router = useRouter()
  const qc = useQueryClient()
  const { id } = useLocalSearchParams<{ id: string }>()
  const s = makeStyles(theme)

  const [price, setPrice] = useState('')
  const [notes, setNotes] = useState('')
  const [careStatusId, setCareStatusId] = useState<number | null>(null)
  const [whySellingCopyId, setWhySellingCopyId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  // Fetch current listing values
  useQuery({
    queryKey: ['listing_edit_prefill', id],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from('listings')
        .select('asking_price_pence, additional_notes, care_status_id, why_selling_copy_id')
        .eq('id', id)
        .single()
      if (data) {
        setPrice(data.asking_price_pence != null ? String(Math.round(data.asking_price_pence / 100)) : '')
        setNotes(data.additional_notes ?? '')
        setCareStatusId(data.care_status_id ?? null)
        setWhySellingCopyId(data.why_selling_copy_id ?? null)
        setReady(true)
      }
      return data
    },
    enabled: !!id,
    staleTime: 0,
  })

  const { data: careStatuses = [] } = useQuery<ItemCareStatusRow[]>({
    queryKey: ['item_care_status'],
    queryFn: async () => {
      const { data } = await supabase.from('item_care_status').select('*').eq('is_active', true).order('display_order')
      return (data ?? []) as ItemCareStatusRow[]
    },
    staleTime: 10 * 60 * 1000,
  })

  const { data: whyPhrases = [] } = useQuery<MicroCopyRow[]>({
    queryKey: ['micro_copy_why_selling'],
    queryFn: async () => {
      const { data } = await supabase.from('micro_copy').select('*').eq('context', 'why_selling').eq('is_active', true).order('display_order')
      return (data ?? []) as MicroCopyRow[]
    },
    staleTime: 10 * 60 * 1000,
  })

  const save = async () => {
    if (!id) return
    setSaving(true)
    const pricePence = price.trim() ? Math.round(parseFloat(price) * 100) : null
    await (supabase as any)
      .from('listings')
      .update({
        asking_price_pence: pricePence,
        additional_notes: notes.trim() || null,
        care_status_id: careStatusId,
        why_selling_copy_id: whySellingCopyId,
      })
      .eq('id', id)
    setSaving(false)
    setSaved(true)
    qc.invalidateQueries({ queryKey: ['listing_detail', id] })
    qc.invalidateQueries({ queryKey: ['my_listings'] })
    setTimeout(() => router.back(), 700)
  }

  const border = (field: string) => focusedField === field ? theme.borderFocused : theme.border

  if (!ready) {
    return (
      <SafeAreaView style={s.root} edges={['top']}>
        <View style={s.loading}>
          <ActivityIndicator color={theme.accent} />
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

          <TouchableOpacity style={s.back} onPress={() => router.back()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <IconArrowLeft size={20} color={theme.textSecondary} />
          </TouchableOpacity>

          <Text style={[s.heading, { color: theme.text }]}>Edit listing</Text>

          {/* Asking price */}
          <View style={s.section}>
            <Text style={[s.label, { color: theme.textSecondary }]}>Asking price (£)</Text>
            <TextInput
              style={[s.input, { borderColor: border('price'), backgroundColor: theme.inputBackground, color: theme.text }]}
              value={price}
              onChangeText={setPrice}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor={theme.textDisabled}
              onFocus={() => setFocusedField('price')}
              onBlur={() => setFocusedField(null)}
            />
          </View>

          {/* Care status */}
          {careStatuses.length > 0 && (
            <View style={s.section}>
              <Text style={[s.label, { color: theme.textSecondary }]}>Item care</Text>
              {careStatuses.map(cs => {
                const sel = careStatusId === cs.id
                return (
                  <TouchableOpacity
                    key={cs.id}
                    style={[s.card, { borderColor: sel ? theme.accent : theme.border }, sel && { backgroundColor: theme.accentSubtle }]}
                    onPress={() => setCareStatusId(sel ? null : cs.id)}
                    activeOpacity={0.85}
                  >
                    <Text style={[s.cardTitle, { color: sel ? theme.accent : theme.text }]}>{cs.display_text}</Text>
                    {cs.detail_text ? <Text style={[s.cardBody, { color: theme.textSecondary }]}>{cs.detail_text}</Text> : null}
                  </TouchableOpacity>
                )
              })}
            </View>
          )}

          {/* Why selling */}
          {whyPhrases.length > 0 && (
            <View style={s.section}>
              <Text style={[s.label, { color: theme.textSecondary }]}>Why are you selling?</Text>
              <Text style={[s.hint, { color: theme.textDisabled }]}>Shown on your listing.</Text>
              {whyPhrases.map(phrase => {
                const sel = whySellingCopyId === phrase.id
                return (
                  <TouchableOpacity
                    key={phrase.id}
                    style={[s.card, { borderColor: sel ? theme.accent : theme.border }, sel && { backgroundColor: theme.accentSubtle }]}
                    onPress={() => setWhySellingCopyId(sel ? null : phrase.id)}
                    activeOpacity={0.85}
                  >
                    <Text style={[s.cardTitle, { color: sel ? theme.accent : theme.text }]}>{phrase.display_text}</Text>
                  </TouchableOpacity>
                )
              })}
            </View>
          )}

          {/* Additional notes */}
          <View style={s.section}>
            <Text style={[s.label, { color: theme.textSecondary }]}>Additional notes</Text>
            <TextInput
              style={[s.notesInput, { borderColor: border('notes'), backgroundColor: theme.inputBackground, color: theme.text }]}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
              placeholder="Colour nuance, fabric detail, alterations, or anything else buyers should know…"
              placeholderTextColor={theme.textDisabled}
              onFocus={() => setFocusedField('notes')}
              onBlur={() => setFocusedField(null)}
            />
          </View>

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
              <Text style={[s.btnText, { color: theme.accentText }]}>Save changes</Text>
            )}
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

function makeStyles(theme: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    root:      { flex: 1, backgroundColor: theme.background },
    flex:      { flex: 1 },
    loading:   { flex: 1, alignItems: 'center', justifyContent: 'center' },
    scroll:    { paddingHorizontal: 24, paddingBottom: 48 },
    back:      { paddingTop: 16, paddingBottom: 8, alignSelf: 'flex-start' },
    heading:   { fontFamily: 'CormorantGaramond_700Bold', fontSize: 34, marginBottom: 28 },
    section:   { marginBottom: 24 },
    label:     { fontFamily: 'Inter_500Medium', fontSize: 13, marginBottom: 8 },
    hint:      { fontFamily: 'Inter_400Regular', fontSize: 12, marginBottom: 8 },
    input:     { borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 13, fontFamily: 'Inter_400Regular', fontSize: 20 },
    notesInput:{ borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 13, fontFamily: 'Inter_400Regular', fontSize: 14, minHeight: 100, textAlignVertical: 'top' },
    card:      { borderWidth: 1.5, borderRadius: 12, padding: 14, marginBottom: 8 },
    cardTitle: { fontFamily: 'Inter_500Medium', fontSize: 14, marginBottom: 2 },
    cardBody:  { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 17 },
    btn:       { borderRadius: 12, paddingVertical: 15, alignItems: 'center', marginTop: 8 },
    btnText:   { fontFamily: 'Inter_600SemiBold', fontSize: 16 },
  })
}
