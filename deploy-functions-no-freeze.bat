@echo off
echo ==========================================
echo  CELLIONYX FUNCTIONS DEPLOY (NO PROMPTS)
echo ==========================================
echo.

REM Set the cleanup policy first to avoid prompts
echo Setting cleanup policy for container images...
firebase functions:deletegcfartifacts --keep=7 --project cellionyx-crm --quiet 2>nul

REM Deploy functions with non-interactive flag
echo Deploying functions...
firebase deploy --only functions --project cellionyx-crm --non-interactive

echo.
echo Functions deployment complete!
pause
