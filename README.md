# 🛡️ DisasterShield — Disaster Management Platform

DisasterShield is a MERN stack disaster management platform designed to help communities respond to natural disasters through timely alerts, location-based warnings, shelter mapping, emergency help requests, and volunteer coordination.

## 🚨 Features

- **User Management:** User registration and login with role-based access.
- **Disaster Alerts:** View disaster-related alerts and warnings.
- **Location-Based Warnings:** Help users identify potential disaster risks in affected areas.
- **Shelter Mapping:** View available emergency shelters on a map.
- **Emergency Help Requests:** Allow users to request assistance during emergencies.
- **Volunteer Coordination:** Support volunteer registration and emergency task coordination.
- **Admin Dashboard:** Manage disaster alerts and coordinate emergency responses.

## 🛠️ Tech Stack

- **Frontend:** React, Vite, CSS
- **Backend:** Node.js, Express.js
- **Database:** MongoDB
- **Authentication:** JWT and bcrypt
- **Mapping:** Leaflet
- **API Testing:** Postman
- **Version Control:** Git and GitHub

## 📁 Project Structure

```text
DisasterShield/
├── client/       # React frontend
├── server/       # Express backend
├── postman/      # API testing resources
├── .postman/     # Postman workspace resources
└── README.md
```

## ⚙️ Getting Started

### Prerequisites

- Node.js and npm
- MongoDB connection
- Git

### 1. Clone the repository

```bash
git clone https://github.com/sandhiyasandhiya1679-ship-it/DisasterShield-.git
cd DisasterShield-
```

### 2. Set up the backend

```bash
cd server
npm install
```

Create a `.env` file in the `server` folder and configure the environment variables required by the application, such as your MongoDB connection string and JWT secret.

**Never commit your `.env` file or expose your credentials.**

Start the backend:

```bash
node server.js
```

### 3. Set up the frontend

Open a separate terminal:

```bash
cd client
npm install
npm run dev
```

Open the local URL displayed by Vite in your browser.

## 🔐 Security

- Password hashing with bcrypt.
- Token-based authentication using JWT.
- Role-based access for users and administrators.
- Environment variables for sensitive configuration.

## 🎯 Project Goal

To improve disaster preparedness and emergency response by connecting affected people, administrators, and volunteers through a centralized platform.

## 👩‍💻 Author

**Sandhiya**

GitHub: [sandhiyasandhiya1679-ship-it](https://github.com/sandhiyasandhiya1679-ship-it)

---

*DisasterShield — Connecting communities, coordinating help, and supporting safer disaster response.*
