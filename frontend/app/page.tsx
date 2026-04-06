"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { Session } from "@supabase/supabase-js";
import AuthPanel from "@/components/AuthPanel";
import HistoryPanel, { type HistoryItem } from "@/components/HistoryPanel";
import InsightsPanel from "@/components/InsightsPanel";
import InputBox from "@/components/InputBox";
import ProfileDock from "@/components/ProfileDock";
import ResultPanel from "@/components/ResultPanel";
import ScoreCard from "@/components/ScoreCard";
import { generateResponse } from "@/lib/api";
import {
  clearStoredSessionId,
  createMemorySession,
  ensureMemorySession,
  fetchMemoryHistory,
  getStoredSessionId,
} from "@/lib/memory";
import { createSupabaseBrowserClient, hasSupabaseBrowserConfig } from "@/lib/supabase/client";
import styles from "./page.module.css";

const revealProps = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35 },
};

function toChronologicalTurns(items: HistoryItem[]): HistoryItem[] {
  return [...items].sort((a, b) => a.timestamp - b.timestamp);
}

export default function Home() {
  const supabaseConfigured = hasSupabaseBrowserConfig();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [authReady, setAuthReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState("auto");
  const [rawInput, setRawInput] = useState("");
  const [normalizedInput, setNormalizedInput] = useState("");
  const [output, setOutput] = useState("");
  const [score, setScore] = useState(0);
  const [confidence, setConfidence] = useState(0);
  const [tone, setTone] = useState("");
  const [issues, setIssues] = useState<string[]>([]);
  const [improvements, setImprovements] = useState<string[]>([]);
  const [reasoning, setReasoning] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showDetails, setShowDetails] = useState(false);
  const [copied, setCopied] = useState(false);
  const [iterationCount, setIterationCount] = useState(1);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [turns, setTurns] = useState<HistoryItem[]>([]);
  const [sessionId, setSessionId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!supabase) {
      setAuthReady(true);
      return;
    }

    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (mounted) {
        setSession(data.session ?? null);
        setAuthReady(true);
      }
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
      setHistory([]);
      setTurns([]);
      setSessionId("");
      return;
    }

    let cancelled = false;
    const activeUserId = session.user.id;

    async function hydrateSession(targetSessionId: string) {
      const items = await fetchMemoryHistory(targetSessionId);
      if (cancelled) {
        return;
      }

      setHistory(items);
      setTurns(toChronologicalTurns(items));
    }

    async function initializeMemory() {
      try {
        const nextSessionId = await ensureMemorySession(activeUserId);
        if (cancelled) {
          return;
        }

        setSessionId(nextSessionId);

        if (nextSessionId) {
          await hydrateSession(nextSessionId);
        }
      } catch (err) {
        console.error(err);
      }
    }

    const existingSessionId = getStoredSessionId();
    if (existingSessionId) {
      setSessionId(existingSessionId);
      void hydrateSession(existingSessionId).catch((err) => console.error(err));
    } else {
      void initializeMemory();
    }

    return () => {
      cancelled = true;
    };
  }, [authReady, session]);

  const refreshHistory = async (nextSessionId: string) => {
    if (!nextSessionId) {
      return;
    }

    try {
      const nextHistory = await fetchMemoryHistory(nextSessionId);
      setHistory(nextHistory);
      setTurns(toChronologicalTurns(nextHistory));
    } catch (err) {
      console.error(err);
    }
  };

  const resolveSessionId = async (): Promise<string> => {
    if (sessionId) {
      return sessionId;
    }

    try {
      const nextSessionId = await ensureMemorySession(session?.user.id);
      if (nextSessionId && nextSessionId !== sessionId) {
        setSessionId(nextSessionId);
      }
      return nextSessionId;
    } catch (err) {
      console.error("Memory session setup failed, continuing without session.", err);
      return "";
    }
  };

  const appendLocalTurn = (
    userInput: string,
    assistantOutput: string,
    nextScore: number,
    nextConfidence: number,
    nextTone: string,
    nextReasoning: string,
    replaceLastMatchingInput = false,
  ) => {
    const nextTurn: HistoryItem = {
      id: `${Date.now()}`,
      input: userInput,
      normalizedInput: userInput,
      output: assistantOutput,
      score: nextScore,
      confidence: nextConfidence,
      tone: nextTone,
      reasoning: nextReasoning,
      timestamp: Date.now(),
    };

    setTurns((current) => {
      if (replaceLastMatchingInput && current.length > 0) {
        const last = current[current.length - 1];
        if (last.input.trim().toLowerCase() === userInput.trim().toLowerCase()) {
          return [...current.slice(0, -1), nextTurn];
        }
      }

      return [...current, nextTurn];
    });
  };

  const handleNewChat = async () => {
    clearStoredSessionId();
    setSessionId("");
    setHistory([]);
    setTurns([]);
    setInput("");
    setRawInput("");
    setNormalizedInput("");
    setOutput("");
    setReasoning("");
    setIssues([]);
    setImprovements([]);
    setScore(0);
    setConfidence(0);
    setTone("");
    setError("");
    setShowDetails(false);
    setCopied(false);
    setIterationCount(1);

    if (!session) {
      return;
    }

    try {
      const nextSessionId = await createMemorySession(
        session.user.id,
        `Chat ${new Date().toLocaleDateString()}`,
      );
      setSessionId(nextSessionId);
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerate = async (text: string) => {
    const trimmed = text.trim();

    if (trimmed.length < 3) {
      setError("Please enter at least 3 characters.");
      setOutput("");
      setShowDetails(false);
      return;
    }

    setInput(trimmed);
    setLoading(true);
    setError("");
    setCopied(false);
    setShowDetails(false);

    try {
      const nextSessionId = await resolveSessionId();
      const data = await generateResponse(trimmed, mode, nextSessionId);

      const nextOutput = data.verified_response || "";
      const nextScore = typeof data.score === "number" ? data.score : 0;
      const nextConfidence = typeof data.confidence === "number" ? data.confidence : 0;
      const nextTone = data.tone || "neutral";
      const nextReasoning = data.reasoning || "";

      setRawInput(data.raw_input || trimmed);
      setNormalizedInput(data.normalized_input || trimmed);
      setOutput(nextOutput);
      setScore(nextScore);
      setConfidence(nextConfidence);
      setTone(nextTone);
      setIssues(Array.isArray(data.issues_found) ? data.issues_found : []);
      setImprovements(Array.isArray(data.improvements_made) ? data.improvements_made : []);
      setReasoning(nextReasoning);
      setIterationCount((current) => current + 1);

      appendLocalTurn(trimmed, nextOutput, nextScore, nextConfidence, nextTone, nextReasoning);
      await refreshHistory(nextSessionId);
    } catch (err) {
      console.error(err);
      setRawInput("");
      setNormalizedInput("");
      setOutput("");
      setReasoning("");
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleRefine = async () => {
    const refinedInput = output.trim();

    if (!refinedInput || loading) {
      return;
    }

    setLoading(true);
    setError("");
    setCopied(false);
    setShowDetails(false);

    try {
      const nextSessionId = await resolveSessionId();
      const data = await generateResponse(refinedInput, mode, nextSessionId);

      const nextOutput = data.verified_response || refinedInput;
      const nextScore = typeof data.score === "number" ? data.score : 0;
      const nextConfidence = typeof data.confidence === "number" ? data.confidence : 0;
      const nextTone = data.tone || "neutral";
      const nextReasoning = data.reasoning || "";

      setInput(refinedInput);
      setRawInput(data.raw_input || refinedInput);
      setNormalizedInput(data.normalized_input || refinedInput);
      setOutput(nextOutput);
      setScore(nextScore);
      setConfidence(nextConfidence);
      setTone(nextTone);
      setIssues(Array.isArray(data.issues_found) ? data.issues_found : []);
      setImprovements(Array.isArray(data.improvements_made) ? data.improvements_made : []);
      setReasoning(nextReasoning);
      setIterationCount((current) => current + 1);

      appendLocalTurn(refinedInput, nextOutput, nextScore, nextConfidence, nextTone, nextReasoning);
      await refreshHistory(nextSessionId);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleModeChange = async (nextMode: string) => {
    setMode(nextMode);

    if (input.trim() && output && !loading) {
      setLoading(true);
      setError("");
      setCopied(false);
      setShowDetails(false);

      try {
        const nextSessionId = await resolveSessionId();
        const data = await generateResponse(input.trim(), nextMode, nextSessionId);

        const nextOutput = data.verified_response || "";
        const nextScore = typeof data.score === "number" ? data.score : 0;
        const nextConfidence = typeof data.confidence === "number" ? data.confidence : 0;
        const nextTone = data.tone || "neutral";
        const nextReasoning = data.reasoning || "";

        setRawInput(data.raw_input || input.trim());
        setNormalizedInput(data.normalized_input || input.trim());
        setOutput(nextOutput);
        setScore(nextScore);
        setConfidence(nextConfidence);
        setTone(nextTone);
        setIssues(Array.isArray(data.issues_found) ? data.issues_found : []);
        setImprovements(Array.isArray(data.improvements_made) ? data.improvements_made : []);
        setReasoning(nextReasoning);

        appendLocalTurn(input.trim(), nextOutput, nextScore, nextConfidence, nextTone, nextReasoning, true);
        await refreshHistory(nextSessionId);
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "Something went wrong.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCopy = async () => {
    if (!output) {
      return;
    }

    await navigator.clipboard.writeText(output);
    setCopied(true);
  };

  const handleSelectHistory = (item: HistoryItem) => {
    setInput(item.input);
    setRawInput(item.input);
    setNormalizedInput(item.normalizedInput || item.input);
    setOutput(item.output);
    setScore(item.score);
    setConfidence(item.confidence || 0);
    setTone(item.tone || "neutral");
    setIssues([]);
    setImprovements([]);
    setReasoning(item.reasoning || "");
    setShowDetails(false);
    setCopied(false);
    setError("");
  };

  const filteredHistory = history.filter((item) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return true;
    }

    return [item.input, item.output, item.normalizedInput, item.reasoning]
      .filter((value): value is string => Boolean(value))
      .some((value) => value.toLowerCase().includes(query));
  });

  const sidebarHistory = filteredHistory.slice(0, 14);

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarTop}>
            <div className={styles.brandRow}>
              <div className={styles.brandMark}>V</div>
              <div>
                <p className={styles.brand}>Verixa AI</p>
                <p className={styles.brandSub}>Prompt studio</p>
              </div>
            </div>

            <label className={styles.searchBox} htmlFor="history-search">
              <span className={styles.searchIcon}>⌕</span>
              <input
                id="history-search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className={styles.searchInput}
                placeholder="Search chats"
              />
            </label>

            <div className={styles.sectionHeader}>
              <p className={styles.sectionTitle}>Recent</p>
              <div className={styles.sectionActions}>
                <p className={styles.sectionMeta}>{sidebarHistory.length} items</p>
                <button type="button" className={styles.newChatButton} onClick={handleNewChat}>
                  New chat
                </button>
              </div>
            </div>

            <HistoryPanel history={sidebarHistory} onSelect={handleSelectHistory} showLabel={false} />
          </div>

          <ProfileDock
            session={session}
            authReady={authReady}
            supabaseConfigured={supabaseConfigured}
          />
        </aside>

        <section className={styles.workspace}>
          <div className={styles.workspaceTopBar}>
            <button type="button" className={styles.pillButton}>
              AI Assistant
            </button>
            <button type="button" className={styles.menuButton}>
              •••
            </button>
          </div>

          <div className={styles.workspaceBody}>
            <motion.section
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className={styles.hero}
            >
              <p className={styles.eyebrow}>Verixa AI</p>
              <h1 className={styles.title}>Make rough prompts feel intentional.</h1>
              <p className={styles.subtitle}>
                A focused workspace for turning vague input into something clearer,
                sharper, and more presentable without drowning the experience in noise.
              </p>
            </motion.section>

            {!authReady ? (
              <motion.p {...revealProps} className={styles.status}>
                Preparing workspace...
              </motion.p>
            ) : !supabaseConfigured ? (
              <motion.div {...revealProps} className={styles.error}>
                Supabase auth is not configured in this deployment yet. Add
                `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
                in Cloudflare variables and redeploy.
              </motion.div>
            ) : !session ? (
              <motion.div {...revealProps} id="account-access" className={styles.authShell}>
                <AuthPanel onAuthenticated={() => setAuthReady(true)} />
              </motion.div>
            ) : (
              <motion.div {...revealProps} className={styles.composerShell}>
                <div className={styles.composerIntro}>
                  <p className={styles.composerKicker}>Message AI Chat</p>
                  <p className={styles.composerHint}>
                    Keep asking follow-up questions in the same chat. Start a new chat from sidebar only when you want a fresh context.
                  </p>
                </div>

                <InputBox
                  input={input}
                  mode={mode}
                  onInputChange={setInput}
                  onModeChange={handleModeChange}
                  onGenerate={handleGenerate}
                  loading={loading}
                />
              </motion.div>
            )}

            {session && loading ? (
              <motion.p {...revealProps} className={styles.status}>
                Transforming your input...
              </motion.p>
            ) : null}

            {session && error ? (
              <motion.div {...revealProps} className={styles.error}>
                {error}
              </motion.div>
            ) : null}

            {session && turns.length > 0 ? (
              <section className={styles.threadPanel}>
                <p className={styles.threadTitle}>Current chat</p>
                <div className={styles.threadList}>
                  {turns.slice(-8).map((turn) => (
                    <article key={turn.timestamp} className={styles.threadItem}>
                      <p className={styles.threadQuestion}>{turn.input}</p>
                      <p className={styles.threadAnswer}>{turn.output}</p>
                      <div className={styles.threadMetaRow}>
                        <span className={styles.threadMetaChip}>Score {Math.round(turn.score)}</span>
                        <span className={styles.threadMetaChip}>Confidence {Math.round(turn.confidence || 0)}</span>
                        <span className={styles.threadMetaChip}>{turn.tone || "neutral"}</span>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}

            {session && output ? (
              <div className={styles.stack}>
                <motion.div {...revealProps}>
                  <p className={styles.iterationLabel}>Refinement iteration {iterationCount}</p>
                  <ResultPanel rawInput={rawInput} normalizedInput={normalizedInput} output={output} />
                </motion.div>

                <motion.div {...revealProps} className={styles.stack}>
                  <ScoreCard score={score} confidence={confidence} tone={tone} />

                  <div className={styles.actionRow}>
                    <button onClick={handleCopy} className={styles.ghostButton}>
                      {copied ? "Copied" : "Copy"}
                    </button>
                    <button
                      onClick={handleRefine}
                      className={styles.refineButton}
                      disabled={loading || score > 90}
                    >
                      {score > 90 ? "Already polished" : "Refine again"}
                    </button>
                    <button
                      onClick={() => setShowDetails((current) => !current)}
                      className={styles.toggleButton}
                    >
                      {showDetails ? "Hide details" : "View details"}
                    </button>
                  </div>
                </motion.div>

                {showDetails ? (
                  <motion.div {...revealProps}>
                    <InsightsPanel issues={issues} improvements={improvements} reasoning={reasoning} />
                  </motion.div>
                ) : null}
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}
