import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenContainer } from '../components/ScreenContainer';
import { QuestionTimer } from '../components/QuestionTimer';
import { QuestionDisplay } from '../components/QuestionDisplay';
import { NumericInput } from '../components/inputs/NumericInput';
import { TrueFalseInput } from '../components/inputs/TrueFalseInput';
import { MultichoiceInput } from '../components/inputs/MultichoiceInput';
import { PrimaryButton } from '../components/PrimaryButton';
import { RootStackParamList } from '../navigation/types';
import { useGame } from '../context/GameContext';
import { colors } from '../theme/colors';
import { spacing, typography } from '../theme/spacing';

type Props = NativeStackScreenProps<RootStackParamList, 'Game'>;

const TICK_MS = 100;

export function GameScreen({ navigation }: Props) {
  const { state, answer, timeout, reset, remainingMs, totalRemainingMs, snapshot } = useGame();
  const question = state.questions[state.currentIndex];
  const [, forceTick] = useState(0);

  // Cuando la ronda termina, navegamos a Results (replace para que el back no te traiga acá).
  useEffect(() => {
    if (state.status === 'finished') {
      navigation.replace('Results');
    }
  }, [state.status, navigation]);

  // Timer: re-render cada TICK_MS y disparar TIMEOUT cuando se acaba el tiempo de la pregunta
  // o el tiempo total en timeattack.
  useEffect(() => {
    if (state.status !== 'playing') return;
    let fired = false;
    const handle = setInterval(() => {
      forceTick((n) => n + 1);
      const perQ = remainingMs();
      const total = totalRemainingMs(); // 0 si no es timeattack
      const totalOver = state.mode === 'timeattack' && total <= 0;
      if (!fired && (perQ <= 0 || totalOver)) {
        fired = true;
        timeout();
      }
    }, TICK_MS);
    return () => clearInterval(handle);
  }, [state.status, state.currentIndex, state.mode, remainingMs, totalRemainingMs, timeout]);

  if (!question || state.status !== 'playing') {
    return (
      <ScreenContainer centered>
        <Text style={styles.line}>Cargando…</Text>
      </ScreenContainer>
    );
  }

  function exit() {
    Alert.alert('Salir de la ronda', '¿Seguro? Se pierde el progreso.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: () => { reset(); navigation.popToTop(); } },
    ]);
  }

  const isTimeAttack = state.mode === 'timeattack';
  const progressLabel = isTimeAttack
    ? `Tiempo total — racha: ${state.answers.length}`
    : `Pregunta ${state.currentIndex + 1} / ${state.iterations}`;
  const liveScore = snapshot().score;

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.headerText}>{progressLabel}</Text>
        <Text style={styles.scoreText}>Puntaje: {liveScore}</Text>
      </View>

      {isTimeAttack && (
        <QuestionTimer
          remainingMs={totalRemainingMs()}
          totalMs={state.totalTimeLimitMs}
          label="Tiempo total"
        />
      )}
      <QuestionTimer
        remainingMs={remainingMs()}
        totalMs={question.timeLimitMs}
        label={isTimeAttack ? 'Pregunta' : undefined}
      />

      <QuestionDisplay
        operation={question.operation}
        shown={question.mode === 'truefalse' ? question.shownResult : undefined}
      />

      {(question.mode === 'classic' || question.mode === 'timeattack') && (
        <NumericInput resetKey={state.currentIndex} onSubmit={(v) => answer(v)} />
      )}
      {question.mode === 'truefalse' && (
        <TrueFalseInput onAnswer={(v) => answer(v)} />
      )}
      {question.mode === 'multichoice' && question.options && (
        <MultichoiceInput options={question.options} onAnswer={(v) => answer(v)} />
      )}

      <View style={{ height: spacing.md }} />
      <PrimaryButton title="Salir" variant="ghost" onPress={exit} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  headerText: { color: colors.textMuted, fontSize: typography.small },
  scoreText: { color: colors.text, fontSize: typography.small, fontWeight: '700' },
  line: { color: colors.text, fontSize: typography.body },
});
