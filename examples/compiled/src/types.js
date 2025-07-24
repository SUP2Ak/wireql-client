"use strict";
/**
 * Types WireQL - Correspondance exacte avec le backend Rust
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SerializationFormat = exports.SqlOperation = void 0;
// ============================================
// ENUMS ET OPÉRATIONS SQL
// ============================================
/**
 * Opérations SQL supportées par WireQL
 */
var SqlOperation;
(function (SqlOperation) {
    SqlOperation["Query"] = "query";
    SqlOperation["Update"] = "update";
    SqlOperation["Insert"] = "insert";
    SqlOperation["Delete"] = "delete";
    SqlOperation["Single"] = "single";
    SqlOperation["Transaction"] = "transaction";
})(SqlOperation || (exports.SqlOperation = SqlOperation = {}));
/**
 * Formats de sérialisation supportés
 */
var SerializationFormat;
(function (SerializationFormat) {
    SerializationFormat["Json"] = "json";
    SerializationFormat["MessagePack"] = "msgpack";
})(SerializationFormat || (exports.SerializationFormat = SerializationFormat = {}));
