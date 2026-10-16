import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { useAuth } from '../auth/AuthProvider';
import { useCart } from '../cart/CartProvider';
import { Card, Screen } from '../components/ui';
import { useAsync } from '../hooks/useAsync';
import { BottomSheet, CartBadge, EmptyState, ErrorState, PressableScale, Skeleton } from '../motion';
import { RootStackParamList } from '../navigation/types';
import { formatSar } from '../util/money';
import { useTheme } from '../theme/theme';
import type { MenuProduct } from '../api/types';

/** The lowest variant price, for the "from SAR x" label on a product with sizes. */
function fromPriceMinor(product: MenuProduct): number {
  if (product.variants.length === 0) {
    return product.priceMinor;
  }
  return Math.min(...product.variants.map((v) => v.priceMinor));
}

/** A branch menu: browse categories/products and add to cart (choosing a size when offered). */
export function MenuScreen({ route, navigation }: NativeStackScreenProps<RootStackParamList, 'Menu'>): React.JSX.Element {
  const theme = useTheme();
  const { api } = useAuth();
  const { cart, count, dispatch } = useCart();
  const { branchId, branchName } = route.params;
  const { data, loading, error, reload } = useAsync(() => api.menu(branchId), [branchId]);

  // The product whose size the customer is choosing, if any.
  const [variantFor, setVariantFor] = useState<MenuProduct | null>(null);

  const addLine = (product: MenuProduct, variant?: { id: string; name: string; priceMinor: number }): void => {
    dispatch({
      type: 'ADD',
      branchId,
      line: {
        productId: product.id,
        productName: product.name,
        productVariantId: variant?.id,
        variantName: variant?.name,
        unitPriceMinor: variant ? variant.priceMinor : product.priceMinor,
        addonIds: [],
        addonNames: [],
      },
    });
  };

  // Products with variants must have one chosen — the price depends on it, and
  // the backend rejects a cart line whose variant it cannot find.
  const onAdd = (product: MenuProduct): void => {
    if (product.variants.length > 0) {
      setVariantFor(product);
      return;
    }
    addLine(product);
  };

  const cartButton = (
    <PressableScale accessibilityRole="button" accessibilityLabel="View cart" onPress={() => navigation.navigate('Cart')}>
      <View>
        <Text style={{ fontSize: 24 }}>🛒</Text>
        <View style={{ position: 'absolute', top: -6, right: -10 }}>
          <CartBadge count={count} />
        </View>
      </View>
    </PressableScale>
  );

  return (
    <Screen title={branchName} onBack={() => navigation.goBack()} right={cartButton}>
      {loading ? (
        <View style={{ padding: 20, gap: 12 }}>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} height={72} radius={theme.radius.md} />
          ))}
        </View>
      ) : error ? (
        <ErrorState title="Couldn’t load the menu" message={error.message} actionLabel="Retry" onAction={reload} />
      ) : !data || data.categories.length === 0 ? (
        <EmptyState title="Menu is empty" message="This branch has nothing available right now." />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: count > 0 ? 96 : 24 }}>
          {data.categories.map((category) => (
            <View key={category.id} style={{ marginBottom: 20 }}>
              <Text style={{ color: theme.colors.text, fontSize: 18, fontWeight: '800', marginBottom: 10 }}>
                {category.name}
              </Text>
              <View style={{ gap: 10 }}>
                {category.products.map((product) => {
                  const hasVariants = product.variants.length > 0;
                  return (
                    <Card key={product.id}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={{ flex: 1, paddingRight: 12 }}>
                          <Text style={{ color: theme.colors.text, fontSize: 16, fontWeight: '700' }}>{product.name}</Text>
                          {product.description ? (
                            <Text style={{ color: theme.colors.textMuted, marginTop: 2 }} numberOfLines={2}>
                              {product.description}
                            </Text>
                          ) : null}
                          <Text style={{ color: theme.colors.primary, fontWeight: '700', marginTop: 6 }}>
                            {hasVariants ? `from ${formatSar(fromPriceMinor(product))}` : formatSar(product.priceMinor)}
                          </Text>
                        </View>
                        <PressableScale
                          accessibilityRole="button"
                          accessibilityLabel={`Add ${product.name}`}
                          onPress={() => onAdd(product)}
                          style={{
                            backgroundColor: theme.colors.primary,
                            width: 40,
                            height: 40,
                            borderRadius: 20,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Text style={{ color: theme.colors.onPrimary, fontSize: 24, fontWeight: '700' }}>+</Text>
                        </PressableScale>
                      </View>
                    </Card>
                  );
                })}
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {count > 0 && cart.branchId === branchId ? (
        <View style={{ position: 'absolute', left: 16, right: 16, bottom: 20 }}>
          <PressableScale
            accessibilityRole="button"
            onPress={() => navigation.navigate('Cart')}
            style={{
              backgroundColor: theme.colors.primary,
              borderRadius: theme.radius.pill,
              paddingVertical: 16,
              paddingHorizontal: 20,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Text style={{ color: theme.colors.onPrimary, fontWeight: '800', fontSize: 16 }}>View cart</Text>
            <Text style={{ color: theme.colors.onPrimary, fontWeight: '800', fontSize: 16 }}>{count} item{count === 1 ? '' : 's'}</Text>
          </PressableScale>
        </View>
      ) : null}

      <BottomSheet visible={!!variantFor} onClose={() => setVariantFor(null)}>
        <Text style={{ color: theme.colors.text, fontSize: 18, fontWeight: '800', marginBottom: 4 }}>
          {variantFor?.name}
        </Text>
        <Text style={{ color: theme.colors.textMuted, marginBottom: 12 }}>Choose a size</Text>
        {variantFor?.variants.map((v) => (
          <PressableScale
            key={v.id}
            accessibilityRole="button"
            accessibilityLabel={`${variantFor.name}, ${v.name}, ${formatSar(v.priceMinor)}`}
            onPress={() => {
              const product = variantFor;
              setVariantFor(null);
              addLine(product, v);
            }}
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingVertical: 14,
              borderBottomWidth: 1,
              borderBottomColor: theme.colors.border,
            }}
          >
            <Text style={{ color: theme.colors.text, fontSize: 16, fontWeight: '600' }}>{v.name}</Text>
            <Text style={{ color: theme.colors.primary, fontWeight: '700' }}>{formatSar(v.priceMinor)}</Text>
          </PressableScale>
        ))}
      </BottomSheet>
    </Screen>
  );
}
