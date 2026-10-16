import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { ScrollView, Text, View } from 'react-native';

import type { Offer } from '../api/types';
import { useAuth } from '../auth/AuthProvider';
import { Card, Screen } from '../components/ui';
import { useAsync } from '../hooks/useAsync';
import { useLocale } from '../i18n/LocaleProvider';
import type { MessageKey } from '../i18n/messages';
import { EmptyState, ErrorState, Skeleton } from '../motion';
import { RootStackParamList } from '../navigation/types';
import { useTheme } from '../theme/theme';

type Translate = (key: MessageKey, vars?: Record<string, string | number>) => string;

/** How much the offer takes off, in words. The server owns the actual arithmetic. */
export function discountLabel(offer: Offer, t: Translate, sar: (minor: number) => string): string {
  if (offer.discountType === 'PERCENTAGE') {
    const cap = offer.maxDiscountMinor ? t('offers.upTo', { amount: sar(offer.maxDiscountMinor) }) : '';
    return `${t('offers.percentOff', { pct: offer.discountValue })}${cap}`;
  }
  // FIXED and anything else: the value is a minor-unit amount.
  return t('offers.amountOff', { amount: sar(offer.discountValue) });
}

/** The published offers a customer can use. Each card carries the code the checkout accepts. */
export function OffersScreen({ navigation }: NativeStackScreenProps<RootStackParamList, 'Offers'>): React.JSX.Element {
  const theme = useTheme();
  const { api } = useAuth();
  const { t, sar } = useLocale();
  const { data, loading, error, reload } = useAsync(() => api.config(), []);
  const offers = data?.offers ?? [];

  return (
    <Screen title={t('offers.title')} onBack={() => navigation.goBack()}>
      {loading ? (
        <View style={{ padding: 20, gap: 12 }}>
          {[0, 1].map((i) => (
            <Skeleton key={i} height={120} radius={theme.radius.lg} />
          ))}
        </View>
      ) : error ? (
        <ErrorState title={t('offers.errorTitle')} message={error.message} actionLabel={t('common.retry')} onAction={reload} />
      ) : offers.length === 0 ? (
        <EmptyState title={t('offers.emptyTitle')} message={t('offers.emptyBody')} />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
          {offers.map((offer) => (
            <Card key={offer.id} elevated>
              <Text style={{ color: theme.colors.text, fontWeight: '800', fontSize: 17 }}>{offer.name}</Text>
              {offer.description ? (
                <Text style={{ color: theme.colors.textMuted, marginTop: 4 }}>{offer.description}</Text>
              ) : null}
              <Text style={{ color: theme.colors.primary, fontWeight: '800', marginTop: 8 }}>{discountLabel(offer, t, sar)}</Text>
              {offer.minSpendMinor ? (
                <Text style={{ color: theme.colors.textMuted, fontSize: 13, marginTop: 2 }}>
                  {t('offers.minSpend', { amount: sar(offer.minSpendMinor) })}
                </Text>
              ) : null}
              <View
                style={{
                  marginTop: 12,
                  borderWidth: 1,
                  borderStyle: 'dashed',
                  borderColor: theme.colors.primary,
                  borderRadius: theme.radius.md,
                  paddingVertical: 10,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: theme.colors.textMuted, fontSize: 12 }}>{t('offers.useCode')}</Text>
                <Text style={{ color: theme.colors.text, fontWeight: '800', fontSize: 18, letterSpacing: 2, marginTop: 2 }}>
                  {offer.code}
                </Text>
              </View>
            </Card>
          ))}
        </ScrollView>
      )}
    </Screen>
  );
}
