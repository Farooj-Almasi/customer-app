/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires */
/**
 * Jest setup for component tests.
 *
 * Reanimated ships an official jest mock that implements the hooks and helpers
 * used across the motion system (useSharedValue, useAnimatedStyle, withTiming,
 * withSpring, withRepeat/Sequence/Delay, cancelAnimation, runOnJS, Easing,
 * ReduceMotion, createAnimatedComponent). Using it keeps component tests free of
 * any UI-thread/native code while still exercising the real component trees.
 */
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

// gesture-handler's jest setup registers its native module mocks.
require('react-native-gesture-handler/jestSetup');

// --- Native/host module mocks for the screen-mount harness ------------------
// These let full screens mount in the simulated RN environment. They are no-ops
// for the motion/hero specs (which don't import these modules).

// Maps render as plain views — a real map cannot render under jest anyway, and
// these specs prove a screen mounts, not that a map draws.
jest.mock('react-native-maps', () => {
  const React = require('react');
  const { View } = require('react-native');
  const Stub = (props: Record<string, unknown>) => React.createElement(View, props, props.children);
  return { __esModule: true, default: Stub, Marker: Stub, PROVIDER_GOOGLE: 'google' };
});

// The secure store is empty in tests (no stored session / language).
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  setItemAsync: jest.fn(() => Promise.resolve()),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}));

// The realtime socket is inert — screens must work on the poll alone.
jest.mock('socket.io-client', () => ({
  io: () => ({ on: () => undefined, off: () => undefined, emit: () => undefined, disconnect: () => undefined, removeAllListeners: () => undefined }),
}));

// Location is never granted in tests.
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'denied' })),
  getCurrentPositionAsync: jest.fn(() => Promise.resolve({ coords: { latitude: 24.7, longitude: 46.7 } })),
}));

// Every network call fails fast, so a mounted data screen settles into its
// error state rather than hanging on a real request.
(global as unknown as { fetch: unknown }).fetch = jest.fn(() =>
  Promise.reject(new Error('no network in tests')),
);
