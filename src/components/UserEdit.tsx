import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, Group } from '../types';
import { 
  User as UserIcon, 
  Shield, 
  Mail, 
  Lock, 
  Users, 
  Trash2, 
  Save, 
  ArrowLeft,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface UserEditProps {
  groups: Group[];
}

export const UserEdit: React.FC<UserEditProps> = ({ groups }) => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'Agent' | 'Admin' | 'Worker' | 'User'>('Agent');
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);

  useEffect(() => {
    fetchUser();
  }, [userId]);

  const fetchUser = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/users');
      const allUsers: User[] = await res.json();
      const foundUser = allUsers.find(u => u.id === userId);
      
      if (foundUser) {
        setUser(foundUser);
        setName(foundUser.name);
        setUsername(foundUser.username);
        setEmail(foundUser.email);
        setRole(foundUser.role);
        setSelectedGroups(foundUser.group_ids || []);
      } else {
        setError('Benutzer nicht gefunden');
      }
    } catch (err) {
      console.error(err);
      setError('Fehler beim Laden des Benutzers');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);
    
    try {
      const updateData: any = {
        name,
        username,
        email,
        role,
        group_ids: selectedGroups
      };
      
      if (password) {
        updateData.password = password;
      }
      
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });
      
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError('Fehler beim Speichern');
      }
    } catch (err) {
      console.error(err);
      setError('Netzwerkfehler beim Speichern');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'DELETE'
      });
      
      if (res.ok) {
        navigate('/backend/users');
      } else {
        setError('Fehler beim Löschen');
      }
    } catch (err) {
      console.error(err);
      setError('Netzwerkfehler beim Löschen');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user && !loading) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Benutzer nicht gefunden</h2>
        <button 
          onClick={() => navigate('/backend/users')}
          className="mt-4 text-indigo-600 hover:underline"
        >
          Zurück zur Liste
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/backend/users')}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-600 dark:text-slate-400"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Benutzer bearbeiten</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Verwalten Sie Details, Rollen und Gruppen für {user?.name}</p>
          </div>
        </div>
        
        <button 
          onClick={handleDelete}
          className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-bold rounded-xl hover:bg-red-100 dark:hover:bg-red-900/40 transition-all"
        >
          <Trash2 size={18} />
          Benutzer löschen
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-[#071026] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
          >
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UserIcon size={18} className="text-indigo-600" />
                Stammdaten
              </h3>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Vollständiger Name</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                      required 
                      value={name} 
                      onChange={e => setName(e.target.value)} 
                      className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white" 
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Benutzername</label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                      required 
                      value={username} 
                      onChange={e => setUsername(e.target.value)} 
                      className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white" 
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">E-Mail-Adresse</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    required 
                    type="email" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white" 
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Passwort ändern (leer lassen zum Beibehalten)</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    type="password" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white" 
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {success && (
                    <motion.span 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-emerald-600 dark:text-emerald-400 text-sm flex items-center gap-1"
                    >
                      <CheckCircle2 size={16} /> Änderungen gespeichert
                    </motion.span>
                  )}
                  {error && (
                    <span className="text-red-600 dark:text-red-400 text-sm flex items-center gap-1">
                      <AlertCircle size={16} /> {error}
                    </span>
                  )}
                </div>
                <button 
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 disabled:opacity-50 transition-all"
                >
                  <Save size={18} />
                  {saving ? 'Speichert...' : 'Änderungen speichern'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>

        {/* Right Column: Role & Groups */}
        <div className="space-y-6">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-[#071026] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
          >
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Shield size={18} className="text-indigo-600" />
                Berechtigungen
              </h3>
            </div>
            <div className="p-6 space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Rolle</label>
                <div className="grid grid-cols-1 gap-2">
                  {(['User', 'Worker', 'Agent', 'Admin'] as const).map(r => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`px-4 py-3 rounded-xl border text-sm font-bold text-left transition-all ${
                        role === r 
                          ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-600 text-indigo-600 dark:text-indigo-400' 
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      {r === 'User' ? 'Benutzer' : r === 'Worker' ? 'Mitarbeiter' : r === 'Agent' ? 'Agent' : 'Administrator'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Users size={16} />
                  Gruppenzugehörigkeit
                </label>
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {groups.map(group => (
                    <button
                      key={group.id}
                      type="button"
                      onClick={() => {
                        setSelectedGroups(prev => 
                          prev.includes(group.id) 
                            ? prev.filter(id => id !== group.id) 
                            : [...prev, group.id]
                        );
                      }}
                      className={`w-full px-4 py-3 rounded-xl border text-sm font-bold text-left transition-all flex items-center justify-between ${
                        selectedGroups.includes(group.id)
                          ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-600 text-emerald-600 dark:text-emerald-400' 
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      {group.name}
                      {selectedGroups.includes(group.id) && <CheckCircle2 size={16} />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-[#071026] rounded-2xl border border-red-200 dark:border-red-900/30 shadow-sm overflow-hidden"
          >
            <div className="p-6 border-b border-red-100 dark:border-red-900/20 bg-red-50 dark:bg-red-900/10">
              <h3 className="font-bold text-red-700 dark:text-red-400 flex items-center gap-2">
                <Trash2 size={18} />
                Gefahrenzone
              </h3>
            </div>
            <div className="p-6">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                Das Löschen eines Benutzers ist endgültig und kann nicht rückgängig gemacht werden.
              </p>
              <button 
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold rounded-xl border border-red-200 dark:border-red-900/30 hover:bg-red-600 dark:hover:bg-red-600 hover:text-white transition-all"
              >
                <Trash2 size={18} />
                Benutzer unwiderruflich löschen
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#071026] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800"
            >
              <div className="p-6 text-center space-y-4">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto">
                  <Trash2 size={32} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Benutzer löschen?</h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    Möchten Sie diesen Benutzer wirklich unwiderruflich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
                  </p>
                </div>
                <div className="flex gap-3 pt-2">
                  <button 
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    Abbrechen
                  </button>
                  <button 
                    onClick={handleDelete}
                    className="flex-1 px-4 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 shadow-lg shadow-red-600/20 transition-colors"
                  >
                    Löschen
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
