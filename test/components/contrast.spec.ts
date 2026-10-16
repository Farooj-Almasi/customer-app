import { buildTheme } from '../../src/theme/theme';

/** WCAG relative luminance + contrast ratio. Pure. */
function luminance(hex: string): number {
  const c = hex.replace('#', '');
  const chan = (i: number) => parseInt(c.slice(i, i + 2), 16) / 255;
  const lin = (x: number) => (x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4));
  return 0.2126 * lin(chan(0)) + 0.7152 * lin(chan(2)) + 0.0722 * lin(chan(4));
}
function ratio(a: string, b: string): number {
  const l1 = luminance(a);
  const l2 = luminance(b);
  const hi = Math.max(l1, l2);
  const lo = Math.min(l1, l2);
  return (hi + 0.05) / (lo + 0.05);
}

describe('theme contrast (WCAG 2.1)', () => {
  for (const scheme of ['light', 'dark'] as const) {
    const c = buildTheme(scheme).colors;

    describe(`${scheme} — normal text AA (>= 4.5:1)`, () => {
      const pairs: [string, string, string][] = [
        ['text / surface', c.text, c.surface],
        ['text / background', c.text, c.background],
        ['textMuted / surface', c.textMuted, c.surface],
        ['textMuted / background', c.textMuted, c.background],
        ['textMuted / surfaceAlt', c.textMuted, c.surfaceAlt],
        ['success / surface', c.success, c.surface],
        ['danger / surface', c.danger, c.surface],
        ['warning / surface', c.warning, c.surface],
        // Tones also render as text on the surfaceAlt pill ground.
        ['success / surfaceAlt', c.success, c.surfaceAlt],
        ['danger / surfaceAlt', c.danger, c.surfaceAlt],
        ['warning / surfaceAlt', c.warning, c.surfaceAlt],
        ['accent / surface', c.accent, c.surface],
      ];
      for (const [name, fg, bg] of pairs) {
        it(name, () => {
          expect(ratio(fg, bg)).toBeGreaterThanOrEqual(4.5);
        });
      }
    });

    describe(`${scheme} — prominent/large bold text (>= 3:1)`, () => {
      // Button labels and prices are bold and prominent. In dark mode the brand
      // red sits at AA-large against both white and the dark surface; this is a
      // deliberate, documented exception (see theme.ts), pinned here so it can
      // only ever drift upward.
      const pairs: [string, string, string][] = [
        ['onPrimary / primary', c.onPrimary, c.primary],
        ['primary / surface', c.primary, c.surface],
      ];
      for (const [name, fg, bg] of pairs) {
        it(name, () => {
          expect(ratio(fg, bg)).toBeGreaterThanOrEqual(3);
        });
      }
    });
  }
});
