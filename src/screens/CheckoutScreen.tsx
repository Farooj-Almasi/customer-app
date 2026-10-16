import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { ApiError } from '../api/http';
import { Address } from '../api/types';
import { useAuth } from '../auth/AuthProvider';
import { useCart } from '../cart/CartProvider';
import { toOrderItems } from '../cart/cart';
import { Card, PrimaryButton, Screen, TextField } from '../components/ui';
import { useAsync } from '../hooks/useAsync';
import { BottomSheet, ErrorState, PressableScale, Skeleton, Toast } from '../motion';
import { ORDER_TYPE, OrderType, PAYMENT_METHOD, PaymentMethod } from '../types/backend';
import { RootStackParamList } from '../navigation/types';
import { formatSar } from '../util/money';
import { useTheme } from '../theme/theme';

const METHOD_LABELS: Record<string, string> = {
  [PAYMENT_METHOD.CARD]: 'Card',
  [PAYMENT_METHOD.MADA]: 'mada',
  [PAYMENT_METHOD.APPLE_PAY]: 'Apple Pay',
  [PAYMENT_METHOD.CASH_ON_DELIVERY]: 'Cash on delivery',
};

/** Choose pickup or delivery, review the server quote (with coupon), pick payment, place order. */
export function CheckoutScreen({ route, navigation }: NativeStackScreenProps<RootStackParamList, 'Checkout'>): React.JSX.Element {
  const theme = useTheme();
  const { api } = useAuth();
  const { cart, dispatch } = useCart();

  const items = toOrderItems(cart);
  const branchId = cart.branchId ?? '';
  const [type, setType] = useState<OrderType>(route.params.type);
  const [addressId, setAddressId] = useState<string | null>(null);
  const [method, setMethod] = useState<PaymentMethod>(PAYMENT_METHOD.CARD);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [placeError, setPlaceError] = useState<string | null>(null);

  // The coupon being typed, and the one actually applied (fed to the quote).
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | undefined>(undefined);

  // Authenticated quote: same VAT breakdown as the public one, plus coupon and
  // promotion preview and whether the branch is open.
  const { data, loading, error, reload } = useAsync(
    () => api.quoteOrder({ branchId, type, items, couponCode: appliedCoupon }),
    [branchId, JSON.stringify(items), type, appliedCoupon],
  );
  const quote = data?.quote ?? null;

  // Addresses, reloaded whenever the screen regains focus (e.g. after adding one).
  const addresses = useAsync<Address[]>(() => api.listAddresses(), []);
  const reloadAddresses = addresses.reload;
  useFocusEffect(useCallback(() => reloadAddresses(), [reloadAddresses]));

  // Auto-select the default (or first) address once loaded.
  useEffect(() => {
    if (type === ORDER_TYPE.DELIVERY && !addressId && addresses.data && addresses.data.length > 0) {
      setAddressId((addresses.data.find((a) => a.isDefault) ?? addresses.data[0])?.id ?? null);
    }
  }, [addresses.data, type, addressId]);

  const isDelivery = type === ORDER_TYPE.DELIVERY;
  const needsAddress = isDelivery && !addressId;

  const applyCoupon = (): void => {
    const code = couponInput.trim().toUpperCase();
    setAppliedCoupon(code.length > 0 ? code : undefined);
  };

  const removeCoupon = (): void => {
    setCouponInput('');
    setAppliedCoupon(undefined);
  };

  const placeOrder = async (): Promise<void> => {
    if (!branchId || needsAddress) {
      return;
    }
    setBusy(true);
    setPlaceError(null);
    try {
      const order = await api.placeOrder({
        branchId,
        type,
        paymentMethod: method,
        items,
        customerAddressId: isDelivery ? addressId ?? undefined : undefined,
        // Only send a coupon the quote actually accepted, so placement does not
        // fail on a code the customer has already seen rejected above.
        couponCode: data?.coupon ? appliedCoupon : undefined,
      });
      dispatch({ type: 'CLEAR' });
      if (method === PAYMENT_METHOD.CASH_ON_DELIVERY) {
        navigation.replace('OrderTracking', { orderId: order.id });
      } else {
        navigation.replace('PaymentProcessing', { orderId: order.id });
      }
    } catch (e) {
      setPlaceError(e instanceof ApiError ? e.message : 'Could not place the order. Try again.');
      setBusy(false);
    }
  };

  const row = (label: string, value: string, bold?: boolean) => (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
      <Text style={{ color: bold ? theme.colors.text : theme.colors.textMuted, fontWeight: bold ? '800' : '400' }}>{label}</Text>
      <Text style={{ color: theme.colors.text, fontWeight: bold ? '800' : '600' }}>{value}</Text>
    </View>
  );

  const typeTab = (t: OrderType, label: string) => {
    const active = type === t;
    return (
      <PressableScale
        accessibilityRole="button"
        accessibilityState={{ selected: active }}
        onPress={() => setType(t)}
        style={{
          flex: 1,
          paddingVertical: 12,
          borderRadius: theme.radius.md,
          alignItems: 'center',
          backgroundColor: active ? theme.colors.primary : theme.colors.surfaceAlt,
        }}
      >
        <Text style={{ color: active ? theme.colors.onPrimary : theme.colors.text, fontWeight: '700' }}>{label}</Text>
      </PressableScale>
    );
  };

  const branchClosed = !!data?.branchOpen && !data.branchOpen.isOpen;

  return (
    <Screen title="Checkout" onBack={() => navigation.goBack()}>
      <Toast visible={!!placeError} message={placeError ?? ''} tone="danger" onHide={() => setPlaceError(null)} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {typeTab(ORDER_TYPE.PICKUP, 'Pickup')}
          {typeTab(ORDER_TYPE.DELIVERY, 'Delivery')}
        </View>

        {branchClosed ? (
          <Card style={{ borderColor: theme.colors.warning }}>
            <Text style={{ color: theme.colors.warning, fontWeight: '700' }}>
              {data?.branchOpen.message ?? 'This branch is closed right now.'}
            </Text>
          </Card>
        ) : null}

        {isDelivery ? (
          <Card>
            <Text style={{ color: theme.colors.textMuted, fontSize: 13, fontWeight: '600', marginBottom: 8 }}>
              Deliver to
            </Text>
            {addresses.loading ? (
              <Skeleton height={40} />
            ) : addresses.data && addresses.data.length > 0 ? (
              addresses.data.map((a) => {
                const active = a.id === addressId;
                return (
                  <PressableScale
                    key={a.id}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    onPress={() => setAddressId(a.id)}
                    style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 10 }}
                  >
                    <View
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 10,
                        borderWidth: 2,
                        borderColor: active ? theme.colors.primary : theme.colors.border,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {active ? <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: theme.colors.primary }} /> : null}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: theme.colors.text, fontWeight: '700' }}>{a.label ?? 'Address'}</Text>
                      <Text style={{ color: theme.colors.textMuted }} numberOfLines={1}>
                        {[a.line1, a.city].filter(Boolean).join(', ')}
                      </Text>
                    </View>
                    <PressableScale
                      accessibilityRole="button"
                      accessibilityLabel={`Edit ${a.label ?? 'address'}`}
                      onPress={() => navigation.navigate('AddAddress', { address: a })}
                    >
                      <Text style={{ color: theme.colors.accent, fontWeight: '600' }}>Edit</Text>
                    </PressableScale>
                  </PressableScale>
                );
              })
            ) : (
              <Text style={{ color: theme.colors.textMuted, marginBottom: 8 }}>No saved address yet.</Text>
            )}
            <PressableScale accessibilityRole="button" onPress={() => navigation.navigate('AddAddress')} style={{ marginTop: 6 }}>
              <Text style={{ color: theme.colors.accent, fontWeight: '700' }}>+ Add a new address</Text>
            </PressableScale>
          </Card>
        ) : null}

        <Card>
          <Text style={{ color: theme.colors.textMuted, fontSize: 13, fontWeight: '600', marginBottom: 8 }}>Promo code</Text>
          {data?.coupon ? (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={{ color: theme.colors.success, fontWeight: '700' }}>{data.coupon.name}</Text>
                <Text style={{ color: theme.colors.textMuted, fontSize: 13 }}>
                  {data.coupon.code} · −{formatSar(data.coupon.discountMinor)}
                </Text>
              </View>
              <PressableScale accessibilityRole="button" accessibilityLabel="Remove coupon" onPress={removeCoupon}>
                <Text style={{ color: theme.colors.danger, fontWeight: '700' }}>Remove</Text>
              </PressableScale>
            </View>
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <TextField label="" value={couponInput} onChangeText={setCouponInput} placeholder="Enter code" maxLength={40} />
              </View>
              <PressableScale
                accessibilityRole="button"
                accessibilityLabel="Apply coupon"
                onPress={applyCoupon}
                style={{
                  backgroundColor: theme.colors.surfaceAlt,
                  borderRadius: theme.radius.md,
                  paddingVertical: 14,
                  paddingHorizontal: 18,
                  marginBottom: 16,
                }}
              >
                <Text style={{ color: theme.colors.text, fontWeight: '700' }}>Apply</Text>
              </PressableScale>
            </View>
          )}
          {data?.couponError ? (
            <Text style={{ color: theme.colors.danger, fontSize: 13 }}>{data.couponError}</Text>
          ) : null}
        </Card>

        <Card>
          <Text style={{ color: theme.colors.text, fontWeight: '800', fontSize: 16, marginBottom: 12 }}>Order total</Text>
          {loading ? (
            <View style={{ gap: 8 }}>
              <Skeleton height={16} />
              <Skeleton width="70%" height={16} />
              <Skeleton width="50%" height={20} />
            </View>
          ) : error ? (
            <ErrorState title="Couldn’t price your order" message={error.message} actionLabel="Retry" onAction={reload} />
          ) : quote ? (
            <>
              {row('Subtotal', formatSar(quote.subtotalMinor))}
              {quote.discountMinor > 0 ? row('Discount', `- ${formatSar(quote.discountMinor)}`) : null}
              {quote.deliveryFeeMinor > 0 ? row('Delivery', formatSar(quote.deliveryFeeMinor)) : null}
              {row('VAT (incl.)', formatSar(quote.vatMinor))}
              <View style={{ height: 1, backgroundColor: theme.colors.border, marginVertical: 6 }} />
              {row('Total', formatSar(quote.totalMinor), true)}
            </>
          ) : null}
        </Card>

        <Card>
          <Text style={{ color: theme.colors.textMuted, fontSize: 13, fontWeight: '600', marginBottom: 8 }}>Payment method</Text>
          <PressableScale accessibilityRole="button" onPress={() => setSheetOpen(true)} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ color: theme.colors.text, fontSize: 16, fontWeight: '700' }}>{METHOD_LABELS[method]}</Text>
            <Text style={{ color: theme.colors.accent, fontWeight: '600' }}>Change</Text>
          </PressableScale>
        </Card>

        <Text style={{ color: theme.colors.textMuted, fontSize: 12, textAlign: 'center', paddingHorizontal: 12 }}>
          Payment is confirmed by our server — never by this screen alone.
        </Text>
      </ScrollView>

      <View style={{ padding: 16, borderTopWidth: 1, borderTopColor: theme.colors.border }}>
        <PrimaryButton
          label={needsAddress ? 'Add a delivery address' : quote ? `Place order · ${formatSar(quote.totalMinor)}` : 'Place order'}
          onPress={needsAddress ? () => navigation.navigate('AddAddress') : placeOrder}
          busy={busy}
          disabled={!quote || !!error || branchClosed}
        />
      </View>

      <BottomSheet visible={sheetOpen} onClose={() => setSheetOpen(false)}>
        <Text style={{ color: theme.colors.text, fontSize: 18, fontWeight: '700', marginBottom: 8 }}>Payment method</Text>
        {[PAYMENT_METHOD.CARD, PAYMENT_METHOD.MADA, PAYMENT_METHOD.APPLE_PAY, PAYMENT_METHOD.CASH_ON_DELIVERY].map((m) => (
          <PressableScale
            key={m}
            accessibilityRole="button"
            onPress={() => {
              setMethod(m);
              setSheetOpen(false);
            }}
            style={{ paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: theme.colors.border, flexDirection: 'row', justifyContent: 'space-between' }}
          >
            <Text style={{ color: theme.colors.text, fontSize: 16 }}>{METHOD_LABELS[m]}</Text>
            {method === m ? <Text style={{ color: theme.colors.primary, fontWeight: '800' }}>✓</Text> : null}
          </PressableScale>
        ))}
      </BottomSheet>
    </Screen>
  );
}
