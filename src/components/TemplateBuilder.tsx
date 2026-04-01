import React, { useState, useEffect } from 'react';
import { Group } from '../types';
import { Plus, Trash2 } from 'lucide-react';

interface Props {
  groups: Group[];
  onSaved?: () => void;
}

export const TemplateBuilder: React.FC<Props> = ({ groups, onSaved }) => {
  const [title, setTitle] = useState('');
  const [groupId, setGroupId] = useState(groups[0]?.id || '');
  const [fields, setFields] = useState<Array<{ id: string; label: string; type: 'text' | 'checkbox'; required?: boolean }>>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [defaultType, setDefaultType] = useState<'Incident' | 'Request' | 'Onboarding' | 'Facility'>('Incident');
  const [defaultPriority, setDefaultPriority] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('Medium');
  const [tags, setTags] = useState('');
  // tags: comma-separated
  const [saving, setSaving] = useState(false);
  const [titleError, setTitleError] = useState('');

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/templates');
      const data = await res.json();
      setTemplates(data);
    } catch (err) {
      console.error(err);
    }
  };

  const addField = () => {
    setFields(prev => [...prev, { id: Math.random().toString(36).slice(2,9), label: '', type: 'text', required: false }]);
  };

  const removeField = (id: string) => setFields(prev => prev.filter(f => f.id !== id));
  const updateField = (id: string, patch: Partial<{ label: string; type: 'text' | 'checkbox'; required?: boolean }>) => {
    setFields(prev => prev.map(f => f.id === id ? { ...f, ...patch } : f));
  };

  const saveTemplate = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setTitleError('Es wurde kein Titel angegeben. Bitte geben Sie einen Titel für die Vorlage ein.');
      return;
    }
    setTitleError('');
    try {
      setSaving(true);
      try { console.log('TemplateBuilder.saveTemplate:', { title, groupId, fields, defaultType, defaultPriority, tags }); } catch {}
      const payload = {
        title: trimmedTitle,
        group_id: groupId,
        extra_fields: JSON.stringify({ fields, meta: { type: defaultType, priority: defaultPriority, tags: tags.split(',').map(t=>t.trim()).filter(Boolean) } })
      };
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setTitleError(typeof err.error === 'string' ? err.error : 'Speichern fehlgeschlagen.');
        return;
      }
      setTitle('');
      setFields([]);
      setTags('');
      setDefaultType('Incident');
      setDefaultPriority('Medium');
      fetchTemplates();
      if (onSaved) onSaved();
    } catch (err) {
      console.error(err);
    }
    finally { setSaving(false); }
  };

  const deleteTemplate = async (id: string) => {
    if (!confirm('Delete this template?')) return;
    try {
      await fetch(`/api/templates/${id}`, { method: 'DELETE' });
      fetchTemplates();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-[#071026] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        <h3 className="font-bold text-lg mb-4 text-slate-900 dark:text-white">Vorlage erstellen</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <input
              value={title}
              onChange={e => {
                setTitle(e.target.value);
                if (titleError) setTitleError('');
              }}
              placeholder="Titel der Vorlage *"
              aria-invalid={!!titleError}
              aria-describedby={titleError ? 'template-title-error' : undefined}
              className={`px-3 py-2 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 ${titleError ? 'border-red-500 dark:border-red-500 ring-1 ring-red-500' : 'border-slate-300 dark:border-slate-700'}`}
            />
            {titleError && (
              <p id="template-title-error" className="text-sm text-red-600 dark:text-red-400" role="alert">
                {titleError}
              </p>
            )}
          </div>
          <select value={groupId} onChange={e => setGroupId(e.target.value)} className="px-3 py-2 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700 outline-none focus:ring-2 focus:ring-indigo-500">
            {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-4">
          <select value={defaultType} onChange={e => setDefaultType(e.target.value as any)} className="px-3 py-2 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700 outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="Incident">Störung (Incident)</option>
            <option value="Request">Service-Anfrage (Request)</option>
            <option value="Onboarding">Onboarding</option>
            <option value="Facility">Gebäudemanagement</option>
          </select>
          <select value={defaultPriority} onChange={e => setDefaultPriority(e.target.value as any)} className="px-3 py-2 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700 outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="Low">Niedrig</option>
            <option value="Medium">Mittel</option>
            <option value="High">Hoch</option>
            <option value="Critical">Kritisch</option>
          </select>
          <input value={tags} onChange={e => setTags(e.target.value)} placeholder="Tags (kommagetrennt)" className="px-3 py-2 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700 outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-slate-900 dark:text-white">Felder</h4>
            <button onClick={addField} className="flex items-center gap-2 px-3 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"><Plus size={14}/> Feld hinzufügen</button>
          </div>
          <div className="space-y-2">
            {fields.map(f => (
              <div key={f.id} className="flex gap-2 items-center">
                <input value={f.label} onChange={e => updateField(f.id, { label: e.target.value })} placeholder="Bezeichnung" className="px-3 py-2 border rounded-lg flex-1 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700 outline-none focus:ring-2 focus:ring-indigo-500" />
                <select value={f.type} onChange={e => updateField(f.id, { type: e.target.value as any })} className="px-3 py-2 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700 outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="text">Text</option>
                  <option value="checkbox">Checkbox</option>
                </select>
                <label className="flex items-center gap-2 ml-2 text-sm">
                  <input type="checkbox" checked={!!f.required} onChange={(e) => updateField(f.id, { required: e.target.checked })} className="w-4 h-4" />
                  <span className="text-xs">Pflicht</span>
                </label>
                <button onClick={() => removeField(f.id)} className="px-2 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>

          <div className="pt-4">
            <button disabled={saving} onClick={saveTemplate} className={`px-4 py-2 rounded-lg text-white font-bold transition-all ${saving ? 'bg-emerald-400 cursor-wait' : 'bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/20'}`}>
              {saving ? 'Speichert…' : 'Vorlage speichern'}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-[#071026] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        <h3 className="font-bold text-lg mb-4 text-slate-900 dark:text-white">Vorhandene Vorlagen</h3>
        <div className="space-y-3">
          {templates.map(t => (
            <div key={t.id} className="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-800/30 transition-colors">
              <div>
                <div className="font-bold text-slate-900 dark:text-white">{t.title}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Gruppe: {groups.find(g => g.id === t.group_id)?.name || '—'}</div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => deleteTemplate(t.id)} className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">Löschen</button>
              </div>
            </div>
          ))}
          {templates.length === 0 && <div className="text-slate-400 dark:text-slate-500 italic text-sm">Noch keine Vorlagen vorhanden.</div>}
        </div>
      </div>
    </div>
  );
};

export default TemplateBuilder;
