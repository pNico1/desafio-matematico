import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors } from '../theme/colors';
import { RootStackParamList } from './types';
import { HomeScreen } from '../screens/HomeScreen';
import { ConfigScreen } from '../screens/ConfigScreen';
import { GameScreen } from '../screens/GameScreen';
import { ResultsScreen } from '../screens/ResultsScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { StatsScreen } from '../screens/StatsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Cálculo Mental' }} />
        <Stack.Screen name="Config" component={ConfigScreen} options={{ title: 'Configurar partida' }} />
        <Stack.Screen name="Game" component={GameScreen} options={{ title: 'Jugando', headerBackVisible: false }} />
        <Stack.Screen name="Results" component={ResultsScreen} options={{ title: 'Resultado', headerBackVisible: false }} />
        <Stack.Screen name="History" component={HistoryScreen} options={{ title: 'Historial' }} />
        <Stack.Screen name="Stats" component={StatsScreen} options={{ title: 'Estadísticas' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
