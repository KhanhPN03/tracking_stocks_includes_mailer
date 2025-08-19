@echo off
REM 🚀 Vietnamese Stock Tracker - Quick Start Script (Windows)
REM Author: KhanhPN aka Laza

echo 🇻🇳 Vietnamese Stock Tracker - Quick Start Setup
echo ==================================================

REM Check if Node.js is installed
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    pause
    exit /b 1
)

echo ✅ Node.js detected: 
node -v

REM Check if npm is installed
npm -v >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is not installed. Please install npm first.
    pause
    exit /b 1
)

echo ✅ npm detected:
npm -v

REM Install backend dependencies
echo.
echo ℹ️ Installing backend dependencies...
cd server
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install backend dependencies
    pause
    exit /b 1
)
echo ✅ Backend dependencies installed successfully

REM Install frontend dependencies
echo.
echo ℹ️ Installing frontend dependencies...
cd ..\client
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install frontend dependencies
    pause
    exit /b 1
)
echo ✅ Frontend dependencies installed successfully

REM Check for .env file
cd ..\server
if not exist ".env" (
    echo.
    echo ⚠️ No .env file found. Creating template...
    
    (
        echo # Database
        echo MONGODB_URI=mongodb://localhost:27017/vietnam_stock_tracker
        echo.
        echo # Authentication
        echo JWT_SECRET=your_super_secure_jwt_secret_minimum_32_characters
        echo.
        echo # External APIs
        echo ALPHA_VANTAGE_API_KEY=your_alpha_vantage_api_key
        echo DNSE_API_KEY=your_dnse_api_key
        echo.
        echo # Email Service ^(for notifications^)
        echo EMAIL_USER=your_gmail@gmail.com
        echo EMAIL_PASS=your_gmail_app_password
        echo.
        echo # Server Scheduling
        echo SERVER_TIMEZONE=Asia/Ho_Chi_Minh
        echo SERVER_START_HOUR=9
        echo SERVER_END_HOUR=15
        echo.
        echo # Development
        echo NODE_ENV=development
        echo PORT=5000
        echo.
        echo # Activity Logging
        echo ACTIVITY_BATCH_SIZE=10
        echo ACTIVITY_BATCH_INTERVAL=5000
    ) > .env
    
    echo ✅ .env template created
    echo ⚠️ Please edit server\.env with your actual configuration before running
) else (
    echo ✅ .env file exists
)

REM Create startup scripts
echo.
echo ℹ️ Creating startup scripts...

REM Backend start script
(
    echo @echo off
    echo echo 🚀 Starting Vietnamese Stock Tracker Backend...
    echo echo Server will be active during Vietnam market hours ^(9 AM - 3 PM^)
    echo echo Dashboard: http://localhost:5000
    echo echo API Docs: http://localhost:5000/api-docs
    echo echo.
    echo cd server
    echo npm run dev
    echo pause
) > start-backend.bat

REM Frontend start script
(
    echo @echo off
    echo echo 🖥️ Starting Vietnamese Stock Tracker Frontend...
    echo echo Dashboard: http://localhost:3000
    echo echo.
    echo cd client
    echo npm run dev
    echo pause
) > start-frontend.bat

REM Development start script (both)
(
    echo @echo off
    echo echo 🚀 Starting Vietnamese Stock Tracker - Full Stack
    echo echo Frontend: http://localhost:3000
    echo echo Backend: http://localhost:5000
    echo echo.
    echo echo ℹ️ Starting backend server...
    echo start "Backend Server" cmd /c "cd server && npm run dev"
    echo timeout /t 3 /nobreak ^> nul
    echo echo ℹ️ Starting frontend server...
    echo start "Frontend Server" cmd /c "cd client && npm run dev"
    echo echo.
    echo echo ✅ Both servers started in separate windows!
    echo echo Close the server windows to stop the application.
    echo pause
) > start-dev.bat

echo ✅ Startup scripts created

echo.
echo 🎉 Setup Complete! Your Vietnamese Stock Tracker is ready!
echo.
echo 📋 Next Steps:
echo 1. Edit server\.env with your configuration
echo 2. Start development:
echo    • Full stack: start-dev.bat
echo    • Backend only: start-backend.bat
echo    • Frontend only: start-frontend.bat
echo.
echo 🌐 Local URLs:
echo    • Frontend: http://localhost:3000
echo    • Backend: http://localhost:5000
echo    • API Docs: http://localhost:5000/api-docs
echo.
echo 📖 For deployment guide, see: COMPLETE_DEPLOYMENT_GUIDE.md
echo.
echo ✅ Happy coding! 🚀🇻🇳

pause
