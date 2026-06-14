export interface Comparable {
  service: string;
  price: number;
  category?: string;
}

const SEED_COMPS: Comparable[] = [
  { service: "Output Grading", price: 0.20, category: "verification" },
  { service: "Human Sign-off", price: 0.50, category: "verification" },
  { service: "Address Intel", price: 1.00, category: "defi" },
  { service: "Daily Brief", price: 0.40, category: "research" },
  { service: "Patent Search", price: 0.60, category: "research" },
  { service: "Tx Risk Flag", price: 0.35, category: "security" },
  { service: "Summary Bot", price: 0.25, category: "research" }
];

interface CacheEntry {
  data: Comparable[];
  expiresAt: number;
}

const compsCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 1000 * 60 * 5; // 5 minutes
const MAX_CACHE_SIZE = 100; // Spatial boundary against OOM leaks

export const clearCache = (): void => compsCache.clear();

export async function fetchComparables(category?: string): Promise<Comparable[]> {
  const cacheKey = category || 'all_categories';
  const now = Date.now();
  const cached = compsCache.get(cacheKey);

  if (cached && cached.expiresAt > now) {
    return cached.data;
  }

  // Mimic network latency
  await new Promise((resolve) => setTimeout(resolve, 300));
  
  const results = category ? SEED_COMPS.filter(c => c.category === category) : SEED_COMPS;
  const finalResults = results.length > 0 ? results : SEED_COMPS; // Fallback
  
  // Evict oldest if we hit the ceiling (FIFO strategy)
  if (compsCache.size >= MAX_CACHE_SIZE && !compsCache.has(cacheKey)) {
    const oldestKey = compsCache.keys().next().value;
    /* v8 ignore next */
    if (oldestKey) compsCache.delete(oldestKey);
  }

  compsCache.set(cacheKey, { data: finalResults, expiresAt: now + CACHE_TTL_MS });
  return finalResults;
}
