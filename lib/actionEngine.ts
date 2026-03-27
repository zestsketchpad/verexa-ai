import type { ActionHistoryItem, ActionResult, DecisionLabel, RiskLabel } from '../types';

const DEFAULT_ACTION_WEBHOOK = 'https://xlr8-n8n.app.n8n.cloud/webhook/ai-action';

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

interface ActionRequestMeta {
  userId?: string;
  email?: string;
  token?: string;
}

type WorkflowTool = 'email' | 'code' | 'design' | 'research';

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value === 'object' && value !== null) {
    return value as Record<string, unknown>;
  }
  return null;
}

function asString(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) {
    return value;
  }
  return null;
}

function asNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim()) {
    const num = Number(value);
    if (Number.isFinite(num)) {
      return num;
    }
  }
  return null;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
    .filter(Boolean);
}

function asObjectString(value: Record<string, unknown> | null): string | null {
  if (!value) {
    return null;
  }
  return JSON.stringify(value, null, 2);
}

function extractRecipientEmail(input: string): string | null {
  const match = input.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return match ? match[0] : null;
}

function inferToolFromInput(input: string): WorkflowTool {
  const text = input.toLowerCase();
  if (
    text.includes('email') ||
    text.includes('mail') ||
    text.includes('gmail') ||
    /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(input)
  ) {
    return 'email';
  }
  if (
    text.includes('code') ||
    text.includes('bug') ||
    text.includes('api') ||
    text.includes('deploy')
  ) {
    return 'code';
  }
  if (
    text.includes('design') ||
    text.includes('ui') ||
    text.includes('ux') ||
    text.includes('figma') ||
    text.includes('logo')
  ) {
    return 'design';
  }
  return 'research';
}

function riskFromReaction(value: unknown): RiskLabel | null {
  const reaction = asString(value)?.toLowerCase();
  if (!reaction) {
    return null;
  }
  if (reaction === 'negative') {
    return 'High';
  }
  if (reaction === 'neutral') {
    return 'Medium';
  }
  if (reaction === 'positive') {
    return 'Low';
  }
  return null;
}

function truncate(text: string, max = 240): string {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (normalized.length <= max) {
    return normalized;
  }
  return `${normalized.slice(0, max)}...`;
}

function tryParseJson(raw: string): unknown | null {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    return null;
  }
}

function decisionFromRisk(score: number): DecisionLabel {
  if (score < 30) {
    return 'APPROVE';
  }
  if (score <= 70) {
    return 'MODIFY';
  }
  return 'BLOCK';
}

function riskLevelFromScore(score: number): RiskLabel {
  if (score < 30) {
    return 'Low';
  }
  if (score <= 70) {
    return 'Medium';
  }
  return 'High';
}

function normalizeDecision(value: unknown, riskScore: number): DecisionLabel {
  const text = typeof value === 'string' ? value.toUpperCase().trim() : '';
  if (text === 'APPROVE' || text === 'MODIFY' || text === 'BLOCK') {
    return text;
  }
  return decisionFromRisk(riskScore);
}

function extractPayload(data: unknown): Record<string, unknown> {
  if (Array.isArray(data)) {
    const first = asRecord(data[0]);
    if (first) {
      return first;
    }
  }

  const obj = asRecord(data);
  if (!obj) {
    throw new Error('Webhook response is not a valid object.');
  }

  const nested = asRecord(obj.action) ?? asRecord(obj.data);
  return nested ?? obj;
}

function normalizeAction(input: string, data: unknown): ActionResult {
  const payload = extractPayload(data);
  const resultPayload =
    asRecord(payload.result) ?? asRecord(payload.generated) ?? asRecord(payload.original);
  const riskAnalysisPayload = asRecord(payload.risk_analysis);
  const simulationPayload = asRecord(payload.simulation) ?? {};

  const content =
    asString(payload.content) ??
    asString(payload.output) ??
    asString(resultPayload?.body) ??
    asString(resultPayload?.code) ??
    asString(resultPayload?.summary) ??
    asString(resultPayload?.layout) ??
    asString(resultPayload?.concept) ??
    asString(payload.message) ??
    asObjectString(resultPayload);
  if (!content) {
    throw new Error('Webhook response missing "content".');
  }

  const riskScore = asNumber(
    payload.risk_score ?? payload.riskScore ?? riskAnalysisPayload?.risk_score,
  );
  if (riskScore === null) {
    throw new Error('Webhook response missing numeric "risk_score".');
  }
  const boundedRiskScore = Math.max(0, Math.min(100, riskScore));

  const typeRaw = asString(payload.type ?? payload.tool)?.toLowerCase();
  const type: ActionResult['type'] =
    typeRaw === 'email' || typeRaw === 'code' || typeRaw === 'system' ? typeRaw : 'system';

  const issues = asStringArray(payload.issues);
  const riskAnalysisIssues = asStringArray(riskAnalysisPayload?.issues);
  const mergedIssues = issues.length > 0 ? issues : riskAnalysisIssues;

  const simulationRiskLevel =
    (asString(simulationPayload.risk_level) as RiskLabel | null) ??
    riskFromReaction(simulationPayload.reaction) ??
    riskLevelFromScore(boundedRiskScore);

  return {
    id: asString(payload.id) ?? uid(),
    createdAt: asString(payload.createdAt) ?? new Date().toISOString(),
    input,
    type,
    content,
    risk_score: boundedRiskScore,
    decision: normalizeDecision(
      payload.decision ?? payload.recommendation ?? riskAnalysisPayload?.recommendation,
      boundedRiskScore,
    ),
    issues: mergedIssues,
    improved_version:
      asString(payload.improved_version) ??
      asString(payload.improvedVersion) ??
      asString(resultPayload?.body) ??
      asObjectString(resultPayload) ??
      content,
    simulation: {
      client_reaction:
        asString(simulationPayload.client_reaction) ??
        asString(simulationPayload.likely_response) ??
        asString(simulationPayload.reaction) ??
        '',
      trust_impact: asString(simulationPayload.trust_impact) ?? '',
      risk_level: simulationRiskLevel,
    },
  };
}

export async function handleAction(input: string, webhookUrl?: string): Promise<ActionResult> {
  return handleActionWithMeta(input, webhookUrl);
}

export async function handleActionWithMeta(
  input: string,
  webhookUrl?: string,
  meta?: ActionRequestMeta,
): Promise<ActionResult> {
  const endpoint = (webhookUrl && webhookUrl.trim()) || DEFAULT_ACTION_WEBHOOK;
  const tool = inferToolFromInput(input);
  const recipientEmail = extractRecipientEmail(input);

  if (tool === 'email' && !recipientEmail) {
    throw new Error(
      'Email action detected but no recipient email found in the prompt. Include a valid recipient email address.',
    );
  }

  const payload = {
    message: input,
    prompt: input,
    tool,
    userId: meta?.userId || 'anonymous',
    token: meta?.token || 'verixa-web',
    recipientEmail: tool === 'email' ? recipientEmail : null,
    email: meta?.email || null,
    timestamp: new Date().toISOString(),
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      ...payload,
      body: payload,
    }),
  });

  const rawBody = await response.text();
  const data = tryParseJson(rawBody);

  if (!response.ok) {
    const responseError =
      (asRecord(data) && asString((data as Record<string, unknown>).message)) ||
      truncate(rawBody) ||
      `Webhook returned ${response.status}`;
    throw new Error(`Webhook ${response.status}: ${responseError}`);
  }

  if (data === null) {
    const message = truncate(rawBody) || 'empty response body';
    if (!rawBody.trim()) {
      throw new Error(
        `Webhook ${response.status} returned empty response body. In n8n set Webhook response mode to "Last node" or add a "Respond to Webhook" node that returns JSON.`,
      );
    }
    throw new Error(
      `Webhook ${response.status} returned non-JSON response. Configure n8n to return JSON. Received: ${message}`,
    );
  }

  return normalizeAction(input, data);
}

export function toHistoryItem(
  action: ActionResult,
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
    issues: action.issues,
  };
}

export function toFailureHistoryItem(input: string, note: string): ActionHistoryItem {
  return {
    id: uid(),
    createdAt: new Date().toISOString(),
    input,
    type: 'system',
    risk_score: 100,
    decision: 'BLOCK',
    status: 'Failed',
    issues: [note],
    note,
  };
}
