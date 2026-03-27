import { motion } from 'motion/react';
import { Search, Filter, Download, TrendingUp, History, Wand2, Shield, Lock, Mail, Gavel, Code, ChevronLeft, ChevronRight } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { MOCK_LOGS } from '../types';
import { cn } from '../lib/utils';

export default function LogsPage() {
  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      
      <main className="lg:ml-64 min-h-screen relative overflow-hidden flex-grow pt-24 lg:pt-0">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto px-4 md:px-10 py-8 md:py-12 relative z-10">
          <header className="mb-8 md:mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div>
              <h2 className="text-3xl md:text-4xl font-headline font-extrabold tracking-tight text-on-surface mb-2">Execution Logs</h2>
              <p className="text-on-surface-variant max-w-2xl leading-relaxed text-sm md:text-base">Detailed audit trail of orchestrated intelligence actions, policy enforcement, and decision logic across the global fleet.</p>
            </div>
            <div className="bg-surface-container-low px-4 py-2 rounded-xl border border-outline-variant/20 flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-green-400"></span>
              <span className="text-[10px] md:text-xs font-label font-semibold tracking-wider uppercase text-on-surface-variant">System Live</span>
            </div>
          </header>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-10">
            {[
              { label: 'Total Actions', value: '12,842', icon: TrendingUp, sub: '+14.2% from last cycle', color: 'text-primary' },
              { label: 'Risk Events', value: '42', icon: Shield, sub: '3 requiring review', color: 'text-tertiary' },
              { label: 'Auto-Correction', value: '99.4%', icon: Wand2, sub: 'Policy-driven autonomy active', color: 'text-secondary' },
            ].map((stat, i) => (
              <div key={i} className="glass-card p-5 md:p-6 rounded-xl border border-outline-variant/10 shadow-sm">
                <div className="flex items-center justify-between mb-3 md:mb-4">
                  <span className="text-[10px] md:text-xs font-label uppercase tracking-widest text-on-surface-variant font-bold">{stat.label}</span>
                  <stat.icon className={cn("w-4 h-4 md:w-5 md:h-5", stat.color)} />
                </div>
                <div className="text-2xl md:text-3xl font-headline font-bold text-white">{stat.value}</div>
                <div className={cn("mt-2 text-[10px] md:text-xs flex items-center gap-1", i === 0 ? "text-green-400" : i === 1 ? "text-tertiary" : "text-on-surface-variant")}>
                  {stat.sub}
                </div>
              </div>
            ))}
          </div>

          <div className="glass-card rounded-xl border border-outline-variant/10 shadow-2xl overflow-hidden">
            <div className="p-4 md:p-6 border-b border-outline-variant/10 flex flex-col md:flex-row items-start md:items-center justify-between bg-surface-container-low/50 gap-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full md:w-auto">
                <div className="relative flex-grow sm:flex-none">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant w-4 h-4" />
                  <input className="bg-surface-container-lowest border-none rounded-lg pl-10 pr-4 py-2 text-sm w-full sm:w-64 focus:ring-1 focus:ring-primary/40 placeholder:text-slate-600" placeholder="Search prompts..." type="text"/>
                </div>
                <button className="flex items-center justify-center gap-2 px-4 py-2 bg-surface-container-high rounded-lg text-xs font-semibold text-on-surface-variant hover:text-white transition-colors">
                  <Filter className="w-3 h-3" />
                  Filter
                </button>
              </div>
              <button className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-primary hover:bg-primary/10 rounded-lg transition-all">
                <Download className="w-3 h-3" />
                Export CSV
              </button>
            </div>
            
            <div className="overflow-x-auto scrollbar-hide">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-surface-container-low/30">
                    {['Timestamp', 'Input Prompt', 'Action Type', 'Risk Score', 'Decision', 'Override', 'Status'].map((h) => (
                      <th key={h} className="px-6 py-4 text-[10px] font-label font-bold uppercase tracking-widest text-slate-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/5">
                  {MOCK_LOGS.map((log) => (
                    <tr key={log.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-6 py-5 whitespace-nowrap">
                        <span className="text-xs font-medium text-slate-400">{log.timestamp}</span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="max-w-[200px] md:max-w-xs truncate text-sm font-medium text-on-surface group-hover:text-primary transition-colors cursor-help">
                          {log.inputPrompt}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className={cn(
                          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border",
                          log.actionType === 'CODE' ? "bg-blue-500/10 text-primary border-primary/20" : "bg-secondary/10 text-secondary border-secondary/20"
                        )}>
                          {log.actionType === 'CODE' ? <Code className="w-3 h-3" /> : <Mail className="w-3 h-3" />}
                          {log.actionType}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-12 md:w-16 h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                            <div className={cn(
                              "h-full",
                              log.riskScore < 0.3 ? "bg-green-500" : log.riskScore < 0.6 ? "bg-tertiary" : "bg-error"
                            )} style={{ width: `${log.riskScore * 100}%` }}></div>
                          </div>
                          <span className={cn(
                            "text-xs font-mono font-bold",
                            log.riskScore < 0.3 ? "text-green-500" : log.riskScore < 0.6 ? "text-tertiary" : "text-error"
                          )}>{log.riskScore.toFixed(2)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className={cn(
                          "text-sm font-semibold",
                          log.decision === 'Approve' ? "text-green-400" : log.decision === 'Block' ? "text-error" : "text-tertiary"
                        )}>{log.decision}</span>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className={cn("text-xs", log.override ? "text-primary font-bold" : "text-slate-500")}>
                          {log.override ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-2 text-xs font-medium text-on-surface">
                          <span className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            log.status === 'Executed' ? "bg-green-500" : log.status === 'Prevented' ? "bg-error" : "bg-primary animate-pulse"
                          )}></span>
                          {log.status}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="p-4 md:p-6 bg-surface-container-low/50 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-xs text-on-surface-variant">Showing 1 to 4 of 1,204 executions</span>
              <div className="flex gap-2">
                <button className="p-2 rounded-lg bg-surface-container-high hover:bg-surface-container-highest transition-colors disabled:opacity-50" disabled>
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button className="p-2 rounded-lg bg-surface-container-high hover:bg-surface-container-highest transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="mt-8 md:mt-12 grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
            <div className="space-y-4">
              <h3 className="font-headline font-bold text-xl text-white">Active Guardian Policies</h3>
              <div className="space-y-3">
                {[
                  { name: 'PII redaction filter', sub: 'Active since Jan 2024', icon: Shield, color: 'text-primary' },
                  { name: 'Financial Exfiltration Block', sub: 'Enterprise Standard', icon: Lock, color: 'text-secondary' },
                ].map((p, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-surface-container-low rounded-xl border border-outline-variant/10">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-8 h-8 rounded-full flex items-center justify-center bg-opacity-10", p.color.replace('text-', 'bg-'))}>
                        <p.icon className={cn("w-4 h-4", p.color)} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-on-surface">{p.name}</p>
                        <p className="text-[10px] text-slate-500 uppercase tracking-tight">{p.sub}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-green-400 bg-green-400/10 px-2 py-0.5 rounded">ENFORCING</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="glass-card p-6 md:p-8 rounded-xl border border-outline-variant/10 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-tr from-primary to-secondary rounded-full flex items-center justify-center mb-4 md:mb-6 shadow-xl shadow-primary/20">
                <Shield className="w-6 h-6 md:w-8 md:h-8 text-white fill-current" />
              </div>
              <h4 className="text-lg font-headline font-bold text-white mb-2">High Integrity Intelligence</h4>
              <p className="text-sm text-on-surface-variant max-w-xs mb-6">Your agent fleet is currently operating within the 0.05% risk threshold defined in global settings.</p>
              <button className="text-xs font-bold text-primary border border-primary/20 bg-primary/5 px-6 py-2 rounded-full hover:bg-primary/20 transition-all">Review Parameters</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
