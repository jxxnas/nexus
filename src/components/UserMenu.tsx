import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, Settings, LogOut } from 'lucide-react';
import { User } from '../types';

interface UserMenuProps {
  currentUser: User | null;
  onLogout: () => void;
}

export const UserMenu: React.FC<UserMenuProps> = ({ currentUser, onLogout }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  if (!currentUser) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <div className="flex flex-col items-end min-w-0">
          <span className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[180px]">{currentUser.name}</span>
          <span className="text-xs text-slate-500 dark:text-slate-400">{currentUser.role}</span>
        </div>
        <ChevronDown size={16} className={`text-slate-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 w-52 py-1 bg-white dark:bg-[#071026] border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50"
        >
          <Link
            to="/settings"
            role="menuitem"
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            onClick={() => setOpen(false)}
          >
            <Settings size={16} className="text-slate-400" />
            Einstellungen
          </Link>
          <button
            type="button"
            role="menuitem"
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors text-left"
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
          >
            <LogOut size={16} />
            Abmelden
          </button>
        </div>
      )}
    </div>
  );
};
