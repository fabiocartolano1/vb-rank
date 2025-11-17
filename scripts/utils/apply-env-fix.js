const fs = require('fs');
const path = require('path');

const scriptsDir = path.join(__dirname, '../update');

const files = fs.readdirSync(scriptsDir).filter(f => f.startsWith('update-') && f.endsWith('.ts'));

const oldPattern = `  if (!projectId.includes('vb-rank')) {
    throw new Error('⚠️  ATTENTION: Le projet Firebase ne semble pas être le bon !');
  }

  // Vérifier que nous sommes en développement
  const isDev = process.env.NODE_ENV !== 'production';
  console.log(\`   Environnement: \${isDev ? 'développement' : 'production'}\`);`;

const newPattern = `  // Vérifier que c'est un projet Firebase valide (dev ou prod)
  const validProjects = ['vb-rank', 'le-cres-vb'];
  if (!validProjects.some(p => projectId.includes(p))) {
    throw new Error('⚠️  ATTENTION: Le projet Firebase ne semble pas être valide !');
  }

  // Déterminer l'environnement
  const isProd = projectId.includes('le-cres-vb');
  console.log(\`   Environnement: \${isProd ? 'production' : 'développement'}\`);`;

let updated = 0;
let skipped = 0;
let notFound = 0;

console.log('🔧 Application du fix d\'environnement...\n');

files.forEach(file => {
  const filePath = path.join(scriptsDir, file);
  let content = fs.readFileSync(filePath, 'utf-8');

  // Skip if already updated
  if (content.includes("const validProjects = ['vb-rank', 'le-cres-vb']")) {
    console.log(`⏭️  ${file} - Déjà à jour`);
    skipped++;
    return;
  }

  // Skip if pattern not found
  if (!content.includes("if (!projectId.includes('vb-rank'))")) {
    console.log(`ℹ️  ${file} - Pattern non trouvé (probablement pas de verifyEnvironment)`);
    notFound++;
    return;
  }

  // Apply the fix
  const newContent = content.replace(oldPattern, newPattern);

  if (newContent === content) {
    console.log(`⚠️  ${file} - Remplacement échoué (vérifier les espaces)`);
    notFound++;
    return;
  }

  fs.writeFileSync(filePath, newContent, 'utf-8');
  console.log(`✅ ${file} - Mis à jour`);
  updated++;
});

console.log('\n📊 Résumé :');
console.log(`   ✅ ${updated} fichier(s) mis à jour`);
console.log(`   ⏭️  ${skipped} fichier(s) déjà à jour`);
console.log(`   ℹ️  ${notFound} fichier(s) sans verifyEnvironment ou échec`);
