/**
 * Diff Processing Utilities
 *
 * Functions for processing Bitbucket diffs and building AI prompts
 * Based on N8n workflow analysis - see N8N_WORKFLOW_ANALYSIS.md
 */

import type { DiffEntry } from '../bitbucket';
import { batchArray } from './parse';

export interface FileChangeSummary {
  file: string;
  isNew: boolean;
  isDeleted: boolean;
  isBinary: boolean;
  addedCount: number;
  removedCount: number;
  keyChanges: Array<{
    type: 'added' | 'removed';
    line: string;
  }>;
}

/**
 * Check if a line should be skipped when extracting key changes
 *
 * From N8n workflow - skip:
 * - Empty lines
 * - Brace-only lines: ^[{}()\[\];,\s]$
 * - Comment lines: //, /*, <!--
 */
function shouldSkipLine(line: string): boolean {
  const trimmed = line.trim();

  // Empty lines
  if (!trimmed) return true;

  // Brace-only lines
  if (/^[{}()\[\];,\s]*$/.test(trimmed)) return true;

  // Comment lines
  if (trimmed.startsWith('//')) return true;
  if (trimmed.startsWith('/*')) return true;
  if (trimmed.startsWith('*')) return true;
  if (trimmed.startsWith('<!--')) return true;

  return false;
}

/**
 * Process diff entries and extract file change summaries
 *
 * @param diffs - Array of diff entries from Bitbucket
 * @param maxKeyChangesPerFile - Max key changes to extract per file (default: 5 for descriptions)
 * @param lineLengthLimit - Max line length for key changes (default: 150 for descriptions)
 * @returns Array of file change summaries
 */
export function processDiffEntries(
  diffs: DiffEntry[],
  maxKeyChangesPerFile: number = 5,
  lineLengthLimit: number = 150
): FileChangeSummary[] {
  const fileChanges: FileChangeSummary[] = [];

  for (const diff of diffs) {
    const fileName = diff.destination?.toString || diff.source?.toString || 'unknown file';

    const isNewFile = !diff.source;
    const isDeletedFile = !diff.destination;
    const isBinary = diff.binary || false;

    const fileChange: FileChangeSummary = {
      file: fileName,
      isNew: isNewFile,
      isDeleted: isDeletedFile,
      isBinary,
      addedCount: 0,
      removedCount: 0,
      keyChanges: [],
    };

    // Skip binary files for key changes
    if (isBinary) {
      fileChanges.push(fileChange);
      continue;
    }

    // Process hunks and segments
    if (diff.hunks && Array.isArray(diff.hunks)) {
      for (const hunk of diff.hunks) {
        if (hunk.segments && Array.isArray(hunk.segments)) {
          for (const segment of hunk.segments) {
            const segmentType = segment.type;

            if (segment.lines && Array.isArray(segment.lines)) {
              for (const line of segment.lines) {
                const lineText = (line.line || '').trim();

                if (segmentType === 'ADDED') {
                  fileChange.addedCount++;

                  // Extract key changes (limit per file)
                  if (
                    lineText &&
                    lineText.length < lineLengthLimit &&
                    !shouldSkipLine(lineText) &&
                    fileChange.keyChanges.filter(c => c.type === 'added').length < maxKeyChangesPerFile
                  ) {
                    fileChange.keyChanges.push({
                      type: 'added',
                      line: lineText,
                    });
                  }
                } else if (segmentType === 'REMOVED') {
                  fileChange.removedCount++;

                  // Extract key changes (limit per file)
                  if (
                    lineText &&
                    lineText.length < lineLengthLimit &&
                    !shouldSkipLine(lineText) &&
                    fileChange.keyChanges.filter(c => c.type === 'removed').length < maxKeyChangesPerFile
                  ) {
                    fileChange.keyChanges.push({
                      type: 'removed',
                      line: lineText,
                    });
                  }
                }
              }
            }
          }
        }
      }
    }

    fileChanges.push(fileChange);
  }

  return fileChanges;
}

/**
 * Build file changes text for AI code review prompt
 *
 * Includes file names, added/removed counts, and code snippets
 * From N8n workflow - used in batch review prompts
 */
export function buildReviewFileChangesText(
  diffs: DiffEntry[],
  maxLinesPerFile: number = 200
): string {
  let fileChangesText = '';

  for (const diff of diffs) {
    const filePath = diff.destination?.toString || diff.source?.toString || 'Unknown';

    if (diff.binary) {
      fileChangesText += `**${filePath}** (binary file)\n\n`;
      continue;
    }

    let additions = 0;
    let deletions = 0;
    const codeLines: string[] = [];

    const hunks = diff.hunks || [];

    for (const hunk of hunks) {
      const segments = hunk.segments || [];

      for (const segment of segments) {
        const lines = segment.lines || [];

        for (const line of lines) {
          const lineContent = line.line || '';

          if (line.destination && !line.source) {
            // Added line
            additions++;
            if (codeLines.length < maxLinesPerFile) {
              codeLines.push(`+ ${lineContent}`);
            }
          } else if (line.source && !line.destination) {
            // Removed line
            deletions++;
            if (codeLines.length < maxLinesPerFile) {
              codeLines.push(`- ${lineContent}`);
            }
          } else if (codeLines.length > 0 && codeLines.length < maxLinesPerFile) {
            // Context line
            codeLines.push(`  ${lineContent}`);
          }
        }
      }
    }

    const hasMore = codeLines.length >= maxLinesPerFile;
    const codePreview = codeLines.join('\n') + (hasMore ? '\n... (truncated)' : '');

    fileChangesText += `**${filePath}** (+${additions}/-${deletions})\n\`\`\`\n${codePreview}\n\`\`\`\n\n`;
  }

  return fileChangesText || 'No code changes';
}

/**
 * Build file changes summary for PR description prompt
 *
 * Groups files by category (new, deleted, modified) with key changes
 * From N8n workflow - used in description generation
 */
export function buildDescriptionFileChangesText(
  fileChanges: FileChangeSummary[],
  topModifiedFiles: number = 10
): string {
  let summary = '';

  const totalAdded = fileChanges.reduce((sum, f) => sum + f.addedCount, 0);
  const totalRemoved = fileChanges.reduce((sum, f) => sum + f.removedCount, 0);

  summary += `📊 File Changes: ${fileChanges.length} files\n`;
  summary += `+${totalAdded} lines added, -${totalRemoved} lines removed\n\n`;

  // New files
  const newFiles = fileChanges.filter(f => f.isNew);
  if (newFiles.length > 0) {
    summary += `🆕 New Files (${newFiles.length}):\n`;
    newFiles.forEach(f => {
      summary += `• ${f.file} (+${f.addedCount})\n`;
    });
    summary += '\n';
  }

  // Deleted files
  const deletedFiles = fileChanges.filter(f => f.isDeleted);
  if (deletedFiles.length > 0) {
    summary += `🗑️ Deleted Files (${deletedFiles.length}):\n`;
    deletedFiles.forEach(f => {
      summary += `• ${f.file} (-${f.removedCount})\n`;
    });
    summary += '\n';
  }

  // Modified files - show only top N
  const modifiedFiles = fileChanges.filter(f => !f.isNew && !f.isDeleted);
  if (modifiedFiles.length > 0) {
    const sortedFiles = modifiedFiles
      .map(f => ({
        ...f,
        totalChanges: f.addedCount + f.removedCount,
      }))
      .sort((a, b) => b.totalChanges - a.totalChanges);

    const displayFiles = sortedFiles.slice(0, topModifiedFiles);

    summary += `📝 Modified Files (top ${displayFiles.length} of ${modifiedFiles.length}):\n\n`;

    displayFiles.forEach(file => {
      summary += `📄 ${file.file}\n`;
      summary += `Changes: +${file.addedCount} -${file.removedCount}\n`;

      if (file.keyChanges.length > 0) {
        summary += `Key changes:\n`;
        file.keyChanges.forEach(change => {
          const prefix = change.type === 'added' ? ' +' : ' -';
          const displayLine = change.line.length > 100 ? change.line.substring(0, 100) + '...' : change.line;
          summary += `${prefix} ${displayLine}\n`;
        });
      }
      summary += '\n';
    });

    if (modifiedFiles.length > topModifiedFiles) {
      summary += `... and ${modifiedFiles.length - topModifiedFiles} more modified files\n`;
    }
  }

  return summary;
}

/**
 * Split diffs into batches for AI processing
 *
 * From N8n workflow - split by number of files per batch (default: 2 for reviews)
 */
export function splitDiffsIntoBatches(diffs: DiffEntry[], filesPerBatch: number = 2): DiffEntry[][] {
  return batchArray(diffs, filesPerBatch);
}
