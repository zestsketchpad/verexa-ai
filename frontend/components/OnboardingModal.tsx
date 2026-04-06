"use client";

import styles from "./OnboardingModal.module.css";

type OnboardingModalProps = {
  open: boolean;
  onTryDemo: () => void;
  onClose: () => void;
};

export default function OnboardingModal({ open, onTryDemo, onClose }: OnboardingModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Quick start hint">
      <div className={styles.modal}>
        <p className={styles.hintText}>Paste your proposal and click Fix My Message to get a send-ready version.</p>

        <div className={styles.actions}>
          <button type="button" className={styles.primaryButton} onClick={onTryDemo}>
            Try Demo
          </button>
          <button type="button" className={styles.secondaryButton} onClick={onClose}>
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
