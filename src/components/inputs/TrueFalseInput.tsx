import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/colors';
import { radius, spacing, typography } from '../../theme/spacing';

interface Props {
  onAnswer: (value: boolean) => void;
  disabled?: boolean;
}

export function TrueFalseInput({ onAnswer, disabled }: Props) {
  return (
    <View style={styles.row}>
      <Button label="Verdadero" color={colors.success} onPress={() => onAnswer(true)} disabled={disabled} />
      <Button label="Falso" color={colors.danger} onPress={() => onAnswer(false)} disabled={disabled} />
    </View>
  );
}

function Button({ label, color, onPress, disabled }: { label: string; color: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.btn, { backgroundColor: color }, pressed && { opacity: 0.7 }, disabled && { opacity: 0.4 }]}
    >
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.md },
  btn: {
    flex: 1,
    paddingVertical: spacing.xl,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { color: colors.text, fontSize: typography.h2, fontWeight: '800' },
});
