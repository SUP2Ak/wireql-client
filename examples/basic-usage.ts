/**
 * Exemple d'utilisation basique du client WireQL
 */

import { createSimpleClient, SqlOperation, SerializationFormat } from '../src';

async function basicExample() {
  console.log('🚀 Exemple d\'utilisation WireQL\n');

  // Création du client
  const client = createSimpleClient({
    host: 'localhost',
    port: 8080,
    apiKey: 'admin-key',
    defaultDatabase: 'gameserver',
    debug: true
  });

  try {
    // 1. Requête simple
    console.log('1. 📊 Requête SELECT simple:');
    const users = await client.query('SELECT * FROM users LIMIT 5');
    console.log(`   ✅ ${users.data?.length || 0} utilisateurs trouvés`);
    console.log(`   ⚡ Temps d'exécution: ${users.metrics?.totalTime}ms\n`);

    // 2. Requête avec paramètres
    console.log('2. 🔍 Requête avec paramètres:');
    const activeUsers = await client.query(
      'SELECT * FROM users WHERE active = ? AND level > ?',
      [true, 10]
    );
    console.log(`   ✅ ${activeUsers.data?.length || 0} utilisateurs actifs trouvés`);
    console.log(`   ⚡ Temps d'exécution: ${activeUsers.metrics?.totalTime}ms\n`);

    // 3. Gestion d'erreur
    console.log('3. ❌ Test de gestion d\'erreur:');
    const errorResult = await client.query('SELECT * FROM table_inexistante');
    if (!errorResult.success) {
      console.log(`   ❌ Erreur attendue: ${errorResult.error}`);
    }
    console.log();

    // 4. Métriques de performance
    console.log('4. 📈 Métriques de performance:');
    const perfTest = await client.query('SELECT COUNT(*) as total FROM users');
    if (perfTest.metrics) {
      console.log(`   🕐 Temps total: ${perfTest.metrics.totalTime}ms`);
      console.log(`   📤 Taille requête: ${perfTest.metrics.requestSize} bytes`);
      console.log(`   📥 Taille réponse: ${perfTest.metrics.responseSize} bytes`);
    }
    console.log();

    console.log('✅ Exemple terminé avec succès !');

  } catch (error) {
    console.error('❌ Erreur lors de l\'exemple:', error);
  }
}

// Exemple avancé avec configuration complète
async function advancedExample() {
  console.log('\n🔧 Exemple avancé avec configuration complète\n');

  const advancedClient = createSimpleClient({
    host: process.env.WIREQL_HOST || 'localhost',
    port: parseInt(process.env.WIREQL_PORT || '8080'),
    secure: process.env.WIREQL_SECURE === 'true',
    apiKey: process.env.WIREQL_API_KEY || 'admin-key',
    defaultDatabase: 'analytics',
    timeout: 15000,
    debug: false
  });

  try {
    // Test de connectivité
    console.log('🔌 Test de connectivité...');
    const pingResult = await advancedClient.query('SELECT 1 as ping');

    if (pingResult.success) {
      console.log('✅ Serveur accessible');

      // Requête sur une autre base
      console.log('\n📊 Requête analytics:');
      const analytics = await advancedClient.query(`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as events_count
        FROM events 
        WHERE created_at >= ? 
        GROUP BY DATE(created_at)
        ORDER BY date DESC
        LIMIT 7
      `, ['2024-01-01']);

      console.log(`   📈 ${analytics.data?.length || 0} jours d'analytics`);
      if (analytics.data) {
        analytics.data.forEach((row: any) => {
          console.log(`   📅 ${row.date}: ${row.events_count} événements`);
        });
      }
    } else {
      console.log('❌ Serveur inaccessible:', pingResult.error);
    }

  } catch (error) {
    console.error('❌ Erreur exemple avancé:', error);
  }
}

// Exemple de différents types de requêtes
async function queryTypesExample() {
  console.log('\n🎯 Exemples de différents types de requêtes\n');

  const client = createSimpleClient({
    host: 'localhost',
    port: 8080,
    apiKey: 'gameserver-key',
    defaultDatabase: 'gameserver'
  });

  try {
    // Simulation d'opérations différentes avec le client simple
    console.log('📝 Simulation INSERT:');
    const insertQuery = {
      op: SqlOperation.Insert,
      sql: 'INSERT INTO players (name, email) VALUES (?, ?)',
      params: ['TestPlayer', 'test@example.com']
    };
    console.log(`   🔧 Structure: ${JSON.stringify(insertQuery, null, 2)}`);

    console.log('\n📝 Simulation UPDATE:');
    const updateQuery = {
      op: SqlOperation.Update,
      sql: 'UPDATE players SET last_login = NOW() WHERE id = ?',
      params: [123]
    };
    console.log(`   🔧 Structure: ${JSON.stringify(updateQuery, null, 2)}`);

    console.log('\n📝 Simulation DELETE:');
    const deleteQuery = {
      op: SqlOperation.Delete,
      sql: 'DELETE FROM temp_sessions WHERE expires_at < NOW()',
      params: []
    };
    console.log(`   🔧 Structure: ${JSON.stringify(deleteQuery, null, 2)}`);

    console.log('\n📝 Simulation TRANSACTION:');
    const transactionSteps = [
      { op: SqlOperation.Insert, query: 'INSERT INTO transactions (amount) VALUES (?)', values: [100] },
      { op: SqlOperation.Update, query: 'UPDATE wallets SET balance = balance + ? WHERE user_id = ?', values: [100, 456] }
    ];
    console.log(`   🔧 Structure: ${JSON.stringify(transactionSteps, null, 2)}`);

  } catch (error) {
    console.error('❌ Erreur exemples types:', error);
  }
}

// Point d'entrée principal
async function main() {
  console.log('🎮 WireQL Client TypeScript - Exemples d\'utilisation\n');
  console.log('================================================\n');

  await basicExample();
  await advancedExample();
  await queryTypesExample();

  console.log('\n🎉 Tous les exemples terminés !');
  console.log('\n📖 Pour plus d\'informations:');
  console.log('   - Documentation: https://wireql.com/docs');
  console.log('   - GitHub: https://github.com/wireql/wireql');
  console.log('   - NPM: https://www.npmjs.com/package/wireql-client');
}

// Exécution si appelé directement
if (require.main === module) {
  main().catch(console.error);
}

export { basicExample, advancedExample, queryTypesExample }; 