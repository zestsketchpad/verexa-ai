import { FormEvent, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  Mail,
  ArrowRight,
  Wand2,
  Sparkles,
  ShieldAlert,
  CheckCircle2,
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { cn } from '../lib/utils';
import { useAppState } from '../state/AppStateContext';
import { handleAction, toHistoryItem } from '../lib/actionEngine';
import { postActionWebhook } from '../lib/webhook';
import type { ActionResult } from '../types';

function riskBadgeClass(score: number) {
  if (score < 30) {
    return 'bg-green-500/10 border-green-500/20 text-green-400';
  }
  if (score <= 70) {
    return 'bg-tertiary/10 border-tertiary/20 text-tertiary';
  }
  return 'bg-error/10 border-error/20 text-error';
}

export default function DashboardPage() {
  const { actions, addAction, settings } = useAppState();
  const [input, setInput] = useState('');
  const [action, setAction] = useState<ActionResult | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const metrics = useMemo(() => {
    const total = actions.length;
    const executed = actions.filter((item) => item.status === 'Executed').length;
    const blocked = actions.filter((item) => item.decision === 'BLOCK').length;
    return { total, executed, blocked };
  }, [actions]);

  const sendBlockedByRisk =
    Boolean(action) && settings.policy.blockHighRiskActions && action.risk_score > 70;
  const sendBlockedByEmail =
    Boolean(action) && action.type === 'email' && !settings.execution.enableEmailSending;
  const sendDisabled = !action || sendBlockedByRisk || sendBlockedByEmail;

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const value = input.trim();
    if (!value) {
      return;
    }

    setIsThinking(true);
    setMessage(null);

    try {
      const next = await handleAction(value, settings.integrations.n8nWebhookUrl);
      setAction(next);
      addAction(toHistoryItem(next, 'Created'));
      setInput('');
      setMessage('Action created from webhook response.');
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'Webhook request failed.';
      setMessage(`Action generation failed: ${detail}`);
    } finally {
      setIsThinking(false);
    }
  }

  async function onSend() {
    if (!action || sendDisabled) {
      return;
    }

    addAction(toHistoryItem(action, 'Executed'));
    const webhook = await postActionWebhook({
      webhookUrl: settings.integrations.n8nWebhookUrl,
      event: 'execute_action',
      input: action.input,
      action,
    });

    if (webhook.ok) {
      setMessage('Executed and delivered to webhook.');
    } else {
      setMessage(`Executed locally. Webhook failed: ${webhook.error || 'unknown error'}`);
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

    await postActionWebhook({
      webhookUrl: settings.integrations.n8nWebhookUrl,
      event: 'fix_action',
      input: fixed.input,
      action: fixed,
    });

    setMessage('Action improved.');
  }

  async function onReject() {
    if (!action) {
      return;
    }

    addAction(toHistoryItem(action, 'Rejected'));
    await postActionWebhook({
      webhookUrl: settings.integrations.n8nWebhookUrl,
      event: 'reject_action',
      input: action.input,
      action,
    });
    setAction(null);
    setMessage('Action rejected.');
  }

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />

      <main className="lg:ml-64 p-4 md:p-8 flex-grow flex flex-col pt-24 lg:pt-8">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 md:mb-12 gap-6">
          <div className="space-y-1">
            <h2 className="text-3xl md:text-4xl font-headline font-extrabold tracking-tight text-white">
              Orchestration Hub
            </h2>
            <p className="text-on-surface-variant font-medium text-sm md:text-base">
              AI action chat + risk control + webhook execution.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 md:gap-4 w-full md:w-auto">
            {[
              { label: 'Total Actions', value: `${metrics.total}`, color: 'text-primary' },
              { label: 'Executed', value: `${metrics.executed}`, color: 'text-green-400' },
              { label: 'Blocked', value: `${metrics.blocked}`, color: 'text-tertiary' },
            ].map((stat, i) => (
              <div
                key={i}
                className="glass-card flex-1 md:flex-none px-4 md:px-6 py-3 md:py-4 rounded-xl border border-white/5 flex flex-col min-w-[120px]"
              >
                <span className="text-[9px] md:text-[10px] uppercase tracking-widest text-slate-500 font-label mb-1">
                  {stat.label}
                </span>
                <span className={cn('text-xl md:text-2xl font-headline font-bold', stat.color)}>
                  {stat.value}
                </span>
              </div>
            ))}
          </div>
        </header>

        {message && (
          <div className="mb-5 p-3 rounded-xl border border-primary/20 bg-primary/10 text-primary text-sm">
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 md:gap-8 flex-grow">
          <section className="xl:col-span-8 flex flex-col">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-xl border border-white/5 overflow-hidden flex flex-col shadow-2xl"
            >
              <div className="px-4 md:px-6 py-3 md:py-4 border-b border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-surface-container-low/50 gap-2">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-primary" />
                  <span className="font-headline font-semibold text-white text-sm md:text-base">
                    {action?.type ? `${action.type.toUpperCase()} Action` : 'Action Result'}
                  </span>
                </div>
                <div
                  className={cn(
                    'px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-widest',
                    riskBadgeClass(action?.risk_score ?? 0),
                  )}
                >
                  {action ? `Risk ${action.risk_score} - ${action.decision}` : 'No Action Yet'}
                </div>
              </div>
              <div className="p-4 md:p-6">
                {action ? (
                  <div className="space-y-4">
                    <p className="text-on-surface-variant whitespace-pre-wrap text-sm leading-relaxed">
                      {action.content}
                    </p>
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
                    {sendBlockedByRisk && (
                      <p className="text-xs text-tertiary">
                        Send disabled: high-risk action blocked by policy setting.
                      </p>
                    )}
                    {sendBlockedByEmail && (
                      <p className="text-xs text-tertiary">
                        Send disabled: email execution is disabled in settings.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="py-10 text-center text-on-surface-variant text-sm">
                    Start by typing a request in chat below.
                  </div>
                )}
              </div>
            </motion.div>

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
