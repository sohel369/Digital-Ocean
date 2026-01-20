# Generate Secure JWT Secret for Railway
# Run this script to generate a strong random JWT secret

Write-Host ""
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "JWT Secret Generator for Railway Deployment" -ForegroundColor Cyan
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host ""

# Generate a 64-character random string
$bytes = New-Object byte[] 32
$rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
$rng.GetBytes($bytes)
$secret = [System.BitConverter]::ToString($bytes) -replace '-', ''

Write-Host "Your secure JWT_SECRET:" -ForegroundColor Green
Write-Host ""
Write-Host $secret -ForegroundColor Yellow
Write-Host ""
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor White
Write-Host ""
Write-Host "1. Copy the JWT secret above (select and Ctrl+C)" -ForegroundColor White
Write-Host ""
Write-Host "2. Go to Railway Dashboard:" -ForegroundColor White
Write-Host "   https://railway.app" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. Select your Backend Service" -ForegroundColor White
Write-Host ""
Write-Host "4. Go to Variables tab" -ForegroundColor White
Write-Host ""
Write-Host "5. Click 'New Variable' and add:" -ForegroundColor White
Write-Host "   Variable Name: " -NoNewline -ForegroundColor White
Write-Host "JWT_SECRET" -ForegroundColor Green
Write-Host "   Value: " -NoNewline -ForegroundColor White
Write-Host "[Paste the secret you copied]" -ForegroundColor Yellow
Write-Host ""
Write-Host "6. Click 'Add' - Railway will automatically redeploy" -ForegroundColor White
Write-Host ""
Write-Host "7. Wait 2-3 minutes for deployment to complete" -ForegroundColor White
Write-Host ""
Write-Host "8. Test login on your Railway frontend URL" -ForegroundColor White
Write-Host ""
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Optional: Also add these environment variables for better security:" -ForegroundColor White
Write-Host ""
Write-Host "ACCESS_TOKEN_EXPIRE_MINUTES=1440" -ForegroundColor Green
Write-Host "REFRESH_TOKEN_EXPIRE_DAYS=30" -ForegroundColor Green
Write-Host ""
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  IMPORTANT: Keep this secret safe and NEVER share it publicly!" -ForegroundColor Red
Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
