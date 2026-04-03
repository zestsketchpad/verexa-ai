"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import InputBox from "@/components/InputBox";
import ResultPanel from "@/components/ResultPanel";
import ScoreCard from "@/components/ScoreCard";
import InsightsPanel from "@/components/InsightsPanel";
import { generateResponse } from "@/lib/api";
import styles from "./page.module.css";

const revealProps = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35 },
};

export default function Home() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState("auto");
  const [outputs, setOutputs] = useState<Record<string, string>>({});
  const [activeStyle, setActiveStyle] = useState("professional");
  const [rawInput, setRawInput] = useState("");
  const [normalizedInput, setNormalizedInput] = useState("");
  const [output, setOutput] = useState("");
  const [score, setScore] = useState(0);
  const [confidence, setConfidence] = useState(0);
  const [tone, setTone] = useState("");
  const [issues, setIssues] = useState<string[]>([]);
  const [improvements, setImprovements] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showDetails, setShowDetails] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async (text: string) => {
    const trimmed = text.trim();

    if (trimmed.length < 3) {
      setError("Please enter at least 3 characters.");
      setOutput("");
      setShowDetails(false);
      return;
    }

    setInput(trimmed);
    setLoading(true);
    setError("");
    setCopied(false);
    setShowDetails(false);

    try {
      const data = await generateResponse(trimmed, mode);
      const nextOutputs = {
        professional: data.outputs?.professional || data.verified_response || "",
        casual: data.outputs?.casual || data.verified_response || "",
        short: data.outputs?.short || data.verified_response || "",
        persuasive: data.outputs?.persuasive || data.verified_response || "",
      };

      setRawInput(data.raw_input || trimmed);
      setNormalizedInput(data.normalized_input || trimmed);
      setOutputs(nextOutputs);
      setActiveStyle("professional");
      setOutput(nextOutputs.professional || data.verified_response || "");
      setScore(typeof data.score === "number" ? data.score : 0);
      setConfidence(typeof data.confidence === "number" ? data.confidence : 0);
      setTone(data.tone || "neutral");
      setIssues(Array.isArray(data.issues_found) ? data.issues_found : []);
      setImprovements(Array.isArray(data.improvements_made) ? data.improvements_made : []);
    } catch (err) {
      console.error(err);
      setOutputs({});
      setRawInput("");
      setNormalizedInput("");
      setOutput("");
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleModeChange = async (nextMode: string) => {
    setMode(nextMode);

    if (input.trim() && output && !loading) {
      setLoading(true);
      setError("");
      setCopied(false);
      setShowDetails(false);

      try {
        const data = await generateResponse(input.trim(), nextMode);
        const nextOutputs = {
          professional: data.outputs?.professional || data.verified_response || "",
          casual: data.outputs?.casual || data.verified_response || "",
          short: data.outputs?.short || data.verified_response || "",
          persuasive: data.outputs?.persuasive || data.verified_response || "",
        };

        setRawInput(data.raw_input || input.trim());
        setNormalizedInput(data.normalized_input || input.trim());
        setOutputs(nextOutputs);
        setActiveStyle("professional");
        setOutput(nextOutputs.professional || data.verified_response || "");
        setScore(typeof data.score === "number" ? data.score : 0);
        setConfidence(typeof data.confidence === "number" ? data.confidence : 0);
        setTone(data.tone || "neutral");
        setIssues(Array.isArray(data.issues_found) ? data.issues_found : []);
        setImprovements(Array.isArray(data.improvements_made) ? data.improvements_made : []);
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "Something went wrong.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCopy = async () => {
    if (!output) {
      return;
    }

    await navigator.clipboard.writeText(output);
    setCopied(true);
  };

  const handleStyleChange = (style: string) => {
    setActiveStyle(style);
    setOutput(outputs[style] || "");
  };

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className={styles.hero}
        >
          <p className={styles.eyebrow}>Verexa AI</p>
          <h1 className={styles.title}>Make rough prompts feel intentional.</h1>
          <p className={styles.subtitle}>
            A focused workspace for turning vague input into something clearer,
            sharper, and more presentable without drowning the experience in noise.
          </p>
        </motion.section>

        <motion.div {...revealProps}>
          <InputBox
            input={input}
            mode={mode}
            onInputChange={setInput}
            onModeChange={handleModeChange}
            onGenerate={handleGenerate}
            loading={loading}
          />
        </motion.div>

        {loading ? (
          <motion.p {...revealProps} className={styles.status}>
            Transforming your input...
          </motion.p>
        ) : null}

        {error ? (
          <motion.div {...revealProps} className={styles.error}>
            {error}
          </motion.div>
        ) : null}

        {output ? (
          <div className={styles.stack}>
            <motion.div {...revealProps}>
              <ResultPanel
                rawInput={rawInput}
                normalizedInput={normalizedInput}
                output={output}
                outputs={outputs}
                activeStyle={activeStyle}
                onStyleChange={handleStyleChange}
              />
            </motion.div>

            <motion.div {...revealProps} className={styles.stack}>
              <ScoreCard score={score} confidence={confidence} tone={tone} />

              <div className={styles.actionRow}>
                <button
                  onClick={handleCopy}
                  className={styles.ghostButton}
                >
                  {copied ? "Copied" : "Copy"}
                </button>
                <button
                  onClick={() => setShowDetails((current) => !current)}
                  className={styles.toggleButton}
                >
                  {showDetails ? "Hide details" : "View details"}
                </button>
              </div>
            </motion.div>

            {showDetails ? (
              <motion.div {...revealProps}>
                <InsightsPanel issues={issues} improvements={improvements} />
              </motion.div>
            ) : null}
          </div>
        ) : null}
      </div>
    </main>
  );
}
