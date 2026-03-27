import type {
  ActionHistoryItem,
  AppSettings,
  DecisionLabel,
  MockActionResult,
  RiskLabel,
} from '../types';

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getDecision(riskScore: number): DecisionLabel {
  if (riskScore < 30) {
    return 'APPROVE';
  }
  if (riskScore <= 70) {
    return 'MODIFY';
  }
  return 'BLOCK';
}

function getRiskLabel(riskScore: number): RiskLabel {
  if (riskScore < 30) {
    return 'Low';
  }
  if (riskScore <= 70) {
    return 'Medium';
  }
  return 'High';
}

function inferType(input: string): MockActionResult['type'] {
  const text = input.toLowerCase();
  if (text.includes('email') || text.includes('mail') || text.includes('client')) {
    return 'email';
  }
  if (text.includes('code') || text.includes('deploy') || text.includes('api')) {
    return 'code';
  }
  return 'system';
}

function buildContent(type: MockActionResult['type'], input: string) {
  if (type === 'email') {
    return `Hi client,\n\nWe wanted to let you know there is a delay in the timeline. We are working to complete the delivery as quickly as possible and will share the updated date shortly.\n\nBest regards,\nAgentFlow Team`;
  }
  if (type === 'code') {
    return `Planned action:\n- ${input}\n- Run tests\n- Deploy after validation`;
  }
  return `System action request: ${input}`;
}

function buildImprovedVersion(type: MockActionResult['type'], input: string) {
  if (type === 'email') {
    return `Hi [Client Name],\n\nI wanted to share a quick update regarding the project timeline. We need a short extension to ensure quality and stability. We will send you a revised delivery date and milestone plan by end of day.\n\nThank you for your patience.\n\nBest regards,\nAgentFlow Team`;
  }
  if (type === 'code') {
    return `Improved plan:\n- ${input}\n- Add rollback safeguards\n- Execute in staged rollout with monitoring`;
  }
  return `Improved system action plan for: ${input}`;
}

function buildIssues(type: MockActionResult['type'], input: string, riskScore: number) {
  const issues: string[] = [];
  const text = input.toLowerCase();

  if (type === 'email') {
    issues.push('tone issue');
  }
  if (text.includes('delay')) {
    issues.push('delivery delay communication risk');
  }
  if (text.includes('client')) {
    issues.push('external communication requires caution');
  }
  if (riskScore > 70) {
    issues.push('high operational risk');
  }

  return issues;
}

function buildSimulation(riskScore: number, type: MockActionResult['type']) {
  if (riskScore < 30) {
    return {
      client_reaction: 'Likely positive and clear.',
      trust_impact: 'Positive',
      risk_level: 'Low' as RiskLabel,
    };
  }
  if (riskScore <= 70) {
    return {
      client_reaction:
        type === 'email'
          ? 'Likely mixed reaction, but acceptable with a clearer tone.'
          : 'Likely acceptable after minor improvements.',
      trust_impact: 'Neutral',
      risk_level: 'Medium' as RiskLabel,
    };
  }
  return {
    client_reaction: 'Likely negative reaction and escalation risk.',
    trust_impact: 'Negative',
    risk_level: 'High' as RiskLabel,
  };
}

export function handleAction(input: string, settings: AppSettings): MockActionResult {
  const type = inferType(input);
  let riskScore = type === 'email' ? 35 : 25;
  const text = input.toLowerCase();

  if (text.includes('delay')) {
    riskScore += 20;
  }
  if (text.includes('client')) {
    riskScore += 10;
  }
  if (text.includes('urgent')) {
    riskScore += 15;
  }
  if (text.includes('refund') || text.includes('payment')) {
    riskScore += 20;
  }

  if (!settings.api.enableAiAnalysis) {
    riskScore = Math.max(riskScore, 40);
  }

  const improvedVersion = buildImprovedVersion(type, input);
  let content = buildContent(type, input);

  if (settings.policy.professionalToneEnforcement && type === 'email') {
    content = improvedVersion;
    riskScore -= 10;
  }

  riskScore = Math.max(0, Math.min(100, riskScore));
  const decision = getDecision(riskScore);
  const issues = buildIssues(type, input, riskScore);

  if (!settings.api.enableAiAnalysis) {
    issues.push('AI analysis disabled, using basic rules.');
  }

  const simulation = settings.policy.enableSimulation
    ? buildSimulation(riskScore, type)
    : {
        client_reaction: 'Simulation disabled in settings.',
        trust_impact: 'Not Available',
        risk_level: getRiskLabel(riskScore),
      };

  return {
    id: uid(),
    createdAt: new Date().toISOString(),
    input,
    type,
    content,
    risk_score: riskScore,
    decision,
    issues,
    improved_version: improvedVersion,
    simulation,
  };
}

export function toHistoryItem(
  action: MockActionResult,
  status: ActionHistoryItem['status'],
): ActionHistoryItem {
  return {
    id: action.id,
    createdAt: new Date().toISOString(),
    input: action.input,
    type: action.type,
    risk_score: action.risk_score,
    decision: action.decision,
    status,
  };
}
