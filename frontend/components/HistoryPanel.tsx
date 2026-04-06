"use client";

import styles from "./HistoryPanel.module.css";

export type HistoryItem = {
  id?: string;
  input: string;
  normalizedInput?: string;
  output: string;
  score: number;
  confidence?: number;
  tone?: string;
  reasoning?: string;
  timestamp: number;
};

type HistoryPanelProps = {
  history: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
  showLabel?: boolean;
};

export default function HistoryPanel({ history, onSelect, showLabel = true }: HistoryPanelProps) {
  return (
    <div className={styles.panel}>
      {showLabel ? <p className={styles.label}>Recent</p> : null}

      {history.length === 0 ? (
        <p className={styles.empty}>No history yet.</p>
      ) : (
        <div className={styles.list}>
          {history.map((item) => (
            <button
              key={item.timestamp}
              type="button"
              onClick={() => onSelect(item)}
              className={styles.item}
            >
              <p className={styles.input}>{item.input}</p>
              <p className={styles.meta}>
                Score {Math.round(item.score)} | Conf {Math.round(item.confidence || 0)}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
