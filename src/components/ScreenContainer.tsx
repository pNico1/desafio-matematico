import { ReactNode } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

interface Props {
  children: ReactNode;
  scroll?: boolean;
  centered?: boolean;
}

export function ScreenContainer({ children, scroll = false, centered = false }: Props) {
  const inner = (
    <View style={[styles.inner, centered && styles.centered]}>{children}</View>
  );
  return (
    <SafeAreaView style={styles.safe}>
      {scroll ? (
        <ScrollView contentContainerStyle={styles.scroll}>{inner}</ScrollView>
      ) : (
        inner
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1 },
  inner: { flex: 1, padding: spacing.lg },
  centered: { justifyContent: 'center', alignItems: 'stretch' },
});
