import { FormEvent, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Zap, FileText, Settings, Plus, Menu, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAppState } from '../state/AppStateContext';
import type { AgentToolLabel, AgentTypeLabel } from '../types';

const agentTools: AgentToolLabel[] = ['Risk Checker', 'Policy Guard', 'Simulation'];

export default function Sidebar() {
  const location = useLocation();
  const { agents, addAgent } = useAppState();
  const [isOpen, setIsOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [agentName, setAgentName] = useState('');
  const [agentType, setAgentType] = useState<AgentTypeLabel>('General AI');
  const [tools, setTools] = useState<AgentToolLabel[]>(['Risk Checker', 'Policy Guard']);

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'AI Actions', icon: Zap, path: '/actions' },
    { name: 'Settings', icon: Settings, path: '/settings' },
    { name: 'Logs', icon: FileText, path: '/logs' },
  ];

  const toggleSidebar = () => setIsOpen(!isOpen);

  function toggleTool(tool: AgentToolLabel) {
    setTools((prev) => (prev.includes(tool) ? prev.filter((item) => item !== tool) : [...prev, tool]));
  }

  function onCreateAgent(event: FormEvent) {
    event.preventDefault();
    const trimmed = agentName.trim();
    if (!trimmed) {
      return;
    }

    addAgent({
      name: trimmed,
      type: agentType,
      enabledTools: tools,
    });

    setIsCreateOpen(false);
    setAgentName('');
    setAgentType('General AI');
    setTools(['Risk Checker', 'Policy Guard']);
  }

  return (
    <>
      <button
        onClick={toggleSidebar}
        className="lg:hidden fixed top-6 left-6 z-[60] p-2 rounded-lg bg-surface-container-high border border-white/10 text-white shadow-lg"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[50]"
          onClick={() => setIsOpen(false)}
        />
      )}

      <nav
        className={cn(
          'h-screen w-64 fixed left-0 top-0 border-r border-white/5 bg-[#101419] flex flex-col py-6 px-4 z-[55] transition-transform duration-300 lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="mb-10 px-2 mt-12 lg:mt-0">
          <h1 className="text-lg font-headline font-bold text-white tracking-tighter">AgentFlow</h1>
          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-label">
            AI Action Control
          </p>
        </div>

        <div className="space-y-1 mb-6">
          {navItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className={cn(
                'flex items-center gap-3 py-3 px-4 rounded-lg font-body text-sm font-medium transition-all duration-200',
                location.pathname === item.path
                  ? 'bg-gradient-to-r from-primary/10 to-transparent text-primary border-r-2 border-primary'
                  : 'text-slate-500 hover:text-slate-200 hover:bg-white/5',
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </Link>
          ))}
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="mx-2 bg-gradient-to-r from-primary to-primary-container text-on-primary font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform"
        >
          <Plus className="w-4 h-4" />
          New Agent
        </button>

        <div className="mt-6 pt-4 border-t border-white/5">
          <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-2 px-2">Agents</p>
          {agents.length === 0 ? (
            <p className="text-xs text-slate-500 px-2">No agents yet.</p>
          ) : (
            <div className="space-y-2 px-2">
              {agents.slice(0, 5).map((agent) => (
                <div key={agent.id} className="rounded-md border border-white/5 bg-surface-container-low/30 p-2">
                  <p className="text-xs text-white truncate">{agent.name}</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider truncate">{agent.type}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </nav>

      {isCreateOpen && (
        <div className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={onCreateAgent}
            className="w-full max-w-md rounded-xl border border-white/10 bg-[#13171d] p-5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-white font-headline font-bold text-lg">Create Agent</h2>
              <button type="button" onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-xs uppercase tracking-widest text-slate-500">Agent Name</label>
              <input
                value={agentName}
                onChange={(event) => setAgentName(event.target.value)}
                placeholder="Agent name"
                className="w-full rounded-lg border border-white/10 bg-surface-container-low/40 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-600"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs uppercase tracking-widest text-slate-500">Agent Type</label>
              <select
                value={agentType}
                onChange={(event) => setAgentType(event.target.value as AgentTypeLabel)}
                className="w-full rounded-lg border border-white/10 bg-surface-container-low/40 px-3 py-2 text-sm text-white outline-none"
              >
                <option>Email Agent</option>
                <option>Code Agent</option>
                <option>General AI</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest text-slate-500">Enabled Tools</label>
              <div className="space-y-2">
                {agentTools.map((tool) => (
                  <label key={tool} className="flex items-center justify-between rounded-lg border border-white/10 bg-surface-container-low/40 px-3 py-2">
                    <span className="text-sm text-on-surface">{tool}</span>
                    <input
                      type="checkbox"
                      checked={tools.includes(tool)}
                      onChange={() => toggleTool(tool)}
                    />
                  </label>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-primary text-on-primary py-2.5 text-sm font-semibold"
            >
              Create Agent
            </button>
          </form>
        </div>
      )}
    </>
  );
}
