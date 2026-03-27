import { FormEvent, useMemo, useState } from 'react';
import { ArrowRight, Sparkles, Wand2, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
import Sidebar from '../components/Sidebar';
import { handleActionWithMeta, toFailureHistoryItem, toHistoryItem } from '../lib/actionEngine';
import { postActionWebhook } from '../lib/webhook';
import type { ActionResult } from '../types';
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

export default function ActionsPage() {
  const { addAction, settings } = useAppState();
  const { user } = useUser();
  const [input, setInput] = useState('');
  const [action, setAction] = useState<ActionResult | null>(null);
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

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const value = input.trim();
    if (!value) {
      return;
    }

    setIsThinking(true);
    setMessage(null);

    try {
      const next = await handleActionWithMeta(value, settings.integrations.n8nWebhookUrl, {
        userId: user?.id,
        email: user?.primaryEmailAddress?.emailAddress,
      });
      setAction(next);
      addAction(toHistoryItem(next, 'Created'));
      setInput('');

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
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'Webhook request failed.';
      addAction(toFailureHistoryItem(value, detail));
      setMessage(`Action generation failed: ${detail}`);
    } finally {
      setIsThinking(false);
    }
  }

  async function onFix() {
    if (!action) {
      return;
    }
    const fixed: ActionResult = {
      ...action,
      content: action.improved_version,
    };
    setAction(fixed);
    addAction(toHistoryItem(fixed, 'Fixed'));

    const webhook = await postActionWebhook({
      webhookUrl: settings.integrations.n8nWebhookUrl,
      event: 'fix_action',
      input: fixed.input,
      action: fixed,
    });

    if (webhook.ok) {
      setMessage('Action improved with safer wording.');
    } else {
      const detail = webhook.error || `Webhook returned ${webhook.status}`;
      addAction(toFailureHistoryItem(fixed.input, `Fix webhook failed: ${detail}`));
      setMessage(`Action improved locally. Webhook failed: ${detail}`);
    }
  }

  async function onSend() {
    if (!action || sendDisabled) {
      return;
    }
    console.log('executed');
    addAction(toHistoryItem(action, 'Executed'));
    const webhook = await postActionWebhook({
      webhookUrl: settings.integrations.n8nWebhookUrl,
      event: 'execute_action',
      input: action.input,
      action,
    });

    if (webhook.ok) {
      setMessage('Action executed.');
    } else {
      const detail = webhook.error || `Webhook returned ${webhook.status}`;
      addAction(toFailureHistoryItem(action.input, `Execution webhook failed: ${detail}`));
      setMessage(`Executed locally. Webhook failed: ${detail}`);
    }
  }

  async function onReject() {
    if (!action) {
      return;
    }
    addAction(toHistoryItem(action, 'Rejected'));
    const webhook = await postActionWebhook({
      webhookUrl: settings.integrations.n8nWebhookUrl,
      event: 'reject_action',
      input: action.input,
      action,
    });

    if (!webhook.ok) {
      const detail = webhook.error || `Webhook returned ${webhook.status}`;
      addAction(toFailureHistoryItem(action.input, `Reject webhook failed: ${detail}`));
    }

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
                  <div className="space-y-3">
                    <div className="rounded-lg border border-white/10 bg-surface-container-low/40 p-4">
                      <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">
                        Final
                      </p>
                      <p className="text-on-surface-variant whitespace-pre-wrap text-sm leading-relaxed">
                        {action.content_final || action.content}
                      </p>
                    </div>
                    {action.content_original && (
                      <div className="rounded-lg border border-white/10 bg-surface-container-low/25 p-4">
                        <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">
                          Original
                        </p>
                        <p className="text-on-surface-variant whitespace-pre-wrap text-sm leading-relaxed">
                          {action.content_original}
                        </p>
                      </div>
                    )}
                    {action.content_improved && (
                      <div className="rounded-lg border border-white/10 bg-surface-container-low/25 p-4">
                        <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">
                          Improved
                        </p>
                        <p className="text-on-surface-variant whitespace-pre-wrap text-sm leading-relaxed">
                          {action.content_improved}
                        </p>
                      </div>
                    )}
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
                  disabled={isThinking}
                  className="flex-1 bg-transparent px-4 py-3 text-white text-sm outline-none placeholder:text-slate-600"
                  placeholder='Try: "Send delay email to client"'
                />
                <button
                  type="submit"
                  disabled={isThinking || !input.trim()}
                  className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center disabled:opacity-50"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
              {isThinking && <p className="text-xs text-slate-500 mt-2">Analyzing...</p>}
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

            <div className="glass-card rounded-xl border border-white/10 p-5">
              <h3 className="text-white font-headline font-bold mb-3">Issues</h3>
              {action && action.issues.length > 0 ? (
                <ul className="space-y-2">
                  {action.issues.map((issue, idx) => (
                    <li key={idx} className="text-sm text-on-surface-variant flex items-start gap-2">
                      {action.decision === 'BLOCK' ? (
                        <ShieldAlert className="w-4 h-4 text-error mt-0.5" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-tertiary mt-0.5" />
                      )}
                      {issue}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-on-surface-variant">No issues yet.</p>
              )}
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
