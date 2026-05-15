import { StyleSheet, Text, View } from 'react-native';
import { Operation } from '../types/game';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';

interface Props {
  operation: Operation;
  /** Si se pasa shown, en lugar de "= ?" muestra "= shown" (para modo V/F). */
  shown?: number;
}

export function QuestionDisplay({ operation, shown }: Props) {
  const { a, b, operator } = operation;
  return (
    <View style={styles.card}>
      <Text style={styles.text}>
        {a} {operator === '*' ? '×' : operator === '/' ? '÷' : operator} {b} = {shown !== undefined ? shown : '?'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  text: {
    color: colors.text,
    fontSize: 48,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
