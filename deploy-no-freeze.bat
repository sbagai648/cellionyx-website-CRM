@echo off
echo ========================================
echo  CELLIONYX DEPLOYMENT (NON-INTERACTIVE)
echo ========================================
echo.

REM Use non-interactive flag to prevent prompts
firebase deploy --only hosting --project cellionyx-crm --non-interactive

echo.
echo Deployment complete!
echo Visit: https://cellionyx-crm.web.app
pause
