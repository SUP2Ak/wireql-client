import { WireQLClient } from './client';
import {
  WireQLClientOptions,
  QueryOptions,
  TransactionOptions,
  SqlOperation,
  BatchOptions,
  StreamOptions,
  QueryResult,
  ConnectionStats
} from './types';

/**
 * Interface pour la fonction WireQL callable
 */
export interface CallableWireQL {
  // Fonction principale callable
  (sql: string, parameters?: any[], options?: QueryOptions): Promise<QueryResult>;

  // Méthodes de base
  query(sql: string, parameters?: any[], options?: QueryOptions): Promise<QueryResult>;
  single(sql: string, parameters?: any[], options?: QueryOptions): Promise<QueryResult>;
  insert(sql: string, parameters?: any[], options?: QueryOptions): Promise<QueryResult>;
  update(sql: string, parameters?: any[], options?: QueryOptions): Promise<QueryResult>;
  delete(sql: string, parameters?: any[], options?: QueryOptions): Promise<QueryResult>;
  transaction(steps: Array<{ op: SqlOperation; query: string; values: any[] }>, options?: TransactionOptions): Promise<QueryResult>;

  // Méthodes avancées
  batch(queries: Array<{ sql: string; parameters?: any[]; options?: QueryOptions }>, batchOptions?: BatchOptions): Promise<QueryResult[]>;
  stream(sql: string, parameters?: any[], options?: StreamOptions): Promise<AsyncIterable<any>>;
  raw(sql: string, parameters?: any[], options?: QueryOptions): Promise<import('./types').SqlResponse>;

  // Connexion
  connect(): Promise<void>;
  disconnect(): void;
  ping(): Promise<boolean>;
  isConnected(): boolean;

  // Statistiques
  getStats(): ConnectionStats;

  // Événements
  on(event: string, listener: (...args: any[]) => void): void;
  once(event: string, listener: (...args: any[]) => void): void;
  off(event: string, listener: (...args: any[]) => void): void;
  emit(event: string, ...args: any[]): boolean;

  // Méthodes spéciales
  $client: WireQLClient; // Accès au client sous-jacent
}

/**
 * Crée une instance WireQL callable
 */
export function createClient(options: WireQLClientOptions): CallableWireQL {
  const client = new WireQLClient(options);

  // Fonction principale callable
  const wireql = async (sql: string, parameters: any[] = [], options: QueryOptions = {}): Promise<QueryResult> => {
    return client.query(sql, parameters, options);
  };

  // Attacher toutes les méthodes
  wireql.query = (sql: string, parameters: any[] = [], options: QueryOptions = {}) =>
    client.query(sql, parameters, options);

  wireql.single = (sql: string, parameters: any[] = [], options: QueryOptions = {}) =>
    client.single(sql, parameters, options);

  wireql.insert = (sql: string, parameters: any[] = [], options: QueryOptions = {}) =>
    client.insert(sql, parameters, options);

  wireql.update = (sql: string, parameters: any[] = [], options: QueryOptions = {}) =>
    client.update(sql, parameters, options);

  wireql.delete = (sql: string, parameters: any[] = [], options: QueryOptions = {}) =>
    client.delete(sql, parameters, options);

  wireql.transaction = (steps: Array<{ op: SqlOperation; query: string; values: any[] }>, options: TransactionOptions = {}) =>
    client.transaction(steps, options);

  wireql.batch = (queries: Array<{ sql: string; parameters?: any[]; options?: QueryOptions }>, batchOptions: BatchOptions = {}) =>
    client.batch(queries, batchOptions);

  wireql.stream = (sql: string, parameters: any[] = [], options: StreamOptions = {}) =>
    client.stream(sql, parameters, options);

  wireql.raw = (sql: string, parameters: any[] = [], options: QueryOptions = {}) =>
    client.raw(sql, parameters, options);

  // Méthodes de connexion
  wireql.connect = () => client.connect();
  wireql.disconnect = () => client.disconnect();
  wireql.ping = () => client.ping();
  wireql.isConnected = () => client.isConnected();

  // Statistiques
  wireql.getStats = () => client.getStats();

  // Événements
  wireql.on = (event: string, listener: (...args: any[]) => void) => client.on(event as any, listener);
  wireql.once = (event: string, listener: (...args: any[]) => void) => client.once(event as any, listener);
  wireql.off = (event: string, listener: (...args: any[]) => void) => client.off(event as any, listener);
  wireql.emit = (event: string, ...args: any[]) => client.emit(event as any, ...args);

  // Accès au client sous-jacent
  wireql.$client = client;

  return wireql as CallableWireQL;
}

/**
 * Alias pour createClient
 */
export const createWireQL = createClient;
export const createCallableWireQL = createClient; 