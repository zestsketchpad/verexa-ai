"use client";

import styles from "./PlatformSelector.module.css";

export type PlatformOption = "upwork" | "email" | "linkedin";

type PlatformSelectorProps = {
  platform: PlatformOption;
  onChange: (value: PlatformOption) => void;
  disabled?: boolean;
};

const OPTIONS: Array<{ value: PlatformOption; label: string; hint: string }> = [
  { value: "upwork", label: "Upwork", hint: "Proposal-first, outcome-focused" },
  { value: "email", label: "Email", hint: "Formal, structured, concise" },
  { value: "linkedin", label: "LinkedIn", hint: "Warm, short, conversational" },
];

export default function PlatformSelector({ platform, onChange, disabled = false }: PlatformSelectorProps) {
  return (
    <div className={styles.wrap}>
      <p className={styles.label}>Platform</p>
      <div className={styles.grid}>
        {OPTIONS.map((option) => {
          const selected = platform === option.value;
          return (
            <button
              key={option.value}
              type="button"
              className={`${styles.button} ${selected ? styles.buttonActive : ""}`}
              onClick={() => onChange(option.value)}
              disabled={disabled}
            >
              <span className={styles.title}>{option.label}</span>
              <span className={styles.hint}>{option.hint}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
