import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Group } from '../types';
import { Users, Plus, UserPlus, Shield, Mail, Check, X, Edit2 } from 'lucide-react';
import { motion } from 'motion/react';

interface UserManagementProps {
  groups: Group[];
  currentUser: User | null;
}

export const UserManagement: React.FC<UserManagementProps> = ({ groups, currentUser }) => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddUser, setShowAddUser] = useState(false);
  const [showAddGroup, setShowAddGroup] = useState(false);
  
  const canManage = currentUser?.role === 'Admin' || currentUser?.role === 'Agent';
  
  // New User Form
  const [newName, setNewName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'Agent' | 'Admin' | 'Worker' | 'User'>('Agent');
  
  // New Group Form
  const [newGroupName, setNewGroupName] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, username: newUsername, email: newEmail, password: newPassword, role: newRole })
      });
      setNewName('');
      setNewUsername('');
      setNewEmail('');
      setNewPassword('');
      setShowAddUser(false);
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newGroupName })
      });
      setNewGroupName('');
      setShowAddGroup(false);
      window.location.reload(); // Refresh to get new groups in parent
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Benutzer- & Zugriffsverwaltung</h1>
        {canManage && (
          <div className="flex gap-3">
            <button 
              onClick={() => setShowAddGroup(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#071026] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-sm font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
            >
              <Plus size={18} />
              Neue Gruppe
            </button>
            <button 
              onClick={() => setShowAddUser(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all"
            >
              <UserPlus size={18} />
              Benutzer hinzufügen
            </button>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {showAddUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#071026] w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-6 border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Neuen Benutzer hinzufügen</h2>
              <button onClick={() => setShowAddUser(false)} className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"><X size={20}/></button>
            </div>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Vollständiger Name</label>
                <input required value={newName} onChange={e => setNewName(e.target.value)} className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Benutzername (z.B. v.nachname)</label>
                <input required value={newUsername} onChange={e => setNewUsername(e.target.value)} className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">E-Mail-Adresse</label>
                <input required type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Passwort</label>
                <input required type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Rolle</label>
                <select value={newRole} onChange={e => setNewRole(e.target.value as any)} className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white">
                  <option value="User">Benutzer</option>
                  <option value="Worker">Mitarbeiter</option>
                  <option value="Agent">Agent</option>
                  <option value="Admin">Administrator</option>
                </select>
              </div>
              <button type="submit" className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors">Benutzer erstellen</button>
            </form>
          </div>
        </div>
      )}

      {/* Add Group Modal */}
      {showAddGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#071026] w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-6 border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Neue Gruppe erstellen</h2>
              <button onClick={() => setShowAddGroup(false)} className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"><X size={20}/></button>
            </div>
            <form onSubmit={handleAddGroup} className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Gruppenname</label>
                <input required value={newGroupName} onChange={e => setNewGroupName(e.target.value)} className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white" />
              </div>
              <button type="submit" className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors">Gruppe erstellen</button>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-8">
        <div className="bg-white dark:bg-[#071026] rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm transition-colors">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users size={18} className="text-indigo-600" />
              Benutzerliste
            </h3>
          </div>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/20 border-b border-slate-200 dark:border-slate-800">
                <th className="px-6 py-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Benutzer</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Rolle</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Gruppen</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-right">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">{user.name}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <Shield size={12} /> {user.username} • <Mail size={12} /> {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                      user.role === 'Admin' ? 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400' : 
                      user.role === 'Worker' ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' :
                      user.role === 'Agent' ? 'bg-indigo-100 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400' :
                      'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}>
                      {user.role === 'User' ? 'Benutzer' : user.role === 'Worker' ? 'Mitarbeiter' : user.role === 'Agent' ? 'Agent' : 'Admin'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2 group relative">
                      {groups.filter(g => (user.group_ids || []).includes(g.id)).map(group => (
                        <span
                          key={group.id}
                          className="px-2 py-1 rounded-md text-[10px] font-bold bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400"
                        >
                          {group.name}
                        </span>
                      ))}
                      {(user.group_ids || []).length === 0 && <span className="text-xs text-slate-400 dark:text-slate-500 italic">Keine Gruppen</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {canManage && (
                      <button 
                        onClick={() => navigate(`/backend/users/edit/${user.id}`)}
                        className="flex items-center gap-2 ml-auto px-6 py-3 bg-indigo-600 text-white text-sm font-bold rounded-2xl shadow-xl shadow-indigo-600/30 hover:bg-indigo-700 hover:-translate-y-0.5 active:translate-y-0 transition-all"
                      >
                        <Edit2 size={18} />
                        Benutzer bearbeiten
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
