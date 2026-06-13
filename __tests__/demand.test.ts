import { describe, it, expect } from 'vitest';
import { calculateDemand } from '../src/demand';

describe('calculateDemand', () => {
  it('should return default average demand for unknown agents', async () => {
    const demand = await calculateDemand('agent_unknown_123');
    expect(demand.fillRate).toBe(0.50);
    expect(demand.signal).toBe('average demand');
    expect(demand.recommendedAdjustment).toBe(1.0);
  });

  it('should correctly identify the overpriced demo agent', async () => {
    const demand = await calculateDemand('agent_demo_overpriced');
    expect(demand.fillRate).toBe(0.18);
    expect(demand.signal).toContain('priced too high');
    expect(demand.recommendedAdjustment).toBe(0.8);
  });

  it('should correctly identify the underpriced demo agent', async () => {
    const demand = await calculateDemand('agent_demo_underpriced');
    expect(demand.fillRate).toBe(0.95);
    expect(demand.signal).toContain('priced too low');
    expect(demand.recommendedAdjustment).toBe(1.2);
  });
});
