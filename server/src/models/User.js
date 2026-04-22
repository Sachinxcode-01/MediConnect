import bcrypt from 'bcryptjs';
import supabase from '../config/supabase.js';

class User {
  constructor(data) {
    this._id = data.id || data._id;
    this.id = data.id || data._id;
    this.name = data.name;
    this.email = data.email;
    this.password = data.password;
    this.role = data.role || 'patient';
    this.profileImage = data.profile_image || data.profileImage || '';
    this.phone = data.phone || '';
    this.isActive = data.is_active !== undefined ? data.is_active : true;
    this.lastLogin = data.last_login || data.lastLogin || null;
    this.deviceFingerprints = data.device_fingerprints || data.deviceFingerprints || [];
    this.loginAttempts = {
      count: data.login_attempt_count || 0,
      lockedUntil: data.locked_until || null,
    };
    this.medicalRecords = [];
    this.triageEntries = [];
    this.appointments = [];
    this.createdAt = data.created_at || new Date();
    this.updatedAt = data.updated_at || new Date();
  }

  static _fromRow(row) {
    if (!row) return null;
    return new User(row);
  }

  async save() {
    const { error } = await supabase
      .from('users')
      .update({
        name: this.name,
        profile_image: this.profileImage,
        phone: this.phone,
        is_active: this.isActive,
        last_login: this.lastLogin,
        device_fingerprints: this.deviceFingerprints,
        login_attempt_count: this.loginAttempts.count,
        locked_until: this.loginAttempts.lockedUntil,
        updated_at: new Date().toISOString(),
      })
      .eq('id', this._id);

    if (error) throw error;
    return this;
  }

  static async findById(id) {
    if (!id) return null;
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return User._fromRow(data);
  }

  static async findOne(query) {
    let q = supabase.from('users').select('*');
    for (const [key, value] of Object.entries(query)) {
      // Map JS-style keys to DB column names
      const colMap = { email: 'email', role: 'role', id: 'id' };
      const col = colMap[key] || key;
      q = q.eq(col, value);
    }
    const { data, error } = await q.maybeSingle();
    if (error || !data) return null;
    return User._fromRow(data);
  }

  static async findByIdAndUpdate(id, updates) {
    const dbUpdates = {};
    if (updates.$push?.medicalRecords) return; // handled by records themselves
    if (updates.$push?.triageEntries) return;
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
    dbUpdates.updated_at = new Date().toISOString();

    const { error } = await supabase.from('users').update(dbUpdates).eq('id', id);
    if (error) throw error;
  }

  /** Used with `.select('+password')` pattern — returns the full user with password */
  select(fields) {
    // For Supabase, we always fetch password if needed via a separate query
    return this;
  }

  static async create(data) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(data.password, salt);

    const { data: row, error } = await supabase
      .from('users')
      .insert({
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: data.role || 'patient',
        profile_image: '',
      })
      .select()
      .single();

    if (error) throw error;
    return User._fromRow(row);
  }

  async comparePassword(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
  }

  async updateLastLogin() {
    this.lastLogin = new Date().toISOString();
    const { error } = await supabase
      .from('users')
      .update({ last_login: this.lastLogin })
      .eq('id', this._id);
    if (error) throw error;
  }

  async addDeviceFingerprint(fingerprint) {
    const fps = Array.isArray(this.deviceFingerprints) ? this.deviceFingerprints : [];
    const existing = fps.find(d => d.fingerprint === fingerprint);
    if (existing) {
      existing.lastUsed = new Date().toISOString();
    } else {
      fps.push({ fingerprint, lastUsed: new Date().toISOString(), createdAt: new Date().toISOString() });
    }
    this.deviceFingerprints = fps;
    const { error } = await supabase
      .from('users')
      .update({ device_fingerprints: fps })
      .eq('id', this._id);
    if (error) throw error;
  }

  async handleFailedLogin() {
    const lockoutDuration = 15 * 60 * 1000;
    let count = (this.loginAttempts.count || 0) + 1;
    let lockedUntil = null;

    if (count >= 5) {
      lockedUntil = new Date(Date.now() + lockoutDuration).toISOString();
      count = 0;
    }

    this.loginAttempts = { count, lockedUntil };
    const { error } = await supabase
      .from('users')
      .update({ login_attempt_count: count, locked_until: lockedUntil })
      .eq('id', this._id);
    if (error) throw error;
  }

  async resetLoginAttempts() {
    this.loginAttempts = { count: 0, lockedUntil: null };
    const { error } = await supabase
      .from('users')
      .update({ login_attempt_count: 0, locked_until: null })
      .eq('id', this._id);
    if (error) throw error;
  }

  isLocked() {
    if (!this.loginAttempts?.lockedUntil) return false;
    return new Date() < new Date(this.loginAttempts.lockedUntil);
  }

  toJSON() {
    return {
      _id: this._id,
      id: this._id,
      name: this.name,
      email: this.email,
      role: this.role,
      profileImage: this.profileImage,
      phone: this.phone,
      lastLogin: this.lastLogin,
      createdAt: this.createdAt,
    };
  }
}

export { User };
export default User;
