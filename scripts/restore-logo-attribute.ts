import { getFirestoreAdmin } from './config/firebase-admin-config.js';

console.log('📁 Chargement de la configuration Firebase Admin pour Le Crès...');

async function restoreLogoAttribute() {
  try {
    // Initialiser Firebase Admin et obtenir Firestore
    const db = getFirestoreAdmin();
    console.log('✅ Connexion à Firestore réussie\n');

    // Récupérer toutes les équipes
    console.log('🔍 Récupération de toutes les équipes...');
    const equipesSnapshot = await db.collection('equipes').get();

    if (equipesSnapshot.empty) {
      console.log('❌ Aucune équipe trouvée dans la collection');
      return;
    }

    console.log(`📊 ${equipesSnapshot.size} équipes trouvées\n`);

    let updatedCount = 0;
    let skippedCount = 0;
    const batch = db.batch();

    // Parcourir toutes les équipes
    for (const doc of equipesSnapshot.docs) {
      const data = doc.data();

      // Vérifier si l'équipe a un attribut 'logo_old'
      if (data.logo_old !== undefined) {
        console.log(`🔄 Traitement de l'équipe: ${data.nom || doc.id}`);
        console.log(`   Restauration: logo_old → logoUrl`);
        console.log(`   Valeur: ${data.logo_old}`);

        // Créer la mise à jour: restaurer logoUrl et supprimer logo_old
        const updateData: any = {
          logoUrl: data.logo_old,
          logo_old: null, // On supprime logo_old en le mettant à null
        };

        batch.update(doc.ref, updateData);
        updatedCount++;
      } else {
        console.log(`⏭️  Équipe "${data.nom || doc.id}" n'a pas d'attribut 'logo_old', passage`);
        skippedCount++;
      }
    }

    // Exécuter toutes les mises à jour en batch
    if (updatedCount > 0) {
      console.log(`\n💾 Enregistrement des modifications...`);
      await batch.commit();
      console.log(`✅ ${updatedCount} équipes restaurées avec succès`);
    }

    if (skippedCount > 0) {
      console.log(`⏭️  ${skippedCount} équipes ignorées (pas d'attribut 'logo_old')`);
    }

    console.log('\n✨ Script terminé avec succès');
    process.exit(0);

  } catch (error) {
    console.error('❌ Erreur lors de l\'exécution du script:', error);
    process.exit(1);
  }
}

// Exécuter le script
restoreLogoAttribute();
