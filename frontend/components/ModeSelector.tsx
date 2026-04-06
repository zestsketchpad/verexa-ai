"use client";

import styles from "./ModeSelector.module.css";

export type IntentMode = "freelance" | "email" | "strategy";

type ModeSelectorProps = {
  mode: IntentMode;
  onChange: (mode: IntentMode) => void;
};

const OPTIONS: Array<{ key: IntentMode; label: string }> = [
  { key: "freelance", label: "Freelance Message" },
  { key: "email", label: "Email Draft" },
  { key: "strategy", label: "Strategy Idea" },
];

export default function ModeSelector({ mode, onChange }: ModeSelectorProps) {
  return (
    <div className={styles.wrap} role="group" aria-label="Intent mode selector">
      {OPTIONS.map((option) => (
        <button
          key={option.key}
          type="button"
          onClick={() => onChange(option.key)}
          className={mode === option.key ? `${styles.button} ${styles.buttonActive}` : styles.button}
          aria-pressed={mode === option.key}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
