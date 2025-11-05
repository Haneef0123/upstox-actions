/**
 * AI Integration (Groq/OpenAI)
 *
 * This module provides functions to interact with AI services for code review
 * and PR description generation.
 *
 * Based on N8n workflow analysis - see N8N_WORKFLOW_ANALYSIS.md for details.
 */

import Groq from 'groq-sdk';
import OpenAI from 'openai';

export interface AIConfig {
  provider: 'groq' | 'openai';
  apiKey: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  reasoningEffort?: 'low' | 'medium' | 'high';
}

export interface CodeReviewRequest {
  prTitle: string;
  prAuthor: string;
  project: string;
  repository: string;
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
  prAuthor: string;
  fromBranch: string;
  toBranch: string;
  commits: string[];
  fileChanges: string;
}

export interface PRDescriptionResponse {
  description: string;
}

/**
 * Build code review prompt for AI
 *
 * Format from N8n workflow:
 * - PR context
 * - Recent commits (up to 10)
 * - File changes with diffs
 * - Structured output format with severity levels
 */
function buildReviewPrompt(request: CodeReviewRequest): string {
  const { prTitle, prAuthor, project, repository, fromBranch, toBranch, commits, fileChanges, batchIndex, totalBatches } = request;

  // Limit commits to most recent 10
  const recentCommits = commits.slice(0, 10);
  const commitsList = recentCommits.map((msg, i) => `${i + 1}. ${msg}`).join('\n');

  return `You are an expert code reviewer. Review this batch of files from a Pull Request.

## PR INFO (Batch ${batchIndex + 1}/${totalBatches})
**${prTitle}** by ${prAuthor}
${project}/${repository}: ${fromBranch} → ${toBranch}

## RECENT COMMITS
${commitsList}

## FILES IN THIS BATCH
${fileChanges}

## OUTPUT FORMAT
Start with: "### Batch ${batchIndex + 1}/${totalBatches} Review"

**🔴 Critical Issues**
- [file]: [issue description]

**🟠 High Priority**
- [file]: [issue description]

**🟡 Medium Priority**
- [file]: [issue description]

**🟢 Low Priority**
- [file]: [issue description]

**✅ Positive Points**
- [observation]

Keep each line under 120 characters. If no issues in a category, write "• None found"`;
}

/**
 * Build PR description prompt for AI
 *
 * Format from N8n workflow:
 * - PR metadata
 * - Commit history summary
 * - File changes summary
 * - Task description
 */
function buildDescriptionPrompt(request: PRDescriptionRequest): string {
  const { prTitle, prAuthor, fromBranch, toBranch, commits, fileChanges } = request;

  return `You are an expert code reviewer generating a clear and professional PR description.

**Pull Request Information:**
Title: ${prTitle}
Branch: ${fromBranch} → ${toBranch}
Author: ${prAuthor}

**Commit History (Developer Intent):**
${fileChanges}

**Task:**
Generate a comprehensive PR description (5-7 sentences) that:
1. **Summarizes the changes** - What was done? (use commit messages for context)
2. **Explains the purpose** - Why was this needed? (business value)
3. **Highlights key technical changes** - Which files/features were modified?
4. **Notes important details** - New dependencies, breaking changes, etc.

**Format Guidelines:**
- Start with a brief overview paragraph
- Use bullet points for listing multiple features/changes
- Keep it professional and actionable for reviewers
- Focus on the "what" and "why", not just the "how"

**Example Structure:**
This PR implements [feature/fix] to [business purpose]. The changes include [key modifications].

**Key Changes:**
- Feature 1: [description]
- Feature 2: [description]

**Technical Details:**
- [Important technical note]`;
}

/**
 * Generate code review using AI
 *
 * @param config - AI configuration
 * @param request - Code review request
 * @returns AI-generated code review
 */
export async function generateCodeReview(
  config: AIConfig,
  request: CodeReviewRequest
): Promise<CodeReviewResponse> {
  const prompt = buildReviewPrompt(request);

  console.log(`🤖 Generating code review (batch ${request.batchIndex + 1}/${request.totalBatches}) with ${config.provider}...`);

  let reviewText = '';

  if (config.provider === 'groq') {
    const groq = new Groq({ apiKey: config.apiKey });

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: config.model || 'openai/gpt-oss-120b',
      temperature: config.temperature ?? 1,
      max_completion_tokens: config.maxTokens ?? 8192,
      top_p: config.topP ?? 1,
      stream: false,
    });

    reviewText = completion.choices[0]?.message?.content || '';
  } else if (config.provider === 'openai') {
    const openai = new OpenAI({ apiKey: config.apiKey });

    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: config.model || 'gpt-4-turbo-preview',
      temperature: config.temperature ?? 1,
      max_tokens: config.maxTokens ?? 8192,
      top_p: config.topP ?? 1,
    });

    reviewText = completion.choices[0]?.message?.content || '';
  } else {
    throw new Error(`Unsupported AI provider: ${config.provider}`);
  }

  console.log(`✅ Code review generated (${reviewText.length} chars)`);

  return {
    review: reviewText,
    batchIndex: request.batchIndex,
  };
}

/**
 * Generate PR description using AI
 *
 * @param config - AI configuration
 * @param request - PR description request
 * @returns AI-generated PR description
 */
export async function generatePRDescription(
  config: AIConfig,
  request: PRDescriptionRequest
): Promise<PRDescriptionResponse> {
  const prompt = buildDescriptionPrompt(request);

  console.log(`🤖 Generating PR description with ${config.provider}...`);

  let descriptionText = '';

  if (config.provider === 'groq') {
    const groq = new Groq({ apiKey: config.apiKey });

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: config.model || 'openai/gpt-oss-120b',
      temperature: config.temperature ?? 1,
      max_completion_tokens: config.maxTokens ?? 8192,
      top_p: config.topP ?? 1,
      stream: false,
    });

    descriptionText = completion.choices[0]?.message?.content || '';
  } else if (config.provider === 'openai') {
    const openai = new OpenAI({ apiKey: config.apiKey });

    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: config.model || 'gpt-4-turbo-preview',
      temperature: config.temperature ?? 1,
      max_tokens: config.maxTokens ?? 8192,
      top_p: config.topP ?? 1,
    });

    descriptionText = completion.choices[0]?.message?.content || '';
  } else {
    throw new Error(`Unsupported AI provider: ${config.provider}`);
  }

  console.log(`✅ PR description generated (${descriptionText.length} chars)`);

  return {
    description: descriptionText,
  };
}
