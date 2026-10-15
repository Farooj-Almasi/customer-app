import React, { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { useMotion } from '../../motion/MotionProvider';
import { PaymentStatus } from '../../types/backend';
import { PaymentVisual, paymentVisualForServerStatus } from './payment-state.model';
import { Theme, useTheme } from '../../theme/theme';

export interface PaymentStateViewProps {
  /**
   * The payment status **as reported by the backend**. Never pass a value a
   * client SDK or gateway redirect produced — only a verified webhook advances
   * this to PAID, and this component shows success on nothing else.
   */
  status: PaymentStatus;
}

const ICON_SIZE = 72;

function iconColor(theme: Theme, visual: PaymentVisual): string {
  switch (visual) {
    case 'success':
      return theme.colors.success;
    case 'failed':
      return theme.colors.danger;
    case 'cancelled':
      return theme.colors.textMuted;
    case 'refunded':
      return theme.colors.warning;
    case 'processing':
    default:
      return theme.colors.primary;
  }
}

/** A calm, indeterminate "working" ring. Deliberately not a spinner implying progress. */
function ProcessingRing({ color, animate }: { color: string; animate: boolean }): React.JSX.Element {
  const t = useSharedValue(0);
  useEffect(() => {
    if (!animate) {
      t.value = 0;
      return;
    }
    t.value = withRepeat(withTiming(1, { duration: 1200 }), -1, true);
    return () => cancelAnimation(t);
  }, [animate, t]);
  const ring = useAnimatedStyle(() => ({
    opacity: 0.4 + t.value * 0.5,
    transform: [{ scale: 0.92 + t.value * 0.08 }],
  }));
  return (
    <View style={{ width: ICON_SIZE, height: ICON_SIZE, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        style={[
          { width: ICON_SIZE, height: ICON_SIZE, borderRadius: ICON_SIZE / 2, borderWidth: 4, borderColor: color },
          ring,
        ]}
      />
    </View>
  );
}

/** An outcome glyph that reveals once, with a spring, when it appears. */
function RevealIcon({ visual, color, theme }: { visual: PaymentVisual; color: string; theme: Theme }): React.JSX.Element {
  const { spring, reduceMotion } = useMotion();
  const enter = useSharedValue(reduceMotion ? 1 : 0);
  useEffect(() => {
    enter.value = reduceMotion ? 1 : withSpring(1, spring('emphasized'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const style = useAnimatedStyle(() => ({ opacity: enter.value, transform: [{ scale: enter.value }] }));

  return (
    <Animated.View
      style={[
        {
          width: ICON_SIZE,
          height: ICON_SIZE,
          borderRadius: ICON_SIZE / 2,
          backgroundColor: color,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      <Glyph visual={visual} color={theme.colors.onPrimary} />
    </Animated.View>
  );
}

function Glyph({ visual, color }: { visual: PaymentVisual; color: string }): React.JSX.Element {
  const stroke = { stroke: color, strokeWidth: 3, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  if (visual === 'success') {
    return (
      <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
        <Path d="M20 6L9 17l-5-5" {...stroke} />
      </Svg>
    );
  }
  if (visual === 'failed') {
    return (
      <Svg width={30} height={30} viewBox="0 0 24 24" fill="none">
        <Path d="M6 6l12 12M18 6L6 18" {...stroke} />
      </Svg>
    );
  }
  if (visual === 'cancelled') {
    return (
      <Svg width={30} height={30} viewBox="0 0 24 24" fill="none">
        <Path d="M6 12h12" {...stroke} />
      </Svg>
    );
  }
  // refunded: a return arrow
  return (
    <Svg width={30} height={30} viewBox="0 0 24 24" fill="none">
      <Path d="M10 8L6 12l4 4M6 12h8a4 4 0 010 8" {...stroke} />
    </Svg>
  );
}

/**
 * Communicates a payment's state: processing, success, failed, cancelled or
 * refunded, each visually distinct.
 *
 * The critical rule is enforced by construction: the view is derived from a
 * **server-reported** status via `paymentVisualForServerStatus`, and success is
 * possible only when that status is PAID. The animation is a consequence of the
 * confirmed state, never a stand-in for it — while the backend still says
 * pending, this shows a calm "confirming" ring and keeps waiting.
 *
 * Under reduced motion the processing ring stops animating (the text still says
 * "confirming") and the outcome glyphs appear instantly. The whole view is
 * legible and announced without any motion.
 */
export function PaymentStateView({ status }: PaymentStateViewProps): React.JSX.Element {
  const theme = useTheme();
  const { reduceMotion } = useMotion();
  const view = paymentVisualForServerStatus(status);
  const color = iconColor(theme, view.visual);

  return (
    <View
      accessible
      accessibilityLiveRegion="polite"
      accessibilityLabel={`${view.title}. ${view.body}`}
      style={{ alignItems: 'center', padding: 24 }}
    >
      {view.visual === 'processing' ? (
        <ProcessingRing color={color} animate={!reduceMotion} />
      ) : (
        // Key by visual so a change of outcome re-triggers the reveal.
        <RevealIcon key={view.visual + (view.refundDetail ?? '')} visual={view.visual} color={color} theme={theme} />
      )}

      <Text
        style={{
          color: theme.colors.text,
          fontSize: 18,
          fontWeight: '700',
          marginTop: 20,
          textAlign: 'center',
        }}
      >
        {view.title}
      </Text>
      <Text
        style={{
          color: theme.colors.textMuted,
          fontSize: 14,
          lineHeight: 20,
          marginTop: 6,
          textAlign: 'center',
          maxWidth: 300,
        }}
      >
        {view.body}
      </Text>
    </View>
  );
}
