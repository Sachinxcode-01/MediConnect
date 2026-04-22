import React, { useContext, useState, useEffect, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { Activity, Clock, FileText, HeartPulse, LogOut, Map, Video, Database, MapPin, Sparkles, Loader2, X, AlertTriangle, Mic, MicOff } from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import PharmacyFinder from '../components/PharmacyFinder';
import AINurseCall from '../components/AINurseCall';
import { io } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardSidebar from '../components/DashboardSidebar';

const PatientDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('overview');
  const [symptoms, setSymptoms] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const [triageRes, setTriageRes] = useState(null);
  const [vitals, setVitals] = useState([]);
  const [pharmacies, setPharmacies] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false);
  const [analyzingId, setAnalyzingId] = useState(null);
  const [analysisData, setAnalysisData] = useState(null);

  // Vision State
  const [visionImage, setVisionImage] = useState(null);
  const [visionPreview, setVisionPreview] = useState(null);
  const [isAnalyzingVision, setIsAnalyzingVision] = useState(false);
  const [visionResult, setVisionResult] = useState(null);

  // Predictive State
  const [predictiveData, setPredictiveData] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);

  useEffect(() => {
    if (activeTab === 'wearables' || activeTab === 'overview') {
      const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000');
      
      const fetchHistory = async () => {
        try {
          const res = await api.get(`/api/wearables/${user._id}/history`);
          setVitals(res.data.reverse());
        } catch (e) {
          console.error(e);
        }
      };
      fetchHistory();

      let simInterval;
      socket.on('connect', () => {
         if (activeTab === 'wearables') {
            simInterval = setInterval(() => {
                api.post('/api/wearables/simulate', { patientId: user._id }).catch(e=>console.error(e));
            }, 3000);
         }
      });

      socket.on('vitals-update', (data) => {
        if (data.patientId === user._id) {
          setVitals(prev => [...prev.slice(-20), data]);
        }
      });

      socket.on('doctor-ready', (payload) => {
         if (payload.patientId === user._id) {
            toast((t) => (
               <div className="flex flex-col gap-3 font-geist">
                 <p className="font-black text-themeDeep">Your doctor is ready for your consultation!</p>
                 <button 
                   onClick={() => { window.location.href='/telehealth'; toast.dismiss(t.id); }}
                   className="bg-themePrimary text-white px-4 py-2 rounded-xl font-bold shadow-neon"
                 >
                   Join Call Now
                 </button>
               </div>
            ), { duration: 10000 });
         }
      });

      return () => {
         if (simInterval) clearInterval(simInterval);
         socket.disconnect();
      };
    } else if (activeTab === 'pharmacy') {
      const fetchPharmacies = async () => {
         try {
             const res = await api.post('/api/pharmacy/nearby', { lat: 40.7128, lng: -74.0060 });
             setPharmacies(res.data);
         } catch (e) {
             console.error(e);
         }
      }
      fetchPharmacies();
    } else if (activeTab === 'prescriptions') {
      const fetchPrescriptions = async () => {
        try {
          const res = await api.get('/api/prescriptions');
          setPrescriptions(res.data);
        } catch (e) {
          toast.error('Failed to load prescriptions');
        }
      };
      fetchPrescriptions();
    } else if (activeTab === 'health-report') {
      const fetchReport = async () => {
        setLoadingReport(true);
        try {
          const res = await api.post('/api/diagnostics/predictive-risk');
          setPredictiveData(res.data);
        } catch (e) {
          toast.error('Failed to generate predictive report');
        } finally {
          setLoadingReport(false);
        }
      };
      fetchReport();
    }

    // Cleanup speech recognition on unmount
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [activeTab, user._id]);

  const handleSymptomCheck = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/api/triage/symptom-check', {
        symptoms: symptoms.split(','),
        age: 30,
        existingConditions: []
      });
      setTriageRes(res.data);
      toast.success('Analysis complete');
    } catch (e) {
      toast.error('Error analyzing symptoms');
    }
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      return toast.error("Your browser doesn't support speech recognition.");
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      toast.success("Microphone active. Start speaking...")
    };
    
    recognition.onresult = (event) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + ' ';
        }
      }
      if (finalTranscript) {
        setSymptoms(prev => (prev ? prev + ' ' : '') + finalTranscript.trim());
      }
    };

    recognition.onerror = (event) => {
      if (event.error !== 'no-speech') {
         console.error(event.error);
         toast.error("Microphone error.");
      }
      setIsListening(false);
    };

    recognition.onend = () => setIsListening(false);

    recognition.start();
    recognitionRef.current = recognition;
  };

  const handleAnalyzePrescription = async (id) => {
    setAnalyzingId(id);
    try {
      const res = await api.post(`/api/prescriptions/${id}/analyze`);
      setAnalysisData(res.data);
      setIsPrescriptionModalOpen(true);
      toast.success('AI Insights Generated');
    } catch (e) {
      toast.error('Failed to analyze medication. Check API Key.');
    } finally {
      setAnalyzingId(null);
    }
  };

  const handleVisionAnalyze = async (e) => {
    e.preventDefault();
    if (!visionImage) return toast.error('Please select an image first');

    const formData = new FormData();
    formData.append('image', visionImage);

    setIsAnalyzingVision(true);
    setVisionResult(null);
    try {
      const res = await api.post('/api/diagnostics/analyze-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setVisionResult(res.data);
      toast.success('MediVision™ Analysis Complete');
    } catch (e) {
      toast.error('Analysis failed. Try again.');
    } finally {
      setIsAnalyzingVision(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setVisionImage(file);
      setVisionPreview(URL.createObjectURL(file));
      setVisionResult(null);
    }
  };

  return (
    <div className="flex h-screen bg-themeLight font-geist overflow-hidden">
      <DashboardSidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        logout={logout} 
        role="patient" 
      />

      <main className="flex-1 p-8 overflow-y-auto bg-themeLight relative z-10 scroll-smooth">
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.5 }}
        >
          <header className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-black text-themeDeep">Welcome, {user.name}</h1>
              <p className="text-themeDark/70 font-medium mt-1 uppercase tracking-widest text-xs">Patient Dashboard • Real-time Active</p>
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
            className="w-full"
          >
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-glass border border-themeMedium/30 hover-3d transition cursor-default">
                  <h3 className="font-bold text-lg mb-2 flex items-center gap-2 text-themeDeep"><Clock className="text-themePrimary" /> Next Appointment</h3>
                  <p className="text-themeDark/70 font-medium">No upcoming appointments scheduled.</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-glass border border-themeMedium/30 hover-3d transition cursor-default">
                  <h3 className="font-bold text-lg mb-2 flex items-center gap-2 text-themeDeep"><FileText className="text-themePrimary" /> Recent Prescriptions</h3>
                  <p className="text-themeDark/70 font-medium">Head to the Prescriptions tab for details.</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-glass border border-themeMedium/30 hover-3d transition cursor-default">
                  <h3 className="font-bold text-lg mb-2 flex items-center gap-2 text-themeDeep"><HeartPulse className="text-themePrimary" /> Latest Vitals</h3>
                  <p className="text-themeDeep font-black text-2xl mt-2">{vitals.length > 0 ? vitals[vitals.length-1].heart_rate : '--'} <small className="text-sm font-bold text-themeDark/60">BPM</small></p>
                </div>
              </div>
            )}

            {activeTab === 'symptom' && (
              <div className="bg-white p-8 rounded-2xl shadow-3d border border-themeMedium/30 max-w-2xl">
                <h2 className="text-2xl font-black mb-6 text-themeDeep flex items-center gap-3">
                  <Activity className="text-themePrimary" /> AI Symptom Checker
                </h2>
                <form onSubmit={handleSymptomCheck} className="space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                       <label className="block text-sm font-bold text-themeDark uppercase tracking-wide">Describe your symptoms</label>
                       <button 
                         type="button"
                         onClick={toggleListening}
                         className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-black transition-all ${
                           isListening 
                           ? 'bg-red-50 text-red-500 border border-red-200 animate-pulse' 
                           : 'bg-themeSoft border border-themePrimary/20 text-themePrimary hover:bg-themeMedium'
                         }`}
                       >
                          {isListening ? <MicOff size={14} /> : <Mic size={14} />} 
                          {isListening ? 'STOP LISTENING' : 'VOICE DICTATION'}
                       </button>
                    </div>
                    <textarea 
                      className="w-full bg-themeLight border-2 border-themeMedium/50 rounded-xl p-4 text-themeDeep placeholder-themeDark/50 focus:outline-none focus:ring-4 focus:ring-themePrimary/20 focus:border-themePrimary transition-all font-medium" 
                      rows="3" 
                      value={symptoms} 
                      onChange={e => setSymptoms(e.target.value)} 
                      required 
                      placeholder="e.g., Sharp headache, mild fever since morning" 
                    />
                  </div>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {['Headache', 'Fever', 'Cough', 'Fatigue', 'Dizziness', 'Chills'].map(s => (
                      <button 
                        key={s} 
                        type="button" 
                        onClick={() => setSymptoms(prev => prev ? `${prev}, ${s}` : s)} 
                        className="px-4 py-1.5 bg-themeSoft text-themePrimary font-bold text-xs rounded-full hover:bg-themeMedium hover:-translate-y-1 transition-all border border-themePrimary/20"
                      >
                        + {s}
                      </button>
                    ))}
                  </div>
                  <button type="submit" className="px-8 py-4 bg-themePrimary text-white font-black rounded-xl shadow-neon hover:shadow-neon-hover transform hover:-translate-y-1 active:translate-y-0 transition-all duration-300 w-full md:w-auto">
                    Analyze Symptoms
                  </button>
                </form>
                
                <div className="space-y-6">
                  <AINurseCall />
                  
                  {triageRes && (
                    <div className="bg-themePrimary text-white rounded-2xl p-6 shadow-xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-bl-full translate-x-10 -translate-y-10"></div>
                      <div className="flex gap-2 mb-3 items-center">
                        <span className="font-bold text-white">Severity:</span> 
                        <span className={`px-4 py-1.5 text-xs rounded-full font-black tracking-widest uppercase shadow-sm ${
                          triageRes.severity === 'high' || triageRes.severity === 'critical' ? 'bg-red-500 text-white' : 'bg-yellow-500 text-white'
                        }`}>{triageRes.severity}</span>
                      </div>
                      <p className="text-white text-lg leading-relaxed"><strong>Recommended Action:</strong> {triageRes.recommendedAction}</p>
                      <div className="mt-4 p-4 border-l-4 border-white bg-white/10 rounded-r-lg">
                         <p className="text-xs font-black text-white uppercase mb-1">Possible Conditions</p>
                         <p className="font-bold text-white">{triageRes.possibleConditions?.join(', ')}</p>
                      </div>
                      <div className="mt-6 text-[10px] font-black uppercase text-white/70 bg-white/10 p-3 rounded-lg border border-white/20 italic">
                        Disclaimer: {triageRes.disclaimer}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'wearables' && (
              <div className="bg-white p-8 rounded-2xl shadow-3d border border-themeMedium/30">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h2 className="text-2xl font-black text-themeDeep flex items-center gap-3">
                      <HeartPulse className="text-themePrimary" /> Live Telemetry
                    </h2>
                    <p className="text-themeDark/60 font-bold text-xs uppercase mt-1">Real-time biometrics stream</p>
                  </div>
                  <button 
                    onClick={() => api.post('/api/wearables/simulate', { patientId: user._id })} 
                    className="text-sm font-black bg-themeSoft text-themePrimary border-2 border-themePrimary/30 px-6 py-2.5 rounded-xl hover:shadow-neon hover:-translate-y-1 active:translate-y-0 transition-all"
                  >
                    Sync Device
                  </button>
                </div>
                <div className="h-80 w-full bg-themeLight/30 rounded-3xl p-4 border border-themeMedium/20">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={vitals}>
                      <defs>
                        <linearGradient id="colorHR" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorO2" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22C55E" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#22C55E" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="timestamp" tick={false} axisLine={false} />
                      <YAxis domain={['auto', 'auto']} axisLine={false} tick={{fill: '#64748b', fontWeight: 'bold'}} />
                      <Tooltip 
                         cursor={{ stroke: '#22C55E', strokeWidth: 2 }} 
                         content={({ active, payload }) => {
                           if (active && payload && payload.length) {
                             return (
                               <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-premium border border-themePrimary/20">
                                 <p className="text-[10px] font-black text-themeDark/40 uppercase mb-2">Neural Observation</p>
                                 <div className="flex flex-col gap-2">
                                    <div className="flex items-center justify-between gap-6">
                                       <span className="flex items-center gap-2 text-xs font-black text-red-500"><HeartPulse size={12}/> Heart Rate</span>
                                       <span className="text-sm font-black text-themeDeep">{payload[0].value} <small className="text-[10px]">BPM</small></span>
                                    </div>
                                    <div className="flex items-center justify-between gap-6">
                                       <span className="flex items-center gap-2 text-xs font-black text-themePrimary"><Activity size={12}/> Oxygen</span>
                                       <span className="text-sm font-black text-themeDeep">{payload[1].value} <small className="text-[10px]">%</small></span>
                                    </div>
                                 </div>
                               </div>
                             );
                           }
                           return null;
                         }}
                      />
                      <Area type="monotone" dataKey="heart_rate" stroke="#ef4444" strokeWidth={4} fillOpacity={1} fill="url(#colorHR)" dot={{ r: 0 }} activeDot={{ r: 6, fill: '#ef4444' }} animationDuration={1000} />
                      <Area type="monotone" dataKey="spo2" stroke="#22C55E" strokeWidth={4} fillOpacity={1} fill="url(#colorO2)" dot={{ r: 0 }} activeDot={{ r: 6, fill: '#22C55E' }} animationDuration={1000} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                {vitals.length > 0 && vitals[vitals.length - 1].alert_triggered && (
                  <motion.div 
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className="mt-8 p-5 bg-red-50 text-red-700 rounded-2xl border-2 border-red-200 font-black shadow-lg flex items-center gap-4 animate-pulse"
                  >
                    <div className="w-4 h-4 rounded-full bg-red-500 shadow-neon"></div>
                    CRITICAL ALERT: Abnormal heart rate detected. Notify medical staff?
                  </motion.div>
                )}
              </div>
            )}

            {activeTab === 'pharmacy' && (
              <div className="bg-white p-8 rounded-2xl shadow-3d border border-themeMedium/30 h-full flex flex-col min-h-[600px]">
                 <div className="mb-6">
                    <h2 className="text-2xl font-black text-themeDeep flex items-center gap-3"><Map className="text-themePrimary" /> Smart Pharmacy Finder</h2>
                    <p className="text-themeDark/60 font-bold text-xs uppercase mt-1">Geospatial matching enabled</p>
                 </div>
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1">
                     <div className="lg:col-span-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                        {pharmacies.map((pharm, idx) => (
                           <motion.div 
                               key={idx}
                               whileHover={{ x: 5 }}
                               className="p-5 bg-themeLight rounded-2xl border border-themeMedium/30 hover:border-themePrimary hover:shadow-neon transition-all cursor-pointer group glass shadow-sm"
                           >
                               <h3 className="font-black text-themeDeep text-lg group-hover:text-themePrimary transition">{pharm.name}</h3>
                               <p className="text-themeDark/70 text-sm font-medium flex items-start gap-2 mt-2"><MapPin size={16} className="mt-0.5 text-themePrimary" /> {pharm.address}</p>
                               <div className="flex items-center justify-between mt-4">
                                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${pharm.open ? 'bg-themePrimary text-white shadow-neon' : 'bg-red-500 text-white'}`}>
                                      {pharm.open ? 'Open Now' : 'Closed'}
                                  </span>
                                  <button className="text-xs font-black text-themePrimary hover:underline">Directions →</button>
                               </div>
                           </motion.div>
                        ))}
                     </div>
                     <div className="lg:col-span-2 bg-themeLight rounded-3xl border border-themeMedium/20 relative overflow-hidden group shadow-inner">
                        <img src="https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=2074&auto=format&fit=crop" className="absolute inset-0 w-full h-full object-cover transition-transform duration-[2000ms] group-hover:scale-110" alt="Map View" />
                        <div className="absolute inset-0 bg-themeDeep/10 backdrop-blur-[2px]"></div>
                        <div className="text-center p-8 bg-white/90 backdrop-blur-md rounded-2xl shadow-3d border border-white/50 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 w-full max-w-xs shadow-glass animate-float">
                           <Map className="w-12 h-12 text-themePrimary mx-auto mb-4" />
                           <p className="text-themeDeep font-black text-xl italic underline decoration-themePrimary decoration-4 underline-offset-4">Map View</p>
                           <p className="text-[10px] text-themeDark font-black uppercase mt-4 tracking-widest opacity-60">Live Grid Logic Persistent</p>
                        </div>
                     </div>
                 </div>
              </div>
            )}

            {activeTab === 'prescriptions' && (
              <div className="bg-white p-8 rounded-2xl shadow-3d border border-themeMedium/30">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h2 className="text-2xl font-black text-themeDeep flex items-center gap-3">
                      <FileText className="text-themePrimary" /> My Prescriptions
                    </h2>
                    <p className="text-themeDark/60 font-bold text-xs uppercase mt-1">Blockchain verified digital ledger</p>
                  </div>
                </div>

                {prescriptions.length === 0 ? (
                  <div className="text-center py-20 bg-themeLight/30 rounded-3xl border-2 border-dashed border-themeMedium/50">
                    <FileText className="w-16 h-16 text-themeMedium mx-auto mb-4 opacity-50" />
                    <p className="text-themeDeep font-black text-xl">No active prescriptions</p>
                    <p className="text-themeDark/60 font-medium">Your digital prescriptions will appear here once issued by a doctor.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {prescriptions.map((p) => (
                      <motion.div 
                        key={p._id}
                        whileHover={{ scale: 1.01 }}
                        className="p-6 bg-white rounded-2xl border border-themeMedium/30 shadow-glass flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex justify-between items-start mb-4">
                            <h3 className="text-xl font-black text-themeDeep">{p.medication}</h3>
                            <span className="px-3 py-1 bg-themeSoft text-themePrimary text-[10px] font-black uppercase rounded-full border border-themePrimary/20">{p.type || 'MEDICATION'}</span>
                          </div>
                          <div className="space-y-2 mb-6">
                            <p className="text-sm font-bold text-themeDark/80 flex items-center gap-2 italic"><Clock size={14} className="text-themePrimary" /> {p.dosage} • {p.frequency}</p>
                            <p className="text-xs text-themeDark/60 font-medium">{p.instructions}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between border-t border-themeMedium/20 pt-4">
                          <div className="flex items-center gap-2">
                             <div className="w-8 h-8 rounded-full bg-themeLight flex items-center justify-center text-themePrimary">
                                <Activity size={16} />
                             </div>
                             <div>
                               <p className="text-[10px] font-black text-themeDark/50 uppercase">Issued By</p>
                               <p className="text-xs font-bold text-themeDeep">Dr. {p.doctorId?.name || 'MediConnect Staff'}</p>
                             </div>
                          </div>
                          <button 
                            onClick={() => handleAnalyzePrescription(p._id)}
                            disabled={analyzingId === p._id}
                            className="bg-themePrimary text-white px-4 py-2 rounded-xl text-xs font-black shadow-neon hover:shadow-neon-hover transition-all flex items-center gap-2 disabled:opacity-50"
                          >
                            {analyzingId === p._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles size={14} />}
                            Explain AI
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'health-report' && (
              <div className="max-w-4xl space-y-8 pb-10">
                {loadingReport ? (
                   <div className="py-40 flex flex-col items-center justify-center gap-6 bg-white rounded-[3rem] shadow-glass border border-themeMedium/30">
                      <Sparkles className="text-themePrimary animate-spin" size={60} />
                      <p className="text-xl font-black text-themeDeep animate-pulse">Running Neural Predictive Logic...</p>
                   </div>
                ) : predictiveData ? (
                  <>
                    <motion.div 
                      initial={{ rotateX: 10, y: 30 }}
                      animate={{ rotateX: 0, y: 0 }}
                      className="bg-gradient-to-br from-themePrimary to-themeDeep p-10 rounded-[3rem] text-white shadow-3d relative overflow-hidden"
                    >
                       <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                          <div>
                            <h2 className="text-4xl font-black mb-3 flex items-center gap-3 italic tracking-tighter"><Sparkles className="animate-pulse text-white" /> AI Health Insight</h2>
                            <p className="text-white/70 font-bold uppercase tracking-[0.2em] text-[10px]">Generated {new Date().toLocaleDateString()} • Neural Engine V4.2</p>
                          </div>
                          <div className="bg-white/10 p-6 rounded-[2rem] backdrop-blur-xl border border-white/20 text-center min-w-[150px] shadow-inner">
                            <p className="text-[10px] font-black opacity-70 uppercase tracking-widest mb-1">VITALITY INDEX</p>
                            <p className="text-6xl font-black">{predictiveData.vitalityIndex}<span className="text-2xl text-white/50">%</span></p>
                          </div>
                       </div>
                       <div className="absolute top-[-50%] right-[-10%] w-96 h-96 bg-white/10 rounded-full blur-[100px] animate-pulse"></div>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="bg-white p-8 rounded-[2.5rem] shadow-glass border border-themeMedium/30 hover-3d transition cursor-default">
                          <h3 className="font-black text-themeDeep mb-6 border-b border-themeMedium/10 pb-4 flex justify-between items-center capitalize">
                            Trends & Risks
                            <div className="w-2 h-2 rounded-full bg-themePrimary shadow-neon"></div>
                          </h3>
                          <ul className="space-y-6">
                             {predictiveData.observations.map((item, i) => (
                               <li key={i} className="flex items-start gap-5 hover:translate-x-2 transition-transform">
                                  <div className={`p-3 bg-themeSoft text-themePrimary rounded-2xl shadow-sm`}><Activity size={22} /></div>
                                  <div>
                                     <p className="font-black text-themeDeep text-lg tracking-tight">System Observation</p>
                                     <p className="text-sm text-themeDark/70 font-semibold leading-relaxed mt-1">{item}</p>
                                  </div>
                               </li>
                             ))}
                             {predictiveData.risks.map((item, i) => (
                               <li key={i} className="flex items-start gap-5 hover:translate-x-2 transition-transform">
                                  <div className={`p-3 bg-red-100 text-red-600 rounded-2xl shadow-sm`}><AlertTriangle size={22} /></div>
                                  <div>
                                     <p className="font-black text-red-600 text-lg tracking-tight">Predicted Risk</p>
                                     <p className="text-sm text-themeDark/70 font-semibold leading-relaxed mt-1">{item}</p>
                                  </div>
                               </li>
                             ))}
                          </ul>
                       </div>

                       <div className="bg-white p-8 rounded-[2.5rem] shadow-glass border border-themeMedium/30 hover-3d transition cursor-default">
                          <h3 className="font-black text-themeDeep mb-6 border-b border-themeMedium/10 pb-4 flex justify-between items-center capitalize leading-tight">
                             Recommended Bio-Hacks
                             <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                          </h3>
                          <div className="space-y-6">
                             {predictiveData.bioHacks.map((hack, i) => (
                               <div key={i} className="p-6 bg-themeSoft/40 rounded-[2rem] border-2 border-themePrimary/20 hover:bg-themeSoft/60 transition-colors">
                                  <p className="text-[10px] font-black text-themePrimary mb-2 uppercase tracking-widest">Active Suggestion</p>
                                  <p className="text-themeDeep font-black text-xl italic leading-tight">{hack}</p>
                               </div>
                             ))}
                          </div>
                       </div>
                    </div>
                  </>
                ) : (
                  <div className="p-20 text-center bg-white rounded-[3rem] shadow-glass border border-themeMedium/30 font-black text-themeDark/40 italic">
                    Insufficient data for predictive analytics. Sync your wearables.
                  </div>
                )}
              </div>
            )}
            {activeTab === 'vision' && (
              <div className="max-w-4xl space-y-8 pb-10">
                <div className="bg-white p-10 rounded-[3rem] shadow-3d border border-themeMedium/30 glass">
                   <div className="flex justify-between items-start mb-10">
                      <div>
                        <h2 className="text-3xl font-black text-themeDeep flex items-center gap-3 italic tracking-tight">
                          <Sparkles className="text-themePrimary animate-pulse" /> MediVision™ AI Diagnostic
                        </h2>
                        <p className="text-[10px] font-black text-themeDark/50 uppercase tracking-[0.3em] mt-2">Multimodal Clinical Insight Laboratory</p>
                      </div>
                      <div className="px-5 py-2 bg-themeSoft rounded-2xl border border-themePrimary/20 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-themePrimary animate-ping"></span>
                        <span className="text-[10px] font-black text-themePrimary uppercase tracking-widest">GEMINI 2.0 ACTIVE</span>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="space-y-6">
                        <p className="text-sm font-bold text-themeDark/70 leading-relaxed">
                          Transmit an image of your symptom (skin rash, eye irritation, etc.) or a photo of your recent lab reports for instant neural analysis.
                        </p>
                        
                        <div className="relative group">
                           <input 
                             type="file" 
                             accept="image/*" 
                             onChange={handleImageChange}
                             className="hidden" 
                             id="vision-upload"
                           />
                           <label 
                             htmlFor="vision-upload"
                             className="flex flex-col items-center justify-center p-12 border-4 border-dashed border-themeMedium/30 rounded-[3rem] bg-themeLight/30 hover:bg-themeSoft/30 hover:border-themePrimary/50 cursor-pointer transition-all relative overflow-hidden group/label"
                           >
                             {visionPreview ? (
                               <>
                                 <img src={visionPreview} className={`absolute inset-0 w-full h-full object-cover ${isAnalyzingVision ? 'grayscale animate-pulse' : 'grayscale group-hover:grayscale-0'} transition-all`} alt="Preview" />
                                 {isAnalyzingVision && (
                                   <motion.div 
                                     initial={{ top: '-100%' }}
                                     animate={{ top: '100%' }}
                                     transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                                     className="absolute left-0 w-full h-1 bg-themePrimary shadow-[0_0_20px_#22c55e] z-20"
                                   />
                                 )}
                                 {isAnalyzingVision && (
                                   <div className="absolute inset-0 bg-themePrimary/10 backdrop-blur-[1px] flex items-center justify-center z-10">
                                      <div className="flex flex-col items-center gap-2">
                                         <Activity className="text-white animate-bounce" size={32} />
                                         <span className="text-[10px] font-black text-white uppercase tracking-[0.4em]">Analyzing Biometrics...</span>
                                      </div>
                                   </div>
                                 )}
                               </>
                             ) : (
                               <Database className="w-16 h-16 text-themeMedium/50 group-hover/label:scale-110 transition-transform mb-4" />
                             )}
                             <p className="font-black text-themeDeep text-xl mb-1 relative z-10">{visionPreview ? 'Replace Image' : 'Mount Clinical Image'}</p>
                             <p className="text-[10px] font-bold text-themeDark/40 uppercase tracking-widest relative z-10">JPG, PNG OR HEIC • MAX 10MB</p>
                           </label>
                        </div>

                        {visionPreview && (
                          <button 
                            onClick={handleVisionAnalyze}
                            disabled={isAnalyzingVision}
                            className="w-full py-5 bg-themeDeep text-white rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-3d hover:shadow-neon hover:-translate-y-1 active:translate-y-0 transition-all flex items-center justify-center gap-3"
                          >
                            {isAnalyzingVision ? <Loader2 className="animate-spin" /> : <Sparkles />}
                            {isAnalyzingVision ? 'INITIATING SCAN...' : 'EXECUTE NEURAL ANALYSIS'}
                          </button>
                        )}
                      </div>

                      <div className="relative">
                        <AnimatePresence mode="wait">
                          {!visionResult ? (
                            <motion.div 
                              key="placeholder"
                              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                              className="h-full flex flex-col items-center justify-center p-8 bg-themeLight/20 border-2 border-dashed border-themeMedium/20 rounded-[3rem]"
                            >
                               <p className="text-center font-black text-themeDark/30 text-xs uppercase tracking-widest leading-loose">
                                 Awaiting transmission...<br />
                                 Results will appear here<br />
                                 after successful neural verification.
                               </p>
                            </motion.div>
                          ) : (
                            <motion.div 
                               key="result"
                               initial={{ opacity: 0, x: 20 }}
                               animate={{ opacity: 1, x: 0 }}
                               className="space-y-6 holographic p-8 rounded-[3rem] neuro-glow"
                            >
                               <div className="p-6 bg-themeDeep text-white rounded-3xl shadow-lg border-b-4 border-themePrimary relative z-10">
                                  <div className="flex items-center gap-2 mb-2">
                                     <Sparkles className="text-themePrimary" size={16} />
                                     <span className="text-[10px] font-black uppercase tracking-widest text-white/70">Analysis Result</span>
                                  </div>
                                  <h3 className="text-2xl font-black italic">{visionResult.title}</h3>
                               </div>

                               <div className="space-y-4">
                                  <div>
                                     <p className="text-[10px] font-black text-themePrimary mb-2 uppercase tracking-[0.2em] ml-2">Observations</p>
                                     <div className="p-6 bg-white border border-themeMedium/30 rounded-3xl shadow-sm text-sm font-bold text-themeDeep leading-relaxed">
                                        {visionResult.observations}
                                     </div>
                                  </div>

                                  <div className="grid grid-cols-2 gap-4">
                                     <div className="p-5 bg-themeSoft/30 rounded-3xl border border-themePrimary/10">
                                        <p className="text-[9px] font-black text-themeDark/50 uppercase mb-2">Potential Flow</p>
                                        <p className="text-sm font-black text-themeDeep break-words">{visionResult.suggestions}</p>
                                     </div>
                                     <div className={`p-5 rounded-3xl border-2 ${
                                       visionResult.urgency === 'High' ? 'bg-red-50 border-red-200 text-red-600' :
                                       visionResult.urgency === 'Medium' ? 'bg-orange-50 border-orange-200 text-orange-600' :
                                       'bg-green-50 border-green-200 text-green-600'
                                     }`}>
                                        <p className="text-[9px] font-black opacity-60 uppercase mb-2">Urgency</p>
                                        <p className="text-sm font-black uppercase tracking-widest">{visionResult.urgency}</p>
                                     </div>
                                  </div>

                                  <div className="p-5 bg-yellow-50/50 rounded-2xl border border-yellow-100 flex gap-3 text-red-500">
                                     <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                                     <p className="text-[9px] font-black leading-tight italic uppercase">{visionResult.disclaimer}</p>
                                  </div>
                               </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   {[
                     { label: 'Security', value: 'E2E Encryption', icon: Database },
                     { label: 'Latency', value: '450ms Burst', icon: Activity },
                     { label: 'Model', value: 'Gemini 2.0 Flash', icon: Sparkles }
                   ].map((stat, i) => (
                     <div key={i} className="bg-white px-6 py-4 rounded-3xl border border-themeMedium/30 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                           <div className="p-2 bg-themeSoft rounded-xl text-themePrimary"><stat.icon size={16} /></div>
                           <span className="text-xs font-black text-themeDark/60 uppercase">{stat.label}</span>
                        </div>
                        <span className="text-xs font-black text-themeDeep">{stat.value}</span>
                     </div>
                   ))}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* AI Prescription Insight Modal */}
        <AnimatePresence>
          {isPrescriptionModalOpen && analysisData && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
               <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-white rounded-[2.5rem] shadow-2xl border border-white/20 w-full max-w-lg overflow-hidden flex flex-col"
               >
                  <div className="p-8 bg-gradient-to-r from-themePrimary to-themeDeep text-white flex justify-between items-center">
                    <div>
                      <h3 className="text-2xl font-black italic flex items-center gap-2">
                        <Sparkles /> AI Medication Insight
                      </h3>
                      <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest mt-1">Neural Medical Analysis • Verified</p>
                    </div>
                    <button 
                      onClick={() => setIsPrescriptionModalOpen(false)}
                      className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors"
                    >
                      <X size={24} />
                    </button>
                  </div>
                  
                  <div className="p-10 space-y-8 overflow-y-auto max-h-[70vh] custom-scrollbar">
                    <section>
                      <h4 className="text-xs font-black text-themePrimary uppercase tracking-[0.2em] mb-3">The Overview</h4>
                      <p className="text-themeDeep font-black text-xl italic leading-tight">"{analysisData.overview}"</p>
                    </section>

                    <section className="bg-themeSoft/30 p-6 rounded-3xl border border-themePrimary/10">
                      <h4 className="text-xs font-black text-themePrimary uppercase tracking-[0.2em] mb-4">How to handle</h4>
                      <p className="text-themeDeep font-medium whitespace-pre-line leading-relaxed">{analysisData.howToTake}</p>
                    </section>

                    <section>
                       <h4 className="text-xs font-black text-themePrimary uppercase tracking-[0.2em] mb-4">Safety Points</h4>
                       <div className="space-y-3">
                          {analysisData.tips && analysisData.tips.split('\n').filter(t => t.trim()).map((tip, i) => (
                            <div key={i} className="flex gap-3 items-start p-4 bg-yellow-50/50 rounded-2xl border border-yellow-100">
                               <div className="w-2 h-2 rounded-full bg-yellow-400 mt-2 shrink-0"></div>
                               <p className="text-sm font-bold text-themeDeep leading-tight">{tip.startsWith('-') ? tip.substring(1).trim() : tip}</p>
                            </div>
                          ))}
                       </div>
                    </section>
                  </div>

                  <div className="p-8 bg-gray-50/80 border-t border-themeMedium/20 flex flex-col gap-4">
                    <p className="text-[10px] text-themeDark/50 font-black uppercase text-center italic">Disclaimer: AI generated insights are for informational purposes only. Always follow your doctor's official instructions.</p>
                    <button 
                      onClick={() => setIsPrescriptionModalOpen(false)}
                      className="w-full py-4 bg-themePrimary text-white rounded-2xl font-black text-lg shadow-neon hover:shadow-neon-hover transition-all transform hover:-translate-y-1"
                    >
                      Understood, Clear
                    </button>
                  </div>
               </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default PatientDashboard;
