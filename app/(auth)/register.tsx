import { useState, useRef } from 'react';
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
  Animated,
  Linking,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  IconMail,
  IconLock,
  IconEye,
  IconEyeOff,
  IconArrowLeft,
  IconMailForward,
} from '@tabler/icons-react-native';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/hooks/useTheme';
import { Brand } from '@/constants/brand';

type Mode = 'register' | 'signin';
type Stage = 'credentials' | 'check_inbox';

export default function Register() {
  const theme = useTheme();
  const router = useRouter();
  const { mode: paramMode } = useLocalSearchParams<{ mode?: string }>();

  const [mode, setMode] = useState<Mode>(paramMode === 'signin' ? 'signin' : 'register');
  const [stage, setStage] = useState<Stage>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resent, setResent] = useState(false);
  const [error, setError] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const inboxFade = useRef(new Animated.Value(0)).current;

  const s = makeStyles(theme);
  const clearError = () => setError('');

  const showInboxStage = () => {
    setStage('check_inbox');
    Animated.timing(inboxFade, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const handleRegister = async () => {
    if (!email.trim() || !password) { setError('Please enter your email and password.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    clearError();
    const { error: err } = await supabase.auth.signUp({ email: email.trim(), password, options: { emailRedirectTo: 'almari://' } });
    setLoading(false);
    if (err) { setError(err.message); return; }
    showInboxStage();
  };

  const handleResend = async () => {
    setLoading(true);
    clearError();
    setResent(false);
    await supabase.auth.resend({ type: 'signup', email: email.trim() });
    setLoading(false);
    setResent(true);
  };

  const handleSignIn = async () => {
    if (!email.trim() || !password) { setError('Please enter your email and password.'); return; }
    setLoading(true);
    clearError();
    const { error: err } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (err) { setError(err.message); return; }
    // _layout.tsx detects session + identity → redirects to app automatically
  };

  const inputBorder = (field: string) =>
    focusedField === field ? theme.borderFocused : theme.border;

  // ── Check inbox stage ─────────────────────────────────────
  // Supabase sends a confirmation link by default. When the user taps it,
  // the deep link (almari://) returns them to the app, onAuthStateChange
  // fires, and _layout.tsx routes them to the welcome screen automatically.
  // No polling or manual verification needed here.
  if (stage === 'check_inbox') {
    return (
      <SafeAreaView style={s.root}>
        <Animated.View style={[s.inner, { opacity: inboxFade }]}>

          <TouchableOpacity style={s.back} onPress={() => { setStage('credentials'); setResent(false); }}>
            <IconArrowLeft size={20} color={theme.textSecondary} />
          </TouchableOpacity>

          <View style={s.inboxIcon}>
            <IconMailForward size={52} color={theme.accent} strokeWidth={1.25} />
          </View>

          <Text style={s.heading}>Check your inbox</Text>
          <Text style={s.subheading}>
            We sent a confirmation link to{'\n'}
            <Text style={[s.subheading, { color: theme.text, fontFamily: 'Inter_500Medium' }]}>
              {email.trim()}
            </Text>
          </Text>
          <Text style={s.inboxHint}>
            Tap the link in the email — it'll bring you straight back here.
          </Text>

          <TouchableOpacity
            style={[s.btnPrimary, { backgroundColor: theme.accent, marginTop: 32 }]}
            onPress={() => Linking.openURL('mailto:')}
            activeOpacity={0.85}
          >
            <Text style={[s.btnPrimaryText, { color: theme.accentText }]}>Open email app</Text>
          </TouchableOpacity>

          <View style={s.inboxFooter}>
            {resent
              ? <Text style={[s.linkText, { color: theme.success }]}>Link resent.</Text>
              : (
                <TouchableOpacity onPress={handleResend} disabled={loading}>
                  <Text style={[s.linkText, { color: theme.accent }]}>
                    {loading ? 'Sending…' : 'Resend link'}
                  </Text>
                </TouchableOpacity>
              )
            }
            <Text style={[s.linkText, { color: theme.textDisabled }]}>·</Text>
            <TouchableOpacity onPress={() => { setStage('credentials'); setResent(false); clearError(); }}>
              <Text style={[s.linkText, { color: theme.textSecondary }]}>Wrong email?</Text>
            </TouchableOpacity>
          </View>

        </Animated.View>
      </SafeAreaView>
    );
  }

  // ── Credentials stage ─────────────────────────────────────
  return (
    <SafeAreaView style={s.root}>
      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          <View style={s.inner}>

            <TouchableOpacity style={s.back} onPress={() => router.back()}>
              <IconArrowLeft size={20} color={theme.textSecondary} />
            </TouchableOpacity>

            <Text style={s.heading}>
              {mode === 'register' ? `Join ${Brand.name}` : 'Welcome back'}
            </Text>
            <Text style={s.subheading}>
              {mode === 'register'
                ? 'Create your account to start listing and buying.'
                : 'Sign in to continue.'}
            </Text>

            <View style={s.fieldGroup}>
              <View style={[s.inputWrap, { borderColor: inputBorder('email'), backgroundColor: theme.inputBackground }]}>
                <IconMail size={18} color={focusedField === 'email' ? theme.accent : theme.textSecondary} />
                <TextInput
                  style={[s.input, { color: theme.text }]}
                  value={email}
                  onChangeText={v => { setEmail(v); clearError(); }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholder="Email address"
                  placeholderTextColor={theme.textDisabled}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>

              <View style={[s.inputWrap, { borderColor: inputBorder('password'), backgroundColor: theme.inputBackground }]}>
                <IconLock size={18} color={focusedField === 'password' ? theme.accent : theme.textSecondary} />
                <TextInput
                  style={[s.input, { color: theme.text }]}
                  value={password}
                  onChangeText={v => { setPassword(v); clearError(); }}
                  secureTextEntry={!showPassword}
                  placeholder="Password"
                  placeholderTextColor={theme.textDisabled}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                />
                <TouchableOpacity onPress={() => setShowPassword(p => !p)} hitSlop={8}>
                  {showPassword
                    ? <IconEyeOff size={18} color={theme.textSecondary} />
                    : <IconEye size={18} color={theme.textSecondary} />
                  }
                </TouchableOpacity>
              </View>

              {mode === 'signin' && (
                <Text style={[s.forgotText, { color: theme.textSecondary }]}>
                  Forgotten your password? Email{' '}
                  <Text style={{ color: theme.accent }}>{Brand.email}</Text>
                </Text>
              )}
            </View>

            {!!error && <Text style={s.errorText}>{error}</Text>}

            <TouchableOpacity
              style={[s.btnPrimary, { backgroundColor: theme.accent }]}
              onPress={mode === 'register' ? handleRegister : handleSignIn}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color={theme.accentText} />
                : <Text style={[s.btnPrimaryText, { color: theme.accentText }]}>
                    {mode === 'register' ? 'Create account' : 'Sign in'}
                  </Text>
              }
            </TouchableOpacity>

            <TouchableOpacity
              style={s.linkBtn}
              onPress={() => { setMode(m => m === 'register' ? 'signin' : 'register'); clearError(); }}
            >
              <Text style={[s.linkText, { color: theme.textSecondary }]}>
                {mode === 'register' ? 'Already have an account? ' : "Don't have one? "}
                <Text style={{ color: theme.accent }}>
                  {mode === 'register' ? 'Sign in' : 'Get started'}
                </Text>
              </Text>
            </TouchableOpacity>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function makeStyles(theme: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    root:   { flex: 1, backgroundColor: theme.background },
    flex:   { flex: 1 },
    scroll: { flexGrow: 1 },
    inner:  { flex: 1, paddingHorizontal: 28, paddingTop: 16, paddingBottom: 32 },
    back:   { marginBottom: 28, alignSelf: 'flex-start' },

    heading: {
      fontFamily: 'CormorantGaramond_700Bold',
      fontSize: 34,
      color: theme.text,
      marginBottom: 8,
    },
    subheading: {
      fontFamily: 'Inter_400Regular',
      fontSize: 15,
      color: theme.textSecondary,
      lineHeight: 22,
      marginBottom: 16,
    },

    // Inbox stage
    inboxIcon:   { alignItems: 'center', marginBottom: 24, marginTop: 16 },
    inboxHint:   { fontFamily: 'Inter_400Regular', fontSize: 14, color: theme.textSecondary, lineHeight: 20, marginTop: 4 },
    inboxFooter: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginTop: 20 },

    // Credentials stage
    fieldGroup: { gap: 12, marginBottom: 8 },
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
    forgotText: {
      fontFamily: 'Inter_400Regular',
      fontSize: 13,
      marginTop: 4,
    },
    errorText: {
      fontFamily: 'Inter_400Regular',
      fontSize: 13,
      color: theme.error,
      marginBottom: 8,
    },
    btnPrimary: {
      borderRadius: 12,
      paddingVertical: 15,
      alignItems: 'center',
      marginTop: 16,
    },
    btnPrimaryText: {
      fontFamily: Platform.OS === 'ios' ? 'AvenirNext-DemiBold' : 'Inter_600SemiBold',
      fontSize: 16,
    },
    linkBtn:  { alignItems: 'center', paddingVertical: 14 },
    linkText: { fontFamily: 'Inter_400Regular', fontSize: 14 },
  });
}
