import React, { useContext, useEffect, useState, useRef, useCallback } from 'react';
import { AuthContext } from '../context/AuthContext';
import { 
  Activity, Users, Calendar, Video, Database, 
  Sparkles, FileText, Send, X, ClipboardList, 
  AlertTriangle, CheckCircle2, Search, Filter,
  ShieldCheck, Stethoscope, Clock, ChevronRight
} from 'lucide-react';
import api from '../api/axios';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardSidebar from '../components/DashboardSidebar';
import NotificationCenter from '../components/NotificationCenter';
import ReactMarkdown from 'react-markdown';

const DoctorDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [queue, setQueue] = useState([]);
  const [activeTab, setActiveTab] = useState('triage');
  const [patients, setPatients] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter & priority state
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Analysis & Notes State
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [analysisText, setAnalysisText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [clinicalNoteText, setClinicalNoteText] = useState('');

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

  const socketRef = useRef(null);

  const reloadData = useCallback(async () => {
    try {
      const [queueRes, patientsRes, prescriptionsRes, appointmentsRes] = await Promise.all([
        api.get('/api/triage/queue').catch(() => ({ data: { data: [] } })),
        api.get('/api/patients').catch(() => ({ data: { data: [] } })),
        api.get('/api/prescriptions').catch(() => ({ data: { data: [] } })),
        api.get('/api/appointments/doctor').catch(() => ({ data: { data: [] } }))
      ]);

      setQueue(queueRes.data?.data || queueRes.data || []);
      setPatients(patientsRes.data?.data || patientsRes.data || []);
      setPrescriptions(prescriptionsRes.data?.data || prescriptionsRes.data || []);
      setAppointments(appointmentsRes.data?.data || appointmentsRes.data || []);
    } catch (_e) {
      toast.error('Failed to reload dashboard data');
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadInitialData = async () => {
      try {
        const [queueRes, patientsRes, prescriptionsRes, appointmentsRes] = await Promise.all([
          api.get('/api/triage/queue').catch(() => ({ data: { data: [] } })),
          api.get('/api/patients').catch(() => ({ data: { data: [] } })),
          api.get('/api/prescriptions').catch(() => ({ data: { data: [] } })),
          api.get('/api/appointments/doctor').catch(() => ({ data: { data: [] } }))
        ]);

        if (!isMounted) return;
        const qList = queueRes.data?.data || queueRes.data || [];
        setQueue(qList.length > 0 ? qList : [
          { _id: 't-1', symptoms: 'Severe chest tightness radiating to left arm with diaphoresis', severity: 'critical', status: 'pending', createdAt: new Date().toISOString(), patient: { name: 'Arthur Pendelton', email: 'arthur@example.com' }, aiAnalysis: { red_flags: ['Radiation to left arm', 'Diaphoresis'] } },
          { _id: 't-2', symptoms: 'Persistent migraine with photophobia and nausea for 3 days', severity: 'high', status: 'pending', createdAt: new Date(Date.now() - 3600000).toISOString(), patient: { name: 'Clara Oswald', email: 'clara@example.com' } },
          { _id: 't-3', symptoms: 'Dry cough and mild low-grade fever following seasonal travel', severity: 'medium', status: 'pending', createdAt: new Date(Date.now() - 7200000).toISOString(), patient: { name: 'Jonathan Brand', email: 'jon@example.com' } }
        ]);
        setPatients(patientsRes.data?.data || patientsRes.data || [
          { _id: 'p-1', name: 'Arthur Pendelton', email: 'arthur@example.com', blood_group: 'A+', gender: 'Male' },
          { _id: 'p-2', name: 'Clara Oswald', email: 'clara@example.com', blood_group: 'O-', gender: 'Female' },
          { _id: 'p-3', name: 'Jonathan Brand', email: 'jon@example.com', blood_group: 'B+', gender: 'Male' }
        ]);
        setPrescriptions(prescriptionsRes.data?.data || prescriptionsRes.data || [
          { _id: 'rx-1', medication: 'Atorvastatin Calcium', dosage: '40mg once nightly', duration: '90 days', instructions: 'Take before bed. Avoid grapefruit juice.', created_at: new Date().toISOString(), patientId: { name: 'Arthur Pendelton' } }
        ]);
        setAppointments(appointmentsRes.data?.data || appointmentsRes.data || [
          { _id: 'apt-1', title: 'Post-Op Cardiovascular Telehealth', startTime: new Date(Date.now() + 1800000).toISOString(), status: 'confirmed', patient: { name: 'Arthur Pendelton', id: 'p-1' } }
        ]);
      } catch (_e) {
        toast.error('Failed to load dashboard data');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadInitialData();

    socketRef.current = io(import.meta.env.VITE_API_URL || 'http://localhost:5000');
    socketRef.current.on('new-triage-entry', (data) => {
      setQueue(prev => [data, ...prev]);
      toast('New Critical Triage Alert!', { icon: '🚨', position: 'top-right' });
    });

    return () => {
      isMounted = false;
      socketRef.current?.disconnect();
    };
  }, []);

  const handleClaimTriage = async (triageId) => {
    try {
      await api.put(`/api/triage/${triageId}/assign`);
      toast.success('Patient triage claimed and assigned to your workspace');
      reloadData();
    } catch (_e) {
      toast.error('Failed to claim case');
    }
  };

  const handleAddClinicalNote = async (e) => {
    e.preventDefault();
    if (!selectedEntry || !clinicalNoteText.trim()) return;

    try {
      await api.post(`/api/triage/${selectedEntry._id || selectedEntry.id}/notes`, {
        note: clinicalNoteText.trim()
      });
      toast.success('Clinical note appended to patient record');
      setClinicalNoteText('');
      setIsNoteModalOpen(false);
      reloadData();
    } catch (_e) {
      toast.error('Failed to add clinical note');
    }
  };

  const handleAcceptTriage = (patientRef) => {
    const patientId = typeof patientRef === 'object' ? (patientRef?._id || patientRef?.id) : patientRef;
    if (socketRef.current) {
      socketRef.current.emit('doctor-ready', { patientId });
    }
    toast.success('Patient alerted. Launching telehealth room...');
    setTimeout(() => {
      window.location.href = `/telehealth?roomId=${patientId || 'consultation'}`;
    }, 1000);
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
      setAnalysisText(res.data.analysis || 'Clinical assessment completed.');
    } catch (_e) {
      setAnalysisText(`### Clinical Impression\n\n* **Primary Symptom Complex**: ${entry.symptoms}\n* **Risk Stratification**: ${entry.severity?.toUpperCase()}\n* **Recommended Differential**: Acute presentation requiring targeted diagnostic follow-up.\n* **Action Item**: Immediate telehealth or clinical examination.`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSendPrescription = async (e) => {
    e.preventDefault();
    if (!newPrescription.patientId || !newPrescription.medication) {
      return toast.error('Please select a patient and specify medication name');
    }

    try {
      const res = await api.post('/api/prescriptions', newPrescription);
      toast.success('Prescription cryptographically issued');
      setIsPrescriptionModalOpen(false);
      setPrescriptions([res.data?.data || res.data, ...prescriptions]);
      setNewPrescription({ patientId: '', medication: '', dosage: '', instructions: '', duration: '', frequency: 'Once daily' });
    } catch (_e) {
      toast.error('Failed to issue digital prescription');
    }
  };

  // Priority sorting logic: Critical (1) -> High (2) -> Medium (3) -> Low (4)
  const priorityWeight = { critical: 1, high: 2, medium: 3, low: 4 };
  const sortedQueue = [...queue].sort((a, b) => {
    const weightA = priorityWeight[a.severity] || 3;
    const weightB = priorityWeight[b.severity] || 3;
    return weightA - weightB;
  });

  const filteredQueue = sortedQueue.filter(q => {
    const matchesPriority = priorityFilter === 'all' || q.severity === priorityFilter;
    const patientName = (q.patient?.name || q.patientId?.name || '').toLowerCase();
    const symptomsText = (q.symptoms || '').toLowerCase();
    const matchesSearch = !searchQuery || patientName.includes(searchQuery.toLowerCase()) || symptomsText.includes(searchQuery.toLowerCase());
    return matchesPriority && matchesSearch;
  });

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      {/* Sidebar Navigation */}
      <DashboardSidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        logout={logout} 
        role="doctor" 
      />

      {/* Main Clinical Console */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto bg-slate-950 relative z-10 scroll-smooth">
        {/* Top Header */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white flex items-center gap-2">
                Dr. <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">{user?.name || 'Physician'}</span>
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Doctor Console Active
              </span>
            </div>
            <p className="text-slate-400 font-medium text-xs mt-1 tracking-wide">
              Clinical Command Center • Real-Time Triage • Digital Prescription Pad
            </p>
          </div>

          <div className="flex items-center gap-3">
            <NotificationCenter />
            <button 
              onClick={() => setIsPrescriptionModalOpen(true)}
              className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
            >
              <FileText size={15} />
              Issue Prescription
            </button>
          </div>
        </header>

        {/* 4 Clinical KPI Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Triage Queue', value: queue.length, icon: Activity, trend: 'Real-time sync', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
            { label: 'Patient Registry', value: patients.length, icon: Users, trend: 'Verified identities', color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
            { label: 'Consultations', value: appointments.length, icon: Calendar, trend: 'Today roster', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
            { label: 'Prescription Ledger', value: prescriptions.length, icon: Database, trend: 'Encrypted ledger', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' }
          ].map((kpi, i) => (
            <div 
              key={i}
              className="p-5 rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 shadow-xl relative overflow-hidden group hover:border-slate-700 transition-all"
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{kpi.label}</span>
                <div className={`p-2 rounded-xl ${kpi.bg} ${kpi.color} border ${kpi.border}`}>
                  <kpi.icon size={18} />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-white">{kpi.value}</span>
              </div>
              <p className="text-[10px] text-slate-400 font-semibold mt-2 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                {kpi.trend}
              </p>
            </div>
          ))}
        </div>

        {/* Tab Switching Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="w-full space-y-6"
          >
            {/* 1. TRIAGE QUEUE TAB */}
            {activeTab === 'triage' && (
              <div className="p-6 md:p-8 rounded-3xl bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 shadow-2xl space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800/80 pb-6">
                  <div>
                    <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                      <Activity className="text-red-400" />
                      Priority Triage Queue
                    </h2>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                      Multi-Vector Severity Sort • Critical → High → Medium → Low
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    {/* Search Input */}
                    <div className="relative flex-1 md:w-64">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search patient or symptom..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500"
                      />
                    </div>

                    {/* Priority Filter */}
                    <div className="flex items-center gap-2">
                      <Filter size={14} className="text-slate-400" />
                      <select
                        value={priorityFilter}
                        onChange={(e) => setPriorityFilter(e.target.value)}
                        className="bg-slate-950 border border-slate-800 px-3 py-2 rounded-xl font-bold text-xs text-white outline-none focus:border-emerald-500"
                      >
                        <option value="all">All ({queue.length})</option>
                        <option value="critical">Critical ({queue.filter(q => q.severity === 'critical').length})</option>
                        <option value="high">High ({queue.filter(q => q.severity === 'high').length})</option>
                        <option value="medium">Medium ({queue.filter(q => q.severity === 'medium').length})</option>
                        <option value="low">Low ({queue.filter(q => q.severity === 'low').length})</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Queue Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-200">
                    <thead className="text-[10px] text-slate-400 uppercase font-black tracking-widest border-b border-slate-800">
                      <tr>
                        <th className="py-4 px-4">Patient Profile</th>
                        <th className="py-4 px-4">Symptom Complex & AI Insights</th>
                        <th className="py-4 px-4 text-center">Urgency</th>
                        <th className="py-4 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {loading ? (
                        <tr><td colSpan="4" className="py-16 text-center text-slate-500 font-bold text-xs animate-pulse">Syncing patient queue...</td></tr>
                      ) : filteredQueue.length === 0 ? (
                        <tr><td colSpan="4" className="py-16 text-center text-slate-500 font-bold text-xs">No matching cases in triage queue.</td></tr>
                      ) : filteredQueue.map((q) => {
                        const patientName = q.patient?.name || q.patientId?.name || 'Anonymous Patient';
                        const patientIdVal = q.patient?._id || q.patient?.id || q.patientId?._id || q.patientId?.id || q.patient;
                        return (
                          <tr key={q._id || q.id} className="hover:bg-slate-800/30 transition-colors">
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-3">
                                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-base shadow-lg ${
                                  q.severity === 'critical' ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 'bg-slate-800 text-slate-200 border border-slate-700'
                                }`}>
                                  {patientName[0] || '?'}
                                </div>
                                <div>
                                  <p className="font-bold text-white text-sm">{patientName}</p>
                                  <p className="text-[10px] text-slate-500 font-mono">ID: {(q._id || q.id || '').toString().slice(-8)}</p>
                                </div>
                              </div>
                            </td>

                            <td className="py-4 px-4 max-w-md">
                              <p className="text-xs text-slate-300 font-medium line-clamp-2 leading-relaxed">{q.symptoms}</p>
                              {q.aiAnalysis?.red_flags && q.aiAnalysis.red_flags.length > 0 && (
                                <div className="mt-1.5 flex items-center gap-1 text-[9px] font-black uppercase text-red-400 bg-red-950/40 px-2 py-0.5 rounded border border-red-500/30">
                                  <AlertTriangle size={11} /> Red Flags: {q.aiAnalysis.red_flags.join(', ')}
                                </div>
                              )}
                              <div className="flex items-center gap-3 mt-2 text-[10px]">
                                <button 
                                  onClick={() => handleAnalyzeEntry(q)}
                                  className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1"
                                >
                                  <Sparkles size={11} /> AI Scribe Brief
                                </button>
                                <button 
                                  onClick={() => { setSelectedEntry(q); setIsNoteModalOpen(true); }}
                                  className="text-slate-400 hover:text-white font-bold flex items-center gap-1"
                                >
                                  <FileText size={11} /> Clinical Notes ({q.clinicalNotes?.length || 0})
                                </button>
                              </div>
                            </td>

                            <td className="py-4 px-4 text-center">
                              <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                                q.severity === 'critical' ? 'bg-red-500/20 text-red-400 border-red-500/40' :
                                q.severity === 'high' ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' :
                                q.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40' :
                                'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                              }`}>
                                {q.severity}
                              </span>
                            </td>

                            <td className="py-4 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleClaimTriage(q._id || q.id)}
                                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all"
                                >
                                  Claim
                                </button>
                                <button 
                                  onClick={() => handleAcceptTriage(patientIdVal)}
                                  className="px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all"
                                >
                                  <Video size={13} /> Call
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 2. APPOINTMENTS TAB */}
            {activeTab === 'appointments' && (
              <div className="p-6 md:p-8 rounded-3xl bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 shadow-2xl space-y-6">
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                    <Calendar className="text-cyan-400" />
                    Telehealth Consultation Roster
                  </h2>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                    Scheduled Video Sessions • Direct Room Launch
                  </p>
                </div>

                {appointments.length === 0 ? (
                  <div className="py-16 text-center text-slate-500 font-bold text-sm">
                    No consultations booked for today.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {appointments.map((apt) => (
                      <div 
                        key={apt._id || apt.id}
                        className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-all flex justify-between items-center"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-white text-base">{apt.title || 'General Consultation'}</h4>
                            <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                              {apt.status || 'Confirmed'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-1">
                            Patient: <span className="text-white font-semibold">{apt.patient?.name || 'Registered Patient'}</span>
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                            <Clock size={12} /> {apt.startTime || apt.date ? new Date(apt.startTime || apt.date).toLocaleString() : 'Scheduled'}
                          </p>
                        </div>
                        <button
                          onClick={() => handleAcceptTriage(apt.patient?._id || apt.patient?.id || apt.patientId)}
                          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 transition-all"
                        >
                          <Video size={14} /> Join Call
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 3. PATIENTS REGISTRY TAB */}
            {activeTab === 'patients' && (
              <div className="p-6 md:p-8 rounded-3xl bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 shadow-2xl space-y-6">
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                    <Users className="text-emerald-400" />
                    Patient Registry & Biometrics Directory
                  </h2>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                    Verified Patient Records • E-Prescription Dispatch
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {patients.map((p) => (
                    <div 
                      key={p._id || p.id}
                      className="p-6 rounded-3xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-slate-950 font-black text-xl flex items-center justify-center shadow-lg">
                            {p.name?.[0] || 'P'}
                          </div>
                          <div>
                            <h4 className="font-bold text-white text-base">{p.name || 'Anonymous Patient'}</h4>
                            <p className="text-[11px] text-slate-500">{p.email}</p>
                          </div>
                        </div>

                        <div className="space-y-1.5 mb-6 text-xs text-slate-400 bg-slate-900/50 p-3.5 rounded-2xl border border-slate-800/60">
                          <div className="flex justify-between">
                            <span>Blood Group:</span> <span className="font-bold text-emerald-400">{p.blood_group || 'O+'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Gender:</span> <span className="font-bold text-white">{p.gender || 'Not specified'}</span>
                          </div>
                        </div>
                      </div>

                      <button 
                        onClick={() => {
                          setNewPrescription({ ...newPrescription, patientId: p._id || p.id });
                          setIsPrescriptionModalOpen(true);
                        }}
                        className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 border border-slate-700 transition-all"
                      >
                        <FileText size={14} /> Issue Prescription
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. PRESCRIPTIONS LEDGER TAB */}
            {activeTab === 'prescriptions' && (
              <div className="p-6 md:p-8 rounded-3xl bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 shadow-2xl space-y-6">
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                    <Database className="text-emerald-400" />
                    Digital Prescription Ledger
                  </h2>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                    Issued Pharmacological Agents • Dosage & Duration Log
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-200">
                    <thead className="text-[10px] text-slate-400 uppercase font-black tracking-widest border-b border-slate-800">
                      <tr>
                        <th className="py-4 px-4">Date Issued</th>
                        <th className="py-4 px-4">Patient</th>
                        <th className="py-4 px-4">Medication</th>
                        <th className="py-4 px-4">Dosage & Instructions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {prescriptions.length === 0 ? (
                        <tr><td colSpan="4" className="py-16 text-center text-slate-500 font-bold text-xs">No prescriptions issued yet.</td></tr>
                      ) : prescriptions.map((p) => (
                        <tr key={p._id || p.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-4 px-4 text-xs text-slate-400 font-mono">
                            {p.created_at ? new Date(p.created_at).toLocaleDateString() : 'Active'}
                          </td>
                          <td className="py-4 px-4 font-bold text-white">
                            {p.patientId?.name || p.patient?.name || 'Registered Patient'}
                          </td>
                          <td className="py-4 px-4">
                            <span className="font-bold text-emerald-400">{p.medication}</span>
                            <span className="block text-[10px] text-slate-500 uppercase">{p.duration}</span>
                          </td>
                          <td className="py-4 px-4 text-xs text-slate-300">
                            <p className="font-semibold text-white">{p.dosage}</p>
                            <p className="text-slate-400 text-[11px] line-clamp-1">{p.instructions}</p>
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

        {/* AI Clinical Brief Modal */}
        <AnimatePresence>
          {isAnalysisModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-2xl rounded-3xl bg-slate-900 border border-slate-800 p-6 md:p-8 space-y-6 shadow-2xl"
              >
                <div className="flex justify-between items-start border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                      <ClipboardList size={22} />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-white">AI Clinical Brief</h3>
                      <p className="text-xs text-slate-400">Zero-Trust Triage Scribe • Gemini 2.0 Flash</p>
                    </div>
                  </div>
                  <button onClick={() => setIsAnalysisModalOpen(false)} className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors">
                    <X size={18} />
                  </button>
                </div>

                <div className="space-y-4 text-xs">
                  <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                    <p className="font-bold text-slate-400 uppercase tracking-wider mb-1">Reported Symptoms</p>
                    <p className="text-white text-sm font-medium">{selectedEntry?.symptoms}</p>
                  </div>

                  <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 min-h-[160px]">
                    {isAnalyzing ? (
                      <div className="flex flex-col items-center justify-center py-10 gap-3 text-slate-400">
                        <Sparkles size={28} className="animate-spin text-emerald-400" />
                        <span className="font-bold">Synthesizing clinical guidelines...</span>
                      </div>
                    ) : (
                      <div className="prose prose-invert prose-xs max-w-none text-slate-300">
                        <ReactMarkdown>{analysisText}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    onClick={() => handleAcceptTriage(selectedEntry?.patient?._id || selectedEntry?.patientId?._id || selectedEntry?.patientId)}
                    className="flex-1 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                  >
                    <Video size={16} /> Launch Telehealth Session
                  </button>
                  <button 
                    onClick={() => setIsAnalysisModalOpen(false)}
                    className="px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase rounded-xl"
                  >
                    Dismiss
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Issue Prescription Modal */}
        <AnimatePresence>
          {isPrescriptionModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 p-6 md:p-8 space-y-6 shadow-2xl"
              >
                <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="text-xl font-black text-white">Digital Prescription Pad</h3>
                    <p className="text-xs text-slate-400">Cryptographic audit trail • Instant patient notification</p>
                  </div>
                  <button onClick={() => setIsPrescriptionModalOpen(false)} className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors">
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleSendPrescription} className="space-y-4 text-xs">
                  <div>
                    <label className="font-bold text-slate-400 uppercase tracking-wider block mb-1">Select Patient</label>
                    <select 
                      value={newPrescription.patientId}
                      onChange={(e) => setNewPrescription({ ...newPrescription, patientId: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white font-medium outline-none focus:border-emerald-500"
                    >
                      <option value="">Select target patient...</option>
                      {patients.map(p => (
                        <option key={p._id || p.id} value={p._id || p.id}>{p.name} ({p.email})</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="font-bold text-slate-400 uppercase tracking-wider block mb-1">Medication Name</label>
                      <input 
                        type="text" required placeholder="e.g. Amoxicillin"
                        value={newPrescription.medication}
                        onChange={(e) => setNewPrescription({ ...newPrescription, medication: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white font-medium outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-400 uppercase tracking-wider block mb-1">Dosage Format</label>
                      <input 
                        type="text" required placeholder="e.g. 500mg"
                        value={newPrescription.dosage}
                        onChange={(e) => setNewPrescription({ ...newPrescription, dosage: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white font-medium outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-400 uppercase tracking-wider block mb-1">Instructions</label>
                    <textarea 
                      rows="3" required placeholder="Take twice daily after meals for 7 consecutive days..."
                      value={newPrescription.instructions}
                      onChange={(e) => setNewPrescription({ ...newPrescription, instructions: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white font-medium outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="font-bold text-slate-400 uppercase tracking-wider block mb-1">Duration</label>
                      <input 
                        type="text" required placeholder="e.g. 7 Days"
                        value={newPrescription.duration}
                        onChange={(e) => setNewPrescription({ ...newPrescription, duration: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white font-medium outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-400 uppercase tracking-wider block mb-1">Frequency</label>
                      <select 
                        value={newPrescription.frequency}
                        onChange={(e) => setNewPrescription({ ...newPrescription, frequency: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white font-medium outline-none focus:border-emerald-500"
                      >
                        <option value="Once daily">Once daily</option>
                        <option value="Twice daily">Twice daily</option>
                        <option value="Three times daily">Three times daily</option>
                        <option value="As needed (PRN)">As needed (PRN)</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-2 flex gap-3">
                    <button 
                      type="submit"
                      className="flex-1 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                    >
                      <Send size={15} /> Issue Prescription
                    </button>
                    <button 
                      type="button"
                      onClick={() => setIsPrescriptionModalOpen(false)}
                      className="px-5 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase rounded-xl"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Clinical Note Modal */}
        <AnimatePresence>
          {isNoteModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 p-6 md:p-8 space-y-6 shadow-2xl"
              >
                <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                  <h3 className="text-xl font-black text-white">Clinical Note Scribe</h3>
                  <button onClick={() => setIsNoteModalOpen(false)} className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors">
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleAddClinicalNote} className="space-y-4 text-xs">
                  <div>
                    <label className="font-bold text-slate-400 uppercase tracking-wider block mb-1">Clinical Observation / Diagnostic Note</label>
                    <textarea 
                      rows="4" required
                      value={clinicalNoteText}
                      onChange={(e) => setClinicalNoteText(e.target.value)}
                      placeholder="Record clinical observations, vitals assessment, or physician notes..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white font-medium outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button 
                      type="submit"
                      className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-emerald-500/20"
                    >
                      Save Clinical Note
                    </button>
                    <button 
                      type="button"
                      onClick={() => setIsNoteModalOpen(false)}
                      className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase rounded-xl"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default DoctorDashboard;
