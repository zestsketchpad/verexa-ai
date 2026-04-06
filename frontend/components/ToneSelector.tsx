"use client";

import styles from "./ToneSelector.module.css";

export type ToneOption = "professional" | "friendly" | "assertive";

type ToneSelectorProps = {
  tone: ToneOption;
  onChange: (tone: ToneOption) => void;
  disabled?: boolean;
};

const OPTIONS: Array<{ key: ToneOption; label: string }> = [
  { key: "professional", label: "Professional" },
  { key: "friendly", label: "Friendly" },
  { key: "assertive", label: "Assertive" },
];

export default function ToneSelector({ tone, onChange, disabled = false }: ToneSelectorProps) {
  return (
    <div className={styles.wrap} role="group" aria-label="Tone selector">
      <p className={styles.label}>Tone</p>
      <div className={styles.options}>
        {OPTIONS.map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => onChange(option.key)}
            disabled={disabled}
            className={tone === option.key ? `${styles.button} ${styles.buttonActive}` : styles.button}
            aria-pressed={tone === option.key}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
