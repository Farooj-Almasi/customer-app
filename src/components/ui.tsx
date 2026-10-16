import React from 'react';
import {
  ActivityIndicator,
  KeyboardTypeOptions,
  StyleProp,
  Text,
  TextInput,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PressableScale } from '../motion';
import { useTheme, Theme } from '../theme/theme';

/** A labelled text input. A blank label hides the label row entirely. */
export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  maxLength,
  autoFocus,
  autoCapitalize,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  maxLength?: number;
  autoFocus?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}): React.JSX.Element {
  const theme = useTheme();
  return (
    <View style={{ marginBottom: theme.space.lg }}>
      {label ? (
        <Text style={{ color: theme.colors.textMuted, marginBottom: 6, ...theme.type.label }}>{label}</Text>
      ) : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textMuted}
        keyboardType={keyboardType}
        maxLength={maxLength}
        autoFocus={autoFocus}
        autoCapitalize={autoCapitalize}
        style={{
          backgroundColor: theme.colors.surface,
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.md,
          paddingHorizontal: 14,
          paddingVertical: 14,
          fontSize: 16,
          color: theme.colors.text,
          minHeight: theme.touchTarget,
        }}
      />
    </View>
  );
}

/** A touchable icon/glyph with a guaranteed minimum target size. */
export function IconButton({
  glyph,
  onPress,
  accessibilityLabel,
  color,
}: {
  glyph: string;
  onPress: () => void;
  accessibilityLabel: string;
  color?: string;
}): React.JSX.Element {
  const theme = useTheme();
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={{
        minWidth: theme.touchTarget,
        minHeight: theme.touchTarget,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ color: color ?? theme.colors.text, fontSize: 26 }}>{glyph}</Text>
    </PressableScale>
  );
}

/** A screen container: themed background + top safe-area padding + optional title. */
export function Screen({
  children,
  title,
  onBack,
  right,
}: {
  children: React.ReactNode;
  title?: string;
  onBack?: () => void;
  right?: React.ReactNode;
}): React.JSX.Element {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background, paddingTop: insets.top }}>
      {title !== undefined ? (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: theme.space.md,
            paddingVertical: theme.space.sm,
            gap: theme.space.sm,
          }}
        >
          {onBack ? <IconButton glyph="‹" accessibilityLabel="Back" onPress={onBack} /> : null}
          <Text style={{ color: theme.colors.text, flex: 1, ...theme.type.title }} numberOfLines={1}>
            {title}
          </Text>
          {right}
        </View>
      ) : null}
      {children}
    </View>
  );
}

/** The primary call-to-action. Brand-filled, with a busy state that disables it. */
export function PrimaryButton({
  label,
  onPress,
  busy,
  disabled,
  style,
}: {
  label: string;
  onPress: () => void;
  busy?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}): React.JSX.Element {
  const theme = useTheme();
  const off = disabled || busy;
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityState={{ disabled: !!off, busy: !!busy }}
      disabled={off}
      onPress={onPress}
      style={[
        {
          backgroundColor: theme.colors.primary,
          borderRadius: theme.radius.pill,
          paddingVertical: 16,
          minHeight: theme.touchTarget,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: off ? 0.6 : 1,
        },
        style,
      ]}
    >
      {busy ? (
        <ActivityIndicator color={theme.colors.onPrimary} />
      ) : (
        <Text style={{ color: theme.colors.onPrimary, fontWeight: '800', fontSize: 16 }}>{label}</Text>
      )}
    </PressableScale>
  );
}

/** A quieter, outline-style action for secondary choices. */
export function SecondaryButton({
  label,
  onPress,
  style,
}: {
  label: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}): React.JSX.Element {
  const theme = useTheme();
  return (
    <PressableScale
      accessibilityRole="button"
      onPress={onPress}
      style={[
        {
          borderRadius: theme.radius.pill,
          borderWidth: 1.5,
          borderColor: theme.colors.border,
          paddingVertical: 14,
          minHeight: theme.touchTarget,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      <Text style={{ color: theme.colors.text, fontWeight: '700', fontSize: 16 }}>{label}</Text>
    </PressableScale>
  );
}

/** A surface card, with an optional soft elevation. */
export function Card({
  children,
  style,
  elevated,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  elevated?: boolean;
}): React.JSX.Element {
  const theme = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radius.lg,
          borderWidth: 1,
          borderColor: theme.colors.border,
          padding: theme.space.lg,
        },
        elevated ? theme.shadow.sm : null,
        style,
      ]}
    >
      {children}
    </View>
  );
}

/** A section heading with an optional trailing action (e.g. "See all"). */
export function SectionHeader({
  title,
  actionLabel,
  onAction,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}): React.JSX.Element {
  const theme = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: theme.space.sm,
      }}
    >
      <Text style={{ color: theme.colors.text, ...theme.type.heading }}>{title}</Text>
      {actionLabel && onAction ? (
        <PressableScale accessibilityRole="button" accessibilityLabel={actionLabel} onPress={onAction} style={{ minHeight: theme.touchTarget, justifyContent: 'center' }}>
          <Text style={{ color: theme.colors.accent, ...theme.type.label }}>{actionLabel}</Text>
        </PressableScale>
      ) : null}
    </View>
  );
}

/** A selectable pill (category filter, option). */
export function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected?: boolean;
  onPress: () => void;
}): React.JSX.Element {
  const theme = useTheme();
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      onPress={onPress}
      style={{
        paddingHorizontal: 16,
        paddingVertical: 9,
        borderRadius: theme.radius.pill,
        backgroundColor: selected ? theme.colors.primary : theme.colors.surfaceAlt,
        borderWidth: 1,
        borderColor: selected ? theme.colors.primary : theme.colors.border,
      }}
    >
      <Text style={{ color: selected ? theme.colors.onPrimary : theme.colors.text, fontWeight: '700', fontSize: 14 }}>
        {label}
      </Text>
    </PressableScale>
  );
}

export type Tone = 'neutral' | 'success' | 'danger' | 'warning' | 'progress';

function toneColor(theme: Theme, tone: Tone): string {
  switch (tone) {
    case 'success':
      return theme.colors.success;
    case 'danger':
      return theme.colors.danger;
    case 'warning':
      return theme.colors.warning;
    case 'progress':
      return theme.colors.primary;
    default:
      return theme.colors.textMuted;
  }
}

/** A tonal status pill: a coloured word on its own soft ground, not a saturated block. */
export function StatusPill({ label, tone = 'neutral' }: { label: string; tone?: Tone }): React.JSX.Element {
  const theme = useTheme();
  const color = toneColor(theme, tone);
  return (
    <View
      style={{
        alignSelf: 'flex-start',
        borderRadius: theme.radius.pill,
        paddingVertical: 4,
        paddingHorizontal: 10,
        backgroundColor: theme.colors.surfaceAlt,
      }}
    >
      <Text style={{ color, fontWeight: '700', fontSize: 12 }}>{label}</Text>
    </View>
  );
}

/** A hairline divider. */
export function Divider({ style }: { style?: StyleProp<ViewStyle> }): React.JSX.Element {
  const theme = useTheme();
  return <View style={[{ height: 1, backgroundColor: theme.colors.border }, style]} />;
}

/** A label/value row — the staple of order summaries. */
export function InfoRow({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}): React.JSX.Element {
  const theme = useTheme();
  const labelStyle: TextStyle = strong
    ? { color: theme.colors.text, ...theme.type.bodyStrong }
    : { color: theme.colors.textMuted, ...theme.type.body };
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: theme.space.sm }}>
      <Text style={labelStyle}>{label}</Text>
      <Text style={{ color: theme.colors.text, fontWeight: strong ? '800' : '600', fontSize: 15 }}>{value}</Text>
    </View>
  );
}

/** A brand-coloured price, optionally with a struck-through original. */
export function Price({
  text,
  strikethrough,
  size = 15,
}: {
  text: string;
  strikethrough?: string;
  size?: number;
}): React.JSX.Element {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
      {strikethrough ? (
        <Text style={{ color: theme.colors.textMuted, textDecorationLine: 'line-through', fontSize: size - 2 }}>
          {strikethrough}
        </Text>
      ) : null}
      <Text style={{ color: theme.colors.primary, fontWeight: '800', fontSize: size }}>{text}</Text>
    </View>
  );
}
