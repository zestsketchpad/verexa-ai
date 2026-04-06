export type ShareableAnalysisSnapshot = {
  rawInput: string;
  output: string;
  decision: "SAFE" | "MODIFY" | "RISKY";
  score: number;
  confidence: number;
  tone: string;
  issues: string[];
  improvements: string[];
  insights: string[];
  reasoning: string;
  projectContext?: string;
  createdAt: number;
};

const SHARE_STORAGE_PREFIX = "verexa_shared_analysis";

function key(id: string): string {
  return `${SHARE_STORAGE_PREFIX}:${id}`;
}

export function createShareSnapshot(snapshot: ShareableAnalysisSnapshot): string {
  const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(key(id), JSON.stringify(snapshot));
  }
  return id;
}

export function getShareSnapshot(id: string): ShareableAnalysisSnapshot | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(key(id));
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<ShareableAnalysisSnapshot>;
    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    const decision =
      parsed.decision === "SAFE" || parsed.decision === "MODIFY" || parsed.decision === "RISKY"
        ? parsed.decision
        : "MODIFY";

    return {
      rawInput: String(parsed.rawInput || ""),
      output: String(parsed.output || ""),
      decision,
      score: typeof parsed.score === "number" ? parsed.score : 0,
      confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0,
      tone: String(parsed.tone || "professional"),
      issues: Array.isArray(parsed.issues) ? parsed.issues.map((item) => String(item || "")).filter(Boolean) : [],
      improvements: Array.isArray(parsed.improvements)
        ? parsed.improvements.map((item) => String(item || "")).filter(Boolean)
        : [],
      insights: Array.isArray(parsed.insights)
        ? parsed.insights.map((item) => String(item || "")).filter(Boolean).slice(0, 3)
        : [],
      reasoning: String(parsed.reasoning || ""),
      projectContext: String(parsed.projectContext || ""),
      createdAt: typeof parsed.createdAt === "number" ? parsed.createdAt : Date.now(),
    };
  } catch {
    return null;
  }
}

export function buildAnalysisSummary(snapshot: ShareableAnalysisSnapshot): string {
  const lines: string[] = [];
  const date = new Date(snapshot.createdAt).toLocaleString();

  lines.push("VEREXA ANALYSIS SUMMARY");
  lines.push(`Generated: ${date}`);
  lines.push("");
  lines.push(`Send Confidence: ${Math.round(snapshot.score)}/100`);
  lines.push(`Decision: ${snapshot.decision}`);
  lines.push(`Tone: ${snapshot.tone}`);
  lines.push("");

  if (snapshot.projectContext) {
    lines.push("Project Context:");
    lines.push(snapshot.projectContext);
    lines.push("");
  }

  lines.push("Original Input:");
  lines.push(snapshot.rawInput || "-");
  lines.push("");
  lines.push("Improved Output:");
  lines.push(snapshot.output || "-");
  lines.push("");

  if (snapshot.insights.length > 0) {
    lines.push("Key Insights:");
    snapshot.insights.forEach((item) => lines.push(`- ${item}`));
    lines.push("");
  }

  if (snapshot.issues.length > 0) {
    lines.push("Issues Found:");
    snapshot.issues.forEach((item) => lines.push(`- ${item}`));
    lines.push("");
  }

  if (snapshot.improvements.length > 0) {
    lines.push("Improvements Made:");
    snapshot.improvements.forEach((item) => lines.push(`- ${item}`));
    lines.push("");
  }

  if (snapshot.reasoning) {
    lines.push("Confidence Explanation:");
    lines.push(snapshot.reasoning);
    lines.push("");
  }

  return lines.join("\n").trim();
}

export function downloadSummary(content: string, filename = "verexa-analysis-summary.txt"): void {
  if (typeof window === "undefined") {
    return;
  }

  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
