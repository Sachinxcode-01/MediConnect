import supabase from '../config/supabase.js';

// @desc    Get all patients
// @route   GET /api/patients
// @access  Private (Doctor, Admin)
export const getPatients = async (req, res, next) => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, email, phone, profile_image, created_at')
      .eq('role', 'patient')
      .order('name', { ascending: true });

    if (error) throw error;

    // Map to normalized patient objects
    const patients = (users || []).map(u => ({
      _id: u.id,
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      profileImage: u.profile_image,
      createdAt: u.created_at
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
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .eq('role', 'patient')
      .single();

    if (error || !user) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    res.status(200).json({
      success: true,
      data: {
        _id: user.id,
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        profileImage: user.profile_image,
        createdAt: user.created_at
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

    const { data: updated, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select('*')
      .single();

    if (error) throw error;

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        _id: updated.id,
        id: updated.id,
        name: updated.name,
        email: updated.email,
        phone: updated.phone,
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
