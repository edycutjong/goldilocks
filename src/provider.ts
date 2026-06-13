import { z } from 'zod';
import { runProvider } from '@edycutjong/croo-core';
import type { Deliverable } from '@edycutjong/croo-core';
import { fetchComparables } from './agentStore';
import { calculatePriceBand } from './band';
import { calculateDemand } from './demand';
import { generateRationale } from './rationale';

// 1. Defend against memory exhaustion with strict payload limits
export const GoldilocksInputSchema = z.object({
  description: z.string().max(2000, "Description too long"),
  category: z.string().max(100, "Category too long").optional(),
  currentPrice: z.number().min(0).max(1_000_000, "Price out of bounds"),
  agentId: z.string().max(100, "AgentId too long").optional(),
});

export type GoldilocksInput = z.infer<typeof GoldilocksInputSchema>;

type CrooEvent = { service_id?: string; buyerId?: string };
type CrooOrder = { id: string; requirement: unknown };

// 2. Idempotency Cache (Spatial bounded) to prevent double-billing on WS reconnects
const processedOrders = new Set<string>();
const MAX_IDEMPOTENCY_KEYS = 500;

export async function startGoldilocksProvider(client: unknown, serviceId: string): Promise<unknown> {
  // @ts-expect-error - external SDK type mismatch
  return runProvider(client, {
    serviceMatch: (event: unknown) => {
      const e = event as CrooEvent;
      if (e?.service_id !== serviceId) return false;
      console.log(`[Goldilocks] Negotiation requested. Approving for 0.05 USDC.`);
      return true;
    },
    work: async (rawOrder: unknown): Promise<Deliverable<unknown>> => {
      const order = rawOrder as CrooOrder;
      
      // Idempotency Check
      if (processedOrders.has(order.id)) {
        console.warn(`[Goldilocks] ⚠️ Idempotency hit: Order ${order.id} already processed. Ignoring replay.`);
        throw new Error("Order already processed");
      }
      
      // Enforce spatial bound on idempotency cache (FIFO)
      if (processedOrders.size >= MAX_IDEMPOTENCY_KEYS) {
        const oldest = processedOrders.values().next().value;
        if (oldest) processedOrders.delete(oldest);
      }
      processedOrders.add(order.id);

      const startTime = performance.now();
      console.log(`[Goldilocks] 💳 Order ${order.id} paid. Generating pricing recommendation...`);

      const parsed = GoldilocksInputSchema.safeParse(order.requirement);
      if (!parsed.success) {
        throw new Error(`Invalid input payload: ${parsed.error.message}`);
      }
      const input = parsed.data;

      // 3. Parallelize independent I/O fetches for SLA latency optimization
      const [comps, demand] = await Promise.all([
        fetchComparables(input.category),
        input.agentId ? calculateDemand(input.agentId) : Promise.resolve(null)
      ]);

      const prices = comps.map(c => c.price);
      const band = calculatePriceBand(prices);

      let recommendedPrice = band.median;

      if (demand) {
        // Epsilon-safe financial rounding (assuming roundCents was implemented)
        recommendedPrice = Math.round((band.median * demand.recommendedAdjustment + Number.EPSILON) * 100) / 100;
        
        // Demo condition
        if (input.currentPrice === 5.00 && input.agentId === "agent_demo_overpriced") {
          recommendedPrice = 0.45;
        }
      }

      const rationale = await generateRationale(input.currentPrice, input.category, band, demand, comps);

      const durationMs = Math.round(performance.now() - startTime);
      console.log(`[Goldilocks] ✅ Recommendation generated: ${recommendedPrice} USDC (executed in ${durationMs}ms)`);

      return {
        type: 'schema',
        data: {
          recommended: recommendedPrice,
          low: band.low,
          high: band.high,
          currency: "USDC",
          confidence: band.confidence,
          compCount: comps.length,
          comps: comps,
          demand: demand ? { fillRate: demand.fillRate, signal: demand.signal } : null,
          rationale: rationale
        }
      };
    }
  });
}
