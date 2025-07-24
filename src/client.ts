import { EventEmitter } from 'eventemitter3';
import WebSocket from 'ws';
import { encode, decode } from '@msgpack/msgpack';
import {
  WireQLClientOptions,
  SqlRequest,
  SqlResponse,
  TransactionRequest,
  QueryOptions,
  TransactionOptions,
  ConnectionStats,
  PerformanceMetrics,
  QueryResult,
  BatchOptions,
  StreamOptions,
  SqlOperation,
  SerializationFormat,
  WireQLClientEvents,
  ApiResponse
} from './types';

/**
 * Client WireQL TypeScript avec support WebSocket, HTTP, et MessagePack
 */
export class WireQLClient extends EventEmitter<WireQLClientEvents> {
  private options: Required<WireQLClientOptions>;
  private ws: WebSocket | null = null;
  private wsConnected = false;
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private pingTimer: NodeJS.Timeout | null = null;
  private stats: ConnectionStats;
  private requestCounter = 0;
  private latencyHistory: number[] = [];

  constructor(options: WireQLClientOptions) {
    super();

    // Configuration par défaut
    this.options = {
      host: options.host,
      port: options.port ?? 8080,
      secure: options.secure ?? false,
      apiKey: options.apiKey ?? '',
      token: options.token ?? '',
      defaultDatabase: options.defaultDatabase ?? '',
      serializationFormat: options.serializationFormat ?? SerializationFormat.MessagePack,
      timeout: options.timeout ?? 30000,
      websocket: {
        autoReconnect: options.websocket?.autoReconnect ?? true,
        maxReconnectDelay: options.websocket?.maxReconnectDelay ?? 30000,
        maxReconnectAttempts: options.websocket?.maxReconnectAttempts ?? 10,
        pingInterval: options.websocket?.pingInterval ?? 30000,
        pingTimeout: options.websocket?.pingTimeout ?? 5000,
        ...options.websocket
      },
      headers: options.headers ?? {},
      debug: options.debug ?? false
    };

    this.stats = {
      websocketConnected: false,
      httpRequests: 0,
      websocketMessages: 0,
      reconnections: 0,
      averageLatency: 0,
      lastActivity: Date.now()
    };

    this.log('Client WireQL initialisé', this.options);
  }

  // ============================================
  // GESTION DE LA CONNEXION
  // ============================================

  /**
   * Établit la connexion WebSocket
   */
  async connect(): Promise<void> {
    if (this.wsConnected) {
      this.log('Déjà connecté');
      return;
    }

    return new Promise((resolve, reject) => {
      const protocol = this.options.secure ? 'wss' : 'ws';
      const url = `${protocol}://${this.options.host}:${this.options.port}/ws`;

      this.log('Connexion à', url);
      this.ws = new WebSocket(url);

      const timeout = setTimeout(() => {
        reject(new Error('Timeout de connexion WebSocket'));
      }, this.options.timeout);

      this.ws.on('open', () => {
        clearTimeout(timeout);
        this.wsConnected = true;
        this.reconnectAttempts = 0;
        this.stats.websocketConnected = true;
        this.setupPing();
        this.log('WebSocket connecté');
        this.emit('connect');
        resolve();
      });

      this.ws.on('message', (data: Buffer) => {
        this.handleWebSocketMessage(data);
      });

      this.ws.on('close', (code, reason) => {
        clearTimeout(timeout);
        this.wsConnected = false;
        this.stats.websocketConnected = false;
        this.clearPing();

        const reasonStr = reason.toString() || `Code: ${code}`;
        this.log('WebSocket fermé:', reasonStr);
        this.emit('disconnect', reasonStr);

        if (this.options.websocket.autoReconnect && code !== 1000) {
          this.scheduleReconnect();
        }
      });

      this.ws.on('error', (error) => {
        clearTimeout(timeout);
        this.log('Erreur WebSocket:', error);
        this.emit('error', error);
        reject(error);
      });

      this.ws.on('ping', () => {
        this.emit('ping');
      });

      this.ws.on('pong', () => {
        this.emit('pong');
      });
    });
  }

  /**
   * Ferme la connexion WebSocket
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close(1000, 'Déconnexion demandée');
      this.ws = null;
    }
    this.clearReconnectTimer();
    this.clearPing();
  }

  // ============================================
  // MÉTHODES DE REQUÊTE PRINCIPALES
  // ============================================

  /**
   * Exécute une requête SQL
   */
  async query(sql: string, parameters: any[] = [], options: QueryOptions = {}): Promise<QueryResult> {
    const request: SqlRequest = {
      op: SqlOperation.Query,
      query: sql,
      values: parameters,
      database: options.database || this.options.defaultDatabase,
      auth: options.auth || this.getDefaultAuth()
    };

    return this.executeRequest(request, options);
  }

  /**
   * Retourne un seul résultat (LIMIT 1)
   */
  async single(sql: string, parameters: any[] = [], options: QueryOptions = {}): Promise<QueryResult> {
    const request: SqlRequest = {
      op: SqlOperation.Single,
      query: sql,
      values: parameters,
      database: options.database || this.options.defaultDatabase,
      auth: options.auth || this.getDefaultAuth()
    };

    return this.executeRequest(request, options);
  }

  /**
   * Insère des données
   */
  async insert(sql: string, parameters: any[] = [], options: QueryOptions = {}): Promise<QueryResult> {
    const request: SqlRequest = {
      op: SqlOperation.Insert,
      query: sql,
      values: parameters,
      database: options.database || this.options.defaultDatabase,
      auth: options.auth || this.getDefaultAuth()
    };

    return this.executeRequest(request, options);
  }

  /**
   * Met à jour des données
   */
  async update(sql: string, parameters: any[] = [], options: QueryOptions = {}): Promise<QueryResult> {
    const request: SqlRequest = {
      op: SqlOperation.Update,
      query: sql,
      values: parameters,
      database: options.database || this.options.defaultDatabase,
      auth: options.auth || this.getDefaultAuth()
    };

    return this.executeRequest(request, options);
  }

  /**
   * Supprime des données
   */
  async delete(sql: string, parameters: any[] = [], options: QueryOptions = {}): Promise<QueryResult> {
    const request: SqlRequest = {
      op: SqlOperation.Delete,
      query: sql,
      values: parameters,
      database: options.database || this.options.defaultDatabase,
      auth: options.auth || this.getDefaultAuth()
    };

    return this.executeRequest(request, options);
  }

  /**
   * Exécute une transaction
   */
  async transaction(
    steps: Array<{ op: SqlOperation; query: string; values: any[] }>,
    options: TransactionOptions = {}
  ): Promise<QueryResult> {
    const request: TransactionRequest = {
      steps,
      transaction_id: options.transactionId,
      database: options.database || this.options.defaultDatabase,
      auth: options.auth || this.getDefaultAuth()
    };

    return this.executeTransaction(request, options);
  }

  // ============================================
  // MÉTHODES AVANCÉES
  // ============================================

  /**
   * Exécution de requêtes en lot
   */
  async batch(
    queries: Array<{ sql: string; parameters?: any[]; options?: QueryOptions }>,
    batchOptions: BatchOptions = {}
  ): Promise<QueryResult[]> {
    if (batchOptions.parallel) {
      const promises = queries.map(q =>
        this.query(q.sql, q.parameters || [], { ...batchOptions, ...q.options })
      );

      try {
        return await Promise.all(promises);
      } catch (error) {
        if (batchOptions.stopOnError) {
          throw error;
        }
        // Retourner les résultats partiels
        const results = await Promise.allSettled(promises);
        return results.map(result =>
          result.status === 'fulfilled'
            ? result.value
            : { data: null, metrics: this.createEmptyMetrics(), raw: { success: false, error: (result.reason as Error).message } as SqlResponse }
        );
      }
    } else {
      const results: QueryResult[] = [];
      for (const query of queries) {
        try {
          const result = await this.query(query.sql, query.parameters || [], { ...batchOptions, ...query.options });
          results.push(result);
        } catch (error) {
          if (batchOptions.stopOnError) {
            throw error;
          }
          results.push({
            data: null,
            metrics: this.createEmptyMetrics(),
            raw: { success: false, error: (error as Error).message } as SqlResponse
          });
        }
      }
      return results;
    }
  }

  /**
   * Streaming de gros résultats
   */
  async stream(sql: string, parameters: any[] = [], options: StreamOptions = {}): Promise<AsyncIterable<any>> {
    // Pour l'instant, on utilise une requête normale et on yield les résultats
    // Dans une version future, on pourrait implémenter un vrai streaming
    const result = await this.query(sql, parameters, options);

    return {
      async *[Symbol.asyncIterator]() {
        if (result.data && Array.isArray(result.data)) {
          for (let i = 0; i < result.data.length; i++) {
            if (options.onRow) {
              options.onRow(result.data[i]);
            }
            if (options.onProgress) {
              options.onProgress(i + 1, result.data.length);
            }
            yield result.data[i];
          }
        }
      }
    };
  }

  /**
   * Requête SQL brute (sans ORM)
   */
  async raw(sql: string, parameters: any[] = [], options: QueryOptions = {}): Promise<SqlResponse> {
    const result = await this.query(sql, parameters, options);
    return result.raw;
  }

  // ============================================
  // MÉTHODES UTILITAIRES
  // ============================================

  /**
   * Obtient les statistiques de connexion
   */
  getStats(): ConnectionStats {
    return { ...this.stats };
  }

  /**
   * Test de la connexion
   */
  async ping(): Promise<boolean> {
    try {
      await this.query('SELECT 1 as ping');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Vérifie si le client est connecté
   */
  isConnected(): boolean {
    return this.wsConnected;
  }

  // ============================================
  // MÉTHODES PRIVÉES
  // ============================================

  private async executeRequest(request: SqlRequest, options: QueryOptions): Promise<QueryResult> {
    const startTime = Date.now();
    const serializationStart = Date.now();

    try {
      let response: SqlResponse;

      if (options.useWebSocket !== false && this.wsConnected) {
        response = await this.sendWebSocketRequest(request, options);
        this.stats.websocketMessages++;
      } else {
        response = await this.sendHttpRequest(request, options);
        this.stats.httpRequests++;
      }

      const endTime = Date.now();
      const totalTime = endTime - startTime;
      const serializationTime = Date.now() - serializationStart;

      this.updateLatencyStats(totalTime);
      this.stats.lastActivity = endTime;

      const metrics: PerformanceMetrics = {
        totalTime,
        networkTime: totalTime - serializationTime,
        serializationTime,
        requestSize: JSON.stringify(request).length,
        responseSize: JSON.stringify(response).length
      };

      if (!response.success) {
        throw new Error(response.error || 'Erreur inconnue');
      }

      return {
        data: response.data || null,
        metrics,
        raw: response
      };
    } catch (error) {
      this.stats.lastError = (error as Error).message;
      throw error;
    }
  }

  private async executeTransaction(request: TransactionRequest, options: TransactionOptions): Promise<QueryResult> {
    const startTime = Date.now();

    try {
      let response: SqlResponse;

      if (options.useWebSocket !== false && this.wsConnected) {
        response = await this.sendWebSocketTransaction(request, options);
        this.stats.websocketMessages++;
      } else {
        response = await this.sendHttpTransaction(request, options);
        this.stats.httpRequests++;
      }

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      this.updateLatencyStats(totalTime);
      this.stats.lastActivity = endTime;

      const metrics: PerformanceMetrics = {
        totalTime,
        networkTime: totalTime,
        serializationTime: 0,
        requestSize: JSON.stringify(request).length,
        responseSize: JSON.stringify(response).length
      };

      if (!response.success) {
        throw new Error(response.error || 'Erreur de transaction');
      }

      return {
        data: response.data || null,
        metrics,
        raw: response
      };
    } catch (error) {
      this.stats.lastError = (error as Error).message;
      throw error;
    }
  }

  private async sendHttpRequest(request: SqlRequest, options: QueryOptions): Promise<SqlResponse> {
    const protocol = this.options.secure ? 'https' : 'http';
    const endpoint = options.format === SerializationFormat.MessagePack ? '/api/sql/msgpack' : '/api/sql';
    const url = `${protocol}://${this.options.host}:${this.options.port}${endpoint}`;

    const headers: Record<string, string> = {
      ...this.options.headers,
      'User-Agent': 'WireQL-TypeScript-Client/1.0.0'
    };

    let body: string | Buffer;

    if (options.format === SerializationFormat.MessagePack) {
      headers['Content-Type'] = 'application/octet-stream';
      body = Buffer.from(encode(request));
    } else {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(request);
    }

    const response = await this.fetchWithTimeout(url, {
      method: 'POST',
      headers,
      body
    }, options.timeout || this.options.timeout);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    if (options.format === SerializationFormat.MessagePack) {
      const buffer = await response.arrayBuffer();
      const apiResponse = decode(new Uint8Array(buffer)) as ApiResponse<SqlResponse>;
      return apiResponse.data || { success: false, error: apiResponse.error };
    } else {
      const apiResponse: ApiResponse<SqlResponse> = await response.json();
      return apiResponse.data || { success: false, error: apiResponse.error };
    }
  }

  private async sendHttpTransaction(request: TransactionRequest, options: TransactionOptions): Promise<SqlResponse> {
    const protocol = this.options.secure ? 'https' : 'http';
    const endpoint = options.format === SerializationFormat.MessagePack ? '/api/transaction/msgpack' : '/api/transaction';
    const url = `${protocol}://${this.options.host}:${this.options.port}${endpoint}`;

    const headers: Record<string, string> = {
      ...this.options.headers,
      'User-Agent': 'WireQL-TypeScript-Client/1.0.0'
    };

    let body: string | Buffer;

    if (options.format === SerializationFormat.MessagePack) {
      headers['Content-Type'] = 'application/octet-stream';
      body = Buffer.from(encode(request));
    } else {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(request);
    }

    const response = await this.fetchWithTimeout(url, {
      method: 'POST',
      headers,
      body
    }, options.timeout || this.options.timeout);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    if (options.format === SerializationFormat.MessagePack) {
      const buffer = await response.arrayBuffer();
      const apiResponse = decode(new Uint8Array(buffer)) as ApiResponse<SqlResponse>;
      return apiResponse.data || { success: false, error: apiResponse.error };
    } else {
      const apiResponse: ApiResponse<SqlResponse> = await response.json();
      return apiResponse.data || { success: false, error: apiResponse.error };
    }
  }

  private async sendWebSocketRequest(request: SqlRequest, options: QueryOptions): Promise<SqlResponse> {
    if (!this.ws || !this.wsConnected) {
      throw new Error('WebSocket non connecté');
    }

    return new Promise((resolve, reject) => {
      const requestId = `req_${++this.requestCounter}_${Date.now()}`;
      const requestWithId = { ...request, requestId };

      const timeout = setTimeout(() => {
        reject(new Error('Timeout WebSocket'));
      }, options.timeout || this.options.timeout);

      const messageHandler = (data: any) => {
        if (data.requestId === requestId) {
          clearTimeout(timeout);
          this.off('wsResponse', messageHandler);
          resolve(data.response);
        }
      };

      this.on('wsResponse', messageHandler);

      const format = options.format || this.options.serializationFormat;
      const message = format === SerializationFormat.MessagePack
        ? encode(requestWithId)
        : JSON.stringify(requestWithId);

      this.ws!.send(message);
    });
  }

  private async sendWebSocketTransaction(request: TransactionRequest, options: TransactionOptions): Promise<SqlResponse> {
    if (!this.ws || !this.wsConnected) {
      throw new Error('WebSocket non connecté');
    }

    return new Promise((resolve, reject) => {
      const requestId = `txn_${++this.requestCounter}_${Date.now()}`;
      const requestWithId = { ...request, requestId };

      const timeout = setTimeout(() => {
        reject(new Error('Timeout WebSocket'));
      }, options.timeout || this.options.timeout);

      const messageHandler = (data: any) => {
        if (data.requestId === requestId) {
          clearTimeout(timeout);
          this.off('wsResponse', messageHandler);
          resolve(data.response);
        }
      };

      this.on('wsResponse', messageHandler);

      const format = options.format || this.options.serializationFormat;
      const message = format === SerializationFormat.MessagePack
        ? encode(requestWithId)
        : JSON.stringify(requestWithId);

      this.ws!.send(message);
    });
  }

  private handleWebSocketMessage(data: Buffer): void {
    try {
      let message: any;

      // Détection automatique du format
      if (data[0] === 0x7b) { // JSON commence par '{'
        message = JSON.parse(data.toString());
      } else {
        message = decode(data);
      }

      this.emit('message', message);

      if (message.requestId) {
        this.emit('wsResponse', message);
      }
    } catch (error) {
      this.log('Erreur parsing message WebSocket:', error);
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= (this.options.websocket?.maxReconnectAttempts ?? 10)) {
      this.log('Nombre maximum de tentatives de reconnexion atteint');
      return;
    }

    const delay = Math.min(
      1000 * Math.pow(2, this.reconnectAttempts),
      this.options.websocket?.maxReconnectDelay ?? 30000
    );

    this.reconnectAttempts++;
    this.stats.reconnections++;

    this.log(`Reconnexion dans ${delay}ms (tentative ${this.reconnectAttempts})`);
    this.emit('reconnecting', this.reconnectAttempts);

    this.reconnectTimer = setTimeout(async () => {
      try {
        await this.connect();
        this.emit('reconnected');
      } catch (error) {
        this.log('Échec de reconnexion:', error);
        this.scheduleReconnect();
      }
    }, delay);
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private setupPing(): void {
    this.pingTimer = setInterval(() => {
      if (this.ws && this.wsConnected) {
        this.ws.ping();
      }
    }, this.options.websocket.pingInterval);
  }

  private clearPing(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  private updateLatencyStats(latency: number): void {
    this.latencyHistory.push(latency);
    if (this.latencyHistory.length > 100) {
      this.latencyHistory.shift();
    }
    this.stats.averageLatency = this.latencyHistory.reduce((a, b) => a + b, 0) / this.latencyHistory.length;
  }

  private getDefaultAuth() {
    if (this.options.apiKey || this.options.token) {
      return {
        api_key: this.options.apiKey,
        token: this.options.token
      };
    }
    return undefined;
  }

  private createEmptyMetrics(): PerformanceMetrics {
    return {
      totalTime: 0,
      networkTime: 0,
      serializationTime: 0,
      requestSize: 0,
      responseSize: 0
    };
  }

  private async fetchWithTimeout(url: string, options: any, timeout: number): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  private log(...args: any[]): void {
    if (this.options.debug) {
      console.log('[WireQL]', ...args);
    }
  }
} 