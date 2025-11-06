import { NextResponse } from 'next/server';
import { config } from '@/config';

/**
 * Health Check Endpoint
 *
 * Returns the health status of the application and its dependencies.
 * Useful for monitoring, load balancers, and uptime checks.
 *
 * GET /api/health
 */
export async function GET() {
  const startTime = Date.now();

  try {
    // Check environment configuration
    const configChecks = {
      bitbucket: {
        configured: !!(config.bitbucket.baseUrl && config.bitbucket.username && config.bitbucket.appPassword),
        baseUrl: config.bitbucket.baseUrl ? 'configured' : 'missing',
      },
      ai: {
        configured: !!(config.ai.provider && config.ai.apiKey),
        provider: config.ai.provider || 'not set',
        model: config.ai.model || 'not set',
      },
      slack: {
        configured: !!config.slack.webhookUrl,
        webhookUrl: config.slack.webhookUrl ? 'configured' : 'missing',
      },
      cron: {
        configured: !!process.env.CRON_SECRET,
        repoWhitelist: !!process.env.CRON_REPO_WHITELIST,
      },
    };

    // Calculate overall health status
    const allConfigured =
      configChecks.bitbucket.configured &&
      configChecks.ai.configured &&
      configChecks.slack.configured;

    const status = allConfigured ? 'healthy' : 'degraded';
    const statusCode = allConfigured ? 200 : 503;

    const response = {
      status,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '0.1.0',
      environment: process.env.NODE_ENV || 'development',
      services: {
        bitbucket: configChecks.bitbucket.configured ? 'ready' : 'not configured',
        ai: configChecks.ai.configured ? 'ready' : 'not configured',
        slack: configChecks.slack.configured ? 'ready' : 'not configured',
        cron: configChecks.cron.configured ? 'protected' : 'unprotected',
      },
      configuration: configChecks,
      responseTime: Date.now() - startTime,
    };

    return NextResponse.json(response, { status: statusCode });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}
