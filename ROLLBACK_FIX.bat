@echo off
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0ROLLBACK_LATEST_V33_BACKUP.ps1" -RepoPath "%~dp0"
echo.
pause
