import {
  effectiveDurations,
  effectiveSprings,
  INSTANT_SPRING,
  shouldAnimateDecorative,
  ZERO_DURATIONS,
} from '../../src/motion/reduced-motion';
import { DURATIONS, SPRINGS } from '../../src/motion/tokens';

describe('reduced motion', () => {
  it('collapses every duration to zero when reduced motion is on', () => {
    expect(effectiveDurations(true)).toEqual(ZERO_DURATIONS);
    expect(effectiveDurations(true).normal).toBe(0);
    expect(effectiveDurations(true).slow).toBe(0);
  });

  it('returns the real durations when reduced motion is off', () => {
    expect(effectiveDurations(false)).toEqual(DURATIONS);
  });

  it('suppresses decorative animation only under reduced motion', () => {
    expect(shouldAnimateDecorative(false)).toBe(true);
    expect(shouldAnimateDecorative(true)).toBe(false);
  });

  it('swaps springs for an instant-settling config under reduced motion', () => {
    const reduced = effectiveSprings(true);
    expect(reduced.soft).toBe(INSTANT_SPRING);
    expect(reduced.standard).toBe(INSTANT_SPRING);
    expect(reduced.emphasized).toBe(INSTANT_SPRING);
    // The instant spring is very stiff and heavily damped, so it snaps.
    expect(INSTANT_SPRING.stiffness).toBeGreaterThan(SPRINGS.emphasized.stiffness);
  });

  it('returns the real springs when reduced motion is off', () => {
    expect(effectiveSprings(false)).toEqual(SPRINGS);
  });
});
