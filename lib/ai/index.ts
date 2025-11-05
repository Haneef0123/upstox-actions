/**
 * AI Integration (Groq/OpenAI)
 *
 * This module provides functions to interact with AI services:
 * - Generate code reviews
 * - Generate PR descriptions
 */

export interface AIConfig {
  provider: 'groq' | 'openai';
  apiKey: string;
  model?: string;
}

export interface CodeReviewRequest {
  prTitle: string;
  prAuthor: string;
  fromBranch: string;
  toBranch: string;
  commits: string[];
  fileChanges: string;
  batchIndex: number;
  totalBatches: number;
}

export interface CodeReviewResponse {
  review: string;
  batchIndex: number;
}

export interface PRDescriptionRequest {
  prTitle: string;
  fromBranch: string;
  toBranch: string;
  commits: string[];
  fileChanges: string;
}

export interface PRDescriptionResponse {
  description: string;
}

// Placeholder functions - to be implemented
export async function generateCodeReview(
  config: AIConfig,
  request: CodeReviewRequest
): Promise<CodeReviewResponse> {
  throw new Error('Not implemented');
}

export async function generatePRDescription(
  config: AIConfig,
  request: PRDescriptionRequest
): Promise<PRDescriptionResponse> {
  throw new Error('Not implemented');
}
