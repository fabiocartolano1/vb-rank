import { initLogger } from '../../../utils/logger';

/**
 * Script orchestrateur pour lancer tous les smart-updates jeunes en séquence
 * Avantages :
 * - Un seul processus Node.js
 * - Partage de cache et dépendances
 * - Logs centralisés
 * - Vue d'ensemble de toutes les mises à jour
 */

interface UpdateResult {
  championnat: string;
  success: boolean;
  duration: number;
  error?: string;
}

async function runSmartUpdate(championnat: string, scriptFile: string): Promise<UpdateResult> {
  const startTime = Date.now();
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🏐 Démarrage: ${championnat}`);
  console.log('='.repeat(60));

  try {
    // Lancer le script dans un processus enfant pour isoler l'exécution
    const { exec } = await import('child_process');
    const path = await import('path');
    const scriptPath = path.join(__dirname, scriptFile);

    return new Promise((resolve) => {
      const child = exec(`npx tsx "${scriptPath}"`, {
        cwd: __dirname,
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer pour les logs
      });

      // Afficher stdout et stderr en temps réel
      if (child.stdout) {
        child.stdout.on('data', (data) => {
          process.stdout.write(data);
        });
      }

      if (child.stderr) {
        child.stderr.on('data', (data) => {
          process.stderr.write(data);
        });
      }

      child.on('close', (code) => {
        const duration = Date.now() - startTime;

        if (code === 0) {
          console.log(`\n✅ ${championnat} terminé avec succès (${(duration / 1000).toFixed(2)}s)`);
          resolve({
            championnat,
            success: true,
            duration,
          });
        } else {
          console.error(`\n❌ ${championnat} a échoué (code: ${code})`);
          resolve({
            championnat,
            success: false,
            duration,
            error: `Exit code ${code}`,
          });
        }
      });

      child.on('error', (error) => {
        const duration = Date.now() - startTime;
        console.error(`\n❌ ${championnat} erreur de processus:`, error.message);
        resolve({
          championnat,
          success: false,
          duration,
          error: error.message,
        });
      });
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`\n❌ ${championnat} a échoué:`, error.message);

    return {
      championnat,
      success: false,
      duration,
      error: error.message,
    };
  }
}

async function main() {
  const globalStartTime = Date.now();
  const logger = initLogger('run-all-smart-updates');

  console.log('\n' + '='.repeat(60));
  console.log('🚀 MISE À JOUR SMART - TOUS LES CHAMPIONNATS JEUNES');
  console.log('='.repeat(60));
  console.log(`📝 Logs: ${logger.getLogFilePath()}\n`);

  const championnats = [
    { nom: 'Benjamines Féminin (BFC)', script: 'smart-update-bfc.ts' },
    { nom: 'Benjamins Masculin (BMB)', script: 'smart-update-bmb.ts' },
    { nom: 'Cadettes Féminin (CFD)', script: 'smart-update-cfd.ts' },
    { nom: 'Minimes Féminin (MFD)', script: 'smart-update-mfd.ts' },
    { nom: 'Minimes Masculin (MMB)', script: 'smart-update-mmb.ts' },
    { nom: 'Moins 18 Masculin (M18M)', script: 'smart-update-m18m.ts' },
  ];

  const results: UpdateResult[] = [];

  // Exécuter tous les scripts en séquence
  for (const champ of championnats) {
    const result = await runSmartUpdate(champ.nom, champ.script);
    results.push(result);

    // Pause de 2 secondes entre chaque script pour éviter de surcharger Firebase
    if (championnats.indexOf(champ) < championnats.length - 1) {
      console.log('\n⏳ Pause de 2 secondes...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  // Résumé final
  const totalDuration = Date.now() - globalStartTime;
  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;

  console.log('\n' + '='.repeat(60));
  console.log('📊 RÉSUMÉ GLOBAL');
  console.log('='.repeat(60));

  results.forEach(result => {
    const icon = result.success ? '✅' : '❌';
    const duration = (result.duration / 1000).toFixed(2);
    console.log(`${icon} ${result.championnat.padEnd(35)} ${duration}s`);
    if (result.error) {
      console.log(`   ⚠️  Erreur: ${result.error}`);
    }
  });

  console.log('\n' + '-'.repeat(60));
  console.log(`✅ Réussis: ${successCount}/${results.length}`);
  console.log(`❌ Échecs: ${failCount}/${results.length}`);
  console.log(`⏱️  Durée totale: ${(totalDuration / 1000).toFixed(2)}s`);
  console.log('='.repeat(60));

  // Exit code basé sur les résultats
  if (failCount > 0) {
    console.error(`\n⚠️  ${failCount} championnat(s) ont échoué`);
    process.exit(1);
  } else {
    console.log('\n🎉 Tous les championnats ont été mis à jour avec succès !');
    process.exit(0);
  }
}

main().catch((error) => {
  console.error('\n❌ Erreur fatale dans l\'orchestrateur:', error);
  process.exit(1);
});
