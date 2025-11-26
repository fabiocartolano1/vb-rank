import { createHash } from 'crypto';
import type admin from 'firebase-admin';

export interface ScrapingState {
  lastHash: string;
  lastUpdate: number;
  lastChangeDetected: number;
  consecutiveNoChange: number;
  totalChecks: number;
  totalUpdates: number;
}

const SCRAPING_STATE_COLLECTION = '_system';
const SCRAPING_STATE_DOC = 'scraping-state';

export function calculateHash(content: string): string {
  return createHash('md5').update(content).digest('hex');
}

export async function getScrapingState(db: admin.firestore.Firestore, stateKey: string): Promise<ScrapingState | null> {
  try {
    const stateDocRef = db.collection(SCRAPING_STATE_COLLECTION).doc(SCRAPING_STATE_DOC);
    const stateDoc = await stateDocRef.get();

    if (!stateDoc.exists) {
      return null;
    }

    const data = stateDoc.data();
    return data?.[stateKey] || null;
  } catch (error) {
    console.error('❌ Erreur lors de la récupération du state:', error);
    return null;
  }
}

export async function updateScrapingState(db: admin.firestore.Firestore, stateKey: string, state: ScrapingState): Promise<void> {
  try {
    const stateDocRef = db.collection(SCRAPING_STATE_COLLECTION).doc(SCRAPING_STATE_DOC);
    await stateDocRef.set({
      [stateKey]: state
    }, { merge: true });
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour du state:', error);
  }
}

export function getNextCheckDelay(consecutiveNoChange: number): number {
  if (consecutiveNoChange === 0) return 5 * 60 * 1000;   // 5 min
  if (consecutiveNoChange < 3) return 10 * 60 * 1000;    // 10 min
  if (consecutiveNoChange < 6) return 20 * 60 * 1000;    // 20 min
  if (consecutiveNoChange < 12) return 30 * 60 * 1000;   // 30 min
  return 60 * 60 * 1000;                                  // 1 heure
}

export function logHashCheckResult(state: ScrapingState, stateKey: string): void {
  console.log(`   Hash actuel: ${state.lastHash ? state.lastHash.substring(0, 16) + '...' : 'N/A'}`);
  console.log(`   Dernière mise à jour: ${state.lastUpdate ? new Date(state.lastUpdate).toLocaleString('fr-FR') : 'Jamais'}`);
  console.log(`   Checks sans changement: ${state.consecutiveNoChange}`);
  console.log(`   Total checks: ${state.totalChecks}`);
  console.log(`   Total updates: ${state.totalUpdates}`);
}

export function logNoChangeDetected(state: ScrapingState): void {
  console.log('\n✅ Aucun changement détecté sur la page');
  console.log(`   La page n'a pas été modifiée depuis ${new Date(state.lastUpdate).toLocaleString('fr-FR')}`);
  console.log(`   Économie: Scraping complet évité ! 🎉`);

  const nextCheckDelay = getNextCheckDelay(state.consecutiveNoChange);
  console.log(`\n💡 Suggestion: Prochain check dans ${Math.round(nextCheckDelay / 60000)} minutes`);
}

export function logChangeDetected(): void {
  console.log('\n🔄 CHANGEMENT DÉTECTÉ ! Mise à jour complète en cours...\n');
}

export function logStatistics(state: ScrapingState): void {
  console.log('\n📈 Statistiques globales :');
  console.log(`   Total de checks effectués: ${state.totalChecks}`);
  console.log(`   Total de mises à jour: ${state.totalUpdates}`);
  const efficiency = ((state.totalChecks - state.totalUpdates) / state.totalChecks * 100).toFixed(1);
  console.log(`   Économie réalisée: ${efficiency}% des runs évités`);
}
