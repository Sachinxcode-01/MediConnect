const express = require('express');
const router = express.Router();
const supabase = require('../utils/supabase');
const { protect } = require('../middleware/auth');
const crypto = require('crypto');

router.post('/', protect(['patient', 'admin']), async (req, res) => {
  try {
    const { doctorId, date, time, type, notes } = req.body;
    const { data: patient } = await supabase.from('patients').select('id').eq('user_id', req.user.id).single();

    const roomUrl = type === 'video' ? `https://dummy-daily.co/room-${crypto.randomBytes(8).toString('hex')}` : null;
    
    const { data: appt, error } = await supabase
      .from('appointments')
      .insert([{
        patient_id: patient.id,
        doctor_id: doctorId,
        date: new Date(`${date}T${time}`),
        type, 
        notes,
        status: 'scheduled'
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ ...appt, _id: appt.id, roomUrl });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id', protect(), async (req, res) => {
  const { data: appt, error } = await supabase
    .from('appointments')
    .select(`
      *,
      patients ( users ( name, email, avatar ) ),
      doctors ( users ( name ), specialization )
    `)
    .eq('id', req.params.id)
    .single();

  if (error) return res.status(500).json({ message: error.message });
  
  // Compat mapping
  const compat = {
      ...appt,
      _id: appt.id,
      patientId: { name: appt.patients.users.name, email: appt.patients.users.email },
      doctorId: { name: appt.doctors.users.name, specialization: appt.doctors.specialization }
  };
  res.json(compat);
});

router.put('/:id/status', protect(['doctor', 'admin', 'patient']), async (req, res) => {
  const { data: appt, error } = await supabase
    .from('appointments')
    .update({ status: req.body.status })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(500).json({ message: error.message });
  res.json({ ...appt, _id: appt.id });
});

router.delete('/:id', protect(), async (req, res) => {
  const { error } = await supabase.from('appointments').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ message: error.message });
  res.json({ message: 'Deleted' });
});

module.exports = router;
