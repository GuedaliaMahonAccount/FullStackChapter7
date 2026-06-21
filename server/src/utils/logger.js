const mongoose = require('mongoose');
const EventLog = require('../models/nosql/EventLog');

const logEvent = async ({ eventType, userId = null, details = {}, req = null }) => {
  const logData = {
    event_type: eventType,
    user_id: userId,
    details
  };

  if (req) {
    logData.ip_address = req.ip || req.headers['x-forwarded-for'] || '';
    logData.user_agent = req.headers['user-agent'] || '';
  }

  // Print to console
  console.log(`[EVENT LOG - ${eventType}]:`, JSON.stringify(details));

  // Write to MongoDB asynchronously (no await needed for request blocking)
  if (mongoose.connection.readyState === 1) {
    try {
      await EventLog.create(logData);
    } catch (error) {
      console.warn(`Warning: Failed to save event log to MongoDB: ${error.message}`);
    }
  }
};

module.exports = {
  logEvent
};
