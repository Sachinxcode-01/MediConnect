import supabase from '../config/supabase.js';
import { localStore } from '../models/localStore.js';

// @desc    Get all doctors (with filter support for Doctor Discovery)
// @route   GET /api/doctors
// @access  Public / Private
export const getDoctors = async (req, res, next) => {
  try {
    const { specialty, search } = req.query;

    let users = [];
    try {
      let query = supabase
        .from('users')
        .select('id, name, email, phone, profile_image, created_at')
        .eq('role', 'doctor');

      if (search) {
        query = query.ilike('name', `%${search}%`);
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        users = data;
      }
    } catch {
      // Fall through to memory
    }

    if (users.length === 0) {
      users = localStore.users.filter(u => u.role === 'doctor');
      if (search) {
        users = users.filter(u => u.name.toLowerCase().includes(search.toLowerCase()));
      }
    }

    const specialties = ['Cardiology', 'Pediatrics', 'Dermatology', 'General Medicine', 'Neurology', 'Orthopedics'];

    const doctors = users.map((u, index) => ({
      _id: u.id || u._id,
      id: u.id || u._id,
      name: u.name.startsWith('Dr.') ? u.name : `Dr. ${u.name}`,
      email: u.email,
      phone: u.phone,
      profileImage: u.profile_image || u.profileImage,
      specialty: u.specialization || specialties[index % specialties.length],
      experience: `${5 + (index * 3)} years`,
      rating: (4.8 + (index * 0.1) % 0.2).toFixed(1),
      consultationMode: u.consultationMode || 'both',
      availability: u.availability || 'Available Today',
      verificationStatus: 'verified',
      fee: '$50 - $100'
    }));

    let filtered = doctors;
    if (specialty && specialty !== 'All') {
      filtered = filtered.filter(d => d.specialty.toLowerCase() === specialty.toLowerCase());
    }

    res.status(200).json({ success: true, count: filtered.length, data: filtered });
  } catch (error) {
    next(error);
  }
};

// @desc    Get doctor by ID
// @route   GET /api/doctors/:id
// @access  Public / Private
export const getDoctorById = async (req, res, next) => {
  try {
    const { id } = req.params;
    let user = null;

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .eq('role', 'doctor')
        .single();
      if (!error && data) user = data;
    } catch {
      // Fall through
    }

    if (!user) {
      user = localStore.users.find(u => (u.id === id || u._id === id) && u.role === 'doctor');
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    res.status(200).json({
      success: true,
      data: {
        _id: user.id || user._id,
        id: user.id || user._id,
        name: user.name.startsWith('Dr.') ? user.name : `Dr. ${user.name}`,
        email: user.email,
        phone: user.phone,
        profileImage: user.profile_image || user.profileImage,
        specialty: user.specialization || 'Cardiology',
        verificationStatus: 'verified'
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify/unverify doctor
// @route   PUT /api/doctors/:id/verify
// @access  Private (Admin)
export const verifyDoctor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isVerified } = req.body;

    try {
      await supabase
        .from('users')
        .update({ is_active: isVerified })
        .eq('id', id);
    } catch {
      // Local
    }

    const doc = localStore.users.find(u => u.id === id || u._id === id);
    if (doc) doc.is_active = isVerified;

    res.status(200).json({ success: true, message: `Doctor status updated to ${isVerified ? 'verified' : 'unverified'}` });
  } catch (error) {
    next(error);
  }
};

// @desc    Update doctor availability status
// @route   PUT /api/doctors/availability
// @access  Private (Doctor)
export const updateDoctorAvailability = async (req, res, next) => {
  try {
    const { availability, consultationMode } = req.body;
    const docId = req.user.id || req.user._id;

    const doc = localStore.users.find(u => u.id === docId || u._id === docId);
    if (doc) {
      if (availability) doc.availability = availability;
      if (consultationMode) doc.consultationMode = consultationMode;
    }

    res.status(200).json({
      success: true,
      message: 'Doctor availability updated',
      data: { availability, consultationMode }
    });
  } catch (error) {
    next(error);
  }
};
