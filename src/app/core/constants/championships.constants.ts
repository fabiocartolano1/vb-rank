/**
 * Interface représentant un championnat
 */
export interface Championship {
  /** Identifiant unique technique du championnat (utilisé dans les URLs, filtres, etc.) */
  id: string;
  /** Nom d'affichage du championnat */
  name: string;
}

/**
 * Liste exhaustive des championnats gérés par l'application
 */
export const CHAMPIONSHIPS: readonly Championship[] = [
  { id: 'nationale-3-f', name: 'Nationale 3 F' },
  { id: 'prenationale-m', name: 'Pré-nationale M' },
  { id: 'prenationale-f', name: 'Pré-nationale F' },
  { id: 'regionale-2-m', name: 'Régionale 2 M' },
  { id: 'regionale-2-f', name: 'Régionale 2 F' },
  { id: 'm18-m', name: 'M18 M' },
  { id: 'cfd', name: 'M18 F' },
  { id: 'mmb', name: 'M15 M' },
  { id: 'mfd', name: 'M15 F' },
  { id: 'bmb', name: 'M13 Mixte' },
  { id: 'bfc', name: 'M13 F' },
] as const;

/**
 * Liste des championnats adultes uniquement
 */
export const ADULT_CHAMPIONSHIPS: readonly Championship[] = CHAMPIONSHIPS.slice(0, 5);
