export type SavedResponseItem = {
  id: string;
  text: string;
  sourceInput: string;
  score: number;
  decision: "SAFE" | "MODIFY" | "RISKY";
  tone: string;
  createdAt: number;
};

const SAVED_RESPONSES_KEY_PREFIX = "verexa_saved_responses";

function safeUserKey(userId?: string): string {
  return String(userId || "guest").trim() || "guest";
}

function storageKey(userId?: string): string {
  return `${SAVED_RESPONSES_KEY_PREFIX}:${safeUserKey(userId)}`;
}

export function getSavedResponses(userId?: string): SavedResponseItem[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(storageKey(userId));
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((item) => {
        if (!item || typeof item !== "object") {
          return null;
        }
        const safeItem = item as Partial<SavedResponseItem>;
        const text = String(safeItem.text || "").trim();
        const sourceInput = String(safeItem.sourceInput || "").trim();
        const decision =
          safeItem.decision === "SAFE" || safeItem.decision === "MODIFY" || safeItem.decision === "RISKY"
            ? safeItem.decision
            : "MODIFY";
        if (!text) {
          return null;
        }

        return {
          id: String(safeItem.id || `${Date.now()}_${Math.random().toString(36).slice(2)}`),
          text,
          sourceInput,
          score: typeof safeItem.score === "number" ? safeItem.score : 0,
          decision,
          tone: String(safeItem.tone || "professional"),
          createdAt: typeof safeItem.createdAt === "number" ? safeItem.createdAt : Date.now(),
        } as SavedResponseItem;
      })
      .filter((item): item is SavedResponseItem => item !== null)
      .sort((a, b) => b.createdAt - a.createdAt);
  } catch {
    return [];
  }
}

function persist(items: SavedResponseItem[], userId?: string): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(storageKey(userId), JSON.stringify(items));
}

export function saveResponse(
  item: Omit<SavedResponseItem, "id" | "createdAt">,
  userId?: string,
): SavedResponseItem[] {
  const current = getSavedResponses(userId);
  const normalizedText = String(item.text || "").trim();
  if (!normalizedText) {
    return current;
  }

  const existing = current.find((entry) => entry.text === normalizedText);
  if (existing) {
    const refreshed = [
      { ...existing, createdAt: Date.now(), score: item.score, decision: item.decision, tone: item.tone },
      ...current.filter((entry) => entry.id !== existing.id),
    ].slice(0, 60);
    persist(refreshed, userId);
    return refreshed;
  }

  const next: SavedResponseItem[] = [
    {
      id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
      createdAt: Date.now(),
      ...item,
      text: normalizedText,
      sourceInput: String(item.sourceInput || "").trim(),
    },
    ...current,
  ].slice(0, 60);

  persist(next, userId);
  return next;
}

export function removeSavedResponse(id: string, userId?: string): SavedResponseItem[] {
  const current = getSavedResponses(userId);
  const next = current.filter((item) => item.id !== id);
  persist(next, userId);
  return next;
}
