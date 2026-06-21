const express = require('express');
const http = require('http');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Connections & Utilities
const { initDatabaseConnection } = require('./config/database');
const { initializeDatabase } = require('./utils/dbInit');
const connectMongo = require('./config/mongo');
const { initSocket } = require('./config/socket');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;

// 1. Configure middlewares
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 2. Serve static upload folder for product images
const uploadsPath = path.join(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsPath));
app.use('/api/uploads', express.static(uploadsPath));
console.log(`Static file hosting active for product images at: ${uploadsPath}`);

// 3. Mount API Routes
app.use('/api', routes);

// Fallback for page not found
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `API Route not found: ${req.originalUrl}`
  });
});

// 4. Attach Global Error Handler (Must be mounted last)
app.use(errorHandler);

// 5. Bootstrap SQL + NoSQL Databases and launch server
const startServer = async () => {
  try {
    // A. Connect MySQL & MongoDB
    await initDatabaseConnection();
    await connectMongo();

    // B. Sync schemas and seed databases
    await initializeDatabase();

    // C. Initialize WebSockets (Socket.io)
    initSocket(server);

    // D. Start listening on the port
    server.listen(PORT, () => {
      console.log(`===============================================`);
      console.log(`  C2C MARKETPLACE BACKEND SERVER IS RUNNING`);
      console.log(`  Local Address: http://localhost:${PORT}`);
      console.log(`  WebSocket Server: Enabled & Listening`);
      console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`===============================================`);
    });
  } catch (error) {
    console.error('Critical boot error: server startup aborted.', error);
    process.exit(1);
  }
};

startServer();
