import { describe, test, expect } from 'bun:test';
import {
  TNSRClient, createTnsrClient,
  formatBytes,
  validateConfig
} from '../src';

describe('TNSR API Client', () => {
  test('should create client instance', () => {
    const client = new TNSRClient('http://localhost:8080', 'test', 'test');
    expect(client).toBeInstanceOf(TNSRClient);
  });
});

describe('Utility Functions', () => {
  test('should create client with config', () => {
    const client = createTnsrClient({
      url: 'http://test:8080',
      username: 'admin',
      password: 'password'
    });
    expect(client).toBeInstanceOf(TNSRClient);
  });

  test('should throw error for missing password', () => {
    expect(() => {
      createTnsrClient({
        url: 'http://test:8080',
        username: 'admin'
        // password missing
      });
    }).toThrow('TNSR password is required');
  });

  test('should format bytes correctly', () => {
    expect(formatBytes(0)).toBe('0 Bytes');
    expect(formatBytes(1024)).toBe('1 KB');
    expect(formatBytes(1048576)).toBe('1 MB');
    expect(formatBytes(1073741824)).toBe('1 GB');
  });

  test('should validate config correctly', () => {
    const validConfig = {
      url: 'http://localhost:8080',
      username: 'admin',
      password: 'password'
    };
    const result = validateConfig(validConfig);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('should detect invalid config', () => {
    const invalidConfig = {
      url: '',
      username: '',
      password: ''
    };
    const result = validateConfig(invalidConfig);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});

describe('Type Safety', () => {
  test('should maintain type definitions', () => {
    // Test that types are properly exported
    const client = new TNSRClient('http://test:8080', 'user', 'pass');
    expect(typeof client).toBe('object');
  });

  test('should validate URL format', () => {
    const config = {
      url: 'invalid-url',
      username: 'admin',
      password: 'password'
    };
    const result = validateConfig(config);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Invalid URL format');
  });
});
