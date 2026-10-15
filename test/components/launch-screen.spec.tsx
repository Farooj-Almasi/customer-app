import { render } from '@testing-library/react-native';
import React from 'react';

import { LaunchScreen } from '../../src/launch/LaunchScreen';
import { MotionProvider } from '../../src/motion';

const wrap = (ui: React.ReactElement) => render(<MotionProvider>{ui}</MotionProvider>);

describe('LaunchScreen (mount)', () => {
  it('mounts with the brand logo without throwing', () => {
    expect(() => wrap(<LaunchScreen onFinish={() => undefined} />).unmount()).not.toThrow();
  });

  it('exposes the brand name to assistive tech', () => {
    const { getByLabelText } = wrap(<LaunchScreen onFinish={() => undefined} />);
    expect(getByLabelText(/farooj almasi/i)).toBeTruthy();
  });
});
