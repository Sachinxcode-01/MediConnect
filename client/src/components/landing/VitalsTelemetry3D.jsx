import React, { useState } from 'react';
import { HeartPulse, Activity, AlertTriangle, ShieldCheck, Zap, Bell, CheckCircle2 } from 'lucide-react';
import ECGCanvas from '../3d/ECGCanvas';
import Tilt3DCard from '../3d/Tilt3DCard';

const VitalsTelemetry3D = () => {
  const [bpm, setBpm] = useState(74);
  const [spo2, setSpo2] = useState(99);
  const systolic = 118;
  const diastolic = 78;

  const isTachycardia = bpm > 100;
  const isBradycardia = bpm < 55;
  const isAbnormalSpo2 = spo2 < 94;

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-black uppercase tracking-widest">
          <HeartPulse size={14} className="animate-pulse" /> Core Feature 03 • Live Wearables & WebSocket Stream
        </div>
        <h3 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          Real-Time Wearables Dashboard & Telemetry
        </h3>
        <p className="text-slate-400 text-sm max-w-xl mx-auto font-medium">
          Listens continuously to the backend WebSocket <code className="text-emerald-400 font-mono text-xs">vitals-update</code> channel. Powered by Recharts with dynamic spike detection for heart rate and SpO2 anomalies.
        </p>
      </div>

      {/* Main Studio Container */}
      <div className="space-y-6">
        {/* ECG Waveform Canvas */}
        <ECGCanvas bpm={bpm} height={190} />

        {/* Telemetry Metrics Grid & Interactive Controller */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Heart Rate Card */}
          <Tilt3DCard className="p-5 bg-slate-900/90 border-slate-800 space-y-3">
            <div className="flex justify-between items-center text-xs font-bold text-slate-400">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <HeartPulse size={16} /> Heart Rate
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                isTachycardia || isBradycardia ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'
              }`}>
                {isTachycardia ? 'Tachycardia' : isBradycardia ? 'Bradycardia' : 'Normal Sinus'}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black font-mono text-white">{bpm}</span>
              <span className="text-xs font-bold text-slate-400">BPM</span>
            </div>
            <div className="space-y-1 pt-2">
              <label className="text-[10px] uppercase font-bold text-slate-400 flex justify-between">
                <span>Simulate Rhythm</span>
                <span className="text-emerald-400 font-mono">{bpm} BPM</span>
              </label>
              <input
                type="range"
                min="45"
                max="135"
                value={bpm}
                onChange={(e) => setBpm(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>
          </Tilt3DCard>

          {/* Blood Oxygen SpO2 */}
          <Tilt3DCard className="p-5 bg-slate-900/90 border-slate-800 space-y-3">
            <div className="flex justify-between items-center text-xs font-bold text-slate-400">
              <span className="flex items-center gap-1.5 text-teal-400">
                <Activity size={16} /> Oxygen Saturation
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                isAbnormalSpo2 ? 'bg-red-500/20 text-red-400' : 'bg-teal-500/20 text-teal-400'
              }`}>
                {isAbnormalSpo2 ? 'Hypoxemia Warning' : 'Optimal'}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black font-mono text-white">{spo2}%</span>
              <span className="text-xs font-bold text-slate-400">SpO₂</span>
            </div>
            <div className="space-y-1 pt-2">
              <label className="text-[10px] uppercase font-bold text-slate-400 flex justify-between">
                <span>Simulate SpO₂</span>
                <span className="text-teal-400 font-mono">{spo2}%</span>
              </label>
              <input
                type="range"
                min="90"
                max="100"
                value={spo2}
                onChange={(e) => setSpo2(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-400"
              />
            </div>
          </Tilt3DCard>

          {/* Blood Pressure */}
          <Tilt3DCard className="p-5 bg-slate-900/90 border-slate-800 space-y-3">
            <div className="flex justify-between items-center text-xs font-bold text-slate-400">
              <span className="flex items-center gap-1.5 text-indigo-400">
                <Zap size={16} /> Blood Pressure
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-500/20 text-indigo-400">
                Normotensive
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black font-mono text-white">
                {systolic}/{diastolic}
              </span>
              <span className="text-xs font-bold text-slate-400">mmHg</span>
            </div>
            <p className="text-[11px] text-slate-400 pt-2 font-medium">
              Mean Arterial Pressure: {Math.round((2 * diastolic + systolic) / 3)} mmHg
            </p>
          </Tilt3DCard>

          {/* Clinician Real-Time Alert Trigger Status */}
          <Tilt3DCard
            className={`p-5 space-y-3 transition-colors ${
              isTachycardia || isBradycardia || isAbnormalSpo2
                ? 'bg-red-950/40 border-red-500/60 shadow-lg shadow-red-500/20'
                : 'bg-slate-900/90 border-slate-800'
            }`}
          >
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="flex items-center gap-1.5 text-white">
                <Bell size={16} /> Automated Alert Pipeline
              </span>
            </div>
            {isTachycardia || isBradycardia || isAbnormalSpo2 ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-red-400 text-xs font-black">
                  <AlertTriangle size={18} />
                  <span>Telemetry Threshold Exceeded!</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-snug">
                  Automated alert sent to Dr. Maya Rao & Care Escalation Team.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-black">
                  <CheckCircle2 size={18} />
                  <span>All Vitals Within Range</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Real-time telemetry stream synchronized with patient EMR records.
                </p>
              </div>
            )}
          </Tilt3DCard>
        </div>
      </div>
    </div>
  );
};

export default VitalsTelemetry3D;
