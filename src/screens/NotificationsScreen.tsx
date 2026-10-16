import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { ScrollView, Text, View } from 'react-native';

import { useAuth } from '../auth/AuthProvider';
import { Card, Screen } from '../components/ui';
import { useAsync } from '../hooks/useAsync';
import { EmptyState, ErrorState, PressableScale, Skeleton } from '../motion';
import { RootStackParamList } from '../navigation/types';
import { useTheme } from '../theme/theme';

/** Formats an ISO timestamp as a short, human relative-ish label. Pure enough to read at a glance. */
function when(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) {
    return '';
  }
  const mins = Math.round((Date.now() - then) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} h ago`;
  return new Date(iso).toLocaleDateString();
}

/** The customer's notification feed. */
export function NotificationsScreen({
  navigation,
}: NativeStackScreenProps<RootStackParamList, 'Notifications'>): React.JSX.Element {
  const theme = useTheme();
  const { api } = useAuth();
  const { data, loading, error, reload } = useAsync(() => api.notifications(), []);
  const items = data?.data ?? [];

  return (
    <Screen title="Notifications" onBack={() => navigation.goBack()}>
      {loading ? (
        <View style={{ padding: 20, gap: 12 }}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={76} radius={theme.radius.lg} />
          ))}
        </View>
      ) : error ? (
        <ErrorState title="Couldn’t load notifications" message={error.message} actionLabel="Retry" onAction={reload} />
      ) : items.length === 0 ? (
        <EmptyState title="No notifications yet" message="Order updates and offers will appear here." />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }}>
          {items.map((n) => {
            const body = (
              <Card>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ color: theme.colors.text, fontWeight: '700', fontSize: 15, flex: 1, paddingRight: 8 }}>
                    {n.title}
                  </Text>
                  <Text style={{ color: theme.colors.textMuted, fontSize: 12 }}>{when(n.createdAt)}</Text>
                </View>
                {n.body ? <Text style={{ color: theme.colors.textMuted, marginTop: 6 }}>{n.body}</Text> : null}
              </Card>
            );
            // A notification about an order jumps to its tracking screen.
            return n.orderId ? (
              <PressableScale
                key={n.id}
                accessibilityRole="button"
                onPress={() => navigation.navigate('OrderTracking', { orderId: n.orderId as string })}
              >
                {body}
              </PressableScale>
            ) : (
              <View key={n.id}>{body}</View>
            );
          })}
        </ScrollView>
      )}
    </Screen>
  );
}
