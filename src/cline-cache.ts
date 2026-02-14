import { readFile, writeFile, mkdir, stat } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export interface CacheEntry {
  version: string;
  timestamp: number;
  content: string;
}

export interface CacheOptions {
  cacheDir: string;
  ttl: number; // Time to live in hours
}

/**
 * Cache manager for Cline prompts
 */
export class ClineCache {
  private cacheDir: string;
  private ttl: number; // in milliseconds

  constructor(options: CacheOptions) {
    this.cacheDir = options.cacheDir;
    this.ttl = options.ttl * 60 * 60 * 1000; // Convert hours to milliseconds
  }

  /**
   * Get cache file path for a specific prompt type and version
   */
  private getCacheFilePath(promptType: 'plan' | 'act', version: string): string {
    return join(this.cacheDir, `${promptType}-${version}.json`);
  }

  /**
   * Ensure cache directory exists
   */
  private async ensureCacheDir(): Promise<void> {
    if (!existsSync(this.cacheDir)) {
      await mkdir(this.cacheDir, { recursive: true });
    }
  }

  /**
   * Check if cache entry is expired
   */
  private isExpired(timestamp: number): boolean {
    const now = Date.now();
    return now - timestamp > this.ttl;
  }

  /**
   * Get cached prompt
   */
  async get(promptType: 'plan' | 'act', version: string): Promise<string | null> {
    try {
      const filePath = this.getCacheFilePath(promptType, version);

      if (!existsSync(filePath)) {
        return null;
      }

      const content = await readFile(filePath, 'utf-8');
      const entry: CacheEntry = JSON.parse(content);

      // Check if cache is expired
      if (this.isExpired(entry.timestamp)) {
        return null;
      }

      return entry.content;
    } catch {
      // If any error occurs, return null (cache miss)
      return null;
    }
  }

  /**
   * Set cached prompt
   */
  async set(promptType: 'plan' | 'act', version: string, content: string): Promise<void> {
    try {
      await this.ensureCacheDir();

      const entry: CacheEntry = {
        version,
        timestamp: Date.now(),
        content,
      };

      const filePath = this.getCacheFilePath(promptType, version);
      await writeFile(filePath, JSON.stringify(entry, null, 2), 'utf-8');
    } catch {
      // Silently fail - caching is not critical
      console.warn(`Failed to write cache for ${promptType}`);
    }
  }

  /**
   * Check if cache exists and is valid
   */
  async has(promptType: 'plan' | 'act', version: string): Promise<boolean> {
    try {
      const filePath = this.getCacheFilePath(promptType, version);

      if (!existsSync(filePath)) {
        return false;
      }

      const stats = await stat(filePath);
      const timestamp = stats.mtimeMs;

      return !this.isExpired(timestamp);
    } catch {
      return false;
    }
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    try {
      const { readdir, unlink } = await import('fs/promises');

      if (!existsSync(this.cacheDir)) {
        return;
      }

      const files = await readdir(this.cacheDir);

      await Promise.all(
        files.filter(file => file.endsWith('.json')).map(file => unlink(join(this.cacheDir, file)))
      );
    } catch {
      console.warn('Failed to clear cache');
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    totalEntries: number;
    validEntries: number;
    expiredEntries: number;
  }> {
    try {
      const { readdir } = await import('fs/promises');

      if (!existsSync(this.cacheDir)) {
        return { totalEntries: 0, validEntries: 0, expiredEntries: 0 };
      }

      const files = await readdir(this.cacheDir);
      const jsonFiles = files.filter(file => file.endsWith('.json'));

      let validEntries = 0;
      let expiredEntries = 0;

      for (const file of jsonFiles) {
        const filePath = join(this.cacheDir, file);
        const content = await readFile(filePath, 'utf-8');
        const entry: CacheEntry = JSON.parse(content);

        if (this.isExpired(entry.timestamp)) {
          expiredEntries++;
        } else {
          validEntries++;
        }
      }

      return {
        totalEntries: jsonFiles.length,
        validEntries,
        expiredEntries,
      };
    } catch {
      return { totalEntries: 0, validEntries: 0, expiredEntries: 0 };
    }
  }
}
