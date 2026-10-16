import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { ApiError } from '../api/http';
import { useAuth } from '../auth/AuthProvider';
import { Card, PrimaryButton, Screen, TextField } from '../components/ui';
import { useAsync } from '../hooks/useAsync';
import { ErrorState, PressableScale, Skeleton, Toast } from '../motion';
import { RootStackParamList } from '../navigation/types';
import { useTheme } from '../theme/theme';

/** Account hub: edit the display name, and reach orders, loyalty, offers and notifications. */
export function AccountScreen({ navigation }: NativeStackScreenProps<RootStackParamList, 'Account'>): React.JSX.Element {
  const theme = useTheme();
  const { api, signOut } = useAuth();
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
      setToast({ message: 'Profile saved.', tone: 'success' });
      reload();
    } catch (e) {
      setToast({ message: e instanceof ApiError ? e.message : 'Could not save.', tone: 'danger' });
    } finally {
      setBusy(false);
    }
  };

  const linkRow = (label: string, onPress: () => void) => (
    <PressableScale
      accessibilityRole="button"
      onPress={onPress}
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
      }}
    >
      <Text style={{ color: theme.colors.text, fontSize: 16, fontWeight: '600' }}>{label}</Text>
      <Text style={{ color: theme.colors.textMuted, fontSize: 20 }}>›</Text>
    </PressableScale>
  );

  return (
    <Screen title="Account" onBack={() => navigation.goBack()}>
      <Toast visible={!!toast} message={toast?.message ?? ''} tone={toast?.tone} onHide={() => setToast(null)} />
      {loading ? (
        <View style={{ padding: 20, gap: 12 }}>
          <Skeleton height={120} radius={theme.radius.lg} />
          <Skeleton height={200} radius={theme.radius.lg} />
        </View>
      ) : error ? (
        <ErrorState title="Couldn’t load your profile" message={error.message} actionLabel="Retry" onAction={reload} />
      ) : profile ? (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
          <Card>
            <TextField label="Your name" value={name} onChangeText={setName} maxLength={120} />
            <Text style={{ color: theme.colors.textMuted, fontSize: 13, marginBottom: 6, fontWeight: '600' }}>Phone</Text>
            <Text style={{ color: theme.colors.text, fontSize: 16, marginBottom: 12 }}>{profile.phone}</Text>
            {profile.email ? (
              <>
                <Text style={{ color: theme.colors.textMuted, fontSize: 13, marginBottom: 6, fontWeight: '600' }}>Email</Text>
                <Text style={{ color: theme.colors.text, fontSize: 16, marginBottom: 12 }}>{profile.email}</Text>
              </>
            ) : null}
            <PrimaryButton label="Save profile" onPress={save} busy={busy} disabled={!dirty} />
          </Card>

          <Card style={{ padding: 0, overflow: 'hidden' }}>
            {linkRow('My orders', () => navigation.navigate('Orders'))}
            {linkRow('Loyalty points', () => navigation.navigate('Loyalty'))}
            {linkRow('Offers', () => navigation.navigate('Offers'))}
            {linkRow('Notifications', () => navigation.navigate('Notifications'))}
          </Card>

          <PressableScale
            accessibilityRole="button"
            accessibilityLabel="Sign out"
            onPress={() => signOut()}
            style={{ alignItems: 'center', paddingVertical: 14 }}
          >
            <Text style={{ color: theme.colors.danger, fontWeight: '700', fontSize: 16 }}>Sign out</Text>
          </PressableScale>
        </ScrollView>
      ) : null}
    </Screen>
  );
}
