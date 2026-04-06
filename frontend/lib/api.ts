export type GenerateResponse = {
  raw_input?: string;
  normalized_input?: string;
  mode?: string;
  platform?: "upwork" | "email" | "linkedin" | string;
  intent?: "freelance" | "email" | "strategy" | string;
  session_id?: string;
  verified_response?: string;
  outputs?: {
    professional?: string;
    casual?: string;
    short?: string;
    persuasive?: string;
  };
  variations?: Array<{
    label?: string;
    text?: string;
  }>;
  score?: number;
  confidence?: number;
  tone?: string;
  style_preferences?: {
    tone_default?: "professional" | "friendly" | "assertive" | string;
    writing_style?: "concise" | "detailed" | string;
    industry?: "freelance" | "dev" | "design" | string;
  };
  decision?: "SAFE" | "MODIFY" | "RISKY" | string;
  issues_found?: string[];
  improvements_made?: string[];
  insight_lines?: string[];
  client_perspective?: {
    reaction?: "positive" | "neutral" | "negative" | string;
    likely_reaction?: string;
    risk_factors?: string[];
    suggested_adjustment?: string;
  };
  policy_results?: {
    overall_status?: "pass" | "fail" | string;
    failed_count?: number;
    rules?: Array<{
      rule_name?: string;
      status?: "pass" | "fail" | string;
      reason?: string;
    }>;
    failed_rules?: Array<{
      rule_name?: string;
      status?: "pass" | "fail" | string;
      reason?: string;
    }>;
  };
  reasoning?: string;
  error?: string;
};

function buildSafeFallbackResponse(
  input: string,
  mode: string,
  sessionId?: string,
  intent?: "freelance" | "email" | "strategy",
  tone?: "professional" | "friendly" | "assertive",
): GenerateResponse {
  return {
    raw_input: input,
    normalized_input: input.trim(),
    mode,
    intent,
    session_id: sessionId,
    verified_response: input.trim() || "Your text is ready.",
    outputs: {
      professional: input.trim() || "Your text is ready.",
      casual: input.trim() || "Your text is ready.",
      short: input.trim() || "Your text is ready.",
      persuasive: input.trim() || "Your text is ready.",
    },
    variations: [],
    score: 70,
    confidence: 70,
    tone: tone || "professional",
    issues_found: [],
    improvements_made: [],
    insight_lines: [],
    policy_results: { overall_status: "fail", failed_count: 0, rules: [], failed_rules: [] },
    reasoning: "",
  };
}

const API_TIMEOUT_MS = 20000;
const API_MAX_RETRIES = 1;
const API_PROXY_ENDPOINT = "/api/verexa";

async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit = {}, timeoutMs = API_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function safeParseJson(text: string): unknown {
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

function getErrorMessage(payload: unknown, rawText: string): string {
  if (typeof payload === "object" && payload !== null) {
    if ("detail" in payload && typeof payload.detail === "string" && payload.detail.trim()) {
      return payload.detail;
    }

    if ("error" in payload && typeof payload.error === "string" && payload.error.trim()) {
      return payload.error;
    }
  }

  return rawText || "API request failed";
}

function shouldRetry(statusCode: number): boolean {
  return statusCode === 408 || statusCode === 425 || statusCode === 429 || statusCode >= 500;
}

export async function generateResponse(
  input: string,
  mode: string,
  sessionId?: string,
  intent?: "freelance" | "email" | "strategy",
  tone?: "professional" | "friendly" | "assertive",
  styleMemory?: {
    toneDefault?: "professional" | "friendly" | "assertive";
    writingStyle?: "concise" | "detailed";
    industry?: "freelance" | "dev" | "design";
  },
  platform?: "upwork" | "email" | "linkedin",
  projectContext?: string,
  refineInstruction?: string,
  previousOutput?: string,
): Promise<GenerateResponse> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= API_MAX_RETRIES; attempt += 1) {
    let res: Response;

    try {
      res = await fetchWithTimeout(API_PROXY_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input,
          mode,
          intent,
          tone,
          platform,
          style_tone_default: styleMemory?.toneDefault,
          style_writing_style: styleMemory?.writingStyle,
          style_industry: styleMemory?.industry,
          project_context: projectContext?.trim() || undefined,
          session_id: sessionId || undefined,
          refine_instruction: refineInstruction?.trim() || undefined,
          previous_output: previousOutput?.trim() || undefined,
        }),
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        lastError = new Error("Generation request timed out. Please try again.");
      } else if (error instanceof TypeError) {
        lastError = new Error("Network error while contacting the app API. Please refresh and try again.");
      } else {
        lastError = error instanceof Error ? error : new Error("Network request failed");
      }

      if (attempt < API_MAX_RETRIES) {
        continue;
      }
      return buildSafeFallbackResponse(input, mode, sessionId, intent, tone);
    }

    const text = await res.text();
    const payload = safeParseJson(text);

    if (!res.ok) {
      lastError = new Error(getErrorMessage(payload, text));
      if (attempt < API_MAX_RETRIES && shouldRetry(res.status)) {
        continue;
      }
      return buildSafeFallbackResponse(input, mode, sessionId, intent, tone);
    }

    if (!payload || typeof payload !== "object") {
      lastError = new Error("Invalid API response");
      if (attempt < API_MAX_RETRIES) {
        continue;
      }
      return buildSafeFallbackResponse(input, mode, sessionId, intent, tone);
    }

    if ("error" in payload && typeof payload.error === "string" && payload.error.trim()) {
      return buildSafeFallbackResponse(input, mode, sessionId, intent, tone);
    }

    return payload as GenerateResponse;
  }

  return buildSafeFallbackResponse(input, mode, sessionId, intent, tone);
}
