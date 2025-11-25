# 🚀 How to Start Server and Frontend

Complete guide to start both the backend API server and frontend application.

---

## 📋 Prerequisites

Before starting, ensure you have:

- **Node.js** (version 18 or higher)
- **npm** (comes with Node.js)
- **Git** (for cloning repositories)

Check your versions:
```bash
node --version  # Should be v18.x or higher
npm --version   # Should be 8.x or higher
```

---

## 🗂️ Project Structure

```
parent-directory/
├── pixel-perfect-clone-4392/    # Frontend (this project)
└── stock-nse-india/              # Backend API (separate repository)
```

---

## 🔧 Step 1: Setup Backend API (One-Time Setup)

### Option A: Automated Setup (Recommended)

**Windows (PowerShell):**
```powershell
.\setup-backend.ps1
```

**Linux/Mac (Bash/Zsh):**
```bash
chmod +x setup-backend.sh
./setup-backend.sh
```

### Option B: Manual Setup

1. **Navigate to parent directory:**
   ```bash
   cd ..
   ```

2. **Clone the backend repository:**
   ```bash
   git clone https://github.com/hi-imcodeman/stock-nse-india.git
   cd stock-nse-india
   ```

3. **Install dependencies:**
   ```bash
   npm install
   ```

4. **Install cross-env (for Windows compatibility):**
   ```bash
   npm install --save-dev cross-env
   ```

5. **Build the backend:**
   ```bash
   npm run build
   ```

6. **Return to frontend directory:**
   ```bash
   cd ../pixel-perfect-clone-4392
   ```

---

## 🖥️ Step 2: Start Backend Server

### Terminal 1: Start Backend API

**Option A: Using npm script (from frontend directory):**
```bash
npm run start:backend
```

**Option B: Manual start (from backend directory):**
```bash
cd ../stock-nse-india
npm start
```

**Option C: Development mode (with hot reload):**
```bash
cd ../stock-nse-india
npm run start:dev
```

### ✅ Verify Backend is Running

- **API Server URL:** `http://localhost:3000`
- **API Documentation:** `http://localhost:3000/api-docs`
- **Health Check:** Open `http://localhost:3000` in browser

You should see the API is running. **Keep this terminal open!**

### 🛑 Stop Backend (if needed)

If port 3000 is already in use:
```bash
npm run stop:backend
```

Or manually:
```bash
# Find and kill process on port 3000
lsof -ti:3000 | xargs kill -9  # Mac/Linux
# OR
netstat -ano | findstr :3000   # Windows (then kill PID)
```

---

## 🎨 Step 3: Setup Frontend

### Install Frontend Dependencies

From the **pixel-perfect-clone-4392** directory:

```bash
npm install
```

This installs all required packages (React, TypeScript, Tailwind CSS, etc.).

### Configure Environment (Optional)

Create a `.env` file in the project root:

```env
VITE_API_BASE_URL=http://localhost:3000
```

**Note:** If not set, the app defaults to `http://localhost:3000`.

---

## 🚀 Step 4: Start Frontend

### Terminal 2: Start Frontend Development Server

```bash
npm run dev
```

### ✅ Verify Frontend is Running

- **Frontend URL:** `http://localhost:8080` (or the port shown in terminal)
- Open this URL in your browser to see the application

**Keep this terminal open too!**

---

## 📊 Complete Setup Summary

### Two Terminal Windows Required:

**Terminal 1 - Backend:**
```bash
cd ../stock-nse-india
npm start
# Server running on http://localhost:3000
```

**Terminal 2 - Frontend:**
```bash
cd pixel-perfect-clone-4392
npm run dev
# Frontend running on http://localhost:8080
```

### Quick Start Commands (from frontend directory):

```bash
# Start backend in background
npm run start:backend

# In another terminal, start frontend
npm run dev
```

---

## 🔍 Verification Checklist

- [ ] Backend API is running on `http://localhost:3000`
- [ ] Frontend is running on `http://localhost:8080`
- [ ] Browser opens the application successfully
- [ ] No CORS errors in browser console
- [ ] Stock data loads correctly

---

## 🐛 Troubleshooting

### Problem: Port 3000 Already in Use

**Solution:**
```bash
npm run stop:backend
# Then start backend again
npm run start:backend
```

### Problem: CORS Errors

**Solution:**
- Ensure backend is running before starting frontend
- Check backend CORS configuration allows `http://localhost:8080`
- Verify `VITE_API_BASE_URL` in `.env` matches backend URL

### Problem: "Cannot find module" Errors

**Solution:**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Problem: Backend API Returns 400/500 Errors

**Solution:**
- This is **expected** when backend doesn't have data for certain stocks
- The app handles these gracefully
- Check backend logs for actual errors

### Problem: Frontend Shows "Failed to fetch"

**Solution:**
1. Verify backend is running: `curl http://localhost:3000`
2. Check backend logs for errors
3. Ensure no firewall blocking port 3000

### Problem: Yarn Not Found (Backend Setup)

**Solution:**
```bash
# Install Yarn globally
npm install -g yarn

# Or skip Yarn and use npm directly
cd ../stock-nse-india
npm install
npm run build
npm start
```

---

## 📝 Available npm Scripts

### Frontend Scripts (from `pixel-perfect-clone-4392`):

```bash
npm run dev              # Start development server
npm run build            # Build for production
npm run build:dev        # Build in development mode
npm run preview          # Preview production build
npm run lint             # Run ESLint
npm run start:backend    # Start backend API server
npm run start:backend:dev # Start backend in dev mode
npm run stop:backend     # Stop backend server
```

### Backend Scripts (from `stock-nse-india`):

```bash
npm start                # Start production server
npm run start:dev        # Start development server (with hot reload)
npm run build            # Build backend
npm test                 # Run tests
```

---

## 🌐 URLs Reference

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | `http://localhost:8080` | Main application |
| Backend API | `http://localhost:3000` | API server |
| API Docs | `http://localhost:3000/api-docs` | API documentation |

---

## 📦 Production Build

### Build Frontend for Production:

```bash
npm run build
```

Output will be in `dist/` directory.

### Preview Production Build:

```bash
npm run preview
```

---

## 🔄 Development Workflow

1. **Start Backend** (Terminal 1)
   ```bash
   npm run start:backend
   ```

2. **Start Frontend** (Terminal 2)
   ```bash
   npm run dev
   ```

3. **Make Changes**
   - Edit files in `src/`
   - Frontend auto-reloads on save
   - Backend may need restart for changes (unless using `start:dev`)

4. **View Changes**
   - Open `http://localhost:8080` in browser
   - Check browser console for errors

---

## 📚 Additional Resources

- **API Documentation:** `http://localhost:3000/api-docs`
- **Backend Repository:** `https://github.com/hi-imcodeman/stock-nse-india`
- **Frontend Code:** `src/` directory
- **Configuration:** `vite.config.ts`, `tailwind.config.ts`

---

## ✅ Success Indicators

When everything is working correctly:

- ✅ Backend terminal shows: "Server running on port 3000"
- ✅ Frontend terminal shows: "Local: http://localhost:8080"
- ✅ Browser loads the application without errors
- ✅ Stock data appears in the UI
- ✅ No red errors in browser console (warnings are OK)

---

## 🆘 Need Help?

1. Check backend logs in Terminal 1
2. Check frontend logs in Terminal 2
3. Check browser console (F12) for errors
4. Verify both servers are running on correct ports
5. Ensure all dependencies are installed

---

**Last Updated:** 2025-01-XX  
**Project:** Groww DSFM - Pixel Perfect Clone

