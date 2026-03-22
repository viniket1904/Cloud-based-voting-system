# How to Start the Backend Server

## Quick Start

1. **Open a new terminal/PowerShell window**

2. **Navigate to the backend directory:**
   ```powershell
   cd "D:\OVS\Online Voting System\backend"
   ```

3. **Install dependencies (if not already installed):**
   ```powershell
   npm install
   ```

4. **Start the server:**
   ```powershell
   npm run dev
   ```
   
   OR use the PowerShell script:
   ```powershell
   .\start-server.ps1
   ```

5. **You should see:**
   ```
   SQLite database initialized
   Default admin created: admin@voting.gov / admin123
   Online Voting API running at http://localhost:5000
   ```

## Troubleshooting

### Port 5000 already in use?
If you see "EADDRINUSE" error, either:
- Stop the process using port 5000, OR
- Change the PORT in `.env` file to a different port (e.g., 5001)

### Dependencies not installed?
Run `npm install` in the backend directory.

### Still having issues?
1. Make sure Node.js is installed (version 18 or higher)
2. Check that you're in the correct directory
3. Verify the `.env` file exists in the backend folder

## Default Admin Credentials

- **Email**: `admin@voting.gov`
- **Password**: `admin123`

These are created automatically on first run.
