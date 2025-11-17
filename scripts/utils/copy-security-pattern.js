const fs = require('fs');
const path = require('path');

// Chemins
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

function processMatchFile(filePath) {
  console.log(`\n📄 Traitement de ${path.basename(filePath)}...`);
  let content = fs.readFileSync(filePath, 'utf-8');
  let modified = false;

  // 1. Ajouter l'import
  if (!content.includes("from '../utils/validation'")) {
    content = content.replace(
      "import { initLogger } from '../utils/logger';",
      "import { initLogger } from '../utils/logger';\nimport { validateMatchsData } from '../utils/validation';"
    );
    console.log('  ✅ Import ajouté');
    modified = true;
  } else {
    console.log('  ⏭️  Import déjà présent');
  }

  // 2. Ajouter try-catch dans la boucle
  if (!content.includes('for (const match of matchs) {\n    try {')) {
    // Remplacer la déclaration des variables
    content = content.replace(
      /let updated = 0;\s+let notFound = 0;\s+let unchanged = 0;/,
      `let updated = 0;\n  let notFound = 0;\n  let unchanged = 0;\n  let failed = 0;\n  const errors: Array<{ match: string; error: string }> = [];`
    );

    // Ajouter le try après le for
    content = content.replace(
      'for (const match of matchs) {',
      'for (const match of matchs) {\n    try {'
    );

    // Trouver le dernier } else { console.log(\`⚠️ avant la fin de la boucle et ajouter le catch
    const lines = content.split('\n');
    let bracesCount = 0;
    let inForLoop = false;
    let insertIndex = -1;

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('for (const match of matchs)')) {
        inForLoop = true;
        bracesCount = 0;
      }

      if (inForLoop) {
        // Compter les accolades
        for (const char of lines[i]) {
          if (char === '{') bracesCount++;
          if (char === '}') bracesCount--;
        }

        // Si on trouve le } else { avec notFound++
        if (lines[i].includes('} else {') && i + 2 < lines.length && lines[i + 2].includes('notFound++')) {
          insertIndex = i + 3; // Après le notFound++; et le }
        }

        // Si bracesCount revient à 0, on est sorti de la boucle for
        if (bracesCount === 0 && insertIndex > -1) {
          // Insérer le catch juste avant cette ligne
          const catchBlock = `    } catch (error) {
      failed++;
      const errorMsg = error instanceof Error ? error.message : String(error);
      const matchDesc = \`J\${match.journee}: \${match.equipeDomicile} vs \${match.equipeExterieur}\`;
      errors.push({ match: matchDesc, error: errorMsg });
      console.error(\`❌ Erreur lors de la mise à jour de \${matchDesc}: \${errorMsg}\`);
    }`;
          lines.splice(i, 0, catchBlock);
          break;
        }
      }
    }

    content = lines.join('\n');

    // Ajouter le compte des erreurs dans le résumé
    content = content.replace(
      /(if \(notFound > 0\) \{\s+console\.log\(`   ⚠️[^}]+\}\s+)/,
      `$1  if (failed > 0) {
    console.log(\`   ❌ \${failed} match(s) en erreur\`);
  }

  // Si des erreurs se sont produites, lever une exception
  if (errors.length > 0) {
    throw new Error(
      \`\${errors.length} erreur(s) lors de la mise à jour:\\n\${errors.map(e => \`  - \${e.match}: \${e.error}\`).join('\\n')}\`
    );
  }
`
    );

    console.log('  ✅ Try-catch ajouté');
    modified = true;
  } else {
    console.log('  ⏭️  Try-catch déjà présent');
  }

  // 3. Ajouter la validation
  if (!content.includes('validateMatchsData(matchs')) {
    content = content.replace(
      /(console\.log\(`\\n✅ \$\{matchs\.length\} matchs trouvés\\n`\);)\s+(if \(matchs\.length === 0\)[\s\S]*?return;\s+\})\s+(\/\/ \d+\. Mettre à jour)/,
      `$1

    // 3. Valider les données scrapées
    console.log('🔍 Validation des données scrapées...');
    const validation = validateMatchsData(matchs, 10);

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

    $3`
    );
    console.log('  ✅ Validation ajoutée');
    modified = true;
  } else {
    console.log('  ⏭️  Validation déjà présente');
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`✅ Fichier modifié avec succès`);
  } else {
    console.log(`ℹ️  Aucune modification nécessaire`);
  }
}

function processClassementFile(filePath) {
  console.log(`\n📄 Traitement de ${path.basename(filePath)}...`);
  let content = fs.readFileSync(filePath, 'utf-8');
  let modified = false;

  // 1. Ajouter l'import
  if (!content.includes("from '../utils/validation'")) {
    content = content.replace(
      "import { initLogger } from '../utils/logger';",
      "import { initLogger } from '../utils/logger';\nimport { validateClassementData } from '../utils/validation';"
    );
    console.log('  ✅ Import ajouté');
    modified = true;
  } else {
    console.log('  ⏭️  Import déjà présent');
  }

  // 2. Ajouter try-catch dans la boucle (similaire aux matchs mais pour équipes)
  if (!content.includes('for (const equipe of equipes) {\n    try {')) {
    content = content.replace(
      /let updated = 0;\s+let notFound = 0;\s+let unchanged = 0;/,
      `let updated = 0;\n  let notFound = 0;\n  let unchanged = 0;\n  let failed = 0;\n  const errors: Array<{ equipe: string; error: string }> = [];`
    );

    content = content.replace(
      'for (const equipe of equipes) {',
      'for (const equipe of equipes) {\n    try {'
    );

    // Trouver et ajouter le catch (même logique que pour les matchs)
    const lines = content.split('\n');
    let bracesCount = 0;
    let inForLoop = false;
    let insertIndex = -1;

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('for (const equipe of equipes)')) {
        inForLoop = true;
        bracesCount = 0;
      }

      if (inForLoop) {
        for (const char of lines[i]) {
          if (char === '{') bracesCount++;
          if (char === '}') bracesCount--;
        }

        if (lines[i].includes('} else {') && i + 2 < lines.length && lines[i + 2].includes('notFound++')) {
          insertIndex = i + 3;
        }

        if (bracesCount === 0 && insertIndex > -1) {
          const catchBlock = `    } catch (error) {
      failed++;
      const errorMsg = error instanceof Error ? error.message : String(error);
      const equipeDesc = \`\${equipe.nom} (Rang \${equipe.rang})\`;
      errors.push({ equipe: equipeDesc, error: errorMsg });
      console.error(\`❌ Erreur lors de la mise à jour de \${equipeDesc}: \${errorMsg}\`);
    }`;
          lines.splice(i, 0, catchBlock);
          break;
        }
      }
    }

    content = lines.join('\n');

    content = content.replace(
      /(if \(notFound > 0\) \{\s+console\.log\(`   ⚠️[^}]+\}\s+)/,
      `$1  if (failed > 0) {
    console.log(\`   ❌ \${failed} équipe(s) en erreur\`);
  }

  // Si des erreurs se sont produites, lever une exception
  if (errors.length > 0) {
    throw new Error(
      \`\${errors.length} erreur(s) lors de la mise à jour:\\n\${errors.map(e => \`  - \${e.equipe}: \${e.error}\`).join('\\n')}\`
    );
  }
`
    );

    console.log('  ✅ Try-catch ajouté');
    modified = true;
  } else {
    console.log('  ⏭️  Try-catch déjà présent');
  }

  // 3. Ajouter la validation
  if (!content.includes('validateClassementData(equipes')) {
    content = content.replace(
      /(console\.log\(`\\n✅ \$\{equipes\.length\} équipes trouvées dans le classement\\n`\);)\s+(if \(equipes\.length === 0\)[\s\S]*?return;\s+\})\s+(\/\/ \d+\. Mettre à jour)/,
      `$1

    // 3. Valider les données scrapées
    console.log('🔍 Validation des données scrapées...');
    const validation = validateClassementData(equipes, 8);

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

    $3`
    );
    console.log('  ✅ Validation ajoutée');
    modified = true;
  } else {
    console.log('  ⏭️  Validation déjà présente');
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`✅ Fichier modifié avec succès`);
  } else {
    console.log(`ℹ️  Aucune modification nécessaire`);
  }
}

// Exécution
console.log('🔧 Application des corrections de sécurité à tous les scripts...\n');
console.log('═══════════════════════════════════════════════════════\n');

console.log('📦 SCRIPTS DE MATCHS\n');
matchFiles.forEach(file => {
  const filePath = path.join(scriptsDir, file);
  if (fs.existsSync(filePath)) {
    processMatchFile(filePath);
  } else {
    console.log(`\n⚠️  ${file} n'existe pas`);
  }
});

console.log('\n\n📦 SCRIPTS DE CLASSEMENT\n');
classementFiles.forEach(file => {
  const filePath = path.join(scriptsDir, file);
  if (fs.existsSync(filePath)) {
    processClassementFile(filePath);
  } else {
    console.log(`\n⚠️  ${file} n'existe pas`);
  }
});

console.log('\n═══════════════════════════════════════════════════════');
console.log('\n🎉 Traitement terminé !');
console.log('\n📝 Résumé :');
console.log(`   - ${matchFiles.length} scripts de matchs traités`);
console.log(`   - ${classementFiles.length} scripts de classement traités`);
console.log('\n⚠️  Note : Le script update-logos-jeunes.ts doit être traité manuellement\n');
