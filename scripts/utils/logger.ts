import * as fs from 'fs';
import * as path from 'path';

class Logger {
  private logFilePath: string;
  private originalConsoleLog: typeof console.log;
  private originalConsoleError: typeof console.error;
  private originalConsoleWarn: typeof console.warn;

  constructor(scriptName: string) {
    // Créer le nom du fichier de log avec date + heure + nom du script
    const now = new Date();
    const dateStr = now.toISOString().replace(/[:.]/g, '-').slice(0, -5); // Format: 2025-01-06T14-30-45
    const logFileName = `${dateStr}_${scriptName}.log`;

    // Créer le dossier logs s'il n'existe pas
    const logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    this.logFilePath = path.join(logsDir, logFileName);

    // Sauvegarder les fonctions console originales
    this.originalConsoleLog = console.log;
    this.originalConsoleError = console.error;
    this.originalConsoleWarn = console.warn;
  }

  /**
   * Active le logging dans un fichier
   */
  start(): void {
    const writeToFile = (level: string, ...args: any[]) => {
      const timestamp = new Date().toISOString();
      const message = args.map(arg =>
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');

      const logEntry = `[${timestamp}] [${level}] ${message}\n`;

      try {
        fs.appendFileSync(this.logFilePath, logEntry, 'utf8');
      } catch (error) {
        this.originalConsoleError('Failed to write to log file:', error);
      }
    };

    // Rediriger console.log
    console.log = (...args: any[]) => {
      this.originalConsoleLog(...args);
      writeToFile('INFO', ...args);
    };

    // Rediriger console.error
    console.error = (...args: any[]) => {
      this.originalConsoleError(...args);
      writeToFile('ERROR', ...args);
    };

    // Rediriger console.warn
    console.warn = (...args: any[]) => {
      this.originalConsoleWarn(...args);
      writeToFile('WARN', ...args);
    };

    // Écrire l'en-tête du log
    const header = `${'='.repeat(80)}\nScript started at ${new Date().toISOString()}\n${'='.repeat(80)}\n`;
    fs.appendFileSync(this.logFilePath, header, 'utf8');
  }

  /**
   * Désactive le logging et restaure les fonctions console originales
   */
  stop(): void {
    console.log = this.originalConsoleLog;
    console.error = this.originalConsoleError;
    console.warn = this.originalConsoleWarn;

    // Écrire le pied de page du log
    const footer = `\n${'='.repeat(80)}\nScript ended at ${new Date().toISOString()}\n${'='.repeat(80)}\n\n`;
    try {
      fs.appendFileSync(this.logFilePath, footer, 'utf8');
    } catch (error) {
      this.originalConsoleError('Failed to write footer to log file:', error);
    }
  }

  /**
   * Retourne le chemin du fichier de log
   */
  getLogFilePath(): string {
    return this.logFilePath;
  }
}

/**
 * Fonction helper pour initialiser le logger dans un script
 * @param scriptName Nom du script (ex: "update-matchs-r2m")
 * @returns Instance du logger
 */
export function initLogger(scriptName: string): Logger {
  const logger = new Logger(scriptName);
  logger.start();

  // S'assurer que le logger est arrêté proprement à la fin du script
  process.on('exit', () => {
    logger.stop();
  });

  process.on('SIGINT', () => {
    logger.stop();
    process.exit(130);
  });

  process.on('SIGTERM', () => {
    logger.stop();
    process.exit(143);
  });

  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    logger.stop();
    process.exit(1);
  });

  return logger;
}
