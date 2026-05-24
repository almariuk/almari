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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  IconMail,
  IconLock,
  IconEye,
  IconEyeOff,
  IconArrowLeft,
} from '@tabler/icons-react-native';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/hooks/useTheme';
import { Brand } from '@/constants/brand';

type Mode = 'register' | 'signin';
type Stage = 'credentials' | 'otp';

export default function Register() {
  const theme = useTheme();
  const router = useRouter();
  const { mode: paramMode } = useLocalSearchParams<{ mode?: string }>();

  const [mode, setMode] = useState<Mode>(paramMode === 'signin' ? 'signin' : 'register');
  const [stage, setStage] = useState<Stage>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const s = makeStyles(theme);
  const clearError = () => setError('');

  const handleRegister = async () => {
    if (!email.trim() || !password) { setError('Please enter your email and password.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    clearError();
    const { error: err } = await supabase.auth.signUp({ email: email.trim(), password });
    setLoading(false);
    if (err) { setError(err.message); return; }
    // Supabase auto-sends OTP when Confirm Email is ON
    setStage('otp');
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
    if (err) {
      if (err.message.toLowerCase().includes('email not confirmed')) {
        // Resend OTP and let them confirm inline
        await supabase.auth.resend({ type: 'signup', email: email.trim() });
        setStage('otp');
        return;
      }
      setError(err.message);
      return;
    }
    // _layout.tsx detects session + identity → redirects to app automatically
  };

  const handleVerify = async () => {
    if (code.length !== 8) { setError('Enter the 8-digit code from your email.'); return; }
    setLoading(true);
    clearError();
    const { error: err } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: code,
      type: 'signup',
    });
    setLoading(false);
    if (err) { setError('Invalid or expired code. Please try again.'); return; }
    // Session fires via onAuthStateChange → _layout.tsx handles routing
  };

  const handleResend = async () => {
    setCode('');
    clearError();
    setCodeSent(false);
    await supabase.auth.resend({ type: 'signup', email: email.trim() });
    setCodeSent(true);
  };

  const inputBorder = (field: string) =>
    focusedField === field ? theme.borderFocused : theme.border;

  // ── OTP stage ─────────────────────────────────────────────
  if (stage === 'otp') {
    return (
      <SafeAreaView style={s.root}>
        <KeyboardAvoidingView
          style={s.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
            <View style={s.inner}>

              <TouchableOpacity
                style={s.back}
                onPress={() => { setStage('credentials'); setCode(''); clearError(); setCodeSent(false); }}
              >
                <IconArrowLeft size={20} color={theme.textSecondary} />
              </TouchableOpacity>

              <Text style={s.heading}>Check your email</Text>
              <Text style={s.subheading}>
                We sent an 8-digit code to{' '}
                <Text style={{ color: theme.text, fontFamily: 'Inter_500Medium' }}>
                  {email.trim()}
                </Text>
                . Enter it below to verify your account.
              </Text>

              {!!error && <Text style={[s.errorText, { marginBottom: 12 }]}>{error}</Text>}
              {codeSent && !error && (
                <Text style={[s.successText, { marginBottom: 12 }]}>New code sent.</Text>
              )}

              <TextInput
                style={[s.codeInput, {
                  color: theme.text,
                  borderColor: code.length > 0 ? theme.borderFocused : theme.border,
                  backgroundColor: theme.inputBackground,
                }]}
                value={code}
                onChangeText={v => { setCode(v.replace(/\D/g, '')); clearError(); setCodeSent(false); }}
                keyboardType="number-pad"
                maxLength={8}
                placeholder="00000000"
                placeholderTextColor={theme.textDisabled}
                autoFocus
              />

              <TouchableOpacity
                style={[s.btnPrimary, { backgroundColor: theme.accent, marginTop: 20 }]}
                onPress={handleVerify}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading
                  ? <ActivityIndicator color={theme.accentText} />
                  : <Text style={[s.btnPrimaryText, { color: theme.accentText }]}>Confirm</Text>
                }
              </TouchableOpacity>

              <TouchableOpacity style={s.linkBtn} onPress={handleResend}>
                <Text style={[s.linkText, { color: theme.textSecondary }]}>
                  Didn't receive it? Check your spam folder, or{' '}
                  <Text style={{ color: theme.accent }}>resend</Text>
                </Text>
              </TouchableOpacity>

            </View>
          </ScrollView>
        </KeyboardAvoidingView>
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

            {!!error && <Text style={[s.errorText, { marginBottom: 12 }]}>{error}</Text>}

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
    successText: {
      fontFamily: 'Inter_400Regular',
      fontSize: 13,
      color: theme.success,
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

    codeInput: {
      borderWidth: 1.5,
      borderRadius: 10,
      paddingVertical: 14,
      paddingHorizontal: 16,
      fontSize: 28,
      letterSpacing: 10,
      textAlign: 'center',
      fontFamily: 'Inter_600SemiBold',
      marginTop: 8,
    },
  });
}
