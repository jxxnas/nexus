import React from 'react';
import { Link } from 'react-router-dom';
import { Monitor, Users, Building2, ArrowRight, LifeBuoy, LayoutDashboard, Clock, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { Ticket, TicketType, User } from '../types';
import { UserMenu } from './UserMenu';

interface LandingPageProps {
  currentUser: User | null;
  onSelectCategory: (type: TicketType) => void;
  onLogout: () => void;
  tickets: Ticket[];
  onSelectTicket: (id: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ 
  currentUser, 
  onSelectCategory, 
  onLogout, 
  tickets,
  onSelectTicket
}) => {
  const categories = [
    { 
      id: 'Incident', 
      title: 'IT Support', 
      description: 'Melden Sie ein technisches Problem oder defekte Hardware.', 
      icon: Monitor, 
      color: 'blue' 
    },
    { 
      id: 'Onboarding', 
      title: 'HR & Onboarding', 
      description: 'Beantragen Sie den Zugang für neue Mitarbeiter oder HR-Services.', 
      icon: Users, 
      color: 'indigo' 
    },
    { 
      id: 'Facility', 
      title: 'Gebäudemanagement', 
      description: 'Melden Sie Gebäudeprobleme oder fordern Sie Wartungsarbeiten an.', 
      icon: Building2, 
      color: 'emerald' 
    },
    { 
      id: 'Request', 
      title: 'Allgemeine Anfrage', 
      description: 'Stellen Sie eine Frage oder fordern Sie eine nicht-technische Dienstleistung an.', 
      icon: LifeBuoy, 
      color: 'slate' 
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b1220] flex flex-col transition-colors duration-300">
      {/* Navigation */}
      <nav className="h-20 bg-white dark:bg-[#071026] border-b border-slate-200 dark:border-slate-800 px-8 flex items-center justify-between sticky top-0 z-10 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-600/20">
            N
          </div>
          <span className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Nexus Portal</span>
        </div>
        
        <div className="flex items-center gap-6">
          {currentUser && (currentUser.role === 'Admin' || currentUser.role === 'Agent' || currentUser.role === 'Worker') && (
            <Link
              to="/backend"
              className="flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              <LayoutDashboard size={18} />
              Backend
            </Link>
          )}
          
          <div className="flex items-center gap-3 pl-6 border-l border-slate-200 dark:border-slate-800">
            <UserMenu currentUser={currentUser} onLogout={onLogout} />
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-16 px-8 max-w-6xl mx-auto w-full text-center space-y-6">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight"
        >
          Wie können wir Ihnen heute helfen?
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto"
        >
          Wählen Sie eine Kategorie aus, um eine neue Serviceanfrage zu stellen oder eine Störung zu melden.
        </motion.p>
      </section>

      {/* Categories Grid */}
      <section className="px-8 pb-12 max-w-6xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((cat, idx) => (
            <motion.button
              key={cat.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * idx }}
              onClick={() => onSelectCategory(cat.id as TicketType)}
              className="group bg-white dark:bg-[#071026] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-indigo-200 dark:hover:border-indigo-500/50 transition-all text-left flex flex-col gap-4"
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${
                cat.color === 'blue' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' :
                cat.color === 'indigo' ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' :
                cat.color === 'emerald' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' :
                'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}>
                <cat.icon size={24} />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {cat.title}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                  {cat.description}
                </p>
              </div>
              <div className="mt-auto pt-2 flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">
                Ticket öffnen <ArrowRight size={14} />
              </div>
            </motion.button>
          ))}
        </div>
      </section>

      {/* My Tickets Section */}
      <section className="px-8 pb-20 max-w-6xl mx-auto w-full space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Meine aktuellen Tickets</h2>
        </div>
        
        {tickets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tickets.slice(0, 4).map((ticket) => (
              <button
                key={ticket.id}
                onClick={() => onSelectTicket(ticket.id)}
                className="flex items-center justify-between p-5 bg-white dark:bg-[#071026] border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-indigo-300 dark:hover:border-indigo-500/50 hover:shadow-md transition-all text-left group"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    ticket.status === 'Open' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' :
                    ticket.status === 'On Hold' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400' :
                    ticket.status === 'Closed Complete' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' :
                    'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                  }`}>
                    {ticket.status === 'Open' ? <Clock size={20} /> : <AlertCircle size={20} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-slate-400 dark:text-slate-500">#{ticket.id}</span>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{ticket.title}</h4>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{ticket.type} • {new Date(ticket.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  ticket.status === 'Open' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' :
                  ticket.status === 'On Hold' ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300' :
                  ticket.status === 'Closed Complete' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300' :
                  'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'
                }`}>
                  {ticket.status === 'Open' ? 'Offen' : 
                   ticket.status === 'On Hold' ? 'Wartend' : 
                   ticket.status === 'Closed Complete' ? 'Abgeschlossen' : 'Abgebrochen'}
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-[#071026] border border-dashed border-slate-300 dark:border-slate-700 rounded-3xl p-12 text-center">
            <p className="text-slate-400 dark:text-slate-500 font-medium">Sie haben noch keine Tickets eröffnet.</p>
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="mt-auto py-12 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#071026] text-center transition-colors">
        <p className="text-sm text-slate-400 dark:text-slate-500">
          © 2026 Nexus ITSM. Alle Rechte vorbehalten.
        </p>
      </footer>
    </div>
  );
};
