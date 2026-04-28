@echo off
echo =========================================
echo       Starting MedNode IoT System
echo =========================================
echo.

echo Getting Current IP Address...
echo -----------------------------------------

for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4"') do (
    set ip=%%a
)

echo Your System IP:%ip%
echo Backend will be accessible at:
echo http://%ip%:8000
echo -----------------------------------------
echo.

echo Starting Python Backend Server...
cd backend

call .venv\Scripts\activate

echo Backend Running...
echo.

start "" cmd /c "timeout /t 2 >nul"

uvicorn main:app --reload --host 0.0.0.0 --port 8000

pause