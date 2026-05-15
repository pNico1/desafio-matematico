// Fase 5: estadisticas agregadas + grilla de mejores puntajes por
// combinacion modo x dificultad.
//
// Decisiones:
// - Tres secciones: resumen global, grilla de records, distribucion por modo.
// - La grilla es 4 filas (modos) x 3 columnas (dificultades). Cuando una
//   combinacion no fue jugada, muestra "-".
// - Calculo TODO en useMemo sobre history+bestScores (no se cachea en disco).
//   Re-render cuesta nano-segundos para 100 entries; no vale optimizar.

import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenContainer } from '../components/ScreenContainer';
import { RootStackParamList } from '../navigation/types';
import { useHistory } from '../context/HistoryContext';
import {
  aggregateStats,
  bestScoresGrid,
  DIFFS_ORDER,
  modeBreakdown,
  MODES_ORDER,
} from '../utils/stats';
import {
  difficultyLabel,
  formatPercent,
  formatSeconds,
  modeLabel,
} from '../utils/formatters';
import { colors } from '../theme/colors';
import { radius, spacing, typography } from '../theme/spacing';

type Props = NativeStackScreenProps<RootStackParamList, 'Stats'>;

export function StatsScreen({}: Props) {
  const { history, bestScores, isLoading } = useHistory();

  const stats = useMemo(() => aggregateStats(history), [history]);
  const grid = useMemo(() => bestScoresGrid(bestScores), [bestScores]);
  const breakdown = useMemo(() => modeBreakdown(history), [history]);

  if (isLoading) {
    return (
      <ScreenContainer centered>
        <Text style={styles.title}>Estadisticas</Text>
        <Text style={styles.muted}>Cargando datos...</Text>
      </ScreenContainer>
    );
  }

  if (history.length === 0) {
    return (
      <ScreenContainer centered>
        <Text style={styles.title}>Estadisticas</Text>
        <Text style={styles.muted}>Todavia no hay datos para mostrar.</Text>
        <Text style={styles.muted}>Jugá una partida y volvé.</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.xl }}>
        <Text style={styles.title}>Estadisticas</Text>

        {/* Resumen global */}
        <SectionTitle>Resumen</SectionTitle>
        <View style={styles.card}>
          <Row label="Partidas jugadas" value={stats.totalRounds} />
          <Row label="Preguntas respondidas" value={stats.totalQuestions} />
          <Row label="Puntaje promedio" value={Math.round(stats.avgScorePerRound)} />
          <Row label="Precision" value={formatPercent(stats.accuracy)} />
          <Row label="Tiempo promedio" value={formatSeconds(stats.avgResponseMs)} />
        </View>

        {/* Grilla de records */}
        <SectionTitle>Mejores puntajes</SectionTitle>
        <View style={styles.gridCard}>
          {/* Header de columnas */}
          <View style={styles.gridRow}>
            <Text style={[styles.gridHeader, styles.gridLabelCol]}>Modo</Text>
            {DIFFS_ORDER.map((d) => (
              <Text key={d} style={[styles.gridHeader, styles.gridCell]}>
                {difficultyLabel(d)}
              </Text>
            ))}
          </View>
          {grid.map((row, i) => (
            <View key={MODES_ORDER[i]} style={[styles.gridRow, i === grid.length - 1 && styles.gridRowLast]}>
              <Text style={[styles.gridRowLabel, styles.gridLabelCol]}>
                {modeLabel(MODES_ORDER[i])}
              </Text>
              {row.map((cell) => (
                <Text
                  key={`${cell.mode}-${cell.difficulty}`}
                  style={[
                    styles.gridCell,
                    cell.record ? styles.gridCellValue : styles.gridCellEmpty,
                  ]}
                >
                  {cell.record ? cell.record.score : '-'}
                </Text>
              ))}
            </View>
          ))}
        </View>

        {/* Distribucion por modo */}
        <SectionTitle>Distribucion por modo</SectionTitle>
        <View style={styles.card}>
          {breakdown.map((b) => (
            <View key={b.mode} style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>{modeLabel(b.mode)}</Text>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: `${Math.round(b.share * 100)}%` }]} />
              </View>
              <Text style={styles.breakdownValue}>
                {b.count} · {formatPercent(b.share)}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <Text style={styles.section}>{children}</Text>;
}

function Row({ label, value }: { label: string; value: string | number }) {
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
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  muted: {
    color: colors.textMuted,
    fontSize: typography.body,
    textAlign: 'center',
    marginVertical: spacing.xs,
  },
  section: {
    color: colors.textMuted,
    fontSize: typography.small,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  rowLabel: { color: colors.textMuted, fontSize: typography.body },
  rowValue: { color: colors.text, fontSize: typography.body, fontWeight: '700' },

  // grilla
  gridCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.sm,
  },
  gridRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  gridRowLast: { borderBottomWidth: 0 },
  gridHeader: {
    color: colors.textMuted,
    fontSize: typography.small,
    fontWeight: '700',
    textAlign: 'center',
  },
  gridLabelCol: { flex: 1.2, textAlign: 'left' },
  gridRowLabel: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '700',
  },
  gridCell: {
    flex: 1,
    textAlign: 'center',
    fontSize: typography.body,
  },
  gridCellValue: { color: colors.primary, fontWeight: '800' },
  gridCellEmpty: { color: colors.textMuted },

  // breakdown bars
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  breakdownLabel: {
    color: colors.text,
    fontSize: typography.small,
    width: 80,
  },
  barTrack: {
    flex: 1,
    height: 8,
    backgroundColor: colors.background,
    borderRadius: 4,
    marginHorizontal: spacing.sm,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  breakdownValue: {
    color: colors.textMuted,
    fontSize: typography.small,
    minWidth: 70,
    textAlign: 'right',
  },
});
