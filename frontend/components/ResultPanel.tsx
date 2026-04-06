import DiffViewer from "./DiffViewer";
import styles from "./ResultPanel.module.css";

type ResultPanelProps = {
  rawInput: string;
  normalizedInput: string;
  output: string;
};

export default function ResultPanel({
  rawInput,
  normalizedInput,
  output,
}: ResultPanelProps) {
  return (
    <div className={styles.grid}>
      <div className={styles.after}>
        <div className={styles.headerRow}>
          <p className={styles.label}>Transformation</p>
          <div className={styles.badge}>Refined</div>
        </div>

        {normalizedInput && normalizedInput !== rawInput ? (
          <div className={styles.normalizedBox}>
            <p className={styles.normalizedLabel}>Normalized Intent</p>
            <p className={styles.normalizedText}>{normalizedInput}</p>
          </div>
        ) : null}

        <DiffViewer original={rawInput} improved={output} />
      </div>
    </div>
  );
}
