import bcrypt from 'bcryptjs';
import supabase, { isSupabaseOnline } from '../config/supabase.js';
import { localStore } from './localStore.js';

class User {
  constructor(data) {
    this._id = data.id || data._id;
    this.id = data.id || data._id;
    this.name = data.name;
    this.email = data.email?.toLowerCase();
    this.password = data.password;
    this.role = data.role || 'patient';
    this.profileImage = data.profile_image || data.profileImage || '';
    this.phone = data.phone || '';
    this.isActive = data.is_active !== undefined ? data.is_active : true;
    this.lastLogin = data.last_login || data.lastLogin || null;
    this.googleId = data.google_id || data.googleId || null;
    this.specialization = data.specialization || '';
    this.licenseNo = data.license_no || data.licenseNo || '';
    this.bloodGroup = data.blood_group || data.bloodGroup || '';
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
    if (isSupabaseOnline()) {
      try {
        const { error } = await supabase
          .from('users')
          .update({
            name: this.name,
            profile_image: this.profileImage,
            phone: this.phone,
            is_active: this.isActive,
            last_login: this.lastLogin,
            google_id: this.googleId,
            device_fingerprints: this.deviceFingerprints,
            login_attempt_count: this.loginAttempts.count,
            locked_until: this.loginAttempts.lockedUntil,
            updated_at: new Date().toISOString(),
          })
          .eq('id', this._id);

        if (!error) return this;
      } catch {
        // Fall through
      }
    }

    const index = localStore.users.findIndex(u => u.id === this._id || u._id === this._id);
    if (index !== -1) {
      localStore.users[index] = {
        ...localStore.users[index],
        name: this.name,
        profile_image: this.profileImage,
        phone: this.phone,
        is_active: this.isActive,
        last_login: this.lastLogin,
        google_id: this.googleId,
        device_fingerprints: this.deviceFingerprints,
        login_attempt_count: this.loginAttempts.count,
        locked_until: this.loginAttempts.lockedUntil,
        updated_at: new Date().toISOString()
      };
    }
    return this;
  }

  static async findById(id) {
    if (!id) return null;
    if (isSupabaseOnline()) {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', id)
          .single();

        if (!error && data) return User._fromRow(data);
      } catch {
        // Fall through
      }
    }

    const localUser = localStore.users.find(u => u.id === id || u._id === id);
    return localUser ? User._fromRow(localUser) : null;
  }

  static async findOne(query) {
    if (isSupabaseOnline()) {
      try {
        let q = supabase.from('users').select('*');
        for (const [key, value] of Object.entries(query)) {
          const colMap = { email: 'email', role: 'role', id: 'id' };
          const col = colMap[key] || key;
          q = q.eq(col, typeof value === 'string' && col === 'email' ? value.toLowerCase() : value);
        }
        const { data, error } = await q.maybeSingle();
        if (!error && data) return User._fromRow(data);
      } catch {
        // Fall through
      }
    }

    const found = localStore.users.find(u => {
      return Object.entries(query).every(([k, v]) => {
        if (k === 'email') {
          return u.email?.toLowerCase() === String(v).toLowerCase();
        }
        if (k === 'id' || k === '_id') {
          return u.id === v || u._id === v;
        }
        return u[k] === v;
      });
    });

    return found ? User._fromRow(found) : null;
  }

  static async find(query = {}) {
    if (isSupabaseOnline()) {
      try {
        let q = supabase.from('users').select('*');
        if (query.role) q = q.eq('role', query.role);
        const { data, error } = await q;
        if (!error && data && data.length > 0) {
          return data.map(r => User._fromRow(r));
        }
      } catch {
        // Fall through
      }
    }

    let results = localStore.users;
    if (query.role) {
      results = results.filter(u => u.role === query.role);
    }
    return results.map(u => User._fromRow(u));
  }

  static async findByIdAndUpdate(id, updates) {
    if (isSupabaseOnline()) {
      try {
        const dbUpdates = {};
        if (updates.name !== undefined) dbUpdates.name = updates.name;
        if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
        dbUpdates.updated_at = new Date().toISOString();

        const { error } = await supabase.from('users').update(dbUpdates).eq('id', id);
        if (!error) return;
      } catch {
        // Fall through
      }
    }

    const index = localStore.users.findIndex(u => u.id === id || u._id === id);
    if (index !== -1) {
      localStore.users[index] = {
        ...localStore.users[index],
        ...updates,
        updated_at: new Date().toISOString()
      };
    }
  }

  select() {
    return this;
  }

  static async create(data) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(data.password, salt);
    const newId = `usr-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

    const userObj = {
      id: newId,
      _id: newId,
      name: data.name,
      email: data.email?.toLowerCase(),
      password: hashedPassword,
      role: data.role || 'patient',
      profile_image: data.profileImage || '',
      google_id: data.googleId || null,
      phone: data.phone || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (isSupabaseOnline()) {
      try {
        const { data: row, error } = await supabase
          .from('users')
          .insert({
            name: userObj.name,
            email: userObj.email,
            password: userObj.password,
            role: userObj.role,
            profile_image: userObj.profile_image,
            google_id: userObj.google_id,
          })
          .select()
          .single();

        if (!error && row) {
          return User._fromRow(row);
        }
      } catch {
        // Fall through
      }
    }

    localStore.users.push(userObj);
    return User._fromRow(userObj);
  }

  static async updatePassword(id, rawPassword) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(rawPassword, salt);

    if (isSupabaseOnline()) {
      try {
        const { error } = await supabase
          .from('users')
          .update({ password: hashedPassword, updated_at: new Date().toISOString() })
          .eq('id', id);
        if (!error) return;
      } catch {
        // Fall through
      }
    }

    const index = localStore.users.findIndex(u => u.id === id || u._id === id);
    if (index !== -1) {
      localStore.users[index].password = hashedPassword;
      localStore.users[index].updated_at = new Date().toISOString();
    }
  }

  async comparePassword(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
  }

  async updateLastLogin() {
    this.lastLogin = new Date().toISOString();
    if (isSupabaseOnline()) {
      try {
        await supabase
          .from('users')
          .update({ last_login: this.lastLogin })
          .eq('id', this._id);
      } catch {
        // Fall through
      }
    }

    const index = localStore.users.findIndex(u => u.id === this._id || u._id === this._id);
    if (index !== -1) {
      localStore.users[index].last_login = this.lastLogin;
    }
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

    if (isSupabaseOnline()) {
      try {
        await supabase
          .from('users')
          .update({ device_fingerprints: fps })
          .eq('id', this._id);
      } catch {
        // Fall through
      }
    }

    const index = localStore.users.findIndex(u => u.id === this._id || u._id === this._id);
    if (index !== -1) {
      localStore.users[index].device_fingerprints = fps;
    }
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
    if (isSupabaseOnline()) {
      try {
        await supabase
          .from('users')
          .update({ login_attempt_count: count, locked_until: lockedUntil })
          .eq('id', this._id);
      } catch {
        // Fall through
      }
    }

    const index = localStore.users.findIndex(u => u.id === this._id || u._id === this._id);
    if (index !== -1) {
      localStore.users[index].login_attempt_count = count;
      localStore.users[index].locked_until = lockedUntil;
    }
  }

  async resetLoginAttempts() {
    this.loginAttempts = { count: 0, lockedUntil: null };
    if (isSupabaseOnline()) {
      try {
        await supabase
          .from('users')
          .update({ login_attempt_count: 0, locked_until: null })
          .eq('id', this._id);
      } catch {
        // Fall through
      }
    }

    const index = localStore.users.findIndex(u => u.id === this._id || u._id === this._id);
    if (index !== -1) {
      localStore.users[index].login_attempt_count = 0;
      localStore.users[index].locked_until = null;
    }
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
      googleId: this.googleId,
      phone: this.phone,
      specialization: this.specialization,
      licenseNo: this.licenseNo,
      bloodGroup: this.bloodGroup,
      lastLogin: this.lastLogin,
      createdAt: this.createdAt,
    };
  }
}

export { User };
export default User;
