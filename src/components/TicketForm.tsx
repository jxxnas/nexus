import React, { useState, useEffect } from 'react';
import { Group, TicketType, TicketPriority, User } from '../types';
import { X, Send, Info, User as UserIcon, Mail } from 'lucide-react';
import { motion } from 'motion/react';

interface TicketFormProps {
  groups: Group[];
  onClose: () => void;
  onSubmit: (data: any) => void;
  defaultType?: TicketType;
  defaultPriority?: TicketPriority;
  currentUser: User | null;
  templateExtraFields?: any;
  initialTitle?: string;
  titleReadOnly?: boolean;
  /** Wenn aus Vorlage: Zielgruppe mitsenden (Server hat Vorrang vor Typ→Gruppe) */
  templateGroupId?: string;
}

export const TicketForm: React.FC<TicketFormProps> = ({ 
  groups, 
  onClose, 
  onSubmit, 
  defaultType, 
  defaultPriority,
  currentUser, 
  templateExtraFields,
  initialTitle,
  titleReadOnly,
  templateGroupId
}) => {
  const [type, setType] = useState<TicketType>(defaultType || 'Incident');
  const [title, setTitle] = useState(initialTitle || '');
  const [description, setDescription] = useState('');
  const [requestedForId, setRequestedForId] = useState<string>(currentUser?.id || '');
  const [opener, setOpener] = useState(currentUser?.name || '');
  const [openerEmail, setOpenerEmail] = useState(currentUser?.email || '');
  const [priority, setPriority] = useState<TicketPriority>(defaultPriority || 'Medium');
  const [dynamicFields, setDynamicFields] = useState<Record<string, any>>({});
  const [allUsers, setAllUsers] = useState<User[]>([]);

  useEffect(() => {
    if (defaultType) setType(defaultType);
    if (defaultPriority) setPriority(defaultPriority);
    if (initialTitle) setTitle(initialTitle);
  }, [defaultType, defaultPriority, initialTitle]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      setAllUsers(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRequestedForChange = (val: string) => {
    setRequestedForId(val);
    if (val === 'other') {
      setOpener('');
      setOpenerEmail('');
    } else {
      const user = allUsers.find(u => u.id === val);
      if (user) {
        setOpener(user.name);
        setOpenerEmail(user.email);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      title,
      description,
      opener: requestedForId === 'other' ? opener : null,
      opener_email: requestedForId === 'other' ? openerEmail : null,
      requested_for_id: requestedForId === 'other' ? null : requestedForId,
      type,
      priority,
      dynamic_fields: dynamicFields,
      ...(templateGroupId ? { group_id: templateGroupId } : {})
    });
  };

  const renderDynamicFields = () => {
    const templateFields = Array.isArray(templateExtraFields?.fields) 
      ? templateExtraFields.fields 
      : (Array.isArray(templateExtraFields) ? templateExtraFields : []);

    if (templateFields.length > 0) {
      return (
        <div className="space-y-4 p-4 bg-slate-50 dark:bg-[#071026] rounded-xl border border-slate-200 dark:border-slate-800 transition-colors">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 mb-2">
            <Info size={16} className="text-indigo-600" />
            <span className="text-sm font-semibold">Informationen</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templateFields.map((f: any) => (
              <div key={f.id}>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{f.label}</label>
                {f.type === 'checkbox' ? (
                  <input 
                    type="checkbox" 
                    className="w-5 h-5 rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500"
                    onChange={(e) => setDynamicFields({ ...dynamicFields, [f.label]: e.target.checked })}
                    {...(f.required ? { required: true } : {})}
                  />
                ) : (
                  <input 
                    type="text" 
                    className="w-full px-3 py-2 bg-white dark:bg-[#0b1220] border border-slate-200 dark:border-slate-800 rounded-md text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    onChange={(e) => setDynamicFields({ ...dynamicFields, [f.label]: e.target.value })}
                    {...(f.required ? { required: true } : {})}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (type === 'Onboarding') {
      return (
        <div className="space-y-4 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-100 dark:border-indigo-900/30 transition-colors">
          <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400 mb-2">
            <Info size={16} />
            <span className="text-sm font-semibold">Onboarding Details</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-indigo-600 dark:text-indigo-400 mb-1">Name des Mitarbeiters</label>
              <input 
                type="text" 
                className="w-full px-3 py-2 bg-white dark:bg-[#071026] border border-indigo-200 dark:border-indigo-900/50 rounded-md text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                onChange={(e) => setDynamicFields({ ...dynamicFields, employee_name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-indigo-600 dark:text-indigo-400 mb-1">Startdatum</label>
              <input 
                type="date" 
                className="w-full px-3 py-2 bg-white dark:bg-[#071026] border border-indigo-200 dark:border-indigo-900/50 rounded-md text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                onChange={(e) => setDynamicFields({ ...dynamicFields, start_date: e.target.value })}
              />
            </div>
          </div>
          <p className="text-[10px] text-indigo-500 dark:text-indigo-400 italic mt-2">
            * Das Erstellen eines Onboarding-Tickets generiert automatisch Aufgaben für die IT- und Facility-Teams.
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white dark:bg-[#0b1220] w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-colors"
      >
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-[#071026] transition-colors">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Neues Ticket erstellen</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors">
            <X size={20} className="text-slate-500 dark:text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 bg-white dark:bg-[#0b1220] transition-colors">
          <div className="grid grid-cols-2 gap-6">
            {!templateExtraFields && (
              <>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Ticket-Typ</label>
                  <select 
                    value={type}
                    onChange={(e) => setType(e.target.value as TicketType)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#071026] border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  >
                    <option value="Incident">Störung (Incident)</option>
                    <option value="Request">Serviceanfrage (Request)</option>
                    <option value="Onboarding">Onboarding</option>
                    <option value="Facility">Gebäudemanagement (Facility)</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Priorität</label>
                  <select 
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TicketPriority)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#071026] border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  >
                    <option value="Low">Niedrig</option>
                    <option value="Medium">Mittel</option>
                    <option value="High">Hoch</option>
                    <option value="Critical">Kritisch</option>
                  </select>
                </div>
              </>
            )}
            {templateExtraFields && (
              <div className="col-span-2 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-900/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-600 rounded-lg text-white">
                    <Info size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">{initialTitle}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Typ: {type} • Priorität: {priority}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Titel</label>
              <input 
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Kurze Zusammenfassung..."
                readOnly={!!initialTitle || !!titleReadOnly}
                className={`w-full px-4 py-2.5 ${initialTitle || titleReadOnly ? 'bg-slate-100 dark:bg-[#071026] text-slate-600 dark:text-slate-400' : 'bg-slate-50 dark:bg-[#071026] text-slate-900 dark:text-white'} border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all`}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Anforderer</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <select 
                  value={requestedForId}
                  onChange={(e) => handleRequestedForChange(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-[#071026] border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none"
                >
                  <option value="">Benutzer auswählen...</option>
                  {allUsers.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                  ))}
                  <option value="other">Andere (Manuelle Eingabe)</option>
                </select>
              </div>
            </div>
          </div>

          {requestedForId === 'other' ? (
            <div className="grid grid-cols-2 gap-6 p-4 bg-slate-50 dark:bg-[#071026] rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Vollständiger Name</label>
                <input 
                  required
                  value={opener}
                  onChange={(e) => setOpener(e.target.value)}
                  placeholder="Für wen ist das?"
                  className="w-full px-4 py-2.5 bg-white dark:bg-[#0b1220] border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">E-Mail-Adresse</label>
                <input 
                  required
                  type="email"
                  value={openerEmail}
                  onChange={(e) => setOpenerEmail(e.target.value)}
                  placeholder="email@beispiel.de"
                  className="w-full px-4 py-2.5 bg-white dark:bg-[#0b1220] border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
              </div>
            </div>
          ) : requestedForId && (
            <div className="p-4 bg-slate-50 dark:bg-[#071026] rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">
                {opener.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">{opener}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Mail size={12} /> {openerEmail}
                </p>
              </div>
            </div>
          )}

          {!templateExtraFields && (
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Weiter Infos</label>
              <textarea 
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detaillierte Beschreibung..."
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#071026] border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
              />
            </div>
          )}

          {renderDynamicFields()}

          {templateExtraFields !== undefined && (
            <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Zusätzliche Informationen</label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Hier können Sie ergänzende Hinweise, Kontext oder Details eintragen …"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#071026] border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
              />
            </div>
          )}
        </form>

        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-[#071026] flex justify-end gap-3">
          <button 
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            Abbrechen
          </button>
          <button 
            onClick={handleSubmit}
            className="px-6 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all flex items-center gap-2"
          >
            <Send size={16} />
            Ticket erstellen
          </button>
        </div>
      </motion.div>
    </div>
  );
};
