import { median, quantile } from 'simple-statistics';

export interface PriceBand {
  median: number;
  low: number;
  high: number;
  confidence: number;
}

// Epsilon-safe financial rounding utility
export const roundCents = (val: number): number => Math.round((val + Number.EPSILON) * 100) / 100;

export function calculatePriceBand(prices: number[]): PriceBand {
  if (!prices || prices.length === 0) {
    return { median: 0, low: 0, high: 0, confidence: 0 };
  }

  const confidence = Math.min(1.0, prices.length / 10);

  if (prices.length === 1) {
    return {
      median: roundCents(prices[0]),
      low: roundCents(prices[0] * 0.8),
      high: roundCents(prices[0] * 1.2),
      confidence: roundCents(confidence)
    };
  }

  return {
    median: roundCents(median(prices)),
    low: roundCents(quantile(prices, 0.25)),
    high: roundCents(quantile(prices, 0.75)),
    confidence: roundCents(confidence)
  };
}
