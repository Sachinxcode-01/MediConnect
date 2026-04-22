import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, Clock, HeartPulse, Sparkles, Video, Database, Map, LogOut, FileText, Menu, X, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DashboardSidebar = ({ activeTab, setActiveTab, logout, role }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const patientLinks = [
    { id: 'overview', icon: Clock, label: 'Overview' },
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

  const sidebarVariants = {
    desktop: { width: isCollapsed ? 80 : 260, transition: { duration: 0.3 } },
    mobile: { x: 0, transition: { duration: 0.3 } },
    mobileClosed: { x: '-100%', transition: { duration: 0.3 } }
  };

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-3 bg-white rounded-xl shadow-lg border border-themeMedium/30 hover:shadow-neon transition-all"
      >
        <Menu className="w-6 h-6 text-themePrimary" />
      </button>

      {/* Desktop Sidebar */}
      <motion.aside
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="hidden lg:flex flex-col h-screen bg-gradient-to-b from-white to-themeSoft/20 border-r border-themeMedium/20 shadow-lg z-40 sticky top-0"
      >
        {/* Logo Section */}
        <div className="p-6 border-b border-themeMedium/20">
          <Link to="/" className="flex items-center gap-3 group">
            <motion.div
              whileHover={{ rotate: 180, scale: 1.1 }}
              transition={{ duration: 0.5 }}
              className="w-10 h-10 bg-gradient-to-br from-themePrimary to-themeDark rounded-xl flex items-center justify-center shadow-neon group-hover:shadow-neon-hover"
            >
              <Activity className="text-white w-5 h-5" />
            </motion.div>
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xl font-black tracking-tighter text-themeDeep group-hover:text-themePrimary transition-colors"
              >
                MediConnect
              </motion.span>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto custom-scrollbar">
          {links.map((link, idx) => (
            <motion.button
              key={link.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => setActiveTab(link.id)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden ${
                activeTab === link.id
                  ? 'bg-gradient-to-r from-themePrimary/10 to-themePrimary/5 text-themePrimary border border-themePrimary/30 shadow-md'
                  : 'text-themeDark/60 hover:bg-white hover:text-themePrimary hover:translate-x-1'
              }`}
            >
              {activeTab === link.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-gradient-to-r from-themePrimary/5 to-transparent"
                  transition={{ type: "spring", duration: 0.5 }}
                />
              )}
              <link.icon
                size={20}
                className={`relative z-10 ${activeTab === link.id ? 'text-themePrimary' : 'group-hover:text-themePrimary'} transition-colors`}
              />
              {!isCollapsed && (
                <span className="relative z-10 font-bold text-sm">{link.label}</span>
              )}
              {!isCollapsed && activeTab === link.id && (
                <ChevronRight className="ml-auto w-4 h-4 text-themePrimary" />
              )}
            </motion.button>
          ))}

          {/* Quick Actions Divider */}
          <div className="my-4 border-t border-themeMedium/20" />

          {/* Quick Actions */}
          <div className="space-y-1">
            <button
              onClick={() => window.location.href = '/telehealth'}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all text-themeDark/60 hover:bg-white hover:text-themePrimary hover:translate-x-1 group"
            >
              <Video size={20} className="group-hover:text-themePrimary transition-colors" />
              {!isCollapsed && <span className="font-bold text-sm">Telehealth</span>}
            </button>
            <button
              onClick={() => window.location.href = '/records'}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all text-themeDark/60 hover:bg-white hover:text-themePrimary hover:translate-x-1 group"
            >
              <Database size={20} className="group-hover:text-themePrimary transition-colors" />
              {!isCollapsed && <span className="font-bold text-sm">Medical Records</span>}
            </button>
          </div>
        </nav>

        {/* Collapse Toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex items-center justify-center gap-2 p-3 mx-3 mb-2 rounded-xl border border-themeMedium/20 hover:bg-white hover:shadow-md transition-all text-themeDark/60 hover:text-themePrimary"
        >
          {isCollapsed ? <ChevronRight size={18} /> : <span className="text-xs font-black uppercase tracking-widest">Collapse</span>}
        </button>

        {/* Logout Section */}
        <div className="p-3 border-t border-themeMedium/20">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all text-red-500 hover:bg-red-50 hover:shadow-md group"
          >
            <LogOut size={20} className="group-hover:rotate-180 transition-transform duration-500" />
            {!isCollapsed && <span className="font-bold text-sm">Logout</span>}
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
              className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="lg:hidden fixed top-0 left-0 h-full w-72 bg-white shadow-2xl z-50 flex flex-col"
            >
              {/* Mobile Header */}
              <div className="flex items-center justify-between p-6 border-b border-themeMedium/20">
                <Link to="/" className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-themePrimary to-themeDark rounded-xl flex items-center justify-center shadow-neon">
                    <Activity className="text-white w-5 h-5" />
                  </div>
                  <span className="text-xl font-black tracking-tighter text-themeDeep">MediConnect</span>
                </Link>
                <button
                  onClick={() => setIsMobileOpen(false)}
                  className="p-2 hover:bg-themeSoft rounded-xl transition-colors"
                >
                  <X className="w-6 h-6 text-themeDeep" />
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
                        ? 'bg-gradient-to-r from-themePrimary/10 to-themePrimary/5 text-themePrimary border border-themePrimary/30'
                        : 'text-themeDark/60 hover:bg-themeSoft/30'
                    }`}
                  >
                    <link.icon size={20} className={activeTab === link.id ? 'text-themePrimary' : ''} />
                    <span className="font-bold text-sm">{link.label}</span>
                  </button>
                ))}

                <div className="my-4 border-t border-themeMedium/20" />

                <button
                  onClick={() => { window.location.href = '/telehealth'; setIsMobileOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-themeDark/60 hover:bg-themeSoft/30"
                >
                  <Video size={20} />
                  <span className="font-bold text-sm">Telehealth</span>
                </button>
                <button
                  onClick={() => { window.location.href = '/records'; setIsMobileOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-themeDark/60 hover:bg-themeSoft/30"
                >
                  <Database size={20} />
                  <span className="font-bold text-sm">Medical Records</span>
                </button>
              </nav>

              {/* Mobile Logout */}
              <div className="p-4 border-t border-themeMedium/20">
                <button
                  onClick={logout}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl text-red-500 bg-red-50 hover:bg-red-100 transition-all font-bold"
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
