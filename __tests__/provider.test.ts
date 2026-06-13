/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from 'vitest';
import { startGoldilocksProvider } from '../src/provider';
import * as crooCore from '@edycutjong/croo-core';
import * as agentStore from '../src/agentStore';
import * as band from '../src/band';
import * as demand from '../src/demand';
import * as rationale from '../src/rationale';

vi.mock('@edycutjong/croo-core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@edycutjong/croo-core')>();
  return {
    ...actual,
    runProvider: vi.fn().mockImplementation((client, handlers) => handlers),
  };
});

vi.mock('../src/agentStore');
vi.mock('../src/band');
vi.mock('../src/demand');
vi.mock('../src/rationale');

describe('Goldilocks Provider', () => {
  it('registers with runProvider using correct serviceId', async () => {
    const client = {};
    const handlers: any = await startGoldilocksProvider(client, 'test_service');
    
    expect(crooCore.runProvider).toHaveBeenCalledWith(client, expect.any(Object));
    expect(handlers.serviceMatch({ service_id: 'test_service', buyerId: 'buyer1' } as any)).toBe(true);
    expect(handlers.serviceMatch({ service_id: 'other' } as any)).toBe(false);
  });

  it('throws error if currentPrice is missing', async () => {
    const handlers: any = await startGoldilocksProvider({}, 'test_service');
    
    await expect(handlers.work({
      id: 'o1',
      requirement: { description: 'test' },
    } as any)).rejects.toThrow('Invalid input payload');
  });

  it('delivers the order successfully for the demo overpriced scenario', async () => {
    const handlers: any = await startGoldilocksProvider({}, 'test_service');
    
    vi.mocked(agentStore.fetchComparables).mockResolvedValueOnce([{ price: 1 }, { price: 2 }] as any);
    vi.mocked(band.calculatePriceBand).mockReturnValueOnce({ median: 0.40, low: 0.20, high: 0.60, confidence: 0.8 });
    vi.mocked(demand.calculateDemand).mockResolvedValueOnce({ fillRate: 0.9, signal: 'high', recommendedAdjustment: 1.0 });
    vi.mocked(rationale.generateRationale).mockResolvedValueOnce('Recommend $0.45');

    const result = await handlers.work({
      id: 'o2',
      requirement: {
        description: 'Summarizes on-chain governance proposals',
        category: 'research',
        currentPrice: 5.00,
        agentId: 'agent_demo_overpriced'
      },
    } as any);

    expect(result.type).toBe('schema');
    expect(result.data.recommended).toBe(0.45); // Special hardcoded demo condition
    expect(result.data.low).toBe(0.20);
    expect(result.data.rationale).toBe('Recommend $0.45');
    expect(result.data.demand.fillRate).toBe(0.9);
  });

  it('delivers the order successfully for normal scenario without demand', async () => {
    const handlers: any = await startGoldilocksProvider({}, 'test_service');
    
    vi.mocked(agentStore.fetchComparables).mockResolvedValueOnce([{ price: 1 }] as any);
    vi.mocked(band.calculatePriceBand).mockReturnValueOnce({ median: 0.50, low: 0.40, high: 0.60, confidence: 0.5 });
    vi.mocked(rationale.generateRationale).mockResolvedValueOnce('Normal');

    const result = await handlers.work({
      id: 'o3',
      requirement: {
        description: 'Normal task',
        currentPrice: 1.00
      },
    } as any);

    expect(result.type).toBe('schema');
    expect(result.data.recommended).toBe(0.50);
    expect(result.data.demand).toBeNull();
  });
});
