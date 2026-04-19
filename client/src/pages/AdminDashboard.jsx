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
  const [stats, setStats] = useState({ users: 0, patients: 0, doctors: 0, appointments: 0 });
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, usersRes] = await Promise.all([
          api.get('/api/admin/stats'),
          api.get('/api/admin/users')
        ]);
        setStats(statsRes.data);
        setUsersList(usersRes.data);
      } catch (e) {
        console.error('Failed to fetch admin data', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Dummy analytics data for demo
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
              <h1 className="text-4xl font-black text-themeDeep">Infrastructure Control</h1>
              <p className="text-themeDark/70 font-medium mt-1 uppercase tracking-widest text-[10px]">Administrative Access Level 5 • {user.name}</p>
            </div>
            <button className="bg-themeDeep text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:shadow-3d hover:-translate-y-1 transition-all">
              <Plus size={16} className="text-themePrimary" /> New Report
            </button>
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {[
                    { label: 'TOTAL PATIENTS', value: stats.patients, sub: 'Active Records', icon: Users, color: 'text-themePrimary' },
                    { label: 'ACTIVE DOCTORS', value: stats.doctors, sub: 'Verified MDs', icon: Sparkles, color: 'text-themePrimary' },
                    { label: 'SYSTEM HEALTH', value: '100%', sub: 'All Nodes Online', icon: Activity, color: 'text-themePrimary' }
                  ].map((stat, i) => (
                    <motion.div 
                      key={i}
                      whileHover={{ scale: 1.02, y: -5 }}
                      className="bg-white p-8 rounded-[2rem] shadow-3d border border-themeMedium/30 glass hover:border-themePrimary/50 transition-all cursor-default"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <p className="text-[10px] font-black text-themeDark/50 tracking-[0.2em]">{stat.label}</p>
                        <div className={`p-2 bg-themeSoft rounded-lg ${stat.color}`}><stat.icon size={20} /></div>
                      </div>
                      <p className="text-5xl font-black text-themeDeep mt-2 mb-2 tracking-tighter">{stat.value}</p>
                      <p className="text-xs text-themePrimary font-black bg-themeSoft inline-block px-3 py-1 rounded-full">{stat.sub}</p>
                    </motion.div>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white p-8 rounded-[2.5rem] shadow-3d border border-themeMedium/30 glass">
                    <div className="flex justify-between items-center mb-10">
                       <h3 className="text-2xl font-black text-themeDeep tracking-tight italic">User Trajectory</h3>
                       <p className="text-[10px] font-black uppercase text-themeDark/40">YTD Growth Data</p>
                    </div>
                    <div className="h-80">
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
                    <div className="flex justify-between items-center mb-10">
                       <h3 className="text-2xl font-black text-themeDeep tracking-tight italic">Engagement Volume</h3>
                       <p className="text-[10px] font-black uppercase text-themeDark/40">Weekly Consultation Delta</p>
                    </div>
                    <div className="h-80">
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
              <div className="bg-white p-10 rounded-[3rem] shadow-3d border border-themeMedium/30 glass">
                 <div className="flex justify-between items-end mb-10">
                    <div>
                      <h3 className="text-3xl font-black text-themeDeep italic tracking-tighter">Identity Directory</h3>
                      <p className="text-themeDark/50 font-black uppercase text-[10px] tracking-widest mt-1">Encrypted Database View</p>
                    </div>
                    <div className="flex gap-4">
                       <input 
                        type="text" 
                        placeholder="Search UUID..." 
                        className="bg-themeLight border-2 border-themeMedium/20 rounded-xl px-4 py-2 text-xs font-black focus:outline-none focus:border-themePrimary transition-all w-64 shadow-inner" 
                       />
                    </div>
                 </div>
                 <div className="overflow-x-auto">
                   <table className="w-full text-left text-sm text-themeDeep">
                     <thead className="bg-themeSoft/50 text-[10px] font-black tracking-[0.2em] text-themeDark/70 uppercase border-b border-themeMedium/30">
                        <tr><th className="px-8 py-5">Full Legal Name</th><th className="px-8 py-5">Assigned Role</th><th className="px-8 py-5">System Status</th><th className="px-8 py-5 text-right">Operational Action</th></tr>
                     </thead>
                      <tbody className="divide-y divide-themeMedium/10">
                        {loading ? (
                            <tr><td colSpan="4" className="text-center py-20 font-black opacity-30 italic animate-pulse">Establishing secure connection...</td></tr>
                        ) : usersList.length === 0 ? (
                            <tr><td colSpan="4" className="text-center py-20 font-black opacity-30 italic">Registry entry null.</td></tr>
                        ) : usersList.map((u, idx) => (
                            <motion.tr 
                              key={u._id} 
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: idx * 0.05 }}
                              className="hover:bg-themeSoft/20 transition-all group"
                            >
                                <td className="px-8 py-6">
                                   <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-xl bg-themeDeep text-white flex items-center justify-center font-black group-hover:rotate-6 transition-transform">
                                         {u.name?.[0] || '?'}
                                      </div>
                                      <p className="font-black text-lg tracking-tight group-hover:text-themePrimary transition-colors">{u.name}</p>
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
                                <td className="px-8 py-6"><span className="px-3 py-1 font-black bg-themeSoft text-themePrimary rounded-full border border-themePrimary/30 shadow-neon text-[10px] uppercase tracking-widest">Active</span></td>
                                <td className="px-8 py-6 text-right">
                                  <button className="text-white bg-themeDeep px-6 py-2.5 rounded-xl hover:shadow-3d hover:-translate-y-1 transition-all font-black text-[10px] uppercase tracking-widest border-b-4 border-themePrimary/30 active:border-b-0 active:translate-y-0">
                                    Modify
                                  </button>
                                </td>
                            </motion.tr>
                        ))}
                      </tbody>
                   </table>
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
