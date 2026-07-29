param(
  [string]$RepoPath = ""
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)

function Read-Utf8([string]$Path) {
  return [System.IO.File]::ReadAllText($Path)
}

function Write-Utf8([string]$Path, [string]$Text) {
  [System.IO.File]::WriteAllText($Path, $Text, $Utf8NoBom)
}

function Test-GenevieveRepo([string]$Path) {
  if ([string]::IsNullOrWhiteSpace($Path)) { return $false }
  $index = Join-Path $Path "index.html"
  $app = Join-Path $Path "app.js"
  if (-not (Test-Path $index) -or -not (Test-Path $app)) { return $false }
  try {
    return (Read-Utf8 $index) -match "GENEVIEVE App"
  } catch { return $false }
}

function Find-Repo {
  $candidates = New-Object System.Collections.Generic.List[string]
  if ($RepoPath) { $candidates.Add($RepoPath) }
  $candidates.Add($ScriptDir)
  $candidates.Add((Split-Path -Parent $ScriptDir))

  $known = @(
    (Join-Path $env:USERPROFILE "GenevieveProjects\Genevieve-Tracey-Gruff-dog-park-app"),
    (Join-Path $env:USERPROFILE "GenevieveProjects\Genevieve-Animals-Dog-Parks-App"),
    (Join-Path $env:USERPROFILE "Documents\GitHub\Genevieve-Tracey-Gruff-dog-park-app"),
    (Join-Path $env:USERPROFILE "Documents\GitHub\Genevieve-Animals-Dog-Parks-App"),
    (Join-Path $env:USERPROFILE "Desktop\Genevieve-Tracey-Gruff-dog-park-app")
  )
  foreach ($item in $known) { $candidates.Add($item) }

  foreach ($base in @((Join-Path $env:USERPROFILE "GenevieveProjects"), (Join-Path $env:USERPROFILE "Documents\GitHub"))) {
    if (Test-Path $base) {
      Get-ChildItem -Path $base -Filter "index.html" -File -Recurse -ErrorAction SilentlyContinue |
        ForEach-Object { $candidates.Add($_.Directory.FullName) }
    }
  }

  $matches = @($candidates | Where-Object { Test-GenevieveRepo $_ } | Select-Object -Unique)
  if ($matches.Count -eq 1) { return $matches[0] }
  if ($matches.Count -gt 1) {
    Write-Host "More than one GENEVIEVE app folder was found:" -ForegroundColor Yellow
    for ($i = 0; $i -lt $matches.Count; $i++) { Write-Host "  [$($i + 1)] $($matches[$i])" }
    $choice = Read-Host "Type the number for the V32 dog-park repository"
    $n = 0
    if ([int]::TryParse($choice, [ref]$n) -and $n -ge 1 -and $n -le $matches.Count) { return $matches[$n - 1] }
  }

  $manual = Read-Host "Paste the full folder path containing index.html and app.js"
  if (Test-GenevieveRepo $manual) { return $manual }
  throw "The GENEVIEVE dog-park repository could not be found. No files were changed."
}

function Backup-File([string]$Path, [string]$BackupDir) {
  if (Test-Path $Path) { Copy-Item -LiteralPath $Path -Destination (Join-Path $BackupDir (Split-Path $Path -Leaf)) -Force }
}

function Replace-FirstRequired([string]$Text, [string]$Pattern, [string]$Replacement, [string]$Label) {
  $regex = New-Object System.Text.RegularExpressions.Regex($Pattern, [System.Text.RegularExpressions.RegexOptions]::Singleline)
  if (-not $regex.IsMatch($Text)) {
    Write-Warning "Could not locate $Label. The V33 safety script will still attempt the repair at runtime."
    return $Text
  }
  Write-Host "  fixed: $Label" -ForegroundColor Green
  return $regex.Replace($Text, $Replacement, 1)
}

$Repo = Find-Repo
Write-Host "" 
Write-Host "GENEVIEVE Dog Parks V33 repair" -ForegroundColor Cyan
Write-Host "Repository: $Repo"

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$BackupDir = Join-Path $Repo "_backup_before_v33_$stamp"
New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null

$filesToBackup = @("index.html", "app.js", "service-worker.js", "manifest.webmanifest", "config.js", "repair.js", "styles.css", "sw.js")
foreach ($name in $filesToBackup) { Backup-File (Join-Path $Repo $name) $BackupDir }

# 1. Restore every approved logo file that V32 references but did not contain.
$assetTarget = Join-Path $Repo "assets"
New-Item -ItemType Directory -Path $assetTarget -Force | Out-Null
Get-ChildItem -Path (Join-Path $ScriptDir "assets") -File | ForEach-Object {
  Copy-Item -LiteralPath $_.FullName -Destination (Join-Path $assetTarget $_.Name) -Force
}
Write-Host "  fixed: approved GA and roots artwork files" -ForegroundColor Green

# 2. Correct index navigation, add the dedicated Journey page and add the runtime guard.
$indexPath = Join-Path $Repo "index.html"
$index = Read-Utf8 $indexPath
$index = $index.Replace('data-go="travel" data-main="journey"', 'data-go="journey" data-main="journey"')

if ($index -notmatch 'id="journey"') {
  $journeyMarkup = Read-Utf8 (Join-Path $ScriptDir "journey-section.html")
  $anchor = '<section class="screen" data-group="journey" id="before-leaving">'
  if ($index.Contains($anchor)) {
    $index = $index.Replace($anchor, $journeyMarkup + [Environment]::NewLine + $anchor)
    Write-Host "  fixed: Journey now opens on its own page" -ForegroundColor Green
  } else {
    Write-Warning "The before-leaving screen anchor was not found. The runtime guard will create the Journey page in the browser."
  }
}

$index = $index.Replace('20260729.32', '20260729.33').Replace('2026.07.29.32', '2026.07.29.33')
if ($index -notmatch 'genevieve-v33-repair\.js') {
  $scriptTag = '<script src="./genevieve-v33-repair.js?v=20260729.33"></script>'
  if ($index -match '</body>') {
    $index = $index.Replace('</body>', $scriptTag + [Environment]::NewLine + '</body>')
    Write-Host "  fixed: V33 repair guard added" -ForegroundColor Green
  }
}
Write-Utf8 $indexPath $index
Copy-Item -LiteralPath (Join-Path $ScriptDir "genevieve-v33-repair.js") -Destination (Join-Path $Repo "genevieve-v33-repair.js") -Force

# 3. Make a cold launch always open Today/header. An explicit ?open=screen remains supported.
$appPath = Join-Path $Repo "app.js"
$app = Read-Utf8 $appPath
$bootPattern = "const params=new URLSearchParams\(location\.search\),requested=params\.get\('open'\),hash=location\.hash\.slice\(1\);\s*const initialScreen=requested&&document\.getElementById\(requested\)\?requested:\(hash&&document\.getElementById\(hash\)\?hash:'today'\);\s*setScreen\(initialScreen,false\);"
$bootReplacement = @'
const params=new URLSearchParams(location.search),requested=params.get('open');
    const initialScreen=requested&&document.getElementById(requested)?requested:'today';
    setScreen(initialScreen,false);
    requestAnimationFrame(()=>window.scrollTo({top:0,left:0,behavior:'auto'}));
'@
$app = Replace-FirstRequired $app $bootPattern $bootReplacement "first screen and header landing"

$resetPattern = "const requestedScreen=freshUrl\.searchParams\.get\('open'\)\|\|freshUrl\.hash\.slice\(1\);\s*freshUrl\.hash=document\.getElementById\(requestedScreen\)\?requestedScreen:'today';"
$resetReplacement = @'
const requestedScreen=freshUrl.searchParams.get('open');
          freshUrl.hash=requestedScreen&&document.getElementById(requestedScreen)?requestedScreen:'today';
'@
$app = Replace-FirstRequired $app $resetPattern $resetReplacement "cache-reset landing screen"
$app = $app.Replace('genevieve_v32_fine_tooth_comb_reset_done', 'genevieve_v33_first_screen_logos_journey_reset_done')
$app = $app.Replace("genevieveVersion','32'", "genevieveVersion','33'")
$app = $app.Replace('20260729.32', '20260729.33').Replace('2026.07.29.32', '2026.07.29.33')
Write-Utf8 $appPath $app

# 4. Bump all cache/version markers so an iPhone cannot remain trapped on broken V32 assets.
foreach ($name in @("service-worker.js", "manifest.webmanifest", "config.js", "repair.js", "styles.css", "sw.js")) {
  $path = Join-Path $Repo $name
  if (-not (Test-Path $path)) { continue }
  $text = Read-Utf8 $path
  $text = $text.Replace('20260729.32', '20260729.33')
  $text = $text.Replace('2026.07.29.32', '2026.07.29.33')
  $text = $text.Replace('2026-07-29-v32', '2026-07-29-v33')
  $text = $text.Replace('genevieve-dog-park-v32', 'genevieve-dog-park-v33')
  $text = $text.Replace('genevieve-dog-parks-20260729-32', 'genevieve-dog-parks-20260729-33')
  if ($name -eq 'service-worker.js' -and $text -notmatch 'genevieve-v33-repair\.js') {
    $text = $text.Replace("'./repair.js?v=20260729.33'", "'./repair.js?v=20260729.33','./genevieve-v33-repair.js?v=20260729.33'")
  }
  Write-Utf8 $path $text
}

# 5. Fine-tooth-comb verification.
$errors = New-Object System.Collections.Generic.List[string]
$warnings = New-Object System.Collections.Generic.List[string]
$index = Read-Utf8 $indexPath
$app = Read-Utf8 $appPath

$requiredFiles = @(
  "assets\ga-master-icon-64-v29.png",
  "assets\ga-master-apple-touch-180-v29.png",
  "assets\ga-master-app-icon-192-v29.png",
  "assets\ga-master-app-icon-512-v29.png",
  "assets\ga-master-locked-2026-07-29.jpeg",
  "assets\genevieve-safety-from-roots-locked-2026-07-29.jpeg",
  "genevieve-v33-repair.js"
)
foreach ($relative in $requiredFiles) {
  if (-not (Test-Path (Join-Path $Repo $relative))) { $errors.Add("Missing file: $relative") }
}
if ($index -notmatch 'id="journey"') { $errors.Add('Dedicated Journey page is missing from index.html') }
if ($index -match 'data-go="travel" data-main="journey"') { $errors.Add('A main Journey button still points directly to Travel') }
if (($index | Select-String -Pattern 'data-go="journey" data-main="journey"' -AllMatches).Matches.Count -lt 2) { $errors.Add('Top and bottom Journey navigation were not both repaired') }
if ($app -notmatch "initialScreen=requested&&document\.getElementById\(requested\)\?requested:'today'") { $errors.Add('app.js does not default to Today') }
if ($index -match '20260729\.32|2026\.07\.29\.32') { $warnings.Add('An old V32 marker remains in index.html') }

$ids = @{}
[regex]::Matches($index, 'id="([^"]+)"') | ForEach-Object { $ids[$_.Groups[1].Value] = $true }
$targets = [regex]::Matches($index, 'data-go="([^"]+)"') | ForEach-Object { $_.Groups[1].Value } | Select-Object -Unique
foreach ($target in $targets) {
  if (-not $ids.ContainsKey($target)) { $warnings.Add("Navigation target has no static page: $target") }
}

$nodeResult = "Node syntax check not run (Node.js was not found)."
$node = Get-Command node -ErrorAction SilentlyContinue
if ($node) {
  $syntaxErrors = @()
  foreach ($script in @("app.js", "repair.js", "genevieve-v33-repair.js", "service-worker.js")) {
    $path = Join-Path $Repo $script
    if (Test-Path $path) {
      & $node.Source --check $path 2>$null
      if ($LASTEXITCODE -ne 0) { $syntaxErrors += $script }
    }
  }
  if ($syntaxErrors.Count) { $errors.Add("JavaScript syntax check failed: $($syntaxErrors -join ', ')") }
  else { $nodeResult = "PASS: JavaScript syntax check" }
}

$reportLines = @(
  "GENEVIEVE DOG PARK V33 REPAIR REPORT",
  "Created: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss zzz')",
  "Repository: $Repo",
  "Backup: $BackupDir",
  "",
  "Required repairs:",
  "- First launch defaults to Today and scrolls to the header.",
  "- Approved GA and roots logos are restored with exact referenced filenames.",
  "- Journey opens a dedicated Journey landing page.",
  "- Long-distance Grey Nomad Travel remains a separate choice inside Journey.",
  "- Cache/version is bumped to V33.",
  "- $nodeResult",
  "",
  "Errors: $($errors.Count)",
  ($errors | ForEach-Object { "ERROR: $_" }),
  "Warnings: $($warnings.Count)",
  ($warnings | ForEach-Object { "WARNING: $_" })
)
$reportPath = Join-Path $Repo "GENEVIEVE_V33_REPAIR_REPORT.txt"
Write-Utf8 $reportPath (($reportLines | ForEach-Object { [string]$_ }) -join [Environment]::NewLine)

Write-Host ""
if ($errors.Count -eq 0) {
  Write-Host "PASS: V33 repair completed and checked." -ForegroundColor Green
  Write-Host "Backup: $BackupDir"
  Write-Host "Report: $reportPath"
  Write-Host ""
  Write-Host "Next: open GitHub Desktop, review the changed files, commit, and push. Vercel should then deploy V33." -ForegroundColor Cyan
  exit 0
}

Write-Host "The repair ran, but the checker found $($errors.Count) error(s)." -ForegroundColor Red
$errors | ForEach-Object { Write-Host " - $_" -ForegroundColor Red }
Write-Host "Your original files remain in: $BackupDir"
exit 1
