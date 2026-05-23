import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconUser, IconRuler2 } from '@tabler/icons-react-native';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth';
import { useTheme } from '@/hooks/useTheme';
import { Brand } from '@/constants/brand';
import type { UserIdentity, UserProfile } from '@/types/database';

export default function Welcome() {
  const theme = useTheme();
  const { session, setIdentity, setProfile } = useAuthStore();

  const [firstName, setFirstName] = useState('');
  const [lastInitial, setLastInitial] = useState('');
  const [bust, setBust] = useState('');
  const [waist, setWaist] = useState('');
  const [hips, setHips] = useState('');
  const [height, setHeight] = useState('');
  const [shoeSize, setShoeSize] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const s = makeStyles(theme);
  const canSubmit = firstName.trim().length > 0 && lastInitial.trim().length > 0;

  const hasMeasurements = !!(bust || waist || hips || height || shoeSize);

  const inputBorder = (field: string) =>
    focusedField === field ? theme.borderFocused : theme.border;

  const submit = async (skipMeasurements: boolean) => {
    if (!session) return;
    setLoading(true);
    setError('');

    try {
      // 1. Create user_identity
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: identity, error: idErr } = await (supabase as any)
        .from('user_identity')
        .insert({
          auth_id: session.user.id,
          first_name: firstName.trim(),
          last_name_initial: lastInitial.trim().toUpperCase().charAt(0),
        })
        .select()
        .single();

      if (idErr || !identity) throw idErr ?? new Error('Failed to create profile.');
      const typedIdentity = identity as UserIdentity;

      // 2. Create user_profile
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: profile, error: profErr } = await (supabase as any)
        .from('user_profile')
        .insert({
          user_id: typedIdentity.id,
          ...(skipMeasurements ? {} : {
            bust_cm:      bust   ? parseInt(bust,   10) : null,
            waist_cm:     waist  ? parseInt(waist,  10) : null,
            hips_cm:      hips   ? parseInt(hips,   10) : null,
            height_cm:    height ? parseInt(height, 10) : null,
            uk_shoe_size: shoeSize ? parseFloat(shoeSize) : null,
          }),
        })
        .select()
        .single();

      if (profErr || !profile) throw profErr ?? new Error('Failed to save measurements.');
      const typedProfile = profile as UserProfile;

      // 3. Trust score events — look up event type IDs by name (config-driven, no hardcoded IDs)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: eventTypes } = await (supabase as any)
        .from('trust_event_types')
        .select('id, name')
        .in('name', ['email_verified', 'measurements_saved']);

      const eventsToInsert: { user_id: string; event_type_id: number; score_delta: number }[] = [];

      const emailEvent = (eventTypes as { id: number; name: string }[] | null)?.find(e => e.name === 'email_verified');
      if (emailEvent) {
        eventsToInsert.push({ user_id: typedIdentity.id, event_type_id: emailEvent.id, score_delta: 2 });
      }

      const measurementEvent = (eventTypes as { id: number; name: string }[] | null)?.find(e => e.name === 'measurements_saved');
      if (measurementEvent && !skipMeasurements && hasMeasurements) {
        eventsToInsert.push({ user_id: typedIdentity.id, event_type_id: measurementEvent.id, score_delta: 2 });
      }

      if (eventsToInsert.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any).from('trust_score_events').insert(eventsToInsert);
      }

      // 4. Update Zustand — auth gate in _layout.tsx picks up identity and redirects to app
      setIdentity(typedIdentity);
      setProfile(typedProfile);

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.root}>
      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          <View style={s.inner}>

            {/* ── Header ─────────────────────────────────────── */}
            <View style={s.headerArea}>
              <Text style={s.heading}>Welcome to {Brand.name}</Text>
              <Text style={s.subheading}>What shall we call you?</Text>
            </View>

            {/* ── Name fields ────────────────────────────────── */}
            <View style={s.section}>
              <View style={s.fieldRow}>
                <View style={[s.inputWrap, s.inputFlex, { borderColor: inputBorder('firstName'), backgroundColor: theme.inputBackground }]}>
                  <IconUser size={16} color={focusedField === 'firstName' ? theme.accent : theme.textSecondary} />
                  <TextInput
                    style={[s.input, { color: theme.text }]}
                    value={firstName}
                    onChangeText={setFirstName}
                    placeholder="First name"
                    placeholderTextColor={theme.textDisabled}
                    autoCapitalize="words"
                    autoFocus
                    onFocus={() => setFocusedField('firstName')}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>

                <View style={[s.inputWrap, s.inputInitial, { borderColor: inputBorder('initial'), backgroundColor: theme.inputBackground }]}>
                  <TextInput
                    style={[s.input, s.inputCentre, { color: theme.text }]}
                    value={lastInitial}
                    onChangeText={v => setLastInitial(v.replace(/[^a-zA-Z]/g, ''))}
                    placeholder="A"
                    placeholderTextColor={theme.textDisabled}
                    autoCapitalize="characters"
                    maxLength={1}
                    onFocus={() => setFocusedField('initial')}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>
              </View>

              <Text style={s.hint}>
                Just your initial — we keep it that way.
              </Text>
            </View>

            {/* ── Measurements ───────────────────────────────── */}
            <View style={s.section}>
              <View style={s.sectionHeader}>
                <IconRuler2 size={16} color={theme.textSecondary} />
                <Text style={s.sectionTitle}>Measurements</Text>
                <View style={s.optionalPill}>
                  <Text style={s.optionalText}>optional</Text>
                </View>
              </View>
              <Text style={s.hint}>
                We sort listings by fit for you. Only you can see these.
              </Text>

              <View style={s.measureGrid}>
                {[
                  { key: 'bust',   label: 'Bust cm',    value: bust,     set: setBust },
                  { key: 'waist',  label: 'Waist cm',   value: waist,    set: setWaist },
                  { key: 'hips',   label: 'Hips cm',    value: hips,     set: setHips },
                  { key: 'height', label: 'Height cm',  value: height,   set: setHeight },
                ].map(({ key, label, value, set }) => (
                  <View key={key} style={s.measureCell}>
                    <Text style={s.measureLabel}>{label}</Text>
                    <TextInput
                      style={[s.measureInput, {
                        borderColor: inputBorder(key),
                        backgroundColor: theme.inputBackground,
                        color: theme.text,
                      }]}
                      value={value}
                      onChangeText={set}
                      keyboardType="number-pad"
                      placeholder="—"
                      placeholderTextColor={theme.textDisabled}
                      onFocus={() => setFocusedField(key)}
                      onBlur={() => setFocusedField(null)}
                    />
                  </View>
                ))}
              </View>

              <View style={s.shoeRow}>
                <Text style={s.measureLabel}>UK shoe size</Text>
                <View style={[s.inputWrap, s.shoeInput, { borderColor: inputBorder('shoe'), backgroundColor: theme.inputBackground }]}>
                  <TextInput
                    style={[s.input, { color: theme.text }]}
                    value={shoeSize}
                    onChangeText={setShoeSize}
                    keyboardType="decimal-pad"
                    placeholder="e.g. 6.5"
                    placeholderTextColor={theme.textDisabled}
                    onFocus={() => setFocusedField('shoe')}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>
              </View>
            </View>

            {!!error && <Text style={s.errorText}>{error}</Text>}

            {/* ── CTAs ───────────────────────────────────────── */}
            <View style={s.ctas}>
              <TouchableOpacity
                style={[
                  s.btnPrimary,
                  { backgroundColor: canSubmit ? theme.accent : theme.surface },
                ]}
                onPress={() => submit(false)}
                disabled={!canSubmit || loading}
                activeOpacity={0.85}
              >
                {loading
                  ? <ActivityIndicator color={theme.accentText} />
                  : <Text style={[s.btnPrimaryText, { color: canSubmit ? theme.accentText : theme.textDisabled }]}>
                      Save and continue
                    </Text>
                }
              </TouchableOpacity>

              <TouchableOpacity
                style={s.skipBtn}
                onPress={() => submit(true)}
                disabled={!canSubmit || loading}
              >
                <Text style={[s.skipText, { color: canSubmit ? theme.accent : theme.textDisabled }]}>
                  Skip measurements
                </Text>
              </TouchableOpacity>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function makeStyles(theme: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    root:     { flex: 1, backgroundColor: theme.background },
    flex:     { flex: 1 },
    scroll:   { flexGrow: 1 },
    inner:    { paddingHorizontal: 28, paddingTop: 24, paddingBottom: 40 },

    headerArea: { marginBottom: 28 },
    heading: {
      fontFamily: 'CormorantGaramond_700Bold',
      fontSize: 34,
      color: theme.text,
      marginBottom: 6,
    },
    subheading: {
      fontFamily: 'Inter_400Regular',
      fontSize: 15,
      color: theme.textSecondary,
    },

    section: { marginBottom: 28 },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 6,
    },
    sectionTitle: {
      fontFamily: 'Inter_500Medium',
      fontSize: 14,
      color: theme.textSecondary,
    },
    optionalPill: {
      backgroundColor: theme.accentSubtle,
      borderRadius: 10,
      paddingHorizontal: 8,
      paddingVertical: 2,
    },
    optionalText: {
      fontFamily: 'Inter_400Regular',
      fontSize: 11,
      color: theme.accent,
    },
    hint: {
      fontFamily: 'Inter_400Regular',
      fontSize: 12,
      color: theme.textDisabled,
      marginBottom: 12,
      lineHeight: 17,
    },

    fieldRow: { flexDirection: 'row', gap: 10 },
    inputFlex: { flex: 1 },
    inputInitial: { width: 52 },
    inputCentre: { textAlign: 'center' },

    inputWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      borderWidth: 1.5,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 13,
    },
    input: {
      flex: 1,
      fontFamily: 'Inter_400Regular',
      fontSize: 15,
    },

    measureGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      marginBottom: 12,
    },
    measureCell: { width: '47%' },
    measureLabel: {
      fontFamily: 'Inter_400Regular',
      fontSize: 12,
      color: theme.textSecondary,
      marginBottom: 4,
    },
    measureInput: {
      borderWidth: 1.5,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontFamily: 'Inter_400Regular',
      fontSize: 15,
    },

    shoeRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    shoeInput: { flex: 1 },

    errorText: {
      fontFamily: 'Inter_400Regular',
      fontSize: 13,
      color: theme.error,
      marginBottom: 8,
    },

    ctas: { gap: 4, marginTop: 8 },
    btnPrimary: {
      borderRadius: 12,
      paddingVertical: 15,
      alignItems: 'center',
    },
    btnPrimaryText: {
      fontFamily: Platform.OS === 'ios' ? 'AvenirNext-DemiBold' : 'Inter_600SemiBold',
      fontSize: 16,
    },
    skipBtn: { alignItems: 'center', paddingVertical: 14 },
    skipText: { fontFamily: 'Inter_400Regular', fontSize: 14 },
  });
}
