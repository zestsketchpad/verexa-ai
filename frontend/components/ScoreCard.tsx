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
        <span className={styles.strong}>Score: {score}/10</span>
        <span className={styles.dot}>&bull;</span>
        <span>Confidence: {(confidence * 100).toFixed(0)}%</span>
        <span className={styles.dot}>&bull;</span>
        <span className="capitalize">Tone: {tone || "neutral"}</span>
      </div>
    </div>
  );
}
