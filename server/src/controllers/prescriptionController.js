import supabase from '../config/supabase.js';
import { localStore } from '../models/localStore.js';

// @desc    Issue a digital prescription
// @route   POST /api/prescriptions
// @access  Private (Doctor)
export const createPrescription = async (req, res, next) => {
  try {
    const { patientId, medication, dosage, instructions, duration, frequency } = req.body;

    if (!patientId || !medication) {
      return res.status(400).json({ success: false, message: 'Patient ID and medication are required' });
    }

    const newId = `rx-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const row = {
      id: newId,
      _id: newId,
      patient_id: patientId,
      doctor_id: req.user.id,
      medication,
      dosage: dosage || '',
      instructions: instructions || '',
      duration: duration || '',
      frequency: frequency || 'Once daily',
      status: 'active',
      pharmacy: {
        name: 'MediConnect Partner Pharmacy',
        address: '100 Medical Center Blvd, Health District',
        phone: '+1 (800) 555-0199',
        courier_status: 'preparing_order',
        eta_minutes: 30
      },
      created_at: new Date().toISOString()
    };

    try {
      const { data: inserted, error } = await supabase
        .from('prescriptions')
        .insert(row)
        .select('*, patient:users!patient_id(id, name, email)')
        .single();

      if (!error && inserted) {
        return res.status(201).json({ success: true, data: inserted });
      }
    } catch {
      // Fall through to memory
    }

    localStore.prescriptions.unshift(row);
    res.status(201).json({ success: true, data: row });
  } catch (error) {
    next(error);
  }
};

// @desc    Get prescriptions for logged in doctor/admin
// @route   GET /api/prescriptions
// @access  Private (Doctor, Admin)
export const getPrescriptions = async (req, res, next) => {
  try {
    try {
      const { data, error } = await supabase
        .from('prescriptions')
        .select('*, patient:users!patient_id(id, name, email)')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return res.status(200).json({ success: true, count: data.length, data });
      }
    } catch {
      // Fall through
    }

    // Hydrate localStore prescriptions
    const list = localStore.prescriptions.map(rx => {
      const pat = localStore.users.find(u => u.id === rx.patient_id || u._id === rx.patient_id);
      return {
        ...rx,
        patient: pat ? { id: pat.id, name: pat.name, email: pat.email } : null
      };
    });

    res.status(200).json({ success: true, count: list.length, data: list });
  } catch (error) {
    next(error);
  }
};

// @desc    Get prescriptions for patient
// @route   GET /api/prescriptions/my
// @access  Private (Patient)
export const getMyPrescriptions = async (req, res, next) => {
  try {
    try {
      const { data, error } = await supabase
        .from('prescriptions')
        .select('*, doctor:users!doctor_id(id, name)')
        .eq('patient_id', req.user.id)
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return res.status(200).json({ success: true, count: data.length, data });
      }
    } catch {
      // Fall through
    }

    const list = localStore.prescriptions
      .filter(rx => rx.patient_id === req.user.id || rx.patientId === req.user.id)
      .map(rx => {
        const doc = localStore.users.find(u => u.id === rx.doctor_id || u._id === rx.doctor_id);
        return {
          ...rx,
          doctor: doc ? { id: doc.id, name: doc.name, specialization: doc.specialization } : null
        };
      });

    res.status(200).json({ success: true, count: list.length, data: list });
  } catch (error) {
    next(error);
  }
};
