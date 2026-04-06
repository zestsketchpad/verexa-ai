import styles from "./InsightsPanel.module.css";

type InsightsPanelProps = {
  issues: string[];
  improvements: string[];
  reasoning: string;
};

export default function InsightsPanel({
  issues,
  improvements,
  reasoning,
}: InsightsPanelProps) {
  const hasReasoning = reasoning.trim().length > 0;
  const hasIssues = issues.length > 0;
  const hasImprovements = improvements.length > 0;

  if (!hasReasoning && !hasIssues && !hasImprovements) {
    return null;
  }

  return (
    <div className={styles.panel}>
      {hasReasoning ? (
        <div className={`${styles.block} ${styles.reasoningBlock}`}>
          <p className={styles.title}>Why This Was Improved</p>
          <p className={styles.reasoning}>{reasoning}</p>
        </div>
      ) : null}

      {hasIssues ? (
        <div className={`${styles.block} ${styles.issuesBlock}`}>
          <p className={`${styles.title} ${styles.issuesTitle}`}>What Was Weak</p>
          <ul className={styles.list}>
            {issues.map((item, idx) => (
              <li key={idx} className={styles.item}>
                <span className={styles.bullet}>&bull;</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {hasImprovements ? (
        <div className={`${styles.block} ${styles.improvementsBlock}`}>
          <p className={`${styles.title} ${styles.improvementsTitle}`}>What Was Improved</p>
          <ul className={styles.list}>
            {improvements.map((item, idx) => (
              <li key={idx} className={styles.item}>
                <span className={styles.bullet}>&bull;</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
