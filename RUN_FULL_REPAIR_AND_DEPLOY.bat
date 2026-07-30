@echo off
setlocal
title GENEVIEVE Dog Park V36 Full Repair and Deploy
cd /d "%~dp0"
echo.
echo ============================================================
echo  GENEVIEVE DOG PARK - FULL V36 REPAIR AND LIVE DEPLOYMENT
echo ============================================================
echo.
echo Leave VS Code and GitHub Desktop open.
echo This will back up the current files, restore both exact logos,
echo repair Journey and header routing, clear V32/V35 cache references,
echo test the app, commit the repair, and push it to GitHub main.
echo.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0repair.ps1" -Deploy
set "RC=%ERRORLEVEL%"
echo.
if not "%RC%"=="0" (
  echo The repair stopped safely. Read V36_REPAIR_RUN_LOG.txt in this folder.
) else (
  echo The repair completed. The live V36 app has been opened in your browser.
)
echo.
pause
exit /b %RC%
