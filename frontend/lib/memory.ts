import type { HistoryItem } from "@/components/HistoryPanel";

const SESSION_STORAGE_KEY = "verexa_memory_session_id";
const configuredMemoryApiBaseUrl =
  process.env.NEXT_PUBLIC_MEMORY_API_URL?.trim().replace(/\/+$/, "") ||
  process.env.NEXT_PUBLIC_MEMORY_API_BASE_URL?.trim().replace(/\/+$/, "");
const MEMORY_TIMEOUT_MS = 8000;

async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit = {}, timeoutMs = MEMORY_TIMEOUT_MS) {
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

function getMemoryApiBaseUrl(): string {
  if (configuredMemoryApiBaseUrl) {
    if (process.env.NODE_ENV === "production" && isLocalOnlyUrl(configuredMemoryApiBaseUrl)) {
      return "";
    }

    return configuredMemoryApiBaseUrl;
  }

  if (process.env.NODE_ENV !== "production") {
    return "http://127.0.0.1:8787";
  }

  return "";
}

export function getStoredSessionId(): string {
  if (typeof window === "undefined") {
    return "";
  }

  return window.localStorage.getItem(SESSION_STORAGE_KEY) || "";
}

function storeSessionId(sessionId: string): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
}

export function clearStoredSessionId(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(SESSION_STORAGE_KEY);
}

export async function createMemorySession(userId?: string, title?: string): Promise<string> {
  const memoryApiBaseUrl = getMemoryApiBaseUrl();
  if (!memoryApiBaseUrl) {
    return "";
  }

  let response: Response;

  try {
    response = await fetchWithTimeout(`${memoryApiBaseUrl}/sessions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: title?.trim() || "Verexa Session",
        userId: userId || undefined,
      }),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Memory service timed out while creating session");
    }
    throw error;
  }

  if (!response.ok) {
    throw new Error("Failed to create memory session");
  }

  const payload = (await response.json()) as { sessionId?: string };
  const sessionId = String(payload.sessionId || "").trim();

  if (!sessionId) {
    throw new Error("Memory session response was invalid");
  }

  storeSessionId(sessionId);
  return sessionId;
}

export async function ensureMemorySession(userId?: string): Promise<string> {
  const existingSessionId = getStoredSessionId();
  if (existingSessionId) {
    return existingSessionId;
  }

  return createMemorySession(userId, "Verexa Session");
}

export async function fetchMemoryHistory(sessionId: string): Promise<HistoryItem[]> {
  const resolvedSessionId = sessionId.trim();
  const memoryApiBaseUrl = getMemoryApiBaseUrl();

  if (!resolvedSessionId || !memoryApiBaseUrl) {
    return [];
  }

  let response: Response;

  try {
    response = await fetchWithTimeout(`${memoryApiBaseUrl}/sessions/${resolvedSessionId}/history`);
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Memory history request timed out");
    }
    throw error;
  }
  if (!response.ok) {
    throw new Error("Failed to load memory history");
  }

  const payload = (await response.json()) as {
    items?: Array<{
      id?: string;
      user_input?: string;
      normalized_input?: string;
      verified_response?: string;
      score?: number;
      confidence?: number;
      tone?: string;
      reasoning?: string;
      created_at?: number;
    }>;
  };

  return Array.isArray(payload.items)
    ? payload.items.map((item) => ({
        id: String(item.id || ""),
        input: String(item.user_input || ""),
        normalizedInput: String(item.normalized_input || item.user_input || ""),
        output: String(item.verified_response || ""),
        score: typeof item.score === "number" ? item.score : 0,
        confidence: typeof item.confidence === "number" ? item.confidence : 0,
        tone: String(item.tone || "neutral"),
        reasoning: String(item.reasoning || ""),
        timestamp: typeof item.created_at === "number" ? item.created_at : Date.now(),
      }))
    : [];
}
