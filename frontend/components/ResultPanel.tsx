import styles from "./ResultPanel.module.css";

type ResultPanelProps = {
  rawInput: string;
  normalizedInput: string;
  output: string;
  outputs: Record<string, string>;
  activeStyle: string;
  onStyleChange: (style: string) => void;
};

export default function ResultPanel({
  rawInput,
  normalizedInput,
  output,
  outputs,
  activeStyle,
  onStyleChange,
}: ResultPanelProps) {
  const stylesList = [
    { key: "professional", label: "Professional" },
    { key: "casual", label: "Casual" },
    { key: "short", label: "Short" },
    { key: "persuasive", label: "Persuasive" },
  ];

  return (
    <div className={styles.grid}>
      <div className={styles.before}>
        <div className={styles.headerRow}>
          <p className={styles.label}>Before</p>
        </div>
        <p className={styles.beforeText}>{rawInput}</p>

        {normalizedInput && normalizedInput !== rawInput ? (
          <div className={styles.normalizedBox}>
            <p className={styles.normalizedLabel}>Normalized Intent</p>
            <p className={styles.normalizedText}>{normalizedInput}</p>
          </div>
        ) : null}
      </div>

      <div className={styles.after}>
        <div className={styles.headerRow}>
          <p className={styles.label}>After</p>
          <div className={styles.badge}>Refined</div>
        </div>

        <div className={styles.variantRow}>
          {stylesList.map((variant) => (
            <button
              key={variant.key}
              type="button"
              onClick={() => onStyleChange(variant.key)}
              className={
                activeStyle === variant.key
                  ? `${styles.variantButton} ${styles.variantButtonActive}`
                  : styles.variantButton
              }
            >
              {variant.label}
            </button>
          ))}
        </div>

        <p className={styles.afterText}>{output || outputs[activeStyle] || ""}</p>
      </div>
    </div>
  );
}
