import supabase from '../config/supabase.js';
import crypto from 'crypto';

class EmailOTP {
  constructor(data) {
    this._id = data.id;
    this.email = data.email;
    this.otp = data.otp;
    this.purpose = data.purpose;
    this.expiresAt = data.expires_at || data.expiresAt;
    this.userId = data.user_id || data.userId;
    this.verified = data.verified || false;
    this.createdAt = data.created_at || new Date();
  }

  static async generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  static async createOTP({ email, purpose, userId, expiresInMinutes = 10 }) {
    // Delete any existing unverified OTPs for this email and purpose
    await supabase
      .from('email_otps')
      .delete()
      .eq('email', email)
      .eq('purpose', purpose)
      .eq('verified', false);

    const otp = await EmailOTP.generateOTP();
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('email_otps')
      .insert({ email, otp, purpose, user_id: userId, expires_at: expiresAt, verified: false })
      .select()
      .single();

    if (error) throw error;
    return { otp, otpDoc: new EmailOTP(data) };
  }

  static async verifyOTP({ email, otp, purpose }) {
    const { data, error } = await supabase
      .from('email_otps')
      .select('*')
      .eq('email', email)
      .eq('otp', otp)
      .eq('purpose', purpose)
      .eq('verified', false)
      .maybeSingle();

    if (error || !data) {
      return { valid: false, message: 'Invalid OTP' };
    }

    if (new Date(data.expires_at) < new Date()) {
      await supabase.from('email_otps').delete().eq('id', data.id);
      return { valid: false, message: 'OTP expired. Please request a new one.' };
    }

    // Mark as verified
    await supabase.from('email_otps').update({ verified: true }).eq('id', data.id);

    return { valid: true, userId: data.user_id };
  }
}

export { EmailOTP };
export default EmailOTP;
