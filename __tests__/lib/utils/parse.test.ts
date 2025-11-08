import { describe, it, expect } from 'vitest';
import {
  extractPRUrls,
  parsePRUrl,
  batchArray,
} from '@/lib/utils/parse';

describe('extractPRUrls', () => {
  it('should extract PR URLs from plain text', () => {
    const text = 'Please review: https://bitbucket.example.com/projects/PROJ/repos/repo/pull-requests/123';
    const urls = extractPRUrls(text);

    expect(urls).toHaveLength(1);
    expect(urls[0]).toBe('https://bitbucket.example.com/projects/PROJ/repos/repo/pull-requests/123');
  });

  it('should extract PR URLs wrapped in Slack format', () => {
    const text = 'Check this: <https://bitbucket.example.com/projects/PROJ/repos/repo/pull-requests/456>';
    const urls = extractPRUrls(text);

    expect(urls).toHaveLength(1);
    expect(urls[0]).toBe('https://bitbucket.example.com/projects/PROJ/repos/repo/pull-requests/456');
  });

  it('should extract multiple PR URLs', () => {
    const text = 'PRs: https://bitbucket.example.com/projects/P1/repos/r1/pull-requests/1 and https://bitbucket.example.com/projects/P2/repos/r2/pull-requests/2';
    const urls = extractPRUrls(text);

    expect(urls).toHaveLength(2);
    expect(urls[0]).toBe('https://bitbucket.example.com/projects/P1/repos/r1/pull-requests/1');
    expect(urls[1]).toBe('https://bitbucket.example.com/projects/P2/repos/r2/pull-requests/2');
  });

  it('should handle URLs with "pull" instead of "pull-requests"', () => {
    const text = 'Review: https://bitbucket.example.com/projects/PROJ/repos/repo/pull/789';
    const urls = extractPRUrls(text);

    expect(urls).toHaveLength(1);
    expect(urls[0]).toBe('https://bitbucket.example.com/projects/PROJ/repos/repo/pull/789');
  });

  it('should return empty array for text without PR URLs', () => {
    const text = 'Just some random text without any links';
    const urls = extractPRUrls(text);

    expect(urls).toHaveLength(0);
  });

  it('should handle trailing whitespace and brackets', () => {
    const text = '<https://bitbucket.example.com/projects/PROJ/repos/repo/pull-requests/123>>';
    const urls = extractPRUrls(text);

    expect(urls).toHaveLength(1);
    expect(urls[0]).toBe('https://bitbucket.example.com/projects/PROJ/repos/repo/pull-requests/123');
  });
});

describe('parsePRUrl', () => {
  it('should parse valid PR URL correctly', () => {
    const url = 'https://bitbucket.example.com/projects/GROWTH/repos/ui-stock/pull-requests/42';
    const result = parsePRUrl(url);

    expect(result).not.toBeNull();
    expect(result?.domain).toBe('bitbucket.example.com');
    expect(result?.project).toBe('GROWTH');
    expect(result?.repo).toBe('ui-stock');
    expect(result?.prId).toBe('42');
    expect(result?.fullUrl).toBe(url);
  });

  it('should return null for invalid URL', () => {
    const url = 'https://github.com/user/repo/pull/123';
    const result = parsePRUrl(url);

    expect(result).toBeNull();
  });

  it('should handle HTTP URLs', () => {
    const url = 'http://bitbucket.example.com/projects/TEST/repos/test-repo/pull-requests/1';
    const result = parsePRUrl(url);

    expect(result).not.toBeNull();
    expect(result?.domain).toBe('bitbucket.example.com');
  });

  it('should parse URL with /overview suffix', () => {
    const url = 'https://bitbucket.upstox.com/projects/GROWTH/repos/ui-stock-details/pull-requests/345/overview';
    const result = parsePRUrl(url);

    expect(result).not.toBeNull();
    expect(result?.domain).toBe('bitbucket.upstox.com');
    expect(result?.project).toBe('GROWTH');
    expect(result?.repo).toBe('ui-stock-details');
    expect(result?.prId).toBe('345');
    expect(result?.fullUrl).toBe(url);
  });

  it('should parse URL with /diff suffix', () => {
    const url = 'https://bitbucket.example.com/projects/PROJ/repos/repo/pull-requests/123/diff';
    const result = parsePRUrl(url);

    expect(result).not.toBeNull();
    expect(result?.project).toBe('PROJ');
    expect(result?.prId).toBe('123');
  });

  it('should parse URL with /commits suffix', () => {
    const url = 'https://bitbucket.example.com/projects/PROJ/repos/repo/pull-requests/456/commits';
    const result = parsePRUrl(url);

    expect(result).not.toBeNull();
    expect(result?.project).toBe('PROJ');
    expect(result?.prId).toBe('456');
  });

  it('should parse URL with multiple path segments after PR number', () => {
    const url = 'https://bitbucket.example.com/projects/PROJ/repos/repo/pull-requests/789/overview/some/deep/path';
    const result = parsePRUrl(url);

    expect(result).not.toBeNull();
    expect(result?.prId).toBe('789');
  });

  it('should return null for malformed URL', () => {
    const url = 'not-a-valid-url';
    const result = parsePRUrl(url);

    expect(result).toBeNull();
  });
});

describe('batchArray', () => {
  it('should batch array into chunks of specified size', () => {
    const array = [1, 2, 3, 4, 5, 6, 7, 8];
    const batches = batchArray(array, 3);

    expect(batches).toHaveLength(3);
    expect(batches[0]).toEqual([1, 2, 3]);
    expect(batches[1]).toEqual([4, 5, 6]);
    expect(batches[2]).toEqual([7, 8]);
  });

  it('should handle array smaller than batch size', () => {
    const array = [1, 2];
    const batches = batchArray(array, 5);

    expect(batches).toHaveLength(1);
    expect(batches[0]).toEqual([1, 2]);
  });

  it('should handle empty array', () => {
    const array: number[] = [];
    const batches = batchArray(array, 3);

    expect(batches).toHaveLength(0);
  });

  it('should handle array that divides evenly', () => {
    const array = [1, 2, 3, 4, 5, 6];
    const batches = batchArray(array, 2);

    expect(batches).toHaveLength(3);
    expect(batches[0]).toEqual([1, 2]);
    expect(batches[1]).toEqual([3, 4]);
    expect(batches[2]).toEqual([5, 6]);
  });

  it('should handle batch size of 1', () => {
    const array = ['a', 'b', 'c'];
    const batches = batchArray(array, 1);

    expect(batches).toHaveLength(3);
    expect(batches[0]).toEqual(['a']);
    expect(batches[1]).toEqual(['b']);
    expect(batches[2]).toEqual(['c']);
  });
});
