import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, Clock, HeartPulse, Sparkles, Video, Database, Map, LogOut, FileText } from 'lucide-react';
import { motion } from 'framer-motion';

const DashboardSidebar = ({ activeTab, setActiveTab, logout, role }) => {
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

  return (
    <motion.div 
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="w-64 bg-white border-r border-themeMedium/30 flex flex-col shadow-sm z-30"
    >
      <Link to="/" className="p-6 text-2xl font-black flex items-center gap-2 border-b border-themeMedium/30 text-themeDeep hover:bg-themeSoft transition-colors">
        <Activity className="text-themePrimary" /> MediConnect
      </Link>
      
      <nav className="flex-1 px-4 py-6 space-y-2">
        {links.map((link) => (
          <button 
            key={link.id}
            onClick={() => setActiveTab(link.id)} 
            className={`w-full text-left px-4 py-3 font-bold flex items-center gap-3 rounded-xl transition-all group ${
              activeTab === link.id 
                ? 'bg-themeSoft border border-themePrimary text-themePrimary shadow-sm scale-[1.02]' 
                : 'text-gray-500 hover:bg-gray-50 hover:translate-x-1'
            }`}
          >
            <link.icon size={18} className={`${activeTab === link.id ? 'text-themePrimary' : 'group-hover:text-themePrimary'} transition-colors`} />
            {link.label}
          </button>
        ))}

        <hr className="my-4 border-themeMedium/20" />

        <button onClick={() => window.location.href='/telehealth'} className="w-full text-left px-4 py-3 font-bold flex items-center gap-3 rounded-xl transition-all text-gray-500 hover:bg-gray-50 hover:translate-x-1 group">
          <Video size={18} className="group-hover:text-themePrimary" /> Telehealth
        </button>
        <button onClick={() => window.location.href='/records'} className="w-full text-left px-4 py-3 font-bold flex items-center gap-3 rounded-xl transition-all text-gray-500 hover:bg-gray-50 hover:translate-x-1 group">
          <Database size={18} className="group-hover:text-themePrimary" /> Medical Records
        </button>
      </nav>

      <div className="p-4 border-t border-themeMedium/30 mt-auto">
        <button 
          onClick={logout} 
          className="w-full text-left px-4 py-3 font-bold text-red-500 hover:bg-red-50 rounded-xl flex items-center gap-3 transition-all hover:translate-x-1"
        >
          <LogOut size={18} /> Logout
        </button>
      </div>
    </motion.div>
  );
};

export default DashboardSidebar;
