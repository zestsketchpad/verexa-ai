"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import AuthPanel from "@/components/AuthPanel";
import type { HistoryItem } from "@/components/HistoryPanel";
import ProfileDock from "@/components/ProfileDock";
import { generateResponse } from "@/lib/api";
import {
  clearStoredSessionId,
  createMemorySession,
  fetchMemoryHistory,
  getStoredChatSessions,
  getStoredSessionId,
  setStoredSessionId,
  type ChatSessionSummary,
  upsertStoredChatSession,
} from "@/lib/memory";
import { createSupabaseBrowserClient, hasSupabaseBrowserConfig } from "@/lib/supabase/client";
import styles from "./page.module.css";

const MODE_OPTIONS = [
  { key: "auto", label: "Auto" },
  { key: "coding", label: "Coding" },
  { key: "email", label: "Email" },
  { key: "explain", label: "Explain" },
  { key: "brainstorm", label: "Ideas" },
];

function toChronologicalTurns(items: HistoryItem[]): HistoryItem[] {
  return [...items].sort((a, b) => a.timestamp - b.timestamp);
}

function deriveChatTitle(input: string): string {
  const compact = input.trim().replace(/\s+/g, " ");
  if (!compact) {
    return "New chat";
  }

  return compact.length > 48 ? `${compact.slice(0, 48)}...` : compact;
}

function formatTime(timestamp: number): string {
  try {
    return new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "Now";
  }
}

function turnIdentity(turn: HistoryItem): string {
  return String(turn.id || turn.timestamp);
}

export default function Home() {
  const supabaseConfigured = hasSupabaseBrowserConfig();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const threadRef = useRef<HTMLDivElement | null>(null);

  const [authReady, setAuthReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [draft, setDraft] = useState("");
  const [mode, setMode] = useState("auto");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [turns, setTurns] = useState<HistoryItem[]>([]);
  const [sessionId, setSessionId] = useState("");
  const [pendingPrompt, setPendingPrompt] = useState("");
  const [chatSessions, setChatSessions] = useState<ChatSessionSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTurnId, setSelectedTurnId] = useState("");

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
      setTurns([]);
      setSessionId("");
      setChatSessions([]);
      setSelectedTurnId("");
      return;
    }

    const userId = session.user.id;
    const storedChats = getStoredChatSessions(userId);
    setChatSessions(storedChats);

    const activeSessionId =
      getStoredSessionId(userId) || (storedChats.length > 0 ? storedChats[0].sessionId : "");

    setSessionId(activeSessionId);
  }, [authReady, session]);

  useEffect(() => {
    if (!session || !sessionId) {
      setTurns([]);
      return;
    }

    let cancelled = false;

    async function hydrate() {
      setError("");

      try {
        const nextHistory = await fetchMemoryHistory(sessionId);
        if (cancelled) {
          return;
        }

        const nextTurns = toChronologicalTurns(nextHistory);
        setTurns(nextTurns);

        if (nextTurns.length > 0) {
          setSelectedTurnId(turnIdentity(nextTurns[nextTurns.length - 1]));
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load chat history.");
        }
      }
    }

    void hydrate();

    return () => {
      cancelled = true;
    };
  }, [session, sessionId]);

  useEffect(() => {
    const node = threadRef.current;
    if (!node) {
      return;
    }

    node.scrollTo({ top: node.scrollHeight, behavior: "smooth" });
  }, [turns, pendingPrompt]);

  const handleNewChat = () => {
    if (session) {
      clearStoredSessionId(session.user.id);
    }

    setSessionId("");
    setTurns([]);
    setPendingPrompt("");
    setSelectedTurnId("");
    setError("");
  };

  const handleSelectChat = (nextSessionId: string) => {
    if (!session || !nextSessionId) {
      return;
    }

    setStoredSessionId(nextSessionId, session.user.id);
    setSessionId(nextSessionId);
    setPendingPrompt("");
    setError("");
  };

  const handleGenerate = async () => {
    const trimmed = draft.trim();

    if (!trimmed || loading || !session) {
      return;
    }

    setDraft("");
    setLoading(true);
    setError("");
    setPendingPrompt(trimmed);

    let resolvedSessionId = sessionId;

    try {
      if (!resolvedSessionId) {
        resolvedSessionId = await createMemorySession(session.user.id, deriveChatTitle(trimmed));
        setSessionId(resolvedSessionId);
        setStoredSessionId(resolvedSessionId, session.user.id);
      }

      const data = await generateResponse(trimmed, mode, resolvedSessionId);
      const nextOutput =
        String(data.verified_response || "").trim() ||
        "I could not generate a response. Please try again.";

      const fallbackTurn: HistoryItem = {
        id: `${Date.now()}`,
        input: trimmed,
        normalizedInput: data.normalized_input || trimmed,
        output: nextOutput,
        score: typeof data.score === "number" ? data.score : 0,
        confidence: typeof data.confidence === "number" ? data.confidence : 0,
        tone: data.tone || "neutral",
        reasoning: data.reasoning || "",
        timestamp: Date.now(),
      };

      const refreshed = await fetchMemoryHistory(resolvedSessionId);
      const nextTurns = toChronologicalTurns(refreshed);
      const resolvedTurns = nextTurns.length > 0 ? nextTurns : [...turns, fallbackTurn];

      setTurns(resolvedTurns);
      setSelectedTurnId(turnIdentity(resolvedTurns[resolvedTurns.length - 1]));

      const updatedSessions = upsertStoredChatSession(
        {
          sessionId: resolvedSessionId,
          title: deriveChatTitle(trimmed),
          preview: nextOutput.slice(0, 140),
          updatedAt: Date.now(),
        },
        session.user.id,
      );
      setChatSessions(updatedSessions);
    } catch (err) {
      console.error(err);
      setDraft(trimmed);
      setError(err instanceof Error ? err.message : "Something went wrong while generating a response.");
    } finally {
      setLoading(false);
      setPendingPrompt("");
    }
  };

  const handleComposerKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleGenerate();
    }
  };

  const filteredChats = chatSessions.filter((item) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return true;
    }

    return [item.title, item.preview]
      .filter((value): value is string => Boolean(value))
      .some((value) => value.toLowerCase().includes(query));
  });

  const activeTurn =
    turns.find((turn) => turnIdentity(turn) === selectedTurnId) ||
    (turns.length > 0 ? turns[turns.length - 1] : null);

  const canSend = draft.trim().length >= 3 && !loading;

  return (
    <main className={styles.page}>
      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarTop}>
            <div className={styles.brandRow}>
              <span className={styles.brandMark}>V</span>
              <div>
                <p className={styles.brandTitle}>Verixa AI</p>
                <p className={styles.brandSub}>Assistant</p>
              </div>
            </div>

            <button type="button" className={styles.newChatButton} onClick={handleNewChat}>
              + New chat
            </button>

            <label htmlFor="chat-search" className={styles.searchBox}>
              <input
                id="chat-search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search your chats"
                className={styles.searchInput}
              />
            </label>

            <div className={styles.chatList}>
              {filteredChats.length === 0 ? (
                <p className={styles.emptyChats}>No saved chats yet.</p>
              ) : (
                filteredChats.map((chat) => (
                  <button
                    key={chat.sessionId}
                    type="button"
                    onClick={() => handleSelectChat(chat.sessionId)}
                    className={
                      chat.sessionId === sessionId
                        ? `${styles.chatItem} ${styles.chatItemActive}`
                        : styles.chatItem
                    }
                  >
                    <p className={styles.chatTitle}>{chat.title}</p>
                    <p className={styles.chatPreview}>{chat.preview || "No preview yet"}</p>
                    <p className={styles.chatTime}>{formatTime(chat.updatedAt)}</p>
                  </button>
                ))
              )}
            </div>
          </div>

          <ProfileDock
            session={session}
            authReady={authReady}
            supabaseConfigured={supabaseConfigured}
          />
        </aside>

        <section className={styles.mainPanel}>
          <header className={styles.mainHeader}>
            <div>
              <p className={styles.headerEyebrow}>Conversation</p>
              <h1 className={styles.headerTitle}>Write naturally. Keep context automatically.</h1>
            </div>

            <label className={styles.modeSelectWrap}>
              <span>Mode</span>
              <select
                value={mode}
                onChange={(event) => setMode(event.target.value)}
                className={styles.modeSelect}
              >
                {MODE_OPTIONS.map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
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
              <div ref={threadRef} className={styles.thread}>
                {turns.length === 0 && !pendingPrompt ? (
                  <div className={styles.emptyThread}>
                    <h2>Start a proper conversation</h2>
                    <p>
                      Ask anything below. Your responses stay in this chat, so follow-ups keep context.
                    </p>
                  </div>
                ) : null}

                {turns.map((turn) => (
                  <div key={turnIdentity(turn)} className={styles.turnBlock}>
                    <article className={`${styles.message} ${styles.userMessage}`}>
                      <p>{turn.input}</p>
                    </article>

                    <article
                      className={`${styles.message} ${styles.assistantMessage}`}
                      onClick={() => setSelectedTurnId(turnIdentity(turn))}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setSelectedTurnId(turnIdentity(turn));
                        }
                      }}
                    >
                      <p>{turn.output}</p>
                      <div className={styles.messageMeta}>
                        <span>Score {Math.round(turn.score)}</span>
                        <span>Conf {Math.round(turn.confidence || 0)}</span>
                        <span>{turn.tone || "neutral"}</span>
                      </div>
                    </article>
                  </div>
                ))}

                {pendingPrompt ? (
                  <div className={styles.turnBlock}>
                    <article className={`${styles.message} ${styles.userMessage}`}>
                      <p>{pendingPrompt}</p>
                    </article>
                    <article className={`${styles.message} ${styles.assistantMessage}`}>
                      <p className={styles.typing}>Generating response...</p>
                    </article>
                  </div>
                ) : null}
              </div>

              {error ? <p className={styles.errorText}>{error}</p> : null}

              <form
                className={styles.composer}
                onSubmit={(event) => {
                  event.preventDefault();
                  void handleGenerate();
                }}
              >
                <textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={handleComposerKeyDown}
                  placeholder="Message Verixa AI..."
                  className={styles.composerInput}
                />
                <button type="submit" className={styles.sendButton} disabled={!canSend}>
                  {loading ? "Generating..." : "Send"}
                </button>
              </form>
            </>
          )}
        </section>

        <aside className={styles.inspector}>
          <p className={styles.inspectorLabel}>Chat details</p>
          {activeTurn ? (
            <div className={styles.inspectorCard}>
              <p className={styles.inspectorTitle}>Latest analysis</p>
              <p className={styles.inspectorValue}>Score {Math.round(activeTurn.score)}</p>
              <p className={styles.inspectorValue}>
                Confidence {Math.round(activeTurn.confidence || 0)}
              </p>
              <p className={styles.inspectorValue}>Tone {activeTurn.tone || "neutral"}</p>
              <p className={styles.inspectorReasoning}>
                {activeTurn.reasoning || "No reasoning provided."}
              </p>
            </div>
          ) : (
            <p className={styles.infoText}>No turn selected yet.</p>
          )}
        </aside>
      </div>
    </main>
  );
}
