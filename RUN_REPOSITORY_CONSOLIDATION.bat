@echo off
setlocal
chcp 65001 >nul
title GENEVIEVE Dog Park - Correct Repository Consolidation

echo.
echo GENEVIEVE App Dog Park - Correct Repository Consolidation
echo This will NOT delete or overwrite your original repository.
echo.

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0CONSOLIDATE_CORRECT_GENEVIEVE_DOG_PARK_REPOSITORY.ps1"
set "EXITCODE=%ERRORLEVEL%"

echo.
if not "%EXITCODE%"=="0" (
  echo The consolidation did not complete. Nothing in the original repository was deleted.
  echo Read the red error above, then take a screenshot for Genevieve.
) else (
  echo Finished. The clean master, safety backup and report are in the folder opened on your Desktop.
)
echo.
pause
exit /b %EXITCODE%
