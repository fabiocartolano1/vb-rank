export interface Match {
  id?: string;
  journee: number;
  date: string; // Format ISO
  heure?: string;
  equipeDomicile: string; // Nom de l'équipe
  equipeExterieur: string; // Nom de l'équipe
  scoreDomicile?: number; // Sets gagnés
  scoreExterieur?: number; // Sets gagnés
  detailSets?: string[]; // Ex: ["25:20", "25:19", "26:24"]
  statut: 'termine' | 'a_venir'; // Statut du match
}
