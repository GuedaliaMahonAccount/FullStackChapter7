const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  user_id: {
    type: String, // Reference to MySQL user ID
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['order_status', 'new_listing', 'payment_alert', 'general'],
    default: 'general'
  },
  is_read: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  collection: 'notifications'
});

module.exports = mongoose.model('Notification', NotificationSchema);
