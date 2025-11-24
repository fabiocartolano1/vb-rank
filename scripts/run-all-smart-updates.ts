import { initLogger } from './utils/logger';

/**
 * Script orchestrateur GLOBAL pour lancer tous les smart-updates (jeunes + adultes)
 *
 * Avantages :
 * - Un seul processus Node.js pour tout
 * - Cache npm partagé
 * - Vue d'ensemble complète
 * - Logs centralisés
 */

interface UpdateResult {
  championnat: string;
  success: boolean;
  duration: number;
  error?: string;
}

interface ChampionnatGroup {
  nom: string;
  scripts: { nom: string; path: string }[];
}

async function runSmartUpdate(championnat: string, scriptPath: string): Promise<UpdateResult> {
  const startTime = Date.now();
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🏐 Démarrage: ${championnat}`);
  console.log('='.repeat(60));

  try {
    const { exec } = await import('child_process');
    const path = await import('path');
    const fullPath = path.join(__dirname, scriptPath);

    return new Promise((resolve) => {
      const child = exec(`npx tsx "${fullPath}"`, {
        cwd: __dirname,
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
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
  const logger = initLogger('run-all-smart-updates-global');

  console.log('\n' + '='.repeat(70));
  console.log('🚀 MISE À JOUR SMART - TOUS LES CHAMPIONNATS (JEUNES + ADULTES)');
  console.log('='.repeat(70));
  console.log(`📝 Logs: ${logger.getLogFilePath()}\n`);

  const groups: ChampionnatGroup[] = [
    {
      nom: '👶 CHAMPIONNATS JEUNES',
      scripts: [
        { nom: 'Benjamines Féminin (BFC)', path: 'volleyball/jeunes/smart-update/smart-update-bfc.ts' },
        { nom: 'Benjamins Masculin (BMB)', path: 'volleyball/jeunes/smart-update/smart-update-bmb.ts' },
        { nom: 'Cadettes Féminin (CFD)', path: 'volleyball/jeunes/smart-update/smart-update-cfd.ts' },
        { nom: 'Minimes Féminin (MFD)', path: 'volleyball/jeunes/smart-update/smart-update-mfd.ts' },
        { nom: 'Minimes Masculin (MMB)', path: 'volleyball/jeunes/smart-update/smart-update-mmb.ts' },
        { nom: 'Moins 18 Masculin (M18M)', path: 'volleyball/jeunes/smart-update/smart-update-m18m.ts' },
      ],
    },
    {
      nom: '👨 CHAMPIONNATS ADULTES',
      scripts: [
        { nom: 'Nationale 3 (N3)', path: 'volleyball/adultes/smart-update/smart-update-n3.ts' },
        { nom: 'Pré-Nationale Féminin (PNF)', path: 'volleyball/adultes/smart-update/smart-update-pnf.ts' },
        { nom: 'Pré-Nationale Masculin (PNM)', path: 'volleyball/adultes/smart-update/smart-update-pnm.ts' },
        { nom: 'Régionale 2 Féminin (R2F)', path: 'volleyball/adultes/smart-update/smart-update-r2f.ts' },
        { nom: 'Régionale 2 Masculin (R2M)', path: 'volleyball/adultes/smart-update/smart-update-r2m.ts' },
      ],
    },
  ];

  const allResults: UpdateResult[] = [];
  let totalScripts = 0;

  // Compter le nombre total de scripts
  for (const group of groups) {
    totalScripts += group.scripts.length;
  }

  console.log(`📊 ${totalScripts} championnats à mettre à jour\n`);

  // Exécuter tous les groupes
  for (const group of groups) {
    console.log('\n' + '━'.repeat(70));
    console.log(group.nom);
    console.log('━'.repeat(70));

    for (const script of group.scripts) {
      const result = await runSmartUpdate(script.nom, script.path);
      allResults.push(result);

      // Pause de 2 secondes entre chaque script
      const isLastScriptOfGroup = script === group.scripts[group.scripts.length - 1];
      const isLastGroup = group === groups[groups.length - 1];

      if (!isLastScriptOfGroup || !isLastGroup) {
        console.log('\n⏳ Pause de 2 secondes...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }

  // Résumé final
  const totalDuration = Date.now() - globalStartTime;
  const successCount = allResults.filter(r => r.success).length;
  const failCount = allResults.filter(r => !r.success).length;

  console.log('\n' + '='.repeat(70));
  console.log('📊 RÉSUMÉ GLOBAL - TOUS CHAMPIONNATS');
  console.log('='.repeat(70));

  // Résumé par groupe
  for (const group of groups) {
    console.log(`\n${group.nom}:`);
    for (const script of group.scripts) {
      const result = allResults.find(r => r.championnat === script.nom);
      if (result) {
        const icon = result.success ? '✅' : '❌';
        const duration = (result.duration / 1000).toFixed(2);
        console.log(`  ${icon} ${script.nom.padEnd(40)} ${duration}s`);
        if (result.error) {
          console.log(`     ⚠️  Erreur: ${result.error}`);
        }
      }
    }
  }

  console.log('\n' + '-'.repeat(70));
  console.log(`✅ Réussis: ${successCount}/${totalScripts} (${((successCount / totalScripts) * 100).toFixed(1)}%)`);
  console.log(`❌ Échecs: ${failCount}/${totalScripts} (${((failCount / totalScripts) * 100).toFixed(1)}%)`);
  console.log(`⏱️  Durée totale: ${(totalDuration / 1000).toFixed(2)}s`);
  console.log(`⏱️  Durée moyenne: ${(totalDuration / totalScripts / 1000).toFixed(2)}s par championnat`);
  console.log('='.repeat(70));

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
