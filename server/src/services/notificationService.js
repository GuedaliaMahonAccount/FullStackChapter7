const mongoose = require('mongoose');
const Notification = require('../models/nosql/Notification');

const createNotification = async ({ userId, title, message, type = 'general' }) => {
  console.log(`[Notification to User ${userId}] ${title}: ${message}`);

  if (mongoose.connection.readyState === 1) {
    try {
      const notification = await Notification.create({
        user_id: userId,
        title,
        message,
        type
      });
      return notification;
    } catch (error) {
      console.warn(`Warning: Failed to save notification to MongoDB: ${error.message}`);
    }
  }
  return null;
};

const getUserNotifications = async (userId) => {
  if (mongoose.connection.readyState === 1) {
    try {
      return await Notification.find({ user_id: userId }).sort({ createdAt: -1 }).limit(50);
    } catch (error) {
      console.error(`Error loading notifications: ${error.message}`);
      return [];
    }
  }
  return [];
};

const markAsRead = async (notificationId) => {
  if (mongoose.connection.readyState === 1) {
    try {
      return await Notification.findByIdAndUpdate(notificationId, { is_read: true }, { new: true });
    } catch (error) {
      console.error(`Error marking notification as read: ${error.message}`);
    }
  }
  return null;
};

module.exports = {
  createNotification,
  getUserNotifications,
  markAsRead
};
