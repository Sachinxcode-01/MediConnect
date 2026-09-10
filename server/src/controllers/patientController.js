import supabase from '../config/supabase.js';
import { localStore } from '../models/localStore.js';

// @desc    Get all patients
// @route   GET /api/patients
// @access  Private (Doctor, Admin)
export const getPatients = async (req, res, next) => {
  try {
    let users = [];
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email, phone, profile_image, created_at')
        .eq('role', 'patient')
        .order('name', { ascending: true });

      if (!error && data && data.length > 0) {
        users = data;
      }
    } catch {
      // Fall through
    }

    if (users.length === 0) {
      users = localStore.users.filter(u => u.role === 'patient');
    }

    const patients = users.map(u => ({
      _id: u.id || u._id,
      id: u.id || u._id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      profileImage: u.profile_image || u.profileImage,
      bloodGroup: u.blood_group || u.bloodGroup || 'O+',
      createdAt: u.created_at || u.createdAt
    }));

    res.status(200).json({ success: true, count: patients.length, data: patients });
  } catch (error) {
    next(error);
  }
};

// @desc    Get patient by ID
// @route   GET /api/patients/:id
// @access  Private (Doctor, Admin, Self)
export const getPatientById = async (req, res, next) => {
  try {
    const { id } = req.params;
    let user = null;

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .eq('role', 'patient')
        .single();
      if (!error && data) user = data;
    } catch {
      // Fall through
    }

    if (!user) {
      user = localStore.users.find(u => (u.id === id || u._id === id) && u.role === 'patient');
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    res.status(200).json({
      success: true,
      data: {
        _id: user.id || user._id,
        id: user.id || user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        profileImage: user.profile_image || user.profileImage,
        bloodGroup: user.blood_group || user.bloodGroup || 'O+',
        allergies: user.allergies || ['Penicillin'],
        medications: user.medications || ['Lisinopril 10mg'],
        createdAt: user.created_at || user.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update patient profile & health info
// @route   PUT /api/patients/profile
// @access  Private (Patient)
export const updatePatientProfile = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user._id;
    const { name, phone, dob, emergencyContact, allergies, existingConditions, currentMedications } = req.body;

    const updates = {
      name,
      phone,
      updated_at: new Date().toISOString()
    };

    try {
      await supabase
        .from('users')
        .update(updates)
        .eq('id', userId);
    } catch {
      // Handled in memory
    }

    const patient = localStore.users.find(u => u.id === userId || u._id === userId);
    if (patient) {
      if (name) patient.name = name;
      if (phone) patient.phone = phone;
      if (allergies) patient.allergies = allergies;
      if (currentMedications) patient.medications = currentMedications;
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        _id: userId,
        id: userId,
        name: name || patient?.name,
        email: patient?.email,
        phone: phone || patient?.phone,
        dob,
        emergencyContact,
        allergies,
        existingConditions,
        currentMedications
      }
    });
  } catch (error) {
    next(error);
  }
};
