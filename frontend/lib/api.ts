export type GenerateResponse = {
  raw_input?: string;
  normalized_input?: string;
  mode?: string;
  session_id?: string;
  verified_response?: string;
  outputs?: {
    professional?: string;
    casual?: string;
    short?: string;
    persuasive?: string;
  };
  score?: number;
  confidence?: number;
  tone?: string;
  issues_found?: string[];
  improvements_made?: string[];
  reasoning?: string;
  error?: string;
};

const configuredApiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL?.trim().replace(/\/+$/, "") ||
  process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/+$/, "");
const productionApiBaseUrl = "https://verexa-ai.onrender.com";
const API_TIMEOUT_MS = 20000;

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

function isLocalOnlyUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    return host === "localhost" || host === "127.0.0.1" || host === "0.0.0.0";
  } catch {
    return false;
  }
}

function getApiBaseUrl(): string {
  if (configuredApiBaseUrl) {
    if (process.env.NODE_ENV === "production" && isLocalOnlyUrl(configuredApiBaseUrl)) {
      return productionApiBaseUrl;
    }

    return configuredApiBaseUrl;
  }

  if (process.env.NODE_ENV !== "production") {
    return "http://localhost:8000";
  }

  return productionApiBaseUrl;
}

export async function generateResponse(input: string, mode: string, sessionId?: string): Promise<GenerateResponse> {
  let res: Response;

  try {
    res = await fetchWithTimeout(`${getApiBaseUrl()}/verexa`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ input, mode, session_id: sessionId || undefined }),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Generation request timed out. Please try again.");
    }
    throw error;
  }

  const text = await res.text();
  let payload: unknown = null;

  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = null;
  }

  if (!res.ok) {
    const message =
      typeof payload === "object" &&
      payload !== null &&
      "detail" in payload &&
      typeof payload.detail === "string"
        ? payload.detail
        : text || "API request failed";
    throw new Error(message);
  }

  if (!payload || typeof payload !== "object") {
    throw new Error("Invalid API response");
  }

  if ("error" in payload && typeof payload.error === "string" && payload.error.trim()) {
    throw new Error(payload.error);
  }

  return payload as GenerateResponse;
}
