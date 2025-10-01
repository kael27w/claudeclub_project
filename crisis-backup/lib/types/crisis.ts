/**
 * Type definitions for Crisis Management System
 */

export type CrisisType =
  | 'flight_cancelled'
  | 'flight_delayed'
  | 'natural_disaster'
  | 'medical_emergency'
  | 'lost_documents'
  | 'accommodation_issue'
  | 'transportation_disruption'
  | 'general_emergency';

export interface CrisisConstraints {
  budget: number;
  timeframe: string;
  preferences: string[];
  urgency: 'low' | 'medium' | 'high' | 'critical';
}

export interface CrisisContext {
  type: CrisisType;
  description: string;
  location: string;
  userLocation?: string;
  constraints: CrisisConstraints;
  metadata?: Record<string, any>;
}

export interface CrisisAnalysis {
  crisisType: CrisisType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  keyIssues: string[];
  impactedServices: string[];
  timeConstraints: {
    immediate: boolean;
    deadline?: string;
  };
  estimatedResolutionTime: string;
  reasoning: string;
}

export interface Solution {
  id: string;
  title: string;
  description: string;
  steps: SolutionStep[];
  estimatedCost: number;
  estimatedTime: string;
  feasibility: 'low' | 'medium' | 'high';
  pros: string[];
  cons: string[];
}

export interface SolutionStep {
  id: string;
  action: string;
  description: string;
  estimatedDuration: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  dependencies?: string[];
}

export interface ExecutionResult {
  success: boolean;
  solutionId: string;
  completedSteps: SolutionStep[];
  failedSteps?: SolutionStep[];
  message: string;
  nextActions?: string[];
}
