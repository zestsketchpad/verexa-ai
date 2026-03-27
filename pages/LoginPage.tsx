import { motion } from 'motion/react';
import { useState } from 'react';
import { SignIn, SignUp } from '@clerk/clerk-react';
import { Zap } from 'lucide-react';

export default function LoginPage() {
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');

  return (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-0 selection:bg-primary selection:text-on-primary bg-background">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full"></div>
        <div className="absolute top-[20%] -right-[5%] w-[30%] h-[30%] bg-secondary/10 blur-[100px] rounded-full"></div>
        <div className="absolute -bottom-[5%] left-[20%] w-[35%] h-[35%] bg-tertiary/5 blur-[120px] rounded-full"></div>
      </div>

      <main className="relative z-10 flex flex-col md:flex-row w-full max-w-6xl md:min-h-[720px] glass-card rounded-xl overflow-hidden shadow-2xl">
        <section className="hidden md:flex flex-col justify-between w-1/2 p-16 bg-surface-container-low/40 relative overflow-hidden">
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #404752 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-12">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Zap className="w-5 h-5 text-on-primary fill-current" />
              </div>
              <span className="text-2xl font-headline font-extrabold tracking-tighter text-on-surface">Verixa AI</span>
            </div>
            <h1 className="text-5xl font-headline font-extrabold text-on-surface leading-[1.1] tracking-tight mb-8">
              Take control of your <br />
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

        <section className="flex-1 flex flex-col justify-center p-6 sm:p-10 md:p-20 bg-surface">
          <div className="max-w-md w-full mx-auto">
            <div className="flex md:hidden items-center gap-2 mb-10">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Zap className="w-4 h-4 text-on-primary fill-current" />
              </div>
              <span className="text-xl font-headline font-extrabold tracking-tighter text-on-surface">Verixa AI</span>
            </div>

            <header className="mb-8 md:mb-10">
              <h2 className="text-2xl md:text-3xl font-headline font-bold text-on-surface mb-2">
                {mode === 'signIn' ? 'Welcome back' : 'Create your account'}
              </h2>
              <p className="text-sm md:text-base text-on-surface-variant">
                {mode === 'signIn'
                  ? 'Sign in with your account or Google.'
                  : 'Sign up with email/password or Google.'}
              </p>
            </header>

            <div className="flex items-center gap-2 mb-6 p-1 rounded-lg bg-surface-container-low border border-outline-variant">
              <button
                type="button"
                onClick={() => setMode('signIn')}
                className={`flex-1 py-2 rounded-md text-sm font-medium transition ${
                  mode === 'signIn' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setMode('signUp')}
                className={`flex-1 py-2 rounded-md text-sm font-medium transition ${
                  mode === 'signUp' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Sign Up
              </button>
            </div>

            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="flex justify-center"
            >
              {mode === 'signIn' ? (
                <SignIn
                  routing="path"
                  path="/login"
                  forceRedirectUrl="/dashboard"
                  signUpUrl="/login?mode=signup"
                  appearance={{
                    elements: {
                      card: 'shadow-none bg-transparent',
                      headerTitle: 'hidden',
                      headerSubtitle: 'hidden',
                      socialButtonsBlockButton: 'border-outline-variant hover:bg-white/5 text-on-surface',
                      formButtonPrimary: 'bg-primary hover:bg-primary/90 text-on-primary',
                      footerActionText: 'text-on-surface-variant',
                      footerActionLink: 'text-primary hover:text-primary/90',
                    },
                  }}
                />
              ) : (
                <SignUp
                  routing="path"
                  path="/login"
                  forceRedirectUrl="/dashboard"
                  signInUrl="/login?mode=signin"
                  appearance={{
                    elements: {
                      card: 'shadow-none bg-transparent',
                      headerTitle: 'hidden',
                      headerSubtitle: 'hidden',
                      socialButtonsBlockButton: 'border-outline-variant hover:bg-white/5 text-on-surface',
                      formButtonPrimary: 'bg-primary hover:bg-primary/90 text-on-primary',
                      footerActionText: 'text-on-surface-variant',
                      footerActionLink: 'text-primary hover:text-primary/90',
                    },
                  }}
                />
              )}
            </motion.div>
          </div>
        </section>
      </main>
    </div>
  );
}
