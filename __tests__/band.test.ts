import { describe, it, expect } from 'vitest';
import { calculatePriceBand } from '../src/band';

describe('calculatePriceBand', () => {
  it('should return 0s for empty arrays', () => {
    const band = calculatePriceBand([]);
    expect(band.median).toBe(0);
    expect(band.low).toBe(0);
    expect(band.high).toBe(0);
    expect(band.confidence).toBe(0);
  });

  it('should handle a single price', () => {
    const band = calculatePriceBand([0.50]);
    expect(band.median).toBe(0.50);
    expect(band.low).toBe(0.40);
    expect(band.high).toBe(0.60);
    expect(band.confidence).toBe(0.1);
  });

  it('should calculate median and IQR for multiple prices', () => {
    const prices = [0.20, 0.50, 1.00, 0.40, 0.60, 0.35, 0.25];
    const band = calculatePriceBand(prices);
    
    // Sorted: 0.20, 0.25, 0.35, 0.40, 0.50, 0.60, 1.00
    // Median is 0.40
    // Q1 is 0.25
    // Q3 is 0.60
    expect(band.median).toBe(0.40);
    expect(band.low).toBe(0.30);
    expect(band.high).toBe(0.55);
    expect(band.confidence).toBe(0.7); // 7 items = 0.7
  });

  it('should cap confidence at 1.0', () => {
    const prices = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    const band = calculatePriceBand(prices);
    expect(band.confidence).toBe(1.0);
  });
});
