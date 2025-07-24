/**
 * Configuration globale pour les tests Jest
 */

// Polyfill pour fetch si nécessaire
if (typeof global.fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

// Timeout global pour les tests
jest.setTimeout(30000);

// Mock console pour les tests si nécessaire
global.console = {
  ...console,
  // Désactiver les logs pendant les tests
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: console.warn,
  error: console.error,
};

// Variables d'environnement pour les tests
process.env.NODE_ENV = 'test'; 