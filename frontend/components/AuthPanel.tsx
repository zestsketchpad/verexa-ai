"use client";

import { useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import styles from "./AuthPanel.module.css";

type AuthPanelProps = {
  onAuthenticated: () => void;
};

function resolveAppOrigin(): string | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  const raw =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    window.location.origin;

  let candidate = raw;

  if (!/^https?:\/\//i.test(candidate)) {
    const host = candidate.split("/")[0] || "";
    const isLocal = /^localhost(?::\d+)?$/i.test(host) || /^127\.0\.0\.1(?::\d+)?$/i.test(host);
    candidate = `${isLocal ? "http" : "https"}://${candidate}`;
  }

  try {
    return new URL(candidate).origin;
  } catch {
    return window.location.origin;
  }
}

export default function AuthPanel({ onAuthenticated }: AuthPanelProps) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const resetMessages = () => {
    setError("");
    setSuccess("");
  };

  const handleEmailSignIn = async () => {
    if (!supabase) {
      setError("Supabase auth is not configured for this deployment yet.");
      return;
    }
    resetMessages();
    setLoading(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    onAuthenticated();
  };

  const handleEmailSignUp = async () => {
    if (!supabase) {
      setError("Supabase auth is not configured for this deployment yet.");
      return;
    }
    resetMessages();
    setLoading(true);

    const emailRedirectTo = resolveAppOrigin();

    const { error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo,
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    setSuccess("Account created. Check your email if confirmation is enabled.");
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    if (!supabase) {
      setError("Supabase auth is not configured for this deployment yet.");
      return;
    }
    resetMessages();
    setLoading(true);

    const redirectTo = resolveAppOrigin();

    const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        skipBrowserRedirect: true,
      },
    });

    if (oauthError) {
      setError(oauthError.message);
      setLoading(false);
      return;
    }

    const oauthUrl = String(data?.url || "").trim();
    if (!oauthUrl) {
      setError("OAuth URL could not be generated.");
      setLoading(false);
      return;
    }

    try {
      const url = new URL(oauthUrl);
      if (redirectTo) {
        url.searchParams.set("redirect_to", redirectTo);
      }
      window.location.assign(url.toString());
      return;
    } catch {
      window.location.assign(oauthUrl);
      return;
    }

    setLoading(false);
  };

  return (
    <section className={styles.shell}>
      <div className={styles.header}>
        <p className={styles.eyebrow}>Account</p>
        <h2 className={styles.title}>Create your Verixa workspace</h2>
        <p className={styles.subtitle}>
          Sign in with Google or email to unlock memory, profile settings, and
          policy-based personalization.
        </p>
      </div>

      <div className={styles.stack}>
        <input
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Email address"
          type="email"
          className={styles.input}
        />
        <input
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Password"
          type="password"
          className={styles.input}
        />
      </div>

      <div className={styles.buttonRow}>
        <button
          type="button"
          onClick={handleEmailSignIn}
          disabled={loading || !email.trim() || !password}
          className={styles.primaryButton}
        >
          {loading ? "Working..." : "Sign in"}
        </button>
        <button
          type="button"
          onClick={handleEmailSignUp}
          disabled={loading || !email.trim() || !password}
          className={styles.secondaryButton}
        >
          Create account
        </button>
      </div>

      <div className={styles.divider} />

      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={loading || !supabase}
        className={styles.googleButton}
      >
        Continue with Google
      </button>

      {error ? <p className={`${styles.message} ${styles.error}`}>{error}</p> : null}
      {success ? <p className={`${styles.message} ${styles.success}`}>{success}</p> : null}
    </section>
  );
}
