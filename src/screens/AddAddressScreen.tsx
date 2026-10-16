import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Location from 'expo-location';
import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import type { Region } from 'react-native-maps';

import { ApiError } from '../api/http';
import { useAuth } from '../auth/AuthProvider';
import { PrimaryButton, Screen, TextField } from '../components/ui';
import { useLocale } from '../i18n/LocaleProvider';
import { AppMap, DEFAULT_REGION } from '../maps/AppMap';
import { PressableScale, Toast } from '../motion';
import { RootStackParamList } from '../navigation/types';
import { useTheme } from '../theme/theme';

/** Add or edit a delivery address: details plus a map pin the driver navigates to. */
export function AddAddressScreen({ route, navigation }: NativeStackScreenProps<RootStackParamList, 'AddAddress'>): React.JSX.Element {
  const theme = useTheme();
  const { api } = useAuth();
  const { t } = useLocale();
  const editing = route.params?.address;
  const [label, setLabel] = useState(editing?.label ?? 'Home');
  const [line1, setLine1] = useState(editing?.line1 ?? '');
  const [city, setCity] = useState(editing?.city ?? 'Riyadh');
  const [notes, setNotes] = useState(editing?.notes ?? '');
  const initialPin =
    editing?.latitude != null && editing?.longitude != null
      ? { latitude: editing.latitude, longitude: editing.longitude }
      : null;
  const [region, setRegion] = useState<Region>(
    initialPin ? { ...initialPin, latitudeDelta: 0.01, longitudeDelta: 0.01 } : DEFAULT_REGION,
  );
  const [pin, setPin] = useState<{ latitude: number; longitude: number } | null>(initialPin);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const useMyLocation = async (): Promise<void> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError(t('address.locationDenied'));
        return;
      }
      const pos = await Location.getCurrentPositionAsync({});
      const next = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
      setPin(next);
      setRegion({ ...next, latitudeDelta: 0.01, longitudeDelta: 0.01 });
    } catch {
      setError(t('address.locationFailed'));
    }
  };

  const save = async (): Promise<void> => {
    setBusy(true);
    setError(null);
    const input = {
      label,
      line1,
      city,
      notes: notes || undefined,
      latitude: pin?.latitude,
      longitude: pin?.longitude,
    };
    try {
      if (editing) {
        await api.updateAddress(editing.id, input);
      } else {
        await api.createAddress(input);
      }
      navigation.goBack();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t('address.saveFailed'));
      setBusy(false);
    }
  };

  const valid = line1.trim().length > 0 && city.trim().length > 0;

  return (
    <Screen title={editing ? t('address.editTitle') : t('address.addTitle')} onBack={() => navigation.goBack()}>
      <Toast visible={!!error} message={error ?? ''} tone="danger" onHide={() => setError(null)} />
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View style={{ height: 220, borderRadius: theme.radius.lg, overflow: 'hidden', marginBottom: 8 }}>
          <AppMap
            region={region}
            onRegionChangeComplete={setRegion}
            onPress={(coord) => setPin(coord)}
            markers={pin ? [{ id: 'pin', ...pin, kind: 'customer', title: t('address.deliverHere') }] : []}
          />
        </View>
        <PressableScale accessibilityRole="button" onPress={useMyLocation} style={{ alignSelf: 'flex-start', marginBottom: 16, minHeight: theme.touchTarget, justifyContent: 'center' }}>
          <Text style={{ color: theme.colors.accent, fontWeight: '700' }}>{t('address.useLocation')}</Text>
        </PressableScale>

        <TextField label={t('address.label')} value={label} onChangeText={setLabel} maxLength={60} />
        <TextField label={t('address.line1')} value={line1} onChangeText={setLine1} placeholder={t('address.line1Placeholder')} />
        <TextField label={t('address.city')} value={city} onChangeText={setCity} />
        <TextField label={t('address.notes')} value={notes} onChangeText={setNotes} maxLength={500} />

        <PrimaryButton label={editing ? t('address.saveChanges') : t('address.save')} onPress={save} busy={busy} disabled={!valid} />
      </ScrollView>
    </Screen>
  );
}
