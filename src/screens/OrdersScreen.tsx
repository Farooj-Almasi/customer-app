import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { ScrollView, Text, View } from 'react-native';

import { useAuth } from '../auth/AuthProvider';
import { Card, Screen } from '../components/ui';
import { STATUS_META } from '../features/order/order-status.model';
import { useAsync } from '../hooks/useAsync';
import { useLocale } from '../i18n/LocaleProvider';
import type { MessageKey } from '../i18n/messages';
import { EmptyState, ErrorState, PressableScale, Skeleton } from '../motion';
import { RootStackParamList } from '../navigation/types';
import { StatusTone } from '../features/order/order-status.model';
import { useTheme } from '../theme/theme';

function toneColor(theme: ReturnType<typeof useTheme>, tone: StatusTone): string {
  return tone === 'success'
    ? theme.colors.success
    : tone === 'danger'
      ? theme.colors.danger
      : tone === 'warning'
        ? theme.colors.warning
        : tone === 'progress'
          ? theme.colors.primary
          : theme.colors.textMuted;
}

/** My past and current orders. */
export function OrdersScreen({ navigation }: NativeStackScreenProps<RootStackParamList, 'Orders'>): React.JSX.Element {
  const theme = useTheme();
  const { api } = useAuth();
  const { t, sar } = useLocale();
  const { data, loading, error, reload } = useAsync(() => api.myOrders(), []);
  const orders = data?.data ?? [];

  return (
    <Screen title={t('orders.title')} onBack={() => navigation.goBack()}>
      {loading ? (
        <View style={{ padding: 20, gap: 12 }}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={80} radius={theme.radius.lg} />
          ))}
        </View>
      ) : error ? (
        <ErrorState title={t('orders.errorTitle')} message={error.message} actionLabel={t('common.retry')} onAction={reload} />
      ) : orders.length === 0 ? (
        <EmptyState title={t('orders.emptyTitle')} message={t('orders.emptyBody')} />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }}>
          {orders.map((order) => {
            const meta = STATUS_META[order.status];
            return (
              <PressableScale key={order.id} accessibilityRole="button" onPress={() => navigation.navigate('OrderTracking', { orderId: order.id })}>
                <Card>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ color: theme.colors.text, fontWeight: '700' }}>{order.orderNumber}</Text>
                    <View style={{ backgroundColor: toneColor(theme, meta.tone), borderRadius: theme.radius.pill, paddingVertical: 3, paddingHorizontal: 10 }}>
                      <Text style={{ color: theme.colors.onPrimary, fontSize: 12, fontWeight: '700' }}>
                        {t(`status.${order.status}` as MessageKey)}
                      </Text>
                    </View>
                  </View>
                  <Text style={{ color: theme.colors.textMuted, marginTop: 6 }}>{sar(order.totalMinor)}</Text>
                </Card>
              </PressableScale>
            );
          })}
        </ScrollView>
      )}
    </Screen>
  );
}
