import { motion } from 'motion/react';
import Sidebar from '../components/Sidebar';

export default function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <main className="ml-64 p-12 flex-grow flex flex-col items-center justify-center text-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-12 rounded-2xl border border-white/5 max-w-md"
        >
          <h2 className="text-3xl font-headline font-bold text-white mb-4">{title}</h2>
          <p className="text-on-surface-variant mb-8">This module is currently under development as part of the VerixaAI AI orchestration layer.</p>
          <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden">
            <div className="h-full bg-primary w-2/3 animate-pulse"></div>
          </div>
          <p className="mt-4 text-[10px] font-label uppercase tracking-widest text-primary">System Initializing...</p>
        </motion.div>
      </main>
    </div>
  );
}
