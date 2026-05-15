import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/colors';
import { radius, spacing, typography } from '../../theme/spacing';

interface Props {
  options: number[];
  onAnswer: (value: number) => void;
  disabled?: boolean;
}

export function MultichoiceInput({ options, onAnswer, disabled }: Props) {
  return (
    <View style={styles.grid}>
      {options.map((n, i) => (
        <Pressable
          key={`${n}-${i}`}
          onPress={() => onAnswer(n)}
          disabled={disabled}
          style={({ pressed }) => [styles.btn, pressed && styles.pressed, disabled && { opacity: 0.4 }]}
        >
          <Text style={styles.label}>{n}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  btn: {
    width: '48%',
    paddingVertical: spacing.lg,
    backgroundColor: colors.primaryDark,
    borderRadius: radius.md,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  pressed: { opacity: 0.7 },
  label: { color: colors.text, fontSize: typography.h1, fontWeight: '800' },
});
