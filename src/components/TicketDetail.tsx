import React, { useState, useEffect } from 'react';
import { User as UserType, Ticket, TicketStatus, Group } from '../types';
import { X, Clock, User, AlertCircle, CheckCircle2, ArrowRight, Layers, Info, ArrowLeft, Loader2, MessageSquare, Mail, Users, UserCheck } from 'lucide-react';
import { motion } from 'motion/react';

interface TicketDetailProps {
  ticketId: string;
  groups: Group[];
  currentUser: UserType | null;
  onClose: () => void;
  onUpdate: () => void;
}

export const TicketDetail: React.FC<TicketDetailProps> = ({ ticketId, groups, currentUser, onClose, onUpdate }) => {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [allUsers, setAllUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [commentAuthor, setCommentAuthor] = useState(currentUser?.name || '');
  const [pendingUpdates, setPendingUpdates] = useState<Partial<Ticket>>({});

  useEffect(() => {
    fetchTicket();
    fetchUsers();
    if (currentUser) {
      setCommentAuthor(currentUser.name);
    }
  }, [ticketId, currentUser]);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      setAllUsers(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTicket = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tickets/${ticketId}`);
      const data = await res.json();
      setTicket(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateTicket = async (updates: Partial<Ticket>) => {
    try {
      await fetch(`/api/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      fetchTicket();
      onUpdate();
    } catch (err) {
      console.error(err);
    }
  };

  const handlePropertyChange = (updates: Partial<Ticket>) => {
    setPendingUpdates(prev => ({ ...prev, ...updates }));
  };

  const saveChanges = async () => {
    if (Object.keys(pendingUpdates).length === 0) return;
    await updateTicket(pendingUpdates);
    setPendingUpdates({});
  };

  const postComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText || !commentAuthor) return;
    try {
      await fetch(`/api/tickets/${ticketId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ author: commentAuthor, text: commentText })
      });
      setCommentText('');
      fetchTicket();
    } catch (err) {
      console.error(err);
    }
  };

  const formatBerlinTime = (dateStr: string) => {
    return new Intl.DateTimeFormat('de-DE', {
      timeZone: 'Europe/Berlin',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(new Date(dateStr));
  };

  if (loading) return (
    <div className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-[#0b1220]">
      <Loader2 className="animate-spin text-indigo-600" size={48} />
    </div>
  );
  if (!ticket) return null;

  const hasPendingChanges = Object.keys(pendingUpdates).length > 0;
  const filteredUsers = allUsers.filter(u => 
    u.group_ids?.includes(ticket.group_id)
  );
  const dynamicFieldEntries = Object.entries(ticket.dynamic_fields || {}).filter(([, value]) => {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    return true;
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-[#0b1220] overflow-hidden transition-colors"
    >
      {/* Header */}
      <div className="px-8 py-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#071026] flex items-center justify-between sticky top-0 z-20 transition-colors">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
            <ArrowLeft size={20} className="text-slate-500 dark:text-slate-400" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm text-slate-400 dark:text-slate-500">#{ticket.id}</span>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{ticket.title}</h2>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Erstellt am {formatBerlinTime(ticket.created_at)} (Berlin)</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {hasPendingChanges && (
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setPendingUpdates({})}
                className="px-4 py-2 text-slate-500 dark:text-slate-400 text-sm font-bold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
              >
                Verwerfen
              </button>
              <button 
                onClick={saveChanges}
                className="px-4 py-2 bg-emerald-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all flex items-center gap-2"
              >
                <CheckCircle2 size={16} />
                Änderungen speichern
              </button>
            </div>
          )}
          <select 
            value={pendingUpdates.status !== undefined ? pendingUpdates.status : ticket.status}
            onChange={(e) => handlePropertyChange({ status: e.target.value as TicketStatus })}
            className={`px-4 py-2 rounded-xl text-sm font-bold border-none ring-2 ring-transparent focus:ring-indigo-500 outline-none transition-all ${
              (pendingUpdates.status || ticket.status) === 'Open' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 
              (pendingUpdates.status || ticket.status) === 'On Hold' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' : 
              (pendingUpdates.status || ticket.status) === 'Closed Complete' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' :
              'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
            }`}
          >
            <option value="Open">Offen</option>
            <option value="On Hold">Wartend</option>
            <option value="Closed Complete">Abgeschlossen</option>
            <option value="Failed">Fehlgeschlagen</option>
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Description */}
          <div className="bg-white dark:bg-[#071026] p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 transition-colors">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Weiter Infos</h3>
            <div className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
              {ticket.description || 'Keine Beschreibung angegeben.'}
            </div>
          </div>

          {dynamicFieldEntries.length > 0 && (
            <div className="bg-white dark:bg-[#071026] p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 transition-colors">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Info size={18} className="text-indigo-500" />
                Informationen
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dynamicFieldEntries.map(([key, value]) => (
                  <div key={key} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">{key}</p>
                    <p className="text-sm text-slate-800 dark:text-slate-200 break-words">
                      {typeof value === 'boolean' ? (value ? 'Ja' : 'Nein') : String(value)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comments Section */}
          <div className="bg-white dark:bg-[#071026] p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 transition-colors">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <MessageSquare size={20} className="text-indigo-500" />
              Aktivitätsprotokoll
            </h3>
            
            <div className="space-y-6">
              {ticket.comments && ticket.comments.map(comment => (
                <div key={comment.id} className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 font-bold shrink-0">
                    {comment.author.charAt(0)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">{comment.author}</span>
                      <span className="text-xs text-slate-400 dark:text-slate-500">{formatBerlinTime(comment.created_at)}</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 text-sm text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-slate-800">
                      {comment.text}
                    </div>
                  </div>
                </div>
              ))}
              {(!ticket.comments || ticket.comments.length === 0) && (
                <div className="text-center py-8 text-slate-400 dark:text-slate-500 italic">
                  Noch keine Aktivitäten aufgezeichnet.
                </div>
              )}
            </div>

            <form onSubmit={postComment} className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
              <textarea 
                required
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Schreiben Sie einen Kommentar oder ein Update..."
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 resize-none transition-all"
                rows={3}
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-400 dark:text-slate-500">Posten als <span className="font-bold text-slate-600 dark:text-slate-400">{currentUser?.name}</span></p>
                <button 
                  type="submit"
                  className="px-6 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all"
                >
                  Update posten
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#071026] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 transition-colors">
            <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Eigenschaften</h3>
            
            <div className="space-y-4">
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500">Ticket-Besitzer (Zugewiesen an)</p>
                <div className="relative">
                  <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={14} />
                  <select
                    value={pendingUpdates.assigned_to !== undefined ? (pendingUpdates.assigned_to || '') : (ticket.assigned_to || '')}
                    onChange={(e) => handlePropertyChange({ assigned_to: e.target.value || null })}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none"
                  >
                    <option value="">Nicht zugewiesen</option>
                    {filteredUsers.map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500">Eröffnet von</p>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-400">
                    {ticket.opened_by_name?.charAt(0) || 'S'}
                  </div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{ticket.opened_by_name || 'System'}</p>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500">Angefordert für</p>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                    {ticket.requested_for_name?.charAt(0) || '?'}
                  </div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{ticket.requested_for_name || 'Unbekannt'}</p>
                </div>
                {ticket.requested_for_email && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 ml-8">
                    <Mail size={10} /> {ticket.requested_for_email}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500">Zuweisungsgruppe</p>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={14} />
                  <select
                    value={pendingUpdates.group_id !== undefined ? pendingUpdates.group_id : ticket.group_id}
                    onChange={(e) => handlePropertyChange({ group_id: e.target.value, assigned_to: null })}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none"
                  >
                    {groups.map(g => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500">Priorität</p>
                <div className="relative">
                  <AlertCircle className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={14} />
                  <select
                    value={pendingUpdates.priority !== undefined ? pendingUpdates.priority : ticket.priority}
                    onChange={(e) => handlePropertyChange({ priority: e.target.value as any })}
                    className={`w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none ${
                      (pendingUpdates.priority || ticket.priority) === 'Critical' ? 'text-red-600' : 
                      (pendingUpdates.priority || ticket.priority) === 'High' ? 'text-orange-600' : 
                      'text-slate-900 dark:text-white'
                    }`}
                  >
                    <option value="Low">Niedrig</option>
                    <option value="Medium">Mittel</option>
                    <option value="High">Hoch</option>
                    <option value="Critical">Kritisch</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500">Typ</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white">{ticket.type === 'Incident' ? 'Störung' : ticket.type === 'Request' ? 'Anfrage' : ticket.type === 'Onboarding' ? 'Onboarding' : 'Gebäude'}</p>
              </div>
            </div>
          </div>

          {/* Sub-tasks */}
          {ticket.children && ticket.children.length > 0 && (
            <div className="bg-white dark:bg-[#071026] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 transition-colors">
              <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Unteraufgaben</h3>
              <div className="space-y-3">
                {ticket.children.map(child => (
                  <div key={child.id} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between group cursor-pointer hover:border-indigo-200 dark:hover:border-indigo-500 transition-all">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        child.status === 'Closed Complete' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                      }`}>
                        {child.status === 'Closed Complete' ? <CheckCircle2 size={16} /> : <Clock size={16} />}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[120px]">{child.title}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">#{child.id}</p>
                      </div>
                    </div>
                    <ArrowRight size={14} className="text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 transition-colors" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
