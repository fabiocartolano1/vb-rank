/**
 * Script pour mettre à jour tous les workflows GitHub Actions
 * pour qu'ils utilisent le service account PROD
 */

const fs = require('fs');
const path = require('path');

const workflowsDir = path.join(__dirname, '../../.github/workflows');
const files = fs.readdirSync(workflowsDir).filter(f => f.startsWith('update-') && f.endsWith('.yml'));

console.log(`🔄 Mise à jour de ${files.length} workflows...\n`);

let updated = 0;

files.forEach(file => {
  const filePath = path.join(workflowsDir, file);
  let content = fs.readFileSync(filePath, 'utf-8');

  // Vérifier si déjà mis à jour
  if (content.includes('Setup service account')) {
    console.log(`⏭️  ${file} - Déjà mis à jour`);
    return;
  }

  // Trouver la section "Setup environment variables"
  const oldStep = `- name: Setup environment variables
        run: |
          echo "\${{ secrets.ENV_FILE }}" > .env`;

  if (!content.includes(oldStep)) {
    console.log(`⚠️  ${file} - Pattern non trouvé, ignoré`);
    return;
  }

  // Remplacer par la nouvelle configuration
  const newStep = `- name: Setup service account
        run: |
          echo '\${{ secrets.FIREBASE_SERVICE_ACCOUNT_PROD }}' > service-account-prod.json`;

  content = content.replace(oldStep, newStep);

  // Ajouter le nettoyage après l'étape de mise à jour
  // Trouver la section Upload logs
  const uploadLogsIndex = content.indexOf('- name: Upload logs');
  if (uploadLogsIndex > -1) {
    const cleanupStep = `
      - name: Cleanup service account
        if: always()
        run: |
          rm -f service-account-prod.json

`;
    content = content.slice(0, uploadLogsIndex) + cleanupStep + content.slice(uploadLogsIndex);
  }

  fs.writeFileSync(filePath, content);
  console.log(`✅ ${file}`);
  updated++;
});

console.log(`\n✨ Mise à jour terminée !`);
console.log(`   ✅ Mis à jour: ${updated}`);
console.log(`\n📝 N'oubliez pas de créer le secret FIREBASE_SERVICE_ACCOUNT_PROD sur GitHub !`);
