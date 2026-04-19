require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Patient = require('./models/Patient');
const Doctor = require('./models/Doctor');
const Appointment = require('./models/Appointment');

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/mediconnect');

const seedDatabase = async () => {
  try {
    await User.deleteMany();
    await Patient.deleteMany();
    await Doctor.deleteMany();
    await Appointment.deleteMany();

    console.log('Cleared existing data.');

    const patient1 = await User.create({ name: 'Alice Patient', email: 'alice@test.com', password: 'password', role: 'patient' });
    const patient2 = await User.create({ name: 'Bob Patient', email: 'bob@test.com', password: 'password', role: 'patient' });

    await Patient.create([
      { userId: patient1._id, dob: '1990-01-01', bloodGroup: 'O+', allergies: ['Peanuts'] },
      { userId: patient2._id, dob: '1985-05-15', bloodGroup: 'A-', medicalHistory: ['Asthma'] }
    ]);

    const doctor1 = await User.create({ name: 'Dr. Smith', email: 'smith@test.com', password: 'password', role: 'doctor' });
    const doctor2 = await User.create({ name: 'Dr. Jones', email: 'jones@test.com', password: 'password', role: 'doctor' });
    const doctor3 = await User.create({ name: 'Dr. Lee', email: 'lee@test.com', password: 'password', role: 'doctor' });

    await Doctor.create([
      { userId: doctor1._id, specialization: 'Cardiology', licenseNo: 'DOC123' },
      { userId: doctor2._id, specialization: 'Pediatrics', licenseNo: 'DOC456' },
      { userId: doctor3._id, specialization: 'General', licenseNo: 'DOC789' }
    ]);

    await Appointment.create([
      { patientId: patient1._id, doctorId: doctor1._id, date: new Date(), time: '10:00', type: 'video' },
      { patientId: patient2._id, doctorId: doctor3._id, date: new Date(), time: '14:00', type: 'in-person' }
    ]);

    console.log('Database seeded successfully!');
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedDatabase();
