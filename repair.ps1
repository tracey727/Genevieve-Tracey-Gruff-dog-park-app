param(
  [switch]$Deploy,
  [string]$RepoPath = ''
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version 2.0
$BuildVersion = '2026.07.30.36'
$CacheVersion = '20260730.36'
$QueryVersion = '36'
$ScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$LogPath = Join-Path $ScriptRoot 'V36_REPAIR_RUN_LOG.txt'

function Write-Status([string]$Message) {
  $line = ('[{0}] {1}' -f (Get-Date -Format 'HH:mm:ss'), $Message)
  Write-Host $line
  Add-Content -LiteralPath $LogPath -Value $line -Encoding UTF8
}

function Read-Utf8([string]$Path) {
  return [System.IO.File]::ReadAllText($Path)
}

function Write-Utf8([string]$Path, [string]$Text) {
  $utf8 = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText($Path, $Text, $utf8)
}

function Add-Candidate([System.Collections.ArrayList]$List, [string]$Path) {
  if ([string]::IsNullOrWhiteSpace($Path)) { return }
  try { $full = [System.IO.Path]::GetFullPath($Path) } catch { return }
  if (-not (Test-Path -LiteralPath $full -PathType Container)) { return }
  if (-not (Test-Path -LiteralPath (Join-Path $full 'index.html'))) { return }
  if (-not (Test-Path -LiteralPath (Join-Path $full 'app.js'))) { return }
  if (-not (Test-Path -LiteralPath (Join-Path $full 'styles.css'))) { return }
  if (-not $List.Contains($full)) { [void]$List.Add($full) }
}

function Uri-To-WindowsPath([string]$Value) {
  try {
    if ($Value -match '^file:///') {
      $uri = [Uri]$Value
      return [Uri]::UnescapeDataString($uri.LocalPath).TrimStart('/') -replace '/', '\\'
    }
  } catch {}
  return $null
}

function Find-GitExe {
  $cmd = Get-Command git.exe -ErrorAction SilentlyContinue
  if ($cmd) { return $cmd.Source }
  $roots = @(
    (Join-Path $env:LOCALAPPDATA 'GitHubDesktop'),
    (Join-Path $env:ProgramFiles 'Git'),
    (Join-Path ${env:ProgramFiles(x86)} 'Git')
  ) | Where-Object { $_ -and (Test-Path $_) }
  foreach ($root in $roots) {
    $git = Get-ChildItem -LiteralPath $root -Filter git.exe -File -Recurse -ErrorAction SilentlyContinue |
      Where-Object { $_.FullName -match '\\cmd\\git\.exe$|\\bin\\git\.exe$' } |
      Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if ($git) { return $git.FullName }
  }
  return $null
}

function Find-Repository([string]$ExplicitPath) {
  $candidates = New-Object System.Collections.ArrayList
  Add-Candidate $candidates $ExplicitPath
  Add-Candidate $candidates (Get-Location).Path
  Add-Candidate $candidates $ScriptRoot
  Add-Candidate $candidates (Split-Path -Parent $ScriptRoot)

  $known = @(
    (Join-Path $env:USERPROFILE 'GenevieveProjects\Genevieve-Animals-Dog-Parks-App'),
    (Join-Path $env:USERPROFILE 'GenevieveProjects\Genevieve-Tracey-Gruff-dog-park-app'),
    (Join-Path $env:USERPROFILE 'Documents\GitHub\Genevieve-Animals-Dog-Parks-App'),
    (Join-Path $env:USERPROFILE 'Documents\GitHub\Genevieve-Tracey-Gruff-dog-park-app'),
    (Join-Path $env:USERPROFILE 'Desktop\Genevieve-Animals-Dog-Parks-App'),
    (Join-Path $env:USERPROFILE 'Desktop\Genevieve-Tracey-Gruff-dog-park-app')
  )
  foreach ($path in $known) { Add-Candidate $candidates $path }

  # Read the most recently used VS Code workspaces so the open project is preferred.
  $workspaceRoot = Join-Path $env:APPDATA 'Code\User\workspaceStorage'
  if (Test-Path $workspaceRoot) {
    Get-ChildItem -LiteralPath $workspaceRoot -Filter workspace.json -File -Recurse -ErrorAction SilentlyContinue |
      Sort-Object LastWriteTime -Descending | Select-Object -First 30 | ForEach-Object {
        try {
          $raw = Read-Utf8 $_.FullName
          foreach ($match in [regex]::Matches($raw, 'file:///[^"}]+')) {
            $path = Uri-To-WindowsPath $match.Value
            Add-Candidate $candidates $path
          }
        } catch {}
      }
  }

  # Fallback search is limited to normal project folders, not the whole computer.
  $searchRoots = @(
    (Join-Path $env:USERPROFILE 'GenevieveProjects'),
    (Join-Path $env:USERPROFILE 'Documents\GitHub'),
    (Join-Path $env:USERPROFILE 'Desktop')
  ) | Where-Object { Test-Path $_ }
  foreach ($root in $searchRoots) {
    Get-ChildItem -LiteralPath $root -Filter index.html -File -Recurse -ErrorAction SilentlyContinue |
      Select-Object -First 100 | ForEach-Object { Add-Candidate $candidates $_.DirectoryName }
  }

  if ($candidates.Count -eq 0) {
    throw 'I could not find the Dog Park repository. Keep VS Code open on the project and run this file again, or move this repair folder into the repository and rerun it.'
  }

  $gitExe = Find-GitExe
  $ranked = foreach ($path in $candidates) {
    $score = 0
    $index = ''
    try { $index = Read-Utf8 (Join-Path $path 'index.html') } catch {}
    if ($index -match 'GENEVIEVE App' -and $index -match 'Dog Park') { $score += 80 }
    if ($path -match '(?i)genevieve.*dog.*park|dog.*park.*genevieve') { $score += 40 }
    if (Test-Path (Join-Path $path '.git')) { $score += 100 }
    if (Test-Path (Join-Path $path 'assets')) { $score += 10 }
    if ($gitExe -and (Test-Path (Join-Path $path '.git'))) {
      try {
        $remote = & $gitExe -C $path remote get-url origin 2>$null
        if ($remote -match 'Genevieve-Tracey-Gruff-dog-park-app') { $score += 300 }
        elseif ($remote -match '(?i)genevieve.*dog.*park') { $score += 150 }
      } catch {}
    }
    $last = (Get-Item -LiteralPath (Join-Path $path 'index.html')).LastWriteTime
    [pscustomobject]@{ Path=$path; Score=$score; LastWrite=$last }
  }
  return ($ranked | Sort-Object Score,LastWrite -Descending | Select-Object -First 1).Path
}

function Backup-CurrentFiles([string]$Repo) {
  $stamp = Get-Date -Format 'yyyyMMdd_HHmmss'
  $backup = Join-Path $Repo ('_BACKUP_BEFORE_V36_' + $stamp)
  New-Item -ItemType Directory -Path $backup -Force | Out-Null
  $items = @('index.html','app.js','styles.css','config.js','manifest.webmanifest','service-worker.js','sw.js','vercel.json')
  foreach ($item in $items) {
    $source = Join-Path $Repo $item
    if (Test-Path $source) {
      $destination = Join-Path $backup $item
      New-Item -ItemType Directory -Path (Split-Path -Parent $destination) -Force | Out-Null
      Copy-Item -LiteralPath $source -Destination $destination -Force
    }
  }
  $assetsBackup = Join-Path $backup 'assets'
  New-Item -ItemType Directory -Path $assetsBackup -Force | Out-Null
  foreach ($name in @(
    'ga-master-locked-2026-07-29.jpeg',
    'genevieve-safety-from-roots-locked-2026-07-29.jpeg',
    'ga-master-icon-64-v29.png',
    'ga-master-apple-touch-180-v29.png',
    'ga-master-app-icon-192-v29.png',
    'ga-master-app-icon-512-v29.png'
  )) {
    $source = Join-Path $Repo ('assets\' + $name)
    if (Test-Path $source) { Copy-Item -LiteralPath $source -Destination (Join-Path $assetsBackup $name) -Force }
  }
  return $backup
}

function Patch-Index([string]$Path) {
  $text = Read-Utf8 $Path
  $text = [regex]::Replace($text, 'v=20\d{6}\.\d+', ('v=' + $CacheVersion))
  $text = [regex]::Replace($text, 'Version\s+2026\.\d{2}\.\d{2}\.\d+', ('Version ' + $BuildVersion))
  $text = $text.Replace('./assets/GA-MASTER-LOCKED-2026-07-29.jpeg','./assets/ga-master-locked-2026-07-29.jpeg')
  $text = [regex]::Replace($text, 'src=["''][^"'']*(?:ga-master-locked|GA-MASTER-LOCKED)[^"'']*["'']', 'src="./assets/ga-master-locked-2026-07-29.jpeg"', 1)
  $text = [regex]::Replace($text, 'src=["''][^"'']*(?:genevieve-safety-from-roots|SAFETY_FROM_ROOTS)[^"'']*["'']', 'src="./assets/genevieve-safety-from-roots-locked-2026-07-29.jpeg"', 1)
  $text = [regex]::Replace($text, '<body(?:\s+class=["''][^"'']*["''])?\s*>', '<body class="first-page-active">', 1)
  $text = [regex]::Replace($text, 'data-go=["''][^"'']+["'']\s+data-main=["'']journey["'']', 'data-go="journey" data-main="journey"', 1)

  if ($text -notmatch 'id=["'']journey["'']') {
    $journey = @'
<section class="screen" data-group="journey" id="journey">
<section class="hero card journey-home-hero">
<p class="eyebrow">YOUR JOURNEY</p>
<h2>Choose the part of your journey</h2>
<p>Plan the visit from home, travel and arrive safely, check in or out, or open the separate long-distance trip planner.</p>
</section>
<section aria-label="Journey choices" class="page-grid journey-home-grid">
<button data-go="before-leaving" type="button"><b>1. Before leaving home</b><small>Dog, weather, destination, documents and supplies.</small></button>
<button data-go="route-arrival" type="button"><b>2. Route and arrival</b><small>Drive, park, approach the gate, enter and leave safely.</small></button>
<button data-go="checkin" type="button"><b>3. Check in or out</b><small>Optional community presence and current dog status.</small></button>
<button data-go="travel" type="button"><b>Grey Nomad Trip Planner</b><small>Long-distance routes, rest stops, stays, food and emergency-vet planning.</small></button>
<button data-go="heat-hazards" type="button"><b>Heat and hazards</b><small>Review weather, surfaces and current local reports.</small></button>
<button data-go="emergency" type="button"><b>Emergency and services</b><small>Open urgent help and other support services.</small></button>
</section>
</section>
'@
    $anchor = '(?=<section[^>]*class=["''][^"'']*screen[^"'']*["''][^>]*id=["'']before-leaving["''][^>]*>)'
    if ([regex]::IsMatch($text, $anchor)) {
      $text = [regex]::Replace($text, $anchor, [System.Text.RegularExpressions.MatchEvaluator]{ param($m) $journey }, 1)
    } else {
      throw 'The Journey screen was missing and the safe insertion point could not be found.'
    }
  }
  Write-Utf8 $Path $text
}

function Patch-AppJs([string]$Path) {
  $text = Read-Utf8 $Path
  $text = [regex]::Replace($text, '2026\.\d{2}\.\d{2}\.\d+', $BuildVersion)
  $text = [regex]::Replace($text, '2026\d{4}\.\d+', $CacheVersion)
  $text = [regex]::Replace($text, 'genevieve_v\d+_[A-Za-z0-9_]*reset_done', 'genevieve_v36_full_repair_reset_done')
  $text = [regex]::Replace($text, '(searchParams\.set\(["'']genevieveVersion["'']\s*,\s*["''])\d+(["'']\))', ('$1' + $QueryVersion + '$2'))

  if ($text -notmatch "first-page-active',id==='today'") {
    $screenTogglePattern = '(\$\$\(["'']\.screen["'']\)\.forEach\(s=>s\.classList\.toggle\(["'']active["''],s\.id===id\)\);)'
    if ([regex]::IsMatch($text, $screenTogglePattern)) {
      $replacement = '$1' + "`r`n    document.body.classList.toggle('first-page-active',id==='today');`r`n    document.body.dataset.currentScreen=id;"
      $text = [regex]::Replace($text, $screenTogglePattern, $replacement, 1)
    } else {
      $groupPattern = '(const\s+group\s*=\s*groupForScreen\(id\);)'
      if ([regex]::IsMatch($text, $groupPattern)) {
        $replacement = "document.body.classList.toggle('first-page-active',id==='today');`r`n    document.body.dataset.currentScreen=id;`r`n    " + '$1'
        $text = [regex]::Replace($text, $groupPattern, $replacement, 1)
      } else {
        throw 'The page-change function could not be safely patched.'
      }
    }
  }

  $scrollPattern = 'if\s*\(currentId\s*!==\s*id\)\s*\{\s*const\s+header\s*=\s*document\.querySelector\(["'']\.topbar["'']\);\s*const\s+headerBottom\s*=.*?window\.scrollTo\(\{top:Math\.max\(0,headerBottom\),behavior:.*?\}\);\s*\}'
  if ([regex]::IsMatch($text, $scrollPattern, [System.Text.RegularExpressions.RegexOptions]::Singleline)) {
    $newScroll = "if(currentId!==id){`r`n      window.scrollTo({top:0,behavior:document.body.classList.contains('reduced-motion')?'auto':'smooth'});`r`n    }"
    $text = [regex]::Replace($text, $scrollPattern, $newScroll, [System.Text.RegularExpressions.RegexOptions]::Singleline)
  }

  Write-Utf8 $Path $text
}

function Patch-Styles([string]$Path) {
  $text = Read-Utf8 $Path
  $marker = 'GENEVIEVE V36 FULL REPAIR'
  if ($text -notmatch [regex]::Escape($marker)) {
    $patch = @'

/* GENEVIEVE V36 FULL REPAIR — exact archived logos, first-page-only header and stable page routing */
body:not(.first-page-active) .topbar {
  display: none !important;
}
.approved-ga-logo,
.header-roots-journey-art {
  object-fit: contain !important;
  object-position: center !important;
  background: #ffffff !important;
}
.header-tree-lockup {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  overflow: hidden !important;
  background: #ffffff !important;
}
.header-tree-lockup .header-roots-journey-art {
  width: 100% !important;
  height: 100% !important;
  max-width: 100% !important;
  max-height: 100% !important;
}
'@
    $text += $patch
  }
  Write-Utf8 $Path $text
}

function Patch-Config([string]$Path) {
  if (-not (Test-Path $Path)) { return }
  $text = Read-Utf8 $Path
  $text = [regex]::Replace($text, '2026\.\d{2}\.\d{2}\.\d+', $BuildVersion)
  Write-Utf8 $Path $text
}

function Write-Manifest([string]$Path) {
  $manifest = @'
{
  "name": "GENEVIEVE App™ Dog Parks — Safety & Compatibility System",
  "short_name": "GENEVIEVE Dog Parks",
  "description": "Plan, travel, enter, supervise, interact and leave dog parks safely.",
  "id": "./?genevieveVersion=36",
  "start_url": "./?genevieveVersion=36#today",
  "scope": "./",
  "display": "standalone",
  "orientation": "portrait-primary",
  "background_color": "#fff7fb",
  "theme_color": "#06391f",
  "icons": [
    {"src":"./assets/ga-master-app-icon-192-v29.png","sizes":"192x192","type":"image/png","purpose":"any"},
    {"src":"./assets/ga-master-app-icon-512-v29.png","sizes":"512x512","type":"image/png","purpose":"any"}
  ],
  "shortcuts": [
    {"name":"Today","short_name":"Today","url":"./?genevieveVersion=36#today"},
    {"name":"Journey","short_name":"Journey","url":"./?genevieveVersion=36#journey"},
    {"name":"Parks","short_name":"Parks","url":"./?genevieveVersion=36#park-search"},
    {"name":"Dogs","short_name":"Dogs","url":"./?genevieveVersion=36#dog-list"}
  ]
}
'@
  Write-Utf8 $Path $manifest
}

function Write-ServiceWorker([string]$Path) {
  $worker = @'
'use strict';
const CACHE_NAME = 'genevieve-dog-parks-safety-compatibility-2026-07-30-v36';
const CORE_ASSETS = [
  './',
  './index.html',
  './styles.css?v=20260730.36',
  './config.js?v=20260730.36',
  './logic.js?v=20260730.36',
  './notification-logic.js?v=20260730.36',
  './app.js?v=20260730.36',
  './manifest.webmanifest?v=20260730.36',
  './assets/ga-master-locked-2026-07-29.jpeg',
  './assets/genevieve-safety-from-roots-locked-2026-07-29.jpeg',
  './assets/ga-master-icon-64-v29.png',
  './assets/ga-master-apple-touch-180-v29.png',
  './assets/ga-master-app-icon-192-v29.png',
  './assets/ga-master-app-icon-512-v29.png'
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await Promise.all(CORE_ASSETS.map(async asset => {
      try {
        const response = await fetch(asset, {cache: 'reload'});
        if (response.ok) await cache.put(asset, response.clone());
      } catch (error) {
        console.warn('Optional install asset was not cached:', asset, error);
      }
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.includes('genevieve') && key !== CACHE_NAME).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request, {cache: 'no-store'});
    if (response && response.ok) await cache.put(request, response.clone());
    return response;
  } catch (error) {
    return (await cache.match(request)) || (await cache.match('./index.html')) || Response.error();
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response && response.ok) await cache.put(request, response.clone());
  return response;
}

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (request.mode === 'navigate' || /\.(?:html|js|css|webmanifest)$/i.test(url.pathname)) {
    event.respondWith(networkFirst(request));
    return;
  }
  if (/\.(?:png|jpe?g|gif|svg|webp|ico)$/i.test(url.pathname)) {
    event.respondWith(cacheFirst(request));
  }
});

self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING' || event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('push', event => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch { data = {body: event.data?.text() || ''}; }
  const title = data.title || 'GENEVIEVE Dog Parks';
  const options = {
    body: data.body || '',
    icon: './assets/ga-master-app-icon-192-v29.png',
    badge: './assets/ga-master-icon-64-v29.png',
    data: {url: data.url || './?genevieveVersion=36#today'},
    tag: data.tag || 'genevieve-dog-parks'
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const destination = event.notification.data?.url || './?genevieveVersion=36#today';
  event.waitUntil((async () => {
    const clientsList = await clients.matchAll({type: 'window', includeUncontrolled: true});
    for (const client of clientsList) {
      if ('focus' in client) {
        await client.navigate(destination);
        return client.focus();
      }
    }
    if (clients.openWindow) return clients.openWindow(destination);
  })());
});
'@
  Write-Utf8 $Path $worker
}

function Write-Vercel([string]$Path) {
  $vercel = @'
{
  "cleanUrls": false,
  "trailingSlash": false,
  "headers": [
    {"source":"/","headers":[{"key":"Cache-Control","value":"no-store, max-age=0"}]},
    {"source":"/index.html","headers":[{"key":"Cache-Control","value":"no-store, max-age=0"}]},
    {"source":"/app.js","headers":[{"key":"Cache-Control","value":"no-store, max-age=0"}]},
    {"source":"/styles.css","headers":[{"key":"Cache-Control","value":"no-store, max-age=0"}]},
    {"source":"/config.js","headers":[{"key":"Cache-Control","value":"no-store, max-age=0"}]},
    {"source":"/logic.js","headers":[{"key":"Cache-Control","value":"no-store, max-age=0"}]},
    {"source":"/notification-logic.js","headers":[{"key":"Cache-Control","value":"no-store, max-age=0"}]},
    {"source":"/service-worker.js","headers":[{"key":"Cache-Control","value":"no-store, max-age=0"},{"key":"Service-Worker-Allowed","value":"/"}]},
    {"source":"/manifest.webmanifest","headers":[{"key":"Cache-Control","value":"no-store, max-age=0"},{"key":"Content-Type","value":"application/manifest+json; charset=utf-8"}]}
  ]
}
'@
  Write-Utf8 $Path $vercel
}

function Run-Checks([string]$Repo) {
  $results = New-Object System.Collections.Generic.List[string]
  $failures = New-Object System.Collections.Generic.List[string]
  function Pass([string]$m) { $results.Add('PASS - ' + $m) }
  function Fail([string]$m) { $results.Add('FAIL - ' + $m); $failures.Add($m) }

  foreach ($file in @('index.html','app.js','styles.css','config.js','logic.js','notification-logic.js','manifest.webmanifest','service-worker.js','vercel.json')) {
    if (Test-Path (Join-Path $Repo $file)) { Pass "$file exists" } else { Fail "$file is missing" }
  }
  foreach ($file in @(
    'assets\ga-master-locked-2026-07-29.jpeg',
    'assets\genevieve-safety-from-roots-locked-2026-07-29.jpeg',
    'assets\ga-master-icon-64-v29.png',
    'assets\ga-master-apple-touch-180-v29.png',
    'assets\ga-master-app-icon-192-v29.png',
    'assets\ga-master-app-icon-512-v29.png'
  )) {
    if (Test-Path (Join-Path $Repo $file)) { Pass "$file exists" } else { Fail "$file is missing" }
  }

  $index = Read-Utf8 (Join-Path $Repo 'index.html')
  if ($index -match 'data-go=["'']journey["'']\s+data-main=["'']journey["'']') { Pass 'Journey button opens the Journey page' } else { Fail 'Journey main button is not connected to the Journey page' }
  if ($index -match 'id=["'']journey["'']') { Pass 'Journey has its own screen' } else { Fail 'Journey screen is missing' }
  if ($index -match 'class=["''][^"'']*first-page-active') { Pass 'Today starts with the header visible' } else { Fail 'First-page header class is missing' }
  if ($index -match 'ga-master-locked-2026-07-29\.jpeg') { Pass 'Exact GA master is referenced' } else { Fail 'Exact GA master is not referenced' }
  if ($index -match 'genevieve-safety-from-roots-locked-2026-07-29\.jpeg') { Pass 'Exact Tree and Roots master is referenced' } else { Fail 'Exact Tree and Roots master is not referenced' }

  $ids = @{}
  foreach ($m in [regex]::Matches($index, '\bid=["'']([^"'']+)["'']')) {
    $id = $m.Groups[1].Value
    if ($ids.ContainsKey($id)) { $ids[$id] += 1 } else { $ids[$id] = 1 }
  }
  $dupes = @($ids.GetEnumerator() | Where-Object { $_.Value -gt 1 } | ForEach-Object { $_.Key })
  if ($dupes.Count -eq 0) { Pass 'No duplicate HTML ids were found' } else { Fail ('Duplicate HTML ids: ' + ($dupes -join ', ')) }

  $screenIds = @{}
  foreach ($m in [regex]::Matches($index, '<section[^>]*class=["''][^"'']*\bscreen\b[^"'']*["''][^>]*id=["'']([^"'']+)["'']')) { $screenIds[$m.Groups[1].Value] = $true }
  $missingTargets = New-Object System.Collections.Generic.List[string]
  foreach ($m in [regex]::Matches($index, '\bdata-go=["'']([^"'']+)["'']')) {
    $target = $m.Groups[1].Value
    if (-not $screenIds.ContainsKey($target) -and -not $missingTargets.Contains($target)) { $missingTargets.Add($target) }
  }
  if ($missingTargets.Count -eq 0) { Pass 'Every navigation button has a matching page' } else { Fail ('Navigation targets without pages: ' + ($missingTargets -join ', ')) }

  $relativeAssets = New-Object System.Collections.Generic.List[string]
  foreach ($m in [regex]::Matches($index, '(?:src|href)=["'']\./([^"''?#]+)')) {
    $rel = $m.Groups[1].Value -replace '/', '\\'
    if (-not $relativeAssets.Contains($rel)) { $relativeAssets.Add($rel) }
  }
  $missingFiles = @($relativeAssets | Where-Object { -not (Test-Path (Join-Path $Repo $_)) })
  if ($missingFiles.Count -eq 0) { Pass 'All local HTML file references exist' } else { Fail ('Missing local references: ' + ($missingFiles -join ', ')) }

  $app = Read-Utf8 (Join-Path $Repo 'app.js')
  $styles = Read-Utf8 (Join-Path $Repo 'styles.css')
  if ($app -match "first-page-active',id==='today'") { Pass 'Header visibility changes with the active page' } else { Fail 'Header page-state code is missing' }
  if ($styles -match 'body:not\(\.first-page-active\) \.topbar') { Pass 'Header is hidden away from Today' } else { Fail 'First-page-only header CSS is missing' }
  $versionFiles = @('index.html','app.js','config.js','manifest.webmanifest','service-worker.js')
  $oldVersionHits = New-Object System.Collections.Generic.List[string]
  foreach ($file in $versionFiles) {
    $path = Join-Path $Repo $file
    if (Test-Path $path) {
      $raw = Read-Utf8 $path
      if ($raw -match '20260729\.32|20260730\.35|2026\.07\.29\.32|2026\.07\.30\.35|genevieveVersion["'']?\s*[,=:]\s*["'']?(32|35)') { $oldVersionHits.Add($file) }
    }
  }
  if ($oldVersionHits.Count -eq 0) { Pass 'No stale V32 or V35 cache references remain' } else { Fail ('Old version references remain in: ' + ($oldVersionHits -join ', ')) }

  $node = Get-Command node.exe -ErrorAction SilentlyContinue
  if ($node) {
    foreach ($file in @('app.js','logic.js','notification-logic.js','backend.js','config.js','service-worker.js')) {
      $path = Join-Path $Repo $file
      if (Test-Path $path) {
        & $node.Source --check $path *> $null
        if ($LASTEXITCODE -eq 0) { Pass "$file passes JavaScript syntax check" } else { Fail "$file failed JavaScript syntax check" }
      }
    }
  } else {
    $results.Add('INFO - Node.js was not installed, so browser JavaScript syntax checks were skipped.')
  }

  $report = @(
    'GENEVIEVE App Dog Park - V36 Full Repair Report',
    ('Generated: ' + (Get-Date -Format 'yyyy-MM-dd HH:mm:ss zzz')),
    ('Repository: ' + $Repo),
    ('Build: ' + $BuildVersion),
    '',
    ($results -join "`r`n"),
    '',
    ('RESULT: ' + $(if ($failures.Count -eq 0) { 'ALL AUTOMATED CHECKS PASSED' } else { "$($failures.Count) CHECK(S) NEED ATTENTION" }))
  ) -join "`r`n"
  $reportPath = Join-Path $Repo 'V36_REPAIR_REPORT.txt'
  Write-Utf8 $reportPath $report
  Write-Host ''
  Write-Host $report
  return [pscustomobject]@{ Passed=($failures.Count -eq 0); ReportPath=$reportPath; Failures=$failures }
}

function Ensure-GitIdentity([string]$Git, [string]$Repo) {
  $name = (& $Git -C $Repo config user.name 2>$null)
  $email = (& $Git -C $Repo config user.email 2>$null)
  if ([string]::IsNullOrWhiteSpace($name)) { & $Git -C $Repo config user.name 'Tracey Kennedy' | Out-Null }
  if ([string]::IsNullOrWhiteSpace($email)) { & $Git -C $Repo config user.email 'tracey727@users.noreply.github.com' | Out-Null }
}

function Deploy-To-Main([string]$Repo) {
  $git = Find-GitExe
  if (-not $git) { throw 'Git was not found. GitHub Desktop must be installed and signed in before automatic deployment can run.' }
  if (-not (Test-Path (Join-Path $Repo '.git'))) { throw 'The selected project is not a Git repository, so it was repaired locally but cannot be pushed automatically.' }
  $remote = (& $git -C $Repo remote get-url origin 2>$null)
  if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($remote)) { throw 'This repository has no GitHub origin remote.' }
  Write-Status ('GitHub repository: ' + $remote)
  Ensure-GitIdentity $git $Repo

  $changed = @(
    'index.html','app.js','styles.css','config.js','manifest.webmanifest','service-worker.js','sw.js','vercel.json','V36_REPAIR_REPORT.txt',
    'assets/ga-master-locked-2026-07-29.jpeg',
    'assets/genevieve-safety-from-roots-locked-2026-07-29.jpeg',
    'assets/ga-master-icon-64-v29.png',
    'assets/ga-master-apple-touch-180-v29.png',
    'assets/ga-master-app-icon-192-v29.png',
    'assets/ga-master-app-icon-512-v29.png'
  )
  foreach ($file in $changed) {
    if (Test-Path (Join-Path $Repo ($file -replace '/', '\\'))) { & $git -C $Repo add -- $file | Out-Null }
  }
  $staged = (& $git -C $Repo diff --cached --name-only)
  if (-not [string]::IsNullOrWhiteSpace(($staged -join ''))) {
    & $git -C $Repo commit -m 'Fix V36 logos navigation header and cache' | Out-Host
    if ($LASTEXITCODE -ne 0) { throw 'The local repair was made, but Git could not create the preservation commit.' }
  } else {
    Write-Status 'The working branch already contains the V36 repair files.'
  }

  Write-Status 'Fetching the production main branch...'
  & $git -C $Repo fetch origin main | Out-Host
  if ($LASTEXITCODE -ne 0) { throw 'GitHub could not be reached or authentication failed while fetching main.' }

  $temp = Join-Path $env:TEMP ('genevieve_v36_main_' + [guid]::NewGuid().ToString('N'))
  try {
    & $git -C $Repo worktree add --detach $temp origin/main | Out-Host
    if ($LASTEXITCODE -ne 0) { throw 'A temporary production worktree could not be created.' }
    Ensure-GitIdentity $git $temp
    foreach ($file in $changed) {
      $relative = $file -replace '/', '\\'
      $source = Join-Path $Repo $relative
      if (Test-Path $source) {
        $destination = Join-Path $temp $relative
        New-Item -ItemType Directory -Path (Split-Path -Parent $destination) -Force | Out-Null
        Copy-Item -LiteralPath $source -Destination $destination -Force
      }
    }
    foreach ($file in $changed) {
      if (Test-Path (Join-Path $temp ($file -replace '/', '\\'))) { & $git -C $temp add -- $file | Out-Null }
    }
    $productionStaged = (& $git -C $temp diff --cached --name-only)
    if (-not [string]::IsNullOrWhiteSpace(($productionStaged -join ''))) {
      & $git -C $temp commit -m 'Deploy V36 full Dog Park repair' | Out-Host
      if ($LASTEXITCODE -ne 0) { throw 'The production repair commit could not be created.' }
      & $git -C $temp push origin HEAD:main | Out-Host
      if ($LASTEXITCODE -ne 0) { throw 'GitHub rejected the production push. The repair remains safely committed on the local branch.' }
      Write-Status 'V36 was pushed to GitHub main. Vercel should now deploy it automatically.'
    } else {
      Write-Status 'GitHub main already contains the same V36 repair files.'
    }
  } finally {
    if (Test-Path $temp) {
      & $git -C $Repo worktree remove --force $temp 2>$null | Out-Null
      if (Test-Path $temp) { Remove-Item -LiteralPath $temp -Recurse -Force -ErrorAction SilentlyContinue }
    }
  }
}

function Wait-For-LiveBuild {
  $live = 'https://genevieve-tracey-gruff-dog-park-app-omega.vercel.app/?genevieveVersion=36#today'
  Write-Status 'Waiting for the Vercel production deployment to show V36...'
  $deadline = (Get-Date).AddMinutes(5)
  do {
    try {
      $response = Invoke-WebRequest -Uri ('https://genevieve-tracey-gruff-dog-park-app-omega.vercel.app/?genevieveVersion=36&check=' + [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()) -UseBasicParsing -Headers @{'Cache-Control'='no-cache'} -TimeoutSec 20
      if ($response.Content -match '20260730\.36|2026\.07\.30\.36|genevieveVersion=36') {
        Write-Status 'The live V36 deployment is responding.'
        Start-Process $live
        return $true
      }
    } catch {}
    Start-Sleep -Seconds 15
  } while ((Get-Date) -lt $deadline)
  Write-Status 'GitHub was updated, but Vercel had not exposed V36 within five minutes. Opening the deployment URL so it can be refreshed.'
  Start-Process $live
  return $false
}

try {
  Set-Content -LiteralPath $LogPath -Value 'GENEVIEVE V36 repair started' -Encoding UTF8
  Write-Status 'Finding the Dog Park project currently open on this computer...'
  $repo = Find-Repository $RepoPath
  Write-Status ('Selected repository: ' + $repo)
  $backup = Backup-CurrentFiles $repo
  Write-Status ('Safety backup created: ' + $backup)

  $repoAssets = Join-Path $repo 'assets'
  New-Item -ItemType Directory -Path $repoAssets -Force | Out-Null
  Get-ChildItem -LiteralPath (Join-Path $ScriptRoot 'assets') -File | ForEach-Object {
    Copy-Item -LiteralPath $_.FullName -Destination (Join-Path $repoAssets $_.Name) -Force
  }
  Write-Status 'Exact archived GA and Tree and Roots masters copied into the app.'

  Patch-Index (Join-Path $repo 'index.html')
  Patch-AppJs (Join-Path $repo 'app.js')
  Patch-Styles (Join-Path $repo 'styles.css')
  Patch-Config (Join-Path $repo 'config.js')
  Write-Manifest (Join-Path $repo 'manifest.webmanifest')
  Write-ServiceWorker (Join-Path $repo 'service-worker.js')
  Write-Utf8 (Join-Path $repo 'sw.js') "importScripts('./service-worker.js?v=20260730.36');`r`n"
  Write-Vercel (Join-Path $repo 'vercel.json')
  Write-Status 'Pages, routing, header visibility, versioning and cache files were repaired.'

  $check = Run-Checks $repo
  if (-not $check.Passed) {
    throw ('The automatic checks found a problem. Open ' + $check.ReportPath + ' for the exact result. Nothing was deployed.')
  }
  Write-Status 'All automated checks passed.'

  if ($Deploy) {
    Deploy-To-Main $repo
    [void](Wait-For-LiveBuild)
  } else {
    Write-Status 'Local repair complete. Deployment was not requested.'
    Start-Process (Join-Path $repo 'V36_REPAIR_REPORT.txt')
  }
  Write-Host ''
  Write-Host 'DONE: GENEVIEVE Dog Park V36 repair completed successfully.' -ForegroundColor Green
  exit 0
} catch {
  $message = $_.Exception.Message
  Write-Host ''
  Write-Host ('STOPPED: ' + $message) -ForegroundColor Red
  Add-Content -LiteralPath $LogPath -Value ('ERROR: ' + $message) -Encoding UTF8
  Write-Host ('Repair log: ' + $LogPath)
  exit 1
}
