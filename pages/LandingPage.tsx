import { Link, useNavigate } from 'react-router-dom';
import { motion, useMotionValue, useTransform, useSpring, AnimatePresence } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { PlayCircle, CheckCircle, Sparkles, ShieldCheck, Gavel, Play, Zap, ArrowRight } from 'lucide-react';
import Navbar from '../components/Navbar';
import { cn } from '../lib/utils';

/* ─── Animated grid background ─── */
function GridBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* deep base */}
      <div className="absolute inset-0 bg-[#07090d]" />

      {/* subtle dot grid */}
      <div
        className="absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage:
            'radial-gradient(circle, rgba(162,201,255,0.6) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* animated aurora blobs */}
      <motion.div
        className="absolute -top-20 sm:-top-32 md:-top-40 -left-20 sm:-left-32 md:-left-40 w-48 sm:w-96 md:w-[700px] h-48 sm:h-96 md:h-[700px] rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(99,155,255,0.12) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
        animate={{ x: [0, 60, 0], y: [0, 40, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute top-1/4 sm:top-1/3 -right-16 sm:-right-32 md:-right-40 w-40 sm:w-80 md:w-[600px] h-40 sm:h-80 md:h-[600px] rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(120,80,255,0.09) 0%, transparent 70%)',
          filter: 'blur(80px)',
        }}
        animate={{ x: [0, -50, 0], y: [0, 60, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-0 left-1/4 sm:left-1/3 w-32 sm:w-72 md:w-[500px] h-32 sm:h-72 md:h-[500px] rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(0,200,180,0.07) 0%, transparent 70%)',
          filter: 'blur(80px)',
        }}
        animate={{ x: [0, 40, 0], y: [0, -50, 0] }}
        transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* thin horizontal scan line */}
      <motion.div
        className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent"
        initial={{ top: '-2px' }}
        animate={{ top: ['0%', '100%'] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'linear', repeatDelay: 4 }}
      />

      {/* vignette */}
      <div className="absolute inset-0 bg-radial-gradient pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 40%, rgba(7,9,13,0.7) 100%)',
        }}
      />
    </div>
  );
}

/* ─── Magnetic button wrapper ─── */
function MagneticButton({ children, className, onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 300, damping: 20 });
  const springY = useSpring(y, { stiffness: 300, damping: 20 });

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = ref.current!.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    x.set((e.clientX - cx) * 0.25);
    y.set((e.clientY - cy) * 0.25);
  };
  const handleMouseLeave = () => { x.set(0); y.set(0); };

  return (
    <motion.div
      ref={ref}
      style={{ x: springX, y: springY }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={className}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
}

/* ─── Floating particle ─── */
function Particle({ delay }: { delay: number }) {
  const size = Math.random() * 3 + 1;
  const left = Math.random() * 100;
  const duration = Math.random() * 15 + 10;
  return (
    <motion.div
      className="absolute rounded-full bg-primary/30"
      style={{ width: size, height: size, left: `${left}%`, bottom: -10 }}
      animate={{ y: [0, -window.innerHeight - 20], opacity: [0, 0.7, 0] }}
      transition={{ duration, delay, repeat: Infinity, ease: 'linear' }}
    />
  );
}

/* ─── Tilt card ─── */
function TiltCard({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-0.5, 0.5], ['8deg', '-8deg']);
  const rotateY = useTransform(x, [-0.5, 0.5], ['-8deg', '8deg']);
  const glowX = useTransform(x, [-0.5, 0.5], ['0%', '100%']);
  const glowY = useTransform(y, [-0.5, 0.5], ['0%', '100%']);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = ref.current!.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  };
  const handleMouseLeave = () => { x.set(0); y.set(0); };

  return (
    <motion.div
      ref={ref}
      style={{ rotateX, rotateY, transformStyle: 'preserve-3d', perspective: 800 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn('relative', className)}
    >
      {/* shimmer highlight */}
      <motion.div
        className="pointer-events-none absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: `radial-gradient(circle at ${glowX.get()} ${glowY.get()}, rgba(162,201,255,0.08), transparent 60%)`,
        }}
      />
      {children}
    </motion.div>
  );
}

/* ─── Counter animation ─── */
function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      let start = 0;
      const step = target / 60;
      const id = setInterval(() => {
        start += step;
        if (start >= target) { setVal(target); clearInterval(id); }
        else setVal(Math.floor(start));
      }, 16);
    }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>;
}

/* ─── Glowing orb cursor follower ─── */
function CursorOrb() {
  const x = useMotionValue(-200);
  const y = useMotionValue(-200);
  const springX = useSpring(x, { stiffness: 80, damping: 20 });
  const springY = useSpring(y, { stiffness: 80, damping: 20 });

  useEffect(() => {
    const move = (e: MouseEvent) => { x.set(e.clientX); y.set(e.clientY); };
    window.addEventListener('mousemove', move);
    return () => window.removeEventListener('mousemove', move);
  }, []);

  return (
    <motion.div
      className="pointer-events-none fixed z-50 rounded-full"
      style={{
        x: springX,
        y: springY,
        translateX: '-50%',
        translateY: '-50%',
        width: 320,
        height: 320,
        background: 'radial-gradient(circle, rgba(99,155,255,0.07) 0%, transparent 70%)',
      }}
    />
  );
}

/* ─── Typewriter text ─── */
function TypewriterText({ words }: { words: string[] }) {
  const [index, setIndex] = useState(0);
  const [displayed, setDisplayed] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const word = words[index];
    if (!deleting && displayed.length < word.length) {
      const t = setTimeout(() => setDisplayed(word.slice(0, displayed.length + 1)), 80);
      return () => clearTimeout(t);
    }
    if (!deleting && displayed.length === word.length) {
      const t = setTimeout(() => setDeleting(true), 2000);
      return () => clearTimeout(t);
    }
    if (deleting && displayed.length > 0) {
      const t = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 40);
      return () => clearTimeout(t);
    }
    if (deleting && displayed.length === 0) {
      setDeleting(false);
      setIndex((i) => (i + 1) % words.length);
    }
  }, [displayed, deleting, index, words]);

  return (
    <span className="text-primary">
      {displayed}
      <motion.span
        animate={{ opacity: [1, 0] }}
        transition={{ duration: 0.5, repeat: Infinity }}
        className="inline-block w-[2px] h-[0.9em] bg-primary ml-0.5 align-middle"
      />
    </span>
  );
}

/* ═══════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════ */
export default function LandingPage() {
  const navigate = useNavigate();
  const [particles] = useState(() => Array.from({ length: 25 }, (_, i) => i));

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen bg-[#07090d] relative">
      <GridBackground />
      <CursorOrb />

      {/* floating particles */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        {particles.map((i) => <Particle key={i} delay={i * 0.8} />)}
      </div>

      <Navbar />

      <main className="pt-24 overflow-x-hidden relative z-10">

        {/* ── HERO ── */}
        <section className="relative min-h-[88vh] flex items-center justify-center px-4 md:px-6 overflow-hidden">
          <div className="max-w-5xl mx-auto text-center relative z-10">

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-3 md:px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-[10px] md:text-xs font-label uppercase tracking-widest mb-6 md:mb-8 backdrop-blur-sm"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              Now with Autonomous Simulation
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="font-headline text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tighter mb-6 md:mb-8 leading-[1.08]"
            >
              <span className="bg-gradient-to-b from-white via-white to-white/50 bg-clip-text text-transparent">
                Control AI Before
              </span>
              <br className="hidden sm:block" />
              <span className="bg-gradient-to-r from-primary via-blue-300 to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-shimmer">
                It Acts
              </span>
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
              <MagneticButton onClick={() => navigate('/login')}>
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  className="relative overflow-hidden w-full sm:w-auto px-8 md:px-10 py-4 md:py-5 bg-gradient-to-r from-primary to-blue-400 text-on-primary font-bold rounded-xl text-base md:text-lg shadow-xl shadow-primary/20 transition-all group"
                >
                  <span className="relative z-10">Start Free Trial</span>
                  <motion.span
                    className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                  {/* ripple glow */}
                  <span className="absolute inset-0 rounded-xl ring-1 ring-primary/40 group-hover:ring-primary/80 transition-all duration-500" />
                </motion.button>
              </MagneticButton>

              <MagneticButton onClick={() => scrollToSection('demo')}>
                <motion.button
                  whileHover={{ scale: 1.04, borderColor: 'rgba(162,201,255,0.3)' }}
                  whileTap={{ scale: 0.97 }}
                  className="w-full sm:w-auto px-8 md:px-10 py-4 md:py-5 bg-white/5 backdrop-blur-md text-white font-bold rounded-xl text-base md:text-lg hover:bg-white/10 transition-all flex items-center justify-center gap-2 border border-white/10"
                >
                  <PlayCircle className="w-5 h-5 md:w-6 md:h-6" />
                  Watch Demo
                </motion.button>
              </MagneticButton>
            </motion.div>

            {/* live stat chips */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
              className="flex flex-wrap gap-4 justify-center mt-12 md:mt-16"
            >
              {[
                { label: 'Actions Executed', value: 4200000, suffix: '+' },
                { label: 'Avg Latency', value: 124, suffix: 'ms' },
                { label: 'Enterprises', value: 380, suffix: '+' },
              ].map((s) => (
                <div key={s.label} className="px-5 py-3 rounded-full border border-white/8 bg-white/4 backdrop-blur-sm text-center">
                  <div className="text-white font-bold text-sm">
                    <AnimatedCounter target={s.value} suffix={s.suffix} />
                  </div>
                  <div className="text-white/40 text-[10px] uppercase tracking-wider">{s.label}</div>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ── DEMO ── */}
        <section id="demo" className="py-16 md:py-24 px-4 md:px-6 relative">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.6 }}
              className="relative rounded-2xl overflow-hidden border border-white/8 shadow-[0_0_80px_rgba(99,155,255,0.08)] p-4 md:p-8 backdrop-blur-md"
              style={{
                background:
                  'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(99,155,255,0.04) 100%)',
              }}
            >
              {/* top bar */}
              <div className="flex items-center justify-between mb-6 md:mb-8 border-b border-white/5 pb-4">
                <div className="flex items-center gap-2 md:gap-3">
                  <motion.div whileHover={{ scale: 1.3 }} className="w-2.5 h-2.5 rounded-full bg-red-500/60 cursor-pointer" />
                  <motion.div whileHover={{ scale: 1.3 }} className="w-2.5 h-2.5 rounded-full bg-yellow-500/60 cursor-pointer" />
                  <motion.div whileHover={{ scale: 1.3 }} className="w-2.5 h-2.5 rounded-full bg-green-500/60 cursor-pointer" />
                </div>
                <div className="text-[8px] md:text-xs font-label text-white/30 tracking-[0.2em] uppercase">Simulated Production Environment</div>
              </div>

              <div className="grid lg:grid-cols-12 gap-6 md:gap-8">
                {/* left column */}
                <div className="lg:col-span-4 space-y-4 md:space-y-6">
                  <TiltCard className="group">
                    <motion.div
                      whileHover={{ borderLeftColor: 'rgb(162,201,255)' }}
                      className="bg-white/4 backdrop-blur-sm p-5 md:p-6 rounded-xl border border-white/8 border-l-4 border-l-primary transition-all duration-300"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="font-headline font-bold text-white text-sm md:text-base">Action Card</h4>
                        <motion.span
                          whileHover={{ scale: 1.1 }}
                          className="px-2 py-1 rounded bg-primary/10 text-primary text-[8px] md:text-[10px] font-bold cursor-default"
                        >
                          ID: #4920
                        </motion.span>
                      </div>
                      <p className="text-xs md:text-sm text-on-surface-variant mb-4 md:mb-6">Modify customer subscription tier and apply 15% loyalty credit.</p>
                      <div className="space-y-2 md:space-y-3">
                        <div className="flex justify-between text-[10px] font-label uppercase tracking-wider text-white/50">
                          <span>Risk Score</span>
                          <span className="text-primary">12% Safe</span>
                        </div>
                        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            whileInView={{ width: '12%' }}
                            viewport={{ once: true }}
                            transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
                            className="h-full bg-primary rounded-full shadow-[0_0_8px_#a2c9ff]"
                          />
                        </div>
                      </div>
                    </motion.div>
                  </TiltCard>

                  <TiltCard className="group">
                    <div className="bg-white/4 backdrop-blur-sm p-5 md:p-6 rounded-xl border border-white/8">
                      <h4 className="font-headline font-bold text-white mb-4 text-xs md:text-sm">Policy Guardrails</h4>
                      <div className="space-y-2 md:space-y-3">
                        {[
                          'Financial Limit: Under $500',
                          'User Auth: Level 4 Verified',
                          'Region: Global Permitted',
                        ].map((item, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.12 }}
                            className="flex items-center gap-2 md:gap-3 text-[10px] md:text-xs text-on-surface-variant"
                          >
                            <motion.div whileHover={{ scale: 1.3, rotate: 10 }}>
                              <CheckCircle className="w-3 h-3 md:w-4 md:h-4 text-primary" />
                            </motion.div>
                            {item}
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </TiltCard>
                </div>

                {/* right column */}
                <div className="lg:col-span-8 flex flex-col gap-6">
                  <div className="flex-1 bg-white/4 backdrop-blur-sm rounded-xl p-6 md:p-8 relative overflow-hidden border border-white/8">
                    {/* animated background grid inside card */}
                    <div
                      className="absolute inset-0 opacity-[0.04]"
                      style={{
                        backgroundImage: 'linear-gradient(rgba(162,201,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(162,201,255,1) 1px, transparent 1px)',
                        backgroundSize: '32px 32px',
                      }}
                    />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.2 }}
                      className="absolute top-4 right-4"
                    >
                      <motion.div
                        animate={{ boxShadow: ['0 0 0px rgba(162,201,255,0.3)', '0 0 20px rgba(162,201,255,0.6)', '0 0 0px rgba(162,201,255,0.3)'] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="px-3 md:px-4 py-1.5 md:py-2 bg-primary/20 text-primary font-bold rounded-lg border border-primary/30 text-[10px] md:text-xs"
                      >
                        APPROVED
                      </motion.div>
                    </motion.div>

                    <h3 className="font-headline text-xl md:text-2xl font-bold text-white mb-4 md:mb-6 relative z-10">Client Response Preview</h3>

                    <div className="relative z-10 bg-black/30 p-4 md:p-6 rounded-lg font-mono text-[10px] md:text-sm text-primary-container space-y-1 md:space-y-2 border border-white/5 overflow-x-auto">
                      {[
                        '  "status": "success",',
                        '  "message": "Subscription updated successfully",',
                        '  "customer_id": "cust_88x29",',
                        '  "applied_credit": 15.00,',
                        '  "new_mrr": 249.00',
                      ].map((line, i) => (
                        <motion.p
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.4 + i * 0.1 }}
                          className="text-blue-300/80"
                        >
                          {i === 0 && <span className="text-white/30">{'{'}</span>}
                          {line}
                          {i === 4 && <br />}
                          {i === 4 && <span className="text-white/30">{'}'}</span>}
                        </motion.p>
                      ))}
                    </div>

                    <div className="relative z-10 mt-6 md:mt-8 pt-6 md:pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex gap-6 md:gap-8">
                        {[{ label: 'Latency', value: '124ms' }, { label: 'Cost', value: '$0.002' }].map((s) => (
                          <div key={s.label} className="flex flex-col">
                            <span className="text-[8px] md:text-[10px] uppercase text-white/40">{s.label}</span>
                            <motion.span
                              className="text-xs md:text-sm font-bold text-white"
                              whileHover={{ color: '#a2c9ff' }}
                            >
                              {s.value}
                            </motion.span>
                          </div>
                        ))}
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(162,201,255,0.4)' }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate('/dashboard')}
                        className="w-full sm:w-auto bg-primary px-6 py-2 rounded-full text-on-primary font-bold text-xs md:text-sm"
                      >
                        Execute Live
                      </motion.button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── FEATURES BENTO ── */}
        <section id="features" className="py-20 md:py-32 px-4 md:px-6 relative">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12 md:mb-20"
            >
              <h2 className="font-headline text-3xl md:text-5xl font-bold text-white mb-4 md:mb-6 tracking-tight">Enterprise Orchestration</h2>
              <p className="text-on-surface-variant text-sm md:text-base max-w-2xl mx-auto">Five core engines designed to move AI from playground experiments to reliable production systems.</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              {/* Large card */}
              {[
                {
                  span: 'md:col-span-2',
                  icon: Zap,
                  iconColor: 'text-primary',
                  title: 'AI Action Generation',
                  desc: 'Our specialized models interpret natural language intent and convert it into structured, executable payloads with zero syntax errors.',
                  delay: 0,
                },
              ].map((card) => (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: card.delay }}
                  className={cn(card.span)}
                >
                  <TiltCard className="group h-full">
                    <motion.div
                      whileHover={{ borderColor: 'rgba(162,201,255,0.2)' }}
                      className="h-full bg-white/4 backdrop-blur-sm p-6 md:p-10 rounded-xl border border-white/8 relative overflow-hidden transition-colors duration-300"
                    >
                      <motion.div
                        className="absolute top-6 right-6"
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 4, repeat: Infinity }}
                      >
                        <card.icon className={cn('w-8 h-8 md:w-10 md:h-10 opacity-20 group-hover:opacity-100 transition-opacity', card.iconColor)} />
                      </motion.div>
                      <h3 className="font-headline text-xl md:text-2xl font-bold text-white mb-4">{card.title}</h3>
                      <p className="text-on-surface-variant text-sm md:text-base max-w-md">{card.desc}</p>
                    </motion.div>
                  </TiltCard>
                </motion.div>
              ))}

              {[
                { icon: ShieldCheck, color: 'text-secondary', title: 'Risk Engine', desc: 'Multi-factor probability analysis that flags outliers and potentially harmful commands before they leave the buffer.', delay: 0.1 },
                { icon: Gavel, color: 'text-tertiary', title: 'Policy Guardrails', desc: 'Hard-coded business logic that AI cannot overwrite. Enforce budget limits, role-based access, and temporal constraints.', delay: 0.15 },
              ].map((card) => (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: card.delay }}
                >
                  <TiltCard className="group h-full">
                    <motion.div
                      whileHover={{ borderColor: 'rgba(162,201,255,0.15)' }}
                      className="h-full bg-white/4 backdrop-blur-sm p-6 md:p-10 rounded-xl border border-white/8 transition-colors duration-300"
                    >
                      <motion.div
                        whileHover={{ scale: 1.2, rotate: -5 }}
                        transition={{ type: 'spring', stiffness: 300 }}
                        className="mb-4 md:mb-6 inline-block"
                      >
                        <card.icon className={cn('w-8 h-8 md:w-10 md:h-10', card.color)} />
                      </motion.div>
                      <h3 className="font-headline text-lg md:text-xl font-bold text-white mb-3 md:mb-4">{card.title}</h3>
                      <p className="text-on-surface-variant text-xs md:text-sm leading-relaxed">{card.desc}</p>
                    </motion.div>
                  </TiltCard>
                </motion.div>
              ))}

              {/* Simulation Engine */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="md:col-span-2"
              >
                <TiltCard className="group h-full">
                  <motion.div
                    whileHover={{ borderColor: 'rgba(162,201,255,0.15)' }}
                    className="h-full bg-white/4 backdrop-blur-sm p-6 md:p-10 rounded-xl border border-white/8 relative overflow-hidden transition-colors duration-300"
                  >
                    <div className="flex flex-col sm:flex-row gap-6 md:gap-8 items-center">
                      <div className="flex-1">
                        <h3 className="font-headline text-xl md:text-2xl font-bold text-white mb-3 md:mb-4">Simulation Engine</h3>
                        <p className="text-on-surface-variant text-sm md:text-base">Run actions in a non-destructive sandbox to predict downstream effects on your real-world data and user experience.</p>
                      </div>
                      <div className="flex-1 bg-black/20 rounded-xl p-4 border border-white/5 w-full">
                        <div className="space-y-2">
                          {[['w-3/4', 'bg-white/5'], ['w-1/2', 'bg-white/5'], ['w-full', 'bg-primary/20']].map(([w, bg], i) => (
                            <motion.div
                              key={i}
                              className={cn('h-2 rounded', w, bg)}
                              animate={{ scaleX: [1, 1.02, 1], opacity: [0.7, 1, 0.7] }}
                              transition={{ duration: 2 + i * 0.5, repeat: Infinity, delay: i * 0.3 }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </TiltCard>
              </motion.div>

              {/* n8n full-width */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.25 }}
                className="md:col-span-3"
              >
                <TiltCard className="group">
                  <motion.div
                    whileHover={{ borderColor: 'rgba(162,201,255,0.15)' }}
                    className="bg-white/4 backdrop-blur-sm p-6 md:p-12 rounded-xl border border-white/8 flex flex-col lg:flex-row items-center gap-8 md:gap-10 transition-colors duration-300"
                  >
                    <div className="lg:w-1/2">
                      <h3 className="font-headline text-2xl md:text-3xl font-bold text-white mb-4">Real-world Execution (n8n)</h3>
                      <p className="text-on-surface-variant text-sm md:text-base mb-6">Connect to 400+ apps via built-in n8n nodes. Once an action is approved, it flows directly into your production pipelines with full audit logging.</p>
                      <motion.button
                        whileHover={{ x: 4 }}
                        onClick={() => navigate('/actions')}
                        className="text-primary font-bold text-sm md:text-base flex items-center gap-2 hover:underline"
                      >
                        Explore Integrations
                        <ArrowRight className="w-4 h-4" />
                      </motion.button>
                    </div>
                    <div className="lg:w-1/2 grid grid-cols-2 sm:grid-cols-4 gap-4 w-full">
                      {[1, 2, 3, 4].map((i) => (
                        <motion.div
                          key={i}
                          whileHover={{ scale: 1.08, borderColor: 'rgba(162,201,255,0.3)', filter: 'grayscale(0)' }}
                          transition={{ type: 'spring', stiffness: 300 }}
                          className="aspect-square bg-white/5 rounded-xl flex items-center justify-center grayscale transition-all border border-white/5 cursor-pointer"
                        >
                          <img
                            src={`https://picsum.photos/seed/logo${i}/64/64`}
                            alt="Integration"
                            className="w-6 h-6 md:w-8 md:h-8 opacity-50"
                            referrerPolicy="no-referrer"
                          />
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                </TiltCard>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ── INTELLIGENCE LOOP ── */}
        <section className="py-20 md:py-24 relative overflow-hidden">
          {/* faint horizontal lines */}
          <div className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(162,201,255,0.5) 39px, rgba(162,201,255,0.5) 40px)',
            }}
          />
          <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12 md:mb-20"
            >
              <h2 className="font-headline text-3xl md:text-4xl font-bold text-white">The Intelligence Loop</h2>
            </motion.div>

            <div className="relative flex flex-col md:flex-row justify-between items-center gap-8 md:gap-4">
              {/* connector line */}
              <div className="hidden md:block absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent -translate-y-1/2 z-0" />

              {[
                { name: 'Input', sub: 'Capture Intent', icon: Zap },
                { name: 'AI', sub: 'Logic Gen', icon: Sparkles },
                { name: 'Risk', sub: 'Anomaly Detect', icon: ShieldCheck },
                { name: 'Rules', sub: 'Hard Guardrails', icon: Gavel },
                { name: 'Simulation', sub: 'Safe Preview', icon: Play },
                { name: 'Execute', sub: 'Production Out', icon: Zap, highlight: true },
              ].map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, type: 'spring', stiffness: 200 }}
                  className="relative z-10 flex flex-col items-center group w-full md:w-auto"
                >
                  <motion.div
                    whileHover={{ scale: 1.15, y: -4 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                    className={cn(
                      'w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center mb-3 md:mb-4 transition-all duration-300 cursor-default',
                      step.highlight
                        ? 'bg-gradient-to-br from-primary to-blue-400 shadow-[0_0_30px_rgba(162,201,255,0.5)]'
                        : 'bg-white/5 border border-white/10 group-hover:border-primary group-hover:bg-white/10 backdrop-blur-sm'
                    )}
                  >
                    <step.icon className={cn('w-5 h-5 md:w-6 md:h-6', step.highlight ? 'text-on-primary' : 'text-white/50 group-hover:text-primary transition-colors')} />
                  </motion.div>
                  <div className="text-center">
                    <div className="font-bold text-white text-xs md:text-sm">{step.name}</div>
                    <div className="text-[8px] md:text-[10px] text-white/40 uppercase tracking-widest">{step.sub}</div>
                  </div>
                  {i < 5 && <div className="md:hidden w-px h-8 bg-gradient-to-b from-primary/30 to-transparent my-2" />}
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── PRICING ── */}
        <section id="pricing" className="py-20 md:py-32 px-4 md:px-6 relative">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12 md:mb-20"
            >
              <h2 className="font-headline text-3xl md:text-4xl font-bold text-white mb-4 md:mb-6">Scale Your Intelligence</h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              {[
                { name: 'Free', price: '$0', features: ['1,000 AI Actions', 'Standard Risk Engine', '5 Integrations'], delay: 0 },
                { name: 'Pro', price: '$149', features: ['Unlimited AI Actions', 'Advanced Simulation', 'Custom Policy Rules', 'Priority n8n Nodes'], popular: true, delay: 0.1 },
                { name: 'Enterprise', price: 'Custom', features: ['Dedicated Infra', 'SSO & Audit Logs', 'Custom Model Training', '24/7 Support'], delay: 0.2 },
              ].map((plan) => (
                <motion.div
                  key={plan.name}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: plan.delay }}
                  whileHover={{ y: -6 }}
                  className={cn(
                    'relative flex flex-col rounded-xl border transition-all duration-300',
                    plan.popular
                      ? 'border-2 border-primary md:scale-105 shadow-[0_0_40px_rgba(162,201,255,0.15)]'
                      : 'border-white/8'
                  )}
                  style={{
                    background: plan.popular
                      ? 'linear-gradient(135deg, rgba(99,155,255,0.12) 0%, rgba(99,155,255,0.04) 100%)'
                      : 'rgba(255,255,255,0.03)',
                    backdropFilter: 'blur(12px)',
                  }}
                >
                  {plan.popular && (
                    <motion.div
                      animate={{ boxShadow: ['0 0 0px rgba(162,201,255,0.5)', '0 0 14px rgba(162,201,255,0.8)', '0 0 0px rgba(162,201,255,0.5)'] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-on-primary text-[10px] font-bold rounded-full uppercase tracking-widest"
                    >
                      Most Popular
                    </motion.div>
                  )}
                  <div className="p-8 md:p-10 flex flex-col flex-1">
                    <h3 className="font-headline text-lg md:text-xl font-bold text-white mb-2">{plan.name}</h3>
                    <div className="text-3xl md:text-4xl font-bold text-white mb-6">
                      {plan.price}
                      {plan.price !== 'Custom' && <span className="text-base md:text-lg text-white/40 font-normal">/mo</span>}
                    </div>
                    <ul className="space-y-3 md:space-y-4 mb-8 md:mb-10 flex-1">
                      {plan.features.map((f, j) => (
                        <motion.li
                          key={j}
                          initial={{ opacity: 0, x: -10 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: (plan.delay || 0) + j * 0.08 }}
                          className="flex items-center gap-3 text-xs md:text-sm text-on-surface-variant"
                        >
                          <motion.div whileHover={{ scale: 1.3, rotate: 10 }}>
                            <CheckCircle className="w-4 h-4 text-primary" />
                          </motion.div>
                          {f}
                        </motion.li>
                      ))}
                    </ul>
                    <motion.button
                      whileHover={{ scale: 1.03, boxShadow: plan.popular ? '0 0 20px rgba(162,201,255,0.4)' : 'none' }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => navigate(plan.name === 'Enterprise' ? '/email' : '/login')}
                      className={cn(
                        'w-full py-3 md:py-4 rounded-xl font-bold transition-all text-sm md:text-base',
                        plan.popular
                          ? 'bg-primary text-on-primary hover:opacity-90 shadow-lg shadow-primary/20'
                          : 'border border-white/10 hover:bg-white/5 text-white'
                      )}
                    >
                      {plan.name === 'Enterprise' ? 'Contact Sales' : 'Get Started'}
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* ── FOOTER ── */}
      <footer className="relative z-10 w-full py-12 border-t border-white/8"
        style={{ background: 'rgba(7,9,13,0.95)', backdropFilter: 'blur(12px)' }}
      >
        <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col items-center md:items-start gap-4">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="font-headline font-bold text-primary text-xl cursor-default"
            >
              Verixa AI
            </motion.div>
            <div className="text-slate-500 font-body text-xs">© 2024 Verixa AI. All rights reserved.</div>
          </div>
          <div className="flex flex-wrap justify-center gap-8">
            {[
              { label: 'Privacy Policy', to: '/policy' },
              { label: 'Terms of Service', to: '/settings' },
              { label: 'Security', to: '/risk' },
              { label: 'Status', to: '/logs' },
            ].map((link) => (
              <motion.div key={link.label} whileHover={{ y: -2 }}>
                <Link className="text-slate-500 hover:text-primary transition-colors font-body text-xs" to={link.to}>
                  {link.label}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </footer>

      {/* shimmer keyframe */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
        .animate-shimmer {
          animation: shimmer 4s linear infinite;
        }
      `}</style>
    </div>
  );
}