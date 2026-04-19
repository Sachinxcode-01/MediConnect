const API_URL = 'http://localhost:5000/api/auth';

async function testAuth() {
    try {
        console.log('--- Testing Registration ---');
        const regEmail = `test_${Date.now()}@example.com`;
        const regRes = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Test User',
                email: regEmail,
                password: 'password123',
                role: 'patient'
            })
        });
        const regData = await regRes.json();
        console.log('Registration Status:', regRes.status);
        console.log('Registration Body:', regData);

        if (regRes.status !== 201 && regRes.status !== 200) {
            throw new Error(`Registration failed with status ${regRes.status}`);
        }

        console.log('\n--- Testing Login ---');
        const loginRes = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: regEmail,
                password: 'password123'
            })
        });
        const loginData = await loginRes.json();
        console.log('Login Status:', loginRes.status);
        console.log('Login Body:', loginData);

        if (loginData.accessToken) {
            console.log('\nSUCCESS: Auth flow working correctly.');
        } else {
            console.log('\nFAILURE: Access token missing.');
        }

    } catch (error) {
        console.error('Auth Test Failed:', error.message);
    }
}

testAuth();
