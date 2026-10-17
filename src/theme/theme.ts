/**
 * The design-token layer the whole app renders against.
 *
 * One source of truth for colour, type, spacing, radius, elevation and motion,
 * in light and dark. Screens and components read tokens — never raw hex, raw
 * pixel sizes or ad-hoc shadows — so the app reads as one system and a change
 * here lands everywhere at once.
 *
 * Backwards-compatible: every token name that existed before (`colors.*`,
 * `radius.*`, `spacing()`) is still here, so nothing that already reads them
 * breaks. The additions are `type` (a typographic scale), `space` (named
 * spacing steps) and `shadow` (elevation presets).
 */

import { useColorScheme, TextStyle, ViewStyle } from 'react-native';

/** A typographic step: everything a <Text> needs to look deliberate. */
export interface TypeStyle {
  fontSize: number;
  lineHeight: number;
  fontWeight: TextStyle['fontWeight'];
  letterSpacing?: number;
}

export interface Theme {
  scheme: 'light' | 'dark';
  colors: {
    background: string;
    surface: string;
    surfaceAlt: string;
    border: string;
    text: string;
    textMuted: string;
    /** Brand primary — the Farooj Almasi red from the logo. */
    primary: string;
    /** A tinted wash of the brand, for selected chips and subtle highlights. */
    primarySoft: string;
    onPrimary: string;
    /** Brand secondary — the warm orange of the shawarma / citrus. */
    secondary: string;
    /** Brand accent — the field green. */
    accent: string;
    success: string;
    danger: string;
    warning: string;
    progress: string;
    skeleton: string;
    skeletonHighlight: string;
    backdrop: string;
    /** Fixed brand background for the launch screen (theme-independent). */
    launch: string;
  };
  /** The typographic scale. Each entry pairs a size with its line height and weight. */
  type: {
    display: TypeStyle;
    title: TypeStyle;
    heading: TypeStyle;
    subheading: TypeStyle;
    body: TypeStyle;
    bodyStrong: TypeStyle;
    small: TypeStyle;
    caption: TypeStyle;
    label: TypeStyle;
  };
  radius: { sm: number; md: number; lg: number; xl: number; pill: number };
  /** Named spacing steps on a 4px rhythm. `spacing(n)` stays for arbitrary multiples. */
  space: { xs: number; sm: number; md: number; lg: number; xl: number; xxl: number };
  spacing: (n: number) => number;
  /** Elevation presets (iOS shadow + Android elevation) keyed by height. */
  shadow: { sm: ViewStyle; md: ViewStyle; lg: ViewStyle };
  /** Minimum interactive target, per WCAG 2.5.5 / platform HIG. */
  touchTarget: number;
}

// Sampled from the logo: banner red primary, field green accent, ring gold.
const RED = '#C0202C';
const RED_DARK = '#E24A54';
const GREEN = '#3F7F3A';
const GREEN_BRIGHT = '#5AA152';

const light: Theme['colors'] = {
  background: '#FBF7F5',
  surface: '#FFFFFF',
  surfaceAlt: '#F4EEEC',
  border: '#E8DDDA',
  text: '#1E1A1C',
  textMuted: '#6E6460',
  primary: RED,
  primarySoft: '#F7E4E5',
  onPrimary: '#FFFFFF',
  secondary: GREEN,
  accent: GREEN,
  // Semantic tones chosen to clear WCAG AA (4.5:1) as text on both the white
  // surface and the surfaceAlt pill ground — a brand-bright orange reads at
  // only 2.7:1, so warning is darkened for use as text.
  success: '#217A47',
  danger: '#BE3A30',
  warning: '#9E560C',
  progress: RED,
  skeleton: '#EFE6EC',
  skeletonHighlight: '#F8F1F5',
  backdrop: 'rgba(30,20,26,0.45)',
  launch: '#FFFFFF',
};

const dark: Theme['colors'] = {
  background: '#121016',
  surface: '#1B1820',
  surfaceAlt: '#262230',
  border: '#342D3C',
  text: '#F5F1F3',
  textMuted: '#A79CA6',
  primary: RED_DARK,
  primarySoft: '#3A2529',
  onPrimary: '#FFFFFF',
  secondary: GREEN_BRIGHT,
  accent: GREEN_BRIGHT,
  success: '#3CC06E',
  danger: '#F0655B',
  warning: '#F78F3D',
  progress: RED_DARK,
  skeleton: '#262230',
  skeletonHighlight: '#302B3A',
  backdrop: 'rgba(0,0,0,0.6)',
  launch: '#FFFFFF',
};

// A 1.2-ish modular scale. Line heights are generous enough for Arabic, whose
// glyphs sit taller than Latin — a tight Latin leading clips the diacritics.
const type: Theme['type'] = {
  display: { fontSize: 30, lineHeight: 38, fontWeight: '800' },
  title: { fontSize: 24, lineHeight: 32, fontWeight: '800' },
  heading: { fontSize: 20, lineHeight: 28, fontWeight: '800' },
  subheading: { fontSize: 17, lineHeight: 24, fontWeight: '700' },
  body: { fontSize: 15, lineHeight: 22, fontWeight: '400' },
  bodyStrong: { fontSize: 15, lineHeight: 22, fontWeight: '700' },
  small: { fontSize: 13, lineHeight: 18, fontWeight: '400' },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '500' },
  label: { fontSize: 13, lineHeight: 18, fontWeight: '600', letterSpacing: 0.2 },
};

const BASE = {
  radius: { sm: 8, md: 12, lg: 16, xl: 24, pill: 999 },
  space: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 },
  spacing: (n: number) => n * 4,
  touchTarget: 44,
};

function shadows(scheme: 'light' | 'dark'): Theme['shadow'] {
  // Shadows read as almost nothing on a dark ground; lean on the surface step
  // there and keep elevation only so Android still layers correctly.
  const opacity = scheme === 'dark' ? 0.4 : 0.12;
  const color = '#000000';
  return {
    sm: { shadowColor: color, shadowOpacity: opacity, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
    md: { shadowColor: color, shadowOpacity: opacity, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
    lg: { shadowColor: color, shadowOpacity: opacity, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 6 },
  };
}

export function buildTheme(scheme: 'light' | 'dark'): Theme {
  return { scheme, colors: scheme === 'dark' ? dark : light, type, shadow: shadows(scheme), ...BASE };
}

/** The active theme, following the OS light/dark setting. */
export function useTheme(): Theme {
  const scheme = useColorScheme();
  return buildTheme(scheme === 'dark' ? 'dark' : 'light');
}
