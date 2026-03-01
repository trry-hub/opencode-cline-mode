/**
 * Cache management for Cline prompts
 *
 * Note: This cache is used for temporary storage during the session.
 * Since the plugin must fail on startup if prompts can't be fetched,
 * persistent caching is not implemented.
 */

import * as fs from "fs";
import * as path from "path";
import * as os from "os";

export interface CacheEntry {
  content: string;
  fetchedAt: number;
  path: string;
}

export class PromptCache {
  private cacheDir: string;
  private cache: Map<string, CacheEntry> = new Map();

  constructor() {
    this.cacheDir = path.join(
      os.homedir(),
      ".opencode",
      "cache",
      "cline-prompts",
    );
    this.ensureCacheDir();
  }

  private ensureCacheDir(): void {
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  /**
   * Get cached content for a file
   */
  get(filePath: string): CacheEntry | null {
    const cached = this.cache.get(filePath);
    if (cached) {
      return cached;
    }

    const cacheFile = this.getCacheFilePath(filePath);
    if (fs.existsSync(cacheFile)) {
      try {
        const data = JSON.parse(fs.readFileSync(cacheFile, "utf-8"));
        this.cache.set(filePath, data);
        return data;
      } catch {
        return null;
      }
    }

    return null;
  }

  /**
   * Set cache content for a file
   */
  set(filePath: string, content: string): void {
    const entry: CacheEntry = {
      content,
      fetchedAt: Date.now(),
      path: filePath,
    };

    this.cache.set(filePath, entry);

    const cacheFile = this.getCacheFilePath(filePath);
    const cacheFileDir = path.dirname(cacheFile);

    if (!fs.existsSync(cacheFileDir)) {
      fs.mkdirSync(cacheFileDir, { recursive: true });
    }

    fs.writeFileSync(cacheFile, JSON.stringify(entry, null, 2));
  }

  /**
   * Clear all cached prompts
   */
  clear(): void {
    this.cache.clear();
    if (fs.existsSync(this.cacheDir)) {
      fs.rmSync(this.cacheDir, { recursive: true, force: true });
    }
    this.ensureCacheDir();
  }

  /**
   * Get cache file path for a GitHub file path
   */
  private getCacheFilePath(filePath: string): string {
    const sanitized = filePath.replace(/\//g, "_").replace(/\\/g, "_");
    return path.join(this.cacheDir, `${sanitized}.json`);
  }

  /**
   * Get cache stats
   */
  getStats(): { fileCount: number; totalSize: number } {
    let totalSize = 0;

    for (const entry of this.cache.values()) {
      totalSize += entry.content.length;
    }

    return {
      fileCount: this.cache.size,
      totalSize,
    };
  }
}
