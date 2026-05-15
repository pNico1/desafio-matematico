import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenContainer } from '../components/ScreenContainer';
import { PrimaryButton } from '../components/PrimaryButton';
import { Difficulty, GameMode, RootStackParamList } from '../navigation/types';
import { useGame } from '../context/GameContext';
import { usePrefs } from '../context/PrefsContext';
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

const ITER_OPTIONS = [5, 10, 15, 20];

export function ConfigScreen({ navigation }: Props) {
  const { start } = useGame();
  const { prefs, isLoading: prefsLoading, updatePrefs } = usePrefs();

  // Estado local: la fuente de verdad de la UI mientras el usuario configura.
  // Si entro a esta pantalla antes de que terminen de cargar las prefs, el
  // useEffect de abajo lo sincroniza una sola vez (ver `seededFromPrefsRef`).
  const [mode, setMode] = useState<GameMode>(prefs.mode);
  const [difficulty, setDifficulty] = useState<Difficulty>(prefs.difficulty);
  const [iterations, setIterations] = useState<number>(prefs.iterations);

  // Sincronizacion inicial desde prefs persistidas. Se ejecuta una sola vez
  // cuando las prefs terminan de cargarse. Despues de eso, la UI es la fuente
  // de verdad y los cambios del usuario no se pisan.
  const seededFromPrefsRef = useRef(false);
  useEffect(() => {
    if (prefsLoading || seededFromPrefsRef.current) return;
    seededFromPrefsRef.current = true;
    setMode(prefs.mode);
    setDifficulty(prefs.difficulty);
    setIterations(prefs.iterations);
  }, [prefsLoading, prefs.mode, prefs.difficulty, prefs.iterations]);

  function onStart() {
    // Persistimos la eleccion antes de arrancar.
    // Lo hago aca (en lugar de en cada onPress de chip) para minimizar escrituras
    // a disco y porque "Comenzar" es el momento en que la eleccion queda confirmada.
    updatePrefs({ mode, difficulty, iterations });
    start(mode, difficulty, iterations);
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

      {/* En contra reloj no aplica: la ronda termina por tiempo o por primer fallo.
          Por eso ocultamos el selector entero en vez de mostrarlo deshabilitado. */}
      {mode !== 'timeattack' ? (
        <>
          <Text style={styles.label}>Cantidad de operaciones</Text>
          <View style={styles.row}>
            {ITER_OPTIONS.map((n) => (
              <Chip
                key={n}
                label={String(n)}
                active={iterations === n}
                onPress={() => setIterations(n)}
              />
            ))}
          </View>
        </>
      ) : (
        <Text style={styles.hint}>
          En Contra Reloj jugas hasta fallar o agotarse el tiempo total - no se elige cantidad.
        </Text>
      )}

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
});
