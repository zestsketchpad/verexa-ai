import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Zap, FileText, Settings, Shield, Gavel, Mail, Plus, Menu, X } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Sidebar() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'AI Actions', icon: Zap, path: '/actions' },
    { name: 'Logs', icon: FileText, path: '/logs' },
    { name: 'Settings', icon: Settings, path: '/settings' },
  ];

  const secondaryItems = [
    { name: 'Risk', icon: Shield, path: '/risk' },
    { name: 'Policy', icon: Gavel, path: '/policy' },
    { name: 'Email', icon: Mail, path: '/email' },
  ];

  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <>
      {/* Mobile Toggle Button */}
      <button 
        onClick={toggleSidebar}
        className="lg:hidden fixed top-6 left-6 z-[60] p-2 rounded-lg bg-surface-container-high border border-white/10 text-white shadow-lg"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[50]"
          onClick={() => setIsOpen(false)}
        />
      )}

      <nav className={cn(
        "h-screen w-64 fixed left-0 top-0 border-r border-white/5 bg-[#101419] flex flex-col py-6 px-4 z-[55] transition-transform duration-300 lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="mb-10 px-2 mt-12 lg:mt-0">
          <h1 className="text-lg font-headline font-bold text-white tracking-tighter">AgentFlow</h1>
          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-label">Orchestrated Intelligence</p>
        </div>

        <div className="space-y-1 mb-8">
          {navItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className={cn(
                "flex items-center gap-3 py-3 px-4 rounded-lg font-body text-sm font-medium transition-all duration-300 hover:translate-x-1",
                location.pathname === item.path
                  ? "bg-gradient-to-r from-primary/10 to-transparent text-primary border-r-2 border-primary"
                  : "text-slate-500 hover:text-slate-200 hover:bg-white/5"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </Link>
          ))}
        </div>

        <button className="mb-auto mx-2 bg-gradient-to-r from-primary to-primary-container text-on-primary font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform">
          <Plus className="w-4 h-4" />
          New Agent
        </button>

        <div className="mt-8 pt-6 border-t border-white/5 space-y-4 px-2">
          {secondaryItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 text-slate-500 hover:text-primary transition-colors text-xs font-label"
            >
              <item.icon className="w-4 h-4" />
              {item.name}
            </Link>
          ))}
        </div>

        <div className="mt-8 flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-full bg-surface-container-high overflow-hidden">
            <img
              className="w-full h-full object-cover"
              src="https://picsum.photos/seed/user/100/100"
              alt="User"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-white">Alex Rivera</span>
            <span className="text-[10px] text-slate-500">Premium Plan</span>
          </div>
        </div>
      </nav>
    </>
  );
}
