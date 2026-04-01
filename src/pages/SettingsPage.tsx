import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sun, Moon, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { applyTheme, readInitialTheme, THEME_CHANGE_EVENT } from '../theme';

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [theme, setTheme] = useState<'light' | 'dark'>(() => readInitialTheme());

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMessage, setPwMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    const sync = (e: Event) => {
      const d = (e as CustomEvent<'light' | 'dark'>).detail;
      if (d === 'light' || d === 'dark') setTheme(d);
    };
    window.addEventListener(THEME_CHANGE_EVENT, sync as EventListener);
    return () => window.removeEventListener(THEME_CHANGE_EVENT, sync as EventListener);
  }, []);

  const setDesign = async (t: 'light' | 'dark') => {
    setTheme(t);
    applyTheme(t);
    try {
      await fetch('/api/settings/theme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme: t })
      });
    } catch {
      /* ignore */
    }
  };

  const goBack = () => {
    navigate('/dashboard');
  };

  const submitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMessage(null);
    if (newPassword !== confirmPassword) {
      setPwMessage({ type: 'err', text: 'Die neuen Passwörter stimmen nicht überein.' });
      return;
    }
    if (newPassword.length < 6) {
      setPwMessage({ type: 'err', text: 'Das neue Passwort muss mindestens 6 Zeichen haben.' });
      return;
    }
    setPwLoading(true);
    try {
      const res = await fetch('/api/me/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPwMessage({ type: 'err', text: typeof data.error === 'string' ? data.error : 'Passwort konnte nicht geändert werden.' });
        return;
      }
      setPwMessage({ type: 'ok', text: 'Passwort wurde geändert.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      setPwMessage({ type: 'err', text: 'Netzwerkfehler. Bitte erneut versuchen.' });
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b1220] transition-colors">
      <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#071026] px-6 flex items-center gap-4">
        <button
          type="button"
          onClick={goBack}
          className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
        >
          <ArrowLeft size={18} />
          Zurück
        </button>
        <h1 className="text-lg font-bold text-slate-900 dark:text-white">Einstellungen</h1>
      </header>

      <main className="max-w-xl mx-auto px-6 py-10 space-y-8">
        <section className="bg-white dark:bg-[#071026] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Design</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Darstellung der Anwendung</p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setDesign('light')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-sm font-semibold transition-all ${
                theme === 'light'
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
              }`}
            >
              <Sun size={18} />
              Hell
            </button>
            <button
              type="button"
              onClick={() => setDesign('dark')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-sm font-semibold transition-all ${
                theme === 'dark'
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
              }`}
            >
              <Moon size={18} />
              Dunkel
            </button>
          </div>
        </section>

        <section className="bg-white dark:bg-[#071026] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Passwort ändern</h2>
          <form onSubmit={submitPassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Aktuelles Passwort</label>
              <input
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#0b1220] text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Neues Passwort</label>
              <input
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#0b1220] text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Neues Passwort wiederholen</label>
              <input
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#0b1220] text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            {pwMessage && (
              <div
                className={`flex items-center gap-2 text-sm ${
                  pwMessage.type === 'ok' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                }`}
              >
                {pwMessage.type === 'ok' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                {pwMessage.text}
              </div>
            )}
            <button
              type="submit"
              disabled={pwLoading}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2"
            >
              {pwLoading ? <Loader2 className="animate-spin" size={18} /> : null}
              Passwort speichern
            </button>
          </form>
        </section>
      </main>
    </div>
  );
};

export default SettingsPage;
