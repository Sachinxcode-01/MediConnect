const API_URL = 'http://localhost:5000/api';

async function testDoctorAuth() {
    try {
        console.log('--- Testing Doctor Registration ---');
        const regEmail = `doc_test_${Date.now()}@example.com`;
        const regRes = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Dr. Test',
                email: regEmail,
                password: 'password123',
                role: 'doctor'
            })
        });
        const regData = await regRes.json();
        console.log('Registration Status:', regRes.status);
        
        if (regRes.status !== 201) {
            throw new Error(`Registration failed: ${JSON.stringify(regData)}`);
        }

        // Verify doctor record exists
        console.log('\n--- Verifying Doctor Record ---');
        const doctorRes = await fetch(`${API_URL}/doctors/all`);
        const doctors = await doctorRes.json();
        const found = doctors.find(d => d.user_id === regData._id);
        
        if (found) {
            console.log('SUCCESS: Doctor record created automatically:', found);
        } else {
            console.log('FAILURE: Doctor record not found.');
        }

    } catch (error) {
        console.error('Test Failed:', error.message);
    }
}

testDoctorAuth();
