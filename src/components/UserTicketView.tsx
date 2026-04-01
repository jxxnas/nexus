import React, { useEffect, useState } from 'react';
import { Ticket, User, Group, Comment } from '../types';
import { Loader2, ArrowLeft, MessageSquare, Mail, Clock } from 'lucide-react';

interface Props {
  ticketId: string;
  currentUser: User | null;
  onClose: () => void;
}

export const UserTicketView: React.FC<Props> = ({ ticketId, currentUser, onClose }) => {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    fetchTicket();
  }, [ticketId]);

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

  const postComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText || !currentUser) return;
    try {
      await fetch(`/api/tickets/${ticketId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ author: currentUser.name, text: commentText })
      });
      setCommentText('');
      fetchTicket();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 dark:bg-black/60">
      <Loader2 className="animate-spin text-indigo-600" size={48} />
    </div>
  );
  if (!ticket) return null;
  const dynamicFieldEntries = Object.entries(ticket.dynamic_fields || {}).filter(([, value]) => {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    return true;
  });

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-[#071026] overflow-hidden rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
      <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-[#071026] sticky top-0 z-10 transition-colors">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-400 dark:text-slate-500">#{ticket.id}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                ticket.status === 'Open' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
                ticket.status === 'On Hold' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' :
                ticket.status === 'Closed Complete' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' :
                'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
              }`}>
                {ticket.status === 'Open' ? 'Offen' : ticket.status === 'On Hold' ? 'Wartend' : ticket.status === 'Closed Complete' ? 'Abgeschlossen' : 'Fehlgeschlagen'}
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{ticket.title}</h3>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {ticket.type === 'Incident' ? 'Störung' : ticket.type === 'Request' ? 'Anfrage' : ticket.type === 'Onboarding' ? 'Onboarding' : 'Gebäude'} • {new Date(ticket.created_at).toLocaleString('de-DE')}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        <div className="bg-slate-50 dark:bg-slate-800/30 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 transition-colors">
          <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Weiter Infos</h4>
          <div className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
            {ticket.description || 'Keine weiteren Infos angegeben.'}
          </div>
        </div>

        {dynamicFieldEntries.length > 0 && (
          <div className="bg-slate-50 dark:bg-slate-800/30 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 transition-colors">
            <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Informationen</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {dynamicFieldEntries.map(([key, value]) => (
                <div key={key} className="p-3 rounded-xl bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                  <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{key}</p>
                  <p className="text-sm text-slate-700 dark:text-slate-200 break-words">
                    {typeof value === 'boolean' ? (value ? 'Ja' : 'Nein') : String(value)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-6">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <MessageSquare size={18} className="text-indigo-500" /> 
            Aktivitätsprotokoll
          </h4>
          
          <div className="space-y-4">
            {ticket.comments && ticket.comments.length > 0 ? (
              ticket.comments.map(c => (
                <div key={c.id} className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-400 shrink-0">
                    {c.author.charAt(0)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">{c.author}</span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">{new Date(c.created_at).toLocaleString('de-DE')}</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-sm text-slate-700 dark:text-slate-300 transition-colors">
                      {c.text}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-400 dark:text-slate-500 italic text-sm">
                Noch keine Aktivitäten aufgezeichnet.
              </div>
            )}
          </div>
        </div>

        <form onSubmit={postComment} className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
          <textarea 
            required
            value={commentText} 
            onChange={(e) => setCommentText(e.target.value)} 
            className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 resize-none transition-all" 
            placeholder="Einen Kommentar oder ein Update hinzufügen..." 
            rows={3}
          />
          <div className="flex justify-end">
            <button 
              type="submit" 
              disabled={!commentText.trim()}
              className="px-6 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Update posten
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserTicketView;
