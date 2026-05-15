import { StyleSheet, Text } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenContainer } from '../components/ScreenContainer';
import { RootStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { spacing, typography } from '../theme/spacing';

type Props = NativeStackScreenProps<RootStackParamList, 'Stats'>;

export function StatsScreen({}: Props) {
  return (
    <ScreenContainer centered>
      <Text style={styles.title}>Estadísticas</Text>
      <Text style={styles.hint}>Acá se mostrarán métricas agregadas (Fase 5).</Text>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.text, fontSize: typography.h1, fontWeight: '800', marginBottom: spacing.md, textAlign: 'center' },
  hint: { color: colors.textMuted, fontSize: typography.body, textAlign: 'center' },
});
