import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { ApiError } from '../api/http';
import { useAuth } from '../auth/AuthProvider';
import { Card, PrimaryButton, Screen, TextField } from '../components/ui';
import { useAsync } from '../hooks/useAsync';
import { useLocale } from '../i18n/LocaleProvider';
import { LANG_LABEL } from '../i18n/messages';
import { ErrorState, PressableScale, Skeleton, Toast } from '../motion';
import { RootStackParamList } from '../navigation/types';
import { useTheme } from '../theme/theme';

/** Account hub: edit the display name, and reach orders, loyalty, offers and notifications. */
export function AccountScreen({ navigation }: NativeStackScreenProps<RootStackParamList, 'Account'>): React.JSX.Element {
  const theme = useTheme();
  const { api, signOut } = useAuth();
  const { t, lang, setLang } = useLocale();
  const { data: profile, loading, error, reload } = useAsync(() => api.profile(), []);

  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'danger' } | null>(null);

  // Seed the editable name once the profile loads.
  useEffect(() => {
    if (profile) {
      setName(profile.fullName);
    }
  }, [profile]);

  const dirty = !!profile && name.trim().length > 0 && name.trim() !== profile.fullName;

  const save = async (): Promise<void> => {
    setBusy(true);
    try {
      await api.updateProfile(name.trim());
      setToast({ message: t('account.saved'), tone: 'success' });
      reload();
    } catch (e) {
      setToast({ message: e instanceof ApiError ? e.message : t('account.saveFailed'), tone: 'danger' });
    } finally {
      setBusy(false);
    }
  };

  const linkRow = (label: string, onPress: () => void, trailing?: string) => (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
        minHeight: theme.touchTarget,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
      }}
    >
      <Text style={{ color: theme.colors.text, fontSize: 16, fontWeight: '600' }}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {trailing ? <Text style={{ color: theme.colors.textMuted, fontSize: 15 }}>{trailing}</Text> : null}
        <Text style={{ color: theme.colors.textMuted, fontSize: 20 }}>›</Text>
      </View>
    </PressableScale>
  );

  return (
    <Screen title={t('account.title')} onBack={() => navigation.goBack()}>
      <Toast visible={!!toast} message={toast?.message ?? ''} tone={toast?.tone} onHide={() => setToast(null)} />
      {loading ? (
        <View style={{ padding: 20, gap: 12 }}>
          <Skeleton height={120} radius={theme.radius.lg} />
          <Skeleton height={200} radius={theme.radius.lg} />
        </View>
      ) : error ? (
        <ErrorState title={t('account.errorTitle')} message={error.message} actionLabel={t('common.retry')} onAction={reload} />
      ) : profile ? (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
          <Card>
            <TextField label={t('account.name')} value={name} onChangeText={setName} maxLength={120} />
            <Text style={{ color: theme.colors.textMuted, fontSize: 13, marginBottom: 6, fontWeight: '600' }}>{t('account.phone')}</Text>
            <Text style={{ color: theme.colors.text, fontSize: 16, marginBottom: 12 }}>{profile.phone}</Text>
            {profile.email ? (
              <>
                <Text style={{ color: theme.colors.textMuted, fontSize: 13, marginBottom: 6, fontWeight: '600' }}>{t('account.email')}</Text>
                <Text style={{ color: theme.colors.text, fontSize: 16, marginBottom: 12 }}>{profile.email}</Text>
              </>
            ) : null}
            <PrimaryButton label={t('account.saveProfile')} onPress={save} busy={busy} disabled={!dirty} />
          </Card>

          <Card style={{ padding: 0, overflow: 'hidden' }}>
            {linkRow(t('account.myOrders'), () => navigation.navigate('Orders'))}
            {linkRow(t('account.loyalty'), () => navigation.navigate('Loyalty'))}
            {linkRow(t('account.offers'), () => navigation.navigate('Offers'))}
            {linkRow(t('account.notifications'), () => navigation.navigate('Notifications'))}
            {linkRow(t('account.language'), () => setLang(lang === 'ar' ? 'en' : 'ar'), LANG_LABEL[lang])}
          </Card>

          <PressableScale
            accessibilityRole="button"
            accessibilityLabel={t('account.signOut')}
            onPress={() => signOut()}
            style={{ alignItems: 'center', paddingVertical: 14, minHeight: theme.touchTarget }}
          >
            <Text style={{ color: theme.colors.danger, fontWeight: '700', fontSize: 16 }}>{t('account.signOut')}</Text>
          </PressableScale>
        </ScrollView>
      ) : null}
    </Screen>
  );
}
