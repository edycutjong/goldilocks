import Anthropic from '@anthropic-ai/sdk';
import type { PriceBand } from './band';
import type { DemandSignal } from './demand';
import type { Comparable } from './agentStore';

// Native concurrency semaphore to protect LLM rate limits
class Semaphore {
  private tasks: (() => void)[] = [];
  private active = 0;
  constructor(private max: number) {}

  async run<T>(fn: () => Promise<T>): Promise<T> {
    if (this.active >= this.max) {
      await new Promise<void>(resolve => this.tasks.push(resolve));
    }
    this.active++;
    try {
      return await fn();
    } finally {
      this.active--;
      const next = this.tasks.shift();
      if (next) next();
    }
  }
}

const llmSemaphore = new Semaphore(5); // Max 5 concurrent LLM calls

export async function generateRationale(
  currentPrice: number,
  category: string | undefined,
  band: PriceBand,
  demand: DemandSignal | null,
  comps: Comparable[]
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const fallback = `Based on ${comps.length} comparable services, the median is ${band.median}. You may want to adjust your price towards this median.`;

  if (!apiKey) {
    console.warn("[Goldilocks] Missing ANTHROPIC_API_KEY. Yielding fallback rationale.");
    return fallback;
  }

  const anthropic = new Anthropic({ apiKey });
  
  const prompt = `You are Goldilocks, an expert AI pricing oracle. The user is pricing an autonomous agent service.
Current Price: ${currentPrice}
Category: ${category || 'Unknown'}
Comparables Found: ${comps.length}
Statistical Band: Median ${band.median}, Low (Q1) ${band.low}, High (Q3) ${band.high}
Demand Signal: ${demand ? `Fill rate is ${demand.fillRate * 100}% (${demand.signal})` : 'No demand data'}`;

  // Enqueue the request through the semaphore
  return llmSemaphore.run(async () => {
    try {
      const message = await anthropic.messages.create(
        {
          model: 'claude-3-opus-20240229',
          max_tokens: 150,
          temperature: 0.2,
          messages: [{ role: 'user', content: prompt }]
        },
        { signal: AbortSignal.timeout(8000) }
      );

      // Extract text content safely
      const textBlock = message.content.find((b): b is Anthropic.TextBlock => b.type === 'text');
      return textBlock ? textBlock.text.trim() : fallback;
    } catch (error) {
      console.error("[Goldilocks] Anthropic API Error or Timeout:", error instanceof Error ? error.message : String(error));
      return fallback;
    }
  });
}
