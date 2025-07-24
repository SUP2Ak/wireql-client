# wireql-client

Client TypeScript/JavaScript officiel pour **WireQL** - Une solution de base de données as-a-Service ultra-rapide avec support WebSocket, HTTP et MessagePack.

[![npm version](https://badge.fury.io/js/wireql-client.svg)](https://badge.fury.io/js/wireql-client)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🚀 Fonctionnalités

- **Ultra-rapide** : Backend Rust avec performances sub-milliseconde
- **Multi-protocole** : HTTP REST + WebSocket temps réel
- **Multi-format** : JSON et MessagePack pour l'efficacité
- **Multi-base** : Connectez-vous à plusieurs bases MySQL/MariaDB
- **Authentification** : API keys avec permissions granulaires
- **TypeScript** : Support complet avec types stricts
- **Reconnexion** : Gestion automatique des déconnexions WebSocket
- **Streaming** : Support pour les gros datasets
- **Transactions** : Support complet des transactions ACID
- **Monitoring** : Métriques de performance en temps réel

## 📦 Installation

```bash
npm install wireql-client
# ou
yarn add wireql-client
# ou
pnpm add wireql-client
```

## 🎯 Utilisation rapide

### Client simple (recommandé)

```typescript
import { createSimpleClient } from 'wireql-client';

const wireql = createSimpleClient({
  host: 'localhost',
  port: 8080,
  apiKey: 'votre-api-key',
  defaultDatabase: 'gameserver'
});

// Requête simple
const users = await wireql.query('SELECT * FROM users WHERE active = ?', [true]);
console.log(users.data);
```

### Client avancé (avec WebSocket)

```typescript
import WireQL, { createClient } from 'wireql-client';

const client = createClient({
  host: 'localhost',
  port: 8080,
  apiKey: 'admin-key',
  defaultDatabase: 'gameserver',
  websocket: {
    autoReconnect: true,
    maxReconnectAttempts: 10
  },
  debug: true
});

// Connexion WebSocket
await client.connect();

// Utilisation directe (fonction callable)
const result = await client('SELECT * FROM players WHERE online = ?', [true]);

// Ou via méthodes spécialisées
const player = await client.single('SELECT * FROM players WHERE id = ?', [123]);
const newPlayer = await client.insert('INSERT INTO players (name, email) VALUES (?, ?)', ['John', 'john@example.com']);
```

## 📚 API Complète

### Méthodes de base

```typescript
// Requête SELECT multiple
const users = await client.query('SELECT * FROM users');

// Requête SELECT unique (LIMIT 1 automatique)
const user = await client.single('SELECT * FROM users WHERE id = ?', [123]);

// INSERT avec ID retourné
const result = await client.insert('INSERT INTO users (name) VALUES (?)', ['John']);
console.log(result.raw.last_insert_id);

// UPDATE avec lignes affectées
const result = await client.update('UPDATE users SET active = ? WHERE id = ?', [true, 123]);
console.log(result.raw.rows_affected);

// DELETE
await client.delete('DELETE FROM users WHERE id = ?', [123]);
```

### Transactions

```typescript
import { SqlOperation } from 'wireql-client';

const transaction = await client.transaction([
  { op: SqlOperation.Insert, query: 'INSERT INTO users (name) VALUES (?)', values: ['John'] },
  { op: SqlOperation.Update, query: 'UPDATE settings SET last_user_id = ?', values: [null] }, // sera remplacé par l'ID
  { op: SqlOperation.Query, query: 'SELECT COUNT(*) as total FROM users', values: [] }
]);
```

### Requêtes en lot (Batch)

```typescript
// Exécution en parallèle
const results = await client.batch([
  { sql: 'SELECT * FROM users', parameters: [] },
  { sql: 'SELECT * FROM products', parameters: [] },
  { sql: 'SELECT * FROM orders WHERE date > ?', parameters: ['2024-01-01'] }
], { parallel: true });

// Exécution séquentielle avec arrêt sur erreur
const results = await client.batch([
  { sql: 'DELETE FROM temp_data' },
  { sql: 'INSERT INTO logs (action) VALUES (?)', parameters: ['cleanup'] }
], { parallel: false, stopOnError: true });
```

### Streaming pour gros datasets

```typescript
const stream = await client.stream('SELECT * FROM big_table WHERE date > ?', ['2024-01-01'], {
  onProgress: (processed, total) => console.log(`${processed}/${total} lignes traitées`),
  onRow: (row) => console.log('Ligne reçue:', row)
});

for await (const row of stream) {
  // Traiter chaque ligne individuellement
  processRow(row);
}
```

### Multi-base de données

```typescript
// Base par défaut
const gameData = await client.query('SELECT * FROM players');

// Base spécifique
const analytics = await client.query('SELECT * FROM events', [], {
  database: 'analytics'
});

// Authentification spécifique
const ecommerce = await client.query('SELECT * FROM orders', [], {
  database: 'ecommerce',
  auth: { api_key: 'ecommerce-readonly-key' }
});
```

### Gestion des événements

```typescript
// Connexion WebSocket
client.on('connect', () => console.log('Connecté !'));
client.on('disconnect', (reason) => console.log('Déconnecté:', reason));
client.on('reconnecting', (attempt) => console.log(`Tentative ${attempt}...`));
client.on('error', (error) => console.error('Erreur:', error));

// Messages temps réel
client.on('message', (data) => {
  console.log('Message reçu:', data);
});
```

### Métriques et monitoring

```typescript
// Statistiques de connexion
const stats = client.getStats();
console.log(`Latence moyenne: ${stats.averageLatency}ms`);
console.log(`Requêtes HTTP: ${stats.httpRequests}`);
console.log(`Messages WebSocket: ${stats.websocketMessages}`);

// Test de connectivité
const isAlive = await client.ping();

// Métriques par requête
const result = await client.query('SELECT * FROM users');
console.log(`Temps d'exécution: ${result.metrics.totalTime}ms`);
console.log(`Taille réponse: ${result.metrics.responseSize} bytes`);
```

## 🔧 Configuration avancée

### Options complètes

```typescript
const client = createClient({
  // Serveur
  host: 'localhost',
  port: 8080,
  secure: false, // true pour HTTPS/WSS

  // Authentification
  apiKey: 'votre-api-key',
  token: 'votre-token',
  defaultDatabase: 'gameserver',

  // Performance
  serializationFormat: SerializationFormat.MessagePack, // ou Json
  timeout: 30000,

  // WebSocket
  websocket: {
    autoReconnect: true,
    maxReconnectDelay: 30000,
    maxReconnectAttempts: 10,
    pingInterval: 30000,
    pingTimeout: 5000
  },

  // Headers personnalisés
  headers: {
    'X-API-Version': '1.0',
    'X-Client-ID': 'mon-application'
  },

  // Debug
  debug: true
});
```

### Formats de sérialisation

```typescript
// MessagePack (plus rapide, plus compact)
const result = await client.query('SELECT * FROM users', [], {
  format: SerializationFormat.MessagePack
});

// JSON (plus lisible, compatible partout)
const result = await client.query('SELECT * FROM users', [], {
  format: SerializationFormat.Json
});
```

## 🎮 Exemples d'utilisation

### Discord Bot

```typescript
import { createClient } from 'wireql-client';

const db = createClient({
  host: process.env.WIREQL_HOST,
  apiKey: process.env.WIREQL_API_KEY,
  defaultDatabase: 'discord_bot'
});

// Commande !level
client.on('messageCreate', async (message) => {
  if (message.content.startsWith('!level')) {
    const user = await db.single(
      'SELECT level, xp FROM users WHERE discord_id = ?',
      [message.author.id]
    );
    
    if (user.data) {
      message.reply(`Niveau ${user.data.level} (${user.data.xp} XP)`);
    }
  }
});
```

### Application FiveM

```typescript
// Client-side (NUI)
import { createSimpleClient } from 'wireql-client';

const db = createSimpleClient({
  host: 'your-wireql-server.com',
  apiKey: 'fivem-client-key',
  defaultDatabase: 'gameserver'
});

// Interface utilisateur React
function PlayerStats({ playerId }: { playerId: number }) {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    db.single('SELECT * FROM player_stats WHERE player_id = ?', [playerId])
      .then(result => setStats(result.data));
  }, [playerId]);

  return (
    <div>
      {stats && (
        <div>
          <p>Argent: ${stats.money}</p>
          <p>Niveau: {stats.level}</p>
        </div>
      )}
    </div>
  );
}
```

### API REST Express

```typescript
import express from 'express';
import { createClient } from 'wireql-client';

const app = express();
const db = createClient({
  host: 'localhost',
  apiKey: 'backend-api-key'
});

app.get('/api/users/:id', async (req, res) => {
  try {
    const user = await db.single('SELECT * FROM users WHERE id = ?', [req.params.id]);
    res.json(user.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## 🛡️ Sécurité

### API Keys et permissions

```typescript
// Clé admin (lecture/écriture/suppression)
const adminClient = createClient({
  host: 'localhost',
  apiKey: 'admin-full-access'
});

// Clé lecture seule
const readonlyClient = createClient({
  host: 'localhost',
  apiKey: 'readonly-analytics'
});

// Override par requête
const result = await client.query('SELECT * FROM sensitive_data', [], {
  auth: { api_key: 'special-access-key' }
});
```

### Rate limiting

Le client respecte automatiquement les limites de taux configurées sur le serveur.

## 📈 Performance

### Benchmarks typiques

- **Latence** : 0.5-2ms (WebSocket) | 2-5ms (HTTP)
- **Débit** : 50,000+ requêtes/seconde
- **Mémoire** : ~10MB pour 1000 connexions concurrentes
- **MessagePack** : 30-50% plus compact que JSON

### Optimisations

```typescript
// Utilisez WebSocket pour les requêtes fréquentes
await client.connect();
const result = await client.query('...', [], { useWebSocket: true });

// MessagePack pour les gros payloads
const bigData = await client.query('SELECT * FROM big_table', [], {
  format: SerializationFormat.MessagePack
});

// Batch pour les requêtes multiples
const results = await client.batch([...], { parallel: true });
```

## 🐛 Debugging

```typescript
const client = createClient({
  debug: true, // Active les logs détaillés
  ...
});

// Logs automatiques :
// [WireQL] Connexion à ws://localhost:8080/ws
// [WireQL] WebSocket connecté
// [WireQL] Requête exécutée en 1.2ms
```

## 📝 Types TypeScript

Le package inclut tous les types TypeScript nécessaires :

```typescript
import type {
  SqlOperation,
  QueryOptions,
  QueryResult,
  ConnectionStats,
  PerformanceMetrics
} from 'wireql-client';
```

## 🤝 Contribution

1. Fork le projet
2. Créez une branche feature (`git checkout -b feature/amazing-feature`)
3. Commitez vos changements (`git commit -m 'Add amazing feature'`)
4. Pushez vers la branche (`git push origin feature/amazing-feature`)
5. Ouvrez une Pull Request

## 📄 Licence

MIT © WireQL Team

## 🔗 Liens utiles

- [Documentation complète](https://wireql.com/docs)
- [Serveur Rust](https://github.com/wireql/wireql)
- [Exemples](https://github.com/wireql/examples)
- [Discord communauté](https://discord.gg/wireql) 