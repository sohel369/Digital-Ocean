# Generate JWT Secret for Railway Deployment
# PowerShell Script

Write-Host "=" * 80 -ForegroundColor Cyan
Write-Host "🔐 JWT SECRET GENERATOR FOR RAILWAY" -ForegroundColor Yellow
Write-Host "=" * 80 -ForegroundColor Cyan
Write-Host ""

# Generate a 64-character random secret
$secret = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | ForEach-Object {[char]$_})

Write-Host "Generated JWT Secret (64 characters):" -ForegroundColor Green
Write-Host ""
Write-Host $secret -ForegroundColor White
Write-Host ""

Write-Host "=" * 80 -ForegroundColor Cyan
Write-Host "📋 COPY THIS TO RAILWAY:" -ForegroundColor Yellow
Write-Host "=" * 80 -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Go to: https://railway.app" -ForegroundColor White
Write-Host "2. Select your Backend Service" -ForegroundColor White
Write-Host "3. Click 'Variables' tab" -ForegroundColor White
Write-Host "4. Click 'New Variable'" -ForegroundColor White
Write-Host "5. Add these variables:" -ForegroundColor White
Write-Host ""
Write-Host "   Variable Name: JWT_SECRET" -ForegroundColor Cyan
Write-Host "   Value: $secret" -ForegroundColor White
Write-Host ""
Write-Host "   Variable Name: ACCESS_TOKEN_EXPIRE_MINUTES" -ForegroundColor Cyan
Write-Host "   Value: 1440" -ForegroundColor White
Write-Host ""
Write-Host "   Variable Name: REFRESH_TOKEN_EXPIRE_DAYS" -ForegroundColor Cyan
Write-Host "   Value: 30" -ForegroundColor White
Write-Host ""
Write-Host "6. Click 'Add' for each variable" -ForegroundColor White
Write-Host "7. Railway will automatically redeploy (wait 2-3 minutes)" -ForegroundColor White
Write-Host ""

Write-Host "=" * 80 -ForegroundColor Cyan
Write-Host "⚠️  IMPORTANT: Keep this secret safe and NEVER share it!" -ForegroundColor Red
Write-Host "=" * 80 -ForegroundColor Cyan
Write-Host ""

# Generate 3 alternative secrets
Write-Host "Alternative secrets (choose one):" -ForegroundColor Yellow
Write-Host ""
for ($i = 1; $i -le 3; $i++) {
    $altSecret = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | ForEach-Object {[char]$_})
    Write-Host "Option ${i}: $altSecret" -ForegroundColor White
}
Write-Host ""

# Copy to clipboard option
Write-Host "Would you like to copy the first secret to clipboard? (Y/N)" -ForegroundColor Yellow
$response = Read-Host
if ($response -eq 'Y' -or $response -eq 'y') {
    $secret | Set-Clipboard
    Write-Host "✅ Secret copied to clipboard!" -ForegroundColor Green
    Write-Host "Now paste it in Railway Variables as JWT_SECRET" -ForegroundColor Green
}

Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
