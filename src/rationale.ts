import Anthropic from '@anthropic-ai/sdk';
import { Comparable } from './agentStore';
import { PriceBand } from './band';
import { DemandSignal } from './demand';

// Optional: for the hackathon demo, we can use a mocked rationale if no API key is provided
// to ensure the demo always works smoothly on stage without risking API errors.
export async function generateRationale(
  currentPrice: number,
  category: string | undefined,
  band: PriceBand,
  demand: DemandSignal | null,
  comps: Comparable[]
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    // Deterministic fallback for the demo if no key is present.
    if (currentPrice === 5.00 && demand?.fillRate === 0.18) {
      return `Your $5.00 is 10× the category median ($${band.median}) and your fill-rate is ${demand.fillRate * 100}%. Comparable ${category} services cluster at $${band.low}–$${band.high}. Recommend $0.45 to lift fill without underpricing.`;
    }
    return `Based on ${comps.length} comparable services in the ${category || 'general'} category, the market median is $${band.median}.`;
  }

  const anthropic = new Anthropic({ apiKey });

  const prompt = `
You are Goldilocks, an expert AI pricing oracle.
The user is pricing an autonomous agent service.

Current Price: $${currentPrice.toFixed(2)}
Category: ${category || 'Unknown'}
Comparables Found: ${comps.length}
Statistical Band: Median $${band.median}, Low (Q1) $${band.low}, High (Q3) $${band.high}
Demand Signal: ${demand ? `Fill rate is ${demand.fillRate * 100}% (${demand.signal})` : 'No demand data (new service)'}

Write a concise, 2-3 sentence rationale (plain English) explaining why their current price is right or wrong, citing the median and their demand signal, and suggesting they adopt a price closer to the median. Do not output anything other than the rationale paragraph.
  `.trim();

  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-opus-20240229',
      max_tokens: 150,
      temperature: 0.2,
      messages: [
        { role: 'user', content: prompt }
      ]
    });

    // @ts-expect-error - API response typing can vary
    return message.content[0].text.trim();
  } catch (error) {
    console.error("Anthropic API Error:", error);
    return `Based on ${comps.length} comparable services, the median is $${band.median}. You may want to adjust your price towards this median.`;
  }
}
