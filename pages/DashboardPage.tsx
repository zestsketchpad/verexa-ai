import { useMemo } from 'react';
import { BarChart3, CheckCircle2, ShieldAlert, Activity } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { useAppState } from '../state/AppStateContext';

function getLastSevenDaysBuckets() {
  const days: string[] = [];
  const now = new Date();
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

export default function DashboardPage() {
  const { actions } = useAppState();

  const stats = useMemo(() => {
    const total = actions.length;
    const executed = actions.filter((item) => item.status === 'Executed').length;
    const blocked = actions.filter((item) => item.decision === 'BLOCK').length;
    return { total, executed, blocked };
  }, [actions]);

  const activityByDay = useMemo(() => {
    const buckets = getLastSevenDaysBuckets();
    const counts = new Map<string, number>(buckets.map((key) => [key, 0]));

    actions.forEach((item) => {
      const key = item.createdAt.slice(0, 10);
      if (counts.has(key)) {
        counts.set(key, (counts.get(key) || 0) + 1);
      }
    });

    const max = Math.max(1, ...Array.from(counts.values()));

    return buckets.map((key) => ({
      day: key.slice(5),
      count: counts.get(key) || 0,
      height: `${Math.max(8, Math.round(((counts.get(key) || 0) / max) * 100))}%`,
    }));
  }, [actions]);

  const recent = actions.slice(0, 8);

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />

      <main className="lg:ml-64 p-4 md:p-8 flex-grow pt-24 lg:pt-8">
        <header className="mb-8">
          <h2 className="text-3xl md:text-4xl font-headline font-extrabold tracking-tight text-white">
            Dashboard
          </h2>
          <p className="text-on-surface-variant mt-2 text-sm md:text-base">
            Read-only overview of system activity.
          </p>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="glass-card rounded-xl border border-white/10 p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase tracking-widest text-slate-500">Total</span>
              <BarChart3 className="w-4 h-4 text-primary" />
            </div>
            <p className="text-3xl font-headline font-bold text-white">{stats.total}</p>
          </div>
          <div className="glass-card rounded-xl border border-white/10 p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase tracking-widest text-slate-500">Executed</span>
              <CheckCircle2 className="w-4 h-4 text-green-400" />
            </div>
            <p className="text-3xl font-headline font-bold text-white">{stats.executed}</p>
          </div>
          <div className="glass-card rounded-xl border border-white/10 p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase tracking-widest text-slate-500">Blocked</span>
              <ShieldAlert className="w-4 h-4 text-tertiary" />
            </div>
            <p className="text-3xl font-headline font-bold text-white">{stats.blocked}</p>
          </div>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="glass-card rounded-xl border border-white/10 p-5">
            <h3 className="text-white font-headline font-bold mb-4">Actions Over Time</h3>
            <div className="h-48 grid grid-cols-7 gap-2 items-end">
              {activityByDay.map((item) => (
                <div key={item.day} className="flex flex-col items-center gap-2 h-full">
                  <div className="w-full h-full bg-surface-container-low rounded-lg relative overflow-hidden border border-white/5">
                    <div className="absolute bottom-0 left-0 right-0 bg-primary/70" style={{ height: item.height }} />
                  </div>
                  <span className="text-[10px] text-slate-500">{item.day}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card rounded-xl border border-white/10 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-4 h-4 text-primary" />
              <h3 className="text-white font-headline font-bold">Recent Activity</h3>
            </div>

            {recent.length === 0 ? (
              <p className="text-on-surface-variant text-sm">No activity yet.</p>
            ) : (
              <div className="space-y-3 max-h-56 overflow-auto pr-1">
                {recent.map((item) => (
                  <div key={`${item.id}-${item.createdAt}`} className="rounded-lg border border-white/5 bg-surface-container-low/40 p-3">
                    <p className="text-sm text-white truncate">{item.input}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-slate-400 uppercase tracking-wider">
                      <span>{item.type}</span>
                      <span>Risk {item.risk_score}</span>
                      <span>{item.decision}</span>
                      <span>{item.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
