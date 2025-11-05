/**
 * Core Type Definitions
 *
 * Shared types used across the application
 */

// PR Information
export interface PRInfo {
  id: number;
  project: string;
  repository: string;
  title: string;
  author: {
    name: string;
    email: string;
  };
  fromBranch: string;
  toBranch: string;
  description: string;
  state: 'OPEN' | 'MERGED' | 'DECLINED';
  version: number;
  commits: PRCommit[];
  diff?: string;
  url: string;
}

export interface PRCommit {
  id: string;
  message: string;
  author: {
    name: string;
    email: string;
  };
  timestamp: number;
}

// Batch Review
export interface BatchReview {
  batchIndex: number;
  totalBatches: number;
  files: string[];
  additions: number;
  deletions: number;
  aiReviewResult: string;
}

// Description Draft
export interface DescriptionDraft {
  prId: number;
  title: string;
  summary: string;
  aiDraft: string;
  updated: Date;
}

// Webhook Payloads
export interface SlackWebhookPayload {
  text: string;
  user?: string;
  channel?: string;
  timestamp?: string;
}

// API Responses
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
}

// Job Status
export interface JobStatus {
  id: string;
  type: 'review' | 'description';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  prUrl: string;
  createdAt: Date;
  updatedAt: Date;
  result?: any;
  error?: string;
}
