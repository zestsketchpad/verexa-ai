import type { HistoryItem } from "@/components/HistoryPanel";

const SESSION_STORAGE_KEY_PREFIX = "verexa_memory_session_id";
const CHAT_STORAGE_KEY_PREFIX = "verexa_chat_sessions";
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

export type ChatSessionSummary = {
  sessionId: string;
  title: string;
  updatedAt: number;
  preview?: string;
};

function safeUserKey(userId?: string): string {
  return String(userId || "guest").trim() || "guest";
}

function getSessionStorageKey(userId?: string): string {
  return `${SESSION_STORAGE_KEY_PREFIX}:${safeUserKey(userId)}`;
}

function getChatStorageKey(userId?: string): string {
  return `${CHAT_STORAGE_KEY_PREFIX}:${safeUserKey(userId)}`;
}

export function getStoredSessionId(userId?: string): string {
  if (typeof window === "undefined") {
    return "";
  }

  return window.localStorage.getItem(getSessionStorageKey(userId)) || "";
}

function storeSessionId(sessionId: string, userId?: string): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(getSessionStorageKey(userId), sessionId);
}

export function setStoredSessionId(sessionId: string, userId?: string): void {
  storeSessionId(sessionId, userId);
}

export function clearStoredSessionId(userId?: string): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(getSessionStorageKey(userId));
}

export function getStoredChatSessions(userId?: string): ChatSessionSummary[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(getChatStorageKey(userId));
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((item) => ({
        sessionId:
          typeof item === "object" && item && "sessionId" in item
            ? String((item as { sessionId?: string }).sessionId || "").trim()
            : "",
        title:
          typeof item === "object" && item && "title" in item
            ? String((item as { title?: string }).title || "New chat").trim() || "New chat"
            : "New chat",
        updatedAt:
          typeof item === "object" && item && "updatedAt" in item
            ? Number((item as { updatedAt?: number }).updatedAt) || 0
            : 0,
        preview:
          typeof item === "object" && item && "preview" in item
            ? String((item as { preview?: string }).preview || "")
            : "",
      }))
      .filter((item) => Boolean(item.sessionId))
      .sort((a, b) => b.updatedAt - a.updatedAt);
  } catch {
    return [];
  }
}

function storeChatSessions(items: ChatSessionSummary[], userId?: string): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(getChatStorageKey(userId), JSON.stringify(items));
}

export function upsertStoredChatSession(summary: ChatSessionSummary, userId?: string): ChatSessionSummary[] {
  const current = getStoredChatSessions(userId);
  const next = [summary, ...current.filter((item) => item.sessionId !== summary.sessionId)]
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 40);
  storeChatSessions(next, userId);
  return next;
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

  storeSessionId(sessionId, userId);

  upsertStoredChatSession(
    {
      sessionId,
      title: title?.trim() || "New chat",
      preview: "",
      updatedAt: Date.now(),
    },
    userId,
  );

  return sessionId;
}

export async function ensureMemorySession(userId?: string): Promise<string> {
  const existingSessionId = getStoredSessionId(userId);
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
