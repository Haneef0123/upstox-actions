import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { withRetry } from '@/lib/utils/batch';

describe('withRetry', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should succeed on first try', async () => {
    const successFn = vi.fn().mockResolvedValue('success');

    const resultPromise = withRetry(successFn, {
      maxRetries: 3,
      initialDelay: 1000,
      backoffMultiplier: 2,
    });

    // Fast-forward through any timers
    await vi.runAllTimersAsync();

    const result = await resultPromise;

    expect(result).toBe('success');
    expect(successFn).toHaveBeenCalledTimes(1);
  });

  it('should retry on failure and eventually succeed', async () => {
    let attempts = 0;
    const retryFn = vi.fn().mockImplementation(() => {
      attempts++;
      if (attempts < 3) {
        return Promise.reject(new Error('Temporary failure'));
      }
      return Promise.resolve('success');
    });

    const resultPromise = withRetry(retryFn, {
      maxRetries: 3,
      initialDelay: 1000,
      backoffMultiplier: 2,
    });

    // Fast-forward through all timers
    await vi.runAllTimersAsync();

    const result = await resultPromise;

    expect(result).toBe('success');
    expect(retryFn).toHaveBeenCalledTimes(3);
  });

  it('should throw error after max retries', async () => {
    const failFn = vi.fn().mockRejectedValue(new Error('Permanent failure'));

    const resultPromise = withRetry(failFn, {
      maxRetries: 3,
      initialDelay: 1000,
      backoffMultiplier: 2,
    });

    // Fast-forward through all timers
    await vi.runAllTimersAsync();

    await expect(resultPromise).rejects.toThrow('Permanent failure');
    expect(failFn).toHaveBeenCalledTimes(4); // Initial + 3 retries
  });

  it('should use default retry options', async () => {
    const successFn = vi.fn().mockResolvedValue('success');

    const resultPromise = withRetry(successFn);

    await vi.runAllTimersAsync();

    const result = await resultPromise;

    expect(result).toBe('success');
    expect(successFn).toHaveBeenCalledTimes(1);
  });
});
