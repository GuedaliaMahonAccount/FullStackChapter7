const { Sequelize } = require('sequelize');
const mysql = require('mysql2/promise');
require('dotenv').config();

const host = process.env.DB_HOST || 'localhost';
const port = process.env.DB_PORT || 3306;
const user = process.env.DB_USER || 'root';
const password = process.env.DB_PASSWORD || '';
const databaseName = process.env.DB_NAME || 'c2c_marketplace';

let sequelize;

const initDatabaseConnection = async () => {
  try {
    // 1. Ensure the MySQL database exists before establishing Sequelize connection
    const connection = await mysql.createConnection({
      host,
      port,
      user,
      password
    });
    
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${databaseName}\`;`);
    await connection.end();
    
    console.log(`Database validation check: schema "${databaseName}" verified/created.`);
  } catch (error) {
    console.warn(`WARNING: Pre-database check failed: ${error.message}. Attempting direct Sequelize connection...`);
  }
};

// Create Sequelize instance
sequelize = new Sequelize(databaseName, user, password, {
  host,
  port,
  dialect: 'mysql',
  logging: false, // Set to console.log if debugging SQL queries
  define: {
    underscored: true, // Auto-convert camelCase JS to snake_case MySQL columns
    timestamps: true  // Auto-manage created_at and updated_at
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

module.exports = {
  sequelize,
  initDatabaseConnection
};
