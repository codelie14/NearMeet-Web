@echo off
echo ========================================
echo   NearMeet Frontend - Demarrage
echo ========================================
echo.

cd frontend

REM Check if node_modules exists
if not exist "node_modules\" (
    echo Installation des dependances...
    call npm install
    echo.
)

REM Check if .env exists
if not exist ".env" (
    echo Creation du fichier .env...
    (
        echo VITE_API_URL=http://localhost:8000
        echo VITE_WS_URL=ws://localhost:8000
    ) > .env
    echo.
)

REM Start the development server
echo Demarrage du serveur de developpement...
echo Frontend accessible sur: http://localhost:5173
echo.
call npm run dev
