import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams, useLocation, Outlet } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { TicketList } from './components/TicketList';
import { TicketForm } from './components/TicketForm';
import { TicketDetail } from './components/TicketDetail';
import UserTicketView from './components/UserTicketView';
import { LandingPage } from './components/LandingPage';
import { UserManagement } from './components/UserManagement';
import { UserEdit } from './components/UserEdit';
import { Login } from './components/Login';
import { Ticket, Group, TicketType, User } from './types';
import { Plus, Search, Filter, RefreshCcw, LayoutDashboard, Ticket as TicketIcon, Users, AlertCircle, Clock, ExternalLink, UserCog, Edit2, ChevronRight, Loader2 } from 'lucide-react';
import GroupTemplates from './components/GroupTemplates';
import TemplatesPage from './components/TemplatesPage';
import TemplateBuilder from './components/TemplateBuilder';
import { applyTheme, readInitialTheme } from './theme';
import { motion, AnimatePresence } from 'motion/react';
import { TicketPage } from './pages/TicketPage';
import { SettingsPage } from './pages/SettingsPage';
import { UserMenu } from './components/UserMenu';

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) => {
  const savedUser = localStorage.getItem('nexus_user');
  if (!savedUser) return <Navigate to="/login" replace />;
  
  const user = JSON.parse(savedUser);
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === 'User' ? '/dashboard' : '/backend'} replace />;
  }
  return <>{children}</>;
};

const BackendLayout = ({ currentUser, handleLogout, fetchData, loading, searchTerm, setSearchTerm }: any) => {
  const navigate = useNavigate();
  const location = useLocation();

  const getActiveTab = () => {
    const path = location.pathname;
    if (path === '/backend') return 'dashboard';
    if (path.startsWith('/backend/tickets')) return 'tickets';
    if (path.startsWith('/backend/groups')) return 'groups';
    if (path.startsWith('/backend/users')) return 'users';
    return 'dashboard';
  };

  const activeTab = getActiveTab();

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-[#0b1220] overflow-hidden transition-colors duration-300">
      <Sidebar activeTab={activeTab} currentUser={currentUser} setActiveTab={(tab) => {
        if (tab === 'dashboard') navigate('/backend');
        else if (tab === 'tickets') navigate('/backend/tickets');
        else if (tab === 'groups') navigate('/backend/groups');
        else if (tab === 'users') navigate('/backend/users');
      }} />

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white dark:bg-[#071026] border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-8 sticky top-0 z-10 transition-colors">
          <div className="flex items-center gap-4 flex-1 max-w-xl">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Tickets nach ID oder Titel suchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <UserMenu currentUser={currentUser} onLogout={handleLogout} />
            <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-1" />
            <button 
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 px-3 py-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-sm font-medium"
              title="Zum Service Portal"
            >
              <ExternalLink size={18} />
              Portal
            </button>
            <button 
              onClick={fetchData}
              className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              title="Daten aktualisieren"
            >
              <RefreshCcw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </header>

        {/* Content Area — child routes render here (React Router Outlet) */}
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formDefaultType, setFormDefaultType] = useState<TicketType | undefined>();
  const [formTemplateExtraFields, setFormTemplateExtraFields] = useState<any[] | undefined>(undefined);
  const [formInitialTitle, setFormInitialTitle] = useState<string | undefined>(undefined);
  const [showTemplateBuilder, setShowTemplateBuilder] = useState(false);
  const [templateRefreshKey, setTemplateRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>(['Open', 'On Hold']);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedGroupView, setSelectedGroupView] = useState<string | null>(null);
  const [templatesGroupId, setTemplatesGroupId] = useState<string | null>(null);
  const [afterCreateGoToBackend, setAfterCreateGoToBackend] = useState(false);
  const [formDefaultPriority, setFormDefaultPriority] = useState<any | undefined>(undefined);
  const [formTemplateGroupId, setFormTemplateGroupId] = useState<string | undefined>(undefined);

  useEffect(() => {
    const initTheme = async () => {
      try {
        const res = await fetch('/api/settings/theme');
        const data = await res.json();
        const t =
          data?.theme === 'light' || data?.theme === 'dark' ? data.theme : readInitialTheme();
        applyTheme(t);
      } catch {
        applyTheme(readInitialTheme());
      }
    };
    initTheme();
  }, []);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const res = await fetch('/api/me');
        if (res.ok) {
          const user = await res.json();
          setCurrentUser(user);
          localStorage.setItem('nexus_user', JSON.stringify(user));
        } else {
          // If session is invalid, check localStorage as fallback
          const savedUser = localStorage.getItem('nexus_user');
          if (savedUser) {
            const user = JSON.parse(savedUser);
            setCurrentUser(user);
          } else if (location.pathname !== '/login') {
            navigate('/login');
          }
        }
      } catch (err) {
        console.error('Session restoration failed', err);
        const savedUser = localStorage.getItem('nexus_user');
        if (savedUser) {
          const user = JSON.parse(savedUser);
          setCurrentUser(user);
        } else if (location.pathname !== '/login') {
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  useEffect(() => {
    if (currentUser) {
      const roleOverride = location.pathname === '/dashboard' ? 'User' : undefined;
      fetchData(roleOverride);
    }
  }, [currentUser, location.pathname]);

  const fetchData = async (roleOverride?: string) => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const roleToUse = roleOverride || currentUser.role;
      const [ticketsRes, groupsRes] = await Promise.all([
        fetch(`/api/tickets?user_id=${currentUser.id}&role=${roleToUse}`),
        fetch('/api/groups')
      ]);
      const ticketsData = await ticketsRes.json();
      const groupsData = await groupsRes.json();
      setTickets(ticketsData);
      setGroups(groupsData);
    } catch (err) {
      console.error('Failed to fetch data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (user: User) => {
    console.log('handleLogin called with user:', user);
    setCurrentUser(user);
    localStorage.setItem('nexus_user', JSON.stringify(user));
    // Use a small timeout to ensure state and localStorage are updated before navigation
    setTimeout(() => {
      console.log('Navigating to /dashboard');
      navigate('/dashboard');
    }, 10);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout request failed', err);
    }
    setCurrentUser(null);
    localStorage.removeItem('nexus_user');
    navigate('/login');
  };

  const handleCreateTicket = async (data: any) => {
    try {
      const findGroupIdForType = (t: TicketType) => {
        const name = (s: string|undefined) => (s || '').toLowerCase();
        try {
          if (t === 'Onboarding') {
            return groups.find(g => /onboard|hr|human resource|personal/i.test(g.name))?.id;
          }
          if (t === 'Facility') {
            return groups.find(g => /facility|gebäude|building|facility management/i.test(g.name))?.id;
          }
          if (t === 'Request') {
            // Prefer Allgemeiner/General support — avoid matching "IT-Support" via generic "support"
            return groups.find(g => /allgemein|allgemeiner|general support|general\b/i.test(g.name))?.id;
          }
          // Default: try to find IT / Support group
          return groups.find(g => /it|it support|it-support|it-support/i.test(g.name))?.id;
        } catch (err) {
          return undefined;
        }
      };

      const payload = { ...data, opened_by: currentUser?.id } as any;
      if (!payload.group_id) {
        const resolved = findGroupIdForType(payload.type || 'Incident');
        payload.group_id = resolved || groups[0]?.id || '10';
      }

      await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      setIsFormOpen(false);
      setFormTemplateExtraFields(undefined);
      setFormInitialTitle(undefined);
      setFormDefaultType(undefined);
      setFormDefaultPriority(undefined);
      fetchData();
      // Always navigate back to dashboard after creating from portal/templates
      if (afterCreateGoToBackend) {
        // if explicitly set, respect it, otherwise default to dashboard
        navigate('/dashboard');
        setAfterCreateGoToBackend(false);
      }
    } catch (err) {
      console.error('Failed to create ticket', err);
      throw err;
    }
  };

  const openPortalForm = (type: TicketType) => {
    const mapTypeToGroup = (t: TicketType) => {
      if (t === 'Onboarding') return '20';
      if (t === 'Facility') return '30';
      if (t === 'Request') return '40'; // General Support
      return '10';
    };
    setTemplatesGroupId(mapTypeToGroup(type));
    navigate('/templates');
  };

  const createFromTemplate = (template: any) => {
    const mapGroupToType = (gId: string) => {
      if (gId === '20') return 'Onboarding';
      if (gId === '30') return 'Facility';
      if (gId === '40') return 'Request';
      return 'Incident';
    };
    // Prefer template.group_id so Vorlage-Gruppe (z. B. IT-Support) steuert Typ/Route, nicht child_task_group_id alter Workflows
    const groupIdForInference = template.group_id || templatesGroupId || template.child_task_group_id || '';
    const inferredType = mapGroupToType(groupIdForInference);
    setFormInitialTitle(template.title || '');
    let extra = template.extra_fields || {};
    try {
      if (typeof extra === 'string') extra = JSON.parse(extra);
    } catch {
      /* keep */
    }
    const fields = Array.isArray(extra.fields) ? extra.fields : (Array.isArray(extra) ? extra : []);
    setFormTemplateExtraFields(fields || []);
    setFormDefaultType((extra.meta?.type || inferredType) as TicketType);
    setFormDefaultPriority(extra.meta?.priority || undefined);
    const resolvedTemplateGroup = template.group_id || templatesGroupId || undefined;
    setFormTemplateGroupId(resolvedTemplateGroup);
    setIsFormOpen(true);
    setAfterCreateGoToBackend(false);
  };

  const filteredTickets = tickets.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         t.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter.length === 0 || statusFilter.includes(t.status);
    return matchesSearch && matchesStatus;
  });

  const getUserGroupIds = (u: User | null): string[] => {
    if (!u?.group_ids) return [];
    const raw = u.group_ids as unknown;
    if (Array.isArray(raw)) return raw.map(String);
    if (typeof raw === 'string') {
      try {
        const p = JSON.parse(raw);
        return Array.isArray(p) ? p.map(String) : [];
      } catch {
        return [];
      }
    }
    return [];
  };

  const userGroupIds = getUserGroupIds(currentUser);
  const isAdminRole = currentUser?.role === 'Admin';
  const ticketInUserGroups = (groupId: string | undefined | null) =>
    userGroupIds.includes(String(groupId ?? ''));

  const myAssignedTickets = filteredTickets.filter(
    t => String(t.assigned_to ?? '') === String(currentUser?.id ?? '')
  );

  const groupTickets = groups
    .filter(g => isAdminRole || ticketInUserGroups(g.id))
    .map(g => ({
      group: g,
      tickets: filteredTickets.filter(
        t => String(t.group_id) === String(g.id) && String(t.assigned_to ?? '') !== String(currentUser?.id ?? '')
      )
    }));

  const stats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === 'Open').length,
    onHold: tickets.filter(t => t.status === 'On Hold').length,
    closed: tickets.filter(t => t.status === 'Closed Complete').length,
    critical: tickets.filter(t => t.priority === 'Critical' && t.status !== 'Closed Complete').length
  };

  const unassignedGroupTickets = filteredTickets.filter(t => {
    const unassigned = !t.assigned_to || t.assigned_to === '';
    if (!unassigned) return false;
    if (isAdminRole) return true;
    return ticketInUserGroups(t.group_id);
  });
  const groupAllTickets = filteredTickets.filter(t => {
    if (isAdminRole) return true;
    return ticketInUserGroups(t.group_id);
  });

  if (loading && !currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#020817] flex items-center justify-center transition-colors">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-3xl shadow-xl shadow-indigo-600/30 animate-pulse">
            N
          </div>
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-medium">
            <Loader2 className="animate-spin" size={18} />
            Laden...
          </div>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<Login onLogin={handleLogin} />} />
      
      <Route path="/dashboard" element={
        <ProtectedRoute allowedRoles={['User', 'Admin', 'Agent', 'Worker']}>
          <LandingPage 
            onSelectCategory={openPortalForm} 
            currentUser={currentUser}
            onLogout={handleLogout}
            tickets={tickets}
            onSelectTicket={(id) => navigate(`/ticket/${id}`)}
          />
          <AnimatePresence>
            {isFormOpen && (
              <TicketForm 
                groups={groups} 
                defaultType={formDefaultType}
                defaultPriority={formDefaultPriority}
                currentUser={currentUser}
                templateExtraFields={formTemplateExtraFields}
                initialTitle={formInitialTitle}
                onClose={() => { 
                  setIsFormOpen(false); 
                  setFormTemplateExtraFields(undefined);
                  setFormInitialTitle(undefined);
                  setFormDefaultType(undefined);
                  setFormDefaultPriority(undefined);
                  setFormTemplateGroupId(undefined);
                }} 
                onSubmit={handleCreateTicket} 
                templateGroupId={formTemplateGroupId}
              />
            )}
          </AnimatePresence>
        </ProtectedRoute>
      } />

      <Route path="/templates" element={
        <ProtectedRoute allowedRoles={['User', 'Admin', 'Agent', 'Worker']}>
          <TemplatesPage
            groupId={templatesGroupId}
            groups={groups}
            currentUser={currentUser}
            onBack={() => navigate('/dashboard')}
            onCreateFromTemplate={createFromTemplate}
            onOpenTemplateBuilder={() => setShowTemplateBuilder(true)}
          />
          <AnimatePresence>
            {isFormOpen && (
              <TicketForm 
                groups={groups} 
                defaultType={formDefaultType}
                defaultPriority={formDefaultPriority}
                currentUser={currentUser}
                templateExtraFields={formTemplateExtraFields}
                initialTitle={formInitialTitle}
                titleReadOnly={!!formInitialTitle}
                onClose={() => { 
                  setIsFormOpen(false); 
                  setFormTemplateExtraFields(undefined); 
                  setFormInitialTitle(undefined); 
                  setFormDefaultType(undefined); 
                  setFormDefaultPriority(undefined);
                  setFormTemplateGroupId(undefined);
                }} 
                onSubmit={handleCreateTicket} 
                templateGroupId={formTemplateGroupId}
              />
            )}
            {showTemplateBuilder && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                <div className="bg-white dark:bg-[#071026] w-full max-w-3xl rounded-2xl shadow-2xl overflow-auto p-6 border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Vorlagen-Editor</h3>
                    <button onClick={() => setShowTemplateBuilder(false)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Schließen</button>
                  </div>
                  <div>
                    <TemplateBuilder groups={groups} onSaved={() => { setShowTemplateBuilder(false); setTemplateRefreshKey(k => k + 1); }} />
                  </div>
                </div>
              </div>
            )}
          </AnimatePresence>
        </ProtectedRoute>
      } />

      <Route path="/ticket/:id" element={
        <ProtectedRoute>
          <TicketPage />
        </ProtectedRoute>
      } />

      <Route path="/settings" element={
        <ProtectedRoute>
          <SettingsPage />
        </ProtectedRoute>
      } />

      <Route path="/backend" element={
        <ProtectedRoute allowedRoles={['Admin', 'Agent', 'Worker']}>
          <>
            <BackendLayout 
              currentUser={currentUser} 
              handleLogout={handleLogout} 
              fetchData={fetchData} 
              loading={loading} 
              searchTerm={searchTerm} 
              setSearchTerm={setSearchTerm}
            />
            <AnimatePresence>
              {isFormOpen && (
                <TicketForm 
                  groups={groups} 
                  defaultType={formDefaultType}
                  defaultPriority={formDefaultPriority}
                  currentUser={currentUser}
                  templateExtraFields={formTemplateExtraFields}
                  initialTitle={formInitialTitle}
                  onClose={() => { 
                    setIsFormOpen(false); 
                    setFormTemplateExtraFields(undefined); 
                    setFormInitialTitle(undefined); 
                    setFormDefaultType(undefined); 
                    setFormDefaultPriority(undefined);
                    setFormTemplateGroupId(undefined);
                  }} 
                  onSubmit={handleCreateTicket} 
                  templateGroupId={formTemplateGroupId}
                />
              )}
              {showTemplateBuilder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                  <div className="bg-white dark:bg-[#0b1220] w-full max-w-3xl rounded-2xl shadow-2xl overflow-auto p-6 transition-colors">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">Vorlagen-Editor</h3>
                      <button onClick={() => setShowTemplateBuilder(false)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-sm font-bold">Schließen</button>
                    </div>
                    <div><TemplateBuilder groups={groups} onSaved={() => { setShowTemplateBuilder(false); setTemplateRefreshKey(k => k + 1); }} /></div>
                  </div>
                </div>
              )}
            </AnimatePresence>
          </>
        </ProtectedRoute>
      }>
        <Route index element={
                <div className="p-8 space-y-8 bg-slate-50 dark:bg-[#0b1220] min-h-full transition-colors">
                  <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Systemübersicht</h1>
                    <div className="text-sm text-slate-500 dark:text-slate-400 font-medium">Zuletzt aktualisiert: {new Date().toLocaleTimeString()}</div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                      { label: 'Gesamtanzahl Tickets', value: stats.total, icon: TicketIcon, color: 'indigo' },
                      { label: 'Offen', value: stats.open, icon: Clock, color: 'blue' },
                      { label: 'Wartend', value: stats.onHold, icon: RefreshCcw, color: 'amber' },
                      { label: 'Kritische Probleme', value: stats.critical, icon: AlertCircle, color: 'red' },
                    ].map((stat) => (
                      <div key={stat.label} className="bg-white dark:bg-[#071026] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-center justify-between mb-4">
                          <div className={`p-2 rounded-lg bg-${stat.color}-50 dark:bg-${stat.color}-900/20 text-${stat.color}-600 dark:text-${stat.color}-400`}><stat.icon size={20} /></div>
                          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{stat.label}</span>
                        </div>
                        <div className="text-3xl font-bold text-slate-900 dark:text-white">{stat.value}</div>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-8">
                    <div className="space-y-4">
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2"><UserCog size={20} className="text-indigo-500" /> Mir zugewiesen ({myAssignedTickets.length})</h2>
                      <TicketList tickets={myAssignedTickets} onSelectTicket={(t) => navigate(`/ticket/${t.id}`)} />
                    </div>
                    {groupTickets.map(({ group, tickets }) => (
                      <div key={group.id} className="space-y-4">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2"><Users size={20} className="text-slate-400" /> {group.name} Warteschlange ({tickets.length})</h2>
                        <TicketList tickets={tickets} onSelectTicket={(t) => navigate(`/ticket/${t.id}`)} />
                      </div>
                    ))}
                  </div>
                </div>
              } />
              <Route path="tickets" element={
                <div className="p-8 space-y-6 bg-slate-50 dark:bg-[#0b1220] min-h-full transition-colors">
                  <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Ticket-Archiv</h1>
                    <div className="flex items-center gap-2 relative">
                      <button onClick={() => setIsFilterOpen(!isFilterOpen)} className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg text-xs font-semibold transition-all ${isFilterOpen ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'bg-white dark:bg-[#071026] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                        <Filter size={14} /> Filtern {statusFilter.length > 0 && `(${statusFilter.length})`}
                      </button>
                      <AnimatePresence>
                        {isFilterOpen && (
                          <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-[#071026] border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-30 p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Status</span>
                              <button onClick={() => setStatusFilter([])} className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline">Löschen</button>
                            </div>
                            <div className="space-y-2">
                              {['Open', 'On Hold', 'Closed Complete', 'Failed'].map(status => (
                                <label key={status} className="flex items-center gap-2 cursor-pointer group">
                                  <input type="checkbox" checked={statusFilter.includes(status)} onChange={(e) => e.target.checked ? setStatusFilter(prev => [...prev, status]) : setStatusFilter(prev => prev.filter(s => s !== status))} className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500" />
                                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white">{status === 'Open' ? 'Offen' : status === 'On Hold' ? 'Wartend' : status === 'Closed Complete' ? 'Abgeschlossen' : 'Fehlgeschlagen'}</span>
                                </label>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                  <div className="space-y-8">
                    <div className="space-y-4">
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white">Deine Tickets ({myAssignedTickets.length})</h2>
                      <TicketList tickets={myAssignedTickets} onSelectTicket={(t) => navigate(`/ticket/${t.id}`)} />
                    </div>
                    <div className="space-y-4">
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white">Nicht zugewiesen in deiner Gruppe ({unassignedGroupTickets.length})</h2>
                      <TicketList tickets={unassignedGroupTickets} onSelectTicket={(t) => navigate(`/ticket/${t.id}`)} />
                    </div>
                    <div className="space-y-4">
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white">Alle Tickets deiner Gruppen ({groupAllTickets.length})</h2>
                      <TicketList tickets={groupAllTickets} onSelectTicket={(t) => navigate(`/ticket/${t.id}`)} />
                    </div>
                  </div>
                </div>
              } />
              <Route path="groups" element={
                <ProtectedRoute allowedRoles={['Admin', 'Agent']}>
                  <div className="p-8 space-y-6 bg-slate-50 dark:bg-[#0b1220] min-h-full transition-colors">
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Zuweisungsgruppen</h1>
                  {!selectedGroupView ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {groups.map(group => (
                        <div key={group.id} className="relative group bg-white dark:bg-[#071026] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400"><Users size={20} /></div>
                              <h3 className="font-bold text-slate-900 dark:text-white">{group.name}</h3>
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  const newName = prompt('Neuer Gruppenname:', group.name);
                                  if (newName && newName !== group.name) {
                                    await fetch(`/api/groups/${group.id}`, {
                                      method: 'PATCH',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ name: newName })
                                    });
                                    fetchData();
                                  }
                                }}
                                className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button onClick={() => setSelectedGroupView(group.id)} className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                                <ChevronRight size={18} />
                              </button>
                            </div>
                          </div>
                          <div className="flex justify-between text-sm"><span className="text-slate-500 dark:text-slate-400">Aktive Tickets</span><span className="font-bold text-slate-900 dark:text-white">{tickets.filter(t => t.group_id === group.id && t.status !== 'Closed Complete').length}</span></div>
                          <button onClick={() => setSelectedGroupView(group.id)} className="absolute inset-0 z-0 cursor-pointer" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center gap-4">
                        <button onClick={() => setSelectedGroupView(null)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-sm font-bold">Zurück</button>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Tickets in Gruppe: {groups.find(g => g.id === selectedGroupView)?.name}</h2>
                        {currentUser && (currentUser.role === 'Admin' || currentUser.role === 'Agent') && (
                          <button onClick={() => setShowTemplateBuilder(true)} className="ml-4 px-4 py-2 bg-white dark:bg-[#071026] border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm font-bold">Vorlagen verwalten</button>
                        )}
                      </div>
                      <div className="mt-4 space-y-6">
                        <GroupTemplates key={templateRefreshKey} groupId={selectedGroupView || ''} onCreateFromTemplate={createFromTemplate} groups={groups} />
                        <TicketList tickets={tickets.filter(t => t.group_id === selectedGroupView)} onSelectTicket={(t) => navigate(`/ticket/${t.id}`)} />
                      </div>
                    </div>
                  )}
                </div>
              </ProtectedRoute>
            } />
              <Route path="users" element={<ProtectedRoute allowedRoles={['Admin', 'Agent']}><div className="p-8 bg-slate-50 dark:bg-[#0b1220] min-h-full transition-colors"><UserManagement groups={groups} currentUser={currentUser} /></div></ProtectedRoute>} />
              <Route path="users/edit/:userId" element={<ProtectedRoute allowedRoles={['Admin', 'Agent']}><div className="p-8 bg-slate-50 dark:bg-[#0b1220] min-h-full transition-colors"><UserEdit groups={groups} /></div></ProtectedRoute>} />
      </Route>

      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
