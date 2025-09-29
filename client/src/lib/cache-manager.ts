// Cache manager for optimizing API responses
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class CacheManager {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  set<T>(key: string, data: T, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.DEFAULT_TTL,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    const isExpired = Date.now() - entry.timestamp > entry.ttl;
    
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  invalidate(keyPattern?: string): void {
    if (!keyPattern) {
      this.cache.clear();
      return;
    }

    // Invalidate entries matching the pattern
    for (const key of this.cache.keys()) {
      if (key.includes(keyPattern)) {
        this.cache.delete(key);
      }
    }
  }

  // Preload critical data
  async preload(endpoints: string[]): Promise<void> {
    const promises = endpoints.map(async (endpoint) => {
      try {
        const response = await fetch(endpoint);
        if (response.ok) {
          const data = await response.json();
          this.set(endpoint, data);
        }
      } catch (error) {
        console.error(`Failed to preload ${endpoint}:`, error);
      }
    });

    await Promise.all(promises);
  }
}

export const cacheManager = new CacheManager();

// Export the class for testing
export { CacheManager };

// Cache decorator for React Query
export function withCache<T>(
  queryFn: () => Promise<T>,
  cacheKey: string,
  ttl?: number
): () => Promise<T> {
  return async () => {
    // Check cache first
    const cached = cacheManager.get<T>(cacheKey);
    if (cached !== null) {
      return cached;
    }

    // Fetch fresh data
    const data = await queryFn();
    
    // Cache the result
    cacheManager.set(cacheKey, data, ttl);
    
    return data;
  };
}