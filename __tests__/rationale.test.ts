/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from 'vitest';
import { generateRationale } from '../src/rationale';
import Anthropic from '@anthropic-ai/sdk';

vi.mock('@anthropic-ai/sdk', () => {
  const mockCreate = vi.fn();
  return {
    default: class MockAnthropic {
      messages = { create: mockCreate };
    }
  };
});

describe('generateRationale', () => {
  it('should return the deterministic fallback rationale for the demo scenario without an API key', async () => {
    // We intentionally don't provide an API key in the test environment
    const originalEnv = process.env.ANTHROPIC_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;

    const rationale = await generateRationale(
      5.00,
      'research',
      { median: 0.40, low: 0.30, high: 0.70, confidence: 0.7 },
      { fillRate: 0.18, signal: 'priced too high', recommendedAdjustment: 0.8 },
      []
    );

    expect(rationale).toContain('Based on 0 comparable services, the median is 0.4');

    // Restore env if necessary
    if (originalEnv) process.env.ANTHROPIC_API_KEY = originalEnv;
  });

  it('should return a basic fallback for other inputs without an API key', async () => {
    const originalEnv = process.env.ANTHROPIC_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;

    const comps = [
      { service: 'A', price: 1.0 }
    ];

    const rationale = await generateRationale(
      2.00,
      'defi',
      { median: 1.00, low: 0.80, high: 1.20, confidence: 0.1 },
      { fillRate: 0.50, signal: 'average', recommendedAdjustment: 1.0 },
      comps
    );

    expect(rationale).toContain('Based on 1 comparable services, the median is 1.');

    if (originalEnv) process.env.ANTHROPIC_API_KEY = originalEnv;
  });

  it('should call Anthropic API if key is present and return rationale', async () => {
    process.env.ANTHROPIC_API_KEY = 'test_key';
    
    // Setup mock return value
    const mockAnthropicInstance = new Anthropic({ apiKey: 'dummy' });
    vi.mocked(mockAnthropicInstance.messages.create).mockResolvedValueOnce({
      content: [{ type: 'text', text: 'Anthropic rationale' }]
    } as any);

    const rationale = await generateRationale(
      2.00,
      'defi',
      { median: 1.00, low: 0.80, high: 1.20, confidence: 0.1 },
      { fillRate: 0.50, signal: 'average', recommendedAdjustment: 1.0 },
      [{ service: 'A', price: 1.0 }]
    );

    expect(mockAnthropicInstance.messages.create).toHaveBeenCalled();
    expect(rationale).toBe('Anthropic rationale');
    delete process.env.ANTHROPIC_API_KEY;
  });

  it('should catch error from Anthropic API and return fallback', async () => {
    process.env.ANTHROPIC_API_KEY = 'test_key';
    
    // Setup mock to throw error
    const mockAnthropicInstance = new Anthropic({ apiKey: 'dummy' });
    vi.mocked(mockAnthropicInstance.messages.create).mockRejectedValueOnce(new Error('API Down'));

    const rationale = await generateRationale(
      2.00,
      'defi',
      { median: 1.00, low: 0.80, high: 1.20, confidence: 0.1 },
      null,
      [{ service: 'A', price: 1.0 }]
    );

    expect(mockAnthropicInstance.messages.create).toHaveBeenCalled();
    expect(rationale).toContain('Based on 1 comparable services, the median is 1.');
    delete process.env.ANTHROPIC_API_KEY;
  });

  it('should handle non-Error exceptions in API call', async () => {
    process.env.ANTHROPIC_API_KEY = 'test_key';
    const mockAnthropicInstance = new Anthropic({ apiKey: 'dummy' });
    vi.mocked(mockAnthropicInstance.messages.create).mockRejectedValueOnce('String error');

    const rationale = await generateRationale(
      2.00,
      undefined, // test category fallback
      { median: 1.00, low: 0.80, high: 1.20, confidence: 0.1 },
      null,
      [{ service: 'A', price: 1.0 }]
    );

    expect(rationale).toContain('Based on 1 comparable services, the median is 1.');
    delete process.env.ANTHROPIC_API_KEY;
  });

  it('should handle response with no text block', async () => {
    process.env.ANTHROPIC_API_KEY = 'test_key';
    const mockAnthropicInstance = new Anthropic({ apiKey: 'dummy' });
    vi.mocked(mockAnthropicInstance.messages.create).mockResolvedValueOnce({
      content: [{ type: 'image', source: {} as any }]
    } as any);

    const rationale = await generateRationale(
      2.00,
      'defi',
      { median: 1.00, low: 0.80, high: 1.20, confidence: 0.1 },
      null,
      [{ service: 'A', price: 1.0 }]
    );

    expect(rationale).toContain('Based on 1 comparable services, the median is 1.');
    delete process.env.ANTHROPIC_API_KEY;
  });

  it('queues tasks when concurrent calls exceed max', async () => {
    process.env.ANTHROPIC_API_KEY = 'test_key';
    const mockAnthropicInstance = new Anthropic({ apiKey: 'dummy' });
    
    vi.mocked(mockAnthropicInstance.messages.create).mockImplementation(async () => {
      return new Promise(r => {
        setTimeout(() => r({ content: [{ type: 'text', text: 'Anthropic' }] } as any), 10);
      });
    });

    const calls = Array(10).fill(0).map(() => generateRationale(2, 'defi', { median: 1, low: 0, high: 2, confidence: 0 }, null, []));
    
    const results = await Promise.all(calls);
    expect(results).toHaveLength(10);
    delete process.env.ANTHROPIC_API_KEY;
  });
});
