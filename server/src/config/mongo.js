const mongoose = require('mongoose');
require('dotenv').config();

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/c2c_marketplace';

const connectMongo = async () => {
  try {
    const conn = await mongoose.connect(mongoUri);
    console.log(`MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    // Do not crash the application if MongoDB is down, since it is a bonus database
    console.warn('Proceeding without NoSQL features. Real-time updates might run in memory fallback mode.');
  }
};

module.exports = connectMongo;
