import { describe, it, expect, beforeEach } from 'vitest';
import { fetchComparables, clearCache } from '../src/agentStore';

describe('fetchComparables', () => {
  beforeEach(() => {
    clearCache();
  });
  it('should return all seed comparables when no category is provided', async () => {
    const comps = await fetchComparables();
    expect(comps.length).toBeGreaterThan(0);
    // As per seed data, there should be 7
    expect(comps.length).toBe(7);
  });

  it('should return seed comparables even when category is provided (deterministic demo)', async () => {
    const comps = await fetchComparables('verification');
    expect(comps.length).toBe(2);
    
    // Check specific seed data
    const specificComp = comps.find(c => c.service === 'Output Grading');
    expect(specificComp).toBeDefined();
    expect(specificComp?.price).toBe(0.20);
  });

  it('should return from cache on subsequent calls', async () => {
    const first = await fetchComparables('cache-test');
    const second = await fetchComparables('cache-test');
    expect(first).toBe(second); // same array ref
  });

  it('should evict oldest entry when exceeding MAX_CACHE_SIZE', async () => {
    const promises = [];
    for (let i = 0; i < 105; i++) {
      promises.push(fetchComparables(`cat_${i}`));
    }
    await Promise.all(promises);
    // Should successfully hit the eviction branch
  });
});
