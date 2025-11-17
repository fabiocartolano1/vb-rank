const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Fonction pour ajouter l'import au début du fichier après les imports existants
function addValidationImport(content) {
  if (content.includes("from '../utils/validation'")) {
    console.log('  ⏭️  Import déjà présent');
    return content;
  }

  // Trouver la dernière ligne d'import
  const lines = content.split('\n');
  let lastImportIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith('import ')) {
      lastImportIndex = i;
    }
  }

  if (lastImportIndex !== -1) {
    lines.splice(lastImportIndex + 1, 0, "import { validateMatchsData, validateClassementData } from '../utils/validation';");
    console.log('  ✅ Import ajouté');
    return lines.join('\n');
  }

  return content;
}

// Fonction pour ajouter try-catch dans updateMatchsInFirebase
function addTryCatchToMatchUpdate(content) {
  // Chercher la fonction updateMatchsInFirebase
  const funcRegex = /async function updateMatchsInFirebase\(matchs: Match\[\]\): Promise<void> \{[\s\S]*?^}/m;

  if (!funcRegex.test(content)) {
    console.log('  ⚠️  Fonction updateMatchsInFirebase non trouvée');
    return content;
  }

  // Vérifier si try-catch déjà présent
  if (content.includes('for (const match of matchs) {\n    try {')) {
    console.log('  ⏭️  Try-catch déjà présent dans la boucle');
    return content;
  }

  // Remplacer la boucle for
  const oldLoop = /let updated = 0;\s+let notFound = 0;\s+let unchanged = 0;\s+for \(const match of matchs\) \{/;
  const newLoop = `let updated = 0;
  let notFound = 0;
  let unchanged = 0;
  let failed = 0;
  const errors: Array<{ match: string; error: string }> = [];

  for (const match of matchs) {
    try {`;

  content = content.replace(oldLoop, newLoop);

  // Trouver et fermer le try-catch avant la fin de la boucle for
  // Chercher le pattern "} else {" suivi de "notFound++"
  const elseNotFoundPattern = /(\s+} else \{\s+console\.log\(`⚠️[^`]+`\);\s+notFound\+\+;\s+})\s+(}\s+console\.log\('\\n📊)/;

  content = content.replace(elseNotFoundPattern, `$1
    } catch (error) {
      failed++;
      const errorMsg = error instanceof Error ? error.message : String(error);
      const matchDesc = \`J\${match.journee}: \${match.equipeDomicile} vs \${match.equipeExterieur}\`;
      errors.push({ match: matchDesc, error: errorMsg });
      console.error(\`❌ Erreur lors de la mise à jour de \${matchDesc}: \${errorMsg}\`);
    }
  }

  $2`);

  // Ajouter le compte des erreurs dans le résumé
  const summaryPattern = /(if \(notFound > 0\) \{\s+console\.log\(`   ⚠️  \$\{notFound\}[^`]+`\);\s+})/;
  content = content.replace(summaryPattern, `$1
  if (failed > 0) {
    console.log(\`   ❌ \${failed} match(s) en erreur\`);
  }

  // Si des erreurs se sont produites, lever une exception
  if (errors.length > 0) {
    throw new Error(
      \`\${errors.length} erreur(s) lors de la mise à jour:\\n\${errors.map(e => \`  - \${e.match}: \${e.error}\`).join('\\n')}\`
    );
  }`);

  console.log('  ✅ Try-catch ajouté à updateMatchsInFirebase');
  return content;
}

// Fonction pour ajouter try-catch dans updateEquipesInFirebase
function addTryCatchToClassementUpdate(content) {
  // Vérifier si try-catch déjà présent
  if (content.includes('for (const equipe of equipes) {\n    try {')) {
    console.log('  ⏭️  Try-catch déjà présent dans la boucle');
    return content;
  }

  // Remplacer la boucle for
  const oldLoop = /let updated = 0;\s+let notFound = 0;\s+let unchanged = 0;\s+for \(const equipe of equipes\) \{/;
  const newLoop = `let updated = 0;
  let notFound = 0;
  let unchanged = 0;
  let failed = 0;
  const errors: Array<{ equipe: string; error: string }> = [];

  for (const equipe of equipes) {
    try {`;

  content = content.replace(oldLoop, newLoop);

  // Trouver et fermer le try-catch
  const elseNotFoundPattern = /(\s+} else \{\s+console\.log\(`⚠️[^`]+`\);\s+notFound\+\+;\s+})\s+(}\s+console\.log\('\\n📊)/;

  content = content.replace(elseNotFoundPattern, `$1
    } catch (error) {
      failed++;
      const errorMsg = error instanceof Error ? error.message : String(error);
      const equipeDesc = \`\${equipe.nom} (Rang \${equipe.rang})\`;
      errors.push({ equipe: equipeDesc, error: errorMsg });
      console.error(\`❌ Erreur lors de la mise à jour de \${equipeDesc}: \${errorMsg}\`);
    }
  }

  $2`);

  // Ajouter le compte des erreurs dans le résumé
  const summaryPattern = /(if \(notFound > 0\) \{\s+console\.log\(`   ⚠️  \$\{notFound\}[^`]+`\);\s+})/;
  content = content.replace(summaryPattern, `$1
  if (failed > 0) {
    console.log(\`   ❌ \${failed} équipe(s) en erreur\`);
  }

  // Si des erreurs se sont produites, lever une exception
  if (errors.length > 0) {
    throw new Error(
      \`\${errors.length} erreur(s) lors de la mise à jour:\\n\${errors.map(e => \`  - \${e.equipe}: \${e.error}\`).join('\\n')}\`
    );
  }`);

  console.log('  ✅ Try-catch ajouté à updateEquipesInFirebase');
  return content;
}

// Fonction pour ajouter la validation dans main()
function addValidationToMain(content, isMatchScript) {
  const validationFunc = isMatchScript ? 'validateMatchsData' : 'validateClassementData';
  const dataVar = isMatchScript ? 'matchs' : 'equipes';
  const minCount = isMatchScript ? '10' : '8';

  // Vérifier si validation déjà présente
  if (content.includes(`${validationFunc}(${dataVar}`)) {
    console.log('  ⏭️  Validation déjà présente');
    return content;
  }

  // Pattern pour trouver l'endroit où insérer la validation
  const pattern = isMatchScript
    ? /(console\.log\(`\\n✅ \$\{matchs\.length\} matchs trouvés\\n`\);)\s+(if \(matchs\.length === 0\) \{[\s\S]*?return;\s+\})\s+(\/\/ \d+\. Mettre à jour)/
    : /(console\.log\(`\\n✅ \$\{equipes\.length\} équipes trouvées dans le classement\\n`\);)\s+(if \(equipes\.length === 0\) \{[\s\S]*?return;\s+\})\s+(\/\/ \d+\. Mettre à jour)/;

  const validation = `
    // Validation des données scrapées
    console.log('🔍 Validation des données scrapées...');
    const validation = ${validationFunc}(${dataVar}, ${minCount});

    if (validation.warnings.length > 0) {
      console.log('\\n⚠️  Avertissements :');
      validation.warnings.forEach(warning => console.log(\`   \${warning}\`));
    }

    if (!validation.isValid) {
      console.log('\\n❌ Erreurs de validation :');
      validation.errors.forEach(error => console.log(\`   \${error}\`));
      throw new Error('Validation des données échouée - données non fiables, mise à jour annulée');
    }

    console.log('✅ Validation réussie\\n');

    $3`;

  content = content.replace(pattern, `$1\n$2\n${validation}`);

  console.log('  ✅ Validation ajoutée à main()');
  return content;
}

// Fonction principale
function processFile(filePath) {
  console.log(`\n📄 Traitement de ${path.basename(filePath)}...`);

  let content = fs.readFileSync(filePath, 'utf-8');
  const isMatchScript = filePath.includes('update-matchs-');
  const isClassementScript = filePath.includes('update-classement-');

  // Étape 1: Ajouter l'import
  content = addValidationImport(content);

  // Étape 2: Ajouter try-catch
  if (isMatchScript) {
    content = addTryCatchToMatchUpdate(content);
  } else if (isClassementScript) {
    content = addTryCatchToClassementUpdate(content);
  }

  // Étape 3: Ajouter validation
  if (isMatchScript || isClassementScript) {
    content = addValidationToMain(content, isMatchScript);
  }

  // Écrire le fichier modifié
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`✅ ${path.basename(filePath)} traité avec succès`);
}

// Exécution
console.log('🔧 Application des corrections de sécurité...\n');

const matchFiles = glob.sync(path.join(__dirname, '../update/update-matchs-*.ts'));
const classementFiles = glob.sync(path.join(__dirname, '../update/update-classement-*.ts'));

console.log(`📊 ${matchFiles.length} fichiers de matchs trouvés`);
console.log(`📊 ${classementFiles.length} fichiers de classement trouvés\n`);

// Traiter tous les fichiers
[...matchFiles, ...classementFiles].forEach(processFile);

console.log('\n🎉 Tous les fichiers ont été traités !');
