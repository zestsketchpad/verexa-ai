"use client";
import styles from "./InputBox.module.css";

type InputBoxProps = {
  input: string;
  mode: string;
  onInputChange: (value: string) => void;
  onModeChange: (value: string) => void;
  onGenerate: (input: string) => Promise<void> | void;
  loading: boolean;
};

export default function InputBox({
  input,
  mode,
  onInputChange,
  onModeChange,
  onGenerate,
  loading,
}: InputBoxProps) {
  const hasInput = input.trim().length >= 3;

  return (
    <div className={styles.card}>
      <div className={styles.content}>
        <div>
          <p className={styles.label}>Source Input</p>
          <p className={styles.hint}>
            Drop in a rough prompt, a messy draft, or a short question.
          </p>
        </div>

        <div className={styles.modeRow}>
          {[
            { key: "auto", label: "Auto" },
            { key: "email", label: "Email" },
            { key: "explain", label: "Explain" },
            { key: "coding", label: "Coding" },
            { key: "brainstorm", label: "Ideas" },
          ].map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => onModeChange(option.key)}
              className={
                mode === option.key
                  ? `${styles.modeButton} ${styles.modeButtonActive}`
                  : styles.modeButton
              }
            >
              {option.label}
            </button>
          ))}
        </div>

        <textarea
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          placeholder="Paste your draft, prompt, or rough question here..."
          className={styles.textarea}
        />

        <div className={styles.footer}>
          <p className={styles.rail}>
            Input -&gt; Transformation -&gt; Final Answer
          </p>

          <button
            onClick={() => {
              console.log("CLICKED:", input);
              void onGenerate(input);
            }}
            disabled={!hasInput || loading}
            className={styles.button}
          >
            {loading ? "Generating..." : "Generate"}
          </button>
        </div>
      </div>
    </div>
  );
}
