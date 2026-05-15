import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { radius, spacing, typography } from '../theme/spacing';

interface Props {
  remainingMs: number;
  totalMs: number;
  label?: string;
}

/** Barra de tiempo restante. Cambia de color a medida que se acerca al final. */
export function QuestionTimer({ remainingMs, totalMs, label }: Props) {
  const ratio = totalMs > 0 ? Math.max(0, Math.min(1, remainingMs / totalMs)) : 0;
  const barColor = ratio > 0.5 ? colors.success : ratio > 0.25 ? colors.warning : colors.danger;
  const seconds = (remainingMs / 1000).toFixed(1);

  return (
    <View style={styles.wrapper}>
      <View style={styles.headerRow}>
        {label && <Text style={styles.label}>{label}</Text>}
        <Text style={styles.time}>{seconds}s</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${ratio * 100}%`, backgroundColor: barColor }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: spacing.md },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs },
  label: { color: colors.textMuted, fontSize: typography.small },
  time: { color: colors.text, fontSize: typography.small, fontWeight: '700' },
  track: { height: 8, backgroundColor: colors.surface, borderRadius: radius.sm, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.sm },
});
