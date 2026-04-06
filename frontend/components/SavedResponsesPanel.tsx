"use client";

import type { SavedResponseItem } from "@/lib/savedResponses";
import styles from "./SavedResponsesPanel.module.css";

type SavedResponsesPanelProps = {
  items: SavedResponseItem[];
  onUse: (item: SavedResponseItem) => void;
  onRemove: (id: string) => void;
};

export default function SavedResponsesPanel({ items, onUse, onRemove }: SavedResponsesPanelProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section className={styles.panel}>
      <div className={styles.header}>
        <p className={styles.title}>Saved Responses</p>
        <p className={styles.subtitle}>Bookmark great outputs and reuse them anytime.</p>
      </div>

      <div className={styles.list}>
        {items.map((item) => (
          <article key={item.id} className={styles.card}>
            <div className={styles.metaRow}>
              <span className={styles.metaBadge}>Score {Math.round(item.score)}</span>
              <span className={styles.metaBadge}>{item.decision}</span>
            </div>
            <p className={styles.preview}>{item.text}</p>
            <div className={styles.actions}>
              <button type="button" className={styles.useButton} onClick={() => onUse(item)}>
                Use Response
              </button>
              <button type="button" className={styles.removeButton} onClick={() => onRemove(item.id)}>
                Remove
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
