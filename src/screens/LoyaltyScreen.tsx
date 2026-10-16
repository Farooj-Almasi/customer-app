import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { ScrollView, Text, View } from 'react-native';

import { useAuth } from '../auth/AuthProvider';
import { Card, Screen } from '../components/ui';
import { useAsync } from '../hooks/useAsync';
import { EmptyState, ErrorState, Skeleton } from '../motion';
import { RootStackParamList } from '../navigation/types';
import { useTheme } from '../theme/theme';

/** A ledger entry's sign decides how it reads: earned, spent/reversed, or adjusted. */
function pointsLabel(points: number): string {
  return `${points > 0 ? '+' : ''}${points}`;
}

/** The customer's loyalty balance and points history. */
export function LoyaltyScreen({ navigation }: NativeStackScreenProps<RootStackParamList, 'Loyalty'>): React.JSX.Element {
  const theme = useTheme();
  const { api } = useAuth();
  const { data, loading, error, reload } = useAsync(() => api.loyalty(), []);
  const entries = data?.data ?? [];

  return (
    <Screen title="Loyalty" onBack={() => navigation.goBack()}>
      {loading ? (
        <View style={{ padding: 20, gap: 12 }}>
          <Skeleton height={120} radius={theme.radius.lg} />
          <Skeleton height={64} radius={theme.radius.lg} />
          <Skeleton height={64} radius={theme.radius.lg} />
        </View>
      ) : error ? (
        <ErrorState title="Couldn’t load loyalty" message={error.message} actionLabel="Retry" onAction={reload} />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
          <Card style={{ alignItems: 'center', paddingVertical: 28 }}>
            <Text style={{ color: theme.colors.textMuted, fontWeight: '600' }}>Your points balance</Text>
            <Text style={{ color: theme.colors.primary, fontSize: 48, fontWeight: '800', marginTop: 4 }}>
              {data?.balance ?? 0}
            </Text>
          </Card>

          <Text style={{ color: theme.colors.text, fontSize: 16, fontWeight: '800', marginTop: 4 }}>History</Text>
          {entries.length === 0 ? (
            <EmptyState title="No points yet" message="Earn points on every delivered order." />
          ) : (
            entries.map((e) => {
              const positive = e.points > 0;
              return (
                <Card key={e.id}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flex: 1, paddingRight: 12 }}>
                      <Text style={{ color: theme.colors.text, fontWeight: '700' }}>{e.reason ?? e.type}</Text>
                      <Text style={{ color: theme.colors.textMuted, fontSize: 12, marginTop: 2 }}>
                        {new Date(e.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                    <Text style={{ color: positive ? theme.colors.success : theme.colors.textMuted, fontWeight: '800', fontSize: 16 }}>
                      {pointsLabel(e.points)}
                    </Text>
                  </View>
                </Card>
              );
            })
          )}
        </ScrollView>
      )}
    </Screen>
  );
}
