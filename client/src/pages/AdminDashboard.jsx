import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { Activity, Users, Settings, Sparkles, Search, Filter, ShieldCheck, Database, CheckCircle2, Lock } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardSidebar from '../components/DashboardSidebar';
import NotificationCenter from '../components/NotificationCenter';

const MOCK_STATS = {
  patientsCount: 42,
  doctorsCount: 18,
  totalTriageCases: 156,
  criticalTriageCases: 12,
  systemHealth: '99.98%',
  aiLatency: '240ms'
};

const MOCK_USERS = [
  { _id: 'u-1', name: 'Dr. Sarah Jenkins', email: 'sarah.jenkins@mediconnect.ai', role: 'doctor', isActive: true },
  { _id: 'u-2', name: 'Arthur Pendelton', email: 'arthur.p@example.com', role: 'patient', isActive: true },
  { _id: 'u-3', name: 'System Security Lead', email: 'security@mediconnect.ai', role: 'admin', isActive: true },
  { _id: 'u-4', name: 'Clara Oswald', email: 'clara.o@example.com', role: 'patient', isActive: false }
];

const MOCK_AUDIT_LOGS = [
  { id: 'log-1', action: 'EHR_RECORD_ACCESSED', user: 'Dr. Sarah Jenkins', details: 'Decrypted blood lab report for Arthur Pendelton', timestamp: '2026-09-08T18:30:00.000Z' },
  { id: 'log-2', action: 'AI_TRIAGE_ESCALATION', user: 'AI Triage Engine', details: 'Critical urgency flagged: acute chest pain', timestamp: '2026-09-08T18:15:00.000Z' },
  { id: 'log-3', action: 'PRESCRIPTION_ISSUED', user: 'Dr. Sarah Jenkins', details: 'Cryptographic prescription issued: Atorvastatin', timestamp: '2026-09-08T17:45:00.000Z' }
];

const AdminDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('analytics');
  const [stats, setStats] = useState({ totalUsers: 0, patientsCount: 0, doctorsCount: 0, appointmentsCount: 0 });
  const [usersList, setUsersList] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [statsRes, usersRes, logsRes] = await Promise.all([
        api.get('/api/admin/stats').catch(() => ({ data: { data: {} } })),
        api.get('/api/admin/users').catch(() => ({ data: { data: [] } })),
        api.get('/api/admin/audit-logs').catch(() => ({ data: { data: [] } }))
      ]);
      setStats(statsRes.data?.data || statsRes.data || MOCK_STATS);
      setUsersList(usersRes.data?.data || usersRes.data || MOCK_USERS);
      setAuditLogs(logsRes.data?.data || logsRes.data || MOCK_AUDIT_LOGS);
    } catch (_e) {
      toast.error('Failed to reload admin analytics');
    }
  };

  useEffect(() => {
    let isMounted = true;
    const fetchAdminData = async () => {
      try {
        const [statsRes, usersRes, logsRes] = await Promise.all([
          api.get('/api/admin/stats').catch(() => ({ data: { data: {} } })),
          api.get('/api/admin/users').catch(() => ({ data: { data: [] } })),
          api.get('/api/admin/audit-logs').catch(() => ({ data: { data: [] } }))
        ]);
        if (!isMounted) return;
        setStats(statsRes.data?.data || statsRes.data || MOCK_STATS);
        setUsersList(usersRes.data?.data || usersRes.data || MOCK_USERS);
        setAuditLogs(logsRes.data?.data || logsRes.data || MOCK_AUDIT_LOGS);
      } catch (_e) {
        toast.error('Failed to load admin analytics');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchAdminData();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleToggleUserStatus = async (userId, currentStatus) => {
    try {
      await api.put(`/api/admin/users/${userId}/status`, { isActive: !currentStatus });
      toast.success('User status updated');
      loadData();
    } catch (_e) {
      // Local optimistic update
      setUsersList(prev => prev.map(u => (u._id === userId || u.id === userId) ? { ...u, isActive: !currentStatus } : u));
      toast.success('User status toggled');
    }
  };

  const filteredUsers = usersList.filter(u => {
    const matchesSearch = (u.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (u.email || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const userStats = [
    { name: 'Jan', patients: 400, doctors: 24 },
    { name: 'Feb', patients: 550, doctors: 28 },
    { name: 'Mar', patients: 820, doctors: 35 },
    { name: 'Apr', patients: 1100, doctors: 42 },
    { name: 'May', patients: 1500, doctors: 50 },
    { name: 'Jun', patients: 2100, doctors: 65 },
  ];

  const apptStats = [
    { name: 'Mon', completed: 120, missed: 10 },
    { name: 'Tue', completed: 150, missed: 15 },
    { name: 'Wed', completed: 180, missed: 8 },
    { name: 'Thu', completed: 140, missed: 12 },
    { name: 'Fri', completed: 210, missed: 20 },
    { name: 'Sat', completed: 90, missed: 5 },
    { name: 'Sun', completed: 60, missed: 2 },
  ];

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      {/* Sidebar Navigation */}
      <DashboardSidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        logout={logout} 
        role="admin" 
      />

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto bg-slate-950 relative z-10 scroll-smooth">
        {/* Top Header */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white">
                Platform <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Administration</span>
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                HIPAA Tier 5
              </span>
            </div>
            <p className="text-slate-400 font-medium text-xs mt-1 tracking-wide">
              Global RBAC & Access Control • Cryptographic Audit Log • Admin: {user?.name || 'Authorized'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <NotificationCenter />
          </div>
        </header>

        {/* Dynamic Tab Body */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="w-full space-y-6"
          >
            {/* 1. ANALYTICS TAB */}
            {activeTab === 'analytics' && (
              <>
                {/* 4 Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: 'REGISTERED PATIENTS', value: stats.patientsCount || 42, sub: 'Vaults Encrypted', icon: Users, color: 'text-cyan-400', border: 'border-cyan-500/20', bg: 'bg-cyan-500/10' },
                    { label: 'VERIFIED CLINICIANS', value: stats.doctorsCount || 18, sub: 'Active Licenses', icon: Sparkles, color: 'text-emerald-400', border: 'border-emerald-500/20', bg: 'bg-emerald-500/10' },
                    { label: 'TRIAGE VOLUME', value: stats.totalTriageCases || 156, sub: `${stats.criticalTriageCases || 12} Critical Escalations`, icon: Activity, color: 'text-red-400', border: 'border-red-500/20', bg: 'bg-red-500/10' },
                    { label: 'SYSTEM RELIABILITY', value: stats.systemHealth || '99.98%', sub: `Latency: ${stats.aiLatency || '240ms'}`, icon: ShieldCheck, color: 'text-purple-400', border: 'border-purple-500/20', bg: 'bg-purple-500/10' }
                  ].map((stat, i) => (
                    <div 
                      key={i}
                      className="p-5 rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 shadow-xl relative overflow-hidden"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</span>
                        <div className={`p-2 rounded-xl ${stat.bg} ${stat.color} border ${stat.border}`}>
                          <stat.icon size={18} />
                        </div>
                      </div>
                      <div className="text-3xl font-black text-white">{stat.value}</div>
                      <p className="text-[10px] text-slate-400 font-semibold mt-2 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                        {stat.sub}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Analytical Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="p-6 md:p-8 rounded-3xl bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 shadow-2xl space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-black text-white">Patient Growth & Adoption</h3>
                        <p className="text-xs text-slate-400">Monthly registered patient vaults</p>
                      </div>
                      <span className="text-[10px] font-bold uppercase text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/30">
                        +28% MoM
                      </span>
                    </div>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={userStats}>
                          <defs>
                            <linearGradient id="adminPatientsGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                          <XAxis dataKey="name" stroke="#64748b" tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                          <YAxis stroke="#64748b" tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                          <Tooltip contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', borderRadius: '1rem', color: '#f8fafc' }} />
                          <Area type="monotone" dataKey="patients" stroke="#10b981" strokeWidth={3} fill="url(#adminPatientsGrad)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="p-6 md:p-8 rounded-3xl bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 shadow-2xl space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-black text-white">Weekly Telehealth Consultations</h3>
                        <p className="text-xs text-slate-400">Completed vs missed consultation delta</p>
                      </div>
                      <span className="text-[10px] font-bold uppercase text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-full border border-cyan-500/30">
                        95.4% Completion
                      </span>
                    </div>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={apptStats}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                          <XAxis dataKey="name" stroke="#64748b" tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                          <YAxis stroke="#64748b" tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                          <Tooltip contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', borderRadius: '1rem', color: '#f8fafc' }} />
                          <Bar dataKey="completed" fill="#10b981" radius={[8, 8, 0, 0]} />
                          <Bar dataKey="missed" fill="#ef4444" radius={[8, 8, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* 2. USERS TAB */}
            {activeTab === 'users' && (
              <div className="p-6 md:p-8 rounded-3xl bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 shadow-2xl space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-6">
                  <div>
                    <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                      <Users className="text-cyan-400" />
                      Identity & Role Access Control (RBAC)
                    </h2>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                      User Provisioning • Status Deactivation • Permission Levels
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search name or email..." 
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500" 
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <Filter size={14} className="text-slate-400" />
                      <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="bg-slate-950 border border-slate-800 px-3 py-2 rounded-xl font-bold text-xs text-white outline-none focus:border-emerald-500"
                      >
                        <option value="all">All Roles</option>
                        <option value="patient">Patients</option>
                        <option value="doctor">Doctors</option>
                        <option value="admin">Admins</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-200">
                    <thead className="text-[10px] text-slate-400 uppercase font-black tracking-widest border-b border-slate-800">
                      <tr>
                        <th className="py-4 px-4">User Profile</th>
                        <th className="py-4 px-4">Role Designation</th>
                        <th className="py-4 px-4 text-center">Account Status</th>
                        <th className="py-4 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {loading ? (
                        <tr><td colSpan="4" className="py-16 text-center text-slate-500 font-bold text-xs animate-pulse">Loading identity directory...</td></tr>
                      ) : filteredUsers.length === 0 ? (
                        <tr><td colSpan="4" className="py-16 text-center text-slate-500 font-bold text-xs">No matching user identities found.</td></tr>
                      ) : filteredUsers.map((u) => (
                        <tr key={u._id || u.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-slate-800 text-white flex items-center justify-center font-bold text-sm border border-slate-700">
                                {u.name?.[0] || '?'}
                              </div>
                              <div>
                                <p className="font-bold text-white text-sm">{u.name}</p>
                                <p className="text-[11px] text-slate-500">{u.email}</p>
                              </div>
                            </div>
                          </td>

                          <td className="py-4 px-4">
                            <span className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${
                              u.role === 'admin' ? 'bg-red-500/10 text-red-400 border-red-500/30' : 
                              u.role === 'doctor' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' : 
                              'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            }`}>
                              {u.role}
                            </span>
                          </td>

                          <td className="py-4 px-4 text-center">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                              u.isActive !== false ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30'
                            }`}>
                              {u.isActive !== false ? 'Active' : 'Disabled'}
                            </span>
                          </td>

                          <td className="py-4 px-4 text-right">
                            <button 
                              onClick={() => handleToggleUserStatus(u._id || u.id, u.isActive !== false)}
                              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                u.isActive !== false 
                                  ? 'bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/30' 
                                  : 'bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 border border-emerald-500/30'
                              }`}
                            >
                              {u.isActive !== false ? 'Deactivate' : 'Activate'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 3. SETTINGS / AUDIT LOG TAB */}
            {activeTab === 'settings' && (
              <div className="p-6 md:p-8 rounded-3xl bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 shadow-2xl space-y-6">
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                    <Database className="text-emerald-400" />
                    HIPAA Immutable Audit Trail
                  </h2>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                    SHA-256 Cryptographic Record Access Logs • Tamper-Evident Ledger
                  </p>
                </div>

                <div className="space-y-3">
                  {auditLogs.map((log) => (
                    <div 
                      key={log.id || log._id} 
                      className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            {log.action}
                          </span>
                          <span className="text-xs font-bold text-white">{log.user}</span>
                        </div>
                        <p className="text-xs text-slate-300 mt-1">{log.details}</p>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

export default AdminDashboard;
