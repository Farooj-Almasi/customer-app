import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Location from 'expo-location';
import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import type { Region } from 'react-native-maps';

import { ApiError } from '../api/http';
import { useAuth } from '../auth/AuthProvider';
import { PrimaryButton, Screen, TextField } from '../components/ui';
import { AppMap, DEFAULT_REGION } from '../maps/AppMap';
import { PressableScale, Toast } from '../motion';
import { RootStackParamList } from '../navigation/types';
import { useTheme } from '../theme/theme';

/** Add a delivery address: details plus a map pin the driver navigates to. */
export function AddAddressScreen({ navigation }: NativeStackScreenProps<RootStackParamList, 'AddAddress'>): React.JSX.Element {
  const theme = useTheme();
  const { api } = useAuth();
  const [label, setLabel] = useState('Home');
  const [line1, setLine1] = useState('');
  const [city, setCity] = useState('Riyadh');
  const [notes, setNotes] = useState('');
  const [region, setRegion] = useState<Region>(DEFAULT_REGION);
  const [pin, setPin] = useState<{ latitude: number; longitude: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const useMyLocation = async (): Promise<void> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Location permission denied. Drop a pin on the map instead.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({});
      const next = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
      setPin(next);
      setRegion({ ...next, latitudeDelta: 0.01, longitudeDelta: 0.01 });
    } catch {
      setError('Couldn’t get your location. Drop a pin on the map instead.');
    }
  };

  const save = async (): Promise<void> => {
    setBusy(true);
    setError(null);
    try {
      await api.createAddress({
        label,
        line1,
        city,
        notes: notes || undefined,
        latitude: pin?.latitude,
        longitude: pin?.longitude,
      });
      navigation.goBack();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not save the address.');
      setBusy(false);
    }
  };

  const valid = line1.trim().length > 0 && city.trim().length > 0;

  return (
    <Screen title="Add address" onBack={() => navigation.goBack()}>
      <Toast visible={!!error} message={error ?? ''} tone="danger" onHide={() => setError(null)} />
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View style={{ height: 220, borderRadius: theme.radius.lg, overflow: 'hidden', marginBottom: 8 }}>
          <AppMap
            region={region}
            onRegionChangeComplete={setRegion}
            onPress={(coord) => setPin(coord)}
            markers={pin ? [{ id: 'pin', ...pin, kind: 'customer', title: 'Delivery here' }] : []}
          />
        </View>
        <PressableScale accessibilityRole="button" onPress={useMyLocation} style={{ alignSelf: 'flex-start', marginBottom: 16 }}>
          <Text style={{ color: theme.colors.accent, fontWeight: '700' }}>📍 Use my current location</Text>
        </PressableScale>

        <TextField label="Label" value={label} onChangeText={setLabel} maxLength={60} />
        <TextField label="Address line" value={line1} onChangeText={setLine1} placeholder="Street, building, apartment" />
        <TextField label="City" value={city} onChangeText={setCity} />
        <TextField label="Notes for the driver (optional)" value={notes} onChangeText={setNotes} maxLength={500} />

        <PrimaryButton label="Save address" onPress={save} busy={busy} disabled={!valid} />
      </ScrollView>
    </Screen>
  );
}
