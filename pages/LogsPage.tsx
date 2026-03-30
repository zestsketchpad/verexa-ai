import Sidebar from '../components/Sidebar';
import { useAppState } from '../state/AppStateContext';

export default function LogsPage() {
  const { actions } = useAppState();
  const items = actions;

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />

      <main className="lg:ml-64 p-4 md:p-8 flex-grow pt-24 lg:pt-8">
        <header className="mb-6">
          <h2 className="text-3xl md:text-4xl font-headline font-extrabold tracking-tight text-white">
            Logs
          </h2>
          <p className="text-on-surface-variant mt-2 text-sm md:text-base">
            Local action history.
          </p>
        </header>

        <section className="glass-card rounded-xl border border-white/10 p-4 md:p-5">
          {items.length === 0 ? (
            <p className="text-on-surface-variant text-sm">No logs available yet.</p>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div key={`${item.id}-${item.createdAt}`} className="rounded-lg border border-white/5 bg-surface-container-low/40 p-3">
                  <p className="text-sm text-white truncate">{item.input}</p>
                  {item.note && (
                    <p className="mt-1 text-xs text-tertiary">{item.note}</p>
                  )}
                  {item.issues && item.issues.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {item.issues.map((issue, index) => (
                        <span
                          key={`${item.id}-issue-${index}`}
                          className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-on-surface-variant"
                        >
                          {issue}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] uppercase tracking-wider text-slate-400">
                    <span>{item.type}</span>
                    <span>Risk {item.risk_score}</span>
                    <span>{item.decision}</span>
                    <span>{item.status}</span>
                    <span>{new Date(item.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
