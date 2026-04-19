const express = require('express');
const router = express.Router();
const supabase = require('../utils/supabase');
const { protect } = require('../middleware/auth');

router.get('/me', protect(['doctor']), async (req, res) => {
  const { data, error } = await supabase
    .from('doctors')
    .select('*, users(*)')
    .eq('user_id', req.user.id)
    .single();

  if (error) return res.status(500).json({ message: error.message });
  res.json({ ...data, _id: data.id });
});

router.get('/all', async (req, res) => {
  const { data, error } = await supabase
    .from('doctors')
    .select('*, users(name, avatar)');

  if (error) return res.status(500).json({ message: error.message });
  res.json(data.map(d => ({ ...d, _id: d.id })));
});

module.exports = router;
