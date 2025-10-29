# Pixel Perfect Clone

## Getting started

1. Install dependencies

```sh
npm install
```

2. Start development server

```sh
npm run dev
```

## API integration

This project fetches live NSE data from the `stock-nse-india` API server.

### Step 1: Start the API Server

**Option A: Install Yarn (recommended)**

```powershell
# Install Yarn globally
npm install -g yarn

# Clone and start API
git clone https://github.com/hi-imcodeman/stock-nse-india.git
cd stock-nse-india
npm install
npm run start
```

**Option B: Without Yarn**

```powershell
git clone https://github.com/hi-imcodeman/stock-nse-india.git
cd stock-nse-india
npm install

# Try bypassing the prestart hook that requires yarn
npm run start --ignore-scripts

# OR manually build if there's a build script, then start
# npm run build
# node dist/index.js  # adjust path as needed
```

The API server should run on `http://localhost:3000`. Visit `http://localhost:3000/api-docs` for endpoints.

### Step 2: Configure Frontend

Create a `.env` file in this project's root:

```env
VITE_API_BASE_URL=http://localhost:3000
```

If not set, the app defaults to `http://localhost:3000`.

### Step 3: Start Frontend

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
