# Deployment & Repository Setup Guide

## 📦 Repository Structure

This project uses **TWO separate repositories**:

1. **Frontend Repository** - Your React/TypeScript app (this repo)
2. **Backend Repository** - The stock-nse-india API server

## 🚀 Setting Up Your Repositories

### Step 1: Create Frontend Repository

1. **Create a new repository on GitHub** (e.g., `pixel-perfect-clone-frontend`)

2. **Push your frontend code:**
```powershell
# In your frontend project directory
git init
git add .
git commit -m "Initial commit: Frontend application"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/pixel-perfect-clone-frontend.git
git push -u origin main
```

### Step 2: Backend Repository

The backend is already a separate repository: `https://github.com/hi-imcodeman/stock-nse-india`

**You have two options:**

#### Option A: Use the Original Repository (Recommended)
- Your friends will clone: `https://github.com/hi-imcodeman/stock-nse-india`
- No need to create your own backend repo
- Always gets the latest updates from the original maintainer

#### Option B: Fork/Create Your Own Backend Repository
If you want to customize the backend:

1. **Fork the repository** on GitHub, OR
2. **Create your own repository** and push the backend code

```powershell
# If you want to create your own backend repo
cd ../stock-nse-india
git remote set-url origin https://github.com/YOUR_USERNAME/stock-nse-india.git
git push -u origin main
```

## 👥 For Your Friends: How to Clone and Run

### Step 1: Clone Frontend Repository

```powershell
git clone https://github.com/YOUR_USERNAME/pixel-perfect-clone-frontend.git
cd pixel-perfect-clone-frontend
```

### Step 2: Setup Backend (Automatic)

**The setup script will automatically clone the backend for them:**

```powershell
# Windows
.\setup-backend.ps1

# Linux/Mac
chmod +x setup-backend.sh
./setup-backend.sh
```

This script:
- Clones `stock-nse-india` to the parent directory
- Installs dependencies
- Builds the backend

### Step 3: Start Backend Server

**Terminal 1 - Backend:**
```powershell
cd ../stock-nse-india
npm start
```

Keep this terminal running! Backend runs on `http://localhost:3000`

### Step 4: Start Frontend

**Terminal 2 - Frontend:**
```powershell
cd pixel-perfect-clone-frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:8080`

## 📁 Final Directory Structure

After cloning, your friends will have:

```
their-workspace/
├── pixel-perfect-clone-frontend/    (Cloned from your repo)
│   ├── src/
│   ├── package.json
│   ├── setup-backend.ps1
│   ├── setup-backend.sh
│   └── README.md
└── stock-nse-india/                 (Cloned automatically by setup script)
    ├── src/
    ├── package.json
    └── ...
```

## ✅ Checklist for You

- [ ] Create frontend repository on GitHub
- [ ] Push frontend code to your repository
- [ ] Update `README.md` with your repository URL
- [ ] Test the setup scripts work correctly
- [ ] Share repository link with friends

## ✅ Checklist for Your Friends

- [ ] Clone your frontend repository
- [ ] Run setup script (`setup-backend.ps1` or `setup-backend.sh`)
- [ ] Start backend server (`npm start` in stock-nse-india folder)
- [ ] Start frontend (`npm run dev` in frontend folder)
- [ ] Visit `http://localhost:8080`

## 🔧 Quick Commands Reference

**For Your Friends:**

```powershell
# 1. Clone frontend
git clone https://github.com/YOUR_USERNAME/pixel-perfect-clone-frontend.git
cd pixel-perfect-clone-frontend

# 2. Setup backend (auto-clones it)
.\setup-backend.ps1

# 3. Start backend (Terminal 1)
npm run start:backend

# 4. Start frontend (Terminal 2)
npm install
npm run dev
```

## 📝 Important Notes

1. **Backend is separate** - It's a different repository, so it needs to be cloned separately
2. **Setup script handles it** - The `setup-backend.ps1`/`setup-backend.sh` script automatically clones the backend
3. **Two terminals needed** - Backend and frontend must run in separate terminals
4. **Backend must run first** - Start backend before frontend, otherwise frontend can't fetch data

## 🆘 Troubleshooting

**"Backend not found" error?**
- Make sure you ran the setup script first
- Check that `../stock-nse-india` directory exists

**"Port 3000 already in use"?**
- Another process is using port 3000
- Kill it: `netstat -ano | findstr :3000` then `taskkill /PID <PID> /F`

**"Cannot find module" errors?**
- Run `npm install` in both frontend and backend directories

