@echo off
echo ============================================================
echo   Educational AI System - Quick Start
echo ============================================================
echo.

echo [1/3] Checking LM Studio...
curl -s http://localhost:1234/v1/models >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ LM Studio is NOT running!
    echo    Please start LM Studio and load a model.
    pause
    exit /b 1
) else (
    echo ✅ LM Studio is running
)

echo.
echo [2/3] Starting Backend API Server...
start "Backend API" cmd /k "python api_server.py"
timeout /t 3 >nul

echo.
echo [3/3] Frontend is already running on port 5173
echo.

echo ============================================================
echo   System Ready!
echo ============================================================
echo.
echo   Frontend: http://localhost:5173
echo   Backend:  http://localhost:5000
echo   LM Studio: http://localhost:1234
echo.
echo   Open your browser and go to the AI Tutor tab!
echo ============================================================
pause
