const fs = require('fs');
const path = require('path');

const scriptsDir = path.join(__dirname, '../update');

const matchFiles = [
  'update-matchs-n3.ts',
  'update-matchs-r2f.ts',
  'update-matchs-pnf.ts',
  'update-matchs-pnm.ts',
  'update-matchs-m18m.ts',
  'update-matchs-bfc.ts',
  'update-matchs-bmb.ts',
  'update-matchs-cfd.ts',
  'update-matchs-mfd.ts',
  'update-matchs-mmb.ts',
];

const classementFiles = [
  'update-classement-n3.ts',
  'update-classement-r2f.ts',
  'update-classement-pnf.ts',
  'update-classement-pnm.ts',
  'update-classement-m18m.ts',
  'update-classement-bfc.ts',
  'update-classement-bmb.ts',
  'update-classement-cfd.ts',
  'update-classement-mfd.ts',
  'update-classement-mmb.ts',
];

const matchOptimizationCode = `
  // Optimisation : vérification rapide sur les 5 premiers matchs
  console.log('⚡ Vérification rapide des changements...');
  let hasAnyChange = false;
  const samplesToCheck = Math.min(5, matchs.length);

  for (let i = 0; i < samplesToCheck; i++) {
    const match = matchs[i];
    const q = query(
      collection(db, 'matchs'),
      where('championnatId', '==', match.championnatId),
      where('journee', '==', match.journee),
      where('equipeDomicile', '==', match.equipeDomicile),
      where('equipeExterieur', '==', match.equipeExterieur)
    );
    const existingMatchs = await getDocs(q);

    if (!existingMatchs.empty) {
      const existingData = existingMatchs.docs[0].data();
      const hasChanged =
        existingData.date !== match.date ||
        existingData.heure !== match.heure ||
        existingData.scoreDomicile !== match.scoreDomicile ||
        existingData.scoreExterieur !== match.scoreExterieur ||
        existingData.statut !== match.statut ||
        JSON.stringify(existingData.detailSets) !== JSON.stringify(match.detailSets);

      if (hasChanged) {
        hasAnyChange = true;
        break;
      }
    }
  }

  if (!hasAnyChange) {
    console.log('✅ Aucun changement détecté sur l\\'échantillon - arrêt anticipé');
    console.log('\\n📊 Résumé de la mise à jour :');
    console.log(\`   ✅ 0 match(s) mis à jour\`);
    console.log(\`   ⏭️  \${matchs.length} match(s) probablement inchangé(s)\`);
    console.log('   ⚡ Optimisation : script terminé rapidement sans parcourir tous les matchs');
    return;
  }

  console.log('🔄 Changements détectés - traitement de tous les matchs...\\n');
`;

function addMatchOptimization(filePath) {
  console.log(`\n📄 Traitement de ${path.basename(filePath)}...`);
  let content = fs.readFileSync(filePath, 'utf-8');

  // Vérifier si déjà présent
  if (content.includes('Vérification rapide des changements')) {
    console.log('  ⏭️  Optimisation déjà présente');
    return;
  }

  // Trouver le pattern et insérer l'optimisation
  const pattern = /const errors: Array<\{ match: string; error: string \}> = \[\];\s+for \(const match of matchs\) \{/;

  if (!pattern.test(content)) {
    console.log('  ⚠️  Pattern non trouvé');
    return;
  }

  content = content.replace(
    pattern,
    `const errors: Array<{ match: string; error: string }> = [];
${matchOptimizationCode}
  for (const match of matchs) {`
  );

  fs.writeFileSync(filePath, content, 'utf-8');
  console.log('  ✅ Optimisation ajoutée');
}

function addClassementOptimization(filePath) {
  console.log(`\n📄 Traitement de ${path.basename(filePath)}...`);
  let content = fs.readFileSync(filePath, 'utf-8');

  // Vérifier si déjà présent
  if (content.includes('Vérification rapide des changements')) {
    console.log('  ⏭️  Optimisation déjà présente');
    return;
  }

  // Obtenir le championnatId du fichier
  const championnatIdMatch = content.match(/where\('championnatId', '==', '([^']+)'\)/);
  if (!championnatIdMatch) {
    console.log('  ⚠️  Impossible de trouver le championnatId');
    return;
  }
  const championnatId = championnatIdMatch[1];

  const classementOptimizationCode = `
  // Optimisation : vérification rapide sur les 3 premières équipes
  console.log('⚡ Vérification rapide des changements...');
  let hasAnyChange = false;
  const samplesToCheck = Math.min(3, equipes.length);

  for (let i = 0; i < samplesToCheck; i++) {
    const equipe = equipes[i];
    const nomNormalized = normalizeTeamName(equipe.nom);

    for (const [nom, id] of equipesMap.entries()) {
      if (normalizeTeamName(nom) === nomNormalized) {
        const existingDoc = await getDocs(query(
          collection(db, 'equipes'),
          where('championnatId', '==', '${championnatId}'),
          where('nom', '==', nom)
        ));

        if (!existingDoc.empty) {
          const existingData = existingDoc.docs[0].data();
          const hasChanged =
            existingData.rang !== equipe.rang ||
            existingData.points !== equipe.points ||
            existingData.joues !== equipe.joues ||
            existingData.gagnes !== equipe.gagnes ||
            existingData.perdus !== equipe.perdus ||
            existingData.setsPour !== equipe.setsPour ||
            existingData.setsContre !== equipe.setsContre;

          if (hasChanged) {
            hasAnyChange = true;
            break;
          }
        }
        break;
      }
    }

    if (hasAnyChange) break;
  }

  if (!hasAnyChange) {
    console.log('✅ Aucun changement détecté sur l\\'échantillon - arrêt anticipé');
    console.log('\\n📊 Résumé de la mise à jour :');
    console.log(\`   ✅ 0 équipe(s) mise(s) à jour\`);
    console.log(\`   ⏭️  \${equipes.length} équipe(s) probablement inchangée(s)\`);
    console.log('   ⚡ Optimisation : script terminé rapidement sans parcourir toutes les équipes');
    return;
  }

  console.log('🔄 Changements détectés - traitement de toutes les équipes...\\n');
`;

  // Trouver le pattern et insérer l'optimisation
  const pattern = /const errors: Array<\{ equipe: string; error: string \}> = \[\];\s+for \(const equipe of equipes\) \{/;

  if (!pattern.test(content)) {
    console.log('  ⚠️  Pattern non trouvé');
    return;
  }

  content = content.replace(
    pattern,
    `const errors: Array<{ equipe: string; error: string }> = [];
${classementOptimizationCode}
  for (const equipe of equipes) {`
  );

  fs.writeFileSync(filePath, content, 'utf-8');
  console.log('  ✅ Optimisation ajoutée');
}

console.log('⚡ Ajout de l\'optimisation d\'arrêt anticipé...\n');
console.log('═══════════════════════════════════════════════════════\n');

console.log('📦 SCRIPTS DE MATCHS\n');
matchFiles.forEach(file => {
  const filePath = path.join(scriptsDir, file);
  if (fs.existsSync(filePath)) {
    addMatchOptimization(filePath);
  } else {
    console.log(`\n⚠️  ${file} n'existe pas`);
  }
});

console.log('\n\n📦 SCRIPTS DE CLASSEMENT\n');
classementFiles.forEach(file => {
  const filePath = path.join(scriptsDir, file);
  if (fs.existsSync(filePath)) {
    addClassementOptimization(filePath);
  } else {
    console.log(`\n⚠️  ${file} n'existe pas`);
  }
});

console.log('\n═══════════════════════════════════════════════════════');
console.log('\n🎉 Optimisation terminée !');
console.log('\n📝 Avantage :');
console.log('   - Si aucun changement : arrêt après 3-5 vérifications au lieu de toutes');
console.log('   - Gain de temps : ~80-90% quand aucune donnée ne change');
console.log('   - Coût Firestore réduit : moins de lectures');
