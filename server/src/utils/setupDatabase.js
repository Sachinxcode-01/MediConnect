import supabase from '../config/supabase.js';

// SQL to create tables
const setupSQL = `
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'patient',
  profile_image TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  device_fingerprints JSONB DEFAULT '[]',
  login_attempt_count INTEGER DEFAULT 0,
  locked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create email_otps table
CREATE TABLE IF NOT EXISTS email_otps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  otp TEXT NOT NULL,
  purpose TEXT NOT NULL,
  user_id UUID REFERENCES users(id),
  expires_at TIMESTAMPTZ NOT NULL,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_email_otps_email ON email_otps(email);
CREATE INDEX IF NOT EXISTS idx_email_otps_purpose ON email_otps(purpose);
CREATE INDEX IF NOT EXISTS idx_email_otps_expires_at ON email_otps(expires_at);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_otps ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
DROP POLICY IF EXISTS "Users can read own data" ON users;
CREATE POLICY "Users can read own data" ON users
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert for registration" ON users;
CREATE POLICY "Allow insert for registration" ON users
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update for authenticated users" ON users;
CREATE POLICY "Allow update for authenticated users" ON users
  FOR UPDATE USING (true);

-- Create policies for email_otps table
DROP POLICY IF EXISTS "Allow insert for OTP creation" ON email_otps;
CREATE POLICY "Allow insert for OTP creation" ON email_otps
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow read for OTP verification" ON email_otps;
CREATE POLICY "Allow read for OTP verification" ON email_otps
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow update for OTP verification" ON email_otps;
CREATE POLICY "Allow update for OTP verification" ON email_otps
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow delete for OTP cleanup" ON email_otps;
CREATE POLICY "Allow delete for OTP cleanup" ON email_otps
  FOR DELETE USING (true);
`;

const setupDatabase = async () => {
  console.log('Setting up Supabase database...');

  try {
    // Note: We can't execute raw SQL directly from the client-side Supabase JS SDK
    // This script is for reference - run the SQL in your Supabase SQL Editor
    console.log('\n===========================================');
    console.log('SUPABASE DATABASE SETUP');
    console.log('===========================================');
    console.log('\nPlease run the following SQL in your Supabase SQL Editor:');
    console.log('https://nxmsulnnikgwchcvasax.supabase.co/project/editor/sql\n');
    console.log(setupSQL);
    console.log('\n===========================================');
    console.log('After running the SQL, the server will work!');
    console.log('===========================================\n');

    // Test connection
    const { data, error } = await supabase.from('users').select('count').limit(1);
    if (error) {
      console.log('❌ Tables not yet created. Please run the SQL above.');
      console.log('Error:', error.message);
      return false;
    }
    console.log('✅ Database tables exist!');
    return true;
  } catch (error) {
    console.error('Setup error:', error.message);
    return false;
  }
};

setupDatabase();
export default setupDatabase;
