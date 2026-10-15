import {
  DURATIONS,
  EASINGS,
  PRESS_SCALE,
  SPRINGS,
  STAGGER_MAX_ITEMS,
  STAGGER_STEP,
} from '../../src/motion/tokens';

describe('motion tokens', () => {
  it('orders durations from instant to slow and keeps them short', () => {
    expect(DURATIONS.instant).toBe(0);
    expect(DURATIONS.fast).toBeLessThan(DURATIONS.normal);
    expect(DURATIONS.normal).toBeLessThan(DURATIONS.slow);
    // The brief forbids long animations — nothing exceeds the cap.
    expect(DURATIONS.slow).toBeLessThanOrEqual(360);
  });

  it('defines easings as valid cubic-bezier control points', () => {
    for (const curve of Object.values(EASINGS)) {
      expect(curve).toHaveLength(4);
      // x control points must be within [0,1] for a valid timing curve.
      expect(curve[0]).toBeGreaterThanOrEqual(0);
      expect(curve[0]).toBeLessThanOrEqual(1);
      expect(curve[2]).toBeGreaterThanOrEqual(0);
      expect(curve[2]).toBeLessThanOrEqual(1);
    }
  });

  it('keeps springs well-damped so there is no excessive bounce', () => {
    for (const spring of Object.values(SPRINGS)) {
      expect(spring.damping).toBeGreaterThanOrEqual(18);
      expect(spring.stiffness).toBeGreaterThan(0);
      expect(spring.mass).toBeGreaterThan(0);
    }
  });

  it('keeps the press scale subtle', () => {
    expect(PRESS_SCALE).toBeGreaterThan(0.9);
    expect(PRESS_SCALE).toBeLessThan(1);
  });

  it('caps stagger so a long list never becomes a slow cascade', () => {
    expect(STAGGER_STEP).toBeLessThanOrEqual(60);
    expect(STAGGER_MAX_ITEMS).toBeLessThanOrEqual(12);
  });
});
