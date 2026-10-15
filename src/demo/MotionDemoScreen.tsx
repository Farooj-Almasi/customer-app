import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { OrderStatusTracker } from '../features/order/OrderStatusTracker';
import { PaymentStateView } from '../features/payment/PaymentStateView';
import {
  BottomSheet,
  CartBadge,
  EmptyState,
  FadeIn,
  PressableScale,
  QuantityStepper,
  Skeleton,
  Stagger,
  Toast,
  useMotion,
} from '../motion';
import { ORDER_STATUS, ORDER_TYPE, OrderStatus, PAYMENT_STATUS, PaymentStatus } from '../types/backend';
import { useTheme } from '../theme/theme';

const ORDER_CYCLE: OrderStatus[] = [
  ORDER_STATUS.PENDING_PAYMENT,
  ORDER_STATUS.CONFIRMED,
  ORDER_STATUS.PREPARING,
  ORDER_STATUS.READY,
  ORDER_STATUS.DRIVER_ASSIGNED,
  ORDER_STATUS.PICKED_UP,
  ORDER_STATUS.OUT_FOR_DELIVERY,
  ORDER_STATUS.DELIVERED,
  ORDER_STATUS.CANCELLED,
];

const PAYMENT_CYCLE: PaymentStatus[] = [
  PAYMENT_STATUS.PENDING,
  PAYMENT_STATUS.PAID,
  PAYMENT_STATUS.FAILED,
  PAYMENT_STATUS.CANCELLED,
  PAYMENT_STATUS.REFUNDED,
];

/**
 * A living catalogue of the motion system.
 *
 * This is not a product screen — it exists so the motion language can be seen,
 * reviewed and regression-checked in one place. Every primitive and both hero
 * components are here, each with a control to exercise its states. Toggling the
 * OS "reduce motion" setting while this screen is open shows the accessible,
 * motion-free form of everything.
 */
export function MotionDemoScreen(): React.JSX.Element {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { reduceMotion } = useMotion();

  const [cart, setCart] = useState(0);
  const [qty, setQty] = useState(1);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [toast, setToast] = useState(false);
  const [loading, setLoading] = useState(true);
  const [orderIdx, setOrderIdx] = useState(2);
  const [payIdx, setPayIdx] = useState(0);

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <FadeIn translateY={8} style={{ marginBottom: 28 }}>
      <Text
        style={{
          color: theme.colors.textMuted,
          fontSize: 12,
          fontWeight: '700',
          letterSpacing: 1,
          textTransform: 'uppercase',
          marginBottom: 10,
        }}
      >
        {title}
      </Text>
      {children}
    </FadeIn>
  );

  const Button = ({ label, onPress }: { label: string; onPress: () => void }) => (
    <PressableScale
      accessibilityRole="button"
      onPress={onPress}
      style={{
        backgroundColor: theme.colors.surfaceAlt,
        borderRadius: theme.radius.md,
        paddingVertical: 10,
        paddingHorizontal: 16,
        marginRight: 8,
        marginBottom: 8,
      }}
    >
      <Text style={{ color: theme.colors.text, fontWeight: '600' }}>{label}</Text>
    </PressableScale>
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Toast
        visible={toast}
        message="Coupon applied — 10% off"
        tone="success"
        onHide={() => setToast(false)}
      />
      <ScrollView
        contentContainerStyle={{
          padding: 20,
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 40,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
          <Text style={{ color: theme.colors.text, fontSize: 26, fontWeight: '800', flex: 1 }}>
            Motion System
          </Text>
          <View>
            <Text style={{ fontSize: 28 }}>🛒</Text>
            <View style={{ position: 'absolute', top: -6, right: -10 }}>
              <CartBadge count={cart} />
            </View>
          </View>
        </View>
        <Text style={{ color: theme.colors.textMuted, marginBottom: 24 }}>
          Reduce motion is {reduceMotion ? 'ON — animations are instant' : 'off'}.
        </Text>

        <Section title="Order tracking">
          <OrderStatusTracker status={ORDER_CYCLE[orderIdx] as OrderStatus} type={ORDER_TYPE.DELIVERY} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 12 }}>
            <Button
              label="◀ Prev"
              onPress={() => setOrderIdx((i) => (i - 1 + ORDER_CYCLE.length) % ORDER_CYCLE.length)}
            />
            <Button label="Next ▶" onPress={() => setOrderIdx((i) => (i + 1) % ORDER_CYCLE.length)} />
          </View>
        </Section>

        <Section title="Payment states">
          <View style={{ backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg }}>
            <PaymentStateView status={PAYMENT_CYCLE[payIdx] as PaymentStatus} />
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 12 }}>
            {PAYMENT_CYCLE.map((s, i) => (
              <Button key={s} label={s} onPress={() => setPayIdx(i)} />
            ))}
          </View>
        </Section>

        <Section title="Add to cart & quantity">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' }}>
            <Button label="Add to cart" onPress={() => setCart((c) => c + 1)} />
            <Button label="Remove" onPress={() => setCart((c) => Math.max(0, c - 1))} />
            <View style={{ marginLeft: 4 }}>
              <QuantityStepper value={qty} onChange={setQty} />
            </View>
          </View>
        </Section>

        <Section title="Bottom sheet & toast">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            <Button label="Open sheet" onPress={() => setSheetOpen(true)} />
            <Button label="Show toast" onPress={() => setToast(true)} />
          </View>
        </Section>

        <Section title="Skeleton loading">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            <Button label={loading ? 'Show content' : 'Show skeleton'} onPress={() => setLoading((l) => !l)} />
          </View>
          <View style={{ marginTop: 12 }}>
            {loading ? (
              <View style={{ gap: 10 }}>
                <Skeleton height={120} radius={theme.radius.lg} />
                <Skeleton width="60%" height={18} />
                <Skeleton width="40%" height={14} />
              </View>
            ) : (
              <Stagger>
                <Text style={{ color: theme.colors.text, fontSize: 16, marginBottom: 6 }}>Shawarma plate</Text>
                <Text style={{ color: theme.colors.textMuted, marginBottom: 6 }}>Grilled chicken, garlic, pickles</Text>
                <Text style={{ color: theme.colors.primary, fontWeight: '700' }}>SAR 32.50</Text>
              </Stagger>
            )}
          </View>
        </Section>

        <Section title="Empty state">
          <View style={{ backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg }}>
            <EmptyState
              title="Your cart is empty"
              message="Browse the menu and add something delicious."
              actionLabel="Browse menu"
              onAction={() => setCart(1)}
            />
          </View>
        </Section>
      </ScrollView>

      <BottomSheet visible={sheetOpen} onClose={() => setSheetOpen(false)}>
        <Text style={{ color: theme.colors.text, fontSize: 18, fontWeight: '700', marginBottom: 8 }}>
          Choose a payment method
        </Text>
        {['Card', 'mada', 'Apple Pay', 'Cash on delivery'].map((m) => (
          <PressableScale
            key={m}
            accessibilityRole="button"
            onPress={() => setSheetOpen(false)}
            style={{
              paddingVertical: 14,
              borderBottomWidth: 1,
              borderBottomColor: theme.colors.border,
            }}
          >
            <Text style={{ color: theme.colors.text, fontSize: 16 }}>{m}</Text>
          </PressableScale>
        ))}
      </BottomSheet>
    </View>
  );
}
