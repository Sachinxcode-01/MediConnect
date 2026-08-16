import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, Sparkles, Activity, FileText, HeartPulse, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axios';
import { io } from 'socket.io-client';

const NotificationCenter = () => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const socketRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/api/notifications');
      setNotifications(res.data?.data || res.data || []);
    } catch {
      // Fallback empty
    }
  };

  useEffect(() => {
    fetchNotifications();

    socketRef.current = io(import.meta.env.VITE_API_URL || 'http://localhost:5000');
    socketRef.current.on('notification:new', (newNotif) => {
      setNotifications(prev => [newNotif, ...prev]);
    });

    return () => socketRef.current?.disconnect();
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead && !n.is_read).length;

  const handleMarkAsRead = async (id) => {
    try {
      await api.put(`/api/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => (n.id === id || n._id === id) ? { ...n, isRead: true, is_read: true } : n));
    } catch {
      // Ignore
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put('/api/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true, is_read: true })));
    } catch {
      // Ignore
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'APPOINTMENT': return <Activity className="text-blue-400 w-4 h-4" />;
      case 'TRIAGE': return <Sparkles className="text-amber-400 w-4 h-4" />;
      case 'PRESCRIPTION': return <FileText className="text-purple-400 w-4 h-4" />;
      case 'VITAL_ALERT': return <HeartPulse className="text-red-400 w-4 h-4" />;
      default: return <Bell className="text-emerald-400 w-4 h-4" />;
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-3 rounded-2xl bg-white/80 border border-themeMedium/30 hover:border-themePrimary transition-all flex items-center justify-center text-themeDeep shadow-sm"
      >
        <Bell className="w-5 h-5 text-themeDark" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white font-black text-[10px] flex items-center justify-center animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-3xl border border-themeMedium/30 shadow-2xl z-50 overflow-hidden"
          >
            <div className="p-4 border-b border-themeMedium/20 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-themePrimary" />
                <h4 className="font-black text-themeDeep text-sm">Notifications</h4>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-themePrimary/10 text-themePrimary text-[10px] font-black">
                    {unreadCount} New
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button onClick={handleMarkAllRead} className="text-[10px] font-bold text-themePrimary hover:underline">
                    Mark All Read
                  </button>
                )}
                <button onClick={() => setIsOpen(false)} className="text-themeDark/40 hover:text-themeDark">
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-themeMedium/10">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-xs font-bold text-themeDark/40 italic">
                  No notifications yet
                </div>
              ) : (
                notifications.map((n) => {
                  const id = n.id || n._id;
                  const isRead = n.isRead || n.is_read;
                  return (
                    <div
                      key={id}
                      onClick={() => !isRead && handleMarkAsRead(id)}
                      className={`p-4 flex items-start gap-3 hover:bg-themeSoft/20 transition-colors cursor-pointer ${!isRead ? 'bg-themeSoft/30' : ''}`}
                    >
                      <div className="p-2 rounded-xl bg-white border border-themeMedium/20 shrink-0">
                        {getIcon(n.type)}
                      </div>
                      <div className="flex-1 space-y-1">
                        <h5 className="font-black text-themeDeep text-xs">{n.title}</h5>
                        <p className="text-[11px] font-medium text-themeDark/70 leading-tight">{n.message}</p>
                        <p className="text-[9px] font-bold text-themeDark/40 uppercase">
                          {n.createdAt ? new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                        </p>
                      </div>
                      {!isRead && (
                        <div className="w-2 h-2 rounded-full bg-themePrimary shrink-0 mt-1" />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationCenter;
