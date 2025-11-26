export interface Match {
  id?: string;
  championnatId?: string; // ID du championnat associé
  journee: number;
  date: string; // Format ISO
  heure?: string;
  equipeDomicileId?: string; // ID de l'équipe domicile (référence à la collection equipes)
  equipeDomicile: string; // Nom de l'équipe
  equipeExterieurId?: string; // ID de l'équipe extérieur (référence à la collection equipes)
  equipeExterieur: string; // Nom de l'équipe
  scoreDomicile?: number; // Sets gagnés
  scoreExterieur?: number; // Sets gagnés
  detailSets?: string[]; // Ex: ["25:20", "25:19", "26:24"]
  statut: 'termine' | 'a_venir'; // Statut du match
  feuilleMatchUrl?: string; // URL vers la feuille de match officielle
}
