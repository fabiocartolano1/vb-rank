/**
 * Script pour migrer tous les scripts update vers Firebase Admin SDK
 *
 * Remplace uniquement l'initialisation Firebase, les APIs Firestore restent compatibles
 */

const fs = require('fs');
const path = require('path');

const updateDir = path.join(__dirname, '../update');
const files = fs.readdirSync(updateDir).filter(f => f.endsWith('.ts') && !f.includes('backup'));

console.log(`🔄 Migration de ${files.length} fichiers vers Firebase Admin SDK...\n`);

let converted = 0;
let skipped = 0;

files.forEach(file => {
  const filePath = path.join(updateDir, file);
  let content = fs.readFileSync(filePath, 'utf-8');

  // Vérifier si déjà converti
  if (content.includes('firestore-wrapper')) {
    console.log(`⏭️  ${file} - Déjà converti`);
    skipped++;
    return;
  }

  // ÉTAPE 1 : Remplacer les imports
  const oldImports = [
    `import { initializeApp } from 'firebase/app';`,
    `import { getFirestore, collection, getDocs, query, where, updateDoc, doc } from 'firebase/firestore';`,
    `import { firebaseConfig } from '../config/firebase-config';`
  ].join('\n');

  const newImports = `import { getFirestore } from '../config/firestore-wrapper';`;

  if (content.includes(oldImports)) {
    content = content.replace(oldImports, newImports);
  } else {
    // Essayer ligne par ligne
    content = content.replace(`import { initializeApp } from 'firebase/app';\n`, '');
    content = content.replace(`import { getFirestore, collection, getDocs, query, where, updateDoc, doc } from 'firebase/firestore';\n`, '');
    content = content.replace(`import { firebaseConfig } from '../config/firebase-config';\n`, '');

    // Ajouter le nouvel import après les autres imports
    const firstImportEnd = content.indexOf(';\n') + 2;
    content = content.slice(0, firstImportEnd) + `import { getFirestore } from '../config/firestore-wrapper';\n` + content.slice(firstImportEnd);
  }

  // ÉTAPE 2 : Remplacer l'initialisation Firebase
  const oldInit = `// Initialiser Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);`;

  const newInit = `// Initialiser Firebase Admin SDK
const db = getFirestore();`;

  content = content.replace(oldInit, newInit);

  // ÉTAPE 3 : Sauvegarder
  fs.writeFileSync(filePath, content);
  console.log(`✅ ${file}`);
  converted++;
});

console.log(`\n✨ Migration terminée !`);
console.log(`   ✅ Convertis: ${converted}`);
console.log(`   ⏭️  Ignorés: ${skipped}`);
console.log(`\n📝 Les scripts utilisent maintenant Firebase Admin SDK qui contourne les règles de sécurité.`);
console.log(`   Pour les utiliser, vous devez définir FIREBASE_SERVICE_ACCOUNT_PROD ou créer service-account-prod.json`);
