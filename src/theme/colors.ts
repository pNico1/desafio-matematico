// Paleta de colores única para toda la app.
// Centralizar acá facilita cambiar el look sin tocar pantallas.
export const colors = {
  background: '#0F172A',     // slate-900 (fondo oscuro)
  surface: '#1E293B',        // slate-800 (tarjetas / inputs)
  surfaceAlt: '#334155',     // slate-700
  primary: '#38BDF8',        // sky-400 (acento principal)
  primaryDark: '#0284C7',    // sky-600
  success: '#22C55E',        // green-500
  danger: '#EF4444',         // red-500
  warning: '#F59E0B',        // amber-500
  text: '#F8FAFC',           // slate-50
  textMuted: '#94A3B8',      // slate-400
  border: '#475569',         // slate-600
} as const;

export type ColorName = keyof typeof colors;
