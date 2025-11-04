import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc } from 'firebase/firestore';

// Importer l'environnement de développement
const devEnv = require('../src/environments/environment.development');

// Initialiser Firebase
const app = initializeApp(devEnv.environment.firebase);
const db = getFirestore(app);

// Définition des nouveaux championnats jeunes
const championnatsJeunes = [
  {
    id: 'm18-m',
    nom: 'M18M',
    url: '',
    equipe: 'M18M'
  },
  {
    id: 'bfc',
    nom: 'BFC',
    url: '',
    equipe: 'BFC'
  },
  {
    id: 'bmb',
    nom: 'BMB',
    url: '',
    equipe: 'BMB'
  },
  {
    id: 'mfd',
    nom: 'MFD',
    url: '',
    equipe: 'MFD'
  },
  {
    id: 'mmb',
    nom: 'MMB',
    url: '',
    equipe: 'MMB'
  },
  {
    id: 'cfd',
    nom: 'CFD',
    url: '',
    equipe: 'CFD'
  }
];

async function addJeunesChampionnats() {
  console.log('🏐 Ajout des championnats jeunes dans Firebase...\n');
  console.log('📡 Connexion à la base DEV (vb-rank)...\n');

  try {
    let successCount = 0;
    let errorCount = 0;

    for (const championnat of championnatsJeunes) {
      try {
        const { id, ...data } = championnat;
        const docRef = doc(db, 'championnats', id);
        await setDoc(docRef, data);
        console.log(`✅ Championnat créé: ${championnat.nom} (ID: ${id})`);
        successCount++;
      } catch (error) {
        console.error(`❌ Erreur pour ${championnat.nom}:`, error);
        errorCount++;
      }
    }

    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║  📊 Résumé de l\'ajout                                      ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    console.log(`✅ Championnats créés: ${successCount}`);
    if (errorCount > 0) {
      console.log(`❌ Erreurs: ${errorCount}`);
    }

    console.log('\n📝 Notes importantes:');
    console.log('   1. Renseigner les URLs de scraping dans Firebase Console');
    console.log('   2. Créer les équipes correspondantes si nécessaire');
    console.log('   3. Vérifier les noms des championnats et les ajuster si besoin');
    console.log('\n💡 Championnats ajoutés:');
    championnatsJeunes.forEach(c => {
      console.log(`   - ${c.nom} (${c.id})`);
    });

    console.log('\n✨ Terminé!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Erreur fatale lors de l\'initialisation:', error);
    process.exit(1);
  }
}

// Exécuter le script
addJeunesChampionnats();
