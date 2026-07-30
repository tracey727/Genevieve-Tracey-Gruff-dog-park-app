@echo off
setlocal
title GENEVIEVE Dog Park V36 Local Repair
cd /d "%~dp0"
echo.
echo ============================================================
echo  GENEVIEVE DOG PARK - V36 LOCAL REPAIR ONLY
 echo ============================================================
echo.
echo This creates a backup, repairs the local project and runs checks.
echo It does not push anything to GitHub or Vercel.
echo.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0repair.ps1"
set "RC=%ERRORLEVEL%"
echo.
if not "%RC%"=="0" (
  echo The repair stopped safely. Read V36_REPAIR_RUN_LOG.txt in this folder.
) else (
  echo Local repair and automated checks completed.
)
echo.
pause
exit /b %RC%
