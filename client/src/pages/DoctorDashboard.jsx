import React, { useContext, useEffect, useState, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { LogOut, Activity, Users, Calendar, Video, Database, Sparkles, FileText, Send, X, ClipboardList } from 'lucide-react';
import api from '../api/axios';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardSidebar from '../components/DashboardSidebar';
import ReactMarkdown from 'react-markdown';

const DoctorDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [queue, setQueue] = useState([]);
  const [activeTab, setActiveTab] = useState('triage');
  const [patients, setPatients] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Analysis State
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [analysisText, setAnalysisText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Prescription State
  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false);
  const [newPrescription, setNewPrescription] = useState({
    patientId: '',
    medication: '',
    dosage: '',
    instructions: '',
    duration: '',
    frequency: 'Once daily'
  });

  const socketRef = useRef();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [queueRes, patientsRes, prescriptionsRes] = await Promise.all([
          api.get('/api/triage/queue'),
          api.get('/api/patients'),
          api.get('/api/prescriptions')
        ]);
        setQueue(queueRes.data);
        setPatients(patientsRes.data);
        setPrescriptions(prescriptionsRes.data);
      } catch (e) {
        console.error(e);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    socketRef.current = io(import.meta.env.VITE_API_URL || 'http://localhost:5000');
    socketRef.current.on('new-triage-entry', (data) => {
      setQueue(prev => [data, ...prev]);
      toast('New Patient in Queue!', { icon: '🚨', position: 'top-right' });
    });

    return () => socketRef.current.disconnect();
  }, []);

  const handleAcceptTriage = (patientId) => {
    socketRef.current.emit('doctor-ready', { patientId });
    toast.success('Patient notified. Joining telehealth...');
    setTimeout(() => {
        window.location.href = `/telehealth?roomId=${patientId}`;
    }, 1500);
  };

  const handleAnalyzeEntry = async (entry) => {
    setSelectedEntry(entry);
    setIsAnalysisModalOpen(true);
    setAnalysisText('');
    setIsAnalyzing(true);
    try {
      const res = await api.post('/api/triage/analyze', {
        symptoms: entry.symptoms,
        severity: entry.severity
      });
      setAnalysisText(res.data.analysis);
    } catch (e) {
      toast.error('AI Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSendPrescription = async (e) => {
    e.preventDefault();
    if (!newPrescription.patientId || !newPrescription.medication) {
      return toast.error('Please select a patient and medication');
    }

    try {
      const res = await api.post('/api/prescriptions', newPrescription);
      toast.success('Prescription issued successfully!');
      setIsPrescriptionModalOpen(false);
      setPrescriptions([res.data, ...prescriptions]);
      setNewPrescription({ patientId: '', medication: '', dosage: '', instructions: '', duration: '', frequency: 'Once daily' });
    } catch (e) {
      toast.error('Failed to issue prescription');
    }
  };

  return (
    <div className="flex h-screen bg-themeLight font-geist overflow-hidden">
      <DashboardSidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        logout={logout} 
        role="doctor" 
      />

      <main className="flex-1 p-8 overflow-y-auto bg-themeLight relative z-10 scroll-smooth">
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.5 }}
        >
          <header className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-black text-themeDeep">Dr. {user.name}</h1>
              <p className="text-themeDark/70 font-medium mt-1 uppercase tracking-widest text-xs">Healthcare Professional Panel • {new Date().toLocaleDateString()}</p>
            </div>
            <button 
              onClick={() => setIsPrescriptionModalOpen(true)}
              className="bg-themeDeep text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:shadow-3d hover:-translate-y-1 transition-all"
            >
              <FileText size={16} className="text-themePrimary" /> New Prescription
            </button>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
            {[
              { label: 'Triage Queue', value: queue.length, icon: Activity, trend: '+2 this hour', color: 'text-themePrimary' },
              { label: 'Patient Registry', value: patients.length, icon: Users, trend: 'Verified', color: 'text-blue-500' },
              { label: 'Neural Index', value: '4.2ms', icon: Sparkles, trend: 'Ultra-Fast', color: 'text-purple-500' },
              { label: 'Historical Ledger', value: prescriptions.length, icon: Database, trend: 'Sync Active', color: 'text-orange-500' }
            ].map((kpi, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -5 }}
                className="bg-white p-6 rounded-[2rem] shadow-glass border border-themeMedium/30 flex items-start justify-between relative overflow-hidden group"
              >
                <div className="relative z-10">
                  <p className="text-[10px] font-black text-themeDark/50 uppercase tracking-widest mb-1">{kpi.label}</p>
                  <h3 className="text-3xl font-black text-themeDeep">{kpi.value}</h3>
                  <p className="text-[9px] font-black text-themePrimary mt-1 uppercase tracking-tighter">{kpi.trend}</p>
                </div>
                <div className={`p-3 bg-themeSoft rounded-2xl ${kpi.color} group-hover:scale-110 transition-transform`}>
                  <kpi.icon size={20} />
                </div>
                <div className="absolute -bottom-2 -left-2 w-16 h-16 bg-themeSoft/20 rounded-full blur-2xl group-hover:bg-themePrimary/5 transition-colors"></div>
              </motion.div>
            ))}
          </div>
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
            {activeTab === 'triage' && (
              <div className="bg-white rounded-[2.5rem] shadow-3d border border-themeMedium/30 overflow-hidden glass transition-all">
                <div className="p-8 border-b border-themeMedium/30 flex justify-between items-center bg-gray-50/30">
                  <div>
                    <h2 className="text-2xl font-black text-themeDeep tracking-tight">Active Triage Queue</h2>
                    <p className="text-xs font-black text-themeDark/50 uppercase tracking-widest mt-1">Live Feed • High Priority Restricted</p>
                  </div>
                  <div className="flex gap-4">
                    <span className="text-xs border-2 border-themePrimary text-themePrimary bg-themeSoft px-4 py-2 rounded-full font-black flex items-center gap-2">
                       <span className="w-2 h-2 rounded-full bg-themePrimary animate-pulse"></span> {queue.length} ACTIVE
                    </span>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-themeDeep">
                    <thead className="bg-themeSoft/30 text-[10px] text-themeDark/70 uppercase font-black tracking-widest border-b border-themeMedium/20">
                      <tr>
                        <th className="px-8 py-6">Patient Identifier</th>
                        <th className="px-8 py-6">Symptoms & Logic</th>
                        <th className="px-8 py-6 text-center">Severity</th>
                        <th className="px-8 py-6 text-right">Emergency Ops</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-themeMedium/10">
                      {loading ? (
                        <tr><td colSpan="4" className="px-8 py-20 text-center font-black animate-pulse opacity-30">Syncing with medical nodes...</td></tr>
                      ) : queue.length === 0 ? (
                        <tr><td colSpan="4" className="px-8 py-20 text-center font-bold text-themeDark/40 italic">Waiting for incoming triage entries...</td></tr>
                      ) : queue.map((q, idx) => (
                        <motion.tr 
                          key={q._id} 
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className="hover:bg-themeSoft/20 transition-colors group"
                        >
                          <td className="px-8 py-6">
                             <div className="flex items-center gap-4">
                                <div className={`relative w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl shadow-lg border-b-4 ${
                                  q.severity === 'critical' ? 'bg-red-600 text-white border-red-800' : 'bg-themeDeep text-white border-themePrimary/30'
                                }`}>
                                   {q.patientId?.name?.[0] || '?'}
                                   {q.severity === 'critical' && (
                                     <div className="absolute inset-0 rounded-2xl animate-ping bg-red-500/30 -z-10"></div>
                                   )}
                                </div>
                                <div>
                                   <p className={`font-black text-lg tracking-tight transition-colors ${
                                     q.severity === 'critical' ? 'text-red-600' : 'group-hover:text-themePrimary'
                                   }`}>{q.patientId?.name || 'Anonymous'}</p>
                                   <p className="text-[9px] text-themeDark/50 font-black uppercase tracking-tight">Record Ref: {q._id.slice(-12)}</p>
                                </div>
                             </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex flex-col gap-1">
                               <p className="font-bold text-themeDeep/80 text-sm line-clamp-1">{q.symptoms}</p>
                               <div className="flex gap-1 overflow-x-auto no-scrollbar py-1">
                                 {q.ai_analysis?.possibleConditions?.map((c, i) => (
                                   <span key={i} className="text-[7px] font-black uppercase text-themeDark/40 bg-themeSoft px-2 py-0.5 rounded-full border border-themeMedium/20 whitespace-nowrap">
                                     {c}
                                   </span>
                                 ))}
                               </div>
                               <button 
                                 onClick={() => handleAnalyzeEntry(q)}
                                 className="flex items-center gap-1.5 text-[9px] font-black uppercase text-themePrimary hover:text-themeDeep transition-colors w-fit mt-0.5"
                               >
                                 <Sparkles size={10} /> Get AI Clinical Brief
                               </button>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex justify-center">
                              <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm border-2 ${
                                q.severity === 'critical' ? 'bg-red-500 text-white border-red-600' :
                                q.severity === 'high' ? 'bg-orange-500 text-white border-orange-600' :
                                q.severity === 'medium' ? 'bg-yellow-500 text-white border-yellow-600' : 
                                'bg-themePrimary text-white border-themePrimary'
                              }`}>
                                {q.severity}
                              </span>
                            </div>
                          </td>
                          <td className="px-8 py-6 text-right">
                            <button 
                              onClick={() => handleAcceptTriage(q.patientId?._id)}
                              className="text-white bg-themePrimary px-6 py-3 rounded-xl hover:shadow-neon hover:-translate-y-1 active:translate-y-0 transition-all font-black text-xs uppercase tracking-wider flex items-center gap-2 ml-auto"
                            >
                              <Video size={16} /> Commence
                            </button>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'appointments' && (
              <div className="bg-white rounded-3xl shadow-3d border border-themeMedium/30 p-10 glass">
                <h2 className="text-2xl font-black mb-8 text-themeDeep flex items-center gap-3 italic tracking-tight">
                  <Calendar className="text-themePrimary" /> Telehealth Calendar
                </h2>
                <div className="p-20 text-center border-4 border-dashed border-themeMedium/30 rounded-[3rem] bg-gray-50/20">
                  <div className="w-24 h-24 bg-themeSoft rounded-[2rem] flex items-center justify-center mx-auto mb-6 rotate-3">
                    <Calendar className="text-themePrimary/50" size={48} />
                  </div>
                  <p className="text-themeDeep font-black text-2xl italic mb-2 tracking-tighter">Zero Scheduled Slots</p>
                  <p className="text-themeDark/50 font-bold max-w-xs mx-auto text-sm">Your shift is currently reactive. Use the Triage Queue for on-demand consultations.</p>
                </div>
              </div>
            )}
            
            {activeTab === 'patients' && (
              <div className="bg-white rounded-3xl shadow-3d border border-themeMedium/30 p-10 glass">
                <h2 className="text-2xl font-black mb-8 text-themeDeep flex items-center gap-3 italic tracking-tight">
                  <Users className="text-themePrimary" /> Comprehensive Registry
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   {patients.map((p, idx) => (
                     <motion.div 
                        key={p._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="p-6 bg-themeLight/50 border border-themeMedium/30 rounded-3xl hover:border-themePrimary hover:bg-white transition-all group"
                     >
                        <div className="flex items-center gap-4 mb-4">
                           <div className="w-14 h-14 rounded-2xl bg-themeDeep text-white flex items-center justify-center font-black text-2xl group-hover:scale-110 transition-transform">
                              {p.name?.[0] || 'P'}
                           </div>
                           <div>
                              <h4 className="font-black text-themeDeep tracking-tight group-hover:text-themePrimary transition-colors">{p.name || 'Anonymous Patient'}</h4>
                              <p className="text-[10px] font-bold text-themeDark/40 uppercase uppercase">{p.email}</p>
                           </div>
                        </div>
                        <div className="space-y-2 mb-4">
                           <div className="flex justify-between text-[10px]">
                              <span className="font-black text-themeDark/50 uppercase">BLOOD GROUP</span>
                              <span className="font-black text-themePrimary">{p.blood_group || 'O+'}</span>
                           </div>
                           <div className="flex justify-between text-[10px]">
                              <span className="font-black text-themeDark/50 uppercase">GENDER</span>
                              <span className="font-black text-themeDeep uppercase">{p.gender || 'Not Set'}</span>
                           </div>
                        </div>
                        <button 
                           onClick={() => {
                             setNewPrescription({...newPrescription, patientId: p._id});
                             setIsPrescriptionModalOpen(true);
                           }}
                           className="w-full py-3 bg-white border-2 border-themeMedium/30 rounded-2xl text-[10px] font-black uppercase text-themeDark/50 hover:border-themePrimary hover:text-themePrimary transition-all flex items-center justify-center gap-2"
                        >
                           <FileText size={14} /> New Prescription
                        </button>
                     </motion.div>
                   ))}
                </div>
              </div>
            )}

            {activeTab === 'prescriptions' && (
              <div className="bg-white rounded-3xl shadow-3d border border-themeMedium/30 overflow-hidden glass transition-all">
                <div className="p-8 border-b border-themeMedium/30 flex justify-between items-center bg-gray-50/30">
                  <div>
                    <h2 className="text-2xl font-black text-themeDeep tracking-tight italic">Prescription Ledger</h2>
                    <p className="text-[10px] font-black text-themeDark/50 uppercase tracking-widest mt-1">Historically Issued Medications</p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-themeDeep">
                    <thead className="bg-themeSoft/30 text-[10px] text-themeDark/70 uppercase font-black tracking-widest border-b border-themeMedium/20">
                      <tr>
                        <th className="px-8 py-6">Date Issued</th>
                        <th className="px-8 py-6">Identity</th>
                        <th className="px-8 py-6">Pharmacological Agent</th>
                        <th className="px-8 py-6">Dosage & Instructions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-themeMedium/10">
                      {prescriptions.length === 0 ? (
                        <tr><td colSpan="4" className="px-8 py-20 text-center font-bold text-themeDark/40 italic">No prescriptions found in the ledger.</td></tr>
                      ) : prescriptions.map((p, idx) => (
                        <tr key={p._id} className="hover:bg-themeSoft/20 transition-colors">
                          <td className="px-8 py-6 font-bold text-themeDeep/50">{new Date(p.created_at).toLocaleDateString()}</td>
                          <td className="px-8 py-6 font-black">{p.patientId?.name || 'N/A'}</td>
                          <td className="px-8 py-6">
                             <div className="flex flex-col">
                                <span className="font-black text-themePrimary">{p.medication}</span>
                                <span className="text-[9px] font-black text-themeDark/40 uppercase">{p.duration}</span>
                             </div>
                          </td>
                          <td className="px-8 py-6">
                             <p className="font-bold text-themeDeep/80">{p.dosage}</p>
                             <p className="text-[10px] text-themeDark/50 line-clamp-1">{p.instructions}</p>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* AI Clinical Brief Modal */}
      <AnimatePresence>
        {isAnalysisModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAnalysisModalOpen(false)}
              className="absolute inset-0 bg-themeDeep/40 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-2xl rounded-[3rem] shadow-3d border border-white/20 p-10 relative z-10 glass overflow-hidden"
            >
              <div className="flex justify-between items-start mb-8">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-themeSoft rounded-2xl text-themePrimary">
                    <ClipboardList size={32} />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-themeDeep tracking-tighter">Clinical Brief</h2>
                    <p className="text-[10px] font-black text-themePrimary uppercase tracking-widest">AI Generated Analysis • Gemini 2.0 Flash</p>
                  </div>
                </div>
                <button onClick={() => setIsAnalysisModalOpen(false)} className="p-2 hover:bg-themeSoft rounded-full transition-colors">
                  <X size={24} className="text-themeDeep" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="p-6 bg-themeLight/50 rounded-3xl border border-themeMedium/20">
                   <p className="text-[10px] font-black text-themeDark/50 uppercase tracking-widest mb-2">Patient Symbols</p>
                   <p className="text-lg font-black text-themeDeep">{selectedEntry?.symptoms}</p>
                </div>

                <div className="p-8 bg-white/50 rounded-[2rem] border border-themePrimary/20 relative min-h-[200px]">
                   {isAnalyzing ? (
                     <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                        <Sparkles className="text-themePrimary animate-spin" size={40} />
                        <p className="text-sm font-black text-themePrimary animate-pulse">Running Diagnostic Logic...</p>
                     </div>
                   ) : (
                     <div className="prose prose-slate max-w-none prose-p:font-bold prose-li:font-bold text-themeDeep">
                        <ReactMarkdown>{analysisText}</ReactMarkdown>
                     </div>
                   )}
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-themeMedium/20 flex gap-4">
                <button 
                  onClick={() => handleAcceptTriage(selectedEntry?.patientId?._id)}
                  className="flex-1 bg-themePrimary text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:shadow-neon transition-all flex items-center justify-center gap-2"
                >
                  <Video size={18} /> Join Telehealth
                </button>
                <button 
                  onClick={() => setIsAnalysisModalOpen(false)}
                  className="px-8 bg-themeSoft text-themePrimary py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-themeMedium transition-all"
                >
                  Dismiss
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* New Prescription Modal */}
      <AnimatePresence>
        {isPrescriptionModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsPrescriptionModalOpen(false)}
              className="absolute inset-0 bg-themeDeep/40 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-xl rounded-[3rem] shadow-3d border border-white/20 p-10 relative z-10 glass"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-black text-themeDeep tracking-tighter italic">Issue Digital Prescription</h2>
                <button onClick={() => setIsPrescriptionModalOpen(false)} className="p-2 hover:bg-themeSoft rounded-full">
                  <X size={24} strokeWidth={3} />
                </button>
              </div>

              <form onSubmit={handleSendPrescription} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-themeDark/50 uppercase tracking-widest ml-1">Assigned Patient</label>
                  <select 
                    value={newPrescription.patientId}
                    onChange={(e) => setNewPrescription({...newPrescription, patientId: e.target.value})}
                    className="w-full bg-themeLight border-2 border-themeMedium/20 rounded-2xl px-5 py-3 outline-none focus:border-themePrimary font-bold text-themeDeep transition-all appearance-none"
                  >
                    <option value="">Select Target Identity...</option>
                    {patients.map(p => (
                      <option key={p._id} value={p._id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-themeDark/50 uppercase tracking-widest ml-1">Medication Name</label>
                    <input 
                      type="text" required placeholder="e.g. Lisinopril"
                      value={newPrescription.medication}
                      onChange={(e) => setNewPrescription({...newPrescription, medication: e.target.value})}
                      className="w-full bg-themeLight border-2 border-themeMedium/20 rounded-2xl px-5 py-3 outline-none focus:border-themePrimary font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-themeDark/50 uppercase tracking-widest ml-1">Dosage Format</label>
                    <input 
                      type="text" required placeholder="10mg once daily"
                      value={newPrescription.dosage}
                      onChange={(e) => setNewPrescription({...newPrescription, dosage: e.target.value})}
                      className="w-full bg-themeLight border-2 border-themeMedium/20 rounded-2xl px-5 py-3 outline-none focus:border-themePrimary font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-themeDark/50 uppercase tracking-widest ml-1">Clinical Instructions</label>
                  <textarea 
                    rows="3" required placeholder="Take after breakfast with water. Avoid direct sunlight."
                    value={newPrescription.instructions}
                    onChange={(e) => setNewPrescription({...newPrescription, instructions: e.target.value})}
                    className="w-full bg-themeLight border-2 border-themeMedium/20 rounded-2xl px-5 py-3 outline-none focus:border-themePrimary font-bold resize-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-themeDark/50 uppercase tracking-widest ml-1">Course Duration</label>
                  <input 
                    type="text" required placeholder="30-day course"
                    value={newPrescription.duration}
                    onChange={(e) => setNewPrescription({...newPrescription, duration: e.target.value})}
                    className="w-full bg-themeLight border-2 border-themeMedium/20 rounded-2xl px-5 py-3 outline-none focus:border-themePrimary font-bold"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full bg-themeDeep text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-3d hover:shadow-neon hover:-translate-y-1 transition-all flex items-center justify-center gap-3 mt-4"
                >
                  <Send size={18} /> Transmit Prescription
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DoctorDashboard;
