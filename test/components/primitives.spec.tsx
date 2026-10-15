import { render } from '@testing-library/react-native';
import React from 'react';
import { Text } from 'react-native';

import {
  BottomSheet,
  CartBadge,
  EmptyState,
  ErrorState,
  FadeIn,
  PressableScale,
  QuantityStepper,
  Skeleton,
  Stagger,
  Toast,
  MotionProvider,
} from '../../src/motion';

const wrap = (ui: React.ReactElement) => render(<MotionProvider>{ui}</MotionProvider>);

describe('motion primitives (mount)', () => {
  it('mounts FadeIn and Stagger without throwing', () => {
    expect(() =>
      wrap(
        <Stagger>
          <Text>one</Text>
          <Text>two</Text>
        </Stagger>,
      ),
    ).not.toThrow();
    expect(() => wrap(<FadeIn><Text>hi</Text></FadeIn>)).not.toThrow();
  });

  it('mounts a pressable, skeleton and quantity stepper', () => {
    expect(() =>
      wrap(
        <PressableScale onPress={() => undefined}>
          <Text>tap</Text>
        </PressableScale>,
      ),
    ).not.toThrow();
    expect(() => wrap(<Skeleton width={100} height={20} />)).not.toThrow();
    expect(() => wrap(<QuantityStepper value={2} onChange={() => undefined} />)).not.toThrow();
  });

  it('renders the cart badge only when there are items', () => {
    const empty = wrap(<CartBadge count={0} />);
    expect(empty.queryByText('0')).toBeNull();
    const filled = wrap(<CartBadge count={3} />);
    expect(filled.getByText('3')).toBeTruthy();
  });

  it('mounts empty and error states with an action', () => {
    expect(() =>
      wrap(<EmptyState title="Nothing here" actionLabel="Go" onAction={() => undefined} />),
    ).not.toThrow();
    expect(() => wrap(<ErrorState title="Something went wrong" />)).not.toThrow();
  });

  it('mounts a visible toast and an open bottom sheet', () => {
    expect(() =>
      wrap(<Toast visible message="Done" tone="success" onHide={() => undefined} />),
    ).not.toThrow();
    expect(() =>
      wrap(
        <BottomSheet visible onClose={() => undefined}>
          <Text>sheet content</Text>
        </BottomSheet>,
      ),
    ).not.toThrow();
  });
});
