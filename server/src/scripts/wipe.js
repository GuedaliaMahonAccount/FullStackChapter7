const { initDatabaseConnection, sequelize } = require('../config/database');
const connectMongo = require('../config/mongo');
const OrderTracking = require('../models/nosql/OrderTracking');
const Notification = require('../models/nosql/Notification');
const EventLog = require('../models/nosql/EventLog');
const mongoose = require('mongoose');

const run = async () => {
  try {
    console.log('==================================================');
    console.log('  STARTING DATABASE WIPE SCRIPT');
    console.log('==================================================');

    // 1. Connect to both databases
    await initDatabaseConnection();
    await connectMongo();

    // 2. Wipe SQL Database
    console.log('Wiping and recreating SQL tables (force sync)...');
    await sequelize.sync({ force: true });
    console.log('✔ SQL tables cleared.');

    // 3. Wipe NoSQL Database
    console.log('Wiping existing NoSQL collections...');
    await OrderTracking.deleteMany({});
    await Notification.deleteMany({});
    await EventLog.deleteMany({});
    console.log('✔ NoSQL collections cleared.');

    console.log('==================================================');
    console.log('  DATABASE WIPE COMPLETED SUCCESSFULLY');
    console.log('==================================================');

    // Close connections
    await mongoose.disconnect();
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('CRITICAL: Database wipe script failed:', error);
    process.exit(1);
  }
};

run();
