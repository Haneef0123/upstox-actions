import '@testing-library/jest-dom';

// Mock environment variables for tests
process.env.BITBUCKET_BASE_URL = 'https://test-bitbucket.example.com';
process.env.BITBUCKET_USERNAME = 'test-user';
process.env.BITBUCKET_APP_PASSWORD = 'test-password';
process.env.AI_PROVIDER = 'groq';
process.env.AI_API_KEY = 'test-api-key';
process.env.AI_MODEL = 'openai/gpt-oss-120b';
process.env.SLACK_WEBHOOK_URL = 'https://hooks.slack.com/test-webhook';
