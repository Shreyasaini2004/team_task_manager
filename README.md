# 🚀 Team Task Manager (Full-Stack MERN)

A full-stack web application that enables teams to create projects, assign tasks, and track progress with role-based access control (Admin / Member).

---

## 📌 Overview

The **Team Task Manager** provides a centralized platform for managing team workflows efficiently. It allows users to collaborate, assign responsibilities, and monitor progress in real-time.

---

## ✨ Features

### 🔐 Authentication
- User Signup & Login
- Secure authentication using JWT

### 👥 Project & Team Management
- Create and manage projects
- Add/remove team members
- Assign roles (Admin / Member)

### 📋 Task Management
- Create, update, and delete tasks
- Assign tasks to team members
- Track task status:
  - Todo
  - In Progress
  - Review
  - Done

### 📊 Dashboard
- View total projects and tasks
- Track completion percentage
- Monitor overdue tasks

### ⚠️ Role-Based Access Control
- **Admin**
  - Full access to projects, tasks, and team
- **Member**
  - Access only assigned tasks and project view

---

## 🛠️ Tech Stack

### Frontend
- React (Vite)
- Context API
- CSS

### Backend
- Node.js
- Express.js

### Database
- MongoDB

### Other Tools
- JWT Authentication
- REST APIs
- Railway (Deployment)

---

## 📂 Project Structure


team-task-manager/
│
├── client/ # Frontend (React + Vite)
├── server/ # Backend (Node + Express)
│ ├── src/
│ └── scripts/
│
├── .env.example # Environment variables template
├── package.json
├── railway.json
└── README.md


---

## ⚙️ Environment Variables

Create a `.env` file in the root directory:


MONGO_URI=your_mongodb_connection
JWT_SECRET=your_secret_key
CLIENT_URL=http://localhost:5173

PORT=5000
NODE_ENV=development


---

## 🚀 Local Setup

### 1. Clone Repository


git clone https://github.com/Shreyasaini2004/team_task_manager.git

cd team_task_manager


### 2. Install Dependencies


npm install

cd client
npm install

cd ../server
npm install


### 3. Run Application

Start backend

cd server
npm run dev

Start frontend

cd ../client
npm run dev


---

## 🌐 Deployment (Railway)

This project is deployed using **Railway**.

### Steps:
1. Push code to GitHub
2. Connect repository to Railway
3. Add environment variables:
   - MONGO_URI
   - JWT_SECRET
   - CLIENT_URL
4. Deploy backend
5. Deploy frontend (Vercel recommended)

---

## 📸 Screenshots

- Login & Signup Page  
- Dashboard with workload overview  
- Project Board (Kanban style)  
- Team Management Interface  

---

## 📌 Assignment Requirements Covered

- Authentication (Signup/Login)
- Project & Team Management
- Task Assignment & Tracking
- Dashboard with analytics
- Role-Based Access Control
- REST APIs + MongoDB
- Deployment using Railway

---

## 👩‍💻 Author

**Shreya Saini**

---

## ⭐ Future Improvements

- Real-time updates (Socket.IO)
- Notifications system
- File attachments
- Activity logs
