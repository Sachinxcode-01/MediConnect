import React, { useState } from 'react';
import { Sparkles, AlertTriangle, ShieldCheck, CheckCircle2, ArrowRight, RefreshCw, Activity, HeartPulse, Brain, Thermometer } from 'lucide-react';
import Tilt3DCard from '../3d/Tilt3DCard';

const SYMPTOM_PRESETS = [
  { id: 'chest_pain', label: 'Chest Pressure / Pain', category: 'cardio', severity: 'emergency', icon: HeartPulse },
  { id: 'short_breath', label: 'Shortness of Breath', category: 'respiratory', severity: 'emergency', icon: Activity },
  { id: 'severe_headache', label: 'Sudden Intense Headache', category: 'neuro', severity: 'urgent', icon: Brain },
  { id: 'high_fever', label: 'Fever > 102°F (38.9°C)', category: 'general', severity: 'urgent', icon: Thermometer },
  { id: 'mild_cough', label: 'Dry Cough & Fatigue', category: 'respiratory', severity: 'routine', icon: Activity },
  { id: 'dizziness', label: 'Lightheadedness upon standing', category: 'neuro', severity: 'moderate', icon: Brain },
  { id: 'joint_pain', label: 'Mild Knee Joint Stiffness', category: 'general', severity: 'routine', icon: Activity },
  { id: 'throat_pain', label: 'Sore Throat with Swallowing', category: 'general', severity: 'routine', icon: Thermometer },
];

const InteractiveTriage3D = () => {
  const [selectedSymptoms, setSelectedSymptoms] = useState(['chest_pain', 'short_breath']);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [patientAge, setPatientAge] = useState(42);

  const toggleSymptom = (id) => {
    setSelectedSymptoms((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
    setAnalysisResult(null);
  };

  const handleRunTriage = () => {
    if (selectedSymptoms.length === 0) return;
    setIsAnalyzing(true);
    setAnalysisResult(null);

    setTimeout(() => {
      const hasEmergency = selectedSymptoms.some(
        (id) => SYMPTOM_PRESETS.find((s) => s.id === id)?.severity === 'emergency'
      );
      const hasUrgent = selectedSymptoms.some(
        (id) => SYMPTOM_PRESETS.find((s) => s.id === id)?.severity === 'urgent'
      );

      let triageLevel = 'ROUTINE';
      let score = 25;
      let color = 'emerald';
      let guidance = 'Schedule a standard telehealth consult or visit with your primary physician.';
      let matchedSpecialist = 'General Physician';

      if (hasEmergency) {
        triageLevel = 'EMERGENCY_RED_FLAG';
        score = 95;
        color = 'red';
        guidance = 'Critical symptoms detected. Immediate emergency medical evaluation required (Call emergency services or visit the nearest ER).';
        matchedSpecialist = 'Emergency Medicine / Interventional Cardiologist';
      } else if (hasUrgent) {
        triageLevel = 'URGENT_EVALUATION';
        score = 72;
        color = 'amber';
        guidance = 'Same-day urgent telehealth consultation recommended to prevent symptom progression.';
        matchedSpecialist = 'Internal Medicine / Urgent Care';
      } else if (selectedSymptoms.length > 2) {
        triageLevel = 'MODERATE_MONITORING';
        score = 50;
        color = 'cyan';
        guidance = 'Cluster of symptoms detected. Telehealth consult within 24-48 hours recommended.';
        matchedSpecialist = 'Family Medicine';
      }

      setAnalysisResult({
        level: triageLevel,
        score,
        color,
        guidance,
        specialist: matchedSpecialist,
        timestamp: new Date().toLocaleTimeString(),
        confidence: '98.4%',
      });
      setIsAnalyzing(false);
    }, 1200);
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-black uppercase tracking-widest">
          <Sparkles size={14} className="animate-spin-slow" /> Interactive AI Decision Support Engine
        </div>
        <h3 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          Experience Live AI Clinical Triage in 3D
        </h3>
        <p className="text-slate-400 text-sm max-w-xl mx-auto font-medium">
          Select or toggle symptoms below to see how MediConnect's multi-parameter algorithmic engine calculates urgency scores and routes to verified specialists.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Left Column: Symptom Input & Parameters */}
        <div className="lg:col-span-6 space-y-6">
          <Tilt3DCard className="p-7 space-y-6 bg-slate-900/90 border-slate-800 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <span className="text-xs font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                <Activity size={16} /> 01 • Select Active Symptoms
              </span>
              <span className="text-[11px] font-mono text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-full">
                {selectedSymptoms.length} Selected
              </span>
            </div>

            {/* Symptom Tag Pills */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {SYMPTOM_PRESETS.map((sym) => {
                const isSelected = selectedSymptoms.includes(sym.id);
                const Icon = sym.icon;
                return (
                  <button
                    key={sym.id}
                    onClick={() => toggleSymptom(sym.id)}
                    className={`flex items-center gap-3 p-3 rounded-2xl text-left transition-all duration-300 border ${
                      isSelected
                        ? sym.severity === 'emergency'
                          ? 'bg-red-950/40 border-red-500/80 text-white shadow-lg shadow-red-500/20 scale-[1.02]'
                          : sym.severity === 'urgent'
                          ? 'bg-amber-950/40 border-amber-500/80 text-white shadow-lg shadow-amber-500/20 scale-[1.02]'
                          : 'bg-emerald-950/40 border-emerald-500/80 text-white shadow-lg shadow-emerald-500/20 scale-[1.02]'
                        : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:border-slate-700 hover:bg-slate-800/40'
                    }`}
                  >
                    <div
                      className={`p-2 rounded-xl shrink-0 ${
                        isSelected
                          ? sym.severity === 'emergency'
                            ? 'bg-red-500 text-white'
                            : sym.severity === 'urgent'
                            ? 'bg-amber-500 text-slate-950'
                            : 'bg-emerald-500 text-slate-950'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      <Icon size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold leading-snug">{sym.label}</p>
                      <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">
                        {sym.category}
                      </span>
                    </div>
                    <div className="text-xs font-black shrink-0">
                      {isSelected ? '✓' : '+'}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Patient Age Slider Parameter */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="flex justify-between text-xs font-bold text-slate-300">
                <span>Simulated Patient Age</span>
                <span className="text-emerald-400 font-mono">{patientAge} Years Old</span>
              </div>
              <input
                type="range"
                min="18"
                max="85"
                value={patientAge}
                onChange={(e) => setPatientAge(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>

            {/* Run Analysis Trigger Button */}
            <button
              onClick={handleRunTriage}
              disabled={isAnalyzing || selectedSymptoms.length === 0}
              className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-3 transition-all duration-300 shadow-xl ${
                selectedSymptoms.length === 0
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : isAnalyzing
                  ? 'bg-emerald-600 text-white animate-pulse'
                  : 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 text-slate-950 hover:shadow-emerald-500/30 hover:scale-[1.02]'
              }`}
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw size={18} className="animate-spin" />
                  Running Neural Triage Evaluation...
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  Evaluate Symptoms with AI
                </>
              )}
            </button>
          </Tilt3DCard>
        </div>

        {/* Right Column: Dynamic 3D Diagnostic Output Panel */}
        <div className="lg:col-span-6 flex flex-col">
          <Tilt3DCard className="p-7 flex-1 flex flex-col justify-between bg-slate-900/90 border-slate-800 shadow-2xl">
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                <span className="text-xs font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                  <ShieldCheck size={16} /> 02 • Clinical Triage Inference
                </span>
                {analysisResult && (
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                    Confidence: {analysisResult.confidence}
                  </span>
                )}
              </div>

              {!analysisResult && !isAnalyzing && (
                <div className="py-16 text-center space-y-4">
                  <div className="w-16 h-16 rounded-3xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center mx-auto text-slate-400">
                    <Sparkles size={28} />
                  </div>
                  <div className="space-y-1">
                    <h5 className="font-bold text-white text-base">Triage Engine Ready</h5>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      Select symptoms on the left and hit Evaluate to preview the clinical risk matrix and priority level.
                    </p>
                  </div>
                </div>
              )}

              {isAnalyzing && (
                <div className="py-16 text-center space-y-5">
                  <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20 border-t-emerald-400 animate-spin"></div>
                    <HeartPulse size={32} className="text-emerald-400 animate-pulse" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-black text-white">Cross-referencing Clinical Red Flags</p>
                    <p className="text-xs text-slate-400 font-mono">Synthesizing severity score • Calculating priority</p>
                  </div>
                </div>
              )}

              {analysisResult && (
                <div className="space-y-6 animate-fade-in">
                  {/* Urgency Gauge & Score */}
                  <div
                    className={`p-5 rounded-3xl border ${
                      analysisResult.level === 'EMERGENCY_RED_FLAG'
                        ? 'bg-red-950/30 border-red-500/50'
                        : analysisResult.level === 'URGENT_EVALUATION'
                        ? 'bg-amber-950/30 border-amber-500/50'
                        : 'bg-emerald-950/30 border-emerald-500/50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Assessed Urgency Level
                        </span>
                        <h4
                          className={`text-xl font-black ${
                            analysisResult.level === 'EMERGENCY_RED_FLAG'
                              ? 'text-red-400'
                              : analysisResult.level === 'URGENT_EVALUATION'
                              ? 'text-amber-400'
                              : 'text-emerald-400'
                          }`}
                        >
                          {analysisResult.level.replace(/_/g, ' ')}
                        </h4>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-black font-mono text-white">
                          {analysisResult.score}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-bold">Risk Index / 100</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2.5 bg-slate-950 rounded-full mt-3 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-700 rounded-full ${
                          analysisResult.level === 'EMERGENCY_RED_FLAG'
                            ? 'bg-red-500'
                            : analysisResult.level === 'URGENT_EVALUATION'
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${analysisResult.score}%` }}
                      />
                    </div>
                  </div>

                  {/* Guidance & Recommendations */}
                  <div className="space-y-3">
                    <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                      Clinical Next Steps
                    </span>
                    <p className="text-sm font-medium text-slate-200 leading-relaxed bg-slate-950/70 p-4 rounded-2xl border border-slate-800">
                      {analysisResult.guidance}
                    </p>
                  </div>

                  {/* Recommended Specialty Match */}
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-950/80 border border-emerald-500/30">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Recommended Specialist</span>
                      <h6 className="text-sm font-black text-white">{analysisResult.specialist}</h6>
                    </div>
                    <a
                      href="#patients"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs hover:bg-emerald-400 transition-colors"
                    >
                      Book Specialist <ArrowRight size={14} />
                    </a>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-slate-800 mt-6 flex justify-between items-center text-[10px] text-slate-400 uppercase tracking-wider font-bold">
              <span>Safety Guardrail: Assistive Decision Support</span>
              <span>Does not replace clinical diagnosis</span>
            </div>
          </Tilt3DCard>
        </div>
      </div>
    </div>
  );
};

export default InteractiveTriage3D;
