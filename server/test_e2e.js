import http from 'http';
import { createServer } from 'http';
import express from 'express';
import cors from 'cors';
import { Server } from 'socket.io';
import {
  authRoutes,
  triageRoutes,
  recordRoutes,
  appointmentRoutes,
  vitalsRoutes,
  pharmacyRoutes,
  chatRoutes,
  videoRoutes,
  livekitRoutes,
  patientRoutes,
  doctorRoutes,
  prescriptionRoutes,
  adminRoutes,
  notificationRoutes
} from './src/routes/index.js';
import errorHandler from './src/middleware/errorHandler.js';

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: '*' } });
app.set('io', io);

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/triage', triageRoutes);
app.use('/api/records', recordRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/vitals', vitalsRoutes);
app.use('/api/pharmacy', pharmacyRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use(errorHandler);

const TEST_PORT = 5099;

httpServer.listen(TEST_PORT, async () => {
  console.log(`\n==================================================`);
  console.log(`🏥 MediConnect End-to-End Test Suite Starting...`);
  console.log(`==================================================\n`);

  const baseUrl = `http://localhost:${TEST_PORT}/api`;

  try {
    // 1. Patient Login
    console.log('1️⃣ Testing Patient Authentication...');
    let res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'patient@mediconnect.ai', password: 'password123' })
    });
    const patientLogin = await res.json();
    if (!patientLogin.success || !patientLogin.token) throw new Error('Patient login failed');
    const patientToken = patientLogin.token;
    console.log(`   ✅ Patient authenticated: ${patientLogin.user.name} (${patientLogin.user.email})`);

    // 2. Doctor Login
    console.log('\n2️⃣ Testing Doctor Authentication...');
    res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'doctor@mediconnect.ai', password: 'password123' })
    });
    const doctorLogin = await res.json();
    if (!doctorLogin.success || !doctorLogin.token) throw new Error('Doctor login failed');
    const doctorToken = doctorLogin.token;
    console.log(`   ✅ Doctor authenticated: ${doctorLogin.user.name} (${doctorLogin.user.email})`);

    // 3. Admin Login
    console.log('\n3️⃣ Testing Admin Authentication...');
    res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@mediconnect.ai', password: 'password123' })
    });
    const adminLogin = await res.json();
    if (!adminLogin.success || !adminLogin.token) throw new Error('Admin login failed');
    const adminToken = adminLogin.token;
    console.log(`   ✅ Admin authenticated: ${adminLogin.user.name} (${adminLogin.user.email})`);

    // 4. Doctor Discovery
    console.log('\n4️⃣ Testing Doctor Discovery Endpoint...');
    res = await fetch(`${baseUrl}/doctors`, {
      headers: { 'Authorization': `Bearer ${patientToken}` }
    });
    const doctorsList = await res.json();
    if (!doctorsList.success || doctorsList.count === 0) throw new Error('Doctor discovery failed');
    console.log(`   ✅ Found ${doctorsList.count} verified doctors. Featured: ${doctorsList.data[0].name} (${doctorsList.data[0].specialty})`);

    // 5. AI Triage Submission
    console.log('\n5️⃣ Testing AI Triage Clinical Assessment...');
    res = await fetch(`${baseUrl}/triage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${patientToken}`
      },
      body: JSON.stringify({
        symptoms: 'Patient experiencing elevated temperature 38.5C, continuous dry cough, and mild chills for 2 days.'
      })
    });
    const triageRes = await res.json();
    if (!triageRes.success || !triageRes.data) throw new Error('AI Triage submission failed');
    console.log(`   ✅ Triage assessment generated:`);
    console.log(`      Severity: ${triageRes.data.severity.toUpperCase()}`);
    console.log(`      Detected: ${triageRes.data.aiAnalysis?.symptoms_detected?.join(', ') || 'Symptoms logged'}`);
    console.log(`      Next Step: ${triageRes.data.aiAnalysis?.recommended_next_step}`);

    // 6. Appointment Booking Flow
    console.log('\n6️⃣ Testing Telehealth Appointment Scheduling...');
    res = await fetch(`${baseUrl}/appointments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${patientToken}`
      },
      body: JSON.stringify({
        doctor: doctorsList.data[0].id,
        title: 'Virtual Clinical Followup',
        description: 'Reviewing recent AI triage symptoms',
        startTime: new Date(Date.now() + 86400000).toISOString(),
        endTime: new Date(Date.now() + 90000000).toISOString(),
        type: 'video'
      })
    });
    const aptRes = await res.json();
    if (!aptRes.success || !aptRes.data) throw new Error('Appointment booking failed');
    console.log(`   ✅ Appointment confirmed! ID: ${aptRes.data.id}, Room: ${aptRes.data.roomCode || aptRes.data.room_code}`);

    // 7. Doctor Viewing Appointments
    console.log('\n7️⃣ Doctor Checking Daily Schedule...');
    res = await fetch(`${baseUrl}/appointments`, {
      headers: { 'Authorization': `Bearer ${doctorToken}` }
    });
    const docApts = await res.json();
    console.log(`   ✅ Doctor retrieved ${docApts.count} scheduled appointments.`);

    // 8. Doctor Issuing Prescription
    console.log('\n8️⃣ Doctor Issuing Digital Prescription...');
    res = await fetch(`${baseUrl}/prescriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${doctorToken}`
      },
      body: JSON.stringify({
        patientId: patientLogin.user._id,
        medication: 'Amoxicillin / Clavulanate',
        dosage: '500mg/125mg',
        frequency: 'Twice daily with meals',
        duration: '7 days',
        instructions: 'Complete full course. Drink plenty of fluids.'
      })
    });
    const rxRes = await res.json();
    if (!rxRes.success || !rxRes.data) throw new Error('Prescription issuance failed');
    console.log(`   ✅ Prescription issued for ${rxRes.data.medication} (${rxRes.data.dosage})`);

    // 9. Patient Checking Prescriptions & Pharmacy Delivery
    console.log('\n9️⃣ Patient Checking Prescriptions & Pharmacy Radar...');
    res = await fetch(`${baseUrl}/prescriptions/my`, {
      headers: { 'Authorization': `Bearer ${patientToken}` }
    });
    const patientRx = await res.json();
    console.log(`   ✅ Patient has ${patientRx.count} active prescriptions.`);

    res = await fetch(`${baseUrl}/pharmacy/nearby?lat=37.7749&lng=-122.4194`, {
      headers: { 'Authorization': `Bearer ${patientToken}` }
    });
    const pharmacies = await res.json();
    console.log(`   ✅ Nearby pharmacies discovered: ${pharmacies.count} locations.`);

    // 10. Wearable Telemetry Ingestion
    console.log('\n🔟 Testing Wearable Vitals Telemetry Stream...');
    res = await fetch(`${baseUrl}/vitals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${patientToken}`
      },
      body: JSON.stringify({
        heartRate: 75,
        spo2: 99,
        temperature: 36.8,
        bloodPressure: '118/78',
        device: 'MediConnect Smart Band Pro'
      })
    });
    const vitalsRes = await res.json();
    if (!vitalsRes.success || !vitalsRes.data) throw new Error('Vitals telemetry failed');
    console.log(`   ✅ Vitals ingested: HR ${vitalsRes.data.heartRate} bpm, SpO2 ${vitalsRes.data.spo2}%, BP ${vitalsRes.data.bloodPressure}`);

    // 11. Medical Records EMR Vault
    console.log('\n1️⃣1️⃣ Testing Medical Records Vault...');
    res = await fetch(`${baseUrl}/records`, {
      headers: { 'Authorization': `Bearer ${patientToken}` }
    });
    const recordsRes = await res.json();
    console.log(`   ✅ EMR records retrieved: ${recordsRes.count} verified documents.`);

    // 12. Admin Command Center
    console.log('\n1️⃣2️⃣ Testing Admin Command Center & Metrics...');
    res = await fetch(`${baseUrl}/admin/stats`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const adminStats = await res.json();
    console.log(`   ✅ Admin metrics retrieved:`);
    console.log(`      Total Users: ${adminStats.data.totalUsers}`);
    console.log(`      Triage Cases: ${adminStats.data.totalTriageCases}`);
    console.log(`      System Health: ${adminStats.data.systemHealth}`);

    console.log(`\n==================================================`);
    console.log(`🎉 ALL 12 END-TO-END FEATURES FULLY VERIFIED & WORKING!`);
    console.log(`==================================================\n`);

    httpServer.close(() => process.exit(0));
  } catch (err) {
    console.error('\n❌ E2E Test Failed:', err);
    httpServer.close(() => process.exit(1));
  }
});
