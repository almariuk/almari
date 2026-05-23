import { useState, useRef, useCallback } from 'react';
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
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const otpSlide = useRef(new Animated.Value(0)).current;

  const s = makeStyles(theme);

  const clearError = () => setError('');

  const showOtpStage = useCallback(() => {
    setStage('otp');
    Animated.spring(otpSlide, {
      toValue: 1,
      tension: 60,
      friction: 10,
      useNativeDriver: true,
    }).start();
  }, [otpSlide]);

  const handleRegister = async () => {
    if (!email.trim() || !password) { setError('Please enter your email and password.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    clearError();
    const { error: err } = await supabase.auth.signUp({ email: email.trim(), password });
    setLoading(false);
    if (err) { setError(err.message); return; }
    showOtpStage();
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) { setError('Please enter the 6-digit code.'); return; }
    setLoading(true);
    clearError();
    const { error: err } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: otp.trim(),
      type: 'signup',
    });
    setLoading(false);
    if (err) { setError(err.message); return; }
    // _layout.tsx will detect session + no identity → redirect to welcome
    router.replace('/(auth)/welcome');
  };

  const handleResend = async () => {
    setLoading(true);
    clearError();
    await supabase.auth.resend({ type: 'signup', email: email.trim() });
    setLoading(false);
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

  // ── OTP stage ──────────────────────────────────────────────
  if (stage === 'otp') {
    const translateY = otpSlide.interpolate({ inputRange: [0, 1], outputRange: [40, 0] });
    return (
      <SafeAreaView style={[s.root]}>
        <KeyboardAvoidingView
          style={s.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
            <Animated.View style={[s.inner, { opacity: otpSlide, transform: [{ translateY }] }]}>

              <TouchableOpacity style={s.back} onPress={() => setStage('credentials')}>
                <IconArrowLeft size={20} color={theme.textSecondary} />
              </TouchableOpacity>

              <Text style={s.heading}>Check your email</Text>
              <Text style={s.subheading}>
                We sent a 6-digit code to{'\n'}
                <Text style={[s.subheading, { color: theme.text, fontFamily: 'Inter_500Medium' }]}>
                  {email.trim()}
                </Text>
              </Text>

              <View style={s.fieldGroup}>
                <TextInput
                  style={[s.otpInput, { borderColor: inputBorder('otp'), color: theme.text, backgroundColor: theme.inputBackground }]}
                  value={otp}
                  onChangeText={v => { setOtp(v.replace(/[^0-9]/g, '')); clearError(); }}
                  keyboardType="number-pad"
                  maxLength={6}
                  autoFocus
                  textAlign="center"
                  onFocus={() => setFocusedField('otp')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="— — — — — —"
                  placeholderTextColor={theme.textDisabled}
                />
              </View>

              {!!error && <Text style={s.errorText}>{error}</Text>}

              <TouchableOpacity
                style={[s.btnPrimary, { backgroundColor: theme.accent }]}
                onPress={handleVerifyOtp}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading
                  ? <ActivityIndicator color={theme.accentText} />
                  : <Text style={[s.btnPrimaryText, { color: theme.accentText }]}>Verify email</Text>
                }
              </TouchableOpacity>

              <TouchableOpacity style={s.linkBtn} onPress={handleResend} disabled={loading}>
                <Text style={[s.linkText, { color: theme.accent }]}>Resend code</Text>
              </TouchableOpacity>

            </Animated.View>
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

            <View style={s.fieldGroup}>
              {/* Email */}
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

              {/* Password */}
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
                {mode === 'register'
                  ? 'Already have an account? '
                  : "Don't have one? "
                }
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
    root: { flex: 1, backgroundColor: theme.background },
    flex: { flex: 1 },
    scroll: { flexGrow: 1 },
    inner: { flex: 1, paddingHorizontal: 28, paddingTop: 16, paddingBottom: 32 },
    back: { marginBottom: 28, alignSelf: 'flex-start' },
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
      marginBottom: 32,
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
    otpInput: {
      borderWidth: 1.5,
      borderRadius: 10,
      paddingVertical: 18,
      fontSize: 28,
      fontFamily: 'Inter_500Medium',
      letterSpacing: 12,
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
    linkBtn: { alignItems: 'center', paddingVertical: 14 },
    linkText: { fontFamily: 'Inter_400Regular', fontSize: 14 },
  });
}
