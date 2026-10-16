/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-var-requires */
import { act, render } from '@testing-library/react-native';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// The screens are mounted with a plain navigation prop, not inside a
// NavigationContainer, so useFocusEffect (Checkout) has no context. Stub it to
// run its callback once, like a mount effect — which is what it does on first
// focus anyway.
jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  const ReactLib = require('react');
  return {
    ...actual,
    useFocusEffect: (cb: () => void | (() => void)) => ReactLib.useEffect(cb, []),
  };
});

import { AuthProvider } from '../../src/auth/AuthProvider';
import { CartProvider } from '../../src/cart/CartProvider';
import { LocaleProvider } from '../../src/i18n/LocaleProvider';
import { MotionProvider } from '../../src/motion';
import { RealtimeProvider } from '../../src/realtime/RealtimeProvider';

import { AccountScreen } from '../../src/screens/AccountScreen';
import { AddAddressScreen } from '../../src/screens/AddAddressScreen';
import { BranchesScreen } from '../../src/screens/BranchesScreen';
import { CartScreen } from '../../src/screens/CartScreen';
import { CheckoutScreen } from '../../src/screens/CheckoutScreen';
import { LoyaltyScreen } from '../../src/screens/LoyaltyScreen';
import { MenuScreen } from '../../src/screens/MenuScreen';
import { NotificationsScreen } from '../../src/screens/NotificationsScreen';
import { OffersScreen } from '../../src/screens/OffersScreen';
import { OrderTrackingScreen } from '../../src/screens/OrderTrackingScreen';
import { OrdersScreen } from '../../src/screens/OrdersScreen';
import { OtpScreen } from '../../src/screens/OtpScreen';
import { PhoneScreen } from '../../src/screens/PhoneScreen';

const METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

function Providers({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <SafeAreaProvider initialMetrics={METRICS}>
      <MotionProvider>
        <LocaleProvider>
          <AuthProvider>
            <RealtimeProvider>
              <CartProvider>{children}</CartProvider>
            </RealtimeProvider>
          </AuthProvider>
        </LocaleProvider>
      </MotionProvider>
    </SafeAreaProvider>
  );
}

const nav = () =>
  ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    replace: jest.fn(),
    canGoBack: () => true,
    setOptions: jest.fn(),
    addListener: () => () => undefined,
  }) as any;

/** Mount a screen through the full provider stack and flush its initial effects. */
async function mount(ui: React.ReactElement): Promise<void> {
  const tree = render(<Providers>{ui}</Providers>);
  // Let the data-fetch and provider effects settle into loading/error state.
  await act(async () => {
    await Promise.resolve();
  });
  tree.unmount();
}

// Each case is deliberately awkward — no session, every request failing, empty
// params — because the states a real user hits first (loading, then error on a
// dead connection, then empty) are exactly where a render crash hides.
describe('screen mount (no crash)', () => {
  it('BranchesScreen', async () => {
    await expect(mount(<BranchesScreen navigation={nav()} route={{ key: 'b', name: 'Branches' } as any} />)).resolves.toBeUndefined();
  });

  it('MenuScreen', async () => {
    await mount(<MenuScreen navigation={nav()} route={{ key: 'm', name: 'Menu', params: { branchId: 'b1', branchName: 'Test' } } as any} />);
  });

  it('CartScreen (empty)', async () => {
    await mount(<CartScreen navigation={nav()} route={{ key: 'c', name: 'Cart' } as any} />);
  });

  it('CheckoutScreen', async () => {
    await mount(<CheckoutScreen navigation={nav()} route={{ key: 'co', name: 'Checkout', params: { type: 'PICKUP' } } as any} />);
  });

  it('AccountScreen', async () => {
    await mount(<AccountScreen navigation={nav()} route={{ key: 'a', name: 'Account' } as any} />);
  });

  it('LoyaltyScreen', async () => {
    await mount(<LoyaltyScreen navigation={nav()} route={{ key: 'l', name: 'Loyalty' } as any} />);
  });

  it('NotificationsScreen', async () => {
    await mount(<NotificationsScreen navigation={nav()} route={{ key: 'n', name: 'Notifications' } as any} />);
  });

  it('OffersScreen', async () => {
    await mount(<OffersScreen navigation={nav()} route={{ key: 'of', name: 'Offers' } as any} />);
  });

  it('OrdersScreen', async () => {
    await mount(<OrdersScreen navigation={nav()} route={{ key: 'o', name: 'Orders' } as any} />);
  });

  it('OrderTrackingScreen', async () => {
    await mount(<OrderTrackingScreen navigation={nav()} route={{ key: 'ot', name: 'OrderTracking', params: { orderId: 'o1' } } as any} />);
  });

  it('AddAddressScreen (new and edit)', async () => {
    await mount(<AddAddressScreen navigation={nav()} route={{ key: 'aa', name: 'AddAddress' } as any} />);
    const address = {
      id: 'a1', label: 'Home', line1: '1 St', line2: null, district: null, city: 'Riyadh',
      postalCode: null, latitude: 24.7, longitude: 46.7, notes: null, isDefault: true,
    };
    await mount(<AddAddressScreen navigation={nav()} route={{ key: 'aa2', name: 'AddAddress', params: { address } } as any} />);
  });

  it('PhoneScreen and OtpScreen', async () => {
    await mount(<PhoneScreen navigation={nav()} route={{ key: 'p', name: 'Phone' } as any} />);
    await mount(<OtpScreen navigation={nav()} route={{ key: 'otp', name: 'Otp', params: { phone: '+966500000000' } } as any} />);
  });
});
