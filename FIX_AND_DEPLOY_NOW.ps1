param(
  [string]$RepoPath = ""
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$Version = "20260730.36"
$DisplayVersion = "2026.07.30.36"
$ExpectedSlug = "tracey727/Genevieve-Tracey-Gruff-dog-park-app"
$RemoteUrl = "https://github.com/$ExpectedSlug.git"
$LiveBase = "https://genevieve-tracey-gruff-dog-park-app-five.vercel.app/"

function Read-Text([string]$Path) {
  return [System.IO.File]::ReadAllText($Path)
}

function Write-Text([string]$Path, [string]$Text) {
  [System.IO.File]::WriteAllText($Path, $Text, $Utf8NoBom)
}

function Get-GitExe {
  $normal = Get-Command git.exe -ErrorAction SilentlyContinue
  if ($normal) { return $normal.Source }

  $desktopRoot = Join-Path $env:LOCALAPPDATA "GitHubDesktop"
  if (Test-Path $desktopRoot) {
    $apps = Get-ChildItem -Path $desktopRoot -Directory -Filter "app-*" -ErrorAction SilentlyContinue |
      Sort-Object LastWriteTime -Descending
    foreach ($app in $apps) {
      foreach ($relative in @(
        "resources\app\git\cmd\git.exe",
        "resources\app\git\mingw64\bin\git.exe"
      )) {
        $candidate = Join-Path $app.FullName $relative
        if (Test-Path $candidate) { return $candidate }
      }
    }
  }
  throw "Git was not found. Install or open GitHub Desktop once, then run this repair again."
}

$GitExe = Get-GitExe

function Git-Output([string]$WorkingPath, [string[]]$Arguments) {
  $all = @("-C", $WorkingPath) + $Arguments
  $result = & $GitExe @all 2>$null
  return (($result | Out-String).Trim())
}

function Test-ExpectedRepo([string]$Path) {
  if ([string]::IsNullOrWhiteSpace($Path)) { return $false }
  if (-not (Test-Path (Join-Path $Path ".git"))) { return $false }
  if (-not (Test-Path (Join-Path $Path "index.html"))) { return $false }
  if (-not (Test-Path (Join-Path $Path "app.js"))) { return $false }
  try {
    $remote = Git-Output $Path @("remote", "get-url", "origin")
    return $remote -match [regex]::Escape($ExpectedSlug)
  } catch {
    return $false
  }
}

function Find-ExpectedRepo {
  if ($RepoPath) {
    if (Test-ExpectedRepo $RepoPath) { return (Resolve-Path $RepoPath).Path }
    throw "The supplied folder is not the live $ExpectedSlug repository. Nothing was changed."
  }

  $names = @(
    "Genevieve-Tracey-Gruff-dog-park-app",
    "Genevieve-Tracey-Gruff-dog-park-app-main",
    "GENEVIEVE-DOG-PARK-V36-LOGO-FIX"
  )
  $bases = @(
    (Join-Path $env:USERPROFILE "GenevieveProjects"),
    (Join-Path $env:USERPROFILE "Documents\GitHub"),
    (Join-Path $env:USERPROFILE "Desktop")
  )

  foreach ($base in $bases) {
    foreach ($name in $names) {
      $candidate = Join-Path $base $name
      if (Test-ExpectedRepo $candidate) { return (Resolve-Path $candidate).Path }
    }
  }

  foreach ($base in $bases) {
    if (-not (Test-Path $base)) { continue }
    $folders = Get-ChildItem -Path $base -Directory -ErrorAction SilentlyContinue |
      Where-Object { $_.Name -like "*Genevieve*" -or $_.Name -like "*dog*park*" }
    foreach ($folder in $folders) {
      if (Test-ExpectedRepo $folder.FullName) { return $folder.FullName }
    }
  }
  return ""
}

function Clone-FreshRepo {
  $base = Join-Path $env:USERPROFILE "GenevieveProjects"
  New-Item -ItemType Directory -Path $base -Force | Out-Null
  $target = Join-Path $base "GENEVIEVE-DOG-PARK-V36-LOGO-FIX"
  if (Test-Path $target) {
    $target = Join-Path $base ("GENEVIEVE-DOG-PARK-V36-LOGO-FIX-" + (Get-Date -Format "yyyyMMdd-HHmmss"))
  }

  Write-Host "Downloading a clean copy of the exact live repository ..." -ForegroundColor Cyan
  & $GitExe clone $RemoteUrl $target
  if ($LASTEXITCODE -ne 0 -or -not (Test-ExpectedRepo $target)) {
    throw "The exact live GitHub repository could not be cloned. No live files were changed."
  }
  return $target
}

function Create-Backup([string]$Repo) {
  $backupRoot = Join-Path $env:USERPROFILE "GenevieveBackups"
  New-Item -ItemType Directory -Path $backupRoot -Force | Out-Null
  $backup = Join-Path $backupRoot ("DogPark-before-V36-" + (Get-Date -Format "yyyyMMdd-HHmmss"))
  New-Item -ItemType Directory -Path $backup -Force | Out-Null

  foreach ($name in @(
    "index.html", "app.js", "styles.css", "repair.js", "service-worker.js",
    "sw.js", "manifest.webmanifest", "config.js"
  )) {
    $source = Join-Path $Repo $name
    if (Test-Path $source) { Copy-Item -LiteralPath $source -Destination $backup -Force }
  }
  $assetSource = Join-Path $Repo "assets"
  if (Test-Path $assetSource) {
    Copy-Item -LiteralPath $assetSource -Destination (Join-Path $backup "assets") -Recurse -Force
  }
  return $backup
}

function Bump-Versions([string]$Text) {
  $Text = [regex]::Replace($Text, '202607(?:29|30)\.(?:3[0-5])', $Version)
  $Text = [regex]::Replace($Text, '2026\.07\.(?:29|30)\.(?:3[0-5])', $DisplayVersion)
  $Text = [regex]::Replace($Text, '2026-07-(?:29|30)-v(?:3[0-5])', '2026-07-30-v36')
  $Text = [regex]::Replace($Text, 'genevieve-dog-park-v(?:3[0-5])', 'genevieve-dog-park-v36')
  $Text = [regex]::Replace($Text, 'genevieve-dog-parks-202607(?:29|30)-(?:3[0-5])', 'genevieve-dog-parks-20260730-36')
  foreach ($old in @('32','33','34','35')) {
    $Text = $Text.Replace("genevieveVersion','$old'", "genevieveVersion','36'")
    $Text = $Text.Replace("genevieveVersion=$old", 'genevieveVersion=36')
  }
  return $Text
}

Write-Host "" 
Write-Host "GENEVIEVE DOG PARK - FIX AND DEPLOY V36" -ForegroundColor Cyan
Write-Host "This repair only targets: $ExpectedSlug" -ForegroundColor DarkGray

$Repo = Find-ExpectedRepo
if ($Repo) {
  $dirty = Git-Output $Repo @("status", "--porcelain")
  if ($dirty) {
    Write-Host "The existing live-repository folder has uncommitted work, so it will not be touched." -ForegroundColor Yellow
    $Repo = Clone-FreshRepo
  } else {
    Write-Host "Using exact live repository: $Repo" -ForegroundColor Green
    & $GitExe -C $Repo fetch origin
    if ($LASTEXITCODE -ne 0) { Write-Warning "Could not fetch; continuing with the local copy." }
    & $GitExe -C $Repo checkout main
    if ($LASTEXITCODE -ne 0) {
      & $GitExe -C $Repo checkout -B main origin/main
      if ($LASTEXITCODE -ne 0) { throw "Could not select the main deployment branch." }
    }
    & $GitExe -C $Repo pull --ff-only origin main
    if ($LASTEXITCODE -ne 0) { Write-Warning "Could not fast-forward main; continuing with the current clean copy." }
  }
} else {
  $Repo = Clone-FreshRepo
}

$Backup = Create-Backup $Repo
Write-Host "Backup created: $Backup" -ForegroundColor DarkGray

# Restore the approved artwork under both stable and locked filenames.
$assetTarget = Join-Path $Repo "assets"
New-Item -ItemType Directory -Path $assetTarget -Force | Out-Null
Get-ChildItem -Path (Join-Path $ScriptDir "assets") -File | ForEach-Object {
  Copy-Item -LiteralPath $_.FullName -Destination (Join-Path $assetTarget $_.Name) -Force
}
Copy-Item -LiteralPath (Join-Path $ScriptDir "genevieve-v36-boot.js") -Destination (Join-Path $Repo "genevieve-v36-boot.js") -Force
Copy-Item -LiteralPath (Join-Path $ScriptDir "genevieve-v36-repair.js") -Destination (Join-Path $Repo "genevieve-v36-repair.js") -Force
Write-Host "PASS: exact uploaded GA and tree/roots logos copied and locked" -ForegroundColor Green

# Repair index.html.
$indexPath = Join-Path $Repo "index.html"
$index = Read-Text $indexPath

$gaPattern = '(?is)(<img\b(?=[^>]*\bclass="[^"]*approved-ga-logo[^"]*")[^>]*\bsrc=")[^"]*(")'
$rootsPattern = '(?is)(<img\b(?=[^>]*\bclass="[^"]*header-roots-journey-art[^"]*")[^>]*\bsrc=")[^"]*(")'
$index = [regex]::Replace($index, $gaPattern, '$1./assets/genevieve-ga-official-locked.png?v=20260730.36$2')
$index = [regex]::Replace($index, $rootsPattern, '$1./assets/genevieve-tree-roots-official-locked.png?v=20260730.36$2')

# Known V32–V34 paths are also replaced directly.
$index = $index.Replace('./assets/ga-master-locked-2026-07-29.jpeg', './assets/genevieve-ga-official-locked.png?v=20260730.36')
$index = $index.Replace('./assets/ga-logo-square.png', './assets/genevieve-ga-official-locked.png?v=20260730.36')
$index = $index.Replace('./assets/genevieve-safety-from-roots-locked-2026-07-29.jpeg', './assets/genevieve-tree-roots-official-locked.png?v=20260730.36')
$index = $index.Replace('./assets/genevieve-roots.png', './assets/genevieve-tree-roots-official-locked.png?v=20260730.36')
$index = [regex]::Replace($index, '(\./assets/genevieve-ga-official-locked\.png)(?:\?v=[^"''\s>]*)?', '$1?v=20260730.36')
$index = [regex]::Replace($index, '(\./assets/genevieve-tree-roots-official-locked\.png)(?:\?v=[^"''\s>]*)?', '$1?v=20260730.36')

# Both the top and bottom Journey buttons must open Journey, not Travel.
$index = $index.Replace('data-go="travel" data-main="journey"', 'data-go="journey" data-main="journey"')
$index = $index.Replace('data-main="journey" data-go="travel"', 'data-main="journey" data-go="journey"')

# Add the dedicated Journey landing page once.
if ($index -notmatch 'id="journey"') {
  $journeyMarkup = Read-Text (Join-Path $ScriptDir "journey-section.html")
  $anchor = '<section class="screen" data-group="journey" id="before-leaving">'
  if ($index.Contains($anchor)) {
    $index = $index.Replace($anchor, $journeyMarkup + [Environment]::NewLine + $anchor)
  } else {
    $beforePattern = '(?is)(?=<section\b[^>]*\bid="before-leaving"[^>]*>)'
    $beforeRegex = New-Object System.Text.RegularExpressions.Regex -ArgumentList $beforePattern
    $index = $beforeRegex.Replace($index, $journeyMarkup + [Environment]::NewLine, 1)
  }
}

# Remove older temporary repair tags and install V36 in the correct order.
$index = [regex]::Replace($index, '(?im)^\s*<script[^>]+genevieve-v3[3-6]-(?:boot|repair)\.js[^>]*></script>\s*', '')
$bootTag = '<script src="./genevieve-v36-boot.js?v=20260730.36"></script>'
$repairTag = '<script src="./genevieve-v36-repair.js?v=20260730.36"></script>'
if ($index -match '</head>') { $index = $index.Replace('</head>', $bootTag + [Environment]::NewLine + '</head>') }
if ($index -match '</body>') { $index = $index.Replace('</body>', $repairTag + [Environment]::NewLine + '</body>') }
$index = Bump-Versions $index
Write-Text $indexPath $index
Write-Host "PASS: header visibility, first screen, logo paths and Journey navigation repaired" -ForegroundColor Green

# Add safe sizing without changing the locked artwork.
$stylesPath = Join-Path $Repo "styles.css"
if (Test-Path $stylesPath) {
  $styles = Bump-Versions (Read-Text $stylesPath)
  $marker = '/* GENEVIEVE V36 OFFICIAL LOGOS — LOCKED */'
  if ($styles -notmatch [regex]::Escape($marker)) {
    $styles += @"

$marker
.approved-ga-logo,
.header-roots-journey-art {
  display: block;
  max-width: 100%;
  object-fit: contain !important;
  object-position: center !important;
  background: #ffffff;
}

/* The full dashboard header belongs to Today only. */
html.genevieve-hide-main-header .topbar,
body.genevieve-hide-main-header .topbar {
  display: none !important;
}
"@
  }
  Write-Text $stylesPath $styles
}

# Make header visibility synchronous with navigation so pages open at their own top.
$appPath = Join-Path $Repo "app.js"
if (Test-Path $appPath) {
  $app = Read-Text $appPath
  $needle = '    const group=groupForScreen(id);'
  $htmlHeaderLine = "    document.documentElement.classList.toggle('genevieve-hide-main-header',group!=='today');"
  $bodyHeaderLine = "    document.body.classList.toggle('genevieve-hide-main-header',group!=='today');"
  if (-not $app.Contains($needle)) {
    throw "Could not locate the screen navigation function. Nothing was pushed."
  }
  if ($app -notmatch "document\.documentElement\.classList\.toggle\('genevieve-hide-main-header',group!=='today'\)") {
    $app = $app.Replace($needle, $needle + [Environment]::NewLine + $htmlHeaderLine)
  }
  if ($app -notmatch "document\.body\.classList\.toggle\('genevieve-hide-main-header',group!=='today'\)") {
    if ($app.Contains($htmlHeaderLine)) {
      $app = $app.Replace($htmlHeaderLine, $htmlHeaderLine + [Environment]::NewLine + $bodyHeaderLine)
    } else {
      $app = $app.Replace($needle, $needle + [Environment]::NewLine + $bodyHeaderLine)
    }
  }
  Write-Text $appPath $app
}

# Bump every cache/version marker so the iPhone cannot remain on the broken files.
foreach ($name in @("app.js", "repair.js", "service-worker.js", "sw.js", "manifest.webmanifest", "config.js")) {
  $path = Join-Path $Repo $name
  if (-not (Test-Path $path)) { continue }
  $text = Bump-Versions (Read-Text $path)
  Write-Text $path $text
}

# Fine-tooth-comb checks before committing.
$errors = New-Object System.Collections.Generic.List[string]
$warnings = New-Object System.Collections.Generic.List[string]
$index = Read-Text $indexPath

$required = @(
  "assets\genevieve-ga-official-locked.png",
  "assets\genevieve-tree-roots-official-locked.png",
  "assets\genevieve-ga-official-locked-2026-07-30.jpeg",
  "assets\genevieve-tree-roots-official-locked-2026-07-30.jpeg",
  "assets\ga-logo-192.png",
  "assets\ga-logo-512.png",
  "assets\ga-master-locked-2026-07-29.jpeg",
  "assets\genevieve-safety-from-roots-locked-2026-07-29.jpeg",
  "genevieve-v36-boot.js",
  "genevieve-v36-repair.js"
)
foreach ($relative in $required) {
  if (-not (Test-Path (Join-Path $Repo $relative))) { $errors.Add("Missing required file: $relative") }
}
if ($index -notmatch 'id="journey"') { $errors.Add("Dedicated Journey page is missing") }
if ($index -match 'data-go="travel" data-main="journey"') { $errors.Add("A Journey button still opens Travel") }
if ([regex]::Matches($index, 'data-go="journey" data-main="journey"').Count -lt 2) { $errors.Add("Top and bottom Journey buttons were not both repaired") }
if ($index -notmatch 'genevieve-ga-official-locked\.png\?v=20260730\.36') { $errors.Add("GA header logo does not use the exact locked V36 file") }
if ($index -notmatch 'genevieve-tree-roots-official-locked\.png\?v=20260730\.36') { $errors.Add("Tree/roots header logo does not use the exact locked V36 file") }
if ($index -notmatch 'genevieve-v36-boot\.js') { $errors.Add("V36 first-screen boot guard is missing") }
if ($index -notmatch 'genevieve-v36-repair\.js') { $errors.Add("V36 runtime repair guard is missing") }
$repairCheck = Read-Text (Join-Path $Repo 'genevieve-v36-repair.js')
if ($repairCheck -notmatch 'genevieveOfficialLogo') { $errors.Add("Official-logo mutation lock is missing") }
if ($repairCheck -notmatch 'data:image/jpeg;base64') { $errors.Add("Inline logo fallback is missing") }
$stylesCheck = if (Test-Path $stylesPath) { Read-Text $stylesPath } else { "" }
$appCheck = if (Test-Path $appPath) { Read-Text $appPath } else { "" }
if ($stylesCheck -notmatch 'genevieve-hide-main-header \.topbar') { $errors.Add("Today-only header CSS is missing") }
if ($appCheck -notmatch "document\.documentElement\.classList\.toggle\('genevieve-hide-main-header',group!=='today'\)") { $errors.Add("Navigation does not switch the HTML header state by page group") }
if ($appCheck -notmatch "document\.body\.classList\.toggle\('genevieve-hide-main-header',group!=='today'\)") { $errors.Add("Navigation does not switch the body header state by page group") }

$ids = @{}
[regex]::Matches($index, 'id="([^"]+)"') | ForEach-Object { $ids[$_.Groups[1].Value] = $true }
$targets = [regex]::Matches($index, 'data-go="([^"]+)"') | ForEach-Object { $_.Groups[1].Value } | Select-Object -Unique
foreach ($target in $targets) {
  if (-not $ids.ContainsKey($target)) { $warnings.Add("Navigation target has no static page: $target") }
}

$localReferencePattern = '(?i)(?:src|href)=["'']\./([^"''?#]+)'
[regex]::Matches($index, $localReferencePattern) | ForEach-Object {
  $relative = $_.Groups[1].Value.Replace('/', '\')
  if (-not (Test-Path (Join-Path $Repo $relative))) { $warnings.Add("Referenced local file is absent: $relative") }
}

$node = Get-Command node.exe -ErrorAction SilentlyContinue
if ($node) {
  foreach ($script in @("app.js", "repair.js", "service-worker.js", "genevieve-v36-boot.js", "genevieve-v36-repair.js")) {
    $path = Join-Path $Repo $script
    if (Test-Path $path) {
      & $node.Source --check $path 2>$null
      if ($LASTEXITCODE -ne 0) { $errors.Add("JavaScript syntax check failed: $script") }
    }
  }
} else {
  $warnings.Add("Node.js was not found, so JavaScript syntax checking was skipped")
}

$report = @(
  "GENEVIEVE DOG PARK V36 OFFICIAL LOGO LOCK REPORT",
  "Created: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss zzz')",
  "Repository: $Repo",
  "Backup: $Backup",
  "",
  "Completed repairs:",
  "- First launch opens Today with the full dashboard header.",
  "- Journey, Parks, Dogs and More hide the full dashboard header.",
  "- Back one step, page title and bottom navigation remain visible.",
  "- Exact uploaded GA and tree/roots logos restored and locked with inline fallbacks.",
  "- Journey opens its own page.",
  "- Grey Nomad Travel remains a separate Journey choice.",
  "- V32-V35 cache markers bumped to V36.",
  "- Static navigation and local-file references audited.",
  "",
  "Errors: $($errors.Count)",
  ($errors | ForEach-Object { "ERROR: $_" }),
  "Warnings: $($warnings.Count)",
  ($warnings | ForEach-Object { "WARNING: $_" })
)
$reportPath = Join-Path $Repo "GENEVIEVE_V36_REPAIR_REPORT.txt"
Write-Text $reportPath (($report | ForEach-Object { [string]$_ }) -join [Environment]::NewLine)

if ($errors.Count -gt 0) {
  Write-Host "" 
  Write-Host "STOPPED: the checker found $($errors.Count) error(s). Nothing will be pushed." -ForegroundColor Red
  $errors | ForEach-Object { Write-Host " - $_" -ForegroundColor Red }
  Write-Host "Original backup: $Backup" -ForegroundColor Yellow
  exit 1
}

Write-Host "PASS: local repair checks completed" -ForegroundColor Green
if ($warnings.Count -gt 0) {
  Write-Host "Audit notes were written to: $reportPath" -ForegroundColor Yellow
}

# Commit only after the checker passes.
& $GitExe -C $Repo add -A
if ($LASTEXITCODE -ne 0) { throw "Git could not stage the repair." }
& $GitExe -C $Repo diff --cached --check
if ($LASTEXITCODE -ne 0) { throw "Git found invalid whitespace or merge markers. Nothing was pushed." }

$staged = Git-Output $Repo @("diff", "--cached", "--name-only")
if ($staged) {
  $name = Git-Output $Repo @("config", "user.name")
  if (-not $name) { & $GitExe -C $Repo config user.name "Tracey Ann Kennedy" }
  $email = Git-Output $Repo @("config", "user.email")
  if (-not $email) { & $GitExe -C $Repo config user.email "tracey727@users.noreply.github.com" }

  & $GitExe -C $Repo commit -m "Lock exact official logos in V36"
  if ($LASTEXITCODE -ne 0) { throw "The repair passed, but Git could not create the commit." }
  Write-Host "PASS: official-logo repair committed" -ForegroundColor Green
} else {
  Write-Host "The V36 official-logo lock was already present; no new commit was needed." -ForegroundColor Yellow
}

# Push main. If the remote moved during the repair, rebase once and retry.
Write-Host "Pushing V36 to GitHub ..." -ForegroundColor Cyan
$pushOutput = & $GitExe -C $Repo push origin main 2>&1
$pushCode = $LASTEXITCODE
$pushOutput | ForEach-Object { Write-Host $_ }
if ($pushCode -ne 0) {
  Write-Host "Remote changed; trying one safe rebase and push ..." -ForegroundColor Yellow
  & $GitExe -C $Repo pull --rebase origin main
  if ($LASTEXITCODE -eq 0) {
    $pushOutput = & $GitExe -C $Repo push origin main 2>&1
    $pushCode = $LASTEXITCODE
    $pushOutput | ForEach-Object { Write-Host $_ }
  } else {
    & $GitExe -C $Repo rebase --abort 2>$null
  }
}

if ($pushCode -ne 0) {
  Write-Host "" 
  Write-Host "The repair is complete and committed, but GitHub would not accept the automatic push." -ForegroundColor Red
  Write-Host "Open this exact folder in GitHub Desktop and press Push origin:" -ForegroundColor Yellow
  Write-Host $Repo -ForegroundColor White
  Start-Process explorer.exe $Repo
  exit 2
}

Write-Host "PASS: pushed to GitHub main" -ForegroundColor Green

# Wait briefly for Vercel and verify the actual public files rather than assuming deployment worked.
Write-Host "Waiting for Vercel and checking the live app ..." -ForegroundColor Cyan
$liveVerified = $false
for ($attempt = 1; $attempt -le 20; $attempt++) {
  try {
    $nonce = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
    $htmlUrl = $LiveBase + "?genevieveVersion=36&verify=" + $nonce
    $htmlResponse = Invoke-WebRequest -UseBasicParsing -Uri $htmlUrl -Headers @{"Cache-Control"="no-cache"} -TimeoutSec 15
    $gaResponse = Invoke-WebRequest -UseBasicParsing -Uri ($LiveBase + "assets/genevieve-ga-official-locked.png?v=" + $nonce) -Headers @{"Cache-Control"="no-cache"} -TimeoutSec 15
    $rootsResponse = Invoke-WebRequest -UseBasicParsing -Uri ($LiveBase + "assets/genevieve-tree-roots-official-locked.png?v=" + $nonce) -Headers @{"Cache-Control"="no-cache"} -TimeoutSec 15

    $cssResponse = Invoke-WebRequest -UseBasicParsing -Uri ($LiveBase + "styles.css?v=" + $nonce) -Headers @{"Cache-Control"="no-cache"} -TimeoutSec 15
    $appResponse = Invoke-WebRequest -UseBasicParsing -Uri ($LiveBase + "app.js?v=" + $nonce) -Headers @{"Cache-Control"="no-cache"} -TimeoutSec 15
    $htmlOk = ($htmlResponse.StatusCode -eq 200) -and ($htmlResponse.Content -match 'genevieve-v36-repair\.js') -and ($htmlResponse.Content -match 'id="journey"') -and ($htmlResponse.Content -notmatch 'data-go="travel" data-main="journey"')
    $assetsOk = ($gaResponse.StatusCode -eq 200) -and ($rootsResponse.StatusCode -eq 200)
    $headerOk = ($cssResponse.StatusCode -eq 200) -and ($cssResponse.Content -match 'genevieve-hide-main-header') -and ($appResponse.StatusCode -eq 200) -and ($appResponse.Content -match 'genevieve-hide-main-header')

    if ($htmlOk -and $assetsOk -and $headerOk) {
      $liveVerified = $true
      break
    }
  } catch {
    # Deployment may still be building. Retry below.
  }
  Start-Sleep -Seconds 6
}

Write-Host "" 
if ($liveVerified) {
  Write-Host "LIVE FIX VERIFIED: the large header appears on Today only; Journey, Parks, Dogs and More open without it." -ForegroundColor Green
} else {
  Write-Host "GitHub push succeeded. Vercel was still building or could not be verified within two minutes." -ForegroundColor Yellow
  Write-Host "The V36 logo-locked app will open below; refresh it once if the old screen appears." -ForegroundColor Yellow
}

$openUrl = $LiveBase + "?genevieveVersion=36#today"
Start-Process $openUrl
Write-Host "Opened: $openUrl" -ForegroundColor Cyan
Write-Host "Repair folder: $Repo" -ForegroundColor DarkGray
Write-Host "Backup: $Backup" -ForegroundColor DarkGray
exit 0
