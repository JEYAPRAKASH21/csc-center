import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Menu, Calendar, Sun, Moon, Store, X } from 'lucide-react';

interface NavbarProps {
  onToggleMobileMenu?: () => void;
  isMobileMenuOpen?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleMobileMenu, isMobileMenuOpen }) => {
  const { settings } = useApp();
  const [fullDateTime, setFullDateTime] = useState<string>('');
  const [shortTime, setShortTime] = useState<string>('');
  const [isDark, setIsDark] = useState<boolean>(true);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      const fullDateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      const fullTimeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

      setShortTime(`${dateStr} • ${timeStr}`);
      setFullDateTime(`${fullDateStr}  •  ${fullTimeStr}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleTheme = () => {
    setIsDark(!isDark);
    if (document.documentElement.classList.contains('dark')) {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
  };

  return (
    <header className="bg-[#0d1322] border-b border-slate-800/80 px-2.5 sm:px-5 py-2.5 sticky top-0 z-40 flex items-center justify-between shadow-md">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Mobile Drawer Toggle Button */}
        <button
          onClick={onToggleMobileMenu}
          className="md:hidden p-2 text-slate-300 hover:text-white bg-[#151c2e] rounded-xl border border-slate-800 active:scale-95 transition shrink-0"
          title="Toggle Navigation Menu"
        >
          {isMobileMenuOpen ? <X className="w-4.5 h-4.5 text-amber-400" /> : <Menu className="w-4.5 h-4.5 text-amber-400" />}
        </button>

        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-sm shrink-0">
            <Store className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
          </div>
          <div className="min-w-0 truncate">
            <h2 className="font-bold text-xs sm:text-base text-white leading-tight truncate">
              {settings.centerName}
            </h2>
            <p className="text-[10px] text-slate-400 font-medium hidden sm:block">Billing Desk & Operations</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {/* Realtime Date & Time Pill - Responsive Short/Long Format */}
        <div className="flex items-center gap-1.5 bg-[#151c2e] border border-amber-500/30 rounded-xl px-2.5 py-1 sm:px-4 sm:py-2 text-slate-100 font-mono font-bold shadow-md">
          <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-amber-400 shrink-0" />
          <span className="tracking-wide text-amber-300 text-[10px] sm:text-sm hidden sm:inline">{fullDateTime}</span>
          <span className="tracking-wide text-amber-300 text-[10px] sm:hidden">{shortTime}</span>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-1.5 sm:p-2.5 text-slate-400 hover:text-white bg-[#151c2e] border border-slate-800 rounded-xl transition shrink-0"
          title="Toggle Dark/Light Mode"
        >
          {isDark ? <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" /> : <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-csc-400" />}
        </button>
      </div>
    </header>
  );
};
