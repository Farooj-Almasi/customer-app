import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { ScrollView, Text, View } from 'react-native';

import { useCart } from '../cart/CartProvider';
import { estimatedTotalMinor } from '../cart/cart';
import { Card, PrimaryButton, Screen } from '../components/ui';
import { EmptyState, PressableScale, QuantityStepper } from '../motion';
import { ORDER_TYPE } from '../types/backend';
import { RootStackParamList } from '../navigation/types';
import { formatSar } from '../util/money';
import { useTheme } from '../theme/theme';

/** The cart: adjust quantities, remove, and go to checkout. Pickup-only for now. */
export function CartScreen({ navigation }: NativeStackScreenProps<RootStackParamList, 'Cart'>): React.JSX.Element {
  const theme = useTheme();
  const { cart, count, dispatch } = useCart();

  if (count === 0) {
    return (
      <Screen title="Cart" onBack={() => navigation.goBack()}>
        <EmptyState
          title="Your cart is empty"
          message="Add something from the menu to get started."
          actionLabel="Browse menu"
          onAction={() => navigation.goBack()}
        />
      </Screen>
    );
  }

  return (
    <Screen title="Cart" onBack={() => navigation.goBack()}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24, gap: 10 }}>
        {cart.lines.map((line) => (
          <Card key={line.key}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={{ color: theme.colors.text, fontSize: 16, fontWeight: '700' }}>{line.productName}</Text>
                <Text style={{ color: theme.colors.primary, fontWeight: '700', marginTop: 4 }}>
                  {formatSar(line.unitPriceMinor * line.quantity)}
                </Text>
              </View>
              <QuantityStepper
                value={line.quantity}
                onChange={(q) => dispatch({ type: 'SET_QTY', key: line.key, quantity: q })}
                min={0}
              />
            </View>
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel={`Remove ${line.productName}`}
              onPress={() => dispatch({ type: 'REMOVE', key: line.key })}
              style={{ marginTop: 8 }}
            >
              <Text style={{ color: theme.colors.danger, fontWeight: '600' }}>Remove</Text>
            </PressableScale>
          </Card>
        ))}
      </ScrollView>

      <View style={{ padding: 16, borderTopWidth: 1, borderTopColor: theme.colors.border }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
          <Text style={{ color: theme.colors.textMuted }}>Estimated subtotal</Text>
          <Text style={{ color: theme.colors.text, fontWeight: '700' }}>{formatSar(estimatedTotalMinor(cart))}</Text>
        </View>
        <Text style={{ color: theme.colors.textMuted, fontSize: 12, marginBottom: 12 }}>
          Final total, VAT and any delivery fee are confirmed at checkout.
        </Text>
        <PrimaryButton label="Checkout" onPress={() => navigation.navigate('Checkout', { type: ORDER_TYPE.PICKUP })} />
      </View>
    </Screen>
  );
}
