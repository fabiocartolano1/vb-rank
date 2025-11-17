const fs = require('fs');
const path = require('path');

const scriptsDir = path.join(__dirname, '../update');

// Tous les fichiers à modifier
const files = [
  'update-matchs-r2m.ts',
  'update-matchs-r2f.ts',
  'update-matchs-n3.ts',
  'update-matchs-pnf.ts',
  'update-matchs-pnm.ts',
  'update-matchs-m18m.ts',
  'update-matchs-bfc.ts',
  'update-matchs-bmb.ts',
  'update-matchs-cfd.ts',
  'update-matchs-mfd.ts',
  'update-matchs-mmb.ts',
  'update-classement-r2f.ts',
  'update-classement-n3.ts',
  'update-classement-pnf.ts',
  'update-classement-pnm.ts',
  'update-classement-m18m.ts',
  'update-classement-bfc.ts',
  'update-classement-bmb.ts',
  'update-classement-cfd.ts',
  'update-classement-mfd.ts',
  'update-classement-mmb.ts',
];

const oldCode = `  if (!projectId.includes('vb-rank')) {
    throw new Error('⚠️  ATTENTION: Le projet Firebase ne semble pas être le bon !');
  }

  // Vérifier que nous sommes en développement
  const isDev = process.env.NODE_ENV !== 'production';
  console.log(\`   Environnement: \${isDev ? 'développement' : 'production'}\`);`;

const newCode = `  // Vérifier que c'est un projet Firebase valide (dev ou prod)
  const validProjects = ['vb-rank', 'le-cres-vb'];
  if (!validProjects.some(p => projectId.includes(p))) {
    throw new Error('⚠️  ATTENTION: Le projet Firebase ne semble pas être valide !');
  }

  // Déterminer l'environnement
  const isProd = projectId.includes('le-cres-vb');
  console.log(\`   Environnement: \${isProd ? 'production' : 'développement'}\`);`;

console.log('🔧 Mise à jour de la vérification d\'environnement...\n');
console.log('═══════════════════════════════════════════════════════\n');

let updated = 0;
let skipped = 0;
let notFound = 0;

files.forEach(file => {
  const filePath = path.join(scriptsDir, file);

  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  ${file} n'existe pas`);
    notFound++;
    return;
  }

  console.log(`📄 Traitement de ${file}...`);
  let content = fs.readFileSync(filePath, 'utf-8');

  if (content.includes("const validProjects = ['vb-rank', 'le-cres-vb']")) {
    console.log('  ⏭️  Déjà à jour\n');
    skipped++;
    return;
  }

  if (!content.includes("if (!projectId.includes('vb-rank'))")) {
    console.log('  ⚠️  Pattern non trouvé\n');
    notFound++;
    return;
  }

  content = content.replace(oldCode, newCode);
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log('  ✅ Mis à jour\n');
  updated++;
});

console.log('═══════════════════════════════════════════════════════');
console.log(`\n📊 Résumé :`);
console.log(`   ✅ ${updated} fichier(s) mis à jour`);
console.log(`   ⏭️  ${skipped} fichier(s) déjà à jour`);
console.log(`   ⚠️  ${notFound} fichier(s) non trouvés ou sans pattern`);
console.log(`\n🎉 Terminé !\n`);
