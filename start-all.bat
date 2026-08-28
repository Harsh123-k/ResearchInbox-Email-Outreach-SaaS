@echo off
set "PATH=C:\Users\ANSH KAMBOJ\.gemini\antigravity\scratch\nodejs;%PATH%"
echo Starting Redis Server...
start "ReachInbox Redis" "C:\Users\ANSH KAMBOJ\.gemini\antigravity\scratch\redis\redis-server.exe"
timeout /t 2 /nobreak >nul

echo Starting Backend API ^& BullMQ Worker...
start "ReachInbox Backend" cmd /k "cd /d C:\Users\ANSH KAMBOJ\.gemini\antigravity\scratch\reachinbox\backend && node dist/server.js"
timeout /t 2 /nobreak >nul

echo Starting Frontend UI...
start "ReachInbox Frontend" cmd /k "cd /d C:\Users\ANSH KAMBOJ\.gemini\antigravity\scratch\reachinbox\frontend && npm run dev"

echo ReachInbox is launching!
echo Frontend: http://localhost:5173
echo Backend API: http://localhost:5000
echo Bull Board: http://localhost:5000/admin/queues
