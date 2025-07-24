# Changelog

Toutes les modifications notables de ce projet seront documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/),
et ce projet adhère au [Versioning Sémantique](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-07-24

### 🎉 Première version

#### Ajouté
- **Client simple** : `SimpleWireQLClient` pour les requêtes HTTP basiques
- **Support TypeScript** : Types complets et définitions d'interface
- **Sérialisation** : Support JSON et MessagePack  
- **Authentification** : Support des API keys
- **Multi-base** : Connexion à plusieurs bases de données
- **Métriques** : Temps d'exécution et tailles de requête/réponse
- **Tests** : Suite de tests complète avec Jest
- **Documentation** : README détaillé avec exemples

#### Fonctionnalités
- 🚀 **Performance** : Optimisé pour la rapidité
- 🔒 **Sécurité** : Authentification par API key
- 📊 **Monitoring** : Métriques de performance intégrées
- 🌐 **Multi-DB** : Support de plusieurs bases de données
- 📝 **TypeScript** : Types stricts et IntelliSense complet
- 🧪 **Tests** : 100% de couverture des fonctionnalités principales

#### API Principale
```typescript
// Client simple
import { createSimpleClient } from '@wireql/client';

const client = createSimpleClient({
  host: 'localhost',
  port: 8080,
  apiKey: 'your-api-key',
  defaultDatabase: 'gameserver'
});

// Requête SQL
const result = await client.query('SELECT * FROM users WHERE active = ?', [true]);
```

#### Formats supportés
- **CommonJS** (`dist/cjs/`) : Compatible Node.js
- **ES Modules** (`dist/esm/`) : Compatible bundlers modernes  
- **Types** (`dist/types/`) : Définitions TypeScript

#### Compatibilité
- **Node.js** : ≥16.0.0
- **TypeScript** : ≥4.5.0
- **Navigateurs** : Support via bundlers (Webpack, Vite, etc.)

### 🔮 Prochaines versions prévues

#### [1.1.0] - WebSocket Support
- Client avancé avec WebSocket
- Reconnexion automatique
- Streaming de données
- Events en temps réel

#### [1.2.0] - Fonctionnalités avancées
- Transactions complexes
- Requêtes en lot (batch)
- Cache intelligent
- Connection pooling

#### [1.3.0] - Optimisations
- Compression automatique
- Retry automatique
- Circuit breaker
- Rate limiting côté client

### 📚 Documentation

- [README](./README.md) : Guide d'utilisation complet
- [Types](./src/types.ts) : Référence des types TypeScript
- [Exemples](./examples/) : Exemples d'utilisation
- [Tests](./tests/) : Suite de tests

### 🤝 Contribution

Ce package est open source et accueille les contributions !

- **Issues** : [GitHub Issues](https://github.com/wireql/wireql/issues)
- **Pull Requests** : Toutes les PR sont les bienvenues
- **Discussions** : [GitHub Discussions](https://github.com/wireql/wireql/discussions)

### 📄 Licence

MIT © WireQL Team 