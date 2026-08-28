$nodePath = "C:\Users\ANSH KAMBOJ\.gemini\antigravity\scratch\nodejs"
$env:PATH = "$nodePath;$env:PATH"
$rootDir = "C:\Users\ANSH KAMBOJ\.gemini\antigravity\scratch\reachinbox"

Write-Host "Starting Redis..." -ForegroundColor Green
Start-Process "C:\Users\ANSH KAMBOJ\.gemini\antigravity\scratch\redis\redis-server.exe" -WindowStyle Hidden

Start-Sleep -Seconds 1

Write-Host "Starting Backend..." -ForegroundColor Green
Start-Process "$nodePath\node.exe" -ArgumentList "dist/server.js" -WorkingDirectory "$rootDir\backend" -WindowStyle Hidden

Start-Sleep -Seconds 2

Write-Host "Starting Frontend..." -ForegroundColor Green
Start-Process "$nodePath\npm.cmd" -ArgumentList "run dev" -WorkingDirectory "$rootDir\frontend" -WindowStyle Hidden

Write-Host "✓ All ReachInbox services started!" -ForegroundColor Green
Write-Host "Frontend: http://localhost:5173"
Write-Host "Backend API: http://localhost:5000"
Write-Host "Bull Board: http://localhost:5000/admin/queues"
