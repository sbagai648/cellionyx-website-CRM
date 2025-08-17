@echo off
firebase login --reauth
firebase deploy --project cellionyx --only hosting
echo Done!
pause
