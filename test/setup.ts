/* eslint-disable @typescript-eslint/no-require-imports */
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
