/**
 * Tests pour le client WireQL
 */

import { SimpleWireQLClient, createSimpleClient, SqlOperation, SerializationFormat } from '../src';

describe('WireQL Client', () => {
  let client: SimpleWireQLClient;

  beforeEach(() => {
    client = createSimpleClient({
      host: 'localhost',
      port: 8080,
      apiKey: 'test-key',
      defaultDatabase: 'test_db'
    });
  });

  describe('Configuration', () => {
    it('should create client with default options', () => {
      const simpleClient = createSimpleClient({
        host: 'localhost'
      });

      expect(simpleClient).toBeInstanceOf(SimpleWireQLClient);
    });

    it('should create client with custom options', () => {
      const customClient = createSimpleClient({
        host: 'example.com',
        port: 3306,
        secure: true,
        apiKey: 'custom-key',
        defaultDatabase: 'custom_db',
        timeout: 60000,
        debug: true
      });

      expect(customClient).toBeInstanceOf(SimpleWireQLClient);
    });
  });

  describe('Types and Enums', () => {
    it('should have correct SqlOperation values', () => {
      expect(SqlOperation.Query).toBe('query');
      expect(SqlOperation.Insert).toBe('insert');
      expect(SqlOperation.Update).toBe('update');
      expect(SqlOperation.Delete).toBe('delete');
      expect(SqlOperation.Single).toBe('single');
      expect(SqlOperation.Transaction).toBe('transaction');
    });

    it('should have correct SerializationFormat values', () => {
      expect(SerializationFormat.Json).toBe('json');
      expect(SerializationFormat.MessagePack).toBe('msgpack');
    });
  });

  describe('Query Method', () => {
    it('should handle successful query', async () => {
      // Mock fetch pour simuler une réponse réussie
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            data: [{ id: 1, name: 'Test User' }],
            success: true
          }
        })
      });

      const result = await client.query('SELECT * FROM users');

      expect(result.success).toBe(true);
      expect(result.data).toEqual([{ id: 1, name: 'Test User' }]);
      expect(result.metrics).toBeDefined();
      expect(result.metrics?.totalTime).toBeGreaterThanOrEqual(0);
    });

    it('should handle query with parameters', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            data: [{ id: 1, name: 'John' }],
            success: true
          }
        })
      });

      const result = await client.query('SELECT * FROM users WHERE id = ?', [1]);

      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/sql',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: expect.stringContaining('"values":[1]')
        })
      );
    });

    it('should handle HTTP errors', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      const result = await client.query('SELECT * FROM users');

      expect(result.success).toBe(false);
      expect(result.error).toBe('HTTP 500: Internal Server Error');
      expect(result.data).toBeNull();
    });

    it('should handle network errors', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      const result = await client.query('SELECT * FROM users');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
      expect(result.data).toBeNull();
    });

    it('should include auth in request when apiKey is provided', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: { data: [], success: true }
        })
      });

      await client.query('SELECT 1');

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);

      expect(requestBody.auth).toEqual({ api_key: 'test-key' });
      expect(requestBody.database).toBe('test_db');
    });
  });

  describe('Request Structure', () => {
    beforeEach(() => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: { data: [], success: true }
        })
      });
    });

    it('should send correct request structure', async () => {
      await client.query('SELECT * FROM users WHERE active = ?', [true]);

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);

      expect(requestBody).toEqual({
        op: 'query',
        query: 'SELECT * FROM users WHERE active = ?',
        values: [true],
        database: 'test_db',
        auth: { api_key: 'test-key' }
      });
    });

    it('should send to correct endpoint', async () => {
      await client.query('SELECT 1');

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      expect(fetchCall[0]).toBe('http://localhost:8080/api/sql');
    });

    it('should include correct headers', async () => {
      await client.query('SELECT 1');

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const headers = fetchCall[1].headers;

      expect(headers['Content-Type']).toBe('application/json');
      expect(headers['User-Agent']).toBe('WireQL-TypeScript-Client/1.0.0');
    });
  });

  describe('Metrics', () => {
    it('should provide performance metrics', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: { data: [], success: true }
        })
      });

      const result = await client.query('SELECT 1');

      expect(result.metrics).toBeDefined();
      expect(typeof result.metrics?.totalTime).toBe('number');
      expect(typeof result.metrics?.requestSize).toBe('number');
      expect(typeof result.metrics?.responseSize).toBe('number');
      expect(result.metrics?.totalTime).toBeGreaterThanOrEqual(0);
    });
  });
}); 