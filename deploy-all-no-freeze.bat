@echo off
echo ========================================
echo  CELLIONYX FULL DEPLOYMENT (NO PROMPTS)
echo ========================================
echo.

REM Deploy everything with non-interactive flags
echo Deploying Hosting, Functions, and Firestore...
firebase deploy --project cellionyx-crm --non-interactive --force

echo.
echo ========================================
echo  DEPLOYMENT COMPLETE!
echo ========================================
echo.
echo Hosting URL: https://cellionyx-crm.web.app
echo Login Page: https://cellionyx-crm.web.app/login.html
echo Admin Setup: https://cellionyx-crm.web.app/admin-setup.html
echo.
pause
