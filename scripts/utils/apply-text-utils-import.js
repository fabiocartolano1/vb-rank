/**
 * Script pour ajouter automatiquement l'import de text-utils dans tous les scripts
 * et supprimer les fonctions locales toTitleCase et normalizeTeamName
 */

const fs = require('fs');
const path = require('path');

// Fonction récursive pour trouver tous les fichiers .ts
function findTsFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      findTsFiles(filePath, fileList);
    } else if (file.endsWith('.ts')) {
      fileList.push(filePath);
    }
  });
  return fileList;
}

const files = findTsFiles('scripts/volleyball');

console.log(`📁 ${files.length} fichiers TypeScript trouvés\n`);

let updatedCount = 0;
let skippedCount = 0;

files.forEach(filePath => {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Vérifier si le fichier contient normalizeTeamName ou toTitleCase
  if (!content.includes('normalizeTeamName') && !content.includes('toTitleCase')) {
    skippedCount++;
    return;
  }

  // Vérifier si l'import text-utils existe déjà
  if (content.includes("from '../../../utils/text-utils'")) {
    console.log(`⏭️  ${path.basename(filePath)} - Import déjà présent`);
    skippedCount++;
    return;
  }

  console.log(`🔧 ${path.basename(filePath)}`);

  // Ajouter l'import text-utils après l'import logger
  const loggerImportRegex = /(import { initLogger } from ['"]\.\.\/\.\.\/\.\.\/utils\/logger['"];?\n)/;
  if (loggerImportRegex.test(content)) {
    content = content.replace(
      loggerImportRegex,
      "$1import { toTitleCase, normalizeTeamName } from '../../../utils/text-utils';\n"
    );
    modified = true;
  }

  // Supprimer la fonction toTitleCase locale
  const toTitleCaseRegex = /const toTitleCase = \(str: string\): string => \{[^}]+\};?\n\n?/g;
  if (toTitleCaseRegex.test(content)) {
    content = content.replace(toTitleCaseRegex, '');
    modified = true;
  }

  // Supprimer la fonction normalizeTeamName locale (simple version)
  const simpleNormalizeRegex = /function normalizeTeamName\(name: string\): string \{\s*return name\.trim\(\)\.toUpperCase\(\);\s*\}\n\n?/g;
  if (simpleNormalizeRegex.test(content)) {
    content = content.replace(simpleNormalizeRegex, '');
    modified = true;
  }

  // Supprimer la fonction normalizeTeamName locale (version avec accents)
  const accentNormalizeRegex = /function normalizeTeamName\(name: string\): string \{\s*return name[\s\S]*?\.replace\(\/\\s\+\/g, ' '\);[\s\S]*?\}\n\n?/g;
  if (accentNormalizeRegex.test(content)) {
    content = content.replace(accentNormalizeRegex, '');
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`   ✅ Mis à jour`);
    updatedCount++;
  } else {
    console.log(`   ⚠️  Aucune modification nécessaire`);
    skippedCount++;
  }
});

console.log(`\n📊 Résumé :`);
console.log(`   ✅ ${updatedCount} fichier(s) mis à jour`);
console.log(`   ⏭️  ${skippedCount} fichier(s) ignorés`);
