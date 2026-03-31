import { useEffect, useMemo, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import Sidebar from '../components/Sidebar';
import { useAppState } from '../state/AppStateContext';

const FIXED_WEBHOOK = 'https://zenn06.app.n8n.cloud/webhook/verexa-action';
const STEPS = [
  ['VALIDATE', 'input check'],
  ['CLASSIFY', 'task type'],
  ['GENERATE', 'gpt-4o-mini'],
  ['VERIFY', 'gemini-2.0-flash'],
  ['SCORE', '+ improve'],
  ['RESPOND', 'verified output'],
] as const;
const STATUS = [
  'Validating your input...',
  'Classifying task type...',
  'GPT-4o-mini generating response...',
  'Gemini verifying and improving...',
  'Scoring and parsing...',
  'Sending verified response...',
] as const;

type ResultData = {
  taskType: string;
  originalResponse: string;
  verifiedResponse: string;
  verification: {
    score: number;
    grade: string;
    badge: string;
    verdict: string;
    confidence: number;
    issues: string[];
    fixes: string[];
  };
};

const box = 'border border-[#1a2030] bg-[#0d1014]';
const mono = { fontFamily: '"JetBrains Mono", monospace' };

function obj(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null;
}

function str(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

function num(value: unknown, fallback = 0) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function list(value: unknown) {
  return Array.isArray(value) ? value.map((item) => str(item).trim()).filter(Boolean) : [];
}

function text(value: unknown) {
  if (typeof value === 'string') return value;
  const record = obj(value);
  if (!record) return '';
  return str(record.response) || str(record.content) || str(record.text) || str(record.message);
}

function normalize(data: unknown): ResultData {
  const payload = obj(data) ?? {};
  const verification = obj(payload.verification) ?? obj(payload.result) ?? {};
  return {
    taskType: str(payload.taskType) || str(payload.task_type) || str(payload.type) || 'general',
    originalResponse: text(payload.original) || text(payload.original_response) || text(payload.generated) || '—',
    verifiedResponse: text(payload.verified_response) || text(payload.verified) || text(payload.final) || '—',
    verification: {
      score: num(verification.score),
      grade: str(verification.grade, '--'),
      badge: str(verification.badge, '--'),
      verdict: str(verification.verdict, 'No verdict returned.'),
      confidence: num(verification.confidence),
      issues: list(verification.issues_found),
      fixes: list(verification.improvements_made),
    },
  };
}

function scoreTone(score: number) {
  if (score >= 80) return 'border-green-500 text-green-500';
  if (score >= 65) return 'border-lime-400 text-lime-400';
  if (score >= 45) return 'border-amber-500 text-amber-500';
  return 'border-red-500 text-red-500';
}

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const { settings, setSettings } = useAppState();
  const [prompt, setPrompt] = useState('');
  const [running, setRunning] = useState(false);
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const [result, setResult] = useState<ResultData | null>(null);

  useEffect(() => {
    if (settings.integrations.n8nWebhookUrl !== FIXED_WEBHOOK) {
      setSettings((prev) => ({ ...prev, integrations: { ...prev.integrations, n8nWebhookUrl: FIXED_WEBHOOK } }));
    }
  }, [setSettings, settings.integrations.n8nWebhookUrl]);

  useEffect(() => {
    if (!running) return;
    setStep(0);
    const timer = window.setInterval(() => setStep((value) => Math.min(value + 1, STEPS.length - 1)), 1800);
    return () => window.clearInterval(timer);
  }, [running]);

  const status = useMemo(() => (running ? STATUS[Math.min(step, STATUS.length - 1)] : ''), [running, step]);

  async function runVerexa() {
    const cleanPrompt = prompt.trim();
    setError('');
    setResult(null);
    if (!cleanPrompt) return setError('ERROR: Please enter a prompt.');
    setRunning(true);
    setSettings((prev) => ({ ...prev, integrations: { ...prev.integrations, n8nWebhookUrl: FIXED_WEBHOOK } }));
    try {
      const response = await fetch(FIXED_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: cleanPrompt, userId: user?.id || 'verexa-demo' }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      setResult(normalize(await response.json()));
      setStep(STEPS.length - 1);
    } catch (err) {
      setError(`PIPELINE ERROR: ${err instanceof Error ? err.message : 'Request failed.'}`);
      setStep(0);
    } finally {
      setRunning(false);
    }
  }

  if (!isLoaded) return <div className="min-h-screen bg-background flex items-center justify-center text-on-surface-variant">Loading user...</div>;

  return (
    <div className="min-h-screen bg-[#070809] flex text-[#e2e8f0]" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>
      <Sidebar />
      <main className="lg:ml-64 flex-grow px-4 pb-8 pt-24 lg:pt-8">
        <div className="mx-auto max-w-[980px]">
          <header className="mb-12 flex flex-wrap items-center gap-4 border-b border-[#1a2030] pb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-gradient-to-br from-[#3b82f6] to-[#8b5cf6] text-[18px] font-extrabold text-white">V</div>
            <div className="text-[22px] font-bold tracking-[-0.5px]"><span className="text-[#3b82f6]">Verexa</span> AI</div>
            <div className="rounded-full border border-[#3b82f633] bg-[#3b82f61a] px-3 py-1 text-[10px] text-[#3b82f6]" style={mono}>GPT-4o-mini to Gemini 2.0 Flash</div>
            <div className="ml-auto text-[11px] tracking-[1px] text-slate-500" style={mono}>MULTI-MODEL VERIFICATION ENGINE</div>
          </header>

          <div className="mb-8 flex overflow-x-auto py-4">
            {STEPS.map(([label, model], index) => {
              const active = running && index === step;
              const done = running ? index < step : Boolean(result);
              return (
                <div key={label} className="flex items-center">
                  <div className="flex min-w-fit flex-col items-center gap-1.5">
                    <div className={`rounded-[10px] border px-4 py-2.5 text-[11px] font-semibold tracking-[0.5px] ${active ? 'border-[#3b82f6] bg-[#3b82f614] shadow-[0_0_20px_rgba(59,130,246,0.15)]' : done ? 'border-green-500 bg-green-500/10' : 'border-[#1a2030] bg-[#0d1014]'}`}>{label}</div>
                    <div className="text-[9px] tracking-[1px] text-slate-500" style={mono}>{model}</div>
                  </div>
                  {index < STEPS.length - 1 && <div className="mb-4 h-[2px] w-8 bg-gradient-to-r from-[#1a2030] to-[#2a3a55]" />}
                </div>
              );
            })}
          </div>

          <div className="mb-6">
            <div className="mb-2 flex items-center gap-2 text-[12px] tracking-[1px] text-slate-500" style={mono}>
              <span>USER PROMPT</span><div className="h-px flex-1 bg-[#1a2030]" />
            </div>
            <textarea className={`${box} min-h-[120px] w-full rounded-xl px-5 py-4 text-[15px] leading-7 outline-none focus:border-[#3b82f6]`} value={prompt} onChange={(event) => setPrompt(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && event.ctrlKey) void runVerexa(); }} placeholder="e.g. Write a Kotlin function to fetch data from a REST API with error handling..." rows={5} />
          </div>

          <button className="mb-8 w-full rounded-xl bg-gradient-to-br from-[#3b82f6] to-[#8b5cf6] px-4 py-4 text-[15px] font-bold tracking-[0.5px] text-white transition hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-60 disabled:transform-none" onClick={() => void runVerexa()} disabled={running}>
            {running ? 'Running Verification Pipeline...' : 'Run Verexa Verification Pipeline'}
          </button>

          {running && <div className="mb-6 flex items-center gap-3 rounded-xl border border-[#3b82f633] bg-[#3b82f610] px-4 py-3 text-[12px] text-[#3b82f6]" style={mono}><div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#3b82f633] border-t-[#3b82f6]" />{status}</div>}
          {error && <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-[12px] text-red-300" style={mono}>{error}</div>}

          {result && (
            <>
              <div className="mb-3 flex items-center gap-2 text-[11px] tracking-[2px] text-slate-500" style={mono}><span>VERIFICATION RESULT</span><div className="h-px flex-1 bg-[#1a2030]" /></div>
              <div className={`${box} mb-5 rounded-2xl p-5 sm:p-7`}>
                <div className="flex flex-col gap-5 lg:grid lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-start">
                  <div className={`flex h-20 w-20 flex-col items-center justify-center rounded-full border-[3px] ${scoreTone(result.verification.score)}`}>
                    <div className="text-[26px] font-extrabold leading-none">{result.verification.score}</div>
                    <div className="mt-0.5 text-[9px] tracking-[1px]" style={mono}>SCORE</div>
                  </div>
                  <div className="min-w-0 space-y-2">
                    <div className="text-[13px] text-slate-500" style={mono}>Grade: <b className="text-[#e2e8f0]">{result.verification.grade}</b> | Badge: <b className="text-[#e2e8f0]">{result.verification.badge}</b></div>
                    <div className="text-[13px] leading-6 text-slate-400 break-words">{result.verification.verdict}</div>
                  </div>
                  <div className="flex flex-col items-start gap-2 lg:items-end lg:justify-self-end">
                    <div className="rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-[11px] uppercase tracking-[1px] text-violet-400" style={mono}>{result.taskType.toUpperCase()}</div>
                    <div className="text-[11px] text-slate-500" style={mono}>Confidence: {result.verification.confidence}%</div>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 lg:grid-cols-2">
                  <div className="rounded-xl border border-red-400/15 bg-red-500/5 p-3">
                    <div className="mb-2 text-[10px] tracking-[1px] text-red-300" style={mono}>ISSUES</div>
                    <div className="flex flex-wrap gap-2">{result.verification.issues.map((item) => <span key={item} className="max-w-full rounded-md border border-red-400/15 bg-red-500/10 px-2.5 py-1 text-[11px] text-red-300 whitespace-normal break-words" style={mono}>ISSUE {item}</span>)}</div>
                  </div>
                  <div className="rounded-xl border border-green-400/15 bg-green-500/5 p-3">
                    <div className="mb-2 text-[10px] tracking-[1px] text-green-300" style={mono}>IMPROVEMENTS</div>
                    <div className="flex flex-wrap gap-2">{result.verification.fixes.map((item) => <span key={item} className="max-w-full rounded-md border border-green-400/15 bg-green-500/10 px-2.5 py-1 text-[11px] text-green-300 whitespace-normal break-words" style={mono}>FIX {item}</span>)}</div>
                  </div>
                </div>
              </div>

              <div className="mb-3 flex items-center gap-2 text-[11px] tracking-[2px] text-slate-500" style={mono}><span>RESPONSE COMPARISON</span><div className="h-px flex-1 bg-[#1a2030]" /></div>
              <div className="mb-5 grid gap-4 md:grid-cols-2">
                {[
                  ['ORIGINAL', 'gpt-4o-mini', '#f59e0b', result.originalResponse, false],
                  ['VERIFIED AND IMPROVED', 'gemini-2.0-flash', '#3b82f6', result.verifiedResponse, true],
                ].map(([title, model, color, body, verified]) => (
                  <div key={title as string} className={`${box} ${verified ? 'border-[#3b82f64d]' : ''} overflow-hidden rounded-2xl`}>
                    <div className="flex items-center gap-2 border-b border-[#1a2030] bg-white/[0.02] px-4 py-3">
                      <div className="h-2 w-2 rounded-full" style={{ background: color as string }} />
                      <div className="text-[12px] font-bold tracking-[0.5px]">{title}</div>
                      <div className="ml-auto text-[10px] text-slate-500" style={mono}>{model}</div>
                    </div>
                    <div className="max-h-80 overflow-y-auto whitespace-pre-wrap px-4 py-4 text-[13px] leading-7 text-slate-300" style={mono}>{body}</div>
                  </div>
                ))}
              </div>
            </>
          )}

          <footer className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-[#1a2030] pt-8">
            <div className="text-[11px] text-slate-600" style={mono}>{`© ${new Date().getFullYear()} Verexa AI | Multi-Model Verification Engine`}</div>
            <div className="rounded-md border border-[#1a2030] bg-white/[0.03] px-3 py-1 text-[10px] text-slate-500" style={mono}>GPT-4o-mini to Gemini 2.0 Flash to Verified Output</div>
          </footer>
        </div>
      </main>
    </div>
  );
}
