const { initDatabaseConnection, sequelize } = require('../config/database');
const connectMongo = require('../config/mongo');
const OrderTracking = require('../models/nosql/OrderTracking');
const Notification = require('../models/nosql/Notification');
const EventLog = require('../models/nosql/EventLog');
const mongoose = require('mongoose');
const { seedDatabase } = require('../utils/dbInit');

const run = async () => {
  try {
    console.log('==================================================');
    console.log('  STARTING STANDALONE DATABASE SEED SCRIPT');
    console.log('==================================================');

    // 1. Connect to both databases
    await initDatabaseConnection();
    await connectMongo();

    // 2. Update SQL Database
    console.log('Updating existing SQL tables (alter sync)...');
    await sequelize.sync({ alter: true });
    console.log('✔ SQL tables synchronized.');

    // 3. Wipe NoSQL Database
    console.log('Wiping existing NoSQL collections...');
    await OrderTracking.deleteMany({});
    await Notification.deleteMany({});
    await EventLog.deleteMany({});
    console.log('✔ NoSQL collections cleared.');

    // 4. Run the seed function
    await seedDatabase();

    console.log('==================================================');
    console.log('  STANDALONE DATABASE SEED COMPLETED SUCCESSFULLY');
    console.log('==================================================');

    // Close connections
    await mongoose.disconnect();
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('CRITICAL: Standalone seed script failed:', error);
    process.exit(1);
  }
};

run();
