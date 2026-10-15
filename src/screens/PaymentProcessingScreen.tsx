import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';

import { useAuth } from '../auth/AuthProvider';
import { PrimaryButton, Screen } from '../components/ui';
import { PaymentStateView } from '../features/payment/PaymentStateView';
import { paymentVisualForServerStatus } from '../features/payment/payment-state.model';
import { PAYMENT_METHOD, PAYMENT_STATUS, PaymentStatus } from '../types/backend';
import { RootStackParamList } from '../navigation/types';
import { useTheme } from '../theme/theme';

const POLL_MS = 2500;

/**
 * Initiates the online charge, then polls the backend for the true payment
 * status. The success view appears only when the SERVER reports PAID — this
 * screen never treats initiating (or any client signal) as proof of payment.
 */
export function PaymentProcessingScreen({
  route,
  navigation,
}: NativeStackScreenProps<RootStackParamList, 'PaymentProcessing'>): React.JSX.Element {
  const theme = useTheme();
  const { api } = useAuth();
  const { orderId } = route.params;
  const [status, setStatus] = useState<PaymentStatus>(PAYMENT_STATUS.PENDING);
  const started = useRef(false);

  useEffect(() => {
    let mounted = true;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const poll = async (): Promise<void> => {
      try {
        const payment = await api.paymentFor(orderId);
        if (!mounted) {
          return;
        }
        setStatus(payment.status);
        const settled = paymentVisualForServerStatus(payment.status).settled;
        if (settled) {
          if (payment.status === PAYMENT_STATUS.PAID) {
            timer = setTimeout(() => mounted && navigation.replace('OrderTracking', { orderId }), 1200);
          }
          return; // stop polling once settled
        }
      } catch {
        // Transient error — keep polling.
      }
      if (mounted) {
        timer = setTimeout(poll, POLL_MS);
      }
    };

    const start = async (): Promise<void> => {
      if (!started.current) {
        started.current = true;
        try {
          await api.initiatePayment(orderId, PAYMENT_METHOD.CARD);
        } catch {
          // Even if initiate errored, poll — the server remains the truth.
        }
      }
      poll();
    };

    start();
    return () => {
      mounted = false;
      if (timer) {
        clearTimeout(timer);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const visual = paymentVisualForServerStatus(status).visual;

  return (
    <Screen title="Payment">
      <View style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
        <PaymentStateView status={status} />
        <Text style={{ color: theme.colors.textMuted, fontSize: 12, textAlign: 'center', marginTop: 8 }}>
          Your bank confirms this with us directly. You can safely track your order while it finishes.
        </Text>
        <View style={{ marginTop: 24, gap: 10 }}>
          <PrimaryButton label="Track my order" onPress={() => navigation.replace('OrderTracking', { orderId })} />
          {visual === 'failed' || visual === 'cancelled' ? (
            <PrimaryButton label="Back to orders" onPress={() => navigation.replace('Orders')} />
          ) : null}
        </View>
      </View>
    </Screen>
  );
}
