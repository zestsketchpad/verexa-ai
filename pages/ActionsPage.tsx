import { FormEvent, useMemo, useState } from 'react';
import { ArrowRight, Sparkles, Wand2 } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { handleAction, toHistoryItem } from '../lib/mockActionEngine';
import { postActionWebhook } from '../lib/webhook';
import type { DecisionLabel, MockActionResult } from '../types';
import { cn } from '../lib/utils';
import { useAppState } from '../state/AppStateContext';

function riskColor(score: number) {
  if (score < 30) {
    return 'text-green-400 border-green-400/20 bg-green-400/10';
  }
  if (score <= 70) {
    return 'text-tertiary border-tertiary/20 bg-tertiary/10';
  }
  return 'text-error border-error/20 bg-error/10';
}

function decisionFromRisk(score: number): DecisionLabel {
  if (score < 30) {
    return 'APPROVE';
  }
  if (score <= 70) {
    return 'MODIFY';
  }
  return 'BLOCK';
}

export default function ActionsPage() {
  const { addAction, settings } = useAppState();
  const [input, setInput] = useState('');
  const [action, setAction] = useState<MockActionResult | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const sendBlockedByRisk =
    Boolean(action) && settings.policy.blockHighRiskActions && action.risk_score > 70;
  const sendBlockedByEmail =
    Boolean(action) && action.type === 'email' && !settings.execution.enableEmailSending;
  const sendDisabled = !action || sendBlockedByRisk || sendBlockedByEmail;

  const sendDisabledReason = useMemo(() => {
    if (!action) {
      return '';
    }
    if (sendBlockedByRisk) {
      return 'Send disabled: block high-risk actions is ON and risk > 70.';
    }
    if (sendBlockedByEmail) {
      return 'Send disabled: email sending is OFF in settings.';
    }
    return '';
  }, [action, sendBlockedByRisk, sendBlockedByEmail]);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const value = input.trim();
    if (!value) {
      return;
    }

    setIsThinking(true);
    setMessage(null);

    setTimeout(() => {
      const next = handleAction(value, settings);
      setAction(next);
      addAction(toHistoryItem(next, 'Created'));
      setInput('');
      setIsThinking(false);

      void postActionWebhook({
        webhookUrl: settings.integrations.n8nWebhookUrl,
        event: 'chat_input',
        input: value,
        action: next,
      });

      if (
        settings.execution.enableAutoExecution &&
        next.decision === 'APPROVE' &&
        !(settings.policy.blockHighRiskActions && next.risk_score > 70) &&
        !(next.type === 'email' && !settings.execution.enableEmailSending)
      ) {
        console.log('executed');
        addAction(toHistoryItem(next, 'Executed'));
        setMessage('Auto-execution completed.');
      }
    }, 250);
  }

  function onFix() {
    if (!action) {
      return;
    }
    const reducedRisk = Math.max(0, action.risk_score - 15);
    const fixed: MockActionResult = {
      ...action,
      content: action.improved_version,
      risk_score: reducedRisk,
      decision: decisionFromRisk(reducedRisk),
    };
    setAction(fixed);
    addAction(toHistoryItem(fixed, 'Fixed'));
    setMessage('Action improved with safer wording.');
  }

  function onSend() {
    if (!action || sendDisabled) {
      return;
    }
    console.log('executed');
    addAction(toHistoryItem(action, 'Executed'));
    void postActionWebhook({
      webhookUrl: settings.integrations.n8nWebhookUrl,
      event: 'execute_action',
      input: action.input,
      action,
    });
    setMessage('Action executed.');
  }

  function onReject() {
    if (!action) {
      return;
    }
    addAction(toHistoryItem(action, 'Rejected'));
    void postActionWebhook({
      webhookUrl: settings.integrations.n8nWebhookUrl,
      event: 'reject_action',
      input: action.input,
      action,
    });
    setAction(null);
    setMessage('Action rejected and cleared.');
  }

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />

      <main className="lg:ml-64 p-4 md:p-8 flex-grow pt-24 lg:pt-8">
        <header className="mb-6">
          <h2 className="text-3xl md:text-4xl font-headline font-extrabold tracking-tight text-white">
            AI Actions
          </h2>
          <p className="text-on-surface-variant mt-2 text-sm md:text-base">
            {'User -> Input -> AI Action -> Decision -> Execute'}
          </p>
        </header>

        {message && (
          <div className="mb-4 rounded-lg border border-primary/20 bg-primary/10 px-4 py-2 text-xs text-primary">
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 min-h-[70vh]">
          <section className="xl:col-span-8 flex flex-col">
            <div className="glass-card rounded-xl border border-white/10 p-5 md:p-6 flex-1">
              {action ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="text-white font-headline font-bold text-lg">Action Result</h3>
                    <span
                      className={cn(
                        'text-[10px] font-bold px-3 py-1 rounded-full border uppercase tracking-widest',
                        riskColor(action.risk_score),
                      )}
                    >
                      {action.decision}
                    </span>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-surface-container-low/40 p-4">
                    <p className="text-on-surface-variant whitespace-pre-wrap text-sm leading-relaxed">
                      {action.content}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3 pt-2">
                    <button
                      onClick={onReject}
                      className="px-4 py-2 rounded-full border border-outline-variant/30 text-on-surface text-xs font-semibold hover:bg-white/5"
                    >
                      Reject
                    </button>
                    <button
                      onClick={onFix}
                      className="px-4 py-2 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-semibold hover:bg-primary/20 flex items-center gap-2"
                    >
                      <Wand2 className="w-3.5 h-3.5" />
                      Fix
                    </button>
                    <button
                      onClick={onSend}
                      disabled={sendDisabled}
                      className="px-4 py-2 rounded-full bg-primary text-on-primary text-xs font-bold hover:opacity-90 disabled:opacity-50"
                    >
                      Send
                    </button>
                  </div>
                  {sendDisabledReason && (
                    <p className="text-xs text-tertiary">{sendDisabledReason}</p>
                  )}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-on-surface-variant text-sm">
                    Enter an instruction to generate an action.
                  </p>
                </div>
              )}
            </div>

            <form onSubmit={onSubmit} className="mt-6">
              <div className="glass-card rounded-xl border border-white/10 p-2 flex items-center gap-3">
                <input
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  className="flex-1 bg-transparent px-4 py-3 text-white text-sm outline-none placeholder:text-slate-600"
                  placeholder='Try: "Send delay email to client"'
                />
                <button
                  type="submit"
                  disabled={isThinking}
                  className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center disabled:opacity-50"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
              {isThinking && <p className="text-xs text-slate-500 mt-2">Generating action...</p>}
            </form>
          </section>

          <aside className="xl:col-span-4 space-y-4">
            <div className="glass-card rounded-xl border border-white/10 p-5">
              <h3 className="text-white font-headline font-bold mb-3">Risk Score</h3>
              <p className="text-3xl font-bold text-white">{action ? action.risk_score : '--'}</p>
              <div className="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden mt-3">
                <div
                  className={cn(
                    'h-full',
                    (action?.risk_score ?? 0) < 30
                      ? 'bg-green-500'
                      : (action?.risk_score ?? 0) <= 70
                        ? 'bg-tertiary'
                        : 'bg-error',
                  )}
                  style={{ width: `${action?.risk_score ?? 0}%` }}
                />
              </div>
            </div>

            <div className="glass-card rounded-xl border border-white/10 p-5">
              <h3 className="text-white font-headline font-bold mb-3">Decision</h3>
              <p className="text-sm text-on-surface-variant">
                {action ? action.decision : 'No decision yet'}
              </p>
            </div>

            <div className="glass-card rounded-xl border border-white/10 p-5">
              <h3 className="text-white font-headline font-bold mb-3">Simulation</h3>
              {action ? (
                <div className="space-y-2 text-sm text-on-surface-variant">
                  <p>{action.simulation.client_reaction}</p>
                  <p className="text-xs text-slate-400 uppercase tracking-widest">
                    Trust: {action.simulation.trust_impact}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    Risk level: {action.simulation.risk_level}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-on-surface-variant">
                  Simulation appears after action generation.
                </p>
              )}
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
