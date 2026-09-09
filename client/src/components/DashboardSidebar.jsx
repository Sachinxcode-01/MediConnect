import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, Clock, HeartPulse, Sparkles, Video, Database, Map, LogOut, FileText, Menu, X, ChevronRight, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DashboardSidebar = ({ activeTab, setActiveTab, logout, role }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const patientLinks = [
    { id: 'overview', icon: Clock, label: 'Overview' },
    { id: 'doctors', icon: Users, label: 'Find Doctors' },
    { id: 'timeline', icon: Database, label: 'Health Timeline' },
    { id: 'symptom', icon: Activity, label: 'Symptom Checker' },
    { id: 'vision', icon: Sparkles, label: 'AI Vision Lab' },
    { id: 'wearables', icon: HeartPulse, label: 'Wearables Live' },
    { id: 'health-report', icon: Sparkles, label: 'Daily AI Report' },
    { id: 'prescriptions', icon: FileText, label: 'Prescriptions' },
    { id: 'pharmacy', icon: Map, label: 'Nearby Pharmacy' }
  ];

  const doctorLinks = [
    { id: 'triage', icon: Activity, label: 'Triage Queue' },
    { id: 'appointments', icon: Clock, label: 'Appointments' },
    { id: 'patients', icon: HeartPulse, label: 'My Patients' },
    { id: 'prescriptions', icon: FileText, label: 'Issued Prescriptions' }
  ];

  const adminLinks = [
    { id: 'analytics', icon: Activity, label: 'Analytics' },
    { id: 'users', icon: HeartPulse, label: 'Manage Users' },
    { id: 'settings', icon: Clock, label: 'Settings' }
  ];

  const links = role === 'admin' ? adminLinks : role === 'doctor' ? doctorLinks : patientLinks;

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-3 bg-slate-900 rounded-xl shadow-lg border border-slate-800 hover:border-emerald-500 transition-all text-white"
      >
        <Menu className="w-6 h-6 text-emerald-400" />
      </button>

      {/* Desktop Sidebar */}
      <motion.aside
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className={`hidden lg:flex flex-col h-screen bg-[#030712] border-r border-slate-800/80 shadow-2xl z-40 sticky top-0 transition-all duration-300 ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Logo Section */}
        <div className="p-6 border-b border-slate-800/80">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/25 group-hover:scale-105 transition-transform shrink-0">
              <Activity className="text-slate-950 w-5 h-5 stroke-[2.5]" />
            </div>
            {!isCollapsed && (
              <span className="text-xl font-black tracking-tight text-white group-hover:text-emerald-400 transition-colors">
                MediConnect
              </span>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
          {links.map((link) => (
            <button
              key={link.id}
              onClick={() => setActiveTab(link.id)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative ${
                activeTab === link.id
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/40 font-black shadow-lg shadow-emerald-500/10'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-white font-medium'
              }`}
            >
              <link.icon
                size={20}
                className={`relative z-10 ${activeTab === link.id ? 'text-emerald-400' : 'group-hover:text-white'} transition-colors`}
              />
              {!isCollapsed && (
                <span className="relative z-10 text-sm">{link.label}</span>
              )}
              {!isCollapsed && activeTab === link.id && (
                <ChevronRight className="ml-auto w-4 h-4 text-emerald-400" />
              )}
            </button>
          ))}

          {/* Quick Actions Divider */}
          <div className="my-4 border-t border-slate-800/80" />

          {/* Quick Actions */}
          <div className="space-y-1">
            <button
              onClick={() => window.location.href = '/telehealth'}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all text-slate-400 hover:bg-slate-900 hover:text-white font-medium"
            >
              <Video size={20} />
              {!isCollapsed && <span className="text-sm">Telehealth</span>}
            </button>
            <button
              onClick={() => window.location.href = '/records'}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all text-slate-400 hover:bg-slate-900 hover:text-white font-medium"
            >
              <Database size={20} />
              {!isCollapsed && <span className="text-sm">Medical Records</span>}
            </button>
          </div>
        </nav>

        {/* Collapse Toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex items-center justify-center gap-2 p-3 mx-3 mb-2 rounded-xl border border-slate-800 hover:bg-slate-900 transition-all text-slate-400 hover:text-white text-xs font-bold uppercase tracking-wider"
        >
          {isCollapsed ? <ChevronRight size={18} /> : <span>Collapse</span>}
        </button>

        {/* Logout Section */}
        <div className="p-3 border-t border-slate-800/80">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all text-red-400 hover:bg-red-950/30 hover:border hover:border-red-500/30 font-bold text-sm"
          >
            <LogOut size={20} />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </motion.aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="lg:hidden fixed top-0 left-0 h-full w-72 bg-slate-950 border-r border-slate-800 shadow-2xl z-50 flex flex-col"
            >
              {/* Mobile Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-800">
                <Link to="/" className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/25">
                    <Activity className="text-slate-950 w-5 h-5 stroke-[2.5]" />
                  </div>
                  <span className="text-xl font-black tracking-tight text-white">MediConnect</span>
                </Link>
                <button
                  onClick={() => setIsMobileOpen(false)}
                  className="p-2 hover:bg-slate-900 rounded-xl transition-colors text-slate-400"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Mobile Navigation */}
              <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                {links.map((link) => (
                  <button
                    key={link.id}
                    onClick={() => {
                      setActiveTab(link.id);
                      setIsMobileOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                      activeTab === link.id
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/40 font-black shadow-lg shadow-emerald-500/10'
                        : 'text-slate-400 hover:bg-slate-900 hover:text-white font-medium'
                    }`}
                  >
                    <link.icon size={20} className={activeTab === link.id ? 'text-emerald-400' : ''} />
                    <span className="text-sm">{link.label}</span>
                  </button>
                ))}
              </nav>

              {/* Mobile Logout */}
              <div className="p-4 border-t border-slate-800">
                <button
                  onClick={logout}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl text-red-400 bg-red-950/30 border border-red-500/30 hover:bg-red-900/40 transition-all font-bold text-sm"
                >
                  <LogOut size={20} />
                  Logout
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default DashboardSidebar;
