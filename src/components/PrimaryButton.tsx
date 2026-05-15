import { Pressable, StyleSheet, Text } from 'react-native';
import { colors } from '../theme/colors';
import { radius, spacing, typography } from '../theme/spacing';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface Props {
  title: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
}

export function PrimaryButton({ title, onPress, variant = 'primary', disabled }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        variantStyles[variant],
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <Text style={[styles.text, variant === 'ghost' && { color: colors.primary }]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.xs,
  },
  pressed: { opacity: 0.75 },
  disabled: { opacity: 0.4 },
  text: { color: colors.text, fontSize: typography.body, fontWeight: '700' },
});

const variantStyles = StyleSheet.create({
  primary: { backgroundColor: colors.primaryDark },
  secondary: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  danger: { backgroundColor: colors.danger },
  ghost: { backgroundColor: 'transparent' },
});
