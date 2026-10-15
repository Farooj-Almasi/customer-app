import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { ScrollView, Text, View } from 'react-native';

import { useAuth } from '../auth/AuthProvider';
import { Card, Screen } from '../components/ui';
import { useAsync } from '../hooks/useAsync';
import { EmptyState, ErrorState, PressableScale, Skeleton, Stagger } from '../motion';
import { RootStackParamList } from '../navigation/types';
import { formatSar } from '../util/money';
import { useTheme } from '../theme/theme';

/** Home: choose a branch to order from. */
export function BranchesScreen({ navigation }: NativeStackScreenProps<RootStackParamList, 'Branches'>): React.JSX.Element {
  const theme = useTheme();
  const { api, signOut } = useAuth();
  const { data, loading, error, reload } = useAsync(() => api.listBranches(), []);

  const signOutButton = (
    <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
      <PressableScale accessibilityRole="button" accessibilityLabel="My orders" onPress={() => navigation.navigate('Orders')}>
        <Text style={{ color: theme.colors.accent, fontWeight: '600' }}>Orders</Text>
      </PressableScale>
      <PressableScale accessibilityRole="button" accessibilityLabel="Sign out" onPress={() => signOut()}>
        <Text style={{ color: theme.colors.textMuted, fontWeight: '600' }}>Sign out</Text>
      </PressableScale>
    </View>
  );

  return (
    <Screen title="Farooj Almasi" right={signOutButton}>
      {loading ? (
        <View style={{ padding: 20, gap: 12 }}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={92} radius={theme.radius.lg} />
          ))}
        </View>
      ) : error ? (
        <ErrorState title="Couldn’t load branches" message={error.message} actionLabel="Retry" onAction={reload} />
      ) : !data || data.length === 0 ? (
        <EmptyState title="No branches yet" message="Please check back soon." />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 20, gap: 12 }}>
          <Stagger>
            {data.map((branch) => (
              <PressableScale
                key={branch.id}
                accessibilityRole="button"
                onPress={() => navigation.navigate('Menu', { branchId: branch.id, branchName: branch.name })}
              >
                <Card>
                  <Text style={{ color: theme.colors.text, fontSize: 17, fontWeight: '700' }}>{branch.name}</Text>
                  <Text style={{ color: theme.colors.textMuted, marginTop: 4 }}>
                    {[branch.district, branch.city].filter(Boolean).join(', ')}
                  </Text>
                  <View style={{ flexDirection: 'row', marginTop: 8, gap: 8, flexWrap: 'wrap' }}>
                    {!branch.isAcceptingOrders ? (
                      <Text style={{ color: theme.colors.danger, fontWeight: '600' }}>Closed now</Text>
                    ) : (
                      <>
                        <Text style={{ color: theme.colors.textMuted }}>Delivery {formatSar(branch.deliveryFeeMinor)}</Text>
                        <Text style={{ color: theme.colors.textMuted }}>· Min {formatSar(branch.minOrderMinor)}</Text>
                      </>
                    )}
                  </View>
                </Card>
              </PressableScale>
            ))}
          </Stagger>
        </ScrollView>
      )}
    </Screen>
  );
}
