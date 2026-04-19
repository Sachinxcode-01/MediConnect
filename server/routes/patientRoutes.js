const express = require('express');
const router = express.Router();
const supabase = require('../utils/supabase');
const { protect } = require('../middleware/auth');

router.get('/me', protect(['patient']), async (req, res) => {
  const { data, error } = await supabase
    .from('patients')
    .select('*, users(*)')
    .eq('user_id', req.user.id)
    .single();

  if (error) return res.status(500).json({ message: error.message });
  res.json({ ...data, _id: data.id });
});

router.get('/', protect(['doctor', 'admin']), async (req, res) => {
  const { data, error } = await supabase
    .from('patients')
    .select('*, users(name, email, avatar)');

  if (error) return res.status(500).json({ message: error.message });
  res.json(data.map(p => ({ 
      ...p, 
      _id: p.id,
      name: p.users?.name,
      email: p.users?.email
  })));
});

router.put('/profile', protect(['patient']), async (req, res) => {
  const { dob, gender, blood_group, allergies, medications } = req.body;
  const { data, error } = await supabase
    .from('patients')
    .update({ dob, gender, blood_group, allergies, medications })
    .eq('user_id', req.user.id)
    .select()
    .single();

  if (error) return res.status(500).json({ message: error.message });
  res.json({ ...data, _id: data.id });
});

module.exports = router;
