import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import Slider from '@react-native-community/slider';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenContainer } from '../components/ScreenContainer';
import { PrimaryButton } from '../components/PrimaryButton';
import { Difficulty, GameMode, RootStackParamList } from '../navigation/types';
import { useGame } from '../context/GameContext';
import { usePrefs } from '../context/PrefsContext';
import {
  DIFFICULTY_PARAMS,
  ITERATIONS_MAX,
  ITERATIONS_MIN,
  resolveTimeLimitMs,
  TIME_LIMIT_MAX_MS,
  TIME_LIMIT_MIN_MS,
  TIME_LIMIT_STEP_MS,
} from '../types/game';
import { colors } from '../theme/colors';
import { radius, spacing, typography } from '../theme/spacing';

type Props = NativeStackScreenProps<RootStackParamList, 'Config'>;

const MODES: { value: GameMode; label: string }[] = [
  { value: 'classic', label: 'Clasico' },
  { value: 'truefalse', label: 'Verdadero / Falso' },
  { value: 'multichoice', label: 'Multiple choice' },
  { value: 'timeattack', label: 'Contra reloj' },
];

const DIFFS: { value: Difficulty; label: string }[] = [
  { value: 'easy', label: 'Facil' },
  { value: 'medium', label: 'Medio' },
  { value: 'hard', label: 'Dificil' },
];

export function ConfigScreen({ navigation }: Props) {
  const { start } = useGame();
  const { prefs, isLoading: prefsLoading, updatePrefs } = usePrefs();

  const [mode, setMode] = useState<GameMode>(prefs.mode);
  const [difficulty, setDifficulty] = useState<Difficulty>(prefs.difficulty);
  const [iterations, setIterations] = useState<number>(prefs.iterations);
  // 0 = "usar default de la dificultad". El slider muestra el default actual
  // pero guardamos 0 hasta que el usuario lo toque.
  const [timeLimitMs, setTimeLimitMs] = useState<number>(prefs.timeLimitMs);
  const [adaptiveDifficulty, setAdaptiveDifficulty] = useState<boolean>(prefs.adaptiveDifficulty);

  // Sync inicial desde prefs persistidas: una sola vez al terminar de cargar.
  const seededFromPrefsRef = useRef(false);
  useEffect(() => {
    if (prefsLoading || seededFromPrefsRef.current) return;
    seededFromPrefsRef.current = true;
    setMode(prefs.mode);
    setDifficulty(prefs.difficulty);
    setIterations(prefs.iterations);
    setTimeLimitMs(prefs.timeLimitMs);
    setAdaptiveDifficulty(prefs.adaptiveDifficulty);
  }, [prefsLoading, prefs.mode, prefs.difficulty, prefs.iterations, prefs.timeLimitMs, prefs.adaptiveDifficulty]);

  // Si el usuario no toco el slider de tiempo, mostramos el default de la
  // dificultad. Si ya eligio uno, respetamos su eleccion incluso al cambiar
  // dificultad para no pisar una preferencia explicita.
  const effectiveTimeMs = timeLimitMs > 0
    ? timeLimitMs
    : DIFFICULTY_PARAMS[difficulty].timeLimitMs;
  const defaultTimeForDiff = DIFFICULTY_PARAMS[difficulty].timeLimitMs;

  function onStart() {
    updatePrefs({ mode, difficulty, iterations, timeLimitMs, adaptiveDifficulty });
    const resolved = resolveTimeLimitMs({ mode, difficulty, iterations, timeLimitMs, adaptiveDifficulty });
    start({ mode, difficulty, iterations, timeLimitMs: resolved, adaptiveDifficulty });
    navigation.navigate('Game');
  }

  return (
    <ScreenContainer scroll>
      <Text style={styles.label}>Modo de juego</Text>
      <View style={styles.row}>
        {MODES.map((m) => (
          <Chip key={m.value} label={m.label} active={mode === m.value} onPress={() => setMode(m.value)} />
        ))}
      </View>

      <Text style={styles.label}>Dificultad</Text>
      <View style={styles.row}>
        {DIFFS.map((d) => (
          <Chip key={d.value} label={d.label} active={difficulty === d.value} onPress={() => setDifficulty(d.value)} />
        ))}
      </View>

      {/* En contra reloj la cantidad no aplica (termina por tiempo o primer fallo). */}
      {mode !== 'timeattack' ? (
        <View>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Cantidad de operaciones</Text>
            <Text style={styles.valueTag}>{iterations}</Text>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={ITERATIONS_MIN}
            maximumValue={ITERATIONS_MAX}
            step={1}
            value={iterations}
            onValueChange={(v) => setIterations(Math.round(v))}
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor={colors.border}
            thumbTintColor={colors.primary}
          />
        </View>
      ) : (
        <Text style={styles.hint}>
          En Contra Reloj jugas hasta fallar o agotarse el tiempo total - no se elige cantidad.
        </Text>
      )}

      <View style={styles.labelRow}>
        <Text style={styles.label}>Tiempo por pregunta</Text>
        <Text style={styles.valueTag}>{(effectiveTimeMs / 1000).toFixed(1)}s</Text>
      </View>
      <Slider
        style={styles.slider}
        minimumValue={TIME_LIMIT_MIN_MS}
        maximumValue={TIME_LIMIT_MAX_MS}
        step={TIME_LIMIT_STEP_MS}
        value={effectiveTimeMs}
        onValueChange={(v) => setTimeLimitMs(Math.round(v))}
        minimumTrackTintColor={colors.primary}
        maximumTrackTintColor={colors.border}
        thumbTintColor={colors.primary}
      />
      {timeLimitMs > 0 && timeLimitMs !== defaultTimeForDiff && (
        <Text style={styles.hint}>
          Default para {difficulty}: {(defaultTimeForDiff / 1000).toFixed(0)}s
        </Text>
      )}

      <View style={styles.toggleRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Dificultad adaptativa</Text>
          <Text style={styles.hint}>
            Cada correcta acorta el tiempo {Math.round(DIFFICULTY_PARAMS[difficulty].adaptiveReductionPct * 100)}% (piso 1s).
          </Text>
        </View>
        <Switch
          value={adaptiveDifficulty}
          onValueChange={setAdaptiveDifficulty}
          trackColor={{ false: colors.border, true: colors.primaryDark }}
          thumbColor={adaptiveDifficulty ? colors.primary : '#fff'}
        />
      </View>

      <View style={{ height: spacing.lg }} />
      <PrimaryButton title="Comenzar" onPress={onStart} />
    </ScreenContainer>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Text onPress={onPress} style={[chipStyles.chip, active && chipStyles.active]}>
      {label}
    </Text>
  );
}

const chipStyles = StyleSheet.create({
  chip: {
    color: colors.text,
    backgroundColor: colors.surface,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  active: { backgroundColor: colors.primaryDark, borderColor: colors.primary },
});

const styles = StyleSheet.create({
  label: {
    color: colors.text,
    fontSize: typography.h2,
    fontWeight: '700',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  row: { flexDirection: 'row', flexWrap: 'wrap' },
  hint: { color: colors.textMuted, fontSize: typography.small, marginTop: spacing.sm },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  valueTag: {
    color: colors.primary,
    fontSize: typography.h2,
    fontWeight: '800',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
