export type DecisionLabel = 'APPROVE' | 'MODIFY' | 'BLOCK';
export type RiskLabel = 'Low' | 'Medium' | 'High';
export type ActionTypeLabel = 'email' | 'code' | 'system';
export type AgentTypeLabel = 'Email Agent' | 'Code Agent' | 'General AI';
export type AgentToolLabel = 'Risk Checker' | 'Policy Guard' | 'Simulation';

export interface ActionSimulation {
  client_reaction: string;
  trust_impact: string;
  risk_level: RiskLabel;
}

export interface ActionResult {
  id: string;
  createdAt: string;
  input: string;
  type: ActionTypeLabel;
  content: string;
  risk_score: number;
  decision: DecisionLabel;
  issues: string[];
  improved_version: string;
  simulation: ActionSimulation;
}

export type MockSimulation = ActionSimulation;
export type MockActionResult = ActionResult;

export interface ActionHistoryItem {
  id: string;
  createdAt: string;
  input: string;
  type: ActionTypeLabel;
  risk_score: number;
  decision: DecisionLabel;
  status: 'Created' | 'Fixed' | 'Executed' | 'Rejected' | 'Failed';
  issues?: string[];
  note?: string;
}

export interface AgentConfig {
  id: string;
  name: string;
  type: AgentTypeLabel;
  enabledTools: AgentToolLabel[];
  createdAt: string;
}

export interface AppSettings {
  api: {
    openAiApiKey: string;
    enableAiAnalysis: boolean;
  };
  policy: {
    professionalToneEnforcement: boolean;
    blockHighRiskActions: boolean;
    enableSimulation: boolean;
  };
  execution: {
    enableEmailSending: boolean;
    enableAutoExecution: boolean;
  };
  integrations: {
    n8nWebhookUrl: string;
  };
}
