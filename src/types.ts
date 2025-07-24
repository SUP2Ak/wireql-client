/**
 * Types WireQL - Correspondance exacte avec le backend Rust
 */

// ============================================
// ENUMS ET OPÉRATIONS SQL
// ============================================

/**
 * Opérations SQL supportées par WireQL
 */
export enum SqlOperation {
  Query = 'query',
  Update = 'update',
  Insert = 'insert',
  Delete = 'delete',
  Single = 'single',
  Transaction = 'transaction'
}

/**
 * Formats de sérialisation supportés
 */
export enum SerializationFormat {
  Json = 'json',
  MessagePack = 'msgpack'
}

// ============================================
// STRUCTURES DE REQUÊTE
// ============================================

/**
 * Informations d'authentification
 */
export interface AuthInfo {
  api_key?: string;
  token?: string;
}

/**
 * Requête SQL principale
 */
export interface SqlRequest {
  op: SqlOperation;
  query: string;
  values: any[];
  transaction_id?: string;
  database?: string;
  auth?: AuthInfo;
}

/**
 * Étape d'une transaction
 */
export interface SqlStep {
  op: SqlOperation;
  query: string;
  values: any[];
}

/**
 * Requête de transaction
 */
export interface TransactionRequest {
  steps: SqlStep[];
  transaction_id?: string;
  database?: string;
  auth?: AuthInfo;
}

// ============================================
// STRUCTURES DE RÉPONSE
// ============================================

/**
 * Réponse SQL du serveur
 */
export interface SqlResponse {
  success: boolean;
  data?: any[];
  rows_affected?: number;
  last_insert_id?: number;
  transaction_id?: string;
  error?: string;
  execution_time?: number;
}

/**
 * Réponse API générique
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ============================================
// CONFIGURATION CLIENT
// ============================================

/**
 * Options de connexion WebSocket
 */
export interface WebSocketOptions {
  /** Reconnexion automatique */
  autoReconnect?: boolean;
  /** Délai maximum de reconnexion en ms */
  maxReconnectDelay?: number;
  /** Nombre maximum de tentatives de reconnexion */
  maxReconnectAttempts?: number;
  /** Ping interval en ms */
  pingInterval?: number;
  /** Timeout de ping en ms */
  pingTimeout?: number;
}

/**
 * Configuration du client WireQL
 */
export interface WireQLClientOptions {
  /** URL du serveur WireQL */
  host: string;
  /** Port du serveur */
  port?: number;
  /** Utiliser HTTPS/WSS */
  secure?: boolean;
  /** Clé API pour l'authentification */
  apiKey?: string;
  /** Token d'authentification */
  token?: string;
  /** Base de données par défaut */
  defaultDatabase?: string;
  /** Format de sérialisation préféré */
  serializationFormat?: SerializationFormat;
  /** Timeout des requêtes HTTP en ms */
  timeout?: number;
  /** Options WebSocket */
  websocket?: WebSocketOptions;
  /** Headers HTTP personnalisés */
  headers?: Record<string, string>;
  /** Mode debug */
  debug?: boolean;
}

/**
 * Options pour les requêtes individuelles
 */
export interface QueryOptions {
  /** Base de données pour cette requête */
  database?: string;
  /** Authentification pour cette requête */
  auth?: AuthInfo;
  /** Timeout spécifique en ms */
  timeout?: number;
  /** Format de sérialisation pour cette requête */
  format?: SerializationFormat;
  /** Utiliser WebSocket au lieu de HTTP */
  useWebSocket?: boolean;
}

/**
 * Options pour les transactions
 */
export interface TransactionOptions extends QueryOptions {
  /** ID de transaction personnalisé */
  transactionId?: string;
}

// ============================================
// STATISTIQUES ET MONITORING
// ============================================

/**
 * Statistiques de connexion
 */
export interface ConnectionStats {
  /** Statut de la connexion WebSocket */
  websocketConnected: boolean;
  /** Nombre de requêtes HTTP envoyées */
  httpRequests: number;
  /** Nombre de messages WebSocket envoyés */
  websocketMessages: number;
  /** Nombre de reconnexions WebSocket */
  reconnections: number;
  /** Latence moyenne en ms */
  averageLatency: number;
  /** Dernière erreur */
  lastError?: string;
  /** Timestamp de la dernière activité */
  lastActivity: number;
}

/**
 * Métriques de performance
 */
export interface PerformanceMetrics {
  /** Temps de réponse total en ms */
  totalTime: number;
  /** Temps de réseau en ms */
  networkTime: number;
  /** Temps de sérialisation en ms */
  serializationTime: number;
  /** Taille de la requête en bytes */
  requestSize: number;
  /** Taille de la réponse en bytes */
  responseSize: number;
}

// ============================================
// ÉVÉNEMENTS
// ============================================

/**
 * Types d'événements émis par le client
 */
export interface WireQLClientEvents {
  /** Connexion WebSocket établie */
  'connect': () => void;
  /** Connexion WebSocket fermée */
  'disconnect': (reason: string) => void;
  /** Erreur de connexion */
  'error': (error: Error) => void;
  /** Tentative de reconnexion */
  'reconnecting': (attempt: number) => void;
  /** Reconnexion réussie */
  'reconnected': () => void;
  /** Message reçu via WebSocket */
  'message': (data: any) => void;
  /** Réponse WebSocket interne */
  'wsResponse': (data: any) => void;
  /** Ping/Pong WebSocket */
  'ping': () => void;
  'pong': () => void;
}

// ============================================
// UTILITAIRES
// ============================================

/**
 * Résultat d'une requête avec métriques
 */
export interface QueryResult<T = any> {
  /** Données de la réponse */
  data: T;
  /** Métriques de performance */
  metrics: PerformanceMetrics;
  /** Réponse brute du serveur */
  raw: SqlResponse;
}

/**
 * Configuration d'un batch de requêtes
 */
export interface BatchOptions extends QueryOptions {
  /** Exécuter en parallèle */
  parallel?: boolean;
  /** Arrêter sur la première erreur */
  stopOnError?: boolean;
}

/**
 * Options de streaming
 */
export interface StreamOptions extends QueryOptions {
  /** Taille du buffer */
  bufferSize?: number;
  /** Callback pour chaque ligne */
  onRow?: (row: any) => void;
  /** Callback de progression */
  onProgress?: (processed: number, total?: number) => void;
} 