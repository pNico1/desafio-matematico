// Tipos de navegación.
// Game y Results no reciben params: el estado del juego vive en GameContext.

export type GameMode = 'classic' | 'truefalse' | 'multichoice' | 'timeattack';
export type Difficulty = 'easy' | 'medium' | 'hard';

export type RootStackParamList = {
  Home: undefined;
  Config: undefined;
  Game: undefined;
  Results: undefined;
  History: undefined;
  Stats: undefined;
};
