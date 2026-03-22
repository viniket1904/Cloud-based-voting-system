# PowerShell script to start the backend server
# Run this script to start the Online Voting System backend

Write-Host "Starting Online Voting System Backend..." -ForegroundColor Cyan
Write-Host ""

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to install dependencies!" -ForegroundColor Red
        exit 1
    }
    Write-Host "Dependencies installed successfully!" -ForegroundColor Green
    Write-Host ""
}

# Check if .env exists
if (-not (Test-Path ".env")) {
    Write-Host "Warning: .env file not found. Creating default .env..." -ForegroundColor Yellow
    @"
PORT=5000
JWT_SECRET=your-secret-key-change-in-production
FRONTEND_URL=http://localhost:5173
"@ | Out-File -FilePath ".env" -Encoding utf8
    Write-Host ".env file created. Please update it with your configuration." -ForegroundColor Yellow
    Write-Host ""
}

# Start the server
Write-Host "Starting server on http://localhost:5000..." -ForegroundColor Green
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

node server.js
