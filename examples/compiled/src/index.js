"use strict";
/**
 * WireQL TypeScript Client
 * Client officiel pour WireQL - Base de données as-a-Service
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSimpleClient = exports.SimpleWireQLClient = void 0;
// Export des types principaux
__exportStar(require("./types"), exports);
/**
 * Client WireQL simplifié (version temporaire)
 * TODO: Remplacer par le client complet une fois les dépendances installées
 */
class SimpleWireQLClient {
    constructor(options) {
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
    async query(sql, parameters = []) {
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
        }
        catch (error) {
            return {
                data: null,
                success: false,
                error: error.message
            };
        }
    }
}
exports.SimpleWireQLClient = SimpleWireQLClient;
/**
 * Crée un client WireQL simplifié
 */
function createSimpleClient(options) {
    return new SimpleWireQLClient(options);
}
exports.createSimpleClient = createSimpleClient;
// Export par défaut
exports.default = {
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
    },
    SerializationFormat: {
        Json: 'json',
        MessagePack: 'msgpack'
    }
};
