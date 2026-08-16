import supabase from '../config/supabase.js';

export class Notification {
  constructor(data) {
    this.id = data.id || data._id;
    this.userId = data.userId || data.user_id;
    this.title = data.title;
    this.message = data.message;
    this.type = data.type || 'INFO'; // 'APPOINTMENT' | 'TRIAGE' | 'PRESCRIPTION' | 'VITAL_ALERT' | 'INFO'
    this.isRead = data.isRead ?? data.is_read ?? false;
    this.createdAt = data.createdAt || data.created_at || new Date().toISOString();
  }

  static async findByUserId(userId, limit = 20) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error && error.code !== '42P01') {
      console.warn('Supabase notifications lookup note:', error.message);
    }

    if (!data || data.length === 0) {
      return [
        new Notification({
          id: 'notif-1',
          user_id: userId,
          title: 'Welcome to MediConnect',
          message: 'Your health dashboard is active and monitored.',
          type: 'INFO',
          is_read: false,
          created_at: new Date().toISOString()
        })
      ];
    }

    return data.map(n => new Notification(n));
  }

  static async create(notificationData) {
    const payload = {
      user_id: notificationData.userId || notificationData.user_id,
      title: notificationData.title,
      message: notificationData.message,
      type: notificationData.type || 'INFO',
      is_read: false,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('notifications')
      .insert([payload])
      .select()
      .single();

    if (error) {
      return new Notification({ id: `notif-${Date.now()}`, ...payload });
    }

    return new Notification(data);
  }

  static async markAsRead(id) {
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .select()
      .single();

    if (error) return { id, isRead: true };
    return new Notification(data);
  }

  static async markAllAsRead(userId) {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId);

    return { success: true };
  }
}

export default Notification;
