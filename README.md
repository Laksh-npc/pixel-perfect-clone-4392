# Pixel Perfect Clone

A modern stock market dashboard built with React, TypeScript, and Tailwind CSS, fetching real-time data from NSE India.

## 🚀 Quick Start

**New to this project?** 
- 👥 **For Collaborators:** See [SETUP_FOR_COLLABORATORS.md](./SETUP_FOR_COLLABORATORS.md)
- 📖 **Quick Reference:** See [QUICK_START.md](./QUICK_START.md)
- 🚀 **Deployment Guide:** See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Git

### Basic Setup

1. **Clone this repository**
```sh
git clone https://github.com/YOUR_USERNAME/pixel-perfect-clone-4392.git
cd pixel-perfect-clone-4392
```

**Note:** Replace `YOUR_USERNAME` with your actual GitHub username.

2. **Setup Backend API** (Required - one-time setup)

**Windows (PowerShell):**
```powershell
.\setup-backend.ps1
```

**Linux/Mac (Bash/Zsh):**
```bash
chmod +x setup-backend.sh && ./setup-backend.sh
```

3. **Install frontend dependencies**
```sh
npm install
```

4. **Start Backend** (in one terminal)
```sh
npm run start:backend
# Or: cd ../stock-nse-india && npm start
```

**Note:** If you get an error that port 3000 is already in use, stop the existing backend:
```sh
npm run stop:backend
```

5. **Start Frontend** (in another terminal)
```sh
npm run dev
```

Visit `http://localhost:8080` to see the app!

## API integration

This project fetches live NSE data from the `stock-nse-india` API server.

**⚠️ Important:** The backend API (`stock-nse-india`) is a separate repository. You need to set it up before running the frontend.

### Step 1: Setup Backend API (One-time setup)

**Quick Setup (Recommended):**

**Windows (PowerShell):**
```powershell
.\setup-backend.ps1
```

**Linux/Mac (Bash):**
```bash
chmod +x setup-backend.sh
./setup-backend.sh
```

**Manual Setup:**

```powershell
# Clone the backend repository (in parent directory)
cd ..
git clone https://github.com/hi-imcodeman/stock-nse-india.git
cd stock-nse-india

# Install dependencies
npm install

# Install cross-env for Windows compatibility
npm install --save-dev cross-env

# Build the backend
npm run build

# Go back to frontend directory
cd ../pixel-perfect-clone-4392
```

### Step 2: Start the API Server

**Start the backend in a separate terminal:**

```powershell
# Navigate to backend directory
cd ../stock-nse-india

# Start the server
npm start
```

The API server will run on `http://localhost:3000`. Visit `http://localhost:3000/api-docs` for API documentation.

**Note:** Keep this terminal running while developing. The backend must be running for the frontend to fetch data.

### Step 3: Configure Frontend

Create a `.env` file in this project's root (optional):

```env
VITE_API_BASE_URL=http://localhost:3000
```

If not set, the app defaults to `http://localhost:3000`.

### Step 4: Start Frontend

**In a new terminal, start the frontend:**

```powershell
# In this project directory
npm install
npm run dev
```

The frontend runs on `http://localhost:8080`.

## Tech stack

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
