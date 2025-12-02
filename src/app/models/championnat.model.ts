export interface Championnat {
  id?: string;
  nom: string;
  label?: string; // Label affiché dans le dropdown (optionnel, sinon utilise nom)
  ordre?: number; // Ordre d'affichage dans le dropdown (optionnel, tri par défaut par nom)
  url: string;
  equipe: string; // Nom de l'équipe associée (ex: "Régionale 2 M")
}
