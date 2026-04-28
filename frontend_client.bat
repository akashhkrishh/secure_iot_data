@echo off
cls

echo =========================================
echo        Starting Frontend
echo =========================================
echo.

cd frontend

:: Check if node_modules exists
if not exist node_modules (

    echo Installing dependencies...
    npm install

    if %errorlevel% neq 0 (
        echo npm install failed
        pause
        exit /b
    )
)

echo.
echo Running Vite Dev Server...
echo.

npm run dev

pause