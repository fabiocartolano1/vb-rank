import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

async function fixImports() {
  // Trouver tous les fichiers TypeScript dans volleyball
  const files = glob.sync('scripts/volleyball/**/*.ts', {
    ignore: ['node_modules/**'],
    cwd: path.join(__dirname, '..')
  });

  console.log(`🔍 ${files.length} fichiers trouvés\n`);

  let totalChanges = 0;

  for (const file of files) {
    const filePath = path.join(__dirname, '..', file);
    let content = fs.readFileSync(filePath, 'utf-8');
    const originalContent = content;

    // Calculer le chemin relatif vers les dossiers config et utils
    // De scripts/volleyball/adultes/smart-update/ vers scripts/ = ../../../
    const fileDir = path.dirname(filePath);
    const scriptsDir = path.join(__dirname);
    const relativeToScripts = path.relative(fileDir, scriptsDir);
    const depth = relativeToScripts.split(path.sep).filter(p => p === '..').length;
    const prefix = '../'.repeat(depth + 1);

    // Remplacer les imports (tous les patterns possibles)
    content = content.replace(/from ['"]\.\.+\/config\/firebase-config['"]/g, `from '${prefix}config/firebase-config'`);
    content = content.replace(/from ['"]\.\.+\/utils\/logger['"]/g, `from '${prefix}utils/logger'`);
    content = content.replace(/from ['"]\.\.+\/utils\/hash-detection['"]/g, `from '${prefix}utils/hash-detection'`);

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf-8');
      console.log(`✅ ${file}`);
      totalChanges++;
    }
  }

  console.log(`\n🎉 ${totalChanges} fichiers mis à jour`);
}

fixImports().catch(console.error);
