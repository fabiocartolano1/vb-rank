import * as fs from 'fs';
import * as path from 'path';

const codes = ['m18m', 'bfc', 'bmb', 'cfd', 'mfd', 'mmb'];
const championnatIds: Record<string, string> = {
  'm18m': 'm18-m',
  'bfc': 'benjamines-f-comite',
  'bmb': 'benjamins-m-bronze',
  'cfd': 'cadettes-f-departement',
  'mfd': 'minimes-f-departement',
  'mmb': 'minimes-m-bronze'
};

function getChampionnatUrlFunctionCode(): string {
  return `
async function getChampionnatUrl(championnatId: string): Promise<string> {
  console.log(\`📡 Récupération de l'URL du championnat \${championnatId}...\`);
  const championnatDoc = await getDocs(
    query(collection(db, 'championnats'), where('__name__', '==', championnatId))
  );

  if (championnatDoc.empty) {
    throw new Error(\`❌ Championnat \${championnatId} non trouvé dans Firebase\`);
  }

  const url = championnatDoc.docs[0].data().url;
  if (!url) {
    throw new Error(\`❌ URL non renseignée pour \${championnatId} dans Firebase\`);
  }

  console.log(\`   URL: \${url}\\n\`);
  return url;
}
`;
}

function getMatchsReplacementCode(championnatId: string): string {
  return `// Récupérer l'URL depuis Firebase
    const url = await getChampionnatUrl('${championnatId}');

    console.log('🔍 Vérification des changements...\\n');
    const html = await fetchPage(url);

    const currentHash = calculateHash(html);
    console.log(\`   Hash actuel: \${currentHash.substring(0, 16)}...\`);

    let state = await getScrapingState(db, STATE_KEY);

    if (!state) {
      console.log('   Aucun state précédent trouvé, initialisation...');
      state = {
        lastHash: '',
        lastUpdate: 0,
        lastChangeDetected: 0,
        consecutiveNoChange: 0,
        totalChecks: 0,
        totalUpdates: 0
      };
    }

    console.log(\`   Hash précédent: \${state.lastHash ? state.lastHash.substring(0, 16) + '...' : 'N/A'}\`);
    logHashCheckResult(state, STATE_KEY);

    state.totalChecks++;

    if (currentHash === state.lastHash) {
      state.consecutiveNoChange++;
      logNoChangeDetected(state);
      await updateScrapingState(db, STATE_KEY, state);
      return;
    }

    logChangeDetected();

    const now = Date.now();
    state.lastHash = currentHash;
    state.lastChangeDetected = now;
    state.consecutiveNoChange = 0;
    state.totalUpdates++;

    const equipesMap = await getEquipesMap();
    const matchs = await scrapeMatchs(url, equipesMap);
    console.log(\`\\n✅ \${matchs.length} matchs trouvés\\n\`);

    if (matchs.length === 0) {
      console.log('⚠️  Aucun match trouvé, vérifiez la structure de la page');
      return;
    }

    await updateMatchsInFirebase(matchs);

    state.lastUpdate = now;
    await updateScrapingState(db, STATE_KEY, state);

    logStatistics(state);

    console.log('\\n🎉 Mise à jour terminée avec succès !');
    console.log('════════════════════════════════════════════════');`;
}

function getClassementReplacementCode(championnatId: string): string {
  return `// Récupérer l'URL depuis Firebase
    const url = await getChampionnatUrl('${championnatId}');

    console.log('🔍 Vérification des changements...\\n');
    const html = await fetchPage(url);

    const currentHash = calculateHash(html);
    console.log(\`   Hash actuel: \${currentHash.substring(0, 16)}...\`);

    let state = await getScrapingState(db, STATE_KEY);

    if (!state) {
      console.log('   Aucun state précédent trouvé, initialisation...');
      state = {
        lastHash: '',
        lastUpdate: 0,
        lastChangeDetected: 0,
        consecutiveNoChange: 0,
        totalChecks: 0,
        totalUpdates: 0
      };
    }

    console.log(\`   Hash précédent: \${state.lastHash ? state.lastHash.substring(0, 16) + '...' : 'N/A'}\`);
    logHashCheckResult(state, STATE_KEY);

    state.totalChecks++;

    if (currentHash === state.lastHash) {
      state.consecutiveNoChange++;
      logNoChangeDetected(state);
      await updateScrapingState(db, STATE_KEY, state);
      return;
    }

    logChangeDetected();

    const now = Date.now();
    state.lastHash = currentHash;
    state.lastChangeDetected = now;
    state.consecutiveNoChange = 0;
    state.totalUpdates++;

    const equipes = await scrapeClassement(url);
    console.log(\`\\n✅ \${equipes.length} équipes trouvées dans le classement\\n\`);

    if (equipes.length === 0) {
      console.log('⚠️  Aucune équipe trouvée, vérifiez la structure de la page');
      return;
    }

    await updateEquipesInFirebase(equipes);

    state.lastUpdate = now;
    await updateScrapingState(db, STATE_KEY, state);

    logStatistics(state);

    console.log('\\n🎉 Mise à jour terminée avec succès !');
    console.log('════════════════════════════════════════════════');`;
}

function fixSmartMatchsScript(code: string, championnatId: string): void {
  const filePath = path.join(__dirname, 'update', `smart-update-matchs-${code}.ts`);
  let content = fs.readFileSync(filePath, 'utf-8');

  // Ajouter la fonction getChampionnatUrl après l'interface Match
  const interfaceMatch = content.indexOf('interface Match {');
  const interfaceEnd = content.indexOf('}', interfaceMatch) + 1;

  const beforeFunc = content.substring(0, interfaceEnd);
  const afterFunc = content.substring(interfaceEnd);

  content = beforeFunc + '\n' + getChampionnatUrlFunctionCode() + '\n' + afterFunc;

  // Remplacer le bloc d'erreur
  const errorBlock = /\/\/ NOTE:.*?\n.*?console\.error.*?\n.*?process\.exit\(1\);/s;
  content = content.replace(errorBlock, getMatchsReplacementCode(championnatId));

  fs.writeFileSync(filePath, content);
}

function fixSmartClassementScript(code: string, championnatId: string): void {
  const filePath = path.join(__dirname, 'update', `smart-update-classement-${code}.ts`);
  let content = fs.readFileSync(filePath, 'utf-8');

  // Ajouter la fonction getChampionnatUrl après l'interface EquipeData
  const interfaceMatch = content.indexOf('interface EquipeData {');
  const interfaceEnd = content.indexOf('}', interfaceMatch) + 1;

  const beforeFunc = content.substring(0, interfaceEnd);
  const afterFunc = content.substring(interfaceEnd);

  content = beforeFunc + '\n' + getChampionnatUrlFunctionCode() + '\n' + afterFunc;

  // Remplacer le bloc d'erreur
  const errorBlock = /\/\/ NOTE:.*?\n.*?console\.error.*?\n.*?process\.exit\(1\);/s;
  content = content.replace(errorBlock, getClassementReplacementCode(championnatId));

  fs.writeFileSync(filePath, content);
}

console.log('🔧 Correction des scripts smart pour les championnats jeunes...\n');

for (const code of codes) {
  console.log(`\n📝 Traitement de ${code.toUpperCase()}...`);

  const championnatId = championnatIds[code];

  try {
    fixSmartMatchsScript(code, championnatId);
    console.log(`✅ Corrigé: smart-update-matchs-${code}.ts`);
  } catch (error) {
    console.error(`❌ Erreur matchs-${code}:`, error);
  }

  try {
    fixSmartClassementScript(code, championnatId);
    console.log(`✅ Corrigé: smart-update-classement-${code}.ts`);
  } catch (error) {
    console.error(`❌ Erreur classement-${code}:`, error);
  }
}

console.log('\n🎉 Tous les scripts jeunes ont été corrigés !');
