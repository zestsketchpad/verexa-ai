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

const configuredApiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim().replace(/\/+$/, "");
const productionApiBaseUrl = "https://verexa-ai.onrender.com";

function getApiBaseUrl(): string {
  if (configuredApiBaseUrl) {
    return configuredApiBaseUrl;
  }

  if (process.env.NODE_ENV !== "production") {
    return "http://localhost:8000";
  }

  return productionApiBaseUrl;
}

export async function generateResponse(input: string, mode: string, sessionId?: string): Promise<GenerateResponse> {
  const res = await fetch(`${getApiBaseUrl()}/verexa`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ input, mode, session_id: sessionId || undefined }),
  });

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
