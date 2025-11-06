#!/usr/bin/env tsx

/**
 * Environment Variable Validation Script
 *
 * Validates that all required environment variables are set correctly.
 * Run this before deployment or during CI/CD pipeline.
 *
 * Usage: npx tsx scripts/validate-env.ts
 */

import { config } from '../config';

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

function validateEnvironment(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  console.log('🔍 Validating environment variables...\n');

  // Required variables
  const requiredVars = [
    { name: 'BITBUCKET_BASE_URL', value: config.bitbucket.baseUrl, description: 'Bitbucket server URL' },
    { name: 'BITBUCKET_USERNAME', value: config.bitbucket.username, description: 'Bitbucket API username' },
    { name: 'BITBUCKET_APP_PASSWORD', value: config.bitbucket.appPassword, description: 'Bitbucket app password' },
    { name: 'AI_PROVIDER', value: config.ai.provider, description: 'AI provider (groq or openai)' },
    { name: 'AI_API_KEY', value: config.ai.apiKey, description: 'AI API key' },
    { name: 'SLACK_WEBHOOK_URL', value: config.slack.webhookUrl, description: 'Slack webhook URL' },
  ];

  // Check required variables
  for (const varConfig of requiredVars) {
    if (!varConfig.value || varConfig.value === '') {
      errors.push(`❌ ${varConfig.name} is not set - ${varConfig.description}`);
    } else {
      console.log(`✅ ${varConfig.name}: ${maskValue(varConfig.value)}`);
    }
  }

  // Validate URL formats
  if (config.bitbucket.baseUrl && !isValidUrl(config.bitbucket.baseUrl)) {
    errors.push(`❌ BITBUCKET_BASE_URL is not a valid URL: ${config.bitbucket.baseUrl}`);
  }

  if (config.slack.webhookUrl && !isValidUrl(config.slack.webhookUrl)) {
    errors.push(`❌ SLACK_WEBHOOK_URL is not a valid URL: ${config.slack.webhookUrl}`);
  }

  // Validate AI provider
  if (config.ai.provider && !['groq', 'openai'].includes(config.ai.provider)) {
    errors.push(`❌ AI_PROVIDER must be 'groq' or 'openai', got: ${config.ai.provider}`);
  }

  // Check optional but recommended variables
  if (!process.env.CRON_SECRET) {
    warnings.push(`⚠️  CRON_SECRET is not set - cron endpoint will be unprotected`);
  }

  if (!process.env.CRON_REPO_WHITELIST) {
    warnings.push(`⚠️  CRON_REPO_WHITELIST is not set - cron job won't process any repos`);
  }

  // Validate numeric values
  const numericVars = [
    { name: 'REVIEW_FILES_PER_BATCH', value: config.review.filesPerBatch, min: 1, max: 50 },
    { name: 'REVIEW_CONTEXT_LINES', value: config.review.contextLines, min: 0, max: 20 },
    { name: 'DESCRIPTION_CONTEXT_LINES', value: config.description.contextLines, min: 0, max: 20 },
    { name: 'AI_MAX_TOKENS', value: config.ai.maxTokens, min: 100, max: 100000 },
    { name: 'AI_TEMPERATURE', value: config.ai.temperature, min: 0, max: 2 },
  ];

  for (const varConfig of numericVars) {
    if (varConfig.value < varConfig.min || varConfig.value > varConfig.max) {
      warnings.push(
        `⚠️  ${varConfig.name} is out of recommended range (${varConfig.min}-${varConfig.max}): ${varConfig.value}`
      );
    }
  }

  console.log('\n' + '━'.repeat(50));

  if (warnings.length > 0) {
    console.log('\n⚠️  Warnings:\n');
    warnings.forEach((warning) => console.log(warning));
  }

  if (errors.length > 0) {
    console.log('\n❌ Validation Errors:\n');
    errors.forEach((error) => console.log(error));
    console.log('\n💡 Fix these errors before deployment!\n');
  } else {
    console.log('\n✅ All required environment variables are valid!\n');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

function maskValue(value: string): string {
  if (value.startsWith('http')) {
    return value; // URLs are safe to show
  }
  if (value.length <= 4) {
    return '****';
  }
  return value.substring(0, 4) + '*'.repeat(Math.min(value.length - 4, 20));
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// Run validation
const result = validateEnvironment();

if (!result.valid) {
  process.exit(1);
}

if (result.warnings.length > 0) {
  process.exit(0); // Exit with success but show warnings
}

process.exit(0);
