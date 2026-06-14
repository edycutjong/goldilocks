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

/** SDK-shaped Order (camelCase, no inline requirement). */
function makeOrder(overrides: Record<string, unknown> = {}) {
  return { orderId: 'o1', negotiationId: 'n1', ...overrides };
}

/** Client whose negotiation carries the given requirement payload. */
function makeClient(requirement: unknown, extra: Record<string, any> = {}) {
  return {
    getNegotiation: vi.fn().mockResolvedValue({
      negotiationId: 'n1',
      requirements: typeof requirement === 'string' ? requirement : JSON.stringify(requirement),
    }),
    ...extra,
  };
}

describe('Goldilocks Provider', () => {
  it('registers with runProvider using correct serviceId', async () => {
    const client = {};
    const handlers: any = await startGoldilocksProvider(client, 'test_service');

    expect(crooCore.runProvider).toHaveBeenCalledWith(client, expect.any(Object));
    expect(handlers.serviceMatch({ service_id: 'test_service', buyerId: 'buyer1' } as any)).toBe(true);
    expect(handlers.serviceMatch({ service_id: 'other' } as any)).toBe(false);
  });

  it('throws error if currentPrice is missing', async () => {
    const client = makeClient({ description: 'test' });
    const handlers: any = await startGoldilocksProvider(client, 'test_service');

    await expect(handlers.work(makeOrder({ orderId: 'o_missing' }) as any)).rejects.toThrow('Invalid input payload');
  });

  it('throws if the negotiation requirements are not valid JSON', async () => {
    const client = makeClient('not-json');
    const handlers: any = await startGoldilocksProvider(client, 'test_service');

    await expect(handlers.work(makeOrder({ orderId: 'o_badjson' }) as any)).rejects.toThrow('Invalid input payload');
  });

  it('throws if the negotiation cannot be loaded', async () => {
    const client = { getNegotiation: vi.fn().mockRejectedValue(new Error('boom')) };
    const handlers: any = await startGoldilocksProvider(client, 'test_service');

    await expect(handlers.work(makeOrder({ orderId: 'o_negfail' }) as any)).rejects.toThrow('Failed to load negotiation');
  });

  it('delivers the order successfully for the demo overpriced scenario', async () => {
    const client = makeClient({
      description: 'Summarizes on-chain governance proposals',
      category: 'research',
      currentPrice: 5.00,
      agentId: 'agent_demo_overpriced',
    });
    const handlers: any = await startGoldilocksProvider(client, 'test_service');

    vi.mocked(agentStore.fetchComparables).mockResolvedValueOnce([{ price: 1 }, { price: 2 }] as any);
    vi.mocked(band.calculatePriceBand).mockReturnValueOnce({ median: 0.40, low: 0.20, high: 0.60, confidence: 0.8 });
    vi.mocked(demand.calculateDemand).mockResolvedValueOnce({ fillRate: 0.9, signal: 'high', recommendedAdjustment: 1.0 });
    vi.mocked(rationale.generateRationale).mockResolvedValueOnce('Recommend $0.45');

    const result = await handlers.work(makeOrder({ orderId: 'o2' }) as any);

    expect(result.type).toBe('schema');
    expect(result.data.recommended).toBe(0.45);
    expect(result.data.low).toBe(0.20);
    expect(result.data.rationale).toBe('Recommend $0.45');
    expect(result.data.demand.fillRate).toBe(0.9);
  });

  it('delivers the order successfully for normal scenario without demand', async () => {
    const client = makeClient({ description: 'Normal task', currentPrice: 1.00 });
    const handlers: any = await startGoldilocksProvider(client, 'test_service');

    vi.mocked(agentStore.fetchComparables).mockResolvedValueOnce([{ price: 1 }] as any);
    vi.mocked(band.calculatePriceBand).mockReturnValueOnce({ median: 0.50, low: 0.40, high: 0.60, confidence: 0.5 });
    vi.mocked(rationale.generateRationale).mockResolvedValueOnce('Normal');

    const result = await handlers.work(makeOrder({ orderId: 'o3' }) as any);

    expect(result.type).toBe('schema');
    expect(result.data.recommended).toBe(0.50);
    expect(result.data.demand).toBeNull();
  });

  it('rejects the order and triggers a refund if no comparables are found', async () => {
    const client = makeClient(
      { description: 'Obscure task', category: 'obscure_category', currentPrice: 10.00 },
      { rejectOrder: vi.fn().mockResolvedValue(undefined) },
    );
    const handlers: any = await startGoldilocksProvider(client, 'test_service');

    vi.mocked(agentStore.fetchComparables).mockResolvedValueOnce([] as any);

    await expect(handlers.work(makeOrder({ orderId: 'o4' }) as any))
      .rejects.toThrow('Order rejected due to insufficient market data (refund issued).');

    expect(client.rejectOrder).toHaveBeenCalledWith('o4', expect.stringContaining('INSUFFICIENT_MARKET_DATA'));
  });

  it('rejects the order if no comparables found and category is undefined', async () => {
    const client = makeClient(
      { description: 'test', currentPrice: 10 },
      { rejectOrder: vi.fn().mockResolvedValue(undefined) },
    );
    const handlers: any = await startGoldilocksProvider(client, 'test_service');

    vi.mocked(agentStore.fetchComparables).mockResolvedValueOnce([] as any);

    await expect(handlers.work(makeOrder({ orderId: 'o5' }) as any))
      .rejects.toThrow('Order rejected due to insufficient market data (refund issued).');
    expect(client.rejectOrder).toHaveBeenCalledWith('o5', expect.stringContaining('INSUFFICIENT_MARKET_DATA'));
  });

  it('applies elite agent trust premium when agentId is not overpriced demo', async () => {
    const client = makeClient({ description: 'Elite agent task', currentPrice: 1.00, agentId: 'elite_agent' });
    const handlers: any = await startGoldilocksProvider(client, 'test_service');

    vi.mocked(agentStore.fetchComparables).mockResolvedValueOnce([{ price: 1 }] as any);
    vi.mocked(band.calculatePriceBand).mockReturnValueOnce({ median: 0.50, low: 0.40, high: 0.60, confidence: 0.5 });
    vi.mocked(demand.calculateDemand).mockResolvedValueOnce({ fillRate: 0.9, signal: 'high', recommendedAdjustment: 1.0 });

    const result = await handlers.work(makeOrder({ orderId: 'o6' }) as any);

    expect(result.type).toBe('schema');
    expect(result.data.trustPremiumApplied).toBe(1.15);
  });

  it('applies no trust premium when agentId is average', async () => {
    const client = makeClient({ description: 'Average agent task', currentPrice: 1.00, agentId: 'average_agent' });
    const handlers: any = await startGoldilocksProvider(client, 'test_service');

    vi.mocked(agentStore.fetchComparables).mockResolvedValueOnce([{ price: 1 }] as any);
    vi.mocked(band.calculatePriceBand).mockReturnValueOnce({ median: 0.50, low: 0.40, high: 0.60, confidence: 0.5 });
    vi.mocked(demand.calculateDemand).mockResolvedValueOnce({ fillRate: 0.9, signal: 'average', recommendedAdjustment: 1.0 });

    const result = await handlers.work(makeOrder({ orderId: 'o7' }) as any);

    expect(result.type).toBe('schema');
    expect(result.data.trustPremiumApplied).toBeUndefined();
  });

  it('throws error on idempotent request', async () => {
    const client = makeClient({ description: 'test', currentPrice: 1 });
    const handlers: any = await startGoldilocksProvider(client, 'test_service');

    vi.mocked(agentStore.fetchComparables).mockResolvedValueOnce([{ price: 1 }] as any);
    vi.mocked(band.calculatePriceBand).mockReturnValueOnce({ median: 0.50, low: 0.40, high: 0.60, confidence: 0.5 });
    await handlers.work(makeOrder({ orderId: 'idemp1' }) as any);

    await expect(handlers.work(makeOrder({ orderId: 'idemp1' }) as any))
      .rejects.toThrow('Order already processed');
  });

  it('evicts oldest idempotency key when exceeding MAX_IDEMPOTENCY_KEYS', async () => {
    const client = makeClient({ description: 'test', currentPrice: 1 });
    const handlers: any = await startGoldilocksProvider(client, 'test_service');

    vi.mocked(agentStore.fetchComparables).mockResolvedValue([{ price: 1 }] as any);
    vi.mocked(band.calculatePriceBand).mockReturnValue({ median: 0.50, low: 0.40, high: 0.60, confidence: 0.5 });

    for (let i = 0; i < 505; i++) {
      await handlers.work(makeOrder({ orderId: `flood_${i}` }) as any);
    }

    const res = await handlers.work(makeOrder({ orderId: 'flood_0' }) as any);
    expect(res).toBeDefined();
  });
});
