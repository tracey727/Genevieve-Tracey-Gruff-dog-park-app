param([string]$RepoPath = "")
$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not $RepoPath) { $RepoPath = $ScriptDir }
if (-not (Test-Path (Join-Path $RepoPath "index.html"))) {
  $parent = Split-Path -Parent $ScriptDir
  if (Test-Path (Join-Path $parent "index.html")) { $RepoPath = $parent }
  else { $RepoPath = Read-Host "Paste the repository folder path" }
}
$backup = Get-ChildItem -Path $RepoPath -Directory -Filter "_backup_before_v33_*" | Sort-Object Name -Descending | Select-Object -First 1
if (-not $backup) { throw "No V33 backup folder was found." }
Write-Host "Restoring from $($backup.FullName)" -ForegroundColor Yellow
Get-ChildItem -Path $backup.FullName -File | ForEach-Object { Copy-Item $_.FullName -Destination (Join-Path $RepoPath $_.Name) -Force }
Write-Host "Original text files restored. Added V33 logo files and the V33 guard remain harmless and can be deleted manually if required." -ForegroundColor Green
