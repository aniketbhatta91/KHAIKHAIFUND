@echo off
cd /d "%~dp0"
echo ============================================
echo   KhaiKhai Fund - starting local server
echo ============================================
echo.
echo Installing requirements (first run only)...
python -m pip install -r requirements.txt 2>nul || py -m pip install -r requirements.txt
echo.
echo Starting Flask app on port 5000 ...
echo   On this PC:      http://127.0.0.1:5000
echo   On your phone:   http://YOUR-PC-IP:5000  (see the IPv4 Address below)
echo.
echo Your PC's network addresses:
ipconfig ^| findstr /C:"IPv4"
echo.
echo (Keep this window open. Close it to stop the server.)
echo.
python app.py 2>nul || py app.py
echo.
echo Server stopped. Press any key to close.
pause >nul
