import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';
import { LogOut, Activity, LineChart as LineChartIcon, Users, Settings, Plus, Sparkles } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardSidebar from '../components/DashboardSidebar';

const AdminDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('analytics');
  const [stats, setStats] = useState({ totalUsers: 0, patientsCount: 0, doctorsCount: 0, appointmentsCount: 0 });
  const [usersList, setUsersList] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [statsRes, usersRes, logsRes] = await Promise.all([
        api.get('/api/admin/stats').catch(() => ({ data: { data: {} } })),
        api.get('/api/admin/users').catch(() => ({ data: { data: [] } })),
        api.get('/api/admin/audit-logs').catch(() => ({ data: { data: [] } }))
      ]);
      setStats(statsRes.data?.data || statsRes.data || {});
      setUsersList(usersRes.data?.data || usersRes.data || []);
      setAuditLogs(logsRes.data?.data || logsRes.data || []);
    } catch (e) {
      console.error('Failed to fetch admin data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleToggleUserStatus = async (userId, currentStatus) => {
    try {
      await api.put(`/api/admin/users/${userId}/status`, { isActive: !currentStatus });
      toast.success('User status updated');
      fetchAdminData();
    } catch (e) {
      toast.error('Failed to update user status');
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
    <div className="flex h-screen bg-themeLight font-geist overflow-hidden">
      <DashboardSidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        logout={logout} 
        role="admin" 
      />

      <main className="flex-1 p-8 overflow-y-auto bg-themeLight relative z-10 scroll-smooth">
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.5 }}
        >
          <header className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-black text-themeDeep">Platform Administration</h1>
              <p className="text-themeDark/70 font-medium mt-1 uppercase tracking-widest text-[10px]">Security clearance level 5 • {user.name}</p>
            </div>
          </header>
        </motion.div>
        
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.02, y: -10 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="w-full space-y-8"
          >
            {activeTab === 'analytics' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {[
                    { label: 'TOTAL PATIENTS', value: stats.patientsCount || 0, sub: 'Registered Vaults', icon: Users, color: 'text-themePrimary' },
                    { label: 'ACTIVE DOCTORS', value: stats.doctorsCount || 0, sub: 'Verified Clinicians', icon: Sparkles, color: 'text-themePrimary' },
                    { label: 'TOTAL TRIAGE CASES', value: stats.totalTriageCases || 0, sub: `${stats.criticalTriageCases || 0} Critical Escalations`, icon: Activity, color: 'text-red-500' },
                    { label: 'SYSTEM HEALTH', value: stats.systemHealth || '100%', sub: `Latency: ${stats.aiLatency || '420ms'}`, icon: Activity, color: 'text-themePrimary' }
                  ].map((stat, i) => (
                    <motion.div 
                      key={i}
                      whileHover={{ scale: 1.02, y: -5 }}
                      className="bg-white p-6 rounded-[2rem] shadow-3d border border-themeMedium/30 glass hover:border-themePrimary/50 transition-all cursor-default"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <p className="text-[10px] font-black text-themeDark/50 tracking-[0.2em]">{stat.label}</p>
                        <div className={`p-2 bg-themeSoft rounded-lg ${stat.color}`}><stat.icon size={18} /></div>
                      </div>
                      <p className="text-4xl font-black text-themeDeep my-1 tracking-tighter">{stat.value}</p>
                      <p className="text-[10px] text-themePrimary font-black bg-themeSoft inline-block px-3 py-1 rounded-full">{stat.sub}</p>
                    </motion.div>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white p-8 rounded-[2.5rem] shadow-3d border border-themeMedium/30 glass">
                    <div className="flex justify-between items-center mb-8">
                       <h3 className="text-2xl font-black text-themeDeep tracking-tight italic">User Trajectory</h3>
                       <p className="text-[10px] font-black uppercase text-themeDark/40">Patient Growth Data</p>
                    </div>
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={userStats}>
                          <defs>
                            <linearGradient id="colorPatients" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#22C55E" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#22C55E" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontWeight: 'bold'}} />
                          <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontWeight: 'bold'}} />
                          <Tooltip 
                            contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }} 
                          />
                          <Area type="monotone" dataKey="patients" stroke="#22C55E" fillOpacity={1} fill="url(#colorPatients)" strokeWidth={4} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-white p-8 rounded-[2.5rem] shadow-3d border border-themeMedium/30 glass">
                    <div className="flex justify-between items-center mb-8">
                       <h3 className="text-2xl font-black text-themeDeep tracking-tight italic">Consultation Volume</h3>
                       <p className="text-[10px] font-black uppercase text-themeDark/40">Weekly Telehealth Delta</p>
                    </div>
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={apptStats}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontWeight: 'bold'}} />
                          <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontWeight: 'bold'}} />
                          <Tooltip 
                            contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }} 
                            cursor={{fill: '#F0FDF4'}} 
                          />
                          <Bar dataKey="completed" fill="#22C55E" radius={[10, 10, 0, 0]} />
                          <Bar dataKey="missed" fill="#166534" radius={[10, 10, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'users' && (
              <div className="bg-white p-10 rounded-[3rem] shadow-3d border border-themeMedium/30 glass space-y-8">
                 <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <h3 className="text-3xl font-black text-themeDeep italic tracking-tighter">Identity Management</h3>
                      <p className="text-themeDark/50 font-black uppercase text-[10px] tracking-widest mt-1">Platform RBAC & User Status Control</p>
                    </div>
                    <div className="flex gap-4 items-center flex-wrap">
                       <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="bg-themeSoft border border-themeMedium/30 rounded-xl px-4 py-2 text-xs font-black text-themeDeep outline-none"
                       >
                         <option value="all">All Roles</option>
                         <option value="patient">Patients</option>
                         <option value="doctor">Doctors</option>
                         <option value="admin">Admins</option>
                       </select>
                       <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search Name or Email..." 
                        className="bg-themeLight border-2 border-themeMedium/20 rounded-xl px-4 py-2 text-xs font-black focus:outline-none focus:border-themePrimary transition-all w-64" 
                       />
                    </div>
                 </div>
                 <div className="overflow-x-auto">
                   <table className="w-full text-left text-sm text-themeDeep">
                     <thead className="bg-themeSoft/50 text-[10px] font-black tracking-[0.2em] text-themeDark/70 uppercase border-b border-themeMedium/30">
                        <tr>
                          <th className="px-8 py-5">User</th>
                          <th className="px-8 py-5">Role</th>
                          <th className="px-8 py-5">Account Status</th>
                          <th className="px-8 py-5 text-right">Action</th>
                        </tr>
                     </thead>
                      <tbody className="divide-y divide-themeMedium/10">
                        {loading ? (
                            <tr><td colSpan="4" className="text-center py-20 font-black opacity-30 italic animate-pulse">Loading identity directory...</td></tr>
                        ) : filteredUsers.length === 0 ? (
                            <tr><td colSpan="4" className="text-center py-20 font-black opacity-30 italic">No matching users found.</td></tr>
                        ) : filteredUsers.map((u, idx) => (
                            <motion.tr 
                              key={u._id || u.id} 
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: idx * 0.03 }}
                              className="hover:bg-themeSoft/20 transition-all group"
                            >
                                <td className="px-8 py-6">
                                   <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-xl bg-themeDeep text-white flex items-center justify-center font-black group-hover:rotate-6 transition-transform">
                                         {u.name?.[0] || '?'}
                                      </div>
                                      <div>
                                        <p className="font-black text-lg tracking-tight group-hover:text-themePrimary transition-colors">{u.name}</p>
                                        <p className="text-[10px] font-bold text-themeDark/50">{u.email}</p>
                                      </div>
                                   </div>
                                </td>
                                <td className="px-8 py-6">
                                   <span className={`px-3 py-1 font-black text-[10px] uppercase tracking-widest rounded-lg border-2 ${
                                     u.role === 'admin' ? 'border-red-500 text-red-500 bg-red-50/50' : 
                                     u.role === 'doctor' ? 'border-themePrimary text-themePrimary bg-themeSoft/50' : 
                                     'border-blue-500 text-blue-500 bg-blue-50/50'
                                   }`}>
                                      {u.role}
                                   </span>
                                </td>
                                <td className="px-8 py-6">
                                  <span className={`px-3 py-1 font-black rounded-full text-[10px] uppercase tracking-widest border ${
                                    u.isActive !== false ? 'bg-themeSoft text-themePrimary border-themePrimary/30' : 'bg-red-50 text-red-600 border-red-200'
                                  }`}>
                                    {u.isActive !== false ? 'Active' : 'Disabled'}
                                  </span>
                                </td>
                                <td className="px-8 py-6 text-right">
                                  <button 
                                    onClick={() => handleToggleUserStatus(u._id || u.id, u.isActive !== false)}
                                    className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                      u.isActive !== false ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-themePrimary text-white hover:shadow-neon'
                                    }`}
                                  >
                                    {u.isActive !== false ? 'Deactivate' : 'Activate'}
                                  </button>
                                </td>
                            </motion.tr>
                        ))}
                      </tbody>
                   </table>
                 </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="bg-white p-10 rounded-[3rem] shadow-3d border border-themeMedium/30 glass space-y-6">
                <h3 className="text-3xl font-black text-themeDeep tracking-tight">System Audit & Compliance Trail</h3>
                <p className="text-xs font-black text-themeDark/50 uppercase tracking-widest">Real-time Platform Audit Log Snapshot</p>
                <div className="space-y-4">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="p-5 bg-themeLight/50 rounded-2xl border border-themeMedium/20 flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase text-themePrimary bg-themeSoft px-2.5 py-0.5 rounded-md">{log.action}</span>
                          <span className="text-xs font-bold text-themeDark/60">{log.user}</span>
                        </div>
                        <p className="text-sm font-bold text-themeDeep mt-1">{log.details}</p>
                      </div>
                      <span className="text-[10px] font-black text-themeDark/40">{new Date(log.timestamp).toLocaleString()}</span>
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
