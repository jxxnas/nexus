import React from 'react';
import { Ticket, TicketStatus, TicketPriority } from '../types';
import { Clock, AlertCircle, User, Layers } from 'lucide-react';

interface TicketListProps {
  tickets: Ticket[];
  onSelectTicket: (ticket: Ticket) => void;
}

export const TicketList: React.FC<TicketListProps> = ({ tickets, onSelectTicket }) => {
  const getStatusClass = (status: TicketStatus) => {
    switch (status) {
      case 'Open': return 'status-open';
      case 'On Hold': return 'status-on-hold';
      case 'Closed Complete': return 'status-closed-complete';
      case 'Failed': return 'status-failed';
      default: return '';
    }
  };

  const getPriorityClass = (priority: TicketPriority) => {
    switch (priority) {
      case 'Low': return 'priority-low';
      case 'Medium': return 'priority-medium';
      case 'High': return 'priority-high';
      case 'Critical': return 'priority-critical';
      default: return '';
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#071026] shadow-sm transition-colors">
      <table className="w-full text-left border-collapse">
        <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
          <tr>
            <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">ID</th>
            <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Titel</th>
            <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
            <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Priorität</th>
            <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Gruppe</th>
            <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Besitzer</th>
            <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Erstellt</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {tickets.map((ticket) => (
            <tr 
              key={ticket.id} 
              onClick={() => onSelectTicket(ticket)}
              className="hover:bg-slate-50 dark:hover:bg-slate-800/30 cursor-pointer transition-colors group"
            >
              <td className="px-6 py-4">
                <span className="font-mono text-xs text-slate-400 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">#{ticket.id}</span>
              </td>
              <td className="px-6 py-4">
                <div className="flex flex-col">
                  <span className="font-medium text-slate-900 dark:text-white">{ticket.title}</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    {ticket.type === 'Incident' ? 'Störung' : ticket.type === 'Request' ? 'Anfrage' : ticket.type === 'Onboarding' ? 'Onboarding' : 'Gebäude'} {ticket.parent_id && <Layers size={12} className="text-indigo-500" />}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4">
                <span className={`status-badge ${getStatusClass(ticket.status)}`}>
                  {ticket.status === 'Open' ? 'Offen' : ticket.status === 'On Hold' ? 'Wartend' : ticket.status === 'Closed Complete' ? 'Abgeschlossen' : 'Fehlgeschlagen'}
                </span>
              </td>
              <td className="px-6 py-4">
                <span className={`text-sm font-medium ${getPriorityClass(ticket.priority)}`}>
                  {ticket.priority === 'Low' ? 'Niedrig' : ticket.priority === 'Medium' ? 'Mittel' : ticket.priority === 'High' ? 'Hoch' : 'Kritisch'}
                </span>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <User size={14} className="text-slate-400 dark:text-slate-500" />
                  {ticket.group_name || 'Nicht zugewiesen'}
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    ticket.assigned_name ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                  }`}>
                    {ticket.assigned_name ? ticket.assigned_name.charAt(0) : '?'}
                  </div>
                  <span className={ticket.assigned_name ? 'font-medium text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'}>
                    {ticket.assigned_name || 'Nicht zugewiesen'}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <Clock size={14} />
                  {new Date(ticket.created_at).toLocaleDateString()}
                </div>
              </td>
            </tr>
          ))}
          {tickets.length === 0 && (
            <tr>
              <td colSpan={7} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                Keine Tickets gefunden.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
