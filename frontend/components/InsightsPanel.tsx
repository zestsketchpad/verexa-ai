import styles from "./InsightsPanel.module.css";

type InsightsPanelProps = {
  issues: string[];
  improvements: string[];
};

function DetailList({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  return (
    <div className={styles.block}>
      <p className={styles.title}>{title}</p>
      {items.length > 0 ? (
        <ul className={styles.list}>
          {items.map((item, idx) => (
            <li key={idx} className={styles.item}>
              <span className={styles.bullet}>&bull;</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.empty}>No details returned.</p>
      )}
    </div>
  );
}

export default function InsightsPanel({
  issues,
  improvements,
}: InsightsPanelProps) {
  return (
    <div className={styles.panel}>
      <DetailList title="Issues Found" items={issues} />
      <DetailList title="Improvements Made" items={improvements} />
    </div>
  );
}
