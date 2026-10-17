import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { useAuth } from '../auth/AuthProvider';
import { Card, PrimaryButton, Screen } from '../components/ui';
import { OrderStatusTracker } from '../features/order/OrderStatusTracker';
import { useAsync } from '../hooks/useAsync';
import { AppMap, DEFAULT_REGION, MapMarker } from '../maps/AppMap';
import { useLocale } from '../i18n/LocaleProvider';
import { ErrorState, Skeleton } from '../motion';
import { useRealtime } from '../realtime/RealtimeProvider';
import { ORDER_STATUS, ORDER_TYPE, OrderStatus } from '../types/backend';
import type { DeliveryTracking } from '../api/types';
import { RootStackParamList } from '../navigation/types';
import { useTheme } from '../theme/theme';

/** Statuses that are still moving — worth polling for live updates. */
const ACTIVE: OrderStatus[] = [
  ORDER_STATUS.PENDING_PAYMENT,
  ORDER_STATUS.CONFIRMED,
  ORDER_STATUS.PREPARING,
  ORDER_STATUS.READY,
  ORDER_STATUS.DRIVER_ASSIGNED,
  ORDER_STATUS.PICKED_UP,
  ORDER_STATUS.OUT_FOR_DELIVERY,
];

const POLL_MS = 8000;

/** Live order tracking via the shared OrderStatusTracker, polling while active. */
export function OrderTrackingScreen({ route, navigation }: NativeStackScreenProps<RootStackParamList, 'OrderTracking'>): React.JSX.Element {
  const theme = useTheme();
  const { api } = useAuth();
  const { t, sar } = useLocale();
  const { orderId } = route.params;
  const { data: order, loading, error, reload } = useAsync(() => api.order(orderId), [orderId]);
  const [tick, setTick] = useState(0);
  const { subscribe } = useRealtime();

  // Realtime is the accelerator; the poll below is the floor. The server only
  // ever pushes this customer their own events, but they may have several orders
  // open, so match on the order id and ignore the rest. On a match, refresh both
  // the order (status) and the delivery tracking (driver position) at once.
  useEffect(() => {
    const matchesOrder = (payload: unknown): boolean =>
      typeof payload === 'object' && payload !== null && (payload as { orderId?: unknown }).orderId === orderId;
    const onEvent = (payload: unknown): void => {
      if (matchesOrder(payload)) {
        setTick((t) => t + 1);
        reload();
      }
    };
    const unsubs = [subscribe('order.transitioned', onEvent), subscribe('driver.location', onEvent)];
    return () => unsubs.forEach((u) => u());
  }, [subscribe, orderId, reload]);

  // Live delivery tracking (driver location) for delivery orders only.
  const tracking = useAsync<DeliveryTracking | null>(
    () => (order?.type === ORDER_TYPE.DELIVERY ? api.trackDelivery(orderId) : Promise.resolve(null)),
    [order?.type, tick],
  );

  // Poll while the order is still moving. `tick` drives useAsync's reload via deps.
  useEffect(() => {
    if (!order || !ACTIVE.includes(order.status)) {
      return;
    }
    const timer = setTimeout(() => {
      setTick((t) => t + 1);
      reload();
    }, POLL_MS);
    return () => clearTimeout(timer);
  }, [order, tick, reload]);

  return (
    <Screen title={t('tracking.title')} onBack={() => navigation.canGoBack() ? navigation.goBack() : navigation.replace('Branches')}>
      {loading && !order ? (
        <View style={{ padding: 20, gap: 12 }}>
          <Skeleton height={220} radius={theme.radius.lg} />
        </View>
      ) : error && !order ? (
        <ErrorState title={t('tracking.errorTitle')} message={error.message} actionLabel={t('common.retry')} onAction={reload} />
      ) : order ? (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
          <Text style={{ color: theme.colors.textMuted }}>{t('tracking.order', { number: order.orderNumber })}</Text>
          <OrderStatusTracker status={order.status} type={order.type} />

          {(() => {
            const d = tracking.data;
            const driverLat = d?.driver?.currentLatitude ?? null;
            const driverLng = d?.driver?.currentLongitude ?? null;
            const addrLat = d?.addressSnapshot?.latitude ?? null;
            const addrLng = d?.addressSnapshot?.longitude ?? null;
            if (order.type !== ORDER_TYPE.DELIVERY || (driverLat === null && addrLat === null)) {
              return null;
            }
            const markers: MapMarker[] = [];
            if (driverLat !== null && driverLng !== null) {
              markers.push({ id: 'driver', latitude: driverLat, longitude: driverLng, kind: 'driver', title: d?.driver?.user.fullName ?? t('tracking.driver') });
            }
            if (addrLat !== null && addrLng !== null) {
              markers.push({ id: 'dest', latitude: addrLat, longitude: addrLng, kind: 'customer', title: t('tracking.deliveryAddress') });
            }
            const focus = markers[0];
            return (
              <View style={{ height: 220, borderRadius: theme.radius.lg, overflow: 'hidden' }}>
                <AppMap
                  scrollEnabled={false}
                  region={focus ? { latitude: focus.latitude, longitude: focus.longitude, latitudeDelta: 0.02, longitudeDelta: 0.02 } : DEFAULT_REGION}
                  markers={markers}
                />
              </View>
            );
          })()}

          <Card>
            {order.items.map((item) => (
              <View key={item.id} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={{ color: theme.colors.text }}>
                  {item.quantity}× {item.productName}
                </Text>
                <Text style={{ color: theme.colors.textMuted }}>{sar(item.lineTotalMinor)}</Text>
              </View>
            ))}
            <View style={{ height: 1, backgroundColor: theme.colors.border, marginVertical: 6 }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: theme.colors.text, fontWeight: '800' }}>{t('tracking.total')}</Text>
              <Text style={{ color: theme.colors.text, fontWeight: '800' }}>{sar(order.totalMinor)}</Text>
            </View>
          </Card>

          <PrimaryButton label={t('tracking.backHome')} onPress={() => navigation.replace('Branches')} />
        </ScrollView>
      ) : null}
    </Screen>
  );
}
