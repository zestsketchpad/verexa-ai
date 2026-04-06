import { type IntentMode } from "./ModeSelector";
import styles from "./EmptyState.module.css";

type EmptyStateProps = {
  mode: IntentMode;
  onExampleClick: (text: string) => void;
};

const EXAMPLES: Record<IntentMode, string[]> = {
  freelance: [
    "Hi, I can do this project for you. I have 5 years of experience with...",
    "I'll deliver this in 2 days. My rate is $50/hour and includes revisions.",
    "Let's discuss your requirements. Can you tell me more about the timeline?",
  ],
  email: [
    "Thank you for reaching out. I appreciate the opportunity, but I'm currently...",
    "I wanted to follow up on our conversation from last week regarding...",
    "I'm writing to confirm our meeting tomorrow at 2 PM. Looking forward to it!",
  ],
  strategy: [
    "A new approach: combine AI + human review to catch tone/clarity issues before sending. Could help teams 10x.",
    "Market gap: professionals spend 30% of time proofreading. A 60-second AI check could save 2 hours weekly.",
    "Feature idea: real-time tone feedback as users type, adapted per context (casual, formal, persuasive).",
  ],
};

export default function EmptyState({ mode, onExampleClick }: EmptyStateProps) {
  return (
    <div className={styles.empty}>
      <div className={styles.content}>
        <h2 className={styles.title}>Try with an example</h2>
        <p className={styles.subtitle}>Click any below or paste your own</p>

        <ul className={styles.examples}>
          {EXAMPLES[mode].map((example, idx) => (
            <li key={idx}>
              <button
                className={styles.exampleButton}
                onClick={() => onExampleClick(example)}
                type="button"
              >
                {example}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
