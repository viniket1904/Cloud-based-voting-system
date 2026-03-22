# PowerShell script to clean Vite cache on Windows
# Run this script if you encounter EPERM errors with Vite

$viteCachePath = Join-Path $PSScriptRoot "node_modules\.vite"

Write-Host "Attempting to clean Vite cache..." -ForegroundColor Yellow

if (Test-Path $viteCachePath) {
    try {
        # Stop any processes that might be locking the files
        Get-Process | Where-Object { $_.Path -like "*node*" -or $_.Path -like "*vite*" } | Stop-Process -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 1
        
        # Remove the cache directory
        Remove-Item -Path $viteCachePath -Recurse -Force -ErrorAction Stop
        Write-Host "✓ Vite cache cleared successfully!" -ForegroundColor Green
    }
    catch {
        Write-Host "✗ Error clearing cache: $_" -ForegroundColor Red
        Write-Host "`nTry these solutions:" -ForegroundColor Yellow
        Write-Host "1. Close all terminals and VS Code/Cursor windows" -ForegroundColor White
        Write-Host "2. Run this script as Administrator" -ForegroundColor White
        Write-Host "3. Manually delete: $viteCachePath" -ForegroundColor White
        Write-Host "4. Restart your computer if the issue persists" -ForegroundColor White
        exit 1
    }
}
else {
    Write-Host "No Vite cache found. Nothing to clean." -ForegroundColor Green
}

Write-Host "`nYou can now run: npm run dev" -ForegroundColor Cyan
