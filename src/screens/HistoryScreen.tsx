// Fase 5: listado completo de partidas guardadas, con filtros por modo y
// boton "Borrar datos guardados" al pie.
//
// Decisiones:
// - Uso FlatList aunque el cap es 100 entries. Es la API correcta y reciclar
//   filas no cuesta nada de configuracion extra.
// - Filtros como chips arriba: "Todos" + un chip por modo. Comparten estado
//   local porque no tiene sentido persistirlo (el usuario suele volver con
//   intencion fresca de filtrar).
// - Tap en una fila NO abre detalle todavia. Si en Fase 6 quisieramos una
//   pantalla de detalle de ronda, va.

import { useMemo, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenContainer } from '../components/ScreenContainer';
import { PrimaryButton } from '../components/PrimaryButton';
import { GameMode, RootStackParamList } from '../navigation/types';
import { useHistory } from '../context/HistoryContext';
import { RoundRecord } from '../types/game';
import { difficultyLabel, formatDateShort, formatSeconds, modeLabel } from '../utils/formatters';
import { colors } from '../theme/colors';
import { radius, spacing, typography } from '../theme/spacing';

type Props = NativeStackScreenProps<RootStackParamList, 'History'>;

type FilterMode = 'all' | GameMode;

const FILTERS: { value: FilterMode; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'classic', label: 'Clasico' },
  { value: 'truefalse', label: 'V/F' },
  { value: 'multichoice', label: 'M. choice' },
  { value: 'timeattack', label: 'C. reloj' },
];

export function HistoryScreen({}: Props) {
  const { history, isLoading, clearAll } = useHistory();
  const [filter, setFilter] = useState<FilterMode>('all');

  const filtered = useMemo(() => {
    if (filter === 'all') return history;
    return history.filter((r) => r.mode === filter);
  }, [history, filter]);

  function onClearPress() {
    if (history.length === 0) {
      Alert.alert('Sin datos', 'No hay nada para borrar todavia.');
      return;
    }
    Alert.alert(
      'Borrar datos guardados',
      'Se eliminaran todas las partidas y los mejores puntajes. Continuar?',
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

  if (isLoading) {
    return (
      <ScreenContainer centered>
        <Text style={styles.title}>Historial</Text>
        <Text style={styles.muted}>Cargando datos guardados...</Text>
      </ScreenContainer>
    );
  }

  if (history.length === 0) {
    return (
      <ScreenContainer centered>
        <Text style={styles.title}>Historial</Text>
        <Text style={styles.muted}>Aun no jugaste ninguna partida.</Text>
        <Text style={styles.muted}>Cuando termines una, va a aparecer aca.</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <Text style={styles.title}>Historial</Text>
      <Text style={styles.subtitle}>
        {history.length} {history.length === 1 ? 'partida guardada' : 'partidas guardadas'}
      </Text>

      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <FilterChip
            key={f.value}
            label={f.label}
            active={filter === f.value}
            onPress={() => setFilter(f.value)}
          />
        ))}
      </View>

      {filtered.length === 0 ? (
        <Text style={styles.muted}>No hay partidas con ese filtro.</Text>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(r) => r.id}
          renderItem={({ item }) => <RoundRow record={item} />}
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
          contentContainerStyle={{ paddingBottom: spacing.lg }}
          showsVerticalScrollIndicator={false}
        />
      )}

      <View style={{ height: spacing.md }} />
      <PrimaryButton
        title="Borrar datos guardados"
        variant="secondary"
        onPress={onClearPress}
      />
    </ScreenContainer>
  );
}

function FilterChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

function RoundRow({ record }: { record: RoundRecord }) {
  const total = record.totalQuestions;
  // accuracy puede ser NaN si total = 0 (no deberia pasar pero defensivo)
  const accuracyPct = total === 0 ? 0 : Math.round((record.correct / total) * 100);

  return (
    <View style={styles.card}>
      <View style={styles.cardLeft}>
        <Text style={styles.score}>{record.score}</Text>
        <Text style={styles.scoreLabel}>pts</Text>
      </View>
      <View style={styles.cardRight}>
        <Text style={styles.cardTitle}>
          {modeLabel(record.mode)} · {difficultyLabel(record.difficulty)}
        </Text>
        <Text style={styles.cardMeta}>
          {record.correct}/{total} correctas ({accuracyPct}%)
        </Text>
        <Text style={styles.cardMeta}>
          {formatSeconds(record.avgResponseMs)} prom · {formatDateShort(record.finishedAt)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.text,
    fontSize: typography.h1,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: typography.body,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  muted: {
    color: colors.textMuted,
    fontSize: typography.body,
    textAlign: 'center',
    marginVertical: spacing.sm,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.md,
  },
  chip: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  chipActive: { backgroundColor: colors.primaryDark, borderColor: colors.primary },
  chipText: { color: colors.textMuted, fontSize: typography.small },
  chipTextActive: { color: colors.text, fontWeight: '700' },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
  },
  cardLeft: {
    minWidth: 64,
    alignItems: 'center',
    paddingRight: spacing.md,
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  cardRight: {
    flex: 1,
    paddingLeft: spacing.md,
  },
  score: {
    color: colors.primary,
    fontSize: typography.h2,
    fontWeight: '800',
  },
  scoreLabel: {
    color: colors.textMuted,
    fontSize: typography.small,
  },
  cardTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '700',
    marginBottom: 2,
  },
  cardMeta: {
    color: colors.textMuted,
    fontSize: typography.small,
  },
});
