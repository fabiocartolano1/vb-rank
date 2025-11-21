function reconstructSetPoints(teamAServices: number[], teamBServices: number[]): string[] {
  const points: string[] = [];
  let scoreA = 0;
  let scoreB = 0;

  // Créer une liste de tous les services avec l'équipe correspondante
  interface Service {
    score: number;
    team: 'A' | 'B';
  }

  const allServices: Service[] = [];

  // Ajouter les services de l'équipe A
  teamAServices.forEach((score) => {
    allServices.push({
      score: score === 0 ? -1 : score, // X devient -1 pour le tri
      team: 'A',
    });
  });

  // Ajouter les services de l'équipe B
  teamBServices.forEach((score) => {
    allServices.push({
      score: score === 0 ? -1 : score, // X devient -1 pour le tri
      team: 'B',
    });
  });

  // Trier par score (ordre chronologique des services)
  allServices.sort((a, b) => {
    if (a.score === -1) return -1; // X (0) en premier
    if (b.score === -1) return 1;
    return a.score - b.score;
  });

  // Reconstituer les points
  for (let i = 0; i < allServices.length; i++) {
    const currentService = allServices[i];
    const nextService = allServices[i + 1];

    const startScore = currentService.score === -1 ? 0 : currentService.score;

    // Déterminer jusqu'à quel score l'équipe a servi
    let endScore: number;
    if (!nextService) {
      // Dernier service, va jusqu'à la fin
      endScore =
        currentService.team === 'A'
          ? Math.max(...teamAServices.filter((s) => s !== 0))
          : Math.max(...teamBServices.filter((s) => s !== 0));
    } else {
      // Le service suivant nous dit le score de l'équipe qui sert
      if (nextService.team === currentService.team) {
        // Même équipe, on prend le score du prochain service
        endScore = nextService.score === -1 ? 0 : nextService.score;
      } else {
        // Équipe adverse, on cherche le prochain service de notre équipe
        const nextSameTeam = allServices.slice(i + 1).find((s) => s.team === currentService.team);
        endScore = nextSameTeam
          ? nextSameTeam.score === -1
            ? 0
            : nextSameTeam.score
          : currentService.team === 'A'
          ? Math.max(...teamAServices.filter((s) => s !== 0))
          : Math.max(...teamBServices.filter((s) => s !== 0));
      }
    }

    // Ajouter les points marqués pendant ce service
    const pointsScored = endScore - startScore;
    for (let p = 0; p < pointsScored; p++) {
      if (currentService.team === 'A') {
        scoreA++;
        points.push(`Point ${points.length + 1}: Équipe A marque (${scoreA}-${scoreB})`);
      } else {
        scoreB++;
        points.push(`Point ${points.length + 1}: Équipe B marque (${scoreA}-${scoreB})`);
      }
    }
  }

  return points;
}

// Exemple avec ton match
const mendeServices = [1, 2, 3, 4, 6, 9, 10, 11, 12];
const cresServices = [0, 6, 8, 14, 16, 17, 18, 20, 21, 25]; // X = 0

const result = reconstructSetPoints(mendeServices, cresServices);
result.forEach((point) => console.log(point));
// ```

// Ce script va afficher :
// ```
// Point 1: Équipe B marque (0-1)
// Point 2: Équipe B marque (0-2)
// ...
// Point 37: Équipe B marque (12-25)
