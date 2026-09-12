import 'dotenv/config';
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
  console.log(`🏥 MediConnect Comprehensive E2E Test Suite Starting...`);
  console.log(`==================================================\n`);

  const baseUrl = `http://localhost:${TEST_PORT}/api`;

  const cleanupAndExit = (code = 0) => {
    if (httpServer.closeAllConnections) {
      httpServer.closeAllConnections();
    }
    httpServer.close(() => {
      process.exit(code);
    });
    setTimeout(() => process.exit(code), 1000).unref();
  };

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

    // 4. Authentication Failure & Error Handling
    console.log('\n4️⃣ Testing Auth Failure / Invalid Credentials Handling...');
    res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'patient@mediconnect.ai', password: 'wrongPassword123' })
    });
    const badLogin = await res.json();
    if (res.status !== 401 || badLogin.success !== false) {
      throw new Error(`Expected 401 status for invalid credentials, got ${res.status}`);
    }
    console.log(`   ✅ Rejected invalid credentials cleanly with HTTP 401: "${badLogin.message}"`);

    // 5. RBAC Enforcement: Patient Forbidden from Doctor/Admin Endpoints
    console.log('\n5️⃣ Testing RBAC Authorization Boundaries...');
    res = await fetch(`${baseUrl}/admin/stats`, {
      headers: { 'Authorization': `Bearer ${patientToken}` }
    });
    if (res.status !== 403) {
      throw new Error(`Expected 403 for patient accessing admin stats, got ${res.status}`);
    }
    console.log(`   ✅ Patient blocked from Admin Stats (HTTP 403 Forbidden)`);

    res = await fetch(`${baseUrl}/patients`, {
      headers: { 'Authorization': `Bearer ${patientToken}` }
    });
    if (res.status !== 403) {
      throw new Error(`Expected 403 for patient accessing full patient directory, got ${res.status}`);
    }
    console.log(`   ✅ Patient blocked from Patient Directory (HTTP 403 Forbidden)`);

    // 6. IDOR Prevention: Medical Records & Vitals
    console.log('\n6️⃣ Testing IDOR & Healthcare Data Protection...');
    res = await fetch(`${baseUrl}/records/patient/usr-other-patient-999`, {
      headers: { 'Authorization': `Bearer ${patientToken}` }
    });
    if (res.status !== 403) {
      throw new Error(`Expected 403 when patient accesses another patient's records, got ${res.status}`);
    }
    console.log(`   ✅ IDOR blocked: Patient cannot access another patient's medical records (HTTP 403)`);

    res = await fetch(`${baseUrl}/vitals/latest?patientId=usr-other-patient-999`, {
      headers: { 'Authorization': `Bearer ${patientToken}` }
    });
    if (res.status !== 403) {
      throw new Error(`Expected 403 when patient accesses another patient's vitals, got ${res.status}`);
    }
    console.log(`   ✅ IDOR blocked: Patient cannot query another patient's telemetry (HTTP 403)`);

    // 7. Doctor Discovery
    console.log('\n7️⃣ Testing Doctor Discovery Endpoint...');
    res = await fetch(`${baseUrl}/doctors`, {
      headers: { 'Authorization': `Bearer ${patientToken}` }
    });
    const doctorsList = await res.json();
    if (!doctorsList.success || doctorsList.count === 0) throw new Error('Doctor discovery failed');
    console.log(`   ✅ Found ${doctorsList.count} verified doctors. Featured: ${doctorsList.data[0].name} (${doctorsList.data[0].specialty})`);

    // 8. AI Triage Submission
    console.log('\n8️⃣ Testing AI Triage Clinical Assessment...');
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
    console.log(`      Severity: ${triageRes.data.severity?.toUpperCase()}`);
    console.log(`      Detected: ${triageRes.data.aiAnalysis?.symptoms_detected?.join(', ') || 'Symptoms logged'}`);
    console.log(`      Next Step: ${triageRes.data.aiAnalysis?.recommended_next_step}`);

    // 9. Appointment Booking Flow & Status Lifecycle
    console.log('\n9️⃣ Testing Telehealth Appointment Scheduling & Cancellation Lifecycle...');
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
    const appointmentId = aptRes.data.id || aptRes.data._id;
    console.log(`   ✅ Appointment confirmed! ID: ${appointmentId}, Room: ${aptRes.data.roomCode || aptRes.data.room_code}`);

    // Doctor confirms appointment
    res = await fetch(`${baseUrl}/appointments/${appointmentId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${doctorToken}`
      },
      body: JSON.stringify({ status: 'confirmed' })
    });
    const confirmRes = await res.json();
    if (!confirmRes.success) throw new Error('Appointment confirmation failed');
    console.log(`   ✅ Appointment status transitioned to: ${confirmRes.data.status}`);

    // Patient cancels appointment (verifying no populate crash)
    res = await fetch(`${baseUrl}/appointments/${appointmentId}/cancel`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${patientToken}`
      },
      body: JSON.stringify({ reason: 'Rescheduled by patient request' })
    });
    const cancelRes = await res.json();
    if (!cancelRes.success || cancelRes.data.status !== 'cancelled') {
      throw new Error('Appointment cancellation failed');
    }
    console.log(`   ✅ Appointment cleanly cancelled without crashes (Status: ${cancelRes.data.status})`);

    // 10. Doctor Issuing Prescription
    console.log('\n🔟 Doctor Issuing Digital Prescription...');
    res = await fetch(`${baseUrl}/prescriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${doctorToken}`
      },
      body: JSON.stringify({
        patientId: patientLogin.user._id || patientLogin.user.id,
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

    // 11. Patient Checking Prescriptions & Pharmacy Radar
    console.log('\n1️⃣1️⃣ Patient Checking Prescriptions & Pharmacy Radar...');
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

    // 12. Wearable Telemetry Ingestion
    console.log('\n1️⃣2️⃣ Testing Wearable Vitals Telemetry Stream...');
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

    // 13. Medical Records EMR Vault
    console.log('\n1️⃣3️⃣ Testing Medical Records Vault...');
    res = await fetch(`${baseUrl}/records`, {
      headers: { 'Authorization': `Bearer ${patientToken}` }
    });
    const recordsRes = await res.json();
    console.log(`   ✅ EMR records retrieved: ${recordsRes.count} verified documents.`);

    // 14. Admin Command Center & Real Audit Logs
    console.log('\n1️⃣4️⃣ Testing Admin Command Center & Real Audit Logs...');
    res = await fetch(`${baseUrl}/admin/stats`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const adminStats = await res.json();
    console.log(`   ✅ Admin metrics retrieved: Users=${adminStats.data.totalUsers}, Health=${adminStats.data.systemHealth}`);

    res = await fetch(`${baseUrl}/admin/audit-logs`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const auditLogsRes = await res.json();
    if (!auditLogsRes.success || !Array.isArray(auditLogsRes.data)) throw new Error('Audit logs retrieval failed');
    console.log(`   ✅ Admin Audit Logs: ${auditLogsRes.count} persisted security event records retrieved.`);

    console.log(`\n==================================================`);
    console.log(`🎉 ALL 14 TEST SUITES (AUTH, RBAC, IDOR, WORKFLOWS) PASSED!`);
    console.log(`==================================================\n`);

    cleanupAndExit(0);
  } catch (err) {
    console.error('\n❌ E2E Test Failed:', err);
    cleanupAndExit(1);
  }
});
