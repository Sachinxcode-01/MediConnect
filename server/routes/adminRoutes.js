const express = require('express');
const router = express.Router();
const supabase = require('../utils/supabase');
const { protect } = require('../middleware/auth');

// Get system statistics
router.get('/stats', protect(['admin']), async (req, res) => {
  try {
    const { count: userCount } = await supabase.from('users').select('*', { count: 'exact', head: true });
    const { count: patientCount } = await supabase.from('patients').select('*', { count: 'exact', head: true });
    const { count: doctorCount } = await supabase.from('doctors').select('*', { count: 'exact', head: true });
    const { count: appointmentCount } = await supabase.from('appointments').select('*', { count: 'exact', head: true });

    res.json({
      users: userCount,
      patients: patientCount,
      doctors: doctorCount,
      appointments: appointmentCount
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching stats', error: error.message });
  }
});

// Get all users
router.get('/users', protect(['admin']), async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(users.map(u => ({ ...u, _id: u.id })));
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
});

module.exports = router;
