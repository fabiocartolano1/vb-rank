/**
 * Utilitaires pour la normalisation et le formatage de texte
 */

/**
 * Convertit une chaîne en TitleCase (première lettre de chaque mot en majuscule)
 * @param str - La chaîne à convertir
 * @returns La chaîne en TitleCase
 */
export const toTitleCase = (str: string): string => {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Normalise un nom d'équipe pour la comparaison
 * - Retire les espaces superflus
 * - Convertit en majuscules
 * - Retire les accents
 * - Normalise les espaces multiples
 *
 * @param name - Le nom à normaliser
 * @returns Le nom normalisé
 *
 * @example
 * normalizeTeamName("Sète Volley-ball") // "SETE VOLLEY-BALL"
 * normalizeTeamName("  Le  Crès  VB  ") // "LE CRES VB"
 */
export function normalizeTeamName(name: string): string {
  return name
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Retire les accents
    .replace(/\s+/g, ' '); // Normalise les espaces multiples
}
