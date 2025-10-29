export interface Classement {
  id?: string;
  rang: number;
  equipe: string; // Nom de l'équipe
  points: number;
  joues: number;
  gagnes: number;
  perdus: number;
  setsPour: number;
  setsContre: number;
}
