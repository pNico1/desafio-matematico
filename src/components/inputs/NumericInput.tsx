import { useEffect, useRef, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { PrimaryButton } from '../PrimaryButton';
import { colors } from '../../theme/colors';
import { radius, spacing, typography } from '../../theme/spacing';

interface Props {
  /** Cambia cuando avanza la pregunta — para limpiar el input. */
  resetKey: string | number;
  onSubmit: (value: string) => void;
  disabled?: boolean;
}

/** Input numérico con botón "Responder". Soporta números negativos. */
export function NumericInput({ resetKey, onSubmit, disabled }: Props) {
  const [text, setText] = useState('');
  const inputRef = useRef<TextInput>(null);

  // limpiar al cambiar de pregunta y volver a enfocar
  useEffect(() => {
    setText('');
    const t = setTimeout(() => inputRef.current?.focus(), 60);
    return () => clearTimeout(t);
  }, [resetKey]);

  function submit() {
    const trimmed = text.trim();
    if (trimmed === '') return;
    onSubmit(trimmed);
  }

  return (
    <View>
      <TextInput
        ref={inputRef}
        style={styles.input}
        value={text}
        onChangeText={setText}
        keyboardType="numbers-and-punctuation"
        placeholder="Tu respuesta"
        placeholderTextColor={colors.textMuted}
        editable={!disabled}
        autoFocus
        returnKeyType="done"
        onSubmitEditing={submit}
      />
      <PrimaryButton title="Responder" onPress={submit} disabled={disabled} />
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    color: colors.text,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: typography.h2,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
});
