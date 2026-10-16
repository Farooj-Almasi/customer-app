import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { Image, ScrollView, Text, View } from 'react-native';

import { API_BASE_URL } from '../api/config';
import type { ConfigBanner } from '../api/types';
import { useAuth } from '../auth/AuthProvider';
import { Card, Screen } from '../components/ui';
import { useAsync } from '../hooks/useAsync';
import { EmptyState, ErrorState, PressableScale, Skeleton, Stagger } from '../motion';
import { RootStackParamList } from '../navigation/types';
import { formatSar } from '../util/money';
import { useTheme } from '../theme/theme';

/** Resolves a banner image path against the API origin; absolute URLs pass through. */
function imageSource(url: string): string {
  if (/^https?:\/\//.test(url)) {
    return url;
  }
  const origin = API_BASE_URL.replace(/\/api(\/v\d+)?\/?$/, '');
  return `${origin}${url.startsWith('/') ? '' : '/'}${url}`;
}

/** Home: a promo banner strip, then choose a branch to order from. */
export function BranchesScreen({ navigation }: NativeStackScreenProps<RootStackParamList, 'Branches'>): React.JSX.Element {
  const theme = useTheme();
  const { api } = useAuth();
  const { data, loading, error, reload } = useAsync(() => api.listBranches(), []);
  // Banners are a nice-to-have; a failure here must never cost the branch list.
  const config = useAsync(() => api.config(), []);
  const banners: ConfigBanner[] = (config.data?.banners ?? [])
    // Branch-agnostic home: show only platform-wide banners (empty branchIds).
    .filter((b) => b.branchIds.length === 0)
    .sort((a, b) => a.priority - b.priority);

  const headerLinks = (
    <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
      <PressableScale accessibilityRole="button" accessibilityLabel="Offers" onPress={() => navigation.navigate('Offers')}>
        <Text style={{ color: theme.colors.accent, fontWeight: '600' }}>Offers</Text>
      </PressableScale>
      <PressableScale accessibilityRole="button" accessibilityLabel="Account" onPress={() => navigation.navigate('Account')}>
        <Text style={{ color: theme.colors.textMuted, fontWeight: '600' }}>Account</Text>
      </PressableScale>
    </View>
  );

  const bannerStrip =
    banners.length > 0 ? (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 12, paddingBottom: 4 }}
      >
        {banners.map((b) => (
          <PressableScale
            key={b.id}
            accessibilityRole="button"
            // The title is the accessible name — not baked into the image — so a
            // screen reader and an Arabic reader both get the words.
            accessibilityLabel={b.title ?? 'Offer'}
            onPress={() => navigation.navigate('Offers')}
            style={{
              width: 300,
              height: 140,
              borderRadius: theme.radius.lg,
              overflow: 'hidden',
              backgroundColor: theme.colors.surfaceAlt,
            }}
          >
            <Image source={{ uri: imageSource(b.imageUrl) }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
            {b.title || b.description ? (
              <View
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: 0,
                  padding: 12,
                  backgroundColor: theme.colors.backdrop,
                }}
              >
                {b.title ? (
                  <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 16 }} numberOfLines={1}>
                    {b.title}
                  </Text>
                ) : null}
                {b.description ? (
                  <Text style={{ color: '#FFFFFF', fontSize: 13, marginTop: 2 }} numberOfLines={1}>
                    {b.description}
                  </Text>
                ) : null}
              </View>
            ) : null}
          </PressableScale>
        ))}
      </ScrollView>
    ) : null;

  return (
    <Screen title="Farooj Almasi" right={headerLinks}>
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
        <ScrollView contentContainerStyle={{ paddingVertical: 20, gap: 12 }}>
          {bannerStrip}
          <View style={{ paddingHorizontal: 20, gap: 12 }}>
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
          </View>
        </ScrollView>
      )}
    </Screen>
  );
}
