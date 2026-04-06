"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import styles from "./ResultPanel.module.css";

type ResultPanelProps = {
  sourceText?: string;
  output: string;
  score?: number;
  confidence?: number;
  decision?: "SAFE" | "MODIFY" | "RISKY";
  insightLines?: string[];
  clientPerspective?: {
    reaction: "positive" | "neutral" | "negative";
    likelyReaction: string;
    riskFactors: string[];
    suggestedAdjustment: string;
  };
  qualityChecks?: Array<{
    ruleName: string;
    status: "pass" | "fail";
    reason?: string;
  }>;
  variations?: Array<{
    label: string;
    text: string;
  }>;
  issues?: string[];
  improvements?: string[];
  onSaveResponse?: (text: string) => void;
  onShareAnalysis?: () => void;
};

type OutcomeMetric = {
  direction: "up" | "down";
  label: string;
  value: string;
};

type CopyFormat = "plain" | "email" | "proposal";

function getDecisionMeta(decision: "SAFE" | "MODIFY" | "RISKY") {
  if (decision === "SAFE") {
    return {
      badgeClass: styles.decisionSafe,
      text: "This message is clear and ready to send.",
    };
  }

  if (decision === "RISKY") {
    return {
      badgeClass: styles.decisionRisky,
      text: "This message may create risk and needs major revision.",
    };
  }

  return {
    badgeClass: styles.decisionModify,
    text: "This message needs improvement before sending.",
  };
}

function classifyIssues(issues: string[]): { risky: string[]; weak: string[] } {
  const riskKeywords = ["risk", "risky", "legal", "compliance", "unsafe", "privacy", "security", "sensitive"];
  const risky: string[] = [];
  const weak: string[] = [];

  for (const issue of issues) {
    const normalized = issue.toLowerCase();
    if (riskKeywords.some((keyword) => normalized.includes(keyword))) {
      risky.push(issue);
    } else {
      weak.push(issue);
    }
  }

  return { risky, weak };
}

function countWords(text: string): number {
  const matches = String(text || "").trim().match(/\b\w+\b/g);
  return matches ? matches.length : 0;
}

function countPattern(text: string, pattern: RegExp): number {
  const matches = String(text || "").match(pattern);
  return matches ? matches.length : 0;
}

function buildImpactTags(sourceText: string, output: string, improvementsCount: number, riskyCount: number): string[] {
  const source = String(sourceText || "");
  const result = String(output || "");

  const sourceWords = countWords(source);
  const resultWords = countWords(result);
  const shorter = sourceWords > 0 ? Math.max(0, Math.round(((sourceWords - resultWords) / sourceWords) * 100)) : 0;

  const fillerPattern = /\b(i\s+am\s+confident|i\s+would\s+be\s+happy|i\s+would\s+love\s+to|i\s+believe\s+i\s+can)\b/gi;
  const fillerRemoved = Math.max(0, countPattern(source, fillerPattern) - countPattern(result, fillerPattern));

  return [
    shorter > 0 ? `${shorter}% leaner` : "Direct phrasing",
    fillerRemoved > 0 ? `Removed ${fillerRemoved} filler phrase${fillerRemoved > 1 ? "s" : ""}` : "Removed filler",
    riskyCount > 0 ? `Reduced ${riskyCount} risk flag${riskyCount > 1 ? "s" : ""}` : `${improvementsCount} targeted upgrades`,
  ];
}

function clampPercent(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function buildOutcomeMetrics(
  score: number,
  confidence: number,
  decision: "SAFE" | "MODIFY" | "RISKY",
  riskyCount: number,
  improvementsCount: number,
): OutcomeMetric[] {
  const safeScore = Math.max(0, Math.min(100, Math.round(score)));
  const safeConfidence = Math.max(0, Math.min(100, Math.round(confidence)));

  let replyLift = clampPercent(8 + safeScore * 0.26 + improvementsCount * 1.4, 8, 38);
  let rejectionDrop = clampPercent(10 + safeScore * 0.22 + riskyCount * 2.8, 10, 42);
  let clarityGain = clampPercent(7 + safeConfidence * 0.24 + improvementsCount * 1.1, 7, 36);

  if (decision === "RISKY") {
    replyLift = clampPercent(replyLift - 4, 6, 32);
    rejectionDrop = clampPercent(rejectionDrop + 5, 12, 45);
    clarityGain = clampPercent(clarityGain - 3, 6, 30);
  } else if (decision === "SAFE") {
    replyLift = clampPercent(replyLift + 3, 10, 42);
    rejectionDrop = clampPercent(rejectionDrop + 2, 12, 45);
    clarityGain = clampPercent(clarityGain + 2, 9, 40);
  }

  return [
    {
      direction: "up",
      label: "Reply Chances",
      value: `+${replyLift}%`,
    },
    {
      direction: "down",
      label: "Rejection Risk",
      value: `-${rejectionDrop}%`,
    },
    {
      direction: "up",
      label: "Clarity Score",
      value: `+${clarityGain}%`,
    },
  ];
}

function getReactionClass(reaction: "positive" | "neutral" | "negative") {
  if (reaction === "positive") {
    return styles.reactionPositive;
  }
  if (reaction === "negative") {
    return styles.reactionNegative;
  }
  return styles.reactionNeutral;
}

function normalizeSpacing(text: string): string {
  return String(text || "")
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function formatForCopy(format: CopyFormat, text: string): string {
  const normalized = normalizeSpacing(text);
  if (!normalized) {
    return "";
  }

  if (format === "plain") {
    return normalized;
  }

  const paragraphs = normalized
    .split(/\n{2,}/)
    .map((item) => item.trim())
    .filter(Boolean);
  const body = paragraphs.length > 0 ? paragraphs.join("\n\n") : normalized;

  if (format === "email") {
    return [
      "Subject: Quick Follow-Up",
      "",
      body,
      "",
      "Best regards,",
    ].join("\n");
  }

  return [
    "PROPOSAL",
    "",
    "Overview",
    body,
    "",
    "Next Step",
    "If this works for you, I can start immediately and share the first milestone timeline.",
  ].join("\n");
}

function toDirectiveInsight(line: string): string {
  const cleaned = String(line || "")
    .trim()
    .replace(/^[•\-]\s*/, "")
    .replace(/[.!?]+$/, "");

  if (!cleaned) {
    return "Improve message clarity and add a clear next step";
  }

  const lower = cleaned.toLowerCase();
  if (lower.startsWith("no clear next step")) {
    return "Add a clear next step for the client";
  }
  if (lower.includes("pricing") && lower.includes("early")) {
    return "Lead with value before mentioning pricing";
  }
  if (lower.startsWith("missing ")) {
    return `Add ${cleaned.slice(8)}`;
  }
  if (lower.startsWith("lacks ")) {
    return `Add ${cleaned.slice(6)}`;
  }
  if (lower.startsWith("weak ")) {
    return `Strengthen ${cleaned.slice(5)}`;
  }
  if (lower.startsWith("unclear ")) {
    return `Clarify ${cleaned.slice(8)}`;
  }
  if (lower.startsWith("add ") || lower.startsWith("lead ") || lower.startsWith("clarify ") || lower.startsWith("strengthen ")) {
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }

  return `Improve ${cleaned.charAt(0).toLowerCase()}${cleaned.slice(1)}`;
}

export default function ResultPanel({
  sourceText = "",
  output,
  score = 0,
  confidence = 0,
  decision = "MODIFY",
  insightLines = [],
  clientPerspective,
  qualityChecks = [],
  variations = [],
  issues = [],
  improvements = [],
  onSaveResponse,
  onShareAnalysis,
}: ResultPanelProps) {
  const [copied, setCopied] = useState(false);
  const [copyFormat, setCopyFormat] = useState<CopyFormat | null>(null);
  const [saved, setSaved] = useState(false);
  const [shared, setShared] = useState(false);
  const [activeVersionText, setActiveVersionText] = useState(output);
  const shouldShowFailSafe = score < 50 || decision === "RISKY";
  const { risky, weak } = useMemo(() => classifyIssues(issues), [issues]);
  const decisionMeta = getDecisionMeta(decision);
  useEffect(() => {
    setActiveVersionText(output);
    setCopyFormat(null);
    setSaved(false);
    setShared(false);
  }, [output]);
  const impactTags = useMemo(
    () => buildImpactTags(sourceText, output, improvements.length, risky.length),
    [sourceText, output, improvements.length, risky.length],
  );
  const outcomeMetrics = useMemo(
    () => buildOutcomeMetrics(score, confidence, decision, risky.length, improvements.length),
    [score, confidence, decision, risky.length, improvements.length],
  );
  const directiveInsights = useMemo(
    () => insightLines.slice(0, 3).map(toDirectiveInsight),
    [insightLines],
  );

  const handleCopy = async (format: CopyFormat) => {
    try {
      const formatted = formatForCopy(format, activeVersionText);
      await navigator.clipboard.writeText(formatted || activeVersionText);
      setCopied(true);
      setCopyFormat(format);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
      setCopyFormat(null);
    }
  };

  const handleSave = () => {
    if (!onSaveResponse) {
      return;
    }

    onSaveResponse(activeVersionText);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  };

  const handleShare = () => {
    if (!onShareAnalysis) {
      return;
    }

    onShareAnalysis();
    setShared(true);
    window.setTimeout(() => setShared(false), 2200);
  };

  return (
    <section className={styles.report}>
      {shouldShowFailSafe ? (
        <div className={styles.failSafeBanner} role="alert" aria-live="polite">
          This message may cause negative outcomes. Review carefully before sending.
        </div>
      ) : null}

      <div className={styles.decisionRow}>
        <span className={`${styles.decisionBadge} ${decisionMeta.badgeClass}`}>{decision}</span>
        <p className={styles.decisionText}>{decisionMeta.text}</p>
      </div>

      <motion.div
        className={`${styles.section} ${styles.primaryOutputSection}`}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24, ease: "easeOut" }}
      >
        <p className={styles.primaryMicroLabel}>✅ Ready to Send</p>
        <p className={styles.finalText}>{activeVersionText}</p>
        <div className={styles.actionBar}>
          <button
            type="button"
            className={`${styles.primaryActionButton} ${copied && copyFormat === "plain" ? styles.copyButtonSuccess : ""}`}
            onClick={() => void handleCopy("plain")}
            aria-live="polite"
          >
            {copied && copyFormat === "plain" ? "Copied Message" : "Copy Message"}
          </button>
          <button
            type="button"
            className={`${styles.secondaryActionButton} ${copied && copyFormat === "email" ? styles.copyButtonSuccess : ""}`}
            onClick={() => void handleCopy("email")}
            aria-live="polite"
          >
            {copied && copyFormat === "email" ? "Copied Email" : "Copy as Email"}
          </button>
          <button
            type="button"
            className={`${styles.secondaryActionButton} ${copied && copyFormat === "proposal" ? styles.copyButtonSuccess : ""}`}
            onClick={() => void handleCopy("proposal")}
            aria-live="polite"
          >
            {copied && copyFormat === "proposal" ? "Copied Proposal" : "Copy as Proposal"}
          </button>
          <button
            type="button"
            className={`${styles.secondaryActionButton} ${saved ? styles.saveButtonSuccess : ""}`}
            onClick={handleSave}
            aria-live="polite"
          >
            {saved ? "Saved" : "Save"}
          </button>
          <button
            type="button"
            className={`${styles.secondaryActionButton} ${shared ? styles.shareButtonSuccess : ""}`}
            onClick={handleShare}
            aria-live="polite"
          >
            {shared ? "Shared" : "Share"}
          </button>
        </div>
      </motion.div>

      <motion.div
        className={styles.improvementsLine}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, delay: 0.06, ease: "easeOut" }}
      >
        <span className={styles.improvementsLabel}>Improvements Applied:</span>
        <div className={styles.improvementsTags}>
          {impactTags.map((tag, index) => (
            <span key={`${tag}-${index}`} className={styles.improvementsTag}>
              {tag}
            </span>
          ))}
        </div>
      </motion.div>

      <motion.div
        className={styles.section}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, delay: 0.1, ease: "easeOut" }}
      >
        <p className={styles.insightsTitle}>Expected Outcome Improvement</p>
        <div className={styles.outcomeGrid}>
          {outcomeMetrics.map((metric) => (
            <div key={metric.label} className={styles.outcomeCard}>
              <span
                className={`${styles.outcomeArrow} ${
                  metric.direction === "up" ? styles.outcomeArrowUp : styles.outcomeArrowDown
                }`}
                aria-hidden="true"
              >
                {metric.direction === "up" ? "↑" : "↓"}
              </span>
              <div className={styles.outcomeTextWrap}>
                <p className={styles.outcomeLabel}>{metric.label}</p>
                <p className={styles.outcomeValue}>{metric.value}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {insightLines.length > 0 ? (
        <motion.div
          className={styles.section}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, delay: 0.14, ease: "easeOut" }}
        >
          <p className={styles.insightsTitle}>What Needs Fixing</p>
          <ul className={styles.fixList}>
            {directiveInsights.map((line, index) => (
              <li key={`${line}-${index}`} className={styles.fixItem}>{line}</li>
            ))}
          </ul>
        </motion.div>
      ) : null}

      {clientPerspective ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, delay: 0.18, ease: "easeOut" }}
        >
          <details className={`${styles.section} ${styles.collapsibleSection}`}>
            <summary className={styles.collapsibleSummary}>
              <span className={styles.insightsTitle}>Client Perspective</span>
              <span className={`${styles.reactionPill} ${getReactionClass(clientPerspective.reaction)}`}>
                {clientPerspective.reaction}
              </span>
            </summary>

            <div className={styles.collapsibleContent}>
              <div className={styles.perspectiveBlock}>
                <p className={styles.perspectiveLabel}>Likely Reaction</p>
                <p className={styles.perspectiveText}>
                  {clientPerspective.likelyReaction || "Recipient may need stronger value framing before committing."}
                </p>
              </div>

              <div className={styles.perspectiveBlock}>
                <p className={styles.perspectiveLabel}>Risk</p>
                <p className={styles.perspectiveText}>
                  {clientPerspective.riskFactors.length > 0
                    ? clientPerspective.riskFactors.join(" | ")
                    : "Low objection risk"}
                </p>
              </div>

              <div className={styles.perspectiveBlock}>
                <p className={styles.perspectiveLabel}>Suggestion</p>
                <p className={styles.perspectiveText}>
                  {clientPerspective.suggestedAdjustment || "Keep it concise and end with one clear CTA."}
                </p>
              </div>
            </div>
          </details>
        </motion.div>
      ) : null}

      {qualityChecks.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, delay: 0.22, ease: "easeOut" }}
        >
          <details className={`${styles.section} ${styles.collapsibleSection}`}>
            <summary className={styles.collapsibleSummary}>
              <span className={styles.insightsTitle}>What Passed / What Didn't</span>
            </summary>

            <div className={styles.collapsibleContent}>
              <ul className={styles.qualityList}>
                {qualityChecks.map((check, index) => (
                  <li key={`${check.ruleName}-${index}`} className={styles.qualityItem}>
                    <span
                      className={`${styles.qualityIcon} ${
                        check.status === "pass" ? styles.qualityPass : styles.qualityFail
                      }`}
                      aria-hidden="true"
                    >
                      {check.status === "pass" ? "✔" : "✖"}
                    </span>
                    <div className={styles.qualityTextWrap}>
                      <span className={styles.qualityRule}>{check.ruleName}</span>
                      {check.status === "fail" && check.reason ? (
                        <span className={styles.qualityReason}>{check.reason}</span>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </details>
        </motion.div>
      ) : null}

      {variations.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, delay: 0.26, ease: "easeOut" }}
        >
          <details className={`${styles.section} ${styles.collapsibleSection}`}>
            <summary className={styles.collapsibleSummary}>
              <span className={styles.insightsTitle}>See Improvements</span>
            </summary>

            <div className={styles.collapsibleContent}>
              <div className={styles.variationGrid}>
                {variations.map((item, index) => {
                  const selected = activeVersionText === item.text;
                  const fallbackLabels = ["Version 1 (Direct)", "Version 2 (Friendly)", "Version 3 (Premium)"];
                  const label = item.label || fallbackLabels[index] || `Version ${index + 1}`;
                  return (
                    <button
                      key={`${label}-${index}`}
                      type="button"
                      onClick={() => setActiveVersionText(item.text)}
                      className={`${styles.variationCard} ${selected ? styles.variationCardActive : ""}`}
                    >
                      <span className={styles.variationTitle}>{label}</span>
                      <span className={styles.variationSnippet}>{item.text}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </details>
        </motion.div>
      ) : null}

      {risky.length > 0 ? (
        <div className={styles.section}>
          <p className={`${styles.sectionTitle} ${styles.riskyTitle}`}>What Was Risky</p>
          <ul className={styles.list}>
            {risky.map((item, index) => (
              <li key={`${item}-${index}`}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {weak.length > 0 ? (
        <div className={styles.section}>
          <p className={`${styles.sectionTitle} ${styles.weakTitle}`}>What Was Weak</p>
          <ul className={styles.list}>
            {weak.map((item, index) => (
              <li key={`${item}-${index}`}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {improvements.length > 0 ? (
        <div className={styles.section}>
          <p className={`${styles.sectionTitle} ${styles.improvedTitle}`}>What Was Improved</p>
          <ul className={styles.list}>
            {improvements.map((item, index) => (
              <li key={`${item}-${index}`}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
