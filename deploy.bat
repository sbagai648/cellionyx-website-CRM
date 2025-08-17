@echo off
echo ========================================
echo   Cellionyx Firebase Deployment Script
echo ========================================
echo.

echo Step 1: Authenticating with Firebase...
call firebase login

echo.
echo Step 2: Setting active project to cellionyx...
call firebase use cellionyx

echo.
echo Step 3: Deploying Firestore rules...
call firebase deploy --only firestore:rules

echo.
echo Step 4: Deploying Firestore indexes...
call firebase deploy --only firestore:indexes

echo.
echo Step 5: Installing Cloud Functions dependencies...
cd functions
call npm install
cd ..

echo.
echo Step 6: Deploying Cloud Functions...
call firebase deploy --only functions

echo.
echo Step 7: Deploying Hosting...
call firebase deploy --only hosting

echo.
echo ========================================
echo   Deployment Complete!
echo ========================================
echo.
echo Your Cellionyx platform is now live at:
echo - https://cellionyx.web.app
echo - https://cellionyx.firebaseapp.com
echo.
echo Admin setup: https://cellionyx.web.app/admin-setup.html
echo Login: https://cellionyx.web.app/login.html
echo.
pause
