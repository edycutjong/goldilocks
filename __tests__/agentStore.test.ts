import { describe, it, expect } from 'vitest';
import { fetchComparables } from '../src/agentStore';

describe('fetchComparables', () => {
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
});
