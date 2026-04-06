export type StyleMemory = {
  toneDefault: "professional" | "friendly" | "assertive";
  writingStyle: "concise" | "detailed";
  industry: "freelance" | "dev" | "design";
};

const STYLE_MEMORY_PREFIX = "verexa_style_memory";

function key(userId?: string): string {
  const safeUser = String(userId || "guest").trim() || "guest";
  return `${STYLE_MEMORY_PREFIX}:${safeUser}`;
}

function normalizeTone(value: unknown): StyleMemory["toneDefault"] {
  const tone = String(value || "").trim().toLowerCase();
  if (tone === "friendly" || tone === "assertive") {
    return tone;
  }
  return "professional";
}

function normalizeWritingStyle(value: unknown): StyleMemory["writingStyle"] {
  return String(value || "").trim().toLowerCase() === "detailed" ? "detailed" : "concise";
}

function normalizeIndustry(value: unknown): StyleMemory["industry"] {
  const industry = String(value || "").trim().toLowerCase();
  if (industry === "dev" || industry === "design") {
    return industry;
  }
  return "freelance";
}

export function getDefaultStyleMemory(): StyleMemory {
  return {
    toneDefault: "professional",
    writingStyle: "concise",
    industry: "freelance",
  };
}

export function getStoredStyleMemory(userId?: string): StyleMemory {
  if (typeof window === "undefined") {
    return getDefaultStyleMemory();
  }

  const raw = window.localStorage.getItem(key(userId));
  if (!raw) {
    return getDefaultStyleMemory();
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return {
      toneDefault: normalizeTone(parsed.toneDefault),
      writingStyle: normalizeWritingStyle(parsed.writingStyle),
      industry: normalizeIndustry(parsed.industry),
    };
  } catch {
    return getDefaultStyleMemory();
  }
}

export function setStoredStyleMemory(style: Partial<StyleMemory>, userId?: string): StyleMemory {
  const current = getStoredStyleMemory(userId);
  const merged: StyleMemory = {
    toneDefault: normalizeTone(style.toneDefault ?? current.toneDefault),
    writingStyle: normalizeWritingStyle(style.writingStyle ?? current.writingStyle),
    industry: normalizeIndustry(style.industry ?? current.industry),
  };

  if (typeof window !== "undefined") {
    window.localStorage.setItem(key(userId), JSON.stringify(merged));
  }

  return merged;
}
