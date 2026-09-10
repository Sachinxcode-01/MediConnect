import bcrypt from 'bcryptjs';

// Synchronous default hash for password123
const DEFAULT_PASSWORD_HASH = bcrypt.hashSync('password123', 10);

const now = new Date().toISOString();

export const localStore = {
  users: [
    {
      id: 'usr-doc-001',
      _id: 'usr-doc-001',
      name: 'Dr. Sarah Smith',
      email: 'doctor@mediconnect.ai',
      password: DEFAULT_PASSWORD_HASH,
      role: 'doctor',
      specialization: 'Cardiology',
      license_no: 'DOC-CARDIO-789',
      phone: '+1 (555) 234-5678',
      profile_image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300',
      is_active: true,
      created_at: now,
      updated_at: now
    },
    {
      id: 'usr-pat-001',
      _id: 'usr-pat-001',
      name: 'John Doe',
      email: 'patient@mediconnect.ai',
      password: DEFAULT_PASSWORD_HASH,
      role: 'patient',
      blood_group: 'O+',
      gender: 'Male',
      dob: '1992-05-14',
      allergies: ['Penicillin'],
      medications: ['Lisinopril 10mg'],
      phone: '+1 (555) 987-6543',
      profile_image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
      is_active: true,
      created_at: now,
      updated_at: now
    },
    {
      id: 'usr-adm-001',
      _id: 'usr-adm-001',
      name: 'MediConnect Admin',
      email: 'admin@mediconnect.ai',
      password: DEFAULT_PASSWORD_HASH,
      role: 'admin',
      phone: '+1 (555) 000-1122',
      profile_image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300',
      is_active: true,
      created_at: now,
      updated_at: now
    }
  ],

  appointments: [
    {
      id: 'apt-001',
      _id: 'apt-001',
      patient_id: 'usr-pat-001',
      doctor_id: 'usr-doc-001',
      title: 'Cardiovascular Checkup & Telehealth Consultation',
      description: 'Review of resting ECG telemetry and prescription adjustment.',
      start_time: new Date(Date.now() + 3600000).toISOString(),
      end_time: new Date(Date.now() + 7200000).toISOString(),
      date: new Date().toISOString().split('T')[0],
      status: 'scheduled',
      type: 'video',
      notes: 'Patient reports mild fatigue after morning exercise.',
      room_code: 'room-cardio-902',
      created_at: now
    }
  ],

  triageEntries: [
    {
      id: 'trg-001',
      _id: 'trg-001',
      patient_id: 'usr-pat-001',
      symptoms: 'Mild tightness in chest and slight shortness of breath after brisk walking.',
      severity: 'medium',
      status: 'pending',
      assigned_doctor_id: 'usr-doc-001',
      ai_analysis: {
        severity: 'medium',
        urgency: 'urgent',
        symptoms_detected: ['Chest tightness', 'Exertional dyspnea'],
        possible_categories: ['Cardiovascular Strain', 'Mild Respiratory Irritation'],
        recommended_next_step: 'Schedule immediate clinical evaluation or video consultation with cardiologist.',
        red_flags: [],
        confidence: 0.92,
        disclaimer: 'Clinical decision support provided for triage prioritization only.'
      },
      clinical_notes: ['Patient requested to sit upright and record resting vitals.'],
      created_at: now,
      updated_at: now
    }
  ],

  medicalRecords: [
    {
      id: 'rec-001',
      _id: 'rec-001',
      patient_id: 'usr-pat-001',
      doctor_id: 'usr-doc-001',
      type: 'Report',
      title: 'Resting Electrocardiogram (ECG) Report',
      description: 'Standard 12-lead resting ECG demonstrating normal sinus rhythm at 72 bpm without ischemic ST-T changes.',
      file_url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=800',
      file_name: 'ECG_Report_Resting.pdf',
      file_size: 2048576,
      hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      created_at: now
    }
  ],

  prescriptions: [
    {
      id: 'rx-001',
      _id: 'rx-001',
      patient_id: 'usr-pat-001',
      doctor_id: 'usr-doc-001',
      medication: 'Atorvastatin',
      dosage: '20mg',
      frequency: 'Once daily at bedtime',
      duration: '30 days',
      instructions: 'Take with water after dinner. Maintain low-sodium diet.',
      status: 'active',
      pharmacy: {
        name: 'MediConnect Care Pharmacy',
        address: '450 Healthcare Boulevard, Suite 100',
        phone: '+1 (800) 555-0199',
        courier_status: 'out_for_delivery',
        eta_minutes: 25
      },
      created_at: now
    }
  ],

  wearableHistory: [
    {
      id: 'vit-001',
      _id: 'vit-001',
      patient_id: 'usr-pat-001',
      heart_rate: 72,
      spo2: 98,
      blood_pressure: '120/80',
      temperature: 36.6,
      alert_triggered: false,
      timestamp: now
    },
    {
      id: 'vit-002',
      _id: 'vit-002',
      patient_id: 'usr-pat-001',
      heart_rate: 76,
      spo2: 99,
      blood_pressure: '122/82',
      temperature: 36.7,
      alert_triggered: false,
      timestamp: new Date(Date.now() - 300000).toISOString()
    }
  ],

  notifications: [
    {
      id: 'notif-001',
      _id: 'notif-001',
      user_id: 'usr-pat-001',
      title: 'Appointment Scheduled',
      message: 'Your telehealth appointment with Dr. Sarah Smith is confirmed.',
      read: false,
      created_at: now
    }
  ]
};

export default localStore;
