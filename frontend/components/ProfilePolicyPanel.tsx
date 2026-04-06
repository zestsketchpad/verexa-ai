"use client";

import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import styles from "./ProfilePolicyPanel.module.css";

type ProfilePolicyPanelProps = {
  user: User;
};

type FormState = {
  full_name: string;
  company: string;
  role: string;
  goals: string;
  preferred_tone: string;
  response_style: string;
  memory_mode: string;
  factual_strictness: string;
};

const defaultState: FormState = {
  full_name: "",
  company: "",
  role: "",
  goals: "",
  preferred_tone: "professional",
  response_style: "concise",
  memory_mode: "persistent",
  factual_strictness: "strict",
};

export default function ProfilePolicyPanel({ user }: ProfilePolicyPanelProps) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [form, setForm] = useState<FormState>(defaultState);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      setLoading(true);

      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (cancelled) {
        return;
      }

      if (error) {
        setStatus(error.message);
        setLoading(false);
        return;
      }

      if (data) {
        setForm({
          full_name: data.full_name || "",
          company: data.company || "",
          role: data.role || "",
          goals: data.goals || "",
          preferred_tone: data.preferred_tone || "professional",
          response_style: data.response_style || "concise",
          memory_mode: data.memory_mode || "persistent",
          factual_strictness: data.factual_strictness || "strict",
        });
      }

      setLoading(false);
    }

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, [supabase, user.id]);

  useEffect(() => {
    if (!status) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setStatus("");
    }, 2800);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [status]);

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setStatus("");

    const { error } = await supabase.from("user_profiles").upsert(
      {
        id: user.id,
        email: user.email,
        ...form,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    );

    if (error) {
      setStatus(error.message);
      setSaving(false);
      return;
    }

    setStatus("Profile and policy updated.");
    setSaving(false);
    setCollapsed(true);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  return (
    <section className={styles.panel}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Profile and policy</h2>
          <p className={styles.subtitle}>
            Shape how Verixa remembers you, responds to you, and applies your preferred behavior.
          </p>
        </div>
        <p className={styles.email}>{user.email}</p>
      </div>

      <div className={styles.toolbar}>
        <button
          type="button"
          onClick={() => setCollapsed((current) => !current)}
          className={styles.secondaryButton}
        >
          {collapsed ? "Edit profile" : "Collapse"}
        </button>
      </div>

      <div className={`${styles.grid} ${collapsed ? styles.gridHidden : ""}`}>
        <div className={styles.field}>
          <label className={styles.label}>Full name</label>
          <input
            value={form.full_name}
            onChange={(event) => updateField("full_name", event.target.value)}
            className={styles.input}
            disabled={loading}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Role</label>
          <input
            value={form.role}
            onChange={(event) => updateField("role", event.target.value)}
            className={styles.input}
            disabled={loading}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Company</label>
          <input
            value={form.company}
            onChange={(event) => updateField("company", event.target.value)}
            className={styles.input}
            disabled={loading}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Preferred tone</label>
          <select
            value={form.preferred_tone}
            onChange={(event) => updateField("preferred_tone", event.target.value)}
            className={styles.select}
            disabled={loading}
          >
            <option value="professional">Professional</option>
            <option value="friendly">Friendly</option>
            <option value="direct">Direct</option>
            <option value="persuasive">Persuasive</option>
          </select>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Response style</label>
          <select
            value={form.response_style}
            onChange={(event) => updateField("response_style", event.target.value)}
            className={styles.select}
            disabled={loading}
          >
            <option value="concise">Concise</option>
            <option value="balanced">Balanced</option>
            <option value="detailed">Detailed</option>
          </select>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Memory mode</label>
          <select
            value={form.memory_mode}
            onChange={(event) => updateField("memory_mode", event.target.value)}
            className={styles.select}
            disabled={loading}
          >
            <option value="off">Off</option>
            <option value="session">Session only</option>
            <option value="persistent">Persistent</option>
          </select>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Factual strictness</label>
          <select
            value={form.factual_strictness}
            onChange={(event) => updateField("factual_strictness", event.target.value)}
            className={styles.select}
            disabled={loading}
          >
            <option value="strict">Strict</option>
            <option value="balanced">Balanced</option>
            <option value="creative">Creative</option>
          </select>
        </div>

        <div className={`${styles.field} ${styles.fieldWide}`}>
          <label className={styles.label}>Goals and working context</label>
          <textarea
            value={form.goals}
            onChange={(event) => updateField("goals", event.target.value)}
            className={styles.textarea}
            disabled={loading}
            placeholder="What are you building, what matters to you, and how should Verixa help?"
          />
        </div>
      </div>

      <div className={styles.footer}>
        <button
          type="button"
          onClick={handleSave}
          disabled={loading || saving}
          className={styles.primaryButton}
        >
          {saving ? "Saving..." : "Save profile"}
        </button>
        <button type="button" onClick={handleSignOut} className={styles.secondaryButton}>
          Sign out
        </button>
        {status ? <p className={styles.status}>{status}</p> : null}
      </div>
    </section>
  );
}
