import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { Text, View } from 'react-native';

import { ApiError } from '../api/http';
import { useAuth } from '../auth/AuthProvider';
import { PrimaryButton, Screen, TextField } from '../components/ui';
import { Toast } from '../motion';
import { RootStackParamList } from '../navigation/types';
import { useTheme } from '../theme/theme';

/** Step 1 of OTP login: enter phone, request a code. */
export function PhoneScreen({ navigation }: NativeStackScreenProps<RootStackParamList, 'Phone'>): React.JSX.Element {
  const theme = useTheme();
  const { api } = useAuth();
  const [phone, setPhone] = useState('+9665');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid = /^\+9665\d{8}$/.test(phone);

  const submit = async (): Promise<void> => {
    setBusy(true);
    setError(null);
    try {
      await api.requestOtp(phone);
      navigation.navigate('Otp', { phone });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not send the code. Try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen title="Sign in">
      <Toast visible={!!error} message={error ?? ''} tone="danger" onHide={() => setError(null)} />
      <View style={{ padding: 20 }}>
        <Text style={{ color: theme.colors.textMuted, fontSize: 15, lineHeight: 22, marginBottom: 24 }}>
          Enter your mobile number and we’ll text you a login code.
        </Text>
        <TextField
          label="Mobile number"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          maxLength={13}
          autoFocus
          placeholder="+9665XXXXXXXX"
        />
        <PrimaryButton label="Send code" onPress={submit} busy={busy} disabled={!valid} />
      </View>
    </Screen>
  );
}
