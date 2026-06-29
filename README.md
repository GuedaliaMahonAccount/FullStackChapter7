# C2C E-commerce Geo-Marketplace

This is a comprehensive Consumer-to-Consumer (C2C) marketplace application where users can buy and sell items in their local neighborhood. The application utilizes a hybrid database architecture (MySQL for core relational transactions and MongoDB for order tracking state transitions and audit logs) and supports real-time status updates using WebSockets (Socket.io) and item geographical listing visualization using **OpenFreeMap**.

> [!IMPORTANT]
> ### 🔑 Quick Demo Login Credentials (for Grading/Testing)
> 
> | Role | Email | Password | Privileges / Features |
> | :--- | :--- | :--- | :--- |
> | **System Administrator** | `admin@c2c.com` | `Admin123!` | Access Admin Portal, View MongoDB Event Logs, Block/Unblock Users, Update Order Status |
> | **Client (Buyer/Seller)** | `john@c2c.com` | `Client123!` | Browse/filter items on map, place orders, view tracking, list/edit products, get AI description suggestions |
> | **Alternative Client** | `jane@c2c.com` | `Client123!` | Additional buyer/seller mock account for testing trades |

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

---

## 🔌 External API Integrations (Zero Configuration)

To make it as easy as possible for instructors to evaluate the project, all external APIs were chosen to run **without any API keys or configuration settings**:

1. **Photon Geocoding API (`https://photon.komoot.io/`)**:
   - **Purpose:** Powers real-time address autocomplete dropdowns when sellers place listing pins and when buyers enter delivery details on checkout.
   - **Features:** Instantly queries OSM location directories.

2. **OSRM Routing Engine (`http://router.project-osrm.org/`)**:
   - **Purpose:** Calculates real-time road driving distances and travel times between the buyer's current GPS position and the product's location.
   - **Resilience:** Wrapped in a 2-second `AbortController` timeout falling back seamlessly to offline Haversine straight-line math if the server is slow or rate-limited.

3. **Open-Meteo Weather Forecast (`https://api.open-meteo.com/`)**:
   - **Purpose:** Queries coordinates-based current temperature and weather conditions to display dynamic pickup advice (e.g., rain and temperature alerts).

4. **MyMemory Translation Service (`https://api.mymemory.translated.net/`)**:
   - **Purpose:** Handles translation of product details and descriptions from English to Hebrew dynamically inside the buyer's product details page.

5. **Frankfurter Exchange Rates (`https://api.frankfurter.app/`)**:
   - **Purpose:** Fetches current ILS exchange rates to convert and display foreign-currency item listings in local Israeli currency (ILS).