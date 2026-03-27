import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Zap } from 'lucide-react';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-0 selection:bg-primary selection:text-on-primary bg-background">
      {/* Background Decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full"></div>
        <div className="absolute top-[20%] -right-[5%] w-[30%] h-[30%] bg-secondary/10 blur-[100px] rounded-full"></div>
        <div className="absolute -bottom-[5%] left-[20%] w-[35%] h-[35%] bg-tertiary/5 blur-[120px] rounded-full"></div>
      </div>

      <main className="relative z-10 flex flex-col md:flex-row w-full max-w-6xl md:min-h-[720px] glass-card rounded-xl overflow-hidden shadow-2xl">
        {/* Left Side */}
        <section className="hidden md:flex flex-col justify-between w-1/2 p-16 bg-surface-container-low/40 relative overflow-hidden">
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #404752 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-12">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Zap className="w-5 h-5 text-on-primary fill-current" />
              </div>
              <span className="text-2xl font-headline font-extrabold tracking-tighter text-on-surface">AgentFlow AI</span>
            </div>
            <h1 className="text-5xl font-headline font-extrabold text-on-surface leading-[1.1] tracking-tight mb-8">
              Take control of your <br/>
              <span className="text-primary">AI workflow.</span>
            </h1>
            <p className="text-on-surface-variant text-lg max-w-md leading-relaxed">
              Orchestrate autonomous agents with precision. Experience the next generation of intelligent automation in a unified editorial workspace.
            </p>
          </div>
          <div className="relative z-10 mt-auto">
            <div className="grid grid-cols-2 gap-8">
              <div>
                <span className="block text-primary text-3xl font-headline font-bold mb-1">99.9%</span>
                <span className="text-xs font-label uppercase tracking-widest text-on-surface-variant">Uptime SLA</span>
              </div>
              <div>
                <span className="block text-secondary text-3xl font-headline font-bold mb-1">2.4k+</span>
                <span className="text-xs font-label uppercase tracking-widest text-on-surface-variant">Active Nodes</span>
              </div>
            </div>
          </div>
        </section>

        {/* Right Side */}
        <section className="flex-1 flex flex-col justify-center p-6 sm:p-10 md:p-20 bg-surface">
          <div className="max-w-md w-full mx-auto">
            {/* Mobile Logo */}
            <div className="flex md:hidden items-center gap-2 mb-10">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Zap className="w-4 h-4 text-on-primary fill-current" />
              </div>
              <span className="text-xl font-headline font-extrabold tracking-tighter text-on-surface">AgentFlow AI</span>
            </div>

            <header className="mb-8 md:mb-10">
              <h2 className="text-2xl md:text-3xl font-headline font-bold text-on-surface mb-2">Welcome back</h2>
              <p className="text-sm md:text-base text-on-surface-variant">Enter your credentials to access your workspace.</p>
            </header>

            <div className="space-y-5 md:space-y-6">
              <button className="w-full flex items-center justify-center gap-3 py-3 md:py-3.5 px-4 rounded-xl border border-outline-variant hover:bg-white/5 transition-all duration-300 font-medium text-on-surface text-sm md:text-base">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"></path>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" fill="#EA4335"></path>
                </svg>
                Continue with Google
              </button>

              <div className="relative flex items-center py-2 md:py-4">
                <div className="flex-grow border-t border-outline-variant/30"></div>
                <span className="flex-shrink mx-4 text-[10px] font-label uppercase tracking-widest text-on-surface-variant">or use email</span>
                <div className="flex-grow border-t border-outline-variant/30"></div>
              </div>

              <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant ml-1">Email Address</label>
                  <input className="w-full bg-surface-container-lowest border-none rounded-lg py-3 md:py-4 px-5 text-on-surface placeholder:text-outline/50 focus:ring-2 focus:ring-primary/40 transition-all outline-none text-sm md:text-base" placeholder="name@company.com" type="email"/>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant">Password</label>
                    <Link className="text-[10px] font-medium text-primary hover:text-primary-container transition-colors" to="#">Forgot password?</Link>
                  </div>
                  <input className="w-full bg-surface-container-lowest border-none rounded-lg py-3 md:py-4 px-5 text-on-surface placeholder:text-outline/50 focus:ring-2 focus:ring-primary/40 transition-all outline-none text-sm md:text-base" placeholder="••••••••" type="password"/>
                </div>
                <Link to="/dashboard" className="block w-full py-3 md:py-4 rounded-xl bg-gradient-to-r from-primary to-primary-container text-on-primary font-bold text-base md:text-lg text-center primary-glow hover:scale-[1.02] active:scale-95 transition-all duration-200 mt-6">
                  Sign In to AgentFlow
                </Link>
              </form>
            </div>
            
            <footer className="mt-8 md:mt-12 text-center">
              <p className="text-on-surface-variant text-xs md:text-sm">
                Don't have an account? 
                <Link className="text-primary font-semibold hover:underline decoration-primary/30 underline-offset-4 ml-1" to="#">Start free trial</Link>
              </p>
            </footer>
          </div>
        </section>
      </main>
    </div>
  );
}
