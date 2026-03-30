import Sidebar from '../components/Sidebar';
import { useAppState } from '../state/AppStateContext';

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-4 rounded-lg border border-white/10 bg-surface-container-low/40 p-3">
      <span className="text-sm text-on-surface">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`h-6 w-11 rounded-full transition-colors ${checked ? 'bg-primary' : 'bg-slate-700'}`}
      >
        <span
          className={`block h-5 w-5 rounded-full bg-white transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`}
        />
      </button>
    </label>
  );
}

export default function SettingsPage() {
  const { settings, setSettings } = useAppState();

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />

      <main className="lg:ml-64 p-4 md:p-8 flex-grow pt-24 lg:pt-8">
        <header className="mb-8">
          <h2 className="text-3xl md:text-4xl font-headline font-extrabold tracking-tight text-white">
            Settings
          </h2>
          <p className="text-on-surface-variant mt-2 text-sm md:text-base">
            Configure behavior of the action system.
          </p>
        </header>

        <div className="space-y-6 max-w-4xl">
          <section className="glass-card rounded-xl border border-white/10 p-5">
            <h3 className="text-white font-headline font-bold mb-4">API Settings</h3>
            <div className="space-y-3">
              <input
                type="password"
                value={settings.api.openAiApiKey}
                onChange={(event) =>
                  setSettings((prev) => ({
                    ...prev,
                    api: { ...prev.api, openAiApiKey: event.target.value },
                  }))
                }
                placeholder="OpenAI API Key"
                className="w-full rounded-lg border border-white/10 bg-surface-container-low/40 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500"
              />
              <Toggle
                label="Enable AI Analysis"
                checked={settings.api.enableAiAnalysis}
                onChange={(checked) =>
                  setSettings((prev) => ({
                    ...prev,
                    api: { ...prev.api, enableAiAnalysis: checked },
                  }))
                }
              />
            </div>
          </section>

          <section className="glass-card rounded-xl border border-white/10 p-5">
            <h3 className="text-white font-headline font-bold mb-4">Policy Settings</h3>
            <div className="space-y-3">
              <Toggle
                label="Professional tone enforcement"
                checked={settings.policy.professionalToneEnforcement}
                onChange={(checked) =>
                  setSettings((prev) => ({
                    ...prev,
                    policy: { ...prev.policy, professionalToneEnforcement: checked },
                  }))
                }
              />
              <Toggle
                label="Block high-risk actions"
                checked={settings.policy.blockHighRiskActions}
                onChange={(checked) =>
                  setSettings((prev) => ({
                    ...prev,
                    policy: { ...prev.policy, blockHighRiskActions: checked },
                  }))
                }
              />
              <Toggle
                label="Enable simulation"
                checked={settings.policy.enableSimulation}
                onChange={(checked) =>
                  setSettings((prev) => ({
                    ...prev,
                    policy: { ...prev.policy, enableSimulation: checked },
                  }))
                }
              />
            </div>
          </section>

          <section className="glass-card rounded-xl border border-white/10 p-5">
            <h3 className="text-white font-headline font-bold mb-4">Execution Settings</h3>
            <div className="space-y-3">
              <Toggle
                label="Enable email sending"
                checked={settings.execution.enableEmailSending}
                onChange={(checked) =>
                  setSettings((prev) => ({
                    ...prev,
                    execution: { ...prev.execution, enableEmailSending: checked },
                  }))
                }
              />
              <Toggle
                label="Enable auto-execution"
                checked={settings.execution.enableAutoExecution}
                onChange={(checked) =>
                  setSettings((prev) => ({
                    ...prev,
                    execution: { ...prev.execution, enableAutoExecution: checked },
                  }))
                }
              />
            </div>
          </section>

          <section className="glass-card rounded-xl border border-white/10 p-5">
            <h3 className="text-white font-headline font-bold mb-4">Integrations</h3>
            <div className="space-y-3">
              <div className="rounded-lg border border-white/10 bg-surface-container-low/40 p-3">
                <p className="text-sm text-on-surface">Gmail (Coming soon)</p>
              </div>
              <input
                type="text"
                value={settings.integrations.n8nWebhookUrl}
                onChange={(event) =>
                  setSettings((prev) => ({
                    ...prev,
                    integrations: { ...prev.integrations, n8nWebhookUrl: event.target.value },
                  }))
                }
                placeholder="https://zenn06.app.n8n.cloud/webhook/verexa-action"
                className="w-full rounded-lg border border-white/10 bg-surface-container-low/40 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500"
              />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
