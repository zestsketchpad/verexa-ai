"use client";

import React from "react";
import styles from "./DiffViewer.module.css";

type DiffViewerProps = {
  original: string;
  improved: string;
};

function highlightDiff(original: string, improved: string) {
  const originalWords = original.trim().split(/\s+/);
  const improvedWords = improved.trim().split(/\s+/);

  return improvedWords.map((word, index) => {
    const content = `${word}${index < improvedWords.length - 1 ? " " : ""}`;

    if (originalWords[index] !== word) {
      return (
        <span key={`${word}-${index}`} className={styles.changedWord}>
          {content}
        </span>
      );
    }

    return <React.Fragment key={`${word}-${index}`}>{content}</React.Fragment>;
  });
}

export default function DiffViewer({ original, improved }: DiffViewerProps) {
  return (
    <div className={styles.wrapper}>
      <div className={`${styles.panel} ${styles.beforePanel}`}>
        <p className={`${styles.label} ${styles.beforeLabel}`}>Before</p>
        <p className={styles.beforeText}>{original}</p>
      </div>

      <div className={`${styles.panel} ${styles.afterPanel}`}>
        <p className={`${styles.label} ${styles.afterLabel}`}>After (Improved)</p>
        <p className={styles.afterText}>{highlightDiff(original, improved)}</p>
      </div>
    </div>
  );
}
