import { useEffect, useState } from "react";
import styles from "./LoadingState.module.css";

const LOADING_MESSAGES = [
  "Analyzing tone...",
  "Checking client perception...",
  "Optimizing response...",
  "Finalizing your message...",
];

const LOADING_STEPS = [
  "Analyzing tone",
  "Checking client perception",
  "Optimizing response",
  "Finalizing",
];

export default function LoadingState() {
  const [messageIndex, setMessageIndex] = useState(0);
  const progressPercent = Math.round(((messageIndex + 1) / LOADING_MESSAGES.length) * 100);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => {
        if (prev >= LOADING_MESSAGES.length - 1) {
          return prev;
        }
        return prev + 1;
      });
    }, 900);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={styles.loadingWrap}>
      <div className={styles.loader}>
        <div className={styles.spinnerOuter}>
          <div className={styles.spinnerInner} />
        </div>
      </div>

      <p className={styles.message}>{LOADING_MESSAGES[messageIndex]}</p>

      <div className={styles.progressWrap}>
        <div className={styles.progressTrack}>
          <div className={styles.progressFill} style={{ width: `${progressPercent}%` }} />
        </div>
        <p className={styles.progressLabel}>{progressPercent}% complete</p>
      </div>

      <div className={styles.stepIndicator}>
        {LOADING_STEPS.map((step, idx) => (
          <div
            key={idx}
            className={`${styles.step} ${idx <= messageIndex ? styles.stepActive : ""}`}
          >
            <span className={styles.stepDot} />
            <span className={styles.stepLabel}>{step}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
