@echo off
echo Starting Monday.com Storage Billing Services...
echo.

echo Starting Backend (Port 3000)...
start "Backend" cmd /k "npm start"

echo Waiting 3 seconds...
timeout /t 3 /nobreak > nul

echo Starting Frontend (Port 3001)...
start "Frontend" cmd /k "cd monday-app-v2 && npm run dev"

echo.
echo Services are starting...
echo Backend: http://localhost:3000
echo Frontend: http://localhost:3001
echo.
echo Press any key to exit this window...
pause > nul 