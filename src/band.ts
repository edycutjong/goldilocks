import { median, quantile } from 'simple-statistics';

export interface PriceBand {
  median: number;
  low: number;
  high: number;
  confidence: number;
}

/**
 * Calculates a statistical price band using median and IQR.
 * @param prices Array of comparable prices.
 * @returns A PriceBand containing the median, low (Q1), high (Q3), and a confidence score.
 */
export function calculatePriceBand(prices: number[]): PriceBand {
  if (!prices || prices.length === 0) {
    return {
      median: 0,
      low: 0,
      high: 0,
      confidence: 0,
    };
  }

  // Confidence scales with sample size.
  // Thin market (< 3) = low confidence. >= 7 = high confidence.
  const confidence = Math.min(1.0, prices.length / 10);

  if (prices.length === 1) {
    return {
      median: prices[0],
      low: prices[0] * 0.8,
      high: prices[0] * 1.2,
      confidence: confidence
    };
  }

  const pMedian = median(prices);
  
  // Calculate Q1 (25th percentile) and Q3 (75th percentile)
  const q1 = quantile(prices, 0.25);
  const q3 = quantile(prices, 0.75);

  return {
    median: Number(pMedian.toFixed(2)),
    low: Number(q1.toFixed(2)),
    high: Number(q3.toFixed(2)),
    confidence: Number(confidence.toFixed(2))
  };
}
