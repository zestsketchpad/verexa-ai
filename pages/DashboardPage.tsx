import { motion } from 'motion/react';
import { Mail, Shield, Gavel, Zap, ArrowRight, Paperclip, CheckCircle, Brain, BarChart3, Wand2 } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { cn } from '../lib/utils';

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      
      <main className="lg:ml-64 p-4 md:p-8 flex-grow flex flex-col pt-24 lg:pt-8">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 md:mb-12 gap-6">
          <div className="space-y-1">
            <h2 className="text-3xl md:text-4xl font-headline font-extrabold tracking-tight text-white">Orchestration Hub</h2>
            <p className="text-on-surface-variant font-medium text-sm md:text-base">Monitoring 14 autonomous agents across enterprise workflows.</p>
          </div>
          <div className="flex flex-wrap gap-3 md:gap-4 w-full md:w-auto">
            {[
              { label: 'Actions Executed', value: '1,284', color: 'text-primary' },
              { label: 'Risk Prevented', value: '12%', sub: 'YoY', color: 'text-tertiary' },
              { label: 'Active Policies', value: '38', color: 'text-secondary' },
            ].map((stat, i) => (
              <div key={i} className="glass-card flex-1 md:flex-none px-4 md:px-6 py-3 md:py-4 rounded-xl border border-white/5 flex flex-col min-w-[120px]">
                <span className="text-[9px] md:text-[10px] uppercase tracking-widest text-slate-500 font-label mb-1">{stat.label}</span>
                <span className={cn("text-xl md:text-2xl font-headline font-bold", stat.color)}>
                  {stat.value}
                  {stat.sub && <span className="text-[10px] md:text-xs ml-1 font-normal opacity-60">{stat.sub}</span>}
                </span>
              </div>
            ))}
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 flex-grow">
          <div className="lg:col-span-8 flex flex-col space-y-6">
            {/* Action Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-xl border border-white/5 overflow-hidden flex flex-col shadow-2xl"
            >
              <div className="px-4 md:px-6 py-3 md:py-4 border-b border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-surface-container-low/50 gap-2">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-primary" />
                  <span className="font-headline font-semibold text-white text-sm md:text-base">Email Draft: Client Update</span>
                </div>
                <div className="px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-[9px] md:text-[10px] font-bold tracking-tighter uppercase flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-green-400"></span>
                  Risk Badge: 22% - Safe
                </div>
              </div>
              <div className="p-4 md:p-8 space-y-6">
                <div className="space-y-4">
                  <div className="flex border-b border-white/5 pb-3">
                    <span className="w-16 md:w-20 text-slate-500 text-xs md:text-sm font-label">To</span>
                    <span className="text-xs md:text-sm text-on-surface truncate">client@example.com</span>
                  </div>
                  <div className="flex border-b border-white/5 pb-3">
                    <span className="w-16 md:w-20 text-slate-500 text-xs md:text-sm font-label">Subject</span>
                    <span className="text-xs md:text-sm font-semibold text-white truncate">Project Delay Update</span>
                  </div>
                  <div className="pt-2">
                    <p className="text-on-surface-variant leading-relaxed text-xs md:text-sm">
                      I am writing to inform you that we have encountered a minor technical hurdle in the deployment phase of the integration module. While the core features are robust, we want to ensure total stability before hand-off. This will result in a 4-day shift in the final delivery date. We are accelerating the testing phase to recover time where possible.
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap justify-end gap-2 md:gap-3 pt-4">
                  <button className="flex-1 sm:flex-none px-4 md:px-5 py-2 md:py-2.5 rounded-full border border-outline-variant/30 text-on-surface text-xs md:text-sm font-medium hover:bg-white/5 transition-all">
                    Reject
                  </button>
                  <button className="flex-1 sm:flex-none px-4 md:px-5 py-2 md:py-2.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs md:text-sm font-semibold hover:bg-primary/20 transition-all flex items-center justify-center gap-2">
                    <Wand2 className="w-4 h-4" />
                    Fix
                  </button>
                  <button className="w-full sm:w-auto px-6 md:px-8 py-2 md:py-2.5 rounded-full bg-primary text-on-primary font-bold text-xs md:text-sm hover:opacity-90 transition-all">
                    Approve & Send
                  </button>
                </div>
              </div>
            </motion.div>

            <div className="hidden lg:block flex-grow"></div>

            {/* Chat Bar */}
            <div className="relative mt-auto group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-xl blur opacity-30 group-focus-within:opacity-100 transition duration-1000"></div>
              <div className="relative glass-card rounded-xl border border-white/10 flex items-center p-1.5 md:p-2 pr-3 md:pr-4 shadow-2xl">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center bg-surface-container-highest ml-1 md:ml-2">
                  <Zap className="w-4 h-4 md:w-5 md:h-5 text-primary fill-current" />
                </div>
                <input 
                  className="flex-grow bg-transparent border-none focus:ring-0 text-white placeholder:text-slate-600 font-medium px-3 md:px-6 py-3 md:py-4 text-sm md:text-base" 
                  placeholder="Type an action..." 
                  type="text"
                />
                <div className="flex items-center gap-3 md:gap-4">
                  <Paperclip className="w-4 h-4 md:w-5 md:h-5 text-slate-500 cursor-pointer hover:text-white transition-colors" />
                  <button className="bg-primary text-on-primary w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center hover:scale-105 transition-transform">
                    <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-6">
            {/* Intelligence Profile */}
            <section className="glass-card rounded-xl border border-white/5 p-5 md:p-6 flex flex-col">
              <div className="flex items-center justify-between mb-6 md:mb-8">
                <h3 className="font-headline font-bold text-white text-sm md:text-base">Intelligence Profile</h3>
                <BarChart3 className="w-5 h-5 text-secondary" />
              </div>
              <div className="space-y-5 md:space-y-6">
                {[
                  { label: 'Tone', value: 10, color: 'bg-primary' },
                  { label: 'Clarity', value: 5, color: 'bg-tertiary' },
                  { label: 'Professionalism', value: 7, color: 'bg-secondary' },
                ].map((item, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between text-[10px] font-label uppercase tracking-widest text-slate-500">
                      <span>{item.label}</span>
                      <span className="text-white">{item.value} / 10</span>
                    </div>
                    <div className="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
                      <div className={cn("h-full", item.color)} style={{ width: `${item.value * 10}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Sentiment Simulation */}
            <section className="glass-card rounded-xl border border-white/5 p-5 md:p-6 space-y-3 md:space-y-4">
              <h3 className="text-[10px] font-label uppercase tracking-widest text-slate-500">Sentiment Simulation</h3>
              <div className="flex gap-3 md:gap-4 items-start">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0">
                  <Brain className="w-4 h-4 md:w-5 md:h-5 text-secondary" />
                </div>
                <p className="text-xs md:text-sm text-on-surface-variant italic leading-relaxed">
                  "Client would likely feel informed but concerned regarding the technical hurdle. The shift is small enough to maintain trust, provided clarity is improved."
                </p>
              </div>
            </section>

            {/* Active Guardrails */}
            <section className="glass-card rounded-xl border border-white/5 p-5 md:p-6 flex-grow flex flex-col">
              <h3 className="font-headline font-bold text-white mb-4 md:mb-6 text-sm md:text-base">Active Guardrails</h3>
              <div className="space-y-3 md:space-y-4">
                {[
                  { name: 'Data Privacy Filter (v2.1)', active: true },
                  { name: 'Compliance Protocol Alpha', active: true },
                  { name: 'Anti-Hallucination Engine', active: true },
                  { name: 'Custom Brand Voice (Pending)', active: false },
                ].map((item, i) => (
                  <div key={i} className={cn(
                    "flex items-center gap-3 p-2.5 md:p-3 rounded-lg bg-surface-container-lowest/40 border border-white/5",
                    !item.active && "opacity-50"
                  )}>
                    <CheckCircle className={cn("w-3.5 h-3.5 md:w-4 md:h-4", item.active ? "text-primary" : "text-slate-600")} />
                    <span className={cn("text-xs md:text-sm", item.active ? "text-on-surface" : "text-slate-400")}>{item.name}</span>
                  </div>
                ))}
              </div>
              <button className="mt-6 lg:mt-auto pt-4 md:pt-6 text-xs md:text-sm font-semibold text-primary hover:text-primary-container transition-colors flex items-center gap-2">
                View All Policies
                <ArrowRight className="w-4 h-4" />
              </button>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
