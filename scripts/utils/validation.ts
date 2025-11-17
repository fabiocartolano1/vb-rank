// Validation utilities for scraped data

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// ========== QUICK COMPARISON UTILITIES ==========

/**
 * Crée une signature rapide des données pour détecter les changements
 * Plus rapide qu'un hash cryptographique mais suffisant pour la détection de changements
 */
export function createDataSignature(data: any[]): string {
  if (!data || data.length === 0) return 'empty';

  // Créer une signature basée sur : longueur + quelques échantillons + checksum simple
  const length = data.length;
  const firstItem = JSON.stringify(data[0]);
  const lastItem = JSON.stringify(data[data.length - 1]);
  const middleItem = data.length > 2 ? JSON.stringify(data[Math.floor(data.length / 2)]) : '';

  // Checksum simple : somme des codes de caractères
  let checksum = 0;
  const allData = JSON.stringify(data);
  for (let i = 0; i < allData.length; i += 100) { // Échantillonnage tous les 100 caractères
    checksum += allData.charCodeAt(i);
  }

  return `${length}:${checksum}:${firstItem.length}:${lastItem.length}:${middleItem.length}`;
}

// ========== MATCHS VALIDATION ==========

interface Match {
  championnatId: string;
  journee: number;
  date: string;
  heure?: string;
  equipeDomicile: string;
  equipeDomicileId?: string;
  equipeExterieur: string;
  equipeExterieurId?: string;
  scoreDomicile?: number | null;
  scoreExterieur?: number | null;
  detailSets?: string[] | null;
  statut: 'termine' | 'a_venir';
}

function validateMatch(match: Match, index: number): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validation de la journée
  if (!match.journee || match.journee < 1 || match.journee > 50) {
    errors.push(`Match ${index}: Journée invalide (${match.journee})`);
  }

  // Validation des noms d'équipes
  if (!match.equipeDomicile || match.equipeDomicile.length < 3) {
    errors.push(`Match ${index}: Nom d'équipe domicile invalide (${match.equipeDomicile})`);
  }
  if (!match.equipeExterieur || match.equipeExterieur.length < 3) {
    errors.push(`Match ${index}: Nom d'équipe extérieur invalide (${match.equipeExterieur})`);
  }

  // Validation de la date (format YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!match.date || !dateRegex.test(match.date)) {
    errors.push(`Match ${index}: Format de date invalide (${match.date})`);
  } else {
    // Vérifier que la date est valide
    const dateObj = new Date(match.date);
    if (isNaN(dateObj.getTime())) {
      errors.push(`Match ${index}: Date invalide (${match.date})`);
    }
  }

  // Validation des scores (si le match est terminé)
  if (match.statut === 'termine') {
    if (match.scoreDomicile === null || match.scoreDomicile === undefined) {
      errors.push(`Match ${index}: Score domicile manquant pour un match terminé`);
    } else if (isNaN(match.scoreDomicile) || match.scoreDomicile < 0 || match.scoreDomicile > 5) {
      errors.push(`Match ${index}: Score domicile invalide (${match.scoreDomicile})`);
    }

    if (match.scoreExterieur === null || match.scoreExterieur === undefined) {
      errors.push(`Match ${index}: Score extérieur manquant pour un match terminé`);
    } else if (isNaN(match.scoreExterieur) || match.scoreExterieur < 0 || match.scoreExterieur > 5) {
      errors.push(`Match ${index}: Score extérieur invalide (${match.scoreExterieur})`);
    }
  }

  // Warnings pour les IDs d'équipes manquants
  if (!match.equipeDomicileId) {
    warnings.push(`Match ${index}: ID équipe domicile manquant (${match.equipeDomicile})`);
  }
  if (!match.equipeExterieurId) {
    warnings.push(`Match ${index}: ID équipe extérieur manquant (${match.equipeExterieur})`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

export function validateMatchsData(matchs: Match[], expectedMinCount: number = 10): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Vérifier qu'on a un minimum de matchs
  if (matchs.length === 0) {
    errors.push('Aucun match trouvé - scraping échoué ou structure de page modifiée');
    return { isValid: false, errors, warnings };
  }

  if (matchs.length < expectedMinCount) {
    warnings.push(
      `Nombre de matchs suspect: ${matchs.length} trouvés (minimum attendu: ${expectedMinCount})`
    );
  }

  // Valider chaque match individuellement
  let validCount = 0;
  matchs.forEach((match, index) => {
    const result = validateMatch(match, index);
    if (result.isValid) {
      validCount++;
    }
    errors.push(...result.errors);
    warnings.push(...result.warnings);
  });

  // Vérifier qu'au moins 80% des matchs sont valides
  const validPercentage = (validCount / matchs.length) * 100;
  if (validPercentage < 80) {
    errors.push(
      `Trop de matchs invalides: ${validCount}/${matchs.length} valides (${validPercentage.toFixed(1)}%)`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// ========== CLASSEMENT VALIDATION ==========

interface EquipeData {
  nom: string;
  rang: number;
  points: number;
  joues: number;
  gagnes: number;
  perdus: number;
  setsPour: number;
  setsContre: number;
}

function validateEquipe(equipe: EquipeData, index: number): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validation du nom
  if (!equipe.nom || equipe.nom.length < 3) {
    errors.push(`Équipe ${index}: Nom invalide (${equipe.nom})`);
  }

  // Validation du rang
  if (!equipe.rang || equipe.rang < 1 || equipe.rang > 50) {
    errors.push(`Équipe ${index} (${equipe.nom}): Rang invalide (${equipe.rang})`);
  }

  // Validation des points (peuvent être 0 mais pas négatifs ni NaN)
  if (equipe.points === null || equipe.points === undefined || isNaN(equipe.points) || equipe.points < 0) {
    errors.push(`Équipe ${index} (${equipe.nom}): Points invalides (${equipe.points})`);
  }

  // Validation des matchs joués
  if (equipe.joues === null || equipe.joues === undefined || isNaN(equipe.joues) || equipe.joues < 0) {
    errors.push(`Équipe ${index} (${equipe.nom}): Nombre de matchs joués invalide (${equipe.joues})`);
  }

  // Validation de la cohérence joués = gagnés + perdus
  if (equipe.joues !== equipe.gagnes + equipe.perdus) {
    warnings.push(
      `Équipe ${index} (${equipe.nom}): Incohérence matchs (joués: ${equipe.joues}, gagnés: ${equipe.gagnes}, perdus: ${equipe.perdus})`
    );
  }

  // Validation des sets (peuvent être 0 mais pas négatifs ni NaN)
  if (equipe.setsPour === null || equipe.setsPour === undefined || isNaN(equipe.setsPour) || equipe.setsPour < 0) {
    errors.push(`Équipe ${index} (${equipe.nom}): Sets pour invalides (${equipe.setsPour})`);
  }
  if (equipe.setsContre === null || equipe.setsContre === undefined || isNaN(equipe.setsContre) || equipe.setsContre < 0) {
    errors.push(`Équipe ${index} (${equipe.nom}): Sets contre invalides (${equipe.setsContre})`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

export function validateClassementData(equipes: EquipeData[], expectedMinCount: number = 8): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Vérifier qu'on a un minimum d'équipes
  if (equipes.length === 0) {
    errors.push('Aucune équipe trouvée - scraping échoué ou structure de page modifiée');
    return { isValid: false, errors, warnings };
  }

  if (equipes.length < expectedMinCount) {
    warnings.push(
      `Nombre d'équipes suspect: ${equipes.length} trouvées (minimum attendu: ${expectedMinCount})`
    );
  }

  // Valider chaque équipe individuellement
  let validCount = 0;
  equipes.forEach((equipe, index) => {
    const result = validateEquipe(equipe, index);
    if (result.isValid) {
      validCount++;
    }
    errors.push(...result.errors);
    warnings.push(...result.warnings);
  });

  // Vérifier qu'au moins 80% des équipes sont valides
  const validPercentage = (validCount / equipes.length) * 100;
  if (validPercentage < 80) {
    errors.push(
      `Trop d'équipes invalides: ${validCount}/${equipes.length} valides (${validPercentage.toFixed(1)}%)`
    );
  }

  // Vérifier que les rangs sont uniques et consécutifs
  const rangs = equipes.map(e => e.rang).sort((a, b) => a - b);
  const rangsUniques = new Set(rangs);
  if (rangsUniques.size !== rangs.length) {
    warnings.push('Rangs dupliqués détectés dans le classement');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}
