# Setup Instructions

## Step 1: Start the API Server

The API server needs to run first. You have two options:

### Option A: Install Yarn (Recommended)

Install Yarn globally:
```powershell
npm install -g yarn
```

Then run the API:
```powershell
cd ..\stock-nse-india
npm install
npm run start
```

### Option B: Skip Yarn (Quick Fix)

If you don't want to install Yarn, you can manually build and start:
```powershell
cd ..\stock-nse-india
npm install
npm run build  # or check package.json for the actual build command
npm run start:dev  # or whatever the start command is without prestart
```

Or bypass the prestart hook:
```powershell
cd ..\stock-nse-india
npm install
npm run start --ignore-scripts
```

## Step 2: Configure Frontend Environment

Create a `.env` file in this project's root directory:

```env
VITE_API_BASE_URL=http://localhost:3000
```

## Step 3: Start the Frontend

In this project directory (pixel-perfect-clone-4392):

```powershell
npm install
npm run dev
```

The frontend will run on `http://localhost:8080` (as configured in vite.config.ts).

## Verification

1. API should be running on: `http://localhost:3000`
   - Visit `http://localhost:3000/api-docs` to see available endpoints
2. Frontend should be running on: `http://localhost:8080`
   - Open this in your browser to see the app

## Troubleshooting

- **CORS errors**: The API needs to allow requests from `http://localhost:8080`. Check the API's CORS configuration.
- **API not responding**: Make sure the API server is running on port 3000 before starting the frontend.
- **Yarn not found**: Use Option B above or install Yarn with `npm install -g yarn`.

