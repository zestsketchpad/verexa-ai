import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed top-2 sm:top-4 md:top-6 left-0 w-full z-50 flex justify-center px-2 sm:px-4">
      <nav className="w-full max-w-5xl flex items-center justify-between px-2 sm:px-4 md:px-8 py-2 sm:py-3 rounded-lg sm:rounded-full bg-slate-950/40 backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] transition-all duration-300 hover:border-primary/20 hover:shadow-primary/5 relative">
        <Link to="/" className="text-base sm:text-lg md:text-xl font-extrabold tracking-tighter text-primary font-headline whitespace-nowrap">
          VERIXA
        </Link>
        
        <div className="hidden md:flex gap-4 lg:gap-8 items-center">
          <a className="text-primary text-xs sm:text-sm font-semibold font-headline tracking-tight" href="#features">Platform</a>
          <Link className="text-slate-400 hover:text-white transition-colors text-xs sm:text-sm font-headline tracking-tight" to="/actions">Solutions</Link>
          <Link className="text-slate-400 hover:text-white transition-colors text-xs sm:text-sm font-headline tracking-tight" to="/risk">Intelligence</Link>
          <a className="text-slate-400 hover:text-white transition-colors text-xs sm:text-sm font-headline tracking-tight" href="#pricing">Pricing</a>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
          <Link to="/login" className="hidden sm:block text-slate-400 hover:text-white transition-colors text-xs sm:text-sm font-headline font-medium">Login</Link>
          <Link to="/login" className="bg-gradient-to-r from-primary to-primary-container text-on-primary px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold shadow-[0_0_15px_rgba(162,201,255,0.2)] hover:scale-105 transition-transform whitespace-nowrap">
            Free Trial
          </Link>
          <button 
            className="md:hidden text-white p-1"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
          </button>
        </div>

        {/* Mobile Menu Overlay */}
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 sm:mt-3 mx-2 sm:mx-0 p-4 sm:p-6 glass-card rounded-2xl sm:rounded-3xl border border-white/10 flex flex-col gap-4 sm:gap-6 md:hidden animate-in fade-in slide-in-from-top-4 duration-300">
            <a className="text-primary text-sm sm:text-base md:text-lg font-semibold font-headline" href="#features" onClick={() => setIsOpen(false)}>Platform</a>
            <Link className="text-slate-400 hover:text-white text-sm sm:text-base md:text-lg font-headline" to="/actions" onClick={() => setIsOpen(false)}>Solutions</Link>
            <Link className="text-slate-400 hover:text-white text-sm sm:text-base md:text-lg font-headline" to="/risk" onClick={() => setIsOpen(false)}>Intelligence</Link>
            <a className="text-slate-400 hover:text-white text-sm sm:text-base md:text-lg font-headline" href="#pricing" onClick={() => setIsOpen(false)}>Pricing</a>
            <div className="h-px bg-white/10 w-full my-1 sm:my-2"></div>
            <Link to="/login" className="text-slate-400 hover:text-white text-sm sm:text-base md:text-lg font-headline" onClick={() => setIsOpen(false)}>Login</Link>
          </div>
        )}
      </nav>
    </div>
  );
}
