@echo off
setlocal
cd /d "%~dp0"
title GENEVIEVE Dog Park V36 - Restore and Lock Official Logos
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0FIX_AND_DEPLOY_NOW.ps1"
set "RESULT=%ERRORLEVEL%"
echo.
if "%RESULT%"=="0" (
  echo GENEVIEVE V36 official logo repair finished.
) else (
  echo The repair window above explains the one step that still needs attention.
)
echo.
pause
exit /b %RESULT%
