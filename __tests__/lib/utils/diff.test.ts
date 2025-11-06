import { describe, it, expect } from 'vitest';
import {
  processDiffEntries,
  buildReviewFileChangesText,
  buildDescriptionFileChangesText,
  splitDiffsIntoBatches,
} from '@/lib/utils/diff';
import type { DiffEntry } from '@/lib/bitbucket';

describe('processDiffEntries', () => {
  it('should process simple diff entry', () => {
    const diffs: DiffEntry[] = [
      {
        source: { toString: 'file1.ts' },
        destination: { toString: 'file1.ts' },
        binary: false,
        hunks: [
          {
            segments: [
              {
                type: 'ADDED',
                lines: [
                  { line: 'const newVar = 123;', destination: 1, source: undefined },
                ],
              },
              {
                type: 'REMOVED',
                lines: [
                  { line: 'const oldVar = 456;', source: 1, destination: undefined },
                ],
              },
            ],
          },
        ],
      },
    ];

    const result = processDiffEntries(diffs, 5, 150);

    expect(result).toHaveLength(1);
    expect(result[0].file).toBe('file1.ts');
    expect(result[0].isNew).toBe(false);
    expect(result[0].isDeleted).toBe(false);
    expect(result[0].isBinary).toBe(false);
    expect(result[0].addedCount).toBe(1);
    expect(result[0].removedCount).toBe(1);
    expect(result[0].keyChanges).toHaveLength(2);
    expect(result[0].keyChanges[0].type).toBe('added');
    expect(result[0].keyChanges[0].line).toBe('const newVar = 123;');
    expect(result[0].keyChanges[1].type).toBe('removed');
    expect(result[0].keyChanges[1].line).toBe('const oldVar = 456;');
  });

  it('should identify new files', () => {
    const diffs: DiffEntry[] = [
      {
        source: undefined,
        destination: { toString: 'newfile.ts' },
        binary: false,
        hunks: [],
      },
    ];

    const result = processDiffEntries(diffs);

    expect(result).toHaveLength(1);
    expect(result[0].isNew).toBe(true);
    expect(result[0].isDeleted).toBe(false);
  });

  it('should identify deleted files', () => {
    const diffs: DiffEntry[] = [
      {
        source: { toString: 'deletedfile.ts' },
        destination: undefined,
        binary: false,
        hunks: [],
      },
    ];

    const result = processDiffEntries(diffs);

    expect(result).toHaveLength(1);
    expect(result[0].isNew).toBe(false);
    expect(result[0].isDeleted).toBe(true);
  });

  it('should skip binary files', () => {
    const diffs: DiffEntry[] = [
      {
        source: { toString: 'image.png' },
        destination: { toString: 'image.png' },
        binary: true,
        hunks: [],
      },
    ];

    const result = processDiffEntries(diffs);

    expect(result).toHaveLength(1);
    expect(result[0].isBinary).toBe(true);
    expect(result[0].keyChanges).toHaveLength(0);
  });

  it('should limit key changes per file', () => {
    const lines = Array.from({ length: 20 }, (_, i) => ({
      line: `const var${i} = ${i};`,
      destination: i + 1,
      source: undefined,
    }));

    const diffs: DiffEntry[] = [
      {
        source: { toString: 'file.ts' },
        destination: { toString: 'file.ts' },
        binary: false,
        hunks: [
          {
            segments: [
              {
                type: 'ADDED',
                lines,
              },
            ],
          },
        ],
      },
    ];

    const result = processDiffEntries(diffs, 5, 150);

    expect(result[0].addedCount).toBe(20);
    expect(result[0].keyChanges.length).toBeLessThanOrEqual(5);
  });

  it('should skip empty lines and braces', () => {
    const diffs: DiffEntry[] = [
      {
        source: { toString: 'file.ts' },
        destination: { toString: 'file.ts' },
        binary: false,
        hunks: [
          {
            segments: [
              {
                type: 'ADDED',
                lines: [
                  { line: '', destination: 1, source: undefined },
                  { line: '{', destination: 2, source: undefined },
                  { line: 'const valid = 123;', destination: 3, source: undefined },
                  { line: '}', destination: 4, source: undefined },
                  { line: '// comment', destination: 5, source: undefined },
                ],
              },
            ],
          },
        ],
      },
    ];

    const result = processDiffEntries(diffs, 10, 150);

    expect(result[0].addedCount).toBe(5);
    // Only 'const valid = 123;' should be in key changes (empty, braces, and comments skipped)
    expect(result[0].keyChanges).toHaveLength(1);
    expect(result[0].keyChanges[0].line).toBe('const valid = 123;');
  });
});

describe('buildReviewFileChangesText', () => {
  it('should build review text with additions and deletions', () => {
    const diffs: DiffEntry[] = [
      {
        source: { toString: 'file1.ts' },
        destination: { toString: 'file1.ts' },
        binary: false,
        hunks: [
          {
            segments: [
              {
                type: 'ADDED',
                lines: [
                  { line: 'const newCode = 1;', destination: 1, source: undefined },
                ],
              },
              {
                type: 'REMOVED',
                lines: [
                  { line: 'const oldCode = 2;', source: 1, destination: undefined },
                ],
              },
            ],
          },
        ],
      },
    ];

    const result = buildReviewFileChangesText(diffs);

    expect(result).toContain('**file1.ts**');
    expect(result).toContain('+1/-1');
    expect(result).toContain('+ const newCode = 1;');
    expect(result).toContain('- const oldCode = 2;');
  });

  it('should indicate binary files', () => {
    const diffs: DiffEntry[] = [
      {
        source: { toString: 'image.png' },
        destination: { toString: 'image.png' },
        binary: true,
        hunks: [],
      },
    ];

    const result = buildReviewFileChangesText(diffs);

    expect(result).toContain('**image.png** (binary file)');
  });

  it('should return default message for empty diffs', () => {
    const diffs: DiffEntry[] = [];

    const result = buildReviewFileChangesText(diffs);

    expect(result).toBe('No code changes');
  });
});

describe('buildDescriptionFileChangesText', () => {
  it('should build description with file statistics', () => {
    const fileChanges = [
      {
        file: 'file1.ts',
        isNew: false,
        isDeleted: false,
        isBinary: false,
        addedCount: 10,
        removedCount: 5,
        keyChanges: [
          { type: 'added' as const, line: 'const newVar = 1;' },
        ],
      },
      {
        file: 'file2.ts',
        isNew: true,
        isDeleted: false,
        isBinary: false,
        addedCount: 20,
        removedCount: 0,
        keyChanges: [],
      },
    ];

    const result = buildDescriptionFileChangesText(fileChanges);

    expect(result).toContain('File Changes: 2 files');
    expect(result).toContain('+30 lines added');
    expect(result).toContain('-5 lines removed');
    expect(result).toContain('🆕 New Files (1)');
    expect(result).toContain('file2.ts (+20)');
    expect(result).toContain('📝 Modified Files');
    expect(result).toContain('file1.ts');
  });

  it('should show deleted files section', () => {
    const fileChanges = [
      {
        file: 'deleted.ts',
        isNew: false,
        isDeleted: true,
        isBinary: false,
        addedCount: 0,
        removedCount: 100,
        keyChanges: [],
      },
    ];

    const result = buildDescriptionFileChangesText(fileChanges);

    expect(result).toContain('🗑️ Deleted Files (1)');
    expect(result).toContain('deleted.ts (-100)');
  });

  it('should limit top modified files', () => {
    const fileChanges = Array.from({ length: 15 }, (_, i) => ({
      file: `file${i}.ts`,
      isNew: false,
      isDeleted: false,
      isBinary: false,
      addedCount: i * 10,
      removedCount: i * 5,
      keyChanges: [],
    }));

    const result = buildDescriptionFileChangesText(fileChanges, 10);

    expect(result).toContain('top 10 of 15');
    expect(result).toContain('and 5 more modified files');
  });
});

describe('splitDiffsIntoBatches', () => {
  it('should split diffs into batches', () => {
    const diffs: DiffEntry[] = [
      { source: { toString: 'file1.ts' }, destination: { toString: 'file1.ts' }, binary: false, hunks: [] },
      { source: { toString: 'file2.ts' }, destination: { toString: 'file2.ts' }, binary: false, hunks: [] },
      { source: { toString: 'file3.ts' }, destination: { toString: 'file3.ts' }, binary: false, hunks: [] },
      { source: { toString: 'file4.ts' }, destination: { toString: 'file4.ts' }, binary: false, hunks: [] },
      { source: { toString: 'file5.ts' }, destination: { toString: 'file5.ts' }, binary: false, hunks: [] },
    ];

    const batches = splitDiffsIntoBatches(diffs, 2);

    expect(batches).toHaveLength(3);
    expect(batches[0]).toHaveLength(2);
    expect(batches[1]).toHaveLength(2);
    expect(batches[2]).toHaveLength(1);
  });

  it('should handle empty diffs array', () => {
    const diffs: DiffEntry[] = [];
    const batches = splitDiffsIntoBatches(diffs, 2);

    expect(batches).toHaveLength(0);
  });
});
