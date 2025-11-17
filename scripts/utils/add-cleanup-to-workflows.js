const fs = require('fs');
const path = require('path');

const workflowsDir = path.join(__dirname, '../../.github/workflows');
const files = fs.readdirSync(workflowsDir).filter(f => f.startsWith('update-') && f.endsWith('.yml'));

const cleanupStep = `
      - name: Cleanup service account
        if: always()
        run: |
          rm -f service-account-prod.json
`;

files.forEach(file => {
  const filePath = path.join(workflowsDir, file);
  let content = fs.readFileSync(filePath, 'utf-8');

  if (content.includes('Cleanup service account')) {
    console.log(`⏭️  ${file} - Déjà mis à jour`);
    return;
  }

  // Ajouter le cleanup avant l'étape Upload logs
  const uploadIndex = content.indexOf('      - name: Upload logs');
  if (uploadIndex > -1) {
    content = content.slice(0, uploadIndex) + cleanupStep + '\n' + content.slice(uploadIndex);
    fs.writeFileSync(filePath, content);
    console.log(`✅ ${file}`);
  } else {
    console.log(`⚠️  ${file} - Upload logs non trouvé`);
  }
});

console.log('\n✨ Terminé !');
