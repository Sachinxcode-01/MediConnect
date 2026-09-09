import React, { useState } from 'react';
import { 
  Stethoscope, Star, Calendar, Clock, ShieldCheck, CheckCircle2, 
  ArrowRight, X, UserCheck, Video, MapPin 
} from 'lucide-react';
import Tilt3DCard from '../3d/Tilt3DCard';

const DOCTORS = [
  {
    id: 'doc-1',
    name: 'Dr. Maya Rao, MD',
    specialty: 'Cardiology',
    experience: '12 Years',
    rating: 4.96,
    reviews: 320,
    fee: '$50',
    avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300',
    availableToday: true,
    slots: ['Today 2:30 PM', 'Today 4:00 PM', 'Tomorrow 10:00 AM'],
    hospital: 'Metropolitan Heart Institute',
    bio: 'Board-certified cardiologist specializing in arrhythmia detection, hypertension, and preventative cardiac telemetry.'
  },
  {
    id: 'doc-2',
    name: 'Dr. James Chen, MD',
    specialty: 'Internal Medicine',
    experience: '9 Years',
    rating: 4.91,
    reviews: 215,
    fee: '$40',
    avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300',
    availableToday: true,
    slots: ['Today 3:00 PM', 'Today 5:15 PM', 'Tomorrow 11:30 AM'],
    hospital: 'Apex General Health Care',
    bio: 'Expert general physician focused on complex chronic illness management, infectious disease, and acute symptom resolution.'
  },
  {
    id: 'doc-3',
    name: 'Dr. Sarah Jenkins, MD',
    specialty: 'Pediatrics',
    experience: '15 Years',
    rating: 4.99,
    reviews: 480,
    fee: '$60',
    avatar: 'https://images.unsplash.com/photo-1594824813576-8561081ec9db?auto=format&fit=crop&q=80&w=300',
    availableToday: false,
    slots: ['Tomorrow 9:00 AM', 'Tomorrow 1:00 PM', 'Friday 10:30 AM'],
    hospital: 'Children\'s Care Hospital',
    bio: 'Dedicated pediatrician providing comprehensive infant and adolescent health evaluations with gentle telehealth approach.'
  },
  {
    id: 'doc-4',
    name: 'Dr. Aris Thorne, MD',
    specialty: 'Neurology',
    experience: '14 Years',
    rating: 4.94,
    reviews: 288,
    fee: '$75',
    avatar: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=300',
    availableToday: true,
    slots: ['Today 4:30 PM', 'Tomorrow 2:00 PM', 'Friday 11:00 AM'],
    hospital: 'NeuroVance Clinic',
    bio: 'Specialist in migraine diagnosis, neuropathic discomfort, concussion recovery, and sleep disturbances.'
  }
];

const SPECIALTIES = ['All Specialties', 'Cardiology', 'Internal Medicine', 'Pediatrics', 'Neurology'];

const DoctorBooking3D = () => {
  const [selectedSpecialty, setSelectedSpecialty] = useState('All Specialties');
  const [activeBookingDoc, setActiveBookingDoc] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [bookingToken, setBookingToken] = useState('');

  const filteredDoctors = selectedSpecialty === 'All Specialties'
    ? DOCTORS
    : DOCTORS.filter((d) => d.specialty === selectedSpecialty);

  const handleOpenBooking = (doc) => {
    setActiveBookingDoc(doc);
    setSelectedSlot(doc.slots[0]);
    setBookingConfirmed(false);
    setBookingToken('');
  };

  const handleConfirmBooking = () => {
    setBookingToken(`MEDI-APPT-${Math.floor(Math.random() * 89999 + 10000)}`);
    setBookingConfirmed(true);
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-black uppercase tracking-widest">
          <Stethoscope size={14} /> Verified Clinical Network
        </div>
        <h3 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          Find Top Clinicians & Book in Seconds
        </h3>
        <p className="text-slate-400 text-sm max-w-xl mx-auto font-medium">
          Connect with credentialed medical specialists. Filter by medical domain, check real-time availability, and schedule instantly.
        </p>
      </div>

      {/* Specialty Filter Pills */}
      <div className="flex flex-wrap justify-center gap-2">
        {SPECIALTIES.map((spec) => (
          <button
            key={spec}
            onClick={() => setSelectedSpecialty(spec)}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all duration-300 ${
              selectedSpecialty === spec
                ? 'bg-emerald-500 text-slate-950 font-black shadow-lg shadow-emerald-500/20 scale-105'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
            }`}
          >
            {spec}
          </button>
        ))}
      </div>

      {/* Doctors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredDoctors.map((doc) => (
          <Tilt3DCard key={doc.id} className="p-6 bg-slate-900/90 border-slate-800 flex flex-col justify-between space-y-5">
            <div className="space-y-4">
              {/* Doctor Avatar & Online Status */}
              <div className="relative flex items-center gap-3">
                <div className="relative">
                  <img
                    src={doc.avatar}
                    alt={doc.name}
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-500/40"
                  />
                  {doc.availableToday && (
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-900" title="Available Today"></span>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <h4 className="font-black text-white text-base truncate">{doc.name}</h4>
                    <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
                  </div>
                  <p className="text-xs font-bold text-emerald-400">{doc.specialty}</p>
                  <p className="text-[11px] text-slate-400 truncate">{doc.hospital}</p>
                </div>
              </div>

              {/* Stats Strip */}
              <div className="grid grid-cols-3 gap-2 p-3 bg-slate-950/80 rounded-2xl border border-slate-800/80 text-center">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">Rating</span>
                  <span className="text-xs font-black text-amber-400 flex items-center justify-center gap-0.5">
                    <Star size={10} fill="currentColor" /> {doc.rating}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">Exp</span>
                  <span className="text-xs font-black text-white">{doc.experience}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">Fee</span>
                  <span className="text-xs font-black text-emerald-400 font-mono">{doc.fee}</span>
                </div>
              </div>

              <p className="text-xs text-slate-400 font-medium line-clamp-2 leading-relaxed">
                {doc.bio}
              </p>
            </div>

            {/* Next Available Slot & Book Trigger */}
            <div className="space-y-2 pt-3 border-t border-slate-800">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1 font-bold">
                  <Clock size={12} className="text-emerald-400" /> Next:
                </span>
                <span className="font-mono text-white font-bold">{doc.slots[0]}</span>
              </div>
              <button
                onClick={() => handleOpenBooking(doc)}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-500/20"
              >
                <span>Book Consultation</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </Tilt3DCard>
        ))}
      </div>

      {/* Interactive Booking Modal */}
      {activeBookingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            <button
              onClick={() => setActiveBookingDoc(null)}
              className="absolute top-6 right-6 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white"
            >
              <X size={18} />
            </button>

            {!bookingConfirmed ? (
              <div className="space-y-5">
                <div className="flex items-center gap-4 border-b border-slate-800 pb-4">
                  <img
                    src={activeBookingDoc.avatar}
                    alt={activeBookingDoc.name}
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-500/40"
                  />
                  <div>
                    <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">Telehealth Appointment</span>
                    <h4 className="text-lg font-black text-white">{activeBookingDoc.name}</h4>
                    <p className="text-xs text-slate-400">{activeBookingDoc.specialty} • {activeBookingDoc.fee} Consultation</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Select Consultation Slot
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {activeBookingDoc.slots.map((s) => (
                      <button
                        key={s}
                        onClick={() => setSelectedSlot(s)}
                        className={`p-3 rounded-xl text-xs font-mono font-bold transition-all border ${
                          selectedSlot === s
                            ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/30'
                            : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5 text-xs text-slate-300">
                  <div className="flex justify-between font-bold">
                    <span>Consultation Type:</span>
                    <span className="text-emerald-400">Encrypted HD Video Room</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>Selected Time:</span>
                    <span className="text-white font-mono">{selectedSlot}</span>
                  </div>
                </div>

                <button
                  onClick={handleConfirmBooking}
                  className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/30"
                >
                  Confirm & Reserve Appointment
                </button>
              </div>
            ) : (
              <div className="py-6 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 size={32} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xl font-black text-white">Consultation Reserved!</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Appointment with <strong className="text-white">{activeBookingDoc.name}</strong> confirmed for{' '}
                    <strong className="text-emerald-400">{selectedSlot}</strong>.
                  </p>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-400">
                  Pass Token: {bookingToken}
                </div>
                <button
                  onClick={() => setActiveBookingDoc(null)}
                  className="px-6 py-2.5 rounded-xl bg-slate-800 text-white font-bold text-xs hover:bg-slate-700"
                >
                  Close Window
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorBooking3D;
