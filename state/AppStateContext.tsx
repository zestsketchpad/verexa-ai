import {
  createContext,
  Dispatch,
  PropsWithChildren,
  SetStateAction,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { ActionHistoryItem, AgentConfig, AppSettings } from '../types';

const AGENTS_KEY = 'agentflow_agents_v1';
const ACTIONS_KEY = 'agentflow_actions_v1';
const SETTINGS_KEY = 'agentflow_settings_v1';
const LEGACY_N8N_WEBHOOK = 'https://xlr8-n8n.app.n8n.cloud/webhook/ai-action';
const DEFAULT_ACTION_API_URL = 'https://zenn06.app.n8n.cloud/webhook/verexa-action';

const defaultSettings: AppSettings = {
  api: {
    openAiApiKey: '',
    enableAiAnalysis: true,
  },
  policy: {
    professionalToneEnforcement: true,
    blockHighRiskActions: true,
    enableSimulation: true,
  },
  execution: {
    enableEmailSending: true,
    enableAutoExecution: false,
  },
  integrations: {
    n8nWebhookUrl: DEFAULT_ACTION_API_URL,
  },
};

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return fallback;
    }
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function normalizeSettings(raw: unknown): AppSettings {
  const candidate = (raw && typeof raw === 'object' ? raw : {}) as Partial<AppSettings>;
  const api: Partial<AppSettings['api']> = candidate.api ?? {};
  const policy: Partial<AppSettings['policy']> = candidate.policy ?? {};
  const execution: Partial<AppSettings['execution']> = candidate.execution ?? {};
  const integrations: Partial<AppSettings['integrations']> = candidate.integrations ?? {};

  const integrationUrlRaw =
    typeof integrations.n8nWebhookUrl === 'string' ? integrations.n8nWebhookUrl.trim() : '';
  const normalizedIntegrationUrl =
    integrationUrlRaw && integrationUrlRaw !== LEGACY_N8N_WEBHOOK
      ? integrationUrlRaw
      : defaultSettings.integrations.n8nWebhookUrl;

  return {
    api: {
      openAiApiKey: typeof api.openAiApiKey === 'string' ? api.openAiApiKey : defaultSettings.api.openAiApiKey,
      enableAiAnalysis:
        typeof api.enableAiAnalysis === 'boolean'
          ? api.enableAiAnalysis
          : defaultSettings.api.enableAiAnalysis,
    },
    policy: {
      professionalToneEnforcement:
        typeof policy.professionalToneEnforcement === 'boolean'
          ? policy.professionalToneEnforcement
          : defaultSettings.policy.professionalToneEnforcement,
      blockHighRiskActions:
        typeof policy.blockHighRiskActions === 'boolean'
          ? policy.blockHighRiskActions
          : defaultSettings.policy.blockHighRiskActions,
      enableSimulation:
        typeof policy.enableSimulation === 'boolean'
          ? policy.enableSimulation
          : defaultSettings.policy.enableSimulation,
    },
    execution: {
      enableEmailSending:
        typeof execution.enableEmailSending === 'boolean'
          ? execution.enableEmailSending
          : defaultSettings.execution.enableEmailSending,
      enableAutoExecution:
        typeof execution.enableAutoExecution === 'boolean'
          ? execution.enableAutoExecution
          : defaultSettings.execution.enableAutoExecution,
    },
    integrations: {
      n8nWebhookUrl: normalizedIntegrationUrl,
    },
  };
}

interface AppStateContextValue {
  agents: AgentConfig[];
  actions: ActionHistoryItem[];
  settings: AppSettings;
  addAgent: (agent: Omit<AgentConfig, 'id' | 'createdAt'>) => void;
  addAction: (action: ActionHistoryItem) => void;
  setSettings: Dispatch<SetStateAction<AppSettings>>;
}

const AppStateContext = createContext<AppStateContextValue | null>(null);

export function AppStateProvider({ children }: PropsWithChildren) {
  const [agents, setAgents] = useState<AgentConfig[]>(() => readStorage(AGENTS_KEY, []));
  const [actions, setActions] = useState<ActionHistoryItem[]>(() => readStorage(ACTIONS_KEY, []));
  const [settings, setSettings] = useState<AppSettings>(() => {
    const stored = readStorage<unknown>(SETTINGS_KEY, defaultSettings);
    return normalizeSettings(stored);
  });

  useEffect(() => {
    localStorage.setItem(AGENTS_KEY, JSON.stringify(agents));
  }, [agents]);

  useEffect(() => {
    localStorage.setItem(ACTIONS_KEY, JSON.stringify(actions));
  }, [actions]);

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  function addAgent(agent: Omit<AgentConfig, 'id' | 'createdAt'>) {
    const next: AgentConfig = {
      ...agent,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date().toISOString(),
    };
    setAgents((prev) => [next, ...prev]);
  }

  function addAction(action: ActionHistoryItem) {
    setActions((prev) => [action, ...prev].slice(0, 200));
  }

  const value = useMemo(
    () => ({
      agents,
      actions,
      settings,
      addAgent,
      addAction,
      setSettings,
    }),
    [agents, actions, settings],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used inside AppStateProvider');
  }
  return context;
}
