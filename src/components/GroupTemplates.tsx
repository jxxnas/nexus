import React, { useEffect, useState } from 'react';
import { Group } from '../types';
import { Plus } from 'lucide-react';

interface Props {
  groupId: string;
  groups: Group[];
  onCreateFromTemplate?: (template: any) => void;
}

export const GroupTemplates: React.FC<Props> = ({ groupId, groups, onCreateFromTemplate }) => {
  const [templates, setTemplates] = useState<any[]>([]);

  useEffect(() => {
    if (!groupId) return;
    fetchTemplates();
  }, [groupId]);

  const fetchTemplates = async () => {
    try {
      const res = await fetch(`/api/templates?group_id=${groupId}`);
      const data = await res.json();
      console.log('Fetched templates for group', groupId, ':', data);
      // normalize extra_fields: support old array or new object shape
      const normalized = data.map((t: any) => {
        let extra = t.extra_fields || [];
        try {
          // if stored as JSON string, parse
          if (typeof extra === 'string') {
            extra = JSON.parse(extra);
          }
        } catch (err) {
          // keep as-is
        }
        return { ...t, extra_fields: extra };
      });
      setTemplates(normalized);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="bg-white dark:bg-[#071026] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-slate-900 dark:text-white">Aus Vorlage erstellen</h3>
        <div className="text-sm text-slate-500 dark:text-slate-400 font-medium">Vorlagen für {groups.find(g => g.id === groupId)?.name}</div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {templates.map(t => (
          <div key={t.id} className="p-4 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-800/50 flex flex-col justify-between transition-colors">
            <div>
              <div className="font-bold text-slate-900 dark:text-white">{t.title}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">Felder: {Array.isArray(t.extra_fields?.fields) ? t.extra_fields.fields.length : (Array.isArray(t.extra_fields) ? t.extra_fields.length : 0)}</div>
              {t.extra_fields?.meta && (
                <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">Typ: {t.extra_fields.meta.type} • Priorität: {t.extra_fields.meta.priority} • Tags: {(t.extra_fields.meta.tags || []).join(', ')}</div>
              )}
            </div>
            <div className="mt-4 flex gap-2">
              <button onClick={() => { console.log('Create button clicked for template:', t); onCreateFromTemplate && onCreateFromTemplate(t); }} className="w-full px-3 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors">Erstellen</button>
            </div>
          </div>
        ))}
        {templates.length === 0 && (
          <div className="text-slate-400 dark:text-slate-500 italic text-sm">Keine Vorlagen für diese Gruppe vorhanden.</div>
        )}
      </div>
    </div>
  );
};

export default GroupTemplates;
