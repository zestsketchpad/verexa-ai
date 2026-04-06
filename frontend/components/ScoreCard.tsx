import styles from "./ScoreCard.module.css";

type ScoreCardProps = {
  score: number;
  confidence: number;
  tone: string;
  reasoning?: string;
  issues?: string[];
};

type SendConfidenceBand = {
  label: "Safe to send" | "Review recommended" | "Risky";
  fillClassName: string;
  textClassName: string;
};

function getRiskLevel(score: number): "Low" | "Medium" | "High" {
  if (score < 50) return "High";
  if (score < 75) return "Medium";
  return "Low";
}

function getClarity(confidence: number): "Good" | "NeedsWork" {
  return confidence > 75 ? "Good" : "NeedsWork";
}

function normalizeTone(tone: string): string {
  const t = (tone || "neutral").toLowerCase();
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function clampScore(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.min(100, Math.round(value)));
}

function getSendConfidenceBand(score: number): SendConfidenceBand {
  if (score >= 80) {
    return { label: "Safe to send", fillClassName: styles.fillSafe, textClassName: styles.statusSafe };
  }
  if (score >= 50) {
    return { label: "Review recommended", fillClassName: styles.fillReview, textClassName: styles.statusReview };
  }
  return { label: "Risky", fillClassName: styles.fillRisky, textClassName: styles.statusRisky };
}

function buildConfidenceExplanation(score: number, reasoning: string, issues: string[]): string {
  const cleanReasoning = String(reasoning || "").trim();
  const cleanIssues = Array.isArray(issues)
    ? issues.map((item) => String(item || "").trim()).filter(Boolean)
    : [];

  if (cleanReasoning) {
    return cleanReasoning;
  }

  if (cleanIssues.length > 0) {
    const highlights = cleanIssues.slice(0, 2).join(" and ");
    return `Reduced score due to ${highlights.toLowerCase()}.`;
  }

  if (score < 50) {
    return "Reduced score due to high-risk phrasing and unclear next steps.";
  }
  if (score < 80) {
    return "Reduced score due to moderate clarity/tone issues that still need revision.";
  }

  return "High score because the message is clear, specific, and includes a strong next step.";
}

const RISK_CLASS_MAP: Record<"Low" | "Medium" | "High", string> = {
  Low: styles.riskLow,
  Medium: styles.riskMedium,
  High: styles.riskHigh,
};

const CLARITY_CLASS_MAP: Record<"Good" | "NeedsWork", string> = {
  Good: styles.clarityGood,
  NeedsWork: styles.clarityNeedsWork,
};

export default function ScoreCard({ score, confidence, tone, reasoning = "", issues = [] }: ScoreCardProps) {
  const normalizedScore = clampScore(score);
  const riskLevel = getRiskLevel(score);
  const clarity = getClarity(confidence);
  const displayTone = normalizeTone(tone);
  const clarityDisplay = clarity === "NeedsWork" ? "Needs Work" : clarity;
  const sendBand = getSendConfidenceBand(normalizedScore);
  const explanation = buildConfidenceExplanation(normalizedScore, reasoning, issues);

  return (
    <div className={styles.card}>
      <h3 className={styles.cardTitle}>Your Result</h3>
      <div className={styles.sendConfidenceWrap}>
        <div className={styles.sendHeaderRow}>
          <span className={styles.sendLabel}>Send Confidence</span>
          <span className={styles.sendScore}>{normalizedScore}/100</span>
        </div>
        <div className={styles.progressTrack} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={normalizedScore}>
          <div
            className={`${styles.progressFill} ${sendBand.fillClassName}`}
            style={{ width: `${normalizedScore}%` }}
          />
        </div>
        <p className={`${styles.sendStatus} ${sendBand.textClassName}`}>{sendBand.label}</p>
        <details className={styles.explainWrap}>
          <summary className={styles.explainSummary}>Why this score?</summary>
          <p className={styles.explainText}>{explanation}</p>
        </details>
      </div>
      <div className={styles.grid}>
        <div className={styles.metric}>
          <span className={styles.label}>Risk Level</span>
          <span className={`${styles.value} ${RISK_CLASS_MAP[riskLevel]}`}>{riskLevel}</span>
        </div>
        <div className={styles.metric}>
          <span className={styles.label}>Tone</span>
          <span className={styles.value}>{displayTone}</span>
        </div>
        <div className={styles.metric}>
          <span className={styles.label}>Clarity</span>
          <span className={`${styles.value} ${CLARITY_CLASS_MAP[clarity]}`}>{clarityDisplay}</span>
        </div>
      </div>
    </div>
  );
}
