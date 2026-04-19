require('dotenv').config();
const supabase = require('./utils/supabase');
const bcrypt = require('bcryptjs');

const seedDatabase = async () => {
  try {
    console.log('Starting Supabase Seeding...');

    // 1. Clear existing data (Note: Order matters due to FKs)
    await supabase.from('appointments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('medical_records').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('triage_entries').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('wearable_history').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('prescriptions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('patients').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('doctors').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('users').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    console.log('Cleared existing data.');

    const password = 'password123';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 2. Create Users
    const usersToInsert = [
      { name: 'Dr. Smith', email: 'doctor@mediconnect.ai', password: hashedPassword, role: 'doctor' },
      { name: 'Dr. Jones', email: 'jones@test.com', password: hashedPassword, role: 'doctor' },
      { name: 'John Doe', email: 'patient@mediconnect.ai', password: hashedPassword, role: 'patient' },
      { name: 'Alice Patient', email: 'alice@test.com', password: hashedPassword, role: 'patient' },
      { name: 'Admin User', email: 'admin@mediconnect.ai', password: hashedPassword, role: 'admin' }
    ];

    const { data: insertedUsers, error: userError } = await supabase.from('users').insert(usersToInsert).select();
    if (userError) throw userError;

    const doc1 = insertedUsers.find(u => u.email === 'doctor@mediconnect.ai');
    const doc2 = insertedUsers.find(u => u.email === 'jones@test.com');
    const pat1 = insertedUsers.find(u => u.email === 'patient@mediconnect.ai');
    const pat2 = insertedUsers.find(u => u.email === 'alice@test.com');

    // 3. Create Doctor Records
    const doctorsToInsert = [
      { user_id: doc1.id, specialization: 'Cardiology', license_no: 'DOC123' },
      { user_id: doc2.id, specialization: 'Pediatrics', license_no: 'DOC456' }
    ];
    const { data: insertedDoctors, error: docError } = await supabase.from('doctors').insert(doctorsToInsert).select();
    if (docError) throw docError;

    // 4. Create Patient Records
    const patientsToInsert = [
      { user_id: pat1.id, blood_group: 'O+', gender: 'Male', dob: '1990-01-01', allergies: ['Peanuts'], medications: ['Zyrtec'] },
      { user_id: pat2.id, blood_group: 'A-', gender: 'Female', dob: '1985-05-15', allergies: [], medications: [] }
    ];
    const { data: insertedPatients, error: patError } = await supabase.from('patients').insert(patientsToInsert).select();
    if (patError) throw patError;

    // 5. Create Appointments
    const appointmentsToInsert = [
      { patient_id: insertedPatients[0].id, doctor_id: insertedDoctors[0].id, date: new Date(), type: 'video', status: 'scheduled', notes: 'Monthly heart checkup' },
      { patient_id: insertedPatients[1].id, doctor_id: insertedDoctors[1].id, date: new Date(), type: 'in-person', status: 'completed', notes: 'Routine checkup' }
    ];
    await supabase.from('appointments').insert(appointmentsToInsert);

    // 6. Create Triage Entries
    const triageToInsert = [
      { patient_id: insertedPatients[0].id, severity: 'medium', symptoms: 'Mild chest pain, fatigue', status: 'pending', ai_analysis: { severity: 'medium', recommendedAction: 'Schedule a cardiology consult' } },
      { patient_id: insertedPatients[1].id, severity: 'low', symptoms: 'Slight cough', status: 'resolved', ai_analysis: { severity: 'low', recommendedAction: 'Rest and hydration' } }
    ];
    await supabase.from('triage_entries').insert(triageToInsert);

    // 7. Create Medical Records
    const recordsToInsert = [
      { patient_id: insertedPatients[0].id, doctor_id: insertedDoctors[0].id, type: 'Report', title: 'ECG Results', description: 'Normal sinus rhythm detected.', file_url: 'https://res.cloudinary.com/dummy/image/upload/v1/mediconnect_records/sample_ecg.pdf' }
    ];
    await supabase.from('medical_records').insert(recordsToInsert);

    // 8. Create Wearable History
    const wearableToInsert = [
      { patient_id: insertedPatients[0].id, heart_rate: 72, spo2: 98, temperature: 36.6, blood_pressure: '120/80', alert_triggered: false },
      { patient_id: insertedPatients[0].id, heart_rate: 125, spo2: 91, temperature: 38.2, blood_pressure: '140/90', alert_triggered: true }
    ];
    await supabase.from('wearable_history').insert(wearableToInsert);

    console.log('Supabase Database seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding Error:', err);
    process.exit(1);
  }
};

seedDatabase();
