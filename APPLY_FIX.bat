@echo off
setlocal
cd /d "%~dp0"
echo.
echo GENEVIEVE Dog Parks V33 repair
echo This creates a backup before changing any repository file.
echo.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0APPLY_GENEVIEVE_V33_FIX.ps1" -RepoPath "%~dp0"
set EXITCODE=%ERRORLEVEL%
echo.
if not "%EXITCODE%"=="0" (
  echo The repair did not fully pass. Read the message above.
) else (
  echo Repair passed. Open GitHub Desktop, commit the V33 changes, then Push origin.
)
echo.
pause
exit /b %EXITCODE%
