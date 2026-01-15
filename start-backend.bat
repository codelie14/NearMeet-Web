@echo off
echo ========================================
echo   NearMeet Backend - Demarrage
echo ========================================
echo.

cd backend

REM Check if virtual environment exists
if not exist "venv\" (
    echo Creation de l'environnement virtuel...
    python -m venv venv
    echo.
)

REM Activate virtual environment
echo Activation de l'environnement virtuel...
call venv\Scripts\activate
echo.

REM Install dependencies if needed
echo Verification des dependances...
pip install -q -r requirements.txt
echo.

REM Check if .env exists
if not exist ".env" (
    echo Copie du fichier .env.example vers .env...
    copy .env.example .env
    echo ATTENTION: Modifiez le fichier .env avec vos propres cles!
    echo.
)

REM Start the server
echo Demarrage du serveur FastAPI...
echo Backend accessible sur: http://localhost:8000
echo Documentation API: http://localhost:8000/docs
echo.
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
