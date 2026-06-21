const mongoose = require('mongoose');

const EventLogSchema = new mongoose.Schema({
  event_type: {
    type: String, // 'USER_REGISTER', 'PRODUCT_CREATED', 'ORDER_PLACED', 'ORDER_STATUS_CHANGE', etc.
    required: true,
    index: true
  },
  user_id: {
    type: Number, // Reference to MySQL user ID (nullable if guest/anonymous action)
    index: true
  },
  details: {
    type: mongoose.Schema.Types.Mixed // Arbitrary additional details
  },
  ip_address: { type: String, default: '' },
  user_agent: { type: String, default: '' }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false },
  collection: 'event_logs'
});

module.exports = mongoose.model('EventLog', EventLogSchema);
// Exclude updates to events since logs are read-only write-once data
