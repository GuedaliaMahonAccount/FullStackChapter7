const mongoose = require('mongoose');

const StatusHistorySchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['Pending', 'Ready', 'Shipped', 'Collected', 'Cancelled'],
    required: true
  },
  changed_at: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String,
    default: ''
  }
});

const OrderTrackingSchema = new mongoose.Schema({
  order_id: {
    type: String, // Maps to MySQL Order ID
    required: true,
    unique: true,
    index: true
  },
  current_status: {
    type: String,
    enum: ['Pending', 'Ready', 'Shipped', 'Collected', 'Cancelled'],
    default: 'Pending',
    required: true
  },
  carrier_details: {
    carrier_name: { type: String, default: '' },
    tracking_number: { type: String, default: '' }
  },
  status_history: [StatusHistorySchema]
}, {
  timestamps: true,
  collection: 'order_trackings'
});

module.exports = mongoose.model('OrderTracking', OrderTrackingSchema);
