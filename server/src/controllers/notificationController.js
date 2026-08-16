import Notification from '../models/Notification.js';

export const getNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user._id;
    const notifications = await Notification.findByUserId(userId);
    res.json({
      success: true,
      data: notifications
    });
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updated = await Notification.markAsRead(id);
    res.json({
      success: true,
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

export const markAllAsRead = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user._id;
    await Notification.markAllAsRead(userId);
    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    next(error);
  }
};

export const createNotification = async (req, res, next) => {
  try {
    const notification = await Notification.create(req.body);
    res.status(201).json({
      success: true,
      data: notification
    });
  } catch (error) {
    next(error);
  }
};
