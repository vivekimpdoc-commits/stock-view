@echo off
title BHARAT STOCKS - Launcher
echo ====================================================
echo 📈 BHARAT STOCKS: LIVE TRADING EXCHANGE LAUNCHER
echo ====================================================
echo.
echo 🟢 Booting up Express & WebSocket Feed (Port 5000)...
start "Bharat Stocks - Backend Server" cmd /c "cd backend && npm start"

echo 🟢 Booting up Vite & React Dashboard Client (Port 3000)...
start "Bharat Stocks - Frontend Client" cmd /c "cd frontend && npm run dev"

echo.
echo ⏳ Waiting 3 seconds for services to fully initialize...
timeout /t 3 /nobreak > nul

echo 🚀 Launching Trading Deck link in your web browser...
start http://localhost:3000

echo.
echo ✅ ALL SERVICES ARE BOOTED AND ACTIVE!
echo 💡 Keep the backend and frontend terminal windows open while testing.
echo ====================================================
pause
