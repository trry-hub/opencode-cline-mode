import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ClineCache } from '../src/cline-cache';
import { mkdirSync, rmSync, existsSync } from 'fs';
import { join } from 'path';

describe('ClineCache', () => {
  const testCacheDir = join(process.cwd(), '.test-cache');
  let cache: ClineCache;

  beforeEach(() => {
    // Clean up test cache directory
    if (existsSync(testCacheDir)) {
      rmSync(testCacheDir, { recursive: true, force: true });
    }
    mkdirSync(testCacheDir, { recursive: true });

    cache = new ClineCache({
      cacheDir: testCacheDir,
      ttl: 1, // 1 hour for testing
    });
  });

  afterEach(() => {
    // Clean up after tests
    if (existsSync(testCacheDir)) {
      rmSync(testCacheDir, { recursive: true, force: true });
    }
  });

  describe('set and get', () => {
    it('should store and retrieve cached prompts', async () => {
      const content = 'Test prompt content';
      await cache.set('plan', 'v1.0.0', content);

      const retrieved = await cache.get('plan', 'v1.0.0');
      expect(retrieved).toBe(content);
    });

    it('should return null for non-existent cache', async () => {
      const retrieved = await cache.get('plan', 'v1.0.0');
      expect(retrieved).toBeNull();
    });

    it('should handle different prompt types', async () => {
      await cache.set('plan', 'v1.0.0', 'Plan content');
      await cache.set('act', 'v1.0.0', 'Act content');

      expect(await cache.get('plan', 'v1.0.0')).toBe('Plan content');
      expect(await cache.get('act', 'v1.0.0')).toBe('Act content');
    });

    it('should handle different versions', async () => {
      await cache.set('plan', 'v1.0.0', 'Version 1');
      await cache.set('plan', 'v2.0.0', 'Version 2');

      expect(await cache.get('plan', 'v1.0.0')).toBe('Version 1');
      expect(await cache.get('plan', 'v2.0.0')).toBe('Version 2');
    });
  });

  describe('has', () => {
    it('should return true for existing valid cache', async () => {
      await cache.set('plan', 'v1.0.0', 'Content');
      expect(await cache.has('plan', 'v1.0.0')).toBe(true);
    });

    it('should return false for non-existent cache', async () => {
      expect(await cache.has('plan', 'v1.0.0')).toBe(false);
    });
  });

  describe('clear', () => {
    it('should clear all cache entries', async () => {
      await cache.set('plan', 'v1.0.0', 'Content 1');
      await cache.set('act', 'v1.0.0', 'Content 2');

      await cache.clear();

      expect(await cache.get('plan', 'v1.0.0')).toBeNull();
      expect(await cache.get('act', 'v1.0.0')).toBeNull();
    });
  });

  describe('getStats', () => {
    it('should return correct statistics', async () => {
      await cache.set('plan', 'v1.0.0', 'Content 1');
      await cache.set('act', 'v1.0.0', 'Content 2');

      const stats = await cache.getStats();
      expect(stats.totalEntries).toBe(2);
      expect(stats.validEntries).toBe(2);
      expect(stats.expiredEntries).toBe(0);
    });

    it('should return zero stats for empty cache', async () => {
      const stats = await cache.getStats();
      expect(stats.totalEntries).toBe(0);
      expect(stats.validEntries).toBe(0);
      expect(stats.expiredEntries).toBe(0);
    });
  });

  describe('expiration', () => {
    it('should return null for expired cache', async () => {
      // Create cache with very short TTL
      const shortTtlCache = new ClineCache({
        cacheDir: testCacheDir,
        ttl: 0.0001, // Very short TTL (< 1 second)
      });

      await shortTtlCache.set('plan', 'v1.0.0', 'Content');

      // Wait for cache to expire
      await new Promise(resolve => setTimeout(resolve, 500));

      const retrieved = await shortTtlCache.get('plan', 'v1.0.0');
      expect(retrieved).toBeNull();
    });
  });
});
