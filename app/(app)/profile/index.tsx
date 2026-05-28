import { useState, useEffect, useMemo, type ReactNode } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  IconChevronRight,
  IconAlertTriangle,
  IconCheck,
  IconMapPin,
  IconX,
} from '@tabler/icons-react-native';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/auth';
import { useThemeStore, ACCENT_PALETTES } from '@/store/theme';
import { IconCandleFilled } from '@tabler/icons-react-native';
import { useTrustTiers, getDiyaColour } from '@/hooks/useTrustTiers';
import type { UserAddressRow, PayoutRow, TransactionRow, PayoutStatus, TransactionStatus } from '@/types/database';

// ── Constants ─────────────────────────────────────────────────

const PREF_PUSH = '@almari:push_enabled';
const PREF_EMAIL = '@almari:email_opted_in';

const TIER_DATA = [
  { min: 0,   max: 20,   name: 'Nayi Shuruwat', copy: 'Every trusted seller starts here. Keep listing.' },
  { min: 21,  max: 50,   name: 'Apna',          copy: "You're one of ours. The community knows you." },
  { min: 51,  max: 100,  name: 'Bharosa',       copy: 'Bharosa — trust. Earned, not given.' },
  { min: 101, max: 200,  name: 'Izzat',         copy: 'Izzat — respect. The community values what you bring.' },
  { min: 201, max: 9999, name: 'Aanch',         copy: 'Aanch — the flame itself.' },
];

function getTier(score: number) {
  return TIER_DATA.find((t) => score >= t.min && score <= t.max) ?? TIER_DATA[0];
}

// ── Helpers ───────────────────────────────────────────────────

function gbp(pence: number): string {
  return `£${(pence / 100).toFixed(2)}`;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function payoutStatusLabel(s: PayoutStatus): string {
  return { pending: 'Scheduled', processing: 'Processing', paid: 'Paid', failed: 'Failed' }[s] ?? s;
}

function txStatusLabel(s: TransactionStatus): string {
  return (
    {
      paid: 'Order placed', dispatched: 'Dispatched', in_transit: 'In transit',
      delivered: 'Delivered', completed: 'Completed', concern_raised: 'Concern raised',
      lost_in_post: 'Lost in post', refunded: 'Refunded',
    }[s] ?? s
  );
}

// ── Small reusable pieces ─────────────────────────────────────

function SectionCard({ title, children }: { title: string; children?: ReactNode }) {
  const theme = useTheme();
  return (
    <View style={[card.wrap, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <Text style={[card.title, { color: theme.textSecondary }]}>{title.toUpperCase()}</Text>
      {children}
    </View>
  );
}

const card = StyleSheet.create({
  wrap:  { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 12 },
  title: { fontFamily: 'Inter_600SemiBold', fontSize: 11, letterSpacing: 0.8, marginBottom: 12 },
});

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  const theme = useTheme();
  if (!value) return null;
  return (
    <View style={row.wrap}>
      <Text style={[row.label, { color: theme.textSecondary }]}>{label}</Text>
      <Text style={[row.value, { color: theme.text }]}>{value}</Text>
    </View>
  );
}

function NavRow({
  label, sublabel, onPress, badge,
}: { label: string; sublabel?: string; onPress: () => void; badge?: 'connected' | 'pending' }) {
  const theme = useTheme();
  return (
    <TouchableOpacity style={row.wrap} onPress={onPress} activeOpacity={0.7}>
      <View style={{ flex: 1 }}>
        <Text style={[row.value, { color: theme.text }]}>{label}</Text>
        {sublabel && <Text style={[row.label, { color: theme.textSecondary, marginTop: 1 }]}>{sublabel}</Text>}
      </View>
      {badge === 'connected' && (
        <View style={[row.badge, { backgroundColor: theme.success + '22', borderColor: theme.success }]}>
          <Text style={[row.badgeText, { color: theme.success }]}>Connected</Text>
        </View>
      )}
      {badge === 'pending' && (
        <View style={[row.badge, { backgroundColor: theme.error + '15', borderColor: theme.error }]}>
          <Text style={[row.badgeText, { color: theme.error }]}>Not set up</Text>
        </View>
      )}
      <IconChevronRight size={16} color={theme.textSecondary} style={{ marginLeft: 8 }} />
    </TouchableOpacity>
  );
}

function ToggleRow({ label, sublabel, value, onToggle }: {
  label: string; sublabel?: string; value: boolean; onToggle: (v: boolean) => void;
}) {
  const theme = useTheme();
  return (
    <View style={row.wrap}>
      <View style={{ flex: 1 }}>
        <Text style={[row.value, { color: theme.text }]}>{label}</Text>
        {sublabel && <Text style={[row.label, { color: theme.textSecondary, marginTop: 1 }]}>{sublabel}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: theme.border, true: theme.accent }}
        ios_backgroundColor={theme.border}
      />
    </View>
  );
}

const row = StyleSheet.create({
  wrap:      { flexDirection: 'row', alignItems: 'center', paddingVertical: 9, gap: 8 },
  label:     { fontFamily: 'Inter_400Regular', fontSize: 12 },
  value:     { fontFamily: 'Inter_500Medium', fontSize: 14 },
  badge:     { borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontFamily: 'Inter_600SemiBold', fontSize: 11 },
  divider:   { height: StyleSheet.hairlineWidth },
});

// ── Screen ────────────────────────────────────────────────────

export default function Profile() {
  const theme = useTheme();
  const router = useRouter();
  const qc = useQueryClient();
  const s = makeStyles(theme);

  const { session, identity, profile: cachedProfile, setIdentity } = useAuthStore();
  const userId = session?.user.id ?? '';        // auth UID — used for auth operations only
  const identityId = identity?.id ?? '';        // user_identity.id — used for all DB FK references
  const email = session?.user.email ?? '';

  // Always fetch a fresh copy so counts (active_listing_count etc.) reflect DB state
  const { data: freshProfile } = useQuery({
    queryKey: ['user_profile', identity?.id],
    queryFn: async () => {
      if (!identity?.id) return null;
      const { data } = await supabase.from('user_profile').select('*').eq('user_id', identity.id).maybeSingle();
      return data;
    },
    enabled: !!identity?.id,
    staleTime: 0,
  });
  const profile = freshProfile ?? cachedProfile;

  // ── Notification prefs (AsyncStorage) ──────────────────────

  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(false);

  useEffect(() => {
    AsyncStorage.multiGet([PREF_PUSH, PREF_EMAIL]).then((pairs: readonly [string, string | null][]) => {
      const push = pairs[0][1];
      const mail = pairs[1][1];
      if (push !== null) setPushEnabled(push === 'true');
      if (mail !== null) setEmailEnabled(mail === 'true');
    });
  }, []);

  const togglePush = async (v: boolean) => {
    setPushEnabled(v);
    await AsyncStorage.setItem(PREF_PUSH, String(v));
  };
  const toggleEmail = async (v: boolean) => {
    setEmailEnabled(v);
    await AsyncStorage.setItem(PREF_EMAIL, String(v));
  };

  // ── Inline edit state ────────────────────────────────────────

  const [editingName, setEditingName] = useState(false);
  const [editFirstName, setEditFirstName] = useState(identity?.first_name ?? '');
  const [editLastInitial, setEditLastInitial] = useState(identity?.last_name_initial ?? '');
  const [savingName, setSavingName] = useState(false);

  const saveName = async () => {
    if (!identity) return;
    setSavingName(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('user_identity')
      .update({ first_name: editFirstName.trim(), last_name_initial: editLastInitial.trim().charAt(0).toUpperCase() })
      .eq('id', identity.id)
      .select()
      .single();
    setSavingName(false);
    if (!error && data) {
      setIdentity(data);
      setEditingName(false);
    }
  };

  // ── Add address state ─────────────────────────────────────────

  const [addingAddress, setAddingAddress] = useState(false);
  const [addrLine1, setAddrLine1] = useState('');
  const [addrLine2, setAddrLine2] = useState('');
  const [addrCity, setAddrCity] = useState('');
  const [addrPostcode, setAddrPostcode] = useState('');
  const [addrPhone, setAddrPhone] = useState('');
  const [savingAddr, setSavingAddr] = useState(false);

  const resetAddrForm = () => {
    setAddrLine1(''); setAddrLine2(''); setAddrCity(''); setAddrPostcode(''); setAddrPhone('');
    setAddingAddress(false);
  };

  const saveAddress = async () => {
    if (!addrLine1.trim() || !addrCity.trim() || !addrPostcode.trim()) return;
    setSavingAddr(true);
    const isFirst = (addressQuery.data ?? []).length === 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('user_addresses').insert({
      user_id: identityId,
      address_line_1: addrLine1.trim(),
      address_line_2: addrLine2.trim() || null,
      city: addrCity.trim(),
      postcode: addrPostcode.trim().toUpperCase(),
      contact_phone: addrPhone.trim() || null,
      is_default: isFirst,
    });
    setSavingAddr(false);
    resetAddrForm();
    qc.invalidateQueries({ queryKey: ['user_addresses', identityId] });
  };

  const setDefaultAddress = async (addrId: string) => {
    const addresses = addressQuery.data ?? [];
    // Clear all defaults then set new one
    await Promise.all(
      addresses.map((a: UserAddressRow) =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase as any).from('user_addresses').update({ is_default: a.id === addrId }).eq('id', a.id),
      ),
    );
    qc.invalidateQueries({ queryKey: ['user_addresses', identityId] });
  };

  const deleteAddress = async (addrId: string) => {
    await supabase.from('user_addresses').delete().eq('id', addrId);
    qc.invalidateQueries({ queryKey: ['user_addresses', identityId] });
  };

  // ── Change password ───────────────────────────────────────────

  const [pwResetSent, setPwResetSent] = useState(false);
  const sendPasswordReset = async () => {
    await supabase.auth.resetPasswordForEmail(email);
    setPwResetSent(true);
  };

  // ── Queries ───────────────────────────────────────────────────

  const addressQuery = useQuery<UserAddressRow[]>({
    queryKey: ['user_addresses', identityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_addresses')
        .select('*')
        .eq('user_id', identityId)
        .order('is_default', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!identityId,
  });

  const payoutQuery = useQuery<PayoutRow[]>({
    queryKey: ['payouts_recent', identityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payouts')
        .select('*')
        .eq('seller_id', identityId)
        .order('created_at', { ascending: false })
        .limit(3);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!identityId,
  });

  const purchaseQuery = useQuery<TransactionRow[]>({
    queryKey: ['purchases_recent', identityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('buyer_id', identityId)
        .order('created_at', { ascending: false })
        .limit(3);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!identityId,
  });

  const orderCountsQuery = useQuery<{ purchases: number; sales: number }>({
    queryKey: ['order_counts', identityId],
    queryFn: async () => {
      const ACTIVE = ['pending_payment', 'paid', 'dispatched', 'delivered', 'concern_open', 'concern_resolved'];
      const [p, s] = await Promise.all([
        (supabase as any).from('transactions').select('id', { count: 'exact', head: true }).eq('buyer_id', identityId).in('status', ACTIVE),
        (supabase as any).from('transactions').select('id', { count: 'exact', head: true }).eq('seller_id', identityId).in('status', ACTIVE),
      ]);
      return { purchases: p.count ?? 0, sales: s.count ?? 0 };
    },
    enabled: !!identityId,
  });

  // ── Derived ───────────────────────────────────────────────────

  const { data: trustTiers = [] } = useTrustTiers();
  const tier = getTier(profile?.trust_score_cached ?? 0);

  const measurementCount = useMemo(
    () =>
      [profile?.bust_cm, profile?.waist_cm, profile?.hips_cm, profile?.height_cm, profile?.uk_shoe_size]
        .filter((v) => v !== null).length,
    [profile],
  );

  const removalScore = Math.abs(profile?.removal_score ?? 0);
  const suspended = !profile?.free_listing_active && (profile?.free_listing_suspended_at ?? null) !== null;

  // ── Sign out ──────────────────────────────────────────────────

  const { clear } = useAuthStore();
  const signOut = async () => {
    await supabase.auth.signOut();
    clear();
  };

  const { accentKey, setAccentKey } = useThemeStore();

  // ── Render ────────────────────────────────────────────────────

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={s.header}>
          <View style={s.headerText}>
            <Text style={s.headerName}>
              {identity?.first_name ?? '—'} {identity?.last_name_initial ?? ''}.
            </Text>
            <Text style={s.headerTier}>{tier.name}</Text>
          </View>
          <IconCandleFilled size={56} color={getDiyaColour(profile?.trust_score_cached ?? 0, trustTiers)} />
        </View>

        {/* KPI row — Listings / Purchases / Sales */}
        <View style={s.kpiRow}>
          {([
            { label: 'Listings', count: profile?.active_listing_count ?? 0, route: '/profile/my-listings' },
            { label: 'Purchases', count: orderCountsQuery.data?.purchases ?? 0, route: '/profile/purchases' },
            { label: 'Sales', count: orderCountsQuery.data?.sales ?? 0, route: '/profile/sales' },
          ] as const).map(({ label, count, route }) => (
            <TouchableOpacity
              key={label}
              style={[s.kpiTile, { backgroundColor: theme.surface, borderColor: theme.border }]}
              onPress={() => router.push(route as any)}
              activeOpacity={0.7}
            >
              <Text style={[s.kpiCount, { color: theme.text }]}>{count}</Text>
              <Text style={[s.kpiLabel, { color: theme.textSecondary }]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Personal details */}
        <SectionCard title="Personal details">
          {!editingName ? (
            <>
              <InfoRow label="Name" value={`${identity?.first_name ?? ''} ${identity?.last_name_initial ?? ''}.`} />
              <InfoRow label="Email" value={email} />
              <TouchableOpacity style={s.editLink} onPress={() => setEditingName(true)}>
                <Text style={[s.editLinkText, { color: theme.accent }]}>Edit name</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={s.inlineForm}>
              <View style={s.inlineRow}>
                <View style={[s.inlineInput, { borderColor: theme.border, backgroundColor: theme.inputBackground, flex: 2 }]}>
                  <TextInput
                    style={[s.inlineInputText, { color: theme.text }]}
                    value={editFirstName}
                    onChangeText={setEditFirstName}
                    placeholder="First name"
                    placeholderTextColor={theme.textDisabled}
                    autoCapitalize="words"
                  />
                </View>
                <View style={[s.inlineInput, { borderColor: theme.border, backgroundColor: theme.inputBackground, flex: 1 }]}>
                  <TextInput
                    style={[s.inlineInputText, { color: theme.text }]}
                    value={editLastInitial}
                    onChangeText={setEditLastInitial}
                    placeholder="Last initial"
                    placeholderTextColor={theme.textDisabled}
                    autoCapitalize="characters"
                    maxLength={1}
                  />
                </View>
              </View>
              <View style={s.inlineButtons}>
                <TouchableOpacity style={[s.inlineSave, { backgroundColor: theme.accent }]} onPress={saveName} disabled={savingName}>
                  {savingName ? <ActivityIndicator size="small" color={theme.accentText} /> : <Text style={[s.inlineSaveText, { color: theme.accentText }]}>Save</Text>}
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setEditingName(false)} style={s.inlineCancel}>
                  <IconX size={18} color={theme.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </SectionCard>

        {/* Account settings */}
        <SectionCard title="Account">
          {pwResetSent ? (
            <View style={s.resetSent}>
              <IconCheck size={16} color={theme.success} />
              <Text style={[s.resetSentText, { color: theme.success }]}>Reset link sent to {email}</Text>
            </View>
          ) : (
            <NavRow label="Change password" onPress={sendPasswordReset} />
          )}
          <View style={[row.divider, { backgroundColor: theme.border, marginVertical: 4 }]} />
          <ToggleRow
            label="Push notifications"
            sublabel="On by default"
            value={pushEnabled}
            onToggle={togglePush}
          />
          <ToggleRow
            label="Email updates"
            sublabel="Opt in to hear about new arrivals"
            value={emailEnabled}
            onToggle={toggleEmail}
          />
        </SectionCard>

        {/* Address book */}
        <SectionCard title="Delivery addresses">
          {(addressQuery.data ?? []).map((addr: UserAddressRow) => (
            <View key={addr.id} style={[s.addrCard, { borderColor: addr.is_default ? theme.accent : theme.border }]}>
              <View style={s.addrCardTop}>
                <IconMapPin size={14} color={addr.is_default ? theme.accent : theme.textSecondary} />
                <View style={{ flex: 1 }}>
                  <Text style={[s.addrText, { color: theme.text }]}>
                    {addr.address_line_1}{addr.address_line_2 ? `, ${addr.address_line_2}` : ''}, {addr.city}, {addr.postcode}
                  </Text>
                  {addr.contact_phone && (
                    <Text style={[s.addrText, { color: theme.textSecondary, fontSize: 12, marginTop: 2 }]}>
                      {addr.contact_phone}
                    </Text>
                  )}
                </View>
                {addr.is_default && (
                  <Text style={[s.defaultBadge, { color: theme.accent }]}>Default</Text>
                )}
              </View>
              {!addr.is_default && (
                <View style={s.addrActions}>
                  <TouchableOpacity onPress={() => setDefaultAddress(addr.id)}>
                    <Text style={[s.addrAction, { color: theme.accent }]}>Set as default</Text>
                  </TouchableOpacity>
                  <Text style={{ color: theme.border }}>·</Text>
                  <TouchableOpacity onPress={() => deleteAddress(addr.id)}>
                    <Text style={[s.addrAction, { color: theme.error }]}>Remove</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}

          {!addingAddress ? (
            <TouchableOpacity style={s.addAddrBtn} onPress={() => setAddingAddress(true)}>
              <Text style={[s.addAddrText, { color: theme.accent }]}>+ Add address</Text>
            </TouchableOpacity>
          ) : (
            <View style={[s.addrForm, { borderColor: theme.border }]}>
              {[
                { placeholder: 'Address line 1', value: addrLine1, set: setAddrLine1, caps: 'words' as const },
                { placeholder: 'Address line 2 (optional)', value: addrLine2, set: setAddrLine2, caps: 'words' as const },
                { placeholder: 'City / Town', value: addrCity, set: setAddrCity, caps: 'words' as const },
                { placeholder: 'Postcode', value: addrPostcode, set: setAddrPostcode, caps: 'characters' as const },
                { placeholder: 'WhatsApp / phone (optional)', value: addrPhone, set: setAddrPhone, caps: 'none' as const },
              ].map(({ placeholder, value, set, caps }) => (
                <TextInput
                  key={placeholder}
                  style={[s.addrInput, { borderColor: theme.border, backgroundColor: theme.inputBackground, color: theme.text }]}
                  value={value}
                  onChangeText={set}
                  placeholder={placeholder}
                  placeholderTextColor={theme.textDisabled}
                  autoCapitalize={caps}
                  keyboardType={placeholder.includes('WhatsApp') ? 'phone-pad' : 'default'}
                />
              ))}
              <View style={s.inlineButtons}>
                <TouchableOpacity
                  style={[s.inlineSave, { backgroundColor: theme.accent, opacity: (!addrLine1.trim() || !addrCity.trim() || !addrPostcode.trim()) ? 0.5 : 1 }]}
                  onPress={saveAddress}
                  disabled={savingAddr || !addrLine1.trim() || !addrCity.trim() || !addrPostcode.trim()}
                >
                  {savingAddr ? <ActivityIndicator size="small" color={theme.accentText} /> : <Text style={[s.inlineSaveText, { color: theme.accentText }]}>Save address</Text>}
                </TouchableOpacity>
                <TouchableOpacity onPress={resetAddrForm} style={s.inlineCancel}>
                  <IconX size={18} color={theme.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </SectionCard>

        {/* Measurements */}
        <SectionCard title="Measurements">
          <NavRow
            label={measurementCount > 0 ? `${measurementCount} of 5 set` : 'Not set yet'}
            sublabel="Used for Fits Me sort"
            onPress={() => router.push('/profile/measurements')}
          />
        </SectionCard>

        {/* Payment details */}
        <SectionCard title="Payment details">
          <NavRow
            label={profile?.bank_details_provided ? 'Payment details saved' : 'Set up payment details'}
            sublabel={profile?.bank_details_provided ? 'Buyers can pay you' : 'Required before you can sell'}
            onPress={() => router.push('/profile/bank-details')}
            badge={profile?.bank_details_provided ? 'connected' : 'pending'}
          />
        </SectionCard>

        {/* Trust score */}
        <SectionCard title="Your trust">
          <View style={s.trustCenter}>
            <IconCandleFilled size={72} color={getDiyaColour(profile?.trust_score_cached ?? 0, trustTiers)} />
            <Text style={[s.tierName, { color: theme.text }]}>{tier.name}</Text>
            <Text style={[s.tierCopy, { color: theme.textSecondary }]}>{tier.copy}</Text>
          </View>
        </SectionCard>

        {/* Removal score */}
        <SectionCard title="Removal score">
          <View style={s.removalRow}>
            <View style={[
              s.removalBubble,
              { backgroundColor: removalScore === 0 ? theme.surface : removalScore >= 9 ? theme.error + '20' : removalScore >= 5 ? '#FF990020' : '#FF990010' },
            ]}>
              <Text style={[s.removalNumber, { color: removalScore === 0 ? theme.textSecondary : removalScore >= 9 ? theme.error : '#CC7700' }]}>
                {removalScore}
              </Text>
            </View>
            <Text style={[s.removalLabel, { color: theme.textSecondary }]}>
              {removalScore === 0
                ? 'Clean record'
                : removalScore < 5
                ? 'Keep listings current to stay low'
                : removalScore < 9
                ? 'Warning — score is getting high'
                : 'Free listing suspended'}
            </Text>
          </View>
          {removalScore >= 5 && removalScore < 9 && (
            <View style={[s.removalBanner, { borderColor: '#CC7700', backgroundColor: '#FF990015' }]}>
              <IconAlertTriangle size={16} color="#CC7700" />
              <Text style={[s.removalBannerText, { color: '#CC7700' }]}>
                A removal score of 9 suspends free listing for 3 months. Only remove listings for genuine reasons.
              </Text>
            </View>
          )}
          {(removalScore >= 9 || suspended) && (
            <View style={[s.removalBanner, { borderColor: theme.error, backgroundColor: theme.error + '15' }]}>
              <IconAlertTriangle size={16} color={theme.error} />
              <Text style={[s.removalBannerText, { color: theme.error }]}>
                Free listing is suspended. You can still list by paying a small fee per listing.
                {profile?.free_listing_reinstated_at
                  ? ` Reinstated ${fmtDate(profile.free_listing_reinstated_at)}.`
                  : ''}
              </Text>
            </View>
          )}
        </SectionCard>

        {/* Payout history */}
        <SectionCard title="Payouts">
          {payoutQuery.isLoading ? (
            <ActivityIndicator size="small" color={theme.accent} />
          ) : (payoutQuery.data ?? []).length === 0 ? (
            <Text style={[s.emptyNote, { color: theme.textDisabled }]}>No payouts yet</Text>
          ) : (
            (payoutQuery.data ?? []).map((p: PayoutRow) => (
              <View key={p.id} style={[s.historyRow, { borderBottomColor: theme.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[s.historyMain, { color: theme.text }]}>{gbp(p.total_pence)}</Text>
                  <Text style={[s.historySub, { color: theme.textSecondary }]}>
                    {p.transaction_count} {p.transaction_count === 1 ? 'item' : 'items'} · {fmtDate(p.scheduled_for)}
                  </Text>
                </View>
                <Text style={[
                  s.historyStatus,
                  { color: p.status === 'paid' ? theme.success : p.status === 'failed' ? theme.error : theme.textSecondary },
                ]}>
                  {payoutStatusLabel(p.status)}
                </Text>
              </View>
            ))
          )}
        </SectionCard>

        {/* Theme picker */}
        <SectionCard title="Colour theme">
          <View style={s.swatchRow}>
            {ACCENT_PALETTES.map(palette => (
              <TouchableOpacity
                key={palette.key}
                onPress={() => setAccentKey(palette.key)}
                activeOpacity={0.8}
                style={s.swatchWrap}
              >
                <View style={[
                  s.swatch,
                  { backgroundColor: palette.swatch },
                  accentKey === palette.key && { borderWidth: 3, borderColor: theme.text },
                ]}>
                  {accentKey === palette.key && (
                    <IconCheck size={14} color="#fff" />
                  )}
                </View>
                <Text style={[s.swatchLabel, { color: accentKey === palette.key ? theme.text : theme.textSecondary }]}>
                  {palette.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </SectionCard>

        {/* Sign out */}
        <TouchableOpacity style={[s.signOutBtn, { borderColor: theme.border }]} onPress={signOut} activeOpacity={0.7}>
          <Text style={[s.signOutText, { color: theme.error }]}>Sign out</Text>
        </TouchableOpacity>

        {/* Legal footer */}
        <View style={s.legalFooter}>
          <Text style={[s.legalLink, { color: theme.textDisabled }]} onPress={() => Linking.openURL('https://almari.uk/terms')}>
            Terms &amp; Conditions
          </Text>
          <Text style={[s.legalDot, { color: theme.textDisabled }]}>·</Text>
          <Text style={[s.legalLink, { color: theme.textDisabled }]} onPress={() => Linking.openURL('https://almari.uk/privacy')}>
            Privacy Policy
          </Text>
          <Text style={[s.legalDot, { color: theme.textDisabled }]}>·</Text>
          <Text style={[s.legalLink, { color: theme.textDisabled }]} onPress={() => Linking.openURL('https://almari.uk/values')}>
            About Almari
          </Text>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────

function makeStyles(theme: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    root:  { flex: 1, backgroundColor: theme.background },
    scroll: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16 },

    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },

    kpiRow:   { flexDirection: 'row', gap: 10, marginBottom: 20 },
    kpiTile:  { flex: 1, borderRadius: 14, borderWidth: 1, paddingVertical: 14, alignItems: 'center', gap: 3 },
    kpiCount: { fontFamily: 'CormorantGaramond_700Bold', fontSize: 28, lineHeight: 32 },
    kpiLabel: { fontFamily: 'Inter_400Regular', fontSize: 12 },
    headerText: { flex: 1, paddingRight: 16 },
    headerName: { fontFamily: 'CormorantGaramond_700Bold', fontSize: 32, color: theme.text, lineHeight: 36 },
    headerTier: { fontFamily: 'Inter_400Regular', fontSize: 14, color: theme.textSecondary, marginTop: 2 },

    editLink:     { marginTop: 6 },
    editLinkText: { fontFamily: 'Inter_500Medium', fontSize: 13 },

    inlineForm:    { marginTop: 4, gap: 8 },
    inlineRow:     { flexDirection: 'row', gap: 8 },
    inlineInput:   { borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11 },
    inlineInputText: { fontFamily: 'Inter_400Regular', fontSize: 14 },
    inlineButtons: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    inlineSave:    { flex: 1, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
    inlineSaveText:{ fontFamily: 'Inter_600SemiBold', fontSize: 14 },
    inlineCancel:  { padding: 8 },

    resetSent:     { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 },
    resetSentText: { fontFamily: 'Inter_400Regular', fontSize: 13 },

    addrCard:    { borderWidth: 1.5, borderRadius: 12, padding: 12, marginBottom: 8 },
    addrCardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
    addrText:    { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19 },
    defaultBadge:{ fontFamily: 'Inter_600SemiBold', fontSize: 11 },
    addrActions: { flexDirection: 'row', gap: 12, marginTop: 8, paddingLeft: 22 },
    addrAction:  { fontFamily: 'Inter_500Medium', fontSize: 12 },
    addAddrBtn:  { paddingVertical: 8 },
    addAddrText: { fontFamily: 'Inter_500Medium', fontSize: 14 },
    addrForm:    { borderWidth: 1.5, borderRadius: 12, padding: 12, gap: 8 },
    addrInput:   { borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11, fontFamily: 'Inter_400Regular', fontSize: 14 },

    trustCenter: { alignItems: 'center', paddingVertical: 8, gap: 8 },
    tierName:    { fontFamily: 'CormorantGaramond_700Bold', fontSize: 26 },
    tierCopy:    { fontFamily: 'Inter_400Regular', fontSize: 13, textAlign: 'center', lineHeight: 19 },

    removalRow:   { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
    removalBubble:{ width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
    removalNumber:{ fontFamily: 'CormorantGaramond_700Bold', fontSize: 24, lineHeight: 28 },
    removalLabel: { fontFamily: 'Inter_400Regular', fontSize: 13, flex: 1 },
    removalBanner:{ flexDirection: 'row', gap: 10, borderWidth: 1, borderRadius: 12, padding: 12, alignItems: 'flex-start', marginTop: 4 },
    removalBannerText: { fontFamily: 'Inter_400Regular', fontSize: 13, flex: 1, lineHeight: 18 },

    historyRow:   { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
    historyMain:  { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
    historySub:   { fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 1 },
    historyStatus:{ fontFamily: 'Inter_500Medium', fontSize: 12 },

    emptyNote:  { fontFamily: 'Inter_400Regular', fontSize: 13, fontStyle: 'italic', paddingVertical: 4 },

    swatchRow:   { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 4 },
    swatchWrap:  { alignItems: 'center', gap: 6 },
    swatch:      { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
    swatchLabel: { fontFamily: 'Inter_400Regular', fontSize: 11 },

    signOutBtn:  { borderWidth: 1.5, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
    signOutText: { fontFamily: 'Inter_600SemiBold', fontSize: 15 },

    legalFooter: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 20 },
    legalLink:   { fontFamily: 'Inter_400Regular', fontSize: 12 },
    legalDot:    { fontFamily: 'Inter_400Regular', fontSize: 12 },
  });
}
