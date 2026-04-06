"use client";

import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import { motion } from "framer-motion";
import AuthPanel from "@/components/AuthPanel";
import EmptyState from "@/components/EmptyState";
import LoadingState from "@/components/LoadingState";
import OnboardingModal from "@/components/OnboardingModal";
import ProfileDock from "@/components/ProfileDock";
import ResultPanel from "@/components/ResultPanel";
import SavedResponsesPanel from "@/components/SavedResponsesPanel";
import ScoreCard from "@/components/ScoreCard";
import ToneSelector, { type ToneOption } from "@/components/ToneSelector";
import { generateResponse } from "@/lib/api";
import { createMemorySession, getStoredSessionId, setStoredSessionId } from "@/lib/memory";
import { getSavedResponses, removeSavedResponse, saveResponse, type SavedResponseItem } from "@/lib/savedResponses";
import { buildAnalysisSummary, createShareSnapshot, downloadSummary, getShareSnapshot } from "@/lib/shareAnalysis";
import { getDefaultStyleMemory, getStoredStyleMemory, type StyleMemory } from "@/lib/styleMemory";
import { createSupabaseBrowserClient, hasSupabaseBrowserConfig } from "@/lib/supabase/client";
import styles from "./page.module.css";

const AUTO_FIX_DELAY_MS = 1200;

const LAUNCH_INTENT = "freelance" as const;
const LAUNCH_PLATFORM = "upwork" as const;
const LAUNCH_BACKEND_MODE = "proposal";
const ROTATING_INPUT_PLACEHOLDERS = [
  "Upwork: Hi, I saw your project and I can deliver this in 3 days with revision support...",
  "Email: Following up on our last conversation. I can share a clear timeline and next steps...",
  "LinkedIn: Thanks for connecting. I have a quick idea that can improve your response rate...",
];
const ONBOARDING_STORAGE_PREFIX = "verexa_onboarding_seen";
const ONBOARDING_DEMO_TEXT =
  "Hi, I can build this landing page in 3 days with two revision rounds. My rate is $40/hour. If this works for you, I can start this week.";

const cleanText = (text: string): string =>
  String(text || "")
    .replace(/â€™/g, "'")
    .replace(/â€˜/g, "'")
    .replace(/â€œ|â€\x9d|â€/g, '"')
    .replace(/â€”/g, "—")
    .replace(/â€“/g, "–");

type QualityCheck = {
  ruleName: string;
  status: "pass" | "fail";
  reason?: string;
};

function mapPolicyChecks(value: unknown): QualityCheck[] {
  if (!value || typeof value !== "object" || !("rules" in value)) {
    return [];
  }

  const rules = (value as { rules?: unknown }).rules;
  if (!Array.isArray(rules)) {
    return [];
  }

  return rules
    .map((rule) => {
      if (!rule || typeof rule !== "object") {
        return null;
      }

      const item = rule as { rule_name?: unknown; status?: unknown; reason?: unknown };
      const ruleName = cleanText(String(item.rule_name || "")).trim();
      const status = String(item.status || "").toLowerCase() === "fail" ? "fail" : "pass";
      const reason = cleanText(String(item.reason || "")).trim();

      if (!ruleName) {
        return null;
      }

      return {
        ruleName,
        status,
        reason: reason || undefined,
      } as QualityCheck;
    })
    .filter((item): item is QualityCheck => item !== null);
}

type AnalysisResult = {
  rawInput: string;
  normalizedInput: string;
  output: string;
  decision: "SAFE" | "MODIFY" | "RISKY";
  score: number;
  confidence: number;
  tone: string;
  issues: string[];
  improvements: string[];
  insights: string[];
  clientPerspective: {
    reaction: "positive" | "neutral" | "negative";
    likelyReaction: string;
    riskFactors: string[];
    suggestedAdjustment: string;
  };
  qualityChecks: QualityCheck[];
  variations: Array<{ label: string; text: string }>;
  reasoning: string;
};

export default function Home() {
  const supabaseConfigured = hasSupabaseBrowserConfig();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [authReady, setAuthReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [tone, setTone] = useState<ToneOption>("professional");
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [refineInstruction, setRefineInstruction] = useState("");
  const [styleMemory, setStyleMemory] = useState<StyleMemory>(getDefaultStyleMemory());
  const [projectContext, setProjectContext] = useState("");
  const [savedResponses, setSavedResponses] = useState<SavedResponseItem[]>([]);
  const [autoFixMode, setAutoFixMode] = useState(false);
  const [lastAnalyzedSignature, setLastAnalyzedSignature] = useState("");
  const [shareHydrated, setShareHydrated] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  const getOnboardingStorageKey = (userId?: string) => `${ONBOARDING_STORAGE_PREFIX}:${String(userId || "guest")}`;

  const markOnboardingSeen = (userId?: string) => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(getOnboardingStorageKey(userId), "1");
  };

  useEffect(() => {
    if (!supabase) {
      setAuthReady(true);
      return;
    }

    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) {
        return;
      }

      setSession(data.session ?? null);
      setAuthReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setAuthReady(true);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    if (!authReady || !session) {
      setSessionId("");
      setResult(null);
      setSavedResponses([]);
      setShowOnboarding(false);
      return;
    }

    const stored = getStoredSessionId(session.user.id);
    if (stored) {
      setSessionId(stored);
    }

    const savedStyle = getStoredStyleMemory(session.user.id);
    setStyleMemory(savedStyle);
    setTone(savedStyle.toneDefault);
    setSavedResponses(getSavedResponses(session.user.id));

    if (typeof window !== "undefined") {
      const hasShareId = Boolean(new URLSearchParams(window.location.search).get("share"));
      const seen = window.localStorage.getItem(getOnboardingStorageKey(session.user.id)) === "1";
      setShowOnboarding(!seen && !hasShareId);
    }
  }, [authReady, session]);

  const handleOnboardingClose = () => {
    if (session) {
      markOnboardingSeen(session.user.id);
    }
    setShowOnboarding(false);
  };

  const handleOnboardingTryDemo = () => {
    setDraft(ONBOARDING_DEMO_TEXT);
    setProjectContext("Client type: Startup founder\nProject scope: Landing page + proposal follow-up\nBudget: $2k-$4k");
    handleOnboardingClose();
  };

  useEffect(() => {
    if (shareHydrated || !session || typeof window === "undefined") {
      return;
    }

    const shareId = new URLSearchParams(window.location.search).get("share");
    if (!shareId) {
      setShareHydrated(true);
      return;
    }

    const snapshot = getShareSnapshot(shareId);
    if (!snapshot) {
      setShareHydrated(true);
      return;
    }

    setDraft(snapshot.rawInput);
    setProjectContext(snapshot.projectContext || "");
    setResult({
      rawInput: snapshot.rawInput,
      normalizedInput: snapshot.rawInput,
      output: snapshot.output,
      decision: snapshot.decision,
      score: snapshot.score,
      confidence: snapshot.confidence,
      tone: snapshot.tone,
      issues: snapshot.issues,
      improvements: snapshot.improvements,
      insights: snapshot.insights.slice(0, 3),
      clientPerspective: {
        reaction: "neutral",
        likelyReaction: "Shared snapshot loaded.",
        riskFactors: [],
        suggestedAdjustment: "Re-run analysis to refresh context and latest verification.",
      },
      qualityChecks: [],
      variations: [],
      reasoning: snapshot.reasoning,
    });
    setShareHydrated(true);
  }, [shareHydrated, session]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setPlaceholderIndex((current) => (current + 1) % ROTATING_INPUT_PLACEHOLDERS.length);
    }, 3400);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  const handleSaveResponse = (text: string) => {
    if (!session || !result) {
      return;
    }

    const next = saveResponse(
      {
        text,
        sourceInput: result.rawInput,
        score: result.score,
        decision: result.decision,
        tone: result.tone,
      },
      session.user.id,
    );
    setSavedResponses(next);
  };

  const handleUseSavedResponse = (item: SavedResponseItem) => {
    setDraft(item.text);
  };

  const handleRemoveSavedResponse = (id: string) => {
    if (!session) {
      return;
    }
    const next = removeSavedResponse(id, session.user.id);
    setSavedResponses(next);
  };

  const handleShareAnalysis = () => {
    if (!result || typeof window === "undefined") {
      return;
    }

    const snapshot = {
      rawInput: result.rawInput,
      output: result.output,
      decision: result.decision,
      score: result.score,
      confidence: result.confidence,
      tone: result.tone,
      issues: result.issues,
      improvements: result.improvements,
      insights: result.insights,
      reasoning: result.reasoning,
      projectContext,
      createdAt: Date.now(),
    };

    const shareId = createShareSnapshot(snapshot);
    const url = new URL(window.location.href);
    url.searchParams.set("share", shareId);
    const shareLink = url.toString();

    const summary = buildAnalysisSummary(snapshot);
    downloadSummary(summary, `verexa-analysis-${shareId}.txt`);

    void navigator.clipboard.writeText(shareLink);
  };

  const mapApiResult = (
    data: Awaited<ReturnType<typeof generateResponse>>,
    fallbackInput: string,
  ): AnalysisResult => {
    const output =
      cleanText(String(data.verified_response || "").trim()) ||
      "I could not generate a response. Please try again.";

    return {
      rawInput: data.raw_input || fallbackInput,
      normalizedInput: data.normalized_input || fallbackInput,
      output,
      decision:
        data.decision === "SAFE" || data.decision === "MODIFY" || data.decision === "RISKY"
          ? data.decision
          : "MODIFY",
      score: typeof data.score === "number" ? data.score : 0,
      confidence: typeof data.confidence === "number" ? data.confidence : 0,
      tone: cleanText(String(data.tone || "neutral")),
      issues: Array.isArray(data.issues_found) ? data.issues_found.map((item) => cleanText(item)) : [],
      improvements: Array.isArray(data.improvements_made)
        ? data.improvements_made.map((item) => cleanText(item))
        : [],
      insights: Array.isArray(data.insight_lines)
        ? data.insight_lines.map((item) => cleanText(item)).slice(0, 3)
        : [],
      clientPerspective: {
        reaction:
          data.client_perspective?.reaction === "positive" ||
          data.client_perspective?.reaction === "neutral" ||
          data.client_perspective?.reaction === "negative"
            ? data.client_perspective.reaction
            : "neutral",
        likelyReaction: cleanText(String(data.client_perspective?.likely_reaction || "")).trim(),
        riskFactors: Array.isArray(data.client_perspective?.risk_factors)
          ? data.client_perspective.risk_factors.map((item) => cleanText(String(item))).filter(Boolean)
          : [],
        suggestedAdjustment: cleanText(String(data.client_perspective?.suggested_adjustment || "")).trim(),
      },
      qualityChecks: mapPolicyChecks(data.policy_results),
      variations: Array.isArray(data.variations)
        ? data.variations
            .map((item) => {
              const safeItem = item as { label?: string; text?: string };
              return {
                label: cleanText(String(safeItem.label || "")).trim(),
                text: cleanText(String(safeItem.text || "")).trim(),
              };
            })
            .filter((item) => item.label && item.text)
            .slice(0, 3)
        : [],
      reasoning: cleanText(String(data.reasoning || "")),
    };
  };

  const buildAnalyzeSignature = (
    inputText: string,
    contextText: string,
    selectedTone: ToneOption,
  ) => `${inputText.trim()}||${contextText.trim()}||${selectedTone}||${LAUNCH_INTENT}||${LAUNCH_PLATFORM}`;

  const handleAnalyze = async () => {
    const trimmed = draft.trim();

    if (!trimmed || loading || !session) {
      return;
    }

    setLoading(true);

    let resolvedSessionId = sessionId;
    const latestStyle = getStoredStyleMemory(session.user.id);
    setStyleMemory(latestStyle);
    setTone(latestStyle.toneDefault);
    const analyzeSignature = buildAnalyzeSignature(trimmed, projectContext, latestStyle.toneDefault);

    try {
      if (!resolvedSessionId) {
        resolvedSessionId = await createMemorySession(session.user.id, "Quick analysis");
        setSessionId(resolvedSessionId);
        setStoredSessionId(resolvedSessionId, session.user.id);
      }

      const data = await generateResponse(
        trimmed,
        LAUNCH_BACKEND_MODE,
        resolvedSessionId,
        LAUNCH_INTENT,
        latestStyle.toneDefault,
        latestStyle,
        LAUNCH_PLATFORM,
        projectContext,
      );
      setResult(mapApiResult(data, trimmed));
      setLastAnalyzedSignature(analyzeSignature);
      setRefineInstruction("");
    } catch {
      setResult({
        rawInput: trimmed,
        normalizedInput: trimmed,
        output: trimmed,
        decision: "MODIFY",
        score: 70,
        confidence: 70,
        tone: styleMemory.toneDefault,
        issues: [],
        improvements: [],
        insights: [],
        clientPerspective: {
          reaction: "neutral",
          likelyReaction: "Recipient reaction is uncertain due to incomplete analysis.",
          riskFactors: [],
          suggestedAdjustment: "Add a clear value statement and one concrete next step.",
        },
        qualityChecks: [],
        variations: [],
        reasoning: "",
      });
      setLastAnalyzedSignature(analyzeSignature);
    } finally {
      setLoading(false);
    }
  };

  const handleRefine = async () => {
    const instruction = refineInstruction.trim();
    const baseInput = (result?.rawInput || draft).trim();

    if (!instruction || !result || !baseInput || loading || !session) {
      return;
    }

    setLoading(true);

    let resolvedSessionId = sessionId;
    const latestStyle = getStoredStyleMemory(session.user.id);
    setStyleMemory(latestStyle);
    setTone(latestStyle.toneDefault);

    try {
      if (!resolvedSessionId) {
        resolvedSessionId = await createMemorySession(session.user.id, "Quick analysis");
        setSessionId(resolvedSessionId);
        setStoredSessionId(resolvedSessionId, session.user.id);
      }

      const data = await generateResponse(
        baseInput,
        LAUNCH_BACKEND_MODE,
        resolvedSessionId,
        LAUNCH_INTENT,
        latestStyle.toneDefault,
        latestStyle,
        LAUNCH_PLATFORM,
        projectContext,
        instruction,
        result.output,
      );
      setResult(mapApiResult(data, baseInput));
      setRefineInstruction("");
    } catch {
      // Keep the previous result visible when refinement fails.
    } finally {
      setLoading(false);
    }
  };

  const handleComposerKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      void handleAnalyze();
    }
  };

  const canAnalyze = draft.trim().length >= 3 && !loading;
  const canRefine = Boolean(result && refineInstruction.trim().length >= 3 && !loading);

  useEffect(() => {
    if (!autoFixMode || !session || loading) {
      return;
    }

    const trimmed = draft.trim();
    if (trimmed.length < 3) {
      return;
    }

    const latestStyle = getStoredStyleMemory(session.user.id);
    const signature = buildAnalyzeSignature(trimmed, projectContext, latestStyle.toneDefault);
    if (signature === lastAnalyzedSignature) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void handleAnalyze();
    }, AUTO_FIX_DELAY_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [autoFixMode, draft, projectContext, session, loading, lastAnalyzedSignature]);

  return (
    <main className={styles.page}>
      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <div className={styles.brandRow}>
            <span className={styles.brandMark}>V</span>
            <div>
              <p className={styles.brandTitle}>Verixa AI</p>
              <p className={styles.brandSub}>Structured Response Studio</p>
            </div>
          </div>

          <p className={styles.sidebarText}>
            Pick intent, submit once, and review a structured analysis instead of chat bubbles.
          </p>

          <ProfileDock
            session={session}
            authReady={authReady}
            supabaseConfigured={supabaseConfigured}
          />
        </aside>

        <section className={styles.mainPanel}>
          <header className={styles.mainHeader}>
            <div>
              <p className={styles.headerEyebrow}>Smart Response Analysis</p>
              <h1 className={styles.headerTitle}>Before you send it, Verixa fixes it.</h1>
            </div>
            <p className={styles.launchModeBadge}>Launch Mode: Freelance (Upwork)</p>
          </header>

          {!authReady ? (
            <p className={styles.infoText}>Preparing workspace...</p>
          ) : !supabaseConfigured ? (
            <p className={styles.errorText}>
              Supabase auth is not configured in this deployment. Add
              NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.
            </p>
          ) : !session ? (
            <div id="account-access" className={styles.authWrap}>
              <AuthPanel onAuthenticated={() => setAuthReady(true)} />
            </div>
          ) : (
            <>
              <OnboardingModal
                open={showOnboarding}
                onTryDemo={handleOnboardingTryDemo}
                onClose={handleOnboardingClose}
              />

              <form
                className={styles.composer}
                onSubmit={(event) => {
                  event.preventDefault();
                  void handleAnalyze();
                }}
              >
                <ToneSelector tone={tone} onChange={setTone} disabled={loading} />
                <div className={styles.autoFixRow}>
                  <label className={styles.autoFixToggle}>
                    <input
                      type="checkbox"
                      checked={autoFixMode}
                      onChange={(event) => setAutoFixMode(event.target.checked)}
                      disabled={loading}
                    />
                    <span>Auto-Fix Mode</span>
                  </label>
                  <p className={styles.autoFixHint}>Auto-analyze 1.2s after typing stops.</p>
                </div>
                <div className={styles.contextPanel}>
                  <label htmlFor="project-context" className={styles.contextLabel}>
                    Project Context (Optional)
                  </label>
                  <textarea
                    id="project-context"
                    value={projectContext}
                    onChange={(event) => setProjectContext(event.target.value)}
                    placeholder="Client type: Startup SaaS\nProject scope: MVP landing + outbound email flow\nBudget: $3k-$5k"
                    className={styles.contextInput}
                    disabled={loading}
                  />
                </div>
                <textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={handleComposerKeyDown}
                  placeholder={ROTATING_INPUT_PLACEHOLDERS[placeholderIndex]}
                  className={styles.composerInput}
                  disabled={loading}
                />
                <button
                  type="submit"
                  className={styles.analyzeButton}
                  disabled={!canAnalyze}
                  aria-busy={loading}
                >
                  {loading ? "Fixing your message..." : "Fix My Message"}
                </button>
              </form>

              <p className={styles.hintText}>Ctrl/Cmd + Enter to run fast.</p>

              <SavedResponsesPanel
                items={savedResponses}
                onUse={handleUseSavedResponse}
                onRemove={handleRemoveSavedResponse}
              />

              {loading ? (
                <LoadingState />
              ) : result ? (
                <motion.div
                  className={styles.resultStack}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                >
                  <ScoreCard
                    score={result.score}
                    confidence={result.confidence}
                    tone={result.tone}
                    reasoning={result.reasoning}
                    issues={result.issues}
                  />
                  <ResultPanel
                    sourceText={result.rawInput}
                    output={result.output}
                    score={result.score}
                    confidence={result.confidence}
                    decision={result.decision}
                    insightLines={result.insights}
                    clientPerspective={result.clientPerspective}
                    qualityChecks={result.qualityChecks}
                    variations={result.variations}
                    issues={result.issues}
                    improvements={result.improvements}
                    onSaveResponse={handleSaveResponse}
                    onShareAnalysis={handleShareAnalysis}
                  />
                  <form
                    className={styles.refinePanel}
                    onSubmit={(event) => {
                      event.preventDefault();
                      void handleRefine();
                    }}
                  >
                    <label htmlFor="refine-instruction" className={styles.refineLabel}>
                      Refine this further
                    </label>
                    <div className={styles.refineRow}>
                      <input
                        id="refine-instruction"
                        type="text"
                        value={refineInstruction}
                        onChange={(event) => setRefineInstruction(event.target.value)}
                        placeholder="Example: Make this more direct and remove filler"
                        className={styles.refineInput}
                        disabled={loading}
                      />
                      <button type="submit" className={styles.refineButton} disabled={!canRefine}>
                        {loading ? "Refining..." : "Rewrite with Instruction"}
                      </button>
                    </div>
                  </form>
                </motion.div>
              ) : (
                <EmptyState mode={LAUNCH_INTENT} onExampleClick={(example) => setDraft(example)} />
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
}
