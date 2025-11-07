# Quick Start Guide

## For New Users / Friends Cloning This Repo

This project requires a backend API to be running. The backend is in a **separate repository** and will be automatically cloned by the setup script.

**Repository Structure:**
- **Frontend:** This repository (cloned by you)
- **Backend:** `stock-nse-india` (cloned automatically by setup script)

Follow these steps:

### 🚀 Quick Setup (3 Steps)

#### 1. Setup Backend API (One-time)

**Windows:**
```powershell
.\setup-backend.ps1
```

**Linux/Mac:**
```bash
chmod +x setup-backend.sh
./setup-backend.sh
```

This will automatically:
- Clone the `stock-nse-india` backend repository
- Install all dependencies
- Build the backend

#### 2. Start Backend Server

Open a terminal and run:
```powershell
# Windows
npm run start:backend

# Or manually:
cd ../stock-nse-india
npm start
```

Keep this terminal running! The backend must be running for the frontend to work.

#### 3. Start Frontend

Open a **new terminal** and run:
```powershell
# Install frontend dependencies (first time only)
npm install

# Start the frontend
npm run dev
```

Visit `http://localhost:8080` in your browser! 🎉

---

## Troubleshooting

### Backend not starting?
- Make sure port 3000 is not in use: `netstat -ano | findstr :3000` (Windows)
- Kill the process if needed: `taskkill /PID <PID> /F`

### Frontend can't connect to backend?
- Make sure backend is running on `http://localhost:3000`
- Check `http://localhost:3000/api-docs` to verify backend is up

### Setup script fails?
- Make sure you have Git installed
- Make sure you have Node.js 18+ installed
- Run the manual setup steps from README.md

---

## Project Structure

```
your-workspace/
├── pixel-perfect-clone-4392/  (Frontend - this repo)
│   ├── src/
│   ├── package.json
│   └── ...
└── stock-nse-india/            (Backend - cloned by setup script)
    ├── src/
    ├── package.json
    └── ...
```

The backend is in a **separate folder** because it's a different repository. The setup script handles this automatically!

