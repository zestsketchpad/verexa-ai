import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { PlayCircle, CheckCircle, Sparkles, ShieldCheck, Gavel, Play, Zap, ArrowRight } from 'lucide-react';
import Navbar from '../components/Navbar';
import { cn } from '../lib/utils';

export default function LandingPage() {
  const navigate = useNavigate();

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 overflow-x-hidden">
        {/* Hero Section */}
        <section className="relative min-h-[80vh] md:min-h-[90vh] flex items-center justify-center px-4 md:px-6 overflow-hidden">
          <div className="absolute top-1/4 -left-20 w-64 md:w-96 h-64 md:h-96 bg-primary/20 rounded-full blur-[80px] md:blur-[120px]"></div>
          <div className="absolute bottom-1/4 -right-20 w-64 md:w-96 h-64 md:h-96 bg-secondary/10 rounded-full blur-[80px] md:blur-[120px]"></div>
          
          <div className="max-w-5xl mx-auto text-center relative z-10">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-3 md:px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-[10px] md:text-xs font-label uppercase tracking-widest mb-6 md:mb-8"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              Now with Autonomous Simulation
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="font-headline text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tighter mb-6 md:mb-8 bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent leading-[1.1]"
            >
              Control AI Before <br className="hidden sm:block"/> It Acts
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="font-body text-base md:text-xl text-on-surface-variant max-w-2xl mx-auto mb-10 md:mb-12 leading-relaxed"
            >
              Generate, analyze, simulate, and execute AI actions safely. The orchestration layer for high-stakes enterprise intelligence.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 md:gap-6 justify-center items-center"
            >
              <button
                onClick={() => navigate('/login')}
                className="w-full sm:w-auto px-8 md:px-10 py-4 md:py-5 bg-gradient-to-r from-primary to-primary-container text-on-primary font-bold rounded-xl text-base md:text-lg shadow-xl shadow-primary/10 hover:shadow-primary/20 transition-all"
              >
                Start Free Trial
              </button>
              <button
                onClick={() => scrollToSection('demo')}
                className="w-full sm:w-auto px-8 md:px-10 py-4 md:py-5 glass-card text-white font-bold rounded-xl text-base md:text-lg hover:bg-white/10 transition-all flex items-center justify-center gap-2 border border-white/5"
              >
                <PlayCircle className="w-5 h-5 md:w-6 md:h-6" />
                Watch Demo
              </button>
            </motion.div>
          </div>
        </section>

        {/* Visual Demo Section */}
        <section id="demo" className="py-16 md:py-24 px-4 md:px-6 relative">
          <div className="max-w-7xl mx-auto">
            <div className="relative rounded-xl overflow-hidden border border-white/5 shadow-2xl p-4 md:p-8 bg-surface-container-low">
              <div className="flex items-center justify-between mb-6 md:mb-8 border-b border-white/5 pb-4">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-error/40"></div>
                  <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-tertiary/40"></div>
                  <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-primary/40"></div>
                </div>
                <div className="text-[8px] md:text-xs font-label text-white/30 tracking-[0.2em] uppercase">Simulated Production Environment</div>
              </div>
              
              <div className="grid lg:grid-cols-12 gap-6 md:gap-8">
                <div className="lg:col-span-4 space-y-4 md:space-y-6">
                  <div className="glass-card p-5 md:p-6 rounded-xl border-l-4 border-primary">
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="font-headline font-bold text-white text-sm md:text-base">Action Card</h4>
                      <span className="px-2 py-1 rounded bg-primary/10 text-primary text-[8px] md:text-[10px] font-bold">ID: #4920</span>
                    </div>
                    <p className="text-xs md:text-sm text-on-surface-variant mb-4 md:mb-6">Modify customer subscription tier and apply 15% loyalty credit.</p>
                    <div className="space-y-2 md:space-y-3">
                      <div className="flex justify-between text-[10px] font-label uppercase tracking-wider text-white/50">
                        <span>Risk Score</span>
                        <span className="text-primary">12% Safe</span>
                      </div>
                      <div className="w-full h-1 md:h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="w-[12%] h-full bg-primary rounded-full shadow-[0_0_8px_#a2c9ff]"></div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="glass-card p-5 md:p-6 rounded-xl">
                    <h4 className="font-headline font-bold text-white mb-4 text-xs md:text-sm">Policy Guardrails</h4>
                    <div className="space-y-2 md:space-y-3">
                      {[
                        "Financial Limit: Under $500",
                        "User Auth: Level 4 Verified",
                        "Region: Global Permitted"
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-2 md:gap-3 text-[10px] md:text-xs text-on-surface-variant">
                          <CheckCircle className="w-3 h-3 md:w-4 md:h-4 text-primary" />
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="lg:col-span-8 flex flex-col gap-6">
                  <div className="flex-1 glass-card rounded-xl p-6 md:p-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4">
                      <div className="px-3 md:px-4 py-1.5 md:py-2 bg-primary/20 text-primary font-bold rounded-lg border border-primary/30 text-glow text-[10px] md:text-xs">
                        APPROVED
                      </div>
                    </div>
                    <h3 className="font-headline text-xl md:text-2xl font-bold text-white mb-4 md:mb-6">Client Response Preview</h3>
                    <div className="bg-surface-container-lowest p-4 md:p-6 rounded-lg font-mono text-[10px] md:text-sm text-primary-container space-y-1 md:space-y-2 border border-white/5 overflow-x-auto">
                      <p>{"{"}</p>
                      <p className="pl-4">"status": "success",</p>
                      <p className="pl-4">"message": "Subscription updated successfully",</p>
                      <p className="pl-4">"customer_id": "cust_88x29",</p>
                      <p className="pl-4">"applied_credit": 15.00,</p>
                      <p className="pl-4">"new_mrr": 249.00</p>
                      <p>{"}"}</p>
                    </div>
                    <div className="mt-6 md:mt-8 pt-6 md:pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex gap-6 md:gap-8">
                        <div className="flex flex-col">
                          <span className="text-[8px] md:text-[10px] uppercase text-white/40">Latency</span>
                          <span className="text-xs md:text-sm font-bold text-white">124ms</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[8px] md:text-[10px] uppercase text-white/40">Cost</span>
                          <span className="text-xs md:text-sm font-bold text-white">$0.002</span>
                        </div>
                      </div>
                      <button
                        onClick={() => navigate('/dashboard')}
                        className="w-full sm:w-auto bg-primary px-6 py-2 rounded-full text-on-primary font-bold text-xs md:text-sm"
                      >
                        Execute Live
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Bento Grid */}
        <section id="features" className="py-20 md:py-32 px-4 md:px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12 md:mb-20">
              <h2 className="font-headline text-3xl md:text-5xl font-bold text-white mb-4 md:mb-6 tracking-tight">Enterprise Orchestration</h2>
              <p className="text-on-surface-variant text-sm md:text-base max-w-2xl mx-auto">Five core engines designed to move AI from playground experiments to reliable production systems.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              <div className="md:col-span-2 glass-card p-6 md:p-10 rounded-xl relative group">
                <div className="absolute top-6 right-6 opacity-20 group-hover:opacity-100 transition-opacity">
                  <Zap className="w-8 h-8 md:w-10 md:h-10 text-primary" />
                </div>
                <h3 className="font-headline text-xl md:text-2xl font-bold text-white mb-4">AI Action Generation</h3>
                <p className="text-on-surface-variant text-sm md:text-base max-w-md">Our specialized models interpret natural language intent and convert it into structured, executable payloads with zero syntax errors.</p>
              </div>
              
              <div className="glass-card p-6 md:p-10 rounded-xl group">
                <ShieldCheck className="w-8 h-8 md:w-10 md:h-10 text-secondary mb-4 md:mb-6 block group-hover:scale-110 transition-transform" />
                <h3 className="font-headline text-lg md:text-xl font-bold text-white mb-3 md:mb-4">Risk Engine</h3>
                <p className="text-on-surface-variant text-xs md:text-sm leading-relaxed">Multi-factor probability analysis that flags outliers and potentially harmful commands before they leave the buffer.</p>
              </div>
              
              <div className="glass-card p-6 md:p-10 rounded-xl group">
                <Gavel className="w-8 h-8 md:w-10 md:h-10 text-tertiary mb-4 md:mb-6 block group-hover:scale-110 transition-transform" />
                <h3 className="font-headline text-lg md:text-xl font-bold text-white mb-3 md:mb-4">Policy Guardrails</h3>
                <p className="text-on-surface-variant text-xs md:text-sm leading-relaxed">Hard-coded business logic that AI cannot overwrite. Enforce budget limits, role-based access, and temporal constraints.</p>
              </div>
              
              <div className="md:col-span-2 glass-card p-6 md:p-10 rounded-xl relative group overflow-hidden">
                <div className="flex flex-col sm:flex-row gap-6 md:gap-8 items-center">
                  <div className="flex-1">
                    <h3 className="font-headline text-xl md:text-2xl font-bold text-white mb-3 md:mb-4">Simulation Engine</h3>
                    <p className="text-on-surface-variant text-sm md:text-base">Run actions in a non-destructive sandbox to predict downstream effects on your real-world data and user experience.</p>
                  </div>
                  <div className="flex-1 bg-surface-container-lowest rounded-xl p-4 border border-white/5 w-full">
                    <div className="space-y-2">
                      <div className="h-2 w-3/4 bg-white/5 rounded"></div>
                      <div className="h-2 w-1/2 bg-white/5 rounded"></div>
                      <div className="h-2 w-full bg-primary/20 rounded"></div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="md:col-span-3 glass-card p-6 md:p-12 rounded-xl flex flex-col lg:flex-row items-center gap-8 md:gap-10">
                <div className="lg:w-1/2">
                  <h3 className="font-headline text-2xl md:text-3xl font-bold text-white mb-4">Real-world Execution (n8n)</h3>
                  <p className="text-on-surface-variant text-sm md:text-base mb-6">Connect to 400+ apps via built-in n8n nodes. Once an action is approved, it flows directly into your production pipelines with full audit logging.</p>
                  <button
                    onClick={() => navigate('/actions')}
                    className="text-primary font-bold text-sm md:text-base flex items-center gap-2 hover:underline"
                  >
                    Explore Integrations
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="lg:w-1/2 grid grid-cols-2 sm:grid-cols-4 gap-4 w-full">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="aspect-square bg-white/5 rounded-xl flex items-center justify-center grayscale hover:grayscale-0 transition-all border border-white/5">
                      <img 
                        src={`https://picsum.photos/seed/logo${i}/64/64`} 
                        alt="Integration" 
                        className="w-6 h-6 md:w-8 md:h-8 opacity-50"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Intelligence Loop */}
        <section className="py-20 md:py-24 bg-surface-container-lowest/50">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <div className="text-center mb-12 md:mb-20">
              <h2 className="font-headline text-3xl md:text-4xl font-bold text-white">The Intelligence Loop</h2>
            </div>
            <div className="relative flex flex-col md:flex-row justify-between items-center gap-8 md:gap-4">
              <div className="hidden md:block absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent -translate-y-1/2 z-0"></div>
              {[
                { name: 'Input', sub: 'Capture Intent', icon: Zap },
                { name: 'AI', sub: 'Logic Gen', icon: Sparkles },
                { name: 'Risk', sub: 'Anomaly Detect', icon: ShieldCheck },
                { name: 'Rules', sub: 'Hard Guardrails', icon: Gavel },
                { name: 'Simulation', sub: 'Safe Preview', icon: Play },
                { name: 'Execute', sub: 'Production Out', icon: Zap, highlight: true },
              ].map((step, i) => (
                <div key={i} className="relative z-10 flex flex-col items-center group w-full md:w-auto">
                  <div className={cn(
                    "w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center mb-3 md:mb-4 transition-all duration-300",
                    step.highlight 
                      ? "bg-gradient-to-br from-primary to-primary-container shadow-[0_0_20px_rgba(162,201,255,0.4)]" 
                      : "bg-surface-container-high border border-white/10 group-hover:border-primary"
                  )}>
                    <step.icon className={cn("w-5 h-5 md:w-6 md:h-6", step.highlight ? "text-on-primary" : "text-white/50 group-hover:text-primary")} />
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-white text-xs md:text-sm">{step.name}</div>
                    <div className="text-[8px] md:text-[10px] text-white/40 uppercase tracking-widest">{step.sub}</div>
                  </div>
                  {i < 5 && <div className="md:hidden w-px h-8 bg-gradient-to-b from-primary/30 to-transparent my-2"></div>}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-20 md:py-32 px-4 md:px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12 md:mb-20">
              <h2 className="font-headline text-3xl md:text-4xl font-bold text-white mb-4 md:mb-6">Scale Your Intelligence</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              {[
                { name: 'Free', price: '$0', features: ['1,000 AI Actions', 'Standard Risk Engine', '5 Integrations'] },
                { name: 'Pro', price: '$149', features: ['Unlimited AI Actions', 'Advanced Simulation', 'Custom Policy Rules', 'Priority n8n Nodes'], popular: true },
                { name: 'Enterprise', price: 'Custom', features: ['Dedicated Infra', 'SSO & Audit Logs', 'Custom Model Training', '24/7 Support'] },
              ].map((plan, i) => (
                <div key={i} className={cn(
                  "glass-card p-8 md:p-10 rounded-xl border flex flex-col transition-all",
                  plan.popular ? "border-2 border-primary md:scale-105 shadow-2xl shadow-primary/10 relative" : "border-white/5"
                )}>
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-on-primary text-[10px] font-bold rounded-full uppercase tracking-widest">Most Popular</div>
                  )}
                  <h3 className="font-headline text-lg md:text-xl font-bold text-white mb-2">{plan.name}</h3>
                  <div className="text-3xl md:text-4xl font-bold text-white mb-6">{plan.price}{plan.price !== 'Custom' && <span className="text-base md:text-lg text-white/40 font-normal">/mo</span>}</div>
                  <ul className="space-y-3 md:space-y-4 mb-8 md:mb-10 flex-1">
                    {plan.features.map((f, j) => (
                      <li key={j} className="flex items-center gap-3 text-xs md:text-sm text-on-surface-variant">
                        <CheckCircle className="w-4 h-4 text-primary" /> {f}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => navigate(plan.name === 'Enterprise' ? '/email' : '/login')}
                    className={cn(
                      "w-full py-3 md:py-4 rounded-xl font-bold transition-all text-sm md:text-base",
                      plan.popular ? "bg-primary text-on-primary hover:opacity-90 shadow-lg shadow-primary/20" : "border border-white/10 hover:bg-white/5"
                    )}
                  >
                    {plan.name === 'Enterprise' ? 'Contact Sales' : 'Get Started'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-[#101419] w-full py-12 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col items-center md:items-start gap-4">
            <div className="font-headline font-bold text-primary text-xl">AgentFlow AI</div>
            <div className="text-slate-500 font-body text-xs">© 2024 AgentFlow AI. All rights reserved.</div>
          </div>
          <div className="flex flex-wrap justify-center gap-8">
            {[
              { label: 'Privacy Policy', to: '/policy' },
              { label: 'Terms of Service', to: '/settings' },
              { label: 'Security', to: '/risk' },
              { label: 'Status', to: '/logs' },
            ].map((link) => (
              <Link key={link.label} className="text-slate-500 hover:text-primary transition-colors font-body text-xs" to={link.to}>
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
