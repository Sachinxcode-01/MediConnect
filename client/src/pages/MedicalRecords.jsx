import React, { useState, useEffect, useContext } from 'react';
import { Database, ShieldCheck, FileText, Download, Activity, Link as LinkIcon, Search, Plus, X, Upload, Sparkles, Loader2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import toast from 'react-hot-toast';

const MedicalRecords = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const handleBack = () => {
     if (user.role === 'admin') navigate('/admin');
     else if (user.role === 'doctor') navigate('/doctor');
     else navigate('/patient');
  };
  
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
  const [submitting, setSubmitting] = useState(false);

  const fetchRecords = async () => {
    try {
      const res = await api.get('/api/records');
      setRecords(res.data);
    } catch (e) {
      toast.error('Failed to load records');
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
       const res = await api.get('/api/patients');
       setPatients(res.data);
    } catch (e) {
       toast.error('Failed to load patient list');
    }
  };

  useEffect(() => {
    fetchRecords();
    if (user && user.role !== 'patient') {
       fetchPatients();
    }
  }, [user]);

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!formData.patientId || !formData.title || !formData.description || !selectedFile) {
        return toast.error("Please fill in all required fields and attach a file.");
    }

    setSubmitting(true);
    try {
        const uploadData = new FormData();
        uploadData.append('patientId', formData.patientId);
        uploadData.append('type', formData.type);
        uploadData.append('title', formData.title);
        uploadData.append('description', formData.description);
        uploadData.append('file', selectedFile);

        await api.post('/api/records', uploadData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        toast.success('Record encrypted and saved to ledger');
        setIsModalOpen(false);
        setFormData({ patientId: '', type: 'lab_result', title: '', description: '' });
        setSelectedFile(null);
        fetchRecords();
    } catch (e) {
        toast.error('Failed to save record.');
    } finally {
        setSubmitting(false);
    }
  };

  const handleSummarize = async (id) => {
    setSummarizingId(id);
    try {
      const res = await api.post(`/api/records/${id}/summarize`);
      setCurrentSummary(res.data.summary);
      setIsSummaryOpen(true);
    } catch (e) {
      toast.error('AI Summarization failed. Please check your network.');
    } finally {
      setSummarizingId(null);
    }
  };

  return (
    <div className="flex h-screen bg-themeLight font-geist flex-col relative">
      <header className="bg-white border-b border-themeMedium/30 p-6 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-6">
           <button onClick={handleBack} title="Back to Dashboard" className="p-2 hover:bg-themeSoft rounded-full transition-colors text-themeDeep group border border-transparent hover:border-themePrimary/30">
              <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
           </button>
           <h1 className="text-2xl font-black text-themeDeep flex items-center gap-2">
             <Database className="text-themePrimary" /> Immutable Medical Records
           </h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-bold text-themeDark bg-themeSoft px-4 py-1.5 rounded-full border border-themePrimary/30 shadow-sm flex items-center gap-2">
            <ShieldCheck size={16} className="text-themePrimary" /> Distributed Ledger Active
          </span>
        </div>
      </header>

      <main className="flex-1 p-8 overflow-y-auto relative">
        <div className="max-w-6xl mx-auto space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-glass border border-themeMedium/30 flex items-center gap-4">
               <div className="p-4 bg-themeSoft rounded-xl text-themePrimary border border-themePrimary/30 shadow-neon">
                  <Database size={24} />
               </div>
               <div>
                 <p className="text-sm font-black text-themeDark/70 tracking-wider">STORED RECORDS</p>
                 <p className="text-3xl font-black text-themeDeep">{records.length}</p>
               </div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-glass border border-themeMedium/30 flex items-center gap-4">
               <div className="p-4 bg-themeSoft rounded-xl text-themePrimary border border-themePrimary/30 shadow-neon">
                  <ShieldCheck size={24} />
               </div>
               <div>
                 <p className="text-sm font-black text-themeDark/70 tracking-wider">BLOCKCHAIN VERIFIED</p>
                 <p className="text-3xl font-black text-themeDeep">{records.length}</p>
               </div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-glass border border-themeMedium/30 flex items-center gap-4">
               <div className="p-4 bg-themeSoft rounded-xl text-themePrimary border border-themePrimary/30 shadow-neon">
                  <Activity size={24} />
               </div>
               <div>
                 <p className="text-sm font-black text-themeDark/70 tracking-wider">NETWORK STATUS</p>
                 <p className="text-3xl font-black text-themePrimary">Optimal</p>
               </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-glass border border-themeMedium/30 p-8">
             <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black text-themeDeep">Document Vault</h2>
                <div className="flex gap-4">
                  <div className="relative">
                     <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-themeDark/50 w-4 h-4" />
                     <input 
                        type="text" 
                        placeholder="Search records..." 
                        className="pl-10 pr-4 py-2 bg-themeLight border border-themeMedium/50 rounded-xl focus:outline-none focus:border-themePrimary font-medium text-sm w-64"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                     />
                  </div>
                  {user.role !== 'patient' && (
                     <button onClick={() => setIsModalOpen(true)} className="px-6 py-2 bg-themePrimary text-white font-bold rounded-xl shadow-neon hover:shadow-neon-hover transform hover:-translate-y-1 transition-all flex items-center gap-2">
                        <Plus size={18} /> Upload New
                     </button>
                  )}
                </div>
             </div>

             <div className="overflow-x-auto">
               <table className="w-full text-left text-sm text-themeDeep">
                 <thead className="bg-themeSoft/50 text-xs font-black tracking-wider text-themeDark uppercase border-b border-themeMedium/30">
                    <tr>
                      <th className="px-6 py-4 rounded-tl-xl whitespace-nowrap">Record ID</th>
                      <th className="px-6 py-4">Patient</th>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Title / Type</th>
                      <th className="px-6 py-4">Verification Hash</th>
                      <th className="px-6 py-4 rounded-tr-xl text-right">Actions</th>
                    </tr>
                 </thead>
                 <tbody>
                    {loading ? (
                        <tr><td colSpan="6" className="text-center py-8">Loading...</td></tr>
                    ) : records.length === 0 ? (
                        <tr><td colSpan="6" className="text-center py-8 font-medium text-gray-500">No records found matching criteria.</td></tr>
                    ) : records.filter(r => (r.title || '').toLowerCase().includes(searchTerm.toLowerCase())).map((record, i) => (
                      <tr key={record._id || i} className="border-b border-themeMedium/20 hover:bg-themeLight/50 transition">
                          <td className="px-6 py-4 font-bold flex items-center gap-3">
                            <FileText className="text-themePrimary w-5 h-5" /> {record._id.substring(record._id.length - 6).toUpperCase()}
                          </td>
                          <td className="px-6 py-4 font-medium">{record.patientId?.name || 'Self'}</td>
                          <td className="px-6 py-4 font-medium">{new Date(record.date).toLocaleDateString()}</td>
                          <td className="px-6 py-4">
                            <div className="font-bold">{record.title}</div>
                            <div className="text-xs text-themeDark/70 uppercase">{record.type.replace('_', ' ')}</div>
                          </td>
                          <td className="px-6 py-4">
                             <div className="flex items-center gap-2">
                               <div className="w-2 h-2 rounded-full border border-themePrimary shadow-sm bg-themeSoft flex items-center justify-center"><div className="w-1 h-1 bg-themePrimary rounded-full"></div></div>
                               <span className="font-mono text-xs bg-themeSoft px-2 py-1 rounded text-themeDark border border-themePrimary/20 flex items-center gap-1">
                                 <LinkIcon className="w-3 h-3" /> 0x{record._id}
                               </span>
                             </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                             <div className="flex justify-end gap-2">
                                <button 
                                  onClick={() => handleSummarize(record._id)}
                                  disabled={summarizingId === record._id}
                                  className="text-themePrimary hover:text-white transition-colors p-2 bg-themeSoft rounded-lg hover:bg-themePrimary inline-block disabled:opacity-50"
                                  title="AI Summary"
                                >
                                  {summarizingId === record._id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                                </button>
                                <a href={record.file_url} target="_blank" rel="noreferrer" className="text-themePrimary hover:text-themeDeep transition-colors p-2 bg-themeSoft rounded-lg hover:bg-themeMedium/30 inline-block">
                                  <Download className="w-5 h-5" />
                                </a>
                             </div>
                          </td>
                      </tr>
                    ))}
                 </tbody>
               </table>
             </div>
          </div>

        </div>
      </main>

      {/* Upload Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white rounded-3xl shadow-2xl border border-themeMedium/30 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
               <div className="p-6 border-b border-themeMedium/30 flex justify-between items-center bg-gray-50/50">
                  <h3 className="text-xl font-black text-themeDeep flex items-center gap-2">
                     <FileText className="text-themePrimary"/> Append Medical Record
                  </h3>
                  <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-700 bg-gray-100 p-2 rounded-full transition">
                     <X size={20} />
                  </button>
               </div>
               
               <form onSubmit={handleUploadSubmit} className="p-6 space-y-5">
                  <div>
                     <label className="block text-sm font-bold text-themeDark mb-2">Patient</label>
                     <select 
                        required
                        className="w-full px-4 py-3 bg-themeLight border border-themeMedium/50 rounded-xl focus:border-themePrimary focus:ring-2 focus:ring-themePrimary/20 outline-none text-themeDeep font-medium transition"
                        value={formData.patientId}
                        onChange={e => setFormData({...formData, patientId: e.target.value})}
                     >
                        <option value="" disabled>Select a patient...</option>
                        {patients.map(p => (
                            <option key={p._id} value={p._id}>{p.name} ({p.email})</option>
                        ))}
                     </select>
                  </div>

                  <div>
                     <label className="block text-sm font-bold text-themeDark mb-2">Record Type</label>
                     <select 
                        className="w-full px-4 py-3 bg-themeLight border border-themeMedium/50 rounded-xl focus:border-themePrimary focus:ring-2 focus:ring-themePrimary/20 outline-none text-themeDeep font-medium transition"
                        value={formData.type}
                        onChange={e => setFormData({...formData, type: e.target.value})}
                     >
                        <option value="lab_result">Lab Result</option>
                        <option value="prescription">Prescription</option>
                        <option value="visit_summary">Visit Summary</option>
                     </select>
                  </div>

                  <div>
                     <label className="block text-sm font-bold text-themeDark mb-2">Record Title</label>
                     <input 
                        type="text" 
                        required
                        placeholder="e.g. Complete Blood Count (CBC)"
                        className="w-full px-4 py-3 bg-themeLight border border-themeMedium/50 rounded-xl focus:border-themePrimary focus:ring-2 focus:ring-themePrimary/20 outline-none text-themeDeep font-medium transition"
                        value={formData.title}
                        onChange={e => setFormData({...formData, title: e.target.value})}
                     />
                  </div>
                  
                  <div>
                     <label className="block text-sm font-bold text-themeDark mb-2">Clinical Notes / Description</label>
                     <textarea 
                        required
                        rows="3"
                        placeholder="Add medical context or observation..."
                        className="w-full px-4 py-3 bg-themeLight border border-themeMedium/50 rounded-xl focus:border-themePrimary focus:ring-2 focus:ring-themePrimary/20 outline-none text-themeDeep font-medium transition resize-none"
                        value={formData.description}
                        onChange={e => setFormData({...formData, description: e.target.value})}
                     ></textarea>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-themeDark mb-2">Attach Document (PDF/Image)</label>
                    <div className="flex items-center justify-center w-full">
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-themeMedium/50 border-dashed rounded-xl cursor-pointer bg-themeLight hover:bg-themeSoft transition">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <Upload className="w-8 h-8 mb-3 text-themePrimary" />
                                <p className="mb-2 text-sm text-themeDark font-medium">
                                    {selectedFile ? <span className="text-themeDeep font-bold">{selectedFile.name}</span> : <span><span className="font-bold text-themePrimary">Click to upload</span> or drag and drop</span>}
                                </p>
                            </div>
                            <input type="file" className="hidden" accept=".pdf,image/*" onChange={(e) => setSelectedFile(e.target.files[0])} />
                        </label>
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end gap-3">
                     <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition">Cancel</button>
                     <button disabled={submitting} type="submit" className="px-6 py-2.5 rounded-xl font-bold bg-themePrimary text-white shadow-neon hover:-translate-y-1 hover:shadow-neon-hover transition-all disabled:opacity-50">
                        {submitting ? 'Encrypting...' : 'Secure & Upload'}
                     </button>
                  </div>
               </form>
           </div>
        </div>
      )}

      {/* AI Summary Modal */}
      {isSummaryOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white rounded-3xl shadow-2xl border border-themeMedium/30 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
               <div className="p-6 border-b border-themeMedium/30 flex justify-between items-center bg-themePrimary text-white">
                  <h3 className="text-xl font-black flex items-center gap-2">
                     <Sparkles /> Gemini AI Insights
                  </h3>
                  <button onClick={() => setIsSummaryOpen(false)} className="text-white/80 hover:text-white bg-white/10 p-2 rounded-full transition">
                     <X size={20} />
                  </button>
               </div>
               <div className="p-8">
                  <div className="bg-themeSoft/30 border-l-4 border-themePrimary p-4 rounded-r-xl mb-6">
                     <p className="text-themeDeep font-medium leading-relaxed italic">
                        "{currentSummary}"
                     </p>
                  </div>
                  <p className="text-xs text-themeDark/50 font-bold uppercase tracking-widest text-center">
                     Powered by Gemini 2.0 Flash • P2P Encrypted Analysis
                  </p>
                  <button 
                    onClick={() => setIsSummaryOpen(false)}
                    className="w-full mt-8 py-3 bg-themePrimary text-white rounded-xl font-bold shadow-neon hover:shadow-neon-hover transition-all"
                  >
                    Got it, thanks!
                  </button>
               </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default MedicalRecords;
