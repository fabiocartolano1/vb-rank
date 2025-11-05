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
  { id: 'prenationale-m', name: 'Prénationale M' },
  { id: 'prenationale-f', name: 'Prénationale F' },
  { id: 'regionale-2-m', name: 'Régionale 2 M' },
  { id: 'regionale-2-f', name: 'Régionale 2 F' },
  { id: 'm18-m', name: 'M18 M' },
  { id: 'bfc', name: 'Benjamines' },
  { id: 'bmb', name: 'Benjamins' },
  { id: 'mfd', name: 'Minimes F' },
  { id: 'mmb', name: 'Minimes M' },
  { id: 'cfd', name: 'Cadettes' }
] as const;

/**
 * Liste des championnats adultes uniquement
 */
export const ADULT_CHAMPIONSHIPS: readonly Championship[] = CHAMPIONSHIPS.slice(0, 5);
