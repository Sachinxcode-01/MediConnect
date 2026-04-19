const bcrypt = require('bcryptjs');
const supabase = require('../server/utils/supabase');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../server/.env') });

async function seed() {
    try {
        const password = 'password123';
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Delete existing (just in case)
        await supabase.from('users').delete().in('email', ['doctor@mediconnect.ai', 'patient@mediconnect.ai']);

        // Insert Doctor
        const { data: docUser, error: dError } = await supabase.from('users').insert([
            { name: 'Dr. Smith', email: 'doctor@mediconnect.ai', password: hashedPassword, role: 'doctor' }
        ]).select().single();
        if (dError) throw dError;
        await supabase.from('doctors').insert([{ user_id: docUser.id, specialization: 'Cardiology', license_no: 'DOC123' }]);

        // Insert Patient
        const { data: patUser, error: pError } = await supabase.from('users').insert([
            { name: 'John Doe', email: 'patient@mediconnect.ai', password: hashedPassword, role: 'patient' }
        ]).select().single();
        if (pError) throw pError;
        await supabase.from('patients').insert([{ user_id: patUser.id, blood_group: 'O+', gender: 'Male' }]);

        console.log('Seed successful!');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

seed();
