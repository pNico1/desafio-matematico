import { StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenContainer } from '../components/ScreenContainer';
import { PrimaryButton } from '../components/PrimaryButton';
import { RootStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { spacing, typography } from '../theme/spacing';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export function HomeScreen({ navigation }: Props) {
  return (
    <ScreenContainer centered>
      <View style={styles.header}>
        <Text style={styles.title}>Desafío Matemático</Text>
        <Text style={styles.subtitle}>Resolvé operaciones contra reloj y mejorá tu puntaje.</Text>
      </View>
      <PrimaryButton title="Jugar" onPress={() => navigation.navigate('Config')} />
      <PrimaryButton
        title="Historial"
        variant="secondary"
        onPress={() => navigation.navigate('History')}
      />
      <PrimaryButton
        title="Estadísticas"
        variant="secondary"
        onPress={() => navigation.navigate('Stats')}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', marginBottom: spacing.xl },
  title: { color: colors.text, fontSize: typography.display, fontWeight: '800', textAlign: 'center' },
  subtitle: { color: colors.textMuted, fontSize: typography.body, marginTop: spacing.sm, textAlign: 'center' },
});
