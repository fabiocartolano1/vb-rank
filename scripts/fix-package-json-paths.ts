import * as fs from 'fs';
import * as path from 'path';

const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

const scripts = packageJson.scripts;

// Mapping des anciens chemins vers les nouveaux
const pathMappings: [RegExp, string][] = [
  // Smart update fusionnés adultes
  [/scripts\/update\/smart-update-(n3|pnf|pnm|r2f|r2m)\.ts/, 'scripts/volleyball/adultes/smart-update/smart-update-$1.ts'],

  // Smart update fusionnés jeunes
  [/scripts\/update\/smart-update-(m18m|bfc|bmb|cfd|mfd|mmb)\.ts/, 'scripts/volleyball/jeunes/smart-update/smart-update-$1.ts'],

  // Smart update classement adultes
  [/scripts\/update\/smart-update-classement-(n3|pnf|pnm|r2f|r2m)\.ts/, 'scripts/volleyball/adultes/smart-update-classement/smart-update-classement-$1.ts'],

  // Smart update classement jeunes
  [/scripts\/update\/smart-update-classement-(m18m|bfc|bmb|cfd|mfd|mmb)\.ts/, 'scripts/volleyball/jeunes/smart-update-classement/smart-update-classement-$1.ts'],

  // Smart update matchs adultes
  [/scripts\/update\/smart-update-matchs-(n3|pnf|pnm|r2f|r2m)\.ts/, 'scripts/volleyball/adultes/smart-update-matchs/smart-update-matchs-$1.ts'],

  // Smart update matchs jeunes
  [/scripts\/update\/smart-update-matchs-(m18m|bfc|bmb|cfd|mfd|mmb)\.ts/, 'scripts/volleyball/jeunes/smart-update-matchs/smart-update-matchs-$1.ts'],

  // Update classement adultes
  [/scripts\/update\/update-classement-(n3|pnf|pnm|r2f|r2m)\.ts/, 'scripts/volleyball/adultes/update-classement/update-classement-$1.ts'],

  // Update classement jeunes
  [/scripts\/update\/update-classement-(m18m|bfc|bmb|cfd|mfd|mmb)\.ts/, 'scripts/volleyball/jeunes/update-classement/update-classement-$1.ts'],

  // Update matchs adultes
  [/scripts\/update\/update-matchs-(n3|pnf|pnm|r2f|r2m)\.ts/, 'scripts/volleyball/adultes/update-matchs/update-matchs-$1.ts'],

  // Update matchs jeunes
  [/scripts\/update\/update-matchs-(m18m|bfc|bmb|cfd|mfd|mmb)\.ts/, 'scripts/volleyball/jeunes/update-matchs/update-matchs-$1.ts'],
];

let changesCount = 0;

for (const [scriptName, scriptCommand] of Object.entries(scripts)) {
  if (typeof scriptCommand !== 'string') continue;

  let newCommand = scriptCommand;

  for (const [pattern, replacement] of pathMappings) {
    if (pattern.test(newCommand)) {
      newCommand = newCommand.replace(pattern, replacement);
      changesCount++;
      console.log(`✅ ${scriptName}: ${scriptCommand} → ${newCommand}`);
      break;
    }
  }

  scripts[scriptName] = newCommand;
}

packageJson.scripts = scripts;

fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n', 'utf-8');

console.log(`\n🎉 ${changesCount} chemins mis à jour dans package.json`);
