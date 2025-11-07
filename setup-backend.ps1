# PowerShell script to setup the backend API
# Run this script from the project root directory

Write-Host "Setting up NSE India Backend API..." -ForegroundColor Green

# Check if stock-nse-india directory exists
if (Test-Path "..\stock-nse-india") {
    Write-Host "Backend directory already exists. Skipping clone." -ForegroundColor Yellow
    Set-Location ..\stock-nse-india
} else {
    Write-Host "Cloning stock-nse-india repository..." -ForegroundColor Cyan
    Set-Location ..
    git clone https://github.com/hi-imcodeman/stock-nse-india.git
    Set-Location stock-nse-india
}

Write-Host "Installing backend dependencies..." -ForegroundColor Cyan
npm install

Write-Host "Installing cross-env for Windows compatibility..." -ForegroundColor Cyan
npm install --save-dev cross-env

Write-Host "Building backend..." -ForegroundColor Cyan
npm run build

Write-Host "Backend setup complete!" -ForegroundColor Green
Write-Host "To start the backend, run: cd ..\stock-nse-india && npm start" -ForegroundColor Yellow
Write-Host "The API will be available at http://localhost:3000" -ForegroundColor Yellow

Set-Location ..

