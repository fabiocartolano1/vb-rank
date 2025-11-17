const fs = require('fs');
const path = require('path');

const workflowsDir = path.join(__dirname, '../../.github/workflows');
const files = fs.readdirSync(workflowsDir).filter(f => f.endsWith('.yml'));

console.log('🔧 Ajout du cache npm aux workflows GitHub Actions...\n');

let updated = 0;
let skipped = 0;

files.forEach(file => {
  const filePath = path.join(workflowsDir, file);
  let content = fs.readFileSync(filePath, 'utf-8');

  // Check if cache is already added
  if (content.includes("cache: 'npm'")) {
    console.log(`⏭️  ${file} - Déjà à jour`);
    skipped++;
    return;
  }

  // Add cache to Setup Node.js step
  const oldPattern = `      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'`;

  const newPattern = `      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'`;

  if (!content.includes(oldPattern)) {
    console.log(`⚠️  ${file} - Pattern non trouvé`);
    return;
  }

  content = content.replace(oldPattern, newPattern);
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`✅ ${file} - Mis à jour`);
  updated++;
});

console.log('\n📊 Résumé :');
console.log(`   ✅ ${updated} fichier(s) mis à jour`);
console.log(`   ⏭️  ${skipped} fichier(s) déjà à jour`);
console.log('\n🎉 Terminé !');
