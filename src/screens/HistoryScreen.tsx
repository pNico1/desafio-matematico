// Fase 4: placeholder con conteos + botón "Borrar datos" para poder verificar
// que la persistencia funciona (cerrar app → reabrir → ver que sigue habiendo data).
// Fase 5 va a reemplazar esto por una lista real con filtros y detalles.

import { Alert, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenContainer } from '../components/ScreenContainer';
import { PrimaryButton } from '../components/PrimaryButton';
import { RootStackParamList } from '../navigation/types';
import { useHistory } from '../context/HistoryContext';
import { colors } from '../theme/colors';
import { radius, spacing, typography } from '../theme/spacing';

type Props = NativeStackScreenProps<RootStackParamList, 'History'>;

export function HistoryScreen({}: Props) {
  const { history, bestScores, isLoading, clearAll } = useHistory();
  const bestsCount = Object.keys(bestScores).length;

  function onClearPress() {
    if (history.length === 0 && bestsCount === 0) {
      Alert.alert('Sin datos', 'No hay nada para borrar todavía.');
      return;
    }
    Alert.alert(
      'Borrar datos guardados',
      'Se eliminarán todas las partidas y los mejores puntajes. ¿Continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Borrar',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearAll();
            } catch (err) {
              Alert.alert('Error', 'No se pudo borrar. Probá de nuevo.');
              console.warn(err);
            }
          },
        },
      ],
    );
  }

  return (
    <ScreenContainer centered>
      <Text style={styles.title}>Historial</Text>
      {isLoading ? (
        <Text style={styles.hint}>Cargando datos guardados…</Text>
      ) : (
        <>
          <View style={styles.card}>
            <Row label="Partidas guardadas" value={history.length} />
            <Row label="Récords por modo+dificultad" value={bestsCount} />
          </View>
          <Text style={styles.hint}>
            Vista mínima de Fase 4 — la lista completa con filtros llega en Fase 5.
          </Text>
          <View style={{ height: spacing.lg }} />
          <PrimaryButton
            title="Borrar datos guardados"
            variant="secondary"
            onPress={onClearPress}
          />
        </>
      )}
    </ScreenContainer>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.text,
    fontSize: typography.h1,
    fontWeight: '800',
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  hint: { color: colors.textMuted, fontSize: typography.body, textAlign: 'center' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    alignSelf: 'stretch',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  rowLabel: { color: colors.textMuted, fontSize: typography.body },
  rowValue: { color: colors.text, fontSize: typography.body, fontWeight: '700' },
});
