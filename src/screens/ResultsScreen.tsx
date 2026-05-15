import { StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenContainer } from '../components/ScreenContainer';
import { PrimaryButton } from '../components/PrimaryButton';
import { RootStackParamList } from '../navigation/types';
import { useGame } from '../context/GameContext';
import { useHistory } from '../context/HistoryContext';
import { bestKey } from '../types/game';
import { colors } from '../theme/colors';
import { radius, spacing, typography } from '../theme/spacing';

type Props = NativeStackScreenProps<RootStackParamList, 'Results'>;

const MODE_LABELS: Record<string, string> = {
  classic: 'Clásico',
  truefalse: 'Verdadero / Falso',
  multichoice: 'Múltiple choice',
  timeattack: 'Contra reloj',
};
const DIFF_LABELS: Record<string, string> = {
  easy: 'Fácil',
  medium: 'Medio',
  hard: 'Difícil',
};

export function ResultsScreen({ navigation }: Props) {
  const { state, snapshot, reset } = useGame();
  const { lastSaved, bestScores } = useHistory();
  const s = snapshot();

  // Fallback: si por alguna razón `lastSaved` no llegó todavía (la persistencia
  // es async y este componente puede renderizar antes), recurrimos al bestScores
  // ya cargado para mostrar al menos el récord vigente.
  // Esto evita mostrar un placeholder vacío en lo que persiste.
  const bestForCombo = bestScores[bestKey(state.mode, state.difficulty)];
  const isNewRecord = lastSaved?.isNewRecord ?? false;
  const previousBest = lastSaved?.previousBest ?? bestForCombo;

  return (
    <ScreenContainer centered>
      <Text style={styles.title}>Ronda finalizada</Text>
      <Text style={styles.subtitle}>
        {MODE_LABELS[state.mode]} · {DIFF_LABELS[state.difficulty]}
      </Text>

      {isNewRecord && (
        <View style={styles.recordBadge}>
          <Text style={styles.recordBadgeText}>¡Nuevo récord!</Text>
          {previousBest && (
            <Text style={styles.recordBadgeSub}>
              Superaste tu mejor previo de {previousBest.score}
            </Text>
          )}
        </View>
      )}

      <View style={styles.card}>
        <Stat label="Puntaje" value={s.score} highlight />
        <Stat label="Correctas" value={s.correct} />
        <Stat label="Incorrectas" value={s.incorrect} />
        <Stat label="Sin respuesta" value={s.skipped} />
        <Stat label="Tiempo promedio" value={`${(s.avgResponseMs / 1000).toFixed(2)}s`} />
        {!isNewRecord && previousBest && (
          <Stat label="Mejor en este modo" value={previousBest.score} />
        )}
      </View>

      <PrimaryButton title="Jugar de nuevo" onPress={() => { reset(); navigation.replace('Config'); }} />
      <PrimaryButton
        title="Volver al inicio"
        variant="secondary"
        onPress={() => { reset(); navigation.popToTop(); }}
      />
    </ScreenContainer>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, highlight && styles.statHighlight]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.text, fontSize: typography.h1, fontWeight: '800',
    textAlign: 'center', marginBottom: spacing.xs,
  },
  subtitle: {
    color: colors.textMuted, fontSize: typography.body,
    textAlign: 'center', marginBottom: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  statLabel: { color: colors.textMuted, fontSize: typography.body },
  statValue: { color: colors.text, fontSize: typography.body, fontWeight: '700' },
  statHighlight: { color: colors.primary, fontSize: typography.h2 },
  recordBadge: {
    alignSelf: 'center',
    backgroundColor: colors.primaryDark,
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  recordBadgeText: {
    color: colors.primary,
    fontSize: typography.h2,
    fontWeight: '800',
    textAlign: 'center',
  },
  recordBadgeSub: {
    color: colors.text,
    fontSize: typography.small,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
});
