import { DarkTheme, DefaultTheme, NavigationContainer, Theme as NavTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import { useAuth } from '../auth/AuthProvider';
import { useReducedMotion } from '../motion';
import { RootStackParamList } from './types';
import { BranchesScreen } from '../screens/BranchesScreen';
import { CartScreen } from '../screens/CartScreen';
import { CheckoutScreen } from '../screens/CheckoutScreen';
import { MenuScreen } from '../screens/MenuScreen';
import { OrderTrackingScreen } from '../screens/OrderTrackingScreen';
import { OrdersScreen } from '../screens/OrdersScreen';
import { AddAddressScreen } from '../screens/AddAddressScreen';
import { OtpScreen } from '../screens/OtpScreen';
import { PaymentProcessingScreen } from '../screens/PaymentProcessingScreen';
import { PhoneScreen } from '../screens/PhoneScreen';
import { useTheme } from '../theme/theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

/** Maps the app theme onto React Navigation's container theme (avoids colour flashes). */
function navTheme(background: string, card: string, text: string, primary: string, border: string, dark: boolean): NavTheme {
  const base = dark ? DarkTheme : DefaultTheme;
  return { ...base, colors: { ...base.colors, background, card, text, primary, border } };
}

/**
 * The app's navigation.
 *
 * Two screen sets, switched by auth state: the OTP flow when signed out, the
 * full ordering flow when signed in. Screen transitions collapse to none under
 * reduced motion, per the motion system.
 */
export function RootNavigator(): React.JSX.Element {
  const theme = useTheme();
  const reduceMotion = useReducedMotion();
  const { isAuthenticated } = useAuth();

  const animation = reduceMotion ? 'none' : 'slide_from_right';

  return (
    <NavigationContainer
      theme={navTheme(
        theme.colors.background,
        theme.colors.surface,
        theme.colors.text,
        theme.colors.primary,
        theme.colors.border,
        theme.scheme === 'dark',
      )}
    >
      <Stack.Navigator screenOptions={{ headerShown: false, animation, contentStyle: { backgroundColor: theme.colors.background } }}>
        {!isAuthenticated ? (
          <>
            <Stack.Screen name="Phone" component={PhoneScreen} />
            <Stack.Screen name="Otp" component={OtpScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Branches" component={BranchesScreen} />
            <Stack.Screen name="Menu" component={MenuScreen} />
            <Stack.Screen name="Cart" component={CartScreen} options={{ animation: reduceMotion ? 'none' : 'slide_from_bottom' }} />
            <Stack.Screen name="Checkout" component={CheckoutScreen} />
            <Stack.Screen name="AddAddress" component={AddAddressScreen} options={{ animation: reduceMotion ? 'none' : 'slide_from_bottom' }} />
            <Stack.Screen
              name="PaymentProcessing"
              component={PaymentProcessingScreen}
              options={{ animation: reduceMotion ? 'none' : 'fade', gestureEnabled: false }}
            />
            <Stack.Screen name="OrderTracking" component={OrderTrackingScreen} />
            <Stack.Screen name="Orders" component={OrdersScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
