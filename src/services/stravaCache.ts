/**
 * Strava API 快取 — stale-while-revalidate 模式
 *
 * - 有效 cache → 秒回
 * - stale cache → 回傳舊值，背景 revalidate
 * - 同一 key 最短 60 秒間隔（Strava rate limit 防護）
 */

interface CacheEntry<T> {
  data: T;
  fetchedAt: number;
}

const cache = new Map<string, CacheEntry<unknown>>();
const inflight = new Map<string, Promise<unknown>>();

/** 最短重新請求間隔（毫秒） */
const MIN_REFETCH_INTERVAL = 60_000;

/**
 * stale-while-revalidate 快取
 *
 * @param key      快取鍵（建議格式 `endpoint:athleteId:params`）
 * @param fetcher  資料拉取函式
 * @param maxAgeMs 最大有效期（毫秒），預設 5 分鐘
 */
export async function staleWhileRevalidate<T>(
  key: string,
  fetcher: () => Promise<T>,
  maxAgeMs = 5 * 60 * 1000,
): Promise<T | null> {
  const now = Date.now();
  const entry = cache.get(key) as CacheEntry<T> | undefined;

  // 命中有效 cache → 直接回傳
  if (entry && now - entry.fetchedAt < maxAgeMs) {
    return entry.data;
  }

  // 有 stale cache + 近 60 秒有人拿過 → 回傳舊值，跳過 revalidate
  if (entry && now - entry.fetchedAt < entry.fetchedAt + MIN_REFETCH_INTERVAL) {
    return entry.data;
  }

  // 已有同一 key 正在飛行中 → 等它完成
  const existing = inflight.get(key);
  if (existing) {
    return existing as Promise<T | null>;
  }

  const doFetch = async (): Promise<T | null> => {
    try {
      const data = await fetcher();
      cache.set(key, { data, fetchedAt: Date.now() });
      return data;
    } catch {
      // fetch 失敗但有 stale → 回傳舊值
      return entry?.data ?? null;
    } finally {
      inflight.delete(key);
    }
  };

  const promise = doFetch();
  inflight.set(key, promise);

  // 有 stale data → 立即回傳舊值，背景 revalidate
  if (entry) {
    return entry.data;
  }

  // 全新 key → 等 fetch 完成
  return promise;
}

/** 清除指定 key 的快取（用於寫入操作後 invalidate） */
export function invalidateCache(key: string): void {
  cache.delete(key);
}

/** 清除包含特定前綴的所有快取 */
export function invalidateCacheByPrefix(prefix: string): void {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) {
      cache.delete(key);
    }
  }
}

/** 清除全部快取 */
export function clearCache(): void {
  cache.clear();
}
