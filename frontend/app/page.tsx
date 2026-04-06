"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { Session } from "@supabase/supabase-js";
import AuthPanel from "@/components/AuthPanel";
import InputBox from "@/components/InputBox";
import ResultPanel from "@/components/ResultPanel";
import ScoreCard from "@/components/ScoreCard";
import InsightsPanel from "@/components/InsightsPanel";
import HistoryPanel, { type HistoryItem } from "@/components/HistoryPanel";
import ProfilePolicyPanel from "@/components/ProfilePolicyPanel";
import { generateResponse } from "@/lib/api";
import { ensureMemorySession, fetchMemoryHistory, getStoredSessionId } from "@/lib/memory";
import { createSupabaseBrowserClient, hasSupabaseBrowserConfig } from "@/lib/supabase/client";
import styles from "./page.module.css";

const revealProps = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35 },
};

export default function Home() {
  const supabaseConfigured = hasSupabaseBrowserConfig();
  const supabase = useMemo(() => {
    return createSupabaseBrowserClient();
  }, []);
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
  const [sessionId, setSessionId] = useState("");

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
      setSessionId("");
      return;
    }

    let cancelled = false;
    const activeUserId = session.user.id;

    async function initializeMemory() {
      try {
        const nextSessionId = await ensureMemorySession(activeUserId);
        if (cancelled) {
          return;
        }

        setSessionId(nextSessionId);

        if (nextSessionId) {
          const nextHistory = await fetchMemoryHistory(nextSessionId);
          if (!cancelled) {
            setHistory(nextHistory);
          }
        }
      } catch (err) {
        console.error(err);
      }
    }

    const existingSessionId = getStoredSessionId();
    if (existingSessionId) {
      setSessionId(existingSessionId);
      void fetchMemoryHistory(existingSessionId)
        .then((items) => {
          if (!cancelled) {
            setHistory(items);
          }
        })
        .catch((err) => console.error(err));
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
    setIterationCount(1);

    try {
      const nextSessionId = sessionId || (await ensureMemorySession(session?.user.id));
      if (nextSessionId && nextSessionId !== sessionId) {
        setSessionId(nextSessionId);
      }

      const data = await generateResponse(trimmed, mode, nextSessionId);

      setRawInput(data.raw_input || trimmed);
      setNormalizedInput(data.normalized_input || trimmed);
      setOutput(data.verified_response || "");
      setScore(typeof data.score === "number" ? data.score : 0);
      setConfidence(typeof data.confidence === "number" ? data.confidence : 0);
      setTone(data.tone || "neutral");
      setIssues(Array.isArray(data.issues_found) ? data.issues_found : []);
      setImprovements(Array.isArray(data.improvements_made) ? data.improvements_made : []);
      setReasoning(data.reasoning || "");
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
      const nextSessionId = sessionId || (await ensureMemorySession(session?.user.id));
      if (nextSessionId && nextSessionId !== sessionId) {
        setSessionId(nextSessionId);
      }

      const data = await generateResponse(refinedInput, mode, nextSessionId);
      setInput(refinedInput);
      setRawInput(data.raw_input || refinedInput);
      setNormalizedInput(data.normalized_input || refinedInput);
      setOutput(data.verified_response || refinedInput);
      setScore(typeof data.score === "number" ? data.score : 0);
      setConfidence(typeof data.confidence === "number" ? data.confidence : 0);
      setTone(data.tone || "neutral");
      setIssues(Array.isArray(data.issues_found) ? data.issues_found : []);
      setImprovements(Array.isArray(data.improvements_made) ? data.improvements_made : []);
      setReasoning(data.reasoning || "");
      setIterationCount((current) => current + 1);
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
        const nextSessionId = sessionId || (await ensureMemorySession(session?.user.id));
        if (nextSessionId && nextSessionId !== sessionId) {
          setSessionId(nextSessionId);
        }

        const data = await generateResponse(input.trim(), nextMode, nextSessionId);

        setRawInput(data.raw_input || input.trim());
        setNormalizedInput(data.normalized_input || input.trim());
        setOutput(data.verified_response || "");
        setScore(typeof data.score === "number" ? data.score : 0);
        setConfidence(typeof data.confidence === "number" ? data.confidence : 0);
        setTone(data.tone || "neutral");
        setIssues(Array.isArray(data.issues_found) ? data.issues_found : []);
        setImprovements(Array.isArray(data.improvements_made) ? data.improvements_made : []);
        setReasoning(data.reasoning || "");
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
    setIterationCount(1);
  };

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
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
            `NEXT_PUBLIC_SUPABASE_URL` and
            `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in Cloudflare variables and redeploy.
          </motion.div>
        ) : !session ? (
          <motion.div {...revealProps}>
            <AuthPanel onAuthenticated={() => setAuthReady(true)} />
          </motion.div>
        ) : (
          <>
            <motion.div {...revealProps}>
              <ProfilePolicyPanel user={session.user} />
            </motion.div>

            <motion.div {...revealProps}>
              <InputBox
                input={input}
                mode={mode}
                onInputChange={setInput}
                onModeChange={handleModeChange}
                onGenerate={handleGenerate}
                loading={loading}
              />
            </motion.div>
          </>
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

        {session && output ? (
          <div className={styles.stack}>
            <motion.div {...revealProps}>
              <p className={styles.iterationLabel}>
                Refinement iteration {iterationCount}
              </p>
              <ResultPanel
                rawInput={rawInput}
                normalizedInput={normalizedInput}
                output={output}
              />
            </motion.div>

            <motion.div {...revealProps} className={styles.stack}>
              <ScoreCard score={score} confidence={confidence} tone={tone} />

              <div className={styles.actionRow}>
                <button
                  onClick={handleCopy}
                  className={styles.ghostButton}
                >
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
                <InsightsPanel
                  issues={issues}
                  improvements={improvements}
                  reasoning={reasoning}
                />
              </motion.div>
            ) : null}

            <motion.div {...revealProps}>
              <HistoryPanel history={history} onSelect={handleSelectHistory} />
            </motion.div>
          </div>
        ) : null}
      </div>
    </main>
  );
}
