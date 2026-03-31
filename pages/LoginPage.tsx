import { motion } from 'motion/react';
import { SignIn } from '@clerk/clerk-react';
import { Zap, ShieldCheck, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const appearance = {
    elements: {
      rootBox: 'w-full',
      card: 'shadow-none bg-transparent w-full !shadow-none',
      headerTitle: 'hidden',
      headerSubtitle: 'hidden',
      socialButtonsBlockButton:
        'clerk-auth-social-btn border-outline-variant hover:bg-surface-container-high text-on-surface',
      formButtonPrimary:
        'clerk-auth-primary-btn bg-primary hover:bg-primary/90 text-on-primary font-semibold',
      formFieldInput: 'clerk-auth-input !bg-surface-container-low !text-on-surface !border-outline-variant',
      formFieldLabel: 'clerk-auth-label',
      formFieldHintText: 'text-on-surface-variant',
      identityPreviewText: 'text-on-surface',
      identityPreviewEditButton: 'text-primary hover:text-primary/90',
      footerActionText: 'text-on-surface-variant',
      footerActionLink: 'text-primary hover:text-primary/90 font-semibold',
      dividerLine: 'bg-outline-variant/60',
      dividerText: 'text-on-surface-variant !bg-transparent',
      otpCodeFieldInput: 'clerk-auth-input',
      formResendCodeLink: 'text-primary hover:text-primary/90',
      alertText: 'text-error',
      formFieldRow: 'clerk-auth-row',
      footer: 'clerk-auth-footer',
      form: 'clerk-auth-form',
      formField: 'clerk-auth-field',
      formFieldAction: 'text-primary hover:text-primary/90',
      formFieldErrorText: 'text-error',
      socialButtonsBlockButtonText: 'text-on-surface',
    },
    layout: {
      socialButtonsPlacement: 'top' as const,
      socialButtonsVariant: 'iconButton' as const,
    },
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-6 md:px-8 md:py-10 selection:bg-primary selection:text-on-primary bg-background">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[80%] sm:w-[60%] md:w-[45%] h-[80%] sm:h-[60%] md:h-[45%] bg-primary/10 blur-[80px] sm:blur-[110px] md:blur-[130px] rounded-full" />
        <div className="absolute top-[15%] -right-[5%] w-[70%] sm:w-[50%] md:w-[35%] h-[70%] sm:h-[50%] md:h-[35%] bg-secondary/10 blur-[90px] sm:blur-[110px] md:blur-[120px] rounded-full" />
        <div className="absolute -bottom-[8%] left-[18%] w-[75%] sm:w-[55%] md:w-[38%] h-[75%] sm:h-[55%] md:h-[38%] bg-tertiary/5 blur-[90px] sm:blur-[110px] md:blur-[130px] rounded-full" />
      </div>

      <main className="relative z-10 flex flex-col lg:flex-row w-full max-w-6xl lg:min-h-[760px] glass-card rounded-lg sm:rounded-2xl overflow-hidden shadow-2xl border border-white/10">
        <section className="hidden lg:flex flex-col justify-between lg:w-[46%] p-6 sm:p-10 lg:p-14 xl:p-16 bg-surface-container-low/40 relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                'radial-gradient(circle at 2px 2px, #404752 1px, transparent 0)',
              backgroundSize: '32px 32px',
            }}
          />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-12">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Zap className="w-5 h-5 text-on-primary fill-current" />
              </div>
              <span className="text-2xl font-headline font-extrabold tracking-tighter text-on-surface">
                Verixa AI
              </span>
            </div>

            <h1 className="text-5xl font-headline font-extrabold text-on-surface leading-[1.08] tracking-tight mb-8">
              Take control of your <br />
              <span className="text-primary">AI workflow.</span>
            </h1>

            <p className="text-on-surface-variant text-lg max-w-md leading-relaxed mb-10">
              Orchestrate autonomous agents with precision. Experience the next generation of intelligent automation in a unified workspace.
            </p>

            <div className="space-y-4">
              {[
                { icon: ShieldCheck, text: 'Enterprise-grade security guardrails' },
                { icon: Sparkles, text: 'Fast onboarding with intelligent defaults' },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-3 text-on-surface-variant">
                  <item.icon className="w-4 h-4 text-primary" />
                  <span className="text-sm">{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 mt-auto">
            <div className="grid grid-cols-2 gap-8">
              <div>
                <span className="block text-primary text-3xl font-headline font-bold mb-1">
                  99.9%
                </span>
                <span className="text-xs font-label uppercase tracking-widest text-on-surface-variant">
                  Uptime SLA
                </span>
              </div>
              <div>
                <span className="block text-secondary text-3xl font-headline font-bold mb-1">
                  2.4k+
                </span>
                <span className="text-xs font-label uppercase tracking-widest text-on-surface-variant">
                  Active Nodes
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="flex-1 flex flex-col justify-center p-4 sm:p-6 md:p-8 lg:p-10 xl:p-14 bg-surface">
          <div className="w-full max-w-sm mx-auto">
            <div className="flex lg:hidden items-center gap-2 mb-8 sm:mb-10">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Zap className="w-4 h-4 text-on-primary fill-current" />
              </div>
              <span className="text-xl font-headline font-extrabold tracking-tighter text-on-surface">
                Verixa AI
              </span>
            </div>

            <header className="mb-7 sm:mb-8">
              <h2 className="text-2xl sm:text-3xl font-headline font-bold text-on-surface mb-2">
                Welcome back
              </h2>
              <p className="text-sm sm:text-base text-on-surface-variant">
                Sign in to continue to your automation workspace.
              </p>
            </header>

            <motion.div
              key="signIn"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="rounded-2xl border border-white/10 bg-surface-container-low/50 p-2 sm:p-3 md:p-4"
            >
              <SignIn
                routing="path"
                path="/login"
                forceRedirectUrl="/dashboard"
                appearance={appearance}
              />
            </motion.div>
          </div>
        </section>
      </main>
    </div>
  );
}
