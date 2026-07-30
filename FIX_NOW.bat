@echo off
setlocal
cd /d "%~dp0"
title GENEVIEVE Dog Park V35 - Header Only On Today
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0FIX_AND_DEPLOY_NOW.ps1"
set "RESULT=%ERRORLEVEL%"
echo.
if "%RESULT%"=="0" (
  echo GENEVIEVE V35 header repair finished.
) else (
  echo The repair window above explains the one step that still needs attention.
)
echo.
pause
exit /b %RESULT%
