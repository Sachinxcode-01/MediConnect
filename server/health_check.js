import fetch from 'node-fetch';

async function verifyAPI() {
  console.log('🔍 Starting MediConnect Health Check...');
  const backendUrl = 'http://localhost:5000/api';
  
  // 1. Basic server ping / health check (if available, else we'll hit an invalid route to see if it responds with 404 or something, or we can just try to login)
  try {
    const start = Date.now();
    
    // We'll try to login with a user we know might exist, or just send a dummy request to trigger the validation
    console.log('\nTesting Auth Endpoint (Speed Test)...');
    let res = await fetch(`${backendUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com', password: 'wrongpassword' })
    });
    
    const data = await res.json();
    const duration = Date.now() - start;
    
    console.log(`⏱️ Response Time: ${duration}ms`);
    console.log(`📡 Status Code: ${res.status}`);
    
    if (duration < 500) {
      console.log('⚡ API is responding very fast!');
    } else {
      console.log('⚠️ API response is a bit slow.');
    }
    
    if (res.status === 401 || res.status === 400 || res.status === 404) {
      console.log('✅ Auth route reached successfully (Expected error for dummy login)');
    } else {
      console.log('❌ Unexpected response:', data);
    }
  } catch (err) {
    console.error('❌ Connection refused! Is the server running?', err.message);
  }
}

verifyAPI();
