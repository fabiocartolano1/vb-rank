import * as fs from 'fs';
import * as path from 'path';

interface UrlExtraction {
  code: string;
  matchsUrl: string | null;
  classementUrl: string | null;
}

const codes = ['r2m', 'pnf', 'pnm', 'r2f', 'm18m', 'bfc', 'bmb', 'cfd', 'mfd', 'mmb'];

function extractUrlFromFile(filePath: string): string | null {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const urlMatch = content.match(/const url\s*=\s*['"`](https?:\/\/[^'"`]+)['"`]/);
    return urlMatch ? urlMatch[1] : null;
  } catch (error) {
    return null;
  }
}

function replaceUrlInSmartScript(smartFilePath: string, url: string): void {
  let content = fs.readFileSync(smartFilePath, 'utf-8');

  // Remplacer l'erreur et le process.exit par l'URL et le code de scraping
  const errorBlock = /\/\/ NOTE:.*?\n.*?console\.error.*?\n.*?process\.exit\(1\);/s;

  const replacement = `const url = '${url}';

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

  content = content.replace(errorBlock, replacement);

  fs.writeFileSync(smartFilePath, content);
}

function replaceUrlInSmartClassementScript(smartFilePath: string, url: string): void {
  let content = fs.readFileSync(smartFilePath, 'utf-8');

  // Remplacer l'erreur et le process.exit par l'URL et le code de scraping
  const errorBlock = /\/\/ NOTE:.*?\n.*?console\.error.*?\n.*?process\.exit\(1\);/s;

  const replacement = `const url = '${url}';

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

  content = content.replace(errorBlock, replacement);

  fs.writeFileSync(smartFilePath, content);
}

console.log('🔧 Correction des URLs dans les scripts smart...\n');

const updateDir = path.join(__dirname, 'update');

for (const code of codes) {
  console.log(`\n📝 Traitement de ${code.toUpperCase()}...`);

  // Extraire l'URL des matchs
  const matchsOriginalPath = path.join(updateDir, `update-matchs-${code}.ts`);
  const matchsUrl = extractUrlFromFile(matchsOriginalPath);

  if (matchsUrl) {
    const smartMatchsPath = path.join(updateDir, `smart-update-matchs-${code}.ts`);
    replaceUrlInSmartScript(smartMatchsPath, matchsUrl);
    console.log(`✅ URL ajoutée à smart-update-matchs-${code}.ts`);
  } else {
    console.log(`⚠️  URL non trouvée dans update-matchs-${code}.ts`);
  }

  // Extraire l'URL du classement
  const classementOriginalPath = path.join(updateDir, `update-classement-${code}.ts`);
  const classementUrl = extractUrlFromFile(classementOriginalPath);

  if (classementUrl) {
    const smartClassementPath = path.join(updateDir, `smart-update-classement-${code}.ts`);
    replaceUrlInSmartClassementScript(smartClassementPath, classementUrl);
    console.log(`✅ URL ajoutée à smart-update-classement-${code}.ts`);
  } else {
    console.log(`⚠️  URL non trouvée dans update-classement-${code}.ts`);
  }
}

console.log('\n🎉 Toutes les URLs ont été ajoutées aux scripts smart !');
