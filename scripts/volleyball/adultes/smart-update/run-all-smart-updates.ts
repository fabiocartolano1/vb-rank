import { initLogger } from '../../../utils/logger';

/**
 * Script orchestrateur pour lancer tous les smart-updates adultes en séquence
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
    const { exec } = await import('child_process');
    const path = await import('path');
    const scriptPath = path.join(__dirname, scriptFile);

    return new Promise((resolve) => {
      const child = exec(`npx tsx "${scriptPath}"`, {
        cwd: __dirname,
        maxBuffer: 10 * 1024 * 1024,
      });

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
  const logger = initLogger('run-all-smart-updates-adultes');

  console.log('\n' + '='.repeat(60));
  console.log('🚀 MISE À JOUR SMART - TOUS LES CHAMPIONNATS ADULTES');
  console.log('='.repeat(60));
  console.log(`📝 Logs: ${logger.getLogFilePath()}\n`);

  const championnats = [
    { nom: 'Nationale 3 (N3)', script: 'smart-update-n3.ts' },
    { nom: 'Pré-Nationale Féminin (PNF)', script: 'smart-update-pnf.ts' },
    { nom: 'Pré-Nationale Masculin (PNM)', script: 'smart-update-pnm.ts' },
    { nom: 'Régionale 2 Féminin (R2F)', script: 'smart-update-r2f.ts' },
    { nom: 'Régionale 2 Masculin (R2M)', script: 'smart-update-r2m.ts' },
  ];

  const results: UpdateResult[] = [];

  for (const champ of championnats) {
    const result = await runSmartUpdate(champ.nom, champ.script);
    results.push(result);

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
