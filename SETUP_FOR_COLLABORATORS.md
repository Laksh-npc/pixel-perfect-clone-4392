# Setup Guide for Collaborators

## 🎯 Quick Overview

This project has **TWO repositories**:
1. **Frontend** - This repository (React app)
2. **Backend** - `stock-nse-india` (API server) - separate repository

You need to clone the frontend, and the setup script will automatically clone the backend for you.

---

## 📥 Step-by-Step Setup

### Step 1: Clone Frontend Repository

```powershell
git clone https://github.com/YOUR_FRIEND_USERNAME/pixel-perfect-clone-frontend.git
cd pixel-perfect-clone-frontend
```

### Step 2: Run Setup Script (Auto-clones Backend)

**Windows:**
```powershell
.\setup-backend.ps1
```

**Linux/Mac:**
```bash
chmod +x setup-backend.sh
./setup-backend.sh
```

**What this does:**
- ✅ Clones the `stock-nse-india` backend repository to `../stock-nse-india`
- ✅ Installs all backend dependencies
- ✅ Builds the backend

### Step 3: Install Frontend Dependencies

```powershell
npm install
```

### Step 4: Start Backend Server

**Open Terminal 1:**
```powershell
cd ../stock-nse-india
npm start
```

✅ Backend is now running on `http://localhost:3000`
✅ Keep this terminal open!

### Step 5: Start Frontend

**Open Terminal 2 (new terminal):**
```powershell
cd pixel-perfect-clone-frontend
npm run dev
```

✅ Frontend is now running on `http://localhost:8080`

### Step 6: Open in Browser

Visit: **http://localhost:8080** 🎉

---

## 📁 What Gets Created

After setup, your directory structure will be:

```
your-workspace/
├── pixel-perfect-clone-frontend/    ← You cloned this
│   ├── src/
│   ├── package.json
│   └── ...
└── stock-nse-india/                 ← Setup script cloned this
    ├── src/
    ├── package.json
    └── ...
```

---

## 🔄 Daily Workflow

**Every time you want to work on the project:**

1. **Start Backend** (Terminal 1):
   ```powershell
   cd ../stock-nse-india
   npm start
   ```

2. **Start Frontend** (Terminal 2):
   ```powershell
   cd pixel-perfect-clone-frontend
   npm run dev
   ```

3. **Open browser:** `http://localhost:8080`

---

## ⚠️ Important Notes

- **Backend must run first** - Start backend before frontend
- **Two terminals needed** - Backend and frontend run separately
- **Keep backend running** - Don't close the backend terminal while developing
- **Backend is separate repo** - It's cloned automatically, you don't need to clone it manually

---

## 🆘 Troubleshooting

### Backend not starting?
```powershell
# Check if port 3000 is in use
netstat -ano | findstr :3000

# Kill the process if needed
taskkill /PID <PID> /F
```

### Frontend can't connect?
- Make sure backend is running on `http://localhost:3000`
- Check: `http://localhost:3000/api-docs` should show API docs

### Setup script fails?
- Make sure you have Git installed
- Make sure you have Node.js 18+ installed
- Check your internet connection

---

## 📚 Need More Help?

- See [README.md](./README.md) for detailed documentation
- See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for repository structure

