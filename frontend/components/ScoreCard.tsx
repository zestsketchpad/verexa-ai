import styles from "./ScoreCard.module.css";

type ScoreCardProps = {
  score: number;
  confidence: number;
  tone: string;
};

export default function ScoreCard({ score, confidence, tone }: ScoreCardProps) {
  return (
    <div className={styles.card}>
      <div className={styles.line}>
        <span className={styles.strong}>Score: {Math.round(score)}/100</span>
        <span className={styles.dot}>&bull;</span>
        <span>Confidence: {Math.round(confidence)}%</span>
        <span className={styles.dot}>&bull;</span>
        <span className="capitalize">Tone: {tone || "neutral"}</span>
      </div>
    </div>
  );
}
