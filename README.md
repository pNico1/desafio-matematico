# Desafío Matemático

App móvil de cálculo mental (TP Desarrollo de Aplicaciones I) en React Native + Expo + TypeScript. Proyecto para la materia de Desarrollo de Aplicaciones 1

## Requisitos previos (instalá una vez)

1. **Node.js 20 LTS o superior** → https://nodejs.org/ (descargá el "LTS" para Windows).
2. **Expo Go** en tu celular Android o iPhone para probar la app sin emulador.

## Primer arranque

1. **Renombrá la carpeta** del proyecto a `desafio-matematico` (sin espacios, sin paréntesis).
   El nombre actual rompe algunas herramientas de Metro/Expo.
2. Abrí PowerShell **dentro** de la carpeta del proyecto.
3. Instalá dependencias:

   ```
   npm install
   ```

   (Tarda unos minutos la primera vez.)

4. Iniciá el dev server:

   ```
   npx expo start
   ```

5. En el celular abrí **Expo Go** y escaneá el QR que aparece en la terminal.
   La app se descarga al teléfono y vas a poder navegar entre pantallas.

## Estado del proyecto

Fase 1 completada — esqueleto de navegación. Pantallas: Inicio, Configuración, Juego (placeholder), Resultados (placeholder), Historial, Estadísticas.

Próximas fases:
- ~~Fase 1 - esqueleto de navegación. Pantallas: Inicio, Configuración, Juego (placeholder), Resultados (placeholder), Historial, Estadísticas.~~
- ~~Fase 2 — generador de operaciones + sistema de puntaje (lógica pura).~~
- ~~Fase 3 — modos de juego.~~
- ~~Fase 4 — persistencia con AsyncStorage.~~
- Fase 5 — pantallas de historial y stats con datos reales.
- Fase 6 — sonidos / animaciones / gráficos / dificultad dinámica (opcionales en el trabajo practico).

## Estructura

```
src/
  components/   componentes UI reutilizables
  context/      (vacío — para Fase 2: GameContext)
  navigation/   stack navigator + tipos de rutas
  screens/      una pantalla por ruta
  theme/        colores, espaciados, tipografía
  types/        (vacío — para Fase 2)
  utils/        (vacío — para Fase 2: generador, scoring)
```
