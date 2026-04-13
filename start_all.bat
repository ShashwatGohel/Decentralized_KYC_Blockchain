@echo off
echo ===================================================
echo     Starting Decentralized KYC System Services
echo ===================================================
echo.
echo Cleaning up stalled processes and clearing ports...
taskkill /f /im node.exe >nul 2>&1

echo [1/4] Starting Local Hardhat Node...
start "Blockchain Node" cmd /k "cd smart-contract && npx hardhat node"

echo Waiting 5 seconds for the node to initialize...
timeout /t 5 /nobreak >nul

echo [2/4] Deploying Smart Contracts...
start "Contract Deployment" cmd /c "cd smart-contract && npx hardhat run scripts/deploy.js --network localhost && echo Deploy successful && pause"

echo Waiting 3 seconds for deployment to finish...
timeout /t 3 /nobreak >nul

echo [3/4] Starting Backend Server...
start "Backend API" cmd /k "cd backend && npm run dev"

echo [4/4] Starting Frontend App...
start "Frontend UI" cmd /k "cd frontend && npm start"

echo.
echo All services have been launched in separate windows!
echo It is safe to close this window.
exit
