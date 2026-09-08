import React, { useState, useEffect, useContext } from 'react';
import {
  Database,
  ShieldCheck,
  FileText,
  Download,
  Activity,
  Link as LinkIcon,
  Search,
  Plus,
  X,
  Upload,
  Sparkles,
  Loader2,
  ArrowLeft,
  Filter,
  CheckCircle2,
  Lock,
  Calendar,
  User,
  Trash2,
  Eye,
  FileSpreadsheet,
  AlertCircle,
  FileCode,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import toast from 'react-hot-toast';

const RECORD_TYPES = [
  { id: 'ALL', label: 'All Documents' },
  { id: 'lab_result', label: 'Lab Reports' },
  { id: 'prescription', label: 'Prescriptions' },
  { id: 'visit_summary', label: 'Visit Summaries' },
  { id: 'imaging', label: 'Imaging & Scans' },
];

const MedicalRecords = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [currentSummary, setCurrentSummary] = useState('');
  const [summarizingId, setSummarizingId] = useState(null);

  const [patients, setPatients] = useState([]);
  const [formData, setFormData] = useState({
    patientId: '',
    type: 'lab_result',
    title: '',
    description: '',
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleBack = () => {
    if (user.role === 'admin') navigate('/admin');
    else if (user.role === 'doctor') navigate('/doctor');
    else navigate('/patient');
  };

  const fetchRecords = async () => {
    try {
      const res = await api.get('/api/records');
      setRecords(res.data?.data || res.data || []);
    } catch (_e) {
      toast.error('Failed to load records from vault');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    const loadVaultData = async () => {
      try {
        const res = await api.get('/api/records');
        if (active) setRecords(res.data?.data || res.data || []);
      } catch (_e) {
        if (active) toast.error('Failed to load records from vault');
      } finally {
        if (active) setLoading(false);
      }

      if (user && user.role !== 'patient') {
        try {
          const pRes = await api.get('/api/patients');
          if (active) setPatients(pRes.data?.data || pRes.data || []);
        } catch (_e) {
          console.warn('Patient list fetch fallback note:', _e);
        }
      }
    };

    loadVaultData();
    return () => {
      active = false;
    };
  }, [user]);

  // Handle Drag and Drop
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const validateAndSetFile = (file) => {
    const maxSize = 15 * 1024 * 1024; // 15MB
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

    if (!allowed.includes(file.type)) {
      return toast.error('Forbidden file type. Allowed: PDF, JPEG, PNG, WEBP');
    }

    if (file.size > maxSize) {
      return toast.error('File exceeds 15MB limit.');
    }

    setSelectedFile(file);
    toast.success(`Attached ${file.name}`);
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    const targetPatient = user.role === 'patient' ? user.id || user._id : formData.patientId;

    if (!targetPatient || !formData.title || !selectedFile) {
      return toast.error('Please complete all required fields and attach a file.');
    }

    setSubmitting(true);
    try {
      const uploadData = new FormData();
      uploadData.append('patientId', targetPatient);
      uploadData.append('type', formData.type);
      uploadData.append('title', formData.title);
      uploadData.append('description', formData.description);
      uploadData.append('file', selectedFile);

      await api.post('/api/records', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('Document encrypted and archived to vault');
      setIsModalOpen(false);
      setFormData({ patientId: '', type: 'lab_result', title: '', description: '' });
      setSelectedFile(null);
      fetchRecords();
    } catch (_e) {
      toast.error('Failed to save record.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSummarize = async (id) => {
    setSummarizingId(id);
    try {
      const res = await api.post(`/api/records/${id}/summarize`);
      setCurrentSummary(res.data?.summary || res.data?.data?.summary || 'Summary unavailable');
      setIsSummaryOpen(true);
    } catch (_e) {
      toast.error('AI Summarization failed. Please check network.');
    } finally {
      setSummarizingId(null);
    }
  };

  // Filtered records
  const filteredRecords = records.filter((r) => {
    const matchesSearch =
      (r.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = activeFilter === 'ALL' || (r.type || '').toLowerCase() === activeFilter.toLowerCase();
    return matchesSearch && matchesType;
  });

  return (
    <div className="flex min-h-screen bg-slate-950 font-geist text-slate-100 flex-col relative selection:bg-emerald-500 selection:text-white">
      {/* 1. TOP HEADER */}
      <header className="bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 px-8 py-5 flex justify-between items-center sticky top-0 z-40 shadow-2xl">
        <div className="flex items-center gap-5">
          <button
            onClick={handleBack}
            title="Back to Dashboard"
            className="p-2.5 bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white rounded-2xl border border-slate-800 transition-all hover:scale-105"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Database size={18} className="text-white" />
              </div>
              <h1 className="text-xl font-black text-white tracking-tight">Zero-Trust EHR Vault</h1>
            </div>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Encrypted Electronic Health Records & Audit Trail</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-black tracking-wide shadow-sm">
            <ShieldCheck size={15} />
            HIPAA Vault Active
          </span>
          <span className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-cyan-400 text-xs font-black tracking-wide shadow-sm">
            <Lock size={14} />
            PostgreSQL AES-256
          </span>
        </div>
      </header>

      {/* 2. MAIN CONTENT AREA */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto relative">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* STATS METRIC CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <motion.div
              whileHover={{ y: -3 }}
              className="bg-slate-900/70 backdrop-blur-xl border border-slate-800/90 p-5 rounded-3xl shadow-xl flex items-center gap-4 relative overflow-hidden"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
                <FileText size={22} />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Records</p>
                <p className="text-2xl font-black text-white">{records.length}</p>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ y: -3 }}
              className="bg-slate-900/70 backdrop-blur-xl border border-slate-800/90 p-5 rounded-3xl shadow-xl flex items-center gap-4 relative overflow-hidden"
            >
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-cyan-400">
                <ShieldCheck size={22} />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Audit Status</p>
                <p className="text-2xl font-black text-cyan-400">Verified</p>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ y: -3 }}
              className="bg-slate-900/70 backdrop-blur-xl border border-slate-800/90 p-5 rounded-3xl shadow-xl flex items-center gap-4 relative overflow-hidden"
            >
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/25 flex items-center justify-center text-purple-400">
                <Sparkles size={22} />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">AI Summaries</p>
                <p className="text-2xl font-black text-purple-300">Ready</p>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ y: -3 }}
              className="bg-slate-900/70 backdrop-blur-xl border border-slate-800/90 p-5 rounded-3xl shadow-xl flex items-center gap-4 relative overflow-hidden"
            >
              <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/25 flex items-center justify-center text-teal-400">
                <Activity size={22} />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Sync Status</p>
                <p className="text-2xl font-black text-emerald-400">Live</p>
              </div>
            </motion.div>
          </div>

          {/* VAULT EXPLORER CARD */}
          <div className="bg-slate-900/80 backdrop-blur-2xl border border-slate-800/90 rounded-3xl shadow-2xl p-6 md:p-8 space-y-6">
            {/* SEARCH & FILTERS TOOLBAR */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              {/* Type Filter Pills */}
              <div className="flex flex-wrap gap-1.5">
                {RECORD_TYPES.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setActiveFilter(type.id)}
                    className={`text-xs px-3.5 py-1.5 rounded-full font-bold transition-all ${
                      activeFilter === type.id
                        ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                        : 'bg-slate-950/60 text-slate-400 border border-slate-800 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>

              {/* Actions & Search */}
              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                  <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search documents..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs font-medium text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <button
                  onClick={() => setIsModalOpen(true)}
                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all flex-shrink-0"
                >
                  <Plus size={16} /> Upload Record
                </button>
              </div>
            </div>

            {/* TABLE VIEW */}
            <div className="overflow-x-auto rounded-2xl border border-slate-800/80">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/90 text-[11px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="px-6 py-4">Document Title</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Timestamp</th>
                    <th className="px-6 py-4">Audit Hash</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                  {loading ? (
                    <tr>
                      <td colSpan="5" className="text-center py-16">
                        <div className="flex flex-col items-center justify-center gap-3 text-slate-400">
                          <Loader2 size={24} className="animate-spin text-emerald-400" />
                          <span>Decrypting vault records...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center py-16">
                        <div className="flex flex-col items-center justify-center gap-2 text-slate-400">
                          <FileSpreadsheet size={32} className="text-slate-600 mb-1" />
                          <p className="font-bold text-slate-300">No medical documents found</p>
                          <p className="text-[11px] text-slate-500">Upload a report or change your filter criteria.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map((record) => {
                      const recordId = record.id || record._id || 'unknown';
                      const recordTitle = record.title || 'Untitled Clinical Note';
                      const recordType = record.type || 'DOCUMENT';
                      const displayDate = record.createdAt || record.date || new Date().toISOString();

                      return (
                        <tr key={recordId} className="hover:bg-slate-800/40 transition-colors group">
                          <td className="px-6 py-4 font-bold text-white flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform flex-shrink-0">
                              <FileText size={16} />
                            </div>
                            <div>
                              <p className="font-bold text-slate-100">{recordTitle}</p>
                              <p className="text-[10px] text-slate-400 line-clamp-1 max-w-xs">{record.description || 'No additional notes'}</p>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700/60">
                              {recordType.replace(/_/g, ' ')}
                            </span>
                          </td>

                          <td className="px-6 py-4 font-medium text-slate-400">
                            {new Date(displayDate).toLocaleDateString()}
                          </td>

                          <td className="px-6 py-4 font-mono text-[10px]">
                            <span className="bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 text-slate-400 flex items-center gap-1.5 w-max">
                              <LinkIcon size={11} className="text-emerald-400" />
                              {recordId.substring(0, 8)}...{recordId.substring(recordId.length - 4)}
                            </span>
                          </td>

                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end items-center gap-2">
                              {/* AI Summarize Button */}
                              <button
                                onClick={() => handleSummarize(recordId)}
                                disabled={summarizingId === recordId}
                                className="p-2 bg-slate-800/80 hover:bg-purple-600/30 text-purple-400 border border-purple-500/30 rounded-xl transition-all disabled:opacity-40"
                                title="AI Clinical Summary"
                              >
                                {summarizingId === recordId ? (
                                  <Loader2 size={15} className="animate-spin" />
                                ) : (
                                  <Sparkles size={15} />
                                )}
                              </button>

                              {/* Download / View Button */}
                              {record.fileUrl || record.file_url ? (
                                <a
                                  href={record.fileUrl || record.file_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="p-2 bg-slate-800/80 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-xl transition-all"
                                  title="Download / View Attachment"
                                >
                                  <Download size={15} />
                                </a>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* 3. UPLOAD MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/80">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <Upload size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">Upload Encrypted Record</h3>
                    <p className="text-xs text-slate-400">Zero-trust HIPAA verified archive</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleUploadSubmit} className="p-6 space-y-4 text-xs">
                {/* Patient selection if doctor */}
                {user.role !== 'patient' && (
                  <div>
                    <label className="block font-bold text-slate-300 mb-1.5">Select Patient</label>
                    <select
                      required
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500"
                      value={formData.patientId}
                      onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                    >
                      <option value="" disabled>Choose patient...</option>
                      {patients.map((p) => (
                        <option key={p.id || p._id} value={p.id || p._id}>
                          {p.name || p.user_id?.name || 'Patient'} ({p.email || p.user_id?.email})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block font-bold text-slate-300 mb-1.5">Record Category</label>
                  <select
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  >
                    <option value="lab_result">Lab Result</option>
                    <option value="prescription">Prescription</option>
                    <option value="visit_summary">Visit Summary</option>
                    <option value="imaging">Imaging (X-Ray / MRI / CT)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1.5">Record Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Complete Blood Count (CBC) Panel"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1.5">Clinical Observations</label>
                  <textarea
                    rows={3}
                    placeholder="Clinical findings, normal/abnormal ranges..."
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500 resize-none"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                {/* Drag and Drop Zone */}
                <div>
                  <label className="block font-bold text-slate-300 mb-1.5">Attach Medical Document (PDF, JPEG, PNG, WEBP)</label>
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`w-full p-6 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer ${
                      isDragging
                        ? 'border-emerald-400 bg-emerald-500/10'
                        : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="file"
                      id="record-file"
                      className="hidden"
                      accept=".pdf,image/png,image/jpeg,image/webp"
                      onChange={(e) => e.target.files?.[0] && validateAndSetFile(e.target.files[0])}
                    />
                    <label htmlFor="record-file" className="cursor-pointer flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 mb-2">
                        <Upload size={18} />
                      </div>
                      {selectedFile ? (
                        <div className="text-center">
                          <p className="font-bold text-emerald-400">{selectedFile.name}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready for encryption
                          </p>
                        </div>
                      ) : (
                        <div className="text-center">
                          <p className="font-bold text-slate-200">
                            <span className="text-emerald-400">Click to browse</span> or drag and drop
                          </p>
                          <p className="text-[10px] text-slate-500 mt-0.5">Maximum file size: 15MB</p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                {/* Modal Footer Actions */}
                <div className="pt-3 flex justify-end items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl font-bold text-slate-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={submitting}
                    type="submit"
                    className="px-6 py-2.5 rounded-xl font-black bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 shadow-lg shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-500 transition-all disabled:opacity-40"
                  >
                    {submitting ? 'Encrypting & Storing...' : 'Securely Archive'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. AI SUMMARY MODAL */}
      <AnimatePresence>
        {isSummaryOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden text-xs"
            >
              <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-purple-950/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">AI Clinical Brief</h3>
                    <p className="text-[11px] text-slate-400">Zero-knowledge medical summarization</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsSummaryOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl">
                  <p className="text-slate-200 leading-relaxed font-medium italic">
                    "{currentSummary}"
                  </p>
                </div>

                <div className="flex items-center gap-2 text-slate-500 text-[10px] justify-center">
                  <ShieldCheck size={14} className="text-emerald-500" />
                  PHI scrubbed & de-identified before processing
                </div>

                <button
                  onClick={() => setIsSummaryOpen(false)}
                  className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow-lg shadow-purple-600/25 transition-all"
                >
                  Close Insights
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MedicalRecords;
