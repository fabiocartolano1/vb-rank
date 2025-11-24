import * as fs from 'fs';
import * as path from 'path';

const championnats = [
  // Jeunes
  { code: 'bfc', nom: 'BFC', categorie: 'jeunes' },
  { code: 'bmb', nom: 'BMB', categorie: 'jeunes' },
  { code: 'cfd', nom: 'CFD', categorie: 'jeunes' },
  { code: 'mfd', nom: 'MFD', categorie: 'jeunes' },
  { code: 'mmb', nom: 'MMB', categorie: 'jeunes' },
  { code: 'm18m', nom: 'M18M', categorie: 'jeunes' },
  // Adultes
  { code: 'n3', nom: 'N3', categorie: 'adultes' },
  { code: 'pnf', nom: 'PNF', categorie: 'adultes' },
  { code: 'pnm', nom: 'PNM', categorie: 'adultes' },
  { code: 'r2f', nom: 'R2F', categorie: 'adultes' },
  { code: 'r2m', nom: 'R2M', categorie: 'adultes' },
];

const types = [
  { type: 'classement', emoji: '📊', label: 'Classement' },
  { type: 'matchs', emoji: '🏐', label: 'Matchs' },
];

const workflowTemplate = (nom: string, code: string, categorie: string, type: string, emoji: string, label: string) => `name: "[${label}] ${nom}"

on:
  workflow_dispatch:

jobs:
  update:
    runs-on: ubuntu-latest
    timeout-minutes: 5

    steps:
      - name: 📥 Checkout code
        uses: actions/checkout@v4

      - name: 📦 Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: 📚 Install dependencies
        run: npm ci

      - name: 🔐 Setup Firebase config
        run: |
          cat > .env << EOF
          FIREBASE_API_KEY=\${{ secrets.FIREBASE_API_KEY }}
          FIREBASE_AUTH_DOMAIN=\${{ secrets.FIREBASE_AUTH_DOMAIN }}
          FIREBASE_PROJECT_ID=\${{ secrets.FIREBASE_PROJECT_ID }}
          FIREBASE_STORAGE_BUCKET=\${{ secrets.FIREBASE_STORAGE_BUCKET }}
          FIREBASE_MESSAGING_SENDER_ID=\${{ secrets.FIREBASE_MESSAGING_SENDER_ID }}
          FIREBASE_APP_ID=\${{ secrets.FIREBASE_APP_ID }}
          FIREBASE_MEASUREMENT_ID=\${{ secrets.FIREBASE_MEASUREMENT_ID }}
          EOF

      - name: ${emoji} Update ${type} ${nom}
        run: npx tsx scripts/volleyball/${categorie}/update-${type}/update-${type}-${code}.ts

      - name: 📊 Upload logs (en cas d'échec)
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: logs-${type}-${code}-\${{ github.run_number }}
          path: scripts/logs/
          retention-days: 7
`;

console.log('🚀 Génération des workflows individuels...\n');

let count = 0;
for (const champ of championnats) {
  for (const typeConfig of types) {
    const fileName = `update-${typeConfig.type}-${champ.code}.yml`;
    const filePath = path.join(__dirname, '../.github/workflows', fileName);

    const content = workflowTemplate(
      champ.nom,
      champ.code,
      champ.categorie,
      typeConfig.type,
      typeConfig.emoji,
      typeConfig.label
    );

    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`✅ ${fileName}`);
    count++;
  }
}

console.log(`\n🎉 ${count} workflows créés avec succès !`);
