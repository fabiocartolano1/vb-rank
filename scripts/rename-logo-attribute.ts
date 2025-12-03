import { getFirestoreAdmin } from './config/firebase-admin-config.js';

console.log('📁 Chargement de la configuration Firebase Admin pour Le Crès...');

async function renameLogoAttribute() {
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

      // Vérifier si l'équipe a un attribut 'logoUrl'
      if (data.logoUrl !== undefined) {
        console.log(`🔄 Traitement de l'équipe: ${data.nom || doc.id}`);
        console.log(`   Renommage: logoUrl → logo_old`);
        console.log(`   Valeur: ${data.logoUrl}`);

        // Créer la mise à jour: ajouter logo_old et supprimer logoUrl
        const updateData: any = {
          logo_old: data.logoUrl,
          logoUrl: null, // On supprime l'ancien attribut en le mettant à null
        };

        batch.update(doc.ref, updateData);
        updatedCount++;
      } else {
        console.log(`⏭️  Équipe "${data.nom || doc.id}" n'a pas d'attribut 'logoUrl', passage`);
        skippedCount++;
      }
    }

    // Exécuter toutes les mises à jour en batch
    if (updatedCount > 0) {
      console.log(`\n💾 Enregistrement des modifications...`);
      await batch.commit();
      console.log(`✅ ${updatedCount} équipes mises à jour avec succès`);
    }

    if (skippedCount > 0) {
      console.log(`⏭️  ${skippedCount} équipes ignorées (pas d'attribut 'logoUrl')`);
    }

    console.log('\n✨ Script terminé avec succès');
    process.exit(0);

  } catch (error) {
    console.error('❌ Erreur lors de l\'exécution du script:', error);
    process.exit(1);
  }
}

// Exécuter le script
renameLogoAttribute();
