import React, { useEffect, useState } from 'react';
import GroupTemplates from './GroupTemplates';
import TemplateBuilder from './TemplateBuilder';
import { Group, User } from '../types';

interface Props {
  groupId: string | null;
  groups: Group[];
  currentUser: User | null;
  onBack: () => void;
  onCreateFromTemplate: (t: any) => void;
  onOpenTemplateBuilder: () => void;
}

const TemplatesPage: React.FC<Props> = ({ groupId, groups, currentUser, onBack, onCreateFromTemplate, onOpenTemplateBuilder }) => {
  if (!groupId) return (
    <div className="p-8">
      <div className="max-w-3xl mx-auto bg-white dark:bg-[#071026] p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center transition-colors">
        <p className="text-slate-500 dark:text-slate-400">Keine Gruppe ausgewählt.</p>
        <div className="mt-4">
          <button onClick={onBack} className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors">Zurück</button>
        </div>
      </div>
    </div>
  );

  const [mode, setMode] = useState<'list' | 'builder'>('list');

  useEffect(() => {
    if (!groupId) setMode('list');
  }, [groupId]);

  if (mode === 'builder') {
    return (
      <div className="p-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button onClick={() => setMode('list')} className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Zurück</button>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Vorlagen-Editor</h1>
            </div>
          </div>
          <div className="bg-white dark:bg-[#071026] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
            <TemplateBuilder groups={groups} onSaved={() => { setMode('list'); if (onOpenTemplateBuilder) onOpenTemplateBuilder(); }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Zurück</button>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Schnellerstellung — {groups.find(g => g.id === groupId)?.name}</h1>
          </div>
          {currentUser && (currentUser.role === 'Admin' || currentUser.role === 'Agent') && (
            <button onClick={() => setMode('builder')} className="px-3 py-2 bg-white dark:bg-[#071026] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">Vorlage erstellen</button>
          )}
        </div>

        <GroupTemplates groupId={groupId} groups={groups} onCreateFromTemplate={onCreateFromTemplate} />
      </div>
    </div>
  );
};

export default TemplatesPage;
