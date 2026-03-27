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
    n8nWebhookUrl: '',
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
  const [settings, setSettings] = useState<AppSettings>(() =>
    readStorage(SETTINGS_KEY, defaultSettings),
  );

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
