import React, { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { useMotion } from '../../motion/MotionProvider';
import { StatusTone } from './order-status.model';
import { buildOrderTimeline, NodeState } from './order-status.model';
import { OrderStatus, OrderType } from '../../types/backend';
import { Theme, useTheme } from '../../theme/theme';

export interface OrderStatusTrackerProps {
  status: OrderStatus;
  type?: OrderType;
}

function toneColor(theme: Theme, tone: StatusTone): string {
  switch (tone) {
    case 'success':
      return theme.colors.success;
    case 'danger':
      return theme.colors.danger;
    case 'warning':
      return theme.colors.warning;
    case 'progress':
      return theme.colors.primary;
    case 'neutral':
    default:
      return theme.colors.textMuted;
  }
}

function Check({ color }: { color: string }): React.JSX.Element {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 6L9 17l-5-5"
        stroke={color}
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** The pulsing halo behind the active node. Rendered only when it should animate. */
function ActivePulse({ color }: { color: string }): React.JSX.Element {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withRepeat(withTiming(1, { duration: 1400 }), -1, false);
    return () => cancelAnimation(t);
  }, [t]);
  const style = useAnimatedStyle(() => ({
    opacity: 0.5 * (1 - t.value),
    transform: [{ scale: 0.9 + t.value * 0.9 }],
  }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          width: 28,
          height: 28,
          borderRadius: 14,
          borderWidth: 2,
          borderColor: color,
        },
        style,
      ]}
    />
  );
}

function NodeIndicator({
  state,
  accent,
  animate,
  theme,
}: {
  state: NodeState;
  accent: string;
  animate: boolean;
  theme: Theme;
}): React.JSX.Element {
  const base = {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  };

  if (state === 'complete') {
    return (
      <View style={[base, { backgroundColor: accent }]}>
        <Check color={theme.colors.onPrimary} />
      </View>
    );
  }
  if (state === 'active') {
    return (
      <View style={{ alignItems: 'center', justifyContent: 'center' }}>
        {animate ? <ActivePulse color={accent} /> : null}
        <View style={[base, { borderWidth: 2, borderColor: accent, backgroundColor: theme.colors.surface }]}>
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: accent }} />
        </View>
      </View>
    );
  }
  if (state === 'cancelled') {
    return (
      <View style={[base, { borderWidth: 2, borderColor: theme.colors.border, opacity: 0.5 }]} />
    );
  }
  // upcoming
  return <View style={[base, { borderWidth: 2, borderColor: theme.colors.border }]} />;
}

/**
 * A reusable order-status tracker driven entirely by the backend `order.status`.
 *
 * It reads the pure `buildOrderTimeline` model and renders a vertical stepper:
 * completed steps are filled with a check, the current step is ringed and (when
 * motion is allowed) gently pulses to draw the eye, upcoming steps are hollow,
 * and a cancelled order is shown as a distinct, dimmed terminal state. A short
 * status chip names the current state in words and colour.
 *
 * Accessibility / no-animation mode: the pulse is the only motion, and it is
 * removed entirely under reduced motion — the stepper is fully legible as a
 * static image, and the whole component carries a single spoken sentence
 * (`accessibilityLabel`) describing the current status. Nothing here depends on
 * animation to convey state; the colours, the check marks and the text carry it.
 */
export function OrderStatusTracker({ status, type }: OrderStatusTrackerProps): React.JSX.Element {
  const theme = useTheme();
  const { reduceMotion } = useMotion();
  const timeline = buildOrderTimeline(status, type);
  const accent = toneColor(theme, timeline.tone);
  const animatePulse = !reduceMotion && timeline.phase === 'in_progress';

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={timeline.accessibilityLabel}
      style={{
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.lg,
        borderWidth: 1,
        borderColor: theme.colors.border,
        padding: 16,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <View
          style={{
            backgroundColor: accent,
            borderRadius: theme.radius.pill,
            paddingVertical: 4,
            paddingHorizontal: 12,
          }}
        >
          <Text style={{ color: theme.colors.onPrimary, fontWeight: '700', fontSize: 12 }}>
            {timeline.currentLabel}
          </Text>
        </View>
      </View>

      {timeline.nodes.map((node, i) => {
        const isLast = i === timeline.nodes.length - 1;
        const connectorFilled = node.state === 'complete';
        const labelColor =
          node.state === 'upcoming' || node.state === 'cancelled'
            ? theme.colors.textMuted
            : theme.colors.text;
        return (
          <View key={node.key} style={{ flexDirection: 'row' }}>
            <View style={{ alignItems: 'center', width: 28 }}>
              <NodeIndicator state={node.state} accent={accent} animate={animatePulse && node.pulse} theme={theme} />
              {!isLast ? (
                <View
                  style={{
                    width: 2,
                    height: 22,
                    marginVertical: 2,
                    backgroundColor: connectorFilled ? accent : theme.colors.border,
                  }}
                />
              ) : null}
            </View>
            <View style={{ marginLeft: 12, paddingTop: 4, flex: 1 }}>
              <Text
                style={{
                  color: labelColor,
                  fontSize: 15,
                  fontWeight: node.state === 'active' ? '700' : '500',
                }}
              >
                {node.label}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}
