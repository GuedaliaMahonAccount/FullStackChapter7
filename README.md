# C2C E-commerce Geo-Marketplace

This is a comprehensive Consumer-to-Consumer (C2C) marketplace application where users can buy and sell items in their local neighborhood. The application utilizes a hybrid database architecture (MySQL for core relational transactions and MongoDB for order tracking state transitions and audit logs) and supports real-time status updates using WebSockets (Socket.io) and item geographical listing visualization using **OpenFreeMap**.

---

## 🛠️ Tech Stack

- **Frontend (Client)**: React.js (Vite), MapLibre GL (OpenFreeMap), Lucide Icons, Vanilla CSS (Glassmorphism layout design).
- **Backend (Server)**: Node.js, Express.js (MVC architecture), Sequelize ORM, Mongoose ODM, Socket.io, Multer, JWT, bcryptjs.
- **Databases**: 
  - **MySQL** (Primary): Users, Roles, Products, Categories, Orders, Order Items.
  - **MongoDB** (Secondary): Real-time Order Tracking, Notifications, Event Logs.

---

## 📋 Prerequisites

Before starting, ensure you have the following installed on your machine:
- **Node.js** (v18.0.0 or higher) and **npm**
- **MySQL Server** (listening on standard port `3306`)
- **MongoDB Server** (listening on standard port `27017`)

---

## 🚀 Getting Started

### 1. Database Setup
Make sure both MySQL and MongoDB services are running locally on your system.
*The backend application will automatically check for a database named `c2c_marketplace` and create it if it does not exist, followed by seeding roles, default category cards, and test accounts.*

### 2. Configure Environment Variables
Verify or edit environment variables in the configuration files if your database user details differ from the defaults:
- **Backend Configuration**: [server/.env](file:///c:/Users/gueda/Documents/Guedalia%20licsense/Fullstack/FullStackChapter7/server/.env)
- **Frontend Configuration**: [client/.env](file:///c:/Users/gueda/Documents/Guedalia%20licsense/Fullstack/FullStackChapter7/client/.env)

---

## 🏃‍♂️ Running the Application

You will need two terminal instances open:

### Terminal A: Backend Server
1. Navigate to the server folder:
   ```bash
   cd server
   ```
2. Install dependencies (if you haven't already):
   ```bash
   npm install
   ```
3. Run the seed script:
   ```bash
   npm run seed
   ```
4. Run the development server (powered by Nodemon):
   ```bash
   npm run dev
   ```
   *Verify console outputs confirming connection status: `Database validation check: schema "c2c_marketplace" verified/created` and `MongoDB Connected`.*

### Terminal B: Frontend Client
1. Navigate to the client folder:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Launch the development server:
   ```bash
   npm run dev
   ```
4. Click or open the local link in your browser: **`http://localhost:5173`**

---

## 🔑 Demo Login Credentials

The database initialization script automatically registers the following accounts for easy grading and walkthrough evaluations:

### 1. Buyer / Seller Client
- **Email**: `john@c2c.com`
- **Password**: `Client123!`
- **Role**: Client (can list products with geo-pins, buy other listings, and track packages in real-time).

### 2. System Administrator
- **Email**: `admin@c2c.com`
- **Password**: `Admin123!`
- **Role**: Admin (can access the Restricted Admin Dashboard to update order states and trigger live socket broadcasts to buyers).