/**
 * WireQL TypeScript Client
 * Client officiel pour WireQL - Base de données as-a-Service
 */

// Export des types principaux
export * from './types';

// Export de la classe client (désactivé temporairement)
// export { WireQLClient } from './client';

// Export des fonctions utilitaires (désactivé temporairement)  
// export { createClient, createWireQL, createCallableWireQL, CallableWireQL } from './callable';

// Export par défaut - Interface simplifiée pour éviter les erreurs de compilation
export interface WireQLOptions {
  host: string;
  port?: number;
  secure?: boolean;
  apiKey?: string;
  token?: string;
  defaultDatabase?: string;
  timeout?: number;
  debug?: boolean;
}

export interface SimpleQueryResult {
  data: any;
  success: boolean;
  error?: string;
  metrics?: {
    totalTime: number;
    requestSize: number;
    responseSize: number;
  };
}

/**
 * Client WireQL simplifié (version temporaire)
 * TODO: Remplacer par le client complet une fois les dépendances installées
 */
export class SimpleWireQLClient {
  private options: Required<WireQLOptions>;

  constructor(options: WireQLOptions) {
    this.options = {
      host: options.host,
      port: options.port ?? 8080,
      secure: options.secure ?? false,
      apiKey: options.apiKey ?? '',
      token: options.token ?? '',
      defaultDatabase: options.defaultDatabase ?? '',
      timeout: options.timeout ?? 30000,
      debug: options.debug ?? false
    };
  }

  async query(sql: string, parameters: any[] = []): Promise<SimpleQueryResult> {
    const startTime = Date.now();
    const protocol = this.options.secure ? 'https' : 'http';
    const url = `${protocol}://${this.options.host}:${this.options.port}/api/sql`;

    const request = {
      op: 'query',
      query: sql,
      values: parameters,
      database: this.options.defaultDatabase,
      auth: this.options.apiKey ? { api_key: this.options.apiKey } : undefined
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'WireQL-TypeScript-Client/1.0.0'
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const apiResponse = await response.json();
      const endTime = Date.now();

      return {
        data: apiResponse.data?.data || null,
        success: apiResponse.success,
        error: apiResponse.error,
        metrics: {
          totalTime: endTime - startTime,
          requestSize: JSON.stringify(request).length,
          responseSize: JSON.stringify(apiResponse).length
        }
      };
    } catch (error) {
      return {
        data: null,
        success: false,
        error: (error as Error).message
      };
    }
  }
}

/**
 * Crée un client WireQL simplifié
 */
export function createSimpleClient(options: WireQLOptions): SimpleWireQLClient {
  return new SimpleWireQLClient(options);
}

// Export par défaut
export default {
  SimpleWireQLClient,
  createSimpleClient,
  // Types disponibles
  SqlOperation: {
    Query: 'query',
    Update: 'update',
    Insert: 'insert',
    Delete: 'delete',
    Single: 'single',
    Transaction: 'transaction'
  } as const,
  SerializationFormat: {
    Json: 'json',
    MessagePack: 'msgpack'
  } as const
}; 