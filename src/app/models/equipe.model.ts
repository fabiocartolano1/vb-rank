export interface Equipe {
  id?: string;
  nom: string;
  ville?: string;
  logoUrl?: string;
  championnatId: string; // ID du championnat (référence à la collection championnats)
  // Données de classement
  rang: number;
  points: number;
  joues: number;
  gagnes: number;
  perdus: number;
  setsPour: number;
  setsContre: number;
}
