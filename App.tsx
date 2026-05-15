import { StatusBar } from 'expo-status-bar';
import { AppNavigator } from './src/navigation/AppNavigator';
import { GameProvider } from './src/context/GameContext';
import { HistoryProvider } from './src/context/HistoryContext';
import { PrefsProvider } from './src/context/PrefsContext';

// Orden de providers (de afuera hacia adentro):
// 1. PrefsProvider — independiente de los demás, arranca la lectura de AsyncStorage cuanto antes.
// 2. GameProvider — estado del juego, no depende de prefs (las prefs se aplican al iniciar la ronda).
// 3. HistoryProvider — depende de useGame() para auto-guardar al terminar la ronda.
export default function App() {
  return (
    <PrefsProvider>
      <GameProvider>
        <HistoryProvider>
          <StatusBar style="light" />
          <AppNavigator />
        </HistoryProvider>
      </GameProvider>
    </PrefsProvider>
  );
}
