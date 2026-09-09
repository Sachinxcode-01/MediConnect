import React, { useState, useEffect } from 'react';
import { 
  MapPin, Truck, CheckCircle2, 
  Clock, Star, ShieldCheck, Building 
} from 'lucide-react';
import Tilt3DCard from '../3d/Tilt3DCard';

const SAMPLE_PHARMACIES = [
  {
    id: 'ph-1',
    name: 'MediCare Central Pharmacy',
    distance: '0.8 km',
    time: '8 mins delivery',
    rating: 4.9,
    address: '452 Lexington Ave, Medical District',
    phone: '+1 (555) 234-8901',
    status: 'Open 24/7',
    isOpen: true,
    medsInStock: ['Amoxicillin 500mg', 'Metoprolol 25mg', 'Aspirin 81mg', 'Albuterol Inhaler'],
  },
  {
    id: 'ph-2',
    name: 'HealthPoint Express Dispensary',
    distance: '1.4 km',
    time: '15 mins delivery',
    rating: 4.8,
    address: '89 Broadway Suite 102',
    phone: '+1 (555) 789-0123',
    status: 'Open until 10:00 PM',
    isOpen: true,
    medsInStock: ['Lisinopril 10mg', 'Atorvastatin 20mg', 'Metformin 500mg'],
  },
  {
    id: 'ph-3',
    name: 'Apollo Clinical Pharmacy',
    distance: '2.1 km',
    time: '22 mins delivery',
    rating: 4.95,
    address: '710 Park Blvd, Health Pavilion',
    phone: '+1 (555) 345-6789',
    status: 'Open 24/7',
    isOpen: true,
    medsInStock: ['Sertraline 50mg', 'Omeprazole 20mg', 'Hydrochlorothiazide'],
  },
];

const DELIVERY_STEPS = [
  { label: 'Rx Transmitted', desc: 'Sent from doctor video consult', done: true },
  { label: 'Pharmacist Verification', desc: 'Dosage & interaction check', done: true },
  { label: 'Courier En Route', desc: 'GPS tracked delivery vehicle', done: true, active: true },
  { label: 'Delivered', desc: 'Secure contact-free handover', done: false },
];

const PharmacyDelivery3D = () => {
  const [selectedPharmacy, setSelectedPharmacy] = useState(SAMPLE_PHARMACIES[0]);
  const [deliveryProgress, setDeliveryProgress] = useState(65); // percentage along route

  useEffect(() => {
    const timer = setInterval(() => {
      setDeliveryProgress((prev) => (prev >= 98 ? 35 : prev + 1));
    }, 1200);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-black uppercase tracking-widest">
          <MapPin size={14} /> Core Project Feature 05 • Geolocation & Rx Delivery
        </div>
        <h3 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          Pharmacy Geolocation & Prescription Delivery Tracker
        </h3>
        <p className="text-slate-400 text-sm max-w-xl mx-auto font-medium">
          Automatically bridges post-consultation digital prescriptions to nearby verified pharmacies with live door-to-door courier tracking.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Column: Nearby Partner Pharmacies */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex justify-between items-center px-1">
            <span className="text-xs font-black uppercase tracking-widest text-emerald-400 flex items-center gap-2">
              <Building size={16} /> Verified Nearby Pharmacies
            </span>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2.5 py-1 rounded-full border border-slate-800">
              GPS: User Coords Active
            </span>
          </div>

          <div className="space-y-3">
            {SAMPLE_PHARMACIES.map((pharm) => {
              const isSelected = selectedPharmacy.id === pharm.id;
              return (
                <Tilt3DCard
                  key={pharm.id}
                  className={`p-5 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900/95 border-emerald-500/80 shadow-emerald-500/10'
                      : 'bg-slate-950/80 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div
                    onClick={() => setSelectedPharmacy(pharm)}
                    className="space-y-3"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-black text-white text-base">{pharm.name}</h4>
                          <ShieldCheck size={14} className="text-emerald-400" />
                        </div>
                        <p className="text-xs text-slate-400 font-medium">{pharm.address}</p>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-black font-mono border border-emerald-500/30 shrink-0">
                        {pharm.distance} • {pharm.time}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-1">
                      <span className="text-amber-400 font-bold flex items-center gap-1">
                        <Star size={12} fill="currentColor" /> {pharm.rating}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} className="text-emerald-400" /> {pharm.status}
                      </span>
                      <span>•</span>
                      <span className="text-slate-300 font-mono text-[11px]">{pharm.phone}</span>
                    </div>

                    {/* Stock Preview */}
                    <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Rx In Stock:</span>
                      {pharm.medsInStock.map((med, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-md bg-slate-900 text-slate-300 text-[10px] font-mono border border-slate-800"
                        >
                          {med}
                        </span>
                      ))}
                    </div>
                  </div>
                </Tilt3DCard>
              );
            })}
          </div>
        </div>

        {/* Right Column: Live Courier Delivery Tracking Simulator */}
        <div className="lg:col-span-6 flex flex-col">
          <Tilt3DCard className="flex-1 p-6 sm:p-7 bg-slate-900/90 border-slate-800 flex flex-col justify-between space-y-6 shadow-2xl">
            <div className="space-y-5">
              <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                <span className="text-xs font-black uppercase tracking-widest text-emerald-400 flex items-center gap-2">
                  <Truck size={16} /> Live Prescription Courier Track
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-mono text-[11px] font-black border border-emerald-500/30">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  Driver Assigned
                </span>
              </div>

              {/* Simulated Map / Radar Screen */}
              <div className="relative h-44 rounded-2xl bg-[#030712] border border-slate-800 overflow-hidden flex items-center justify-center p-4">
                {/* Radar Grid Circles */}
                <div className="absolute w-64 h-64 rounded-full border border-emerald-500/10 pointer-events-none"></div>
                <div className="absolute w-40 h-40 rounded-full border border-emerald-500/15 pointer-events-none"></div>
                <div className="absolute w-20 h-20 rounded-full border border-emerald-500/20 pointer-events-none"></div>

                {/* Radar Scan Line */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent animate-pulse pointer-events-none"></div>

                {/* Courier Pin with Progress Animation */}
                <div className="relative z-10 w-full flex items-center justify-between px-6">
                  {/* Pharmacy Node */}
                  <div className="flex flex-col items-center gap-1.5">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shadow-lg">
                      <Building size={18} />
                    </div>
                    <span className="text-[10px] font-bold text-slate-300">Pharmacy</span>
                  </div>

                  {/* Route Progress Line */}
                  <div className="relative flex-1 mx-4 h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-700 rounded-full"
                      style={{ width: `${deliveryProgress}%` }}
                    />
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white shadow-lg shadow-emerald-400/80 -ml-2 transition-all duration-700"
                      style={{ left: `${deliveryProgress}%` }}
                    />
                  </div>

                  {/* Patient Doorstep Node */}
                  <div className="flex flex-col items-center gap-1.5">
                    <div className="w-10 h-10 rounded-2xl bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center shadow-lg">
                      <MapPin size={18} className="text-teal-400" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-300">Your Home</span>
                  </div>
                </div>

                <div className="absolute bottom-2 left-3 text-[10px] font-mono text-slate-400">
                  Haversine Route: {selectedPharmacy.distance} • Est. Arrival: {selectedPharmacy.time}
                </div>
              </div>

              {/* Delivery Step Progression */}
              <div className="space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Order Dispatch Pipeline
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {DELIVERY_STEPS.map((step, i) => (
                    <div
                      key={i}
                      className={`p-3 rounded-xl border flex items-center gap-3 text-xs ${
                        step.active
                          ? 'bg-emerald-950/40 border-emerald-500/60 text-white'
                          : step.done
                          ? 'bg-slate-950/70 border-slate-800 text-slate-300'
                          : 'bg-slate-950/40 border-slate-800/60 text-slate-400'
                      }`}
                    >
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                          step.active
                            ? 'bg-emerald-500 text-slate-950 animate-pulse'
                            : step.done
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        <CheckCircle2 size={14} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold truncate">{step.label}</p>
                        <span className="text-[10px] text-slate-400 truncate block">{step.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Disclaimer */}
            <div className="pt-4 border-t border-slate-800 flex justify-between items-center text-[10px] text-slate-400 uppercase font-mono">
              <span>Leaflet Routing Engine</span>
              <span>Direct Doctor-to-Pharmacy Rx Sync</span>
            </div>
          </Tilt3DCard>
        </div>
      </div>
    </div>
  );
};

export default PharmacyDelivery3D;
