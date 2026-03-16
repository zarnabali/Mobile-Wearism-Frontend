# PowerShell script to clear all caches for Expo/React Native
Write-Host "Clearing all caches..." -ForegroundColor Yellow

# Clear Metro bundler cache
if (Test-Path "node_modules\.cache") {
    Remove-Item -Recurse -Force "node_modules\.cache"
    Write-Host "✓ Cleared node_modules/.cache" -ForegroundColor Green
}

# Clear Expo cache
if (Test-Path ".expo") {
    Remove-Item -Recurse -Force ".expo"
    Write-Host "✓ Cleared .expo directory" -ForegroundColor Green
}

# Clear watchman cache (if installed)
if (Get-Command watchman -ErrorAction SilentlyContinue) {
    watchman watch-del-all
    Write-Host "✓ Cleared watchman cache" -ForegroundColor Green
}

# Clear npm cache
npm cache clean --force
Write-Host "✓ Cleared npm cache" -ForegroundColor Green

# Clear Android build cache
if (Test-Path "android\app\build") {
    Remove-Item -Recurse -Force "android\app\build"
    Write-Host "✓ Cleared Android build cache" -ForegroundColor Green
}

# Clear iOS build cache
if (Test-Path "ios\build") {
    Remove-Item -Recurse -Force "ios\build"
    Write-Host "✓ Cleared iOS build cache" -ForegroundColor Green
}

Write-Host "`nAll caches cleared! Now run: npm start" -ForegroundColor Cyan




