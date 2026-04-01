import React from 'react';
import { LayoutDashboard, Ticket as TicketIcon, Users, Settings, Plus, ChevronRight, Search, Filter, Clock, AlertCircle } from 'lucide-react';

import { User } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: User | null;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, currentUser }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Backend', icon: LayoutDashboard },
    { id: 'tickets', label: 'Tickets', icon: TicketIcon },
    { id: 'groups', label: 'Gruppen', icon: Users, roles: ['Admin', 'Agent'] },
    { id: 'users', label: 'Benutzer', icon: Settings, roles: ['Admin', 'Agent'] },
  ];

  const filteredItems = menuItems.filter(item => 
    !item.roles || (currentUser && item.roles.includes(currentUser.role))
  );

  return (
    <aside className="w-64 h-screen bg-white dark:bg-[#071026] text-slate-600 dark:text-slate-300 flex flex-col border-r border-slate-200 dark:border-slate-800 transition-colors">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
          N
        </div>
        <span className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Nexus ITSM</span>
      </div>
      
      <nav className="flex-1 px-4 py-4 space-y-1">
        {filteredItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 ${
              activeTab === item.id 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                : 'hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <item.icon size={18} />
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

    </aside>
  );
};
