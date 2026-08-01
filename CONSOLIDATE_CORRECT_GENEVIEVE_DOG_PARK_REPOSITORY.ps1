param(
    [string]$RepositoryPath = ""
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version 2.0

$ExpectedRepository = "Genevieve-Tracey-Gruff-dog-park-app"
$ExpectedRemoteText = "tracey727/Genevieve-Tracey-Gruff-dog-park-app"
$ForbiddenRepositoryText = "Genevieve-Animals-Dog-Parks-App"
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"

function Write-Stage {
    param([string]$Message)
    Write-Host ""
    Write-Host "=== $Message ===" -ForegroundColor Cyan
}

function Get-NormalizedFullPath {
    param([string]$Path)
    return [System.IO.Path]::GetFullPath($Path).TrimEnd('\')
}

function Test-CorrectRepository {
    param([string]$Path)

    if ([string]::IsNullOrWhiteSpace($Path) -or -not (Test-Path -LiteralPath $Path -PathType Container)) {
        return $false
    }

    $full = Get-NormalizedFullPath $Path
    if ($full -match [regex]::Escape($ForbiddenRepositoryText)) {
        return $false
    }

    return (
        (Test-Path -LiteralPath (Join-Path $full "index.html") -PathType Leaf) -and
        (Test-Path -LiteralPath (Join-Path $full "service-worker.js") -PathType Leaf) -and
        (Test-Path -LiteralPath (Join-Path $full "app.js") -PathType Leaf) -and
        (Test-Path -LiteralPath (Join-Path $full "manifest.webmanifest") -PathType Leaf)
    )
}

function Select-RepositoryFolder {
    Add-Type -AssemblyName System.Windows.Forms
    $dialog = New-Object System.Windows.Forms.FolderBrowserDialog
    $dialog.Description = "Select the CORRECT repository: Genevieve-Tracey-Gruff-dog-park-app"
    $dialog.ShowNewFolderButton = $false
    $result = $dialog.ShowDialog()
    if ($result -ne [System.Windows.Forms.DialogResult]::OK) {
        throw "No repository folder was selected. Nothing was changed."
    }
    return $dialog.SelectedPath
}

function Copy-DirectorySafe {
    param(
        [string]$Source,
        [string]$Destination
    )

    if (-not (Test-Path -LiteralPath $Source -PathType Container)) {
        return
    }

    New-Item -ItemType Directory -Path $Destination -Force | Out-Null
    Get-ChildItem -LiteralPath $Source -Force | ForEach-Object {
        $target = Join-Path $Destination $_.Name
        if ($_.PSIsContainer) {
            Copy-DirectorySafe -Source $_.FullName -Destination $target
        } else {
            Copy-Item -LiteralPath $_.FullName -Destination $target -Force
        }
    }
}

function Copy-RelativeFile {
    param(
        [string]$SourceRoot,
        [string]$DestinationRoot,
        [string]$RelativePath
    )

    $relative = $RelativePath.Replace('/', '\').TrimStart('\')
    $sourceFile = Join-Path $SourceRoot $relative
    if (-not (Test-Path -LiteralPath $sourceFile -PathType Leaf)) {
        return $false
    }

    $destinationFile = Join-Path $DestinationRoot $relative
    $destinationDirectory = Split-Path -Parent $destinationFile
    if (-not (Test-Path -LiteralPath $destinationDirectory)) {
        New-Item -ItemType Directory -Path $destinationDirectory -Force | Out-Null
    }
    Copy-Item -LiteralPath $sourceFile -Destination $destinationFile -Force
    return $true
}

function Get-RelativePathCompat {
    param(
        [string]$BasePath,
        [string]$TargetPath
    )

    $baseFull = (Get-NormalizedFullPath $BasePath) + '\'
    $targetFull = Get-NormalizedFullPath $TargetPath
    $baseUri = New-Object System.Uri($baseFull)
    $targetUri = New-Object System.Uri($targetFull)
    $relativeUri = $baseUri.MakeRelativeUri($targetUri)
    return [System.Uri]::UnescapeDataString($relativeUri.ToString()).Replace('/', '\')
}

function Resolve-LocalReference {
    param(
        [string]$SourceRoot,
        [string]$CurrentFile,
        [string]$Reference
    )

    if ([string]::IsNullOrWhiteSpace($Reference)) { return $null }

    $ref = $Reference.Trim()
    if ($ref -match '^(?i)(https?:|data:|mailto:|tel:|javascript:|blob:|//|#)') { return $null }
    $ref = ($ref -split '[?#]')[0]
    if ([string]::IsNullOrWhiteSpace($ref) -or $ref -eq '.' -or $ref -eq './') { return $null }

    try {
        $ref = [System.Uri]::UnescapeDataString($ref)
    } catch {
        # Keep the original reference when it is not URI encoded.
    }

    if ($ref.StartsWith('/')) {
        $candidate = Join-Path $SourceRoot $ref.TrimStart('/')
    } else {
        $candidate = Join-Path (Split-Path -Parent $CurrentFile) $ref
    }

    try {
        $candidateFull = [System.IO.Path]::GetFullPath($candidate)
        $sourceFull = (Get-NormalizedFullPath $SourceRoot) + '\'
        if (-not $candidateFull.StartsWith($sourceFull, [System.StringComparison]::OrdinalIgnoreCase)) {
            return $null
        }
        if (Test-Path -LiteralPath $candidateFull -PathType Leaf) {
            return $candidateFull
        }
    } catch {
        return $null
    }

    return $null
}

function Find-ReferencedFiles {
    param(
        [string]$SourceRoot,
        [string[]]$StartingFiles
    )

    $textExtensions = @('.html', '.htm', '.js', '.mjs', '.css', '.json', '.webmanifest', '.txt', '.md', '.xml')
    $attributePattern = @'
(?is)(?:src|href|content|action)\s*=\s*["']([^"'#]+)["']
'@
    $quotedFilePattern = @'
(?i)["']((?:\.\.?/|/)?(?:[A-Za-z0-9._-]+/)*[A-Za-z0-9._-]+\.(?:html?|m?js|css|json|webmanifest|png|jpe?g|gif|svg|webp|ico|woff2?|ttf|xml))(?:\?[^"']*)?["']
'@

    $queue = New-Object System.Collections.Queue
    $seen = New-Object 'System.Collections.Generic.HashSet[string]' ([System.StringComparer]::OrdinalIgnoreCase)
    $results = New-Object 'System.Collections.Generic.HashSet[string]' ([System.StringComparer]::OrdinalIgnoreCase)

    foreach ($file in $StartingFiles) {
        if (Test-Path -LiteralPath $file -PathType Leaf) {
            $queue.Enqueue((Get-NormalizedFullPath $file))
        }
    }

    while ($queue.Count -gt 0) {
        $current = [string]$queue.Dequeue()
        if (-not $seen.Add($current)) { continue }
        [void]$results.Add($current)

        $extension = [System.IO.Path]::GetExtension($current).ToLowerInvariant()
        if ($textExtensions -notcontains $extension) { continue }

        try {
            $content = [System.IO.File]::ReadAllText($current)
        } catch {
            continue
        }

        $references = New-Object System.Collections.Generic.List[string]
        foreach ($match in [regex]::Matches($content, $attributePattern)) {
            if ($match.Groups.Count -gt 1) { $references.Add($match.Groups[1].Value) }
        }
        foreach ($match in [regex]::Matches($content, $quotedFilePattern)) {
            if ($match.Groups.Count -gt 1) { $references.Add($match.Groups[1].Value) }
        }

        foreach ($reference in $references) {
            $resolved = Resolve-LocalReference -SourceRoot $SourceRoot -CurrentFile $current -Reference $reference
            if ($null -ne $resolved -and -not $seen.Contains($resolved)) {
                $queue.Enqueue($resolved)
            }
        }
    }

    return $results
}

function Write-Utf8NoBom {
    param([string]$Path, [string]$Content)
    $encoding = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($Path, $Content, $encoding)
}

function Test-OutputForSecrets {
    param([string]$Root)

    $patterns = [ordered]@{
        'Stripe live secret key' = 'sk_live_[A-Za-z0-9]{16,}'
        'Stripe restricted live key' = 'rk_live_[A-Za-z0-9]{16,}'
        'Stripe webhook signing secret' = 'whsec_[A-Za-z0-9]{16,}'
        'Google API key' = 'AIza[0-9A-Za-z_-]{20,}'
        'Private key block' = '-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----'
    }

    $findings = New-Object System.Collections.Generic.List[string]
    $allowedExtensions = @('.html', '.htm', '.js', '.mjs', '.css', '.json', '.webmanifest', '.txt', '.md', '.xml', '.yml', '.yaml', '.env')

    Get-ChildItem -LiteralPath $Root -Recurse -File -Force | ForEach-Object {
        if ($allowedExtensions -notcontains $_.Extension.ToLowerInvariant()) { return }
        if ($_.Length -gt 20MB) { return }

        try {
            $content = [System.IO.File]::ReadAllText($_.FullName)
            foreach ($label in $patterns.Keys) {
                if ([regex]::IsMatch($content, $patterns[$label])) {
                    $relative = Get-RelativePathCompat -BasePath $Root -TargetPath $_.FullName
                    $findings.Add("$label found in $relative")
                }
            }
        } catch {
            # Ignore unreadable non-text files.
        }
    }

    return $findings
}

function Validate-ServiceWorkerAssets {
    param([string]$MasterRoot)

    $serviceWorkerPath = Join-Path $MasterRoot 'service-worker.js'
    if (-not (Test-Path -LiteralPath $serviceWorkerPath -PathType Leaf)) {
        throw "The consolidated copy is missing service-worker.js."
    }

    $content = [System.IO.File]::ReadAllText($serviceWorkerPath)
    $block = [regex]::Match($content, '(?is)const\s+ASSETS\s*=\s*\[(.*?)\];')
    if (-not $block.Success) {
        return @('The ASSETS list could not be parsed; manual service-worker review is required.')
    }

    $quotePattern = @'
["']([^"']+)["']
'@
    $missing = New-Object System.Collections.Generic.List[string]
    foreach ($match in [regex]::Matches($block.Groups[1].Value, $quotePattern)) {
        $asset = $match.Groups[1].Value
        if ($asset -match '^(?i)(https?:|data:|//)') { continue }
        $clean = ($asset -split '[?#]')[0]
        if ($clean -eq './' -or $clean -eq '.' -or [string]::IsNullOrWhiteSpace($clean)) { continue }
        $relative = $clean.TrimStart('.', '/').Replace('/', '\')
        $target = Join-Path $MasterRoot $relative
        if (-not (Test-Path -LiteralPath $target)) {
            $missing.Add($asset)
        }
    }
    return $missing
}

Write-Host "GENEVIEVE App(TM) Dog Park - Correct Repository Consolidation" -ForegroundColor Yellow
Write-Host "This tool never deletes or overwrites the original repository." -ForegroundColor Green

Write-Stage "Locating the correct repository"

$candidates = New-Object System.Collections.Generic.List[string]
if (-not [string]::IsNullOrWhiteSpace($RepositoryPath)) { $candidates.Add($RepositoryPath) }
$candidates.Add((Join-Path $env:USERPROFILE 'GenevieveProjects\Genevieve-Tracey-Gruff-dog-park-app'))
$candidates.Add((Join-Path $env:USERPROFILE 'GenevieveProjects\genevieve-tracey-gruff-dog-park-app'))
$candidates.Add((Join-Path $env:USERPROFILE 'Documents\GitHub\Genevieve-Tracey-Gruff-dog-park-app'))
$candidates.Add((Join-Path $env:USERPROFILE 'Documents\GitHub\genevieve-tracey-gruff-dog-park-app'))
$candidates.Add((Get-Location).Path)

$SourceRoot = $null
foreach ($candidate in $candidates) {
    if (Test-CorrectRepository $candidate) {
        $SourceRoot = Get-NormalizedFullPath $candidate
        break
    }
}

if ($null -eq $SourceRoot) {
    $selected = Select-RepositoryFolder
    if (-not (Test-CorrectRepository $selected)) {
        throw "That folder is not the correct current Dog Park repository. It must contain index.html, service-worker.js, app.js and manifest.webmanifest. Nothing was changed."
    }
    $SourceRoot = Get-NormalizedFullPath $selected
}

if ($SourceRoot -match [regex]::Escape($ForbiddenRepositoryText)) {
    throw "STOPPED: You selected the old Genevieve-Animals-Dog-Parks-App repository. Nothing was changed."
}

Write-Host "Selected: $SourceRoot" -ForegroundColor White

Write-Stage "Verifying GitHub identity"
$RemoteUrl = ""
$git = Get-Command git.exe -ErrorAction SilentlyContinue
if ($null -ne $git -and (Test-Path -LiteralPath (Join-Path $SourceRoot '.git') -PathType Container)) {
    try {
        $RemoteUrl = ((& git.exe -C $SourceRoot remote get-url origin 2>$null) -join '').Trim()
    } catch {
        $RemoteUrl = ""
    }
}

if ($RemoteUrl -match [regex]::Escape($ForbiddenRepositoryText)) {
    throw "STOPPED: The Git remote points to the old repository: $RemoteUrl"
}
if (-not [string]::IsNullOrWhiteSpace($RemoteUrl) -and $RemoteUrl -notmatch [regex]::Escape($ExpectedRemoteText)) {
    throw "STOPPED: The Git remote is not the approved repository. Found: $RemoteUrl"
}
if ([string]::IsNullOrWhiteSpace($RemoteUrl)) {
    if ((Split-Path -Leaf $SourceRoot) -notmatch '(?i)^Genevieve-Tracey-Gruff-dog-park-app$') {
        throw "STOPPED: Git identity could not be verified and the folder name is not the approved repository name."
    }
    Write-Host "Git remote unavailable; the exact approved folder name and production files were verified." -ForegroundColor Yellow
} else {
    Write-Host "Verified remote: $RemoteUrl" -ForegroundColor Green
}

$Desktop = [Environment]::GetFolderPath('Desktop')
if ([string]::IsNullOrWhiteSpace($Desktop)) { $Desktop = $env:USERPROFILE }
$OutputRoot = Join-Path $Desktop "GENEVIEVE_DOG_PARK_CONSOLIDATED_OUTPUT"
New-Item -ItemType Directory -Path $OutputRoot -Force | Out-Null

$RunRoot = Join-Path $OutputRoot "RUN_$Timestamp"
$MasterRoot = Join-Path $RunRoot "GENEVIEVE_DOG_PARK_MASTER_V35_CONSOLIDATED"
$BackupStaging = Join-Path $RunRoot "_source_backup_staging"
New-Item -ItemType Directory -Path $RunRoot -Force | Out-Null
New-Item -ItemType Directory -Path $MasterRoot -Force | Out-Null

Write-Stage "Creating a safety backup before consolidation"
New-Item -ItemType Directory -Path $BackupStaging -Force | Out-Null
$excludedDirectories = @(
    (Join-Path $SourceRoot '.git'),
    (Join-Path $SourceRoot 'node_modules'),
    (Join-Path $SourceRoot '.vercel'),
    $OutputRoot
)
$robocopyArguments = @($SourceRoot, $BackupStaging, '/E', '/R:1', '/W:1', '/COPY:DAT', '/DCOPY:DAT', '/NFL', '/NDL', '/NJH', '/NJS', '/NP', '/XD') + $excludedDirectories
& robocopy.exe @robocopyArguments | Out-Null
$robocopyCode = $LASTEXITCODE
if ($robocopyCode -ge 8) {
    throw "The safety backup copy failed with Robocopy code $robocopyCode. Nothing in the source repository was changed."
}

Add-Type -AssemblyName System.IO.Compression.FileSystem
$BackupZip = Join-Path $RunRoot "SOURCE_BACKUP_BEFORE_CONSOLIDATION_$Timestamp.zip"
if (Test-Path -LiteralPath $BackupZip) { Remove-Item -LiteralPath $BackupZip -Force }
[System.IO.Compression.ZipFile]::CreateFromDirectory(
    $BackupStaging,
    $BackupZip,
    [System.IO.Compression.CompressionLevel]::Optimal,
    $false
)
Remove-Item -LiteralPath $BackupStaging -Recurse -Force
Write-Host "Safety backup: $BackupZip" -ForegroundColor Green

Write-Stage "Building the clean production repository copy"
$RequiredRootFiles = @(
    'index.html',
    '404.html',
    'styles.css',
    'config.js',
    'logic.js',
    'notification-logic.js',
    'app.js',
    'repair.js',
    'backend.js',
    'native-billing-bridge.js',
    'manifest.webmanifest',
    'service-worker.js',
    'package.json',
    'package-lock.json',
    'vercel.json',
    'robots.txt',
    '.gitignore',
    'README.md'
)

$RequiredMissing = New-Object System.Collections.Generic.List[string]
$StartingFiles = New-Object System.Collections.Generic.List[string]
foreach ($file in $RequiredRootFiles) {
    $sourceFile = Join-Path $SourceRoot $file
    if (Test-Path -LiteralPath $sourceFile -PathType Leaf) {
        [void](Copy-RelativeFile -SourceRoot $SourceRoot -DestinationRoot $MasterRoot -RelativePath $file)
        $StartingFiles.Add($sourceFile)
    } elseif ($file -in @('index.html','styles.css','config.js','logic.js','notification-logic.js','app.js','repair.js','backend.js','native-billing-bridge.js','manifest.webmanifest','service-worker.js','vercel.json')) {
        $RequiredMissing.Add($file)
    }
}

if ($RequiredMissing.Count -gt 0) {
    throw "Required production files are missing: $($RequiredMissing -join ', '). Nothing in the source repository was changed."
}

foreach ($directory in @('assets', 'legal', '.github', 'docs')) {
    $sourceDirectory = Join-Path $SourceRoot $directory
    if (Test-Path -LiteralPath $sourceDirectory -PathType Container) {
        Copy-DirectorySafe -Source $sourceDirectory -Destination (Join-Path $MasterRoot $directory)
    }
}

$ReferencedFiles = Find-ReferencedFiles -SourceRoot $SourceRoot -StartingFiles $StartingFiles.ToArray()
foreach ($file in $ReferencedFiles) {
    $relative = Get-RelativePathCompat -BasePath $SourceRoot -TargetPath $file
    [void](Copy-RelativeFile -SourceRoot $SourceRoot -DestinationRoot $MasterRoot -RelativePath $relative)
}

# Create a protective .gitignore when the repository did not already have one.
$GitIgnorePath = Join-Path $MasterRoot '.gitignore'
if (-not (Test-Path -LiteralPath $GitIgnorePath -PathType Leaf)) {
    $gitIgnore = @'
node_modules/
.vercel/
.env
.env.*
!.env.example
*.local
*.log
.DS_Store
Thumbs.db
GENEVIEVE_DOG_PARK_CONSOLIDATED_OUTPUT/
'@
    Write-Utf8NoBom -Path $GitIgnorePath -Content $gitIgnore
}

Write-Stage "Aligning the install manifest with the current V35 build"
$ServiceWorkerPath = Join-Path $MasterRoot 'service-worker.js'
$ServiceWorkerContent = [System.IO.File]::ReadAllText($ServiceWorkerPath)
$VersionPattern = @'
(?i)(?:const\s+)?VERSION\s*=\s*["'](\d{4})\.(\d{2})\.(\d{2})\.(\d+)["']
'@
$VersionMatch = [regex]::Match($ServiceWorkerContent, $VersionPattern)
$DetectedVersion = "unknown"
$BuildNumber = "35"
$CompactDate = "20260730"
if ($VersionMatch.Success) {
    $DetectedVersion = $VersionMatch.Groups[1].Value + '.' + $VersionMatch.Groups[2].Value + '.' + $VersionMatch.Groups[3].Value + '.' + $VersionMatch.Groups[4].Value
    $BuildNumber = $VersionMatch.Groups[4].Value
    $CompactDate = $VersionMatch.Groups[1].Value + $VersionMatch.Groups[2].Value + $VersionMatch.Groups[3].Value
}

$ManifestPath = Join-Path $MasterRoot 'manifest.webmanifest'
$ManifestContent = [System.IO.File]::ReadAllText($ManifestPath)
$OriginalManifestContent = $ManifestContent
$ManifestContent = [regex]::Replace($ManifestContent, 'genevieve-dog-parks-\d{8}-\d+', "genevieve-dog-parks-$CompactDate-$BuildNumber", 'IgnoreCase')
$ManifestContent = [regex]::Replace($ManifestContent, 'genevieve-dog-park-v\d+', "genevieve-dog-park-v$BuildNumber", 'IgnoreCase')
$ManifestContent = [regex]::Replace($ManifestContent, 'genevieveVersion=\d+', "genevieveVersion=$BuildNumber", 'IgnoreCase')
Write-Utf8NoBom -Path $ManifestPath -Content $ManifestContent
try {
    $null = $ManifestContent | ConvertFrom-Json
} catch {
    throw "The updated manifest is not valid JSON. The source repository was not changed."
}
$ManifestWasAligned = ($ManifestContent -ne $OriginalManifestContent)
Write-Host "Detected production build: $DetectedVersion" -ForegroundColor Green
if ($ManifestWasAligned) {
    Write-Host "The consolidated COPY was aligned from an older install identifier to V$BuildNumber." -ForegroundColor Green
} else {
    Write-Host "The manifest was already aligned with V$BuildNumber." -ForegroundColor Green
}

Write-Stage "Validating cached production files"
$MissingCachedAssets = Validate-ServiceWorkerAssets -MasterRoot $MasterRoot
$ActualMissingCachedAssets = @($MissingCachedAssets | Where-Object { $_ -notmatch '^The ASSETS list' })
if ($ActualMissingCachedAssets.Count -gt 0) {
    $missingText = $ActualMissingCachedAssets -join ', '
    throw "The consolidated copy is missing files required by service-worker.js: $missingText"
}
if ($MissingCachedAssets.Count -gt 0) {
    Write-Host $MissingCachedAssets[0] -ForegroundColor Yellow
} else {
    Write-Host "Every file listed in the service-worker cache exists in the consolidated copy." -ForegroundColor Green
}

Write-Stage "Scanning the consolidated copy for exposed secrets"
$SecretFindings = Test-OutputForSecrets -Root $MasterRoot
if ($SecretFindings.Count -gt 0) {
    $SecretReport = Join-Path $RunRoot 'SECRET_SCAN_STOP_REPORT.txt'
    Write-Utf8NoBom -Path $SecretReport -Content ((@(
        'CONSOLIDATION STOPPED - SECRET-LIKE VALUES FOUND',
        '',
        'No deployable ZIP was created. The original repository was not changed.',
        'Remove or rotate the affected secret and run the tool again.',
        ''
    ) + $SecretFindings) -join [Environment]::NewLine)
    throw "Secret-like values were found. See: $SecretReport"
}
Write-Host "No Stripe secret key, webhook secret, Google API key or private-key block was found in the consolidated copy." -ForegroundColor Green

Write-Stage "Writing the master manifest and deployment record"
$DeployReadmePath = Join-Path $MasterRoot 'README_DEPLOY_THIS_MASTER.txt'
$DeployReadme = @"
GENEVIEVE App(TM) DOG PARK - CONSOLIDATED PRODUCTION MASTER

Correct GitHub repository:
https://github.com/tracey727/Genevieve-Tracey-Gruff-dog-park-app

Source folder used:
$SourceRoot

Source remote:
$RemoteUrl

Detected production build:
$DetectedVersion

THIS PACKAGE IS THE CLEAN DEPLOYMENT COPY.
It excludes the old nested deploy folders, rollback packages, one-off repair launchers and historical duplicate repository content.
The original local repository was not deleted or overwritten.

VERCEL SETTINGS
- Import the existing correct GitHub repository only.
- Framework Preset: Other
- Root Directory: blank / repository root
- Build Command: blank
- Install Command: blank
- Output Directory: blank
- Use a Preview deployment first.
- Promote the exact tested Preview to Production.

DO NOT USE
- Genevieve-Animals-Dog-Parks-App
- V37, V39 or V40 repair ZIPs as a master
- Any nested old deploy folder as Vercel Root Directory

PAYMENT SAFETY
- Never place a Stripe secret key in these browser files or GitHub.
- Keep server secrets in Vercel Environment Variables only.
- Verify all four public Stripe payment links and the concession annual price before public launch.

Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss K')
"@
Write-Utf8NoBom -Path $DeployReadmePath -Content $DeployReadme

$ManifestListPath = Join-Path $MasterRoot 'CONSOLIDATED_MASTER_MANIFEST.txt'
$ManifestLines = New-Object System.Collections.Generic.List[string]
$ManifestLines.Add("GENEVIEVE DOG PARK CONSOLIDATED MASTER FILE MANIFEST")
$ManifestLines.Add("Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss K')")
$ManifestLines.Add("Build: $DetectedVersion")
$ManifestLines.Add("")
$ManifestLines.Add("SHA256`tBYTES`tFILE")
Get-ChildItem -LiteralPath $MasterRoot -Recurse -File -Force | Where-Object { $_.FullName -ne $ManifestListPath } | Sort-Object FullName | ForEach-Object {
    $relative = Get-RelativePathCompat -BasePath $MasterRoot -TargetPath $_.FullName
    $hash = (Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash
    $ManifestLines.Add("$hash`t$($_.Length)`t$relative")
}
Write-Utf8NoBom -Path $ManifestListPath -Content ($ManifestLines -join [Environment]::NewLine)

$ReportPath = Join-Path $RunRoot 'CONSOLIDATION_REPORT.txt'
$sourceCount = (Get-ChildItem -LiteralPath $SourceRoot -Recurse -File -Force -ErrorAction SilentlyContinue | Where-Object { $_.FullName -notmatch '\\.git\\|\\node_modules\\|\\.vercel\\' }).Count
$masterFiles = Get-ChildItem -LiteralPath $MasterRoot -Recurse -File -Force
$masterCount = $masterFiles.Count
$masterBytes = ($masterFiles | Measure-Object Length -Sum).Sum
$report = @"
GENEVIEVE App(TM) DOG PARK - REPOSITORY CONSOLIDATION REPORT

STATUS: COMPLETED
DATE: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss K')

CORRECT SOURCE REPOSITORY
Folder: $SourceRoot
Git remote: $RemoteUrl
Approved repository: $ExpectedRemoteText
Detected production build: $DetectedVersion

SAFETY RESULT
- Original repository changed: NO
- Original files deleted: NO
- Full pre-consolidation backup ZIP created: YES
- Old repository accepted: NO
- Secret-like values in deployable copy: NONE FOUND
- Service-worker cached assets missing: $($ActualMissingCachedAssets.Count)
- Manifest aligned to current build in consolidated copy: $ManifestWasAligned

CONSOLIDATED RESULT
Source working-tree file count (excluding .git/node_modules/.vercel): $sourceCount
Clean master file count: $masterCount
Clean master bytes: $masterBytes

The clean master contains the current production root, required referenced files, approved assets, legal pages, GitHub workflow files and documentation. It does not carry forward the old nested deployment folders or one-off repair launchers unless a live production file explicitly references them.
"@
Write-Utf8NoBom -Path $ReportPath -Content $report
Copy-Item -LiteralPath $ReportPath -Destination (Join-Path $MasterRoot 'CONSOLIDATION_REPORT.txt') -Force

Write-Stage "Creating the deployable consolidated ZIP"
$MasterZip = Join-Path $RunRoot "GENEVIEVE_DOG_PARK_MASTER_V$($BuildNumber)_CONSOLIDATED_$Timestamp.zip"
if (Test-Path -LiteralPath $MasterZip) { Remove-Item -LiteralPath $MasterZip -Force }
[System.IO.Compression.ZipFile]::CreateFromDirectory(
    $MasterRoot,
    $MasterZip,
    [System.IO.Compression.CompressionLevel]::Optimal,
    $false
)
$MasterZipHash = (Get-FileHash -LiteralPath $MasterZip -Algorithm SHA256).Hash
Write-Utf8NoBom -Path (Join-Path $RunRoot 'MASTER_ZIP_SHA256.txt') -Content "$MasterZipHash  $(Split-Path -Leaf $MasterZip)"

Write-Host ""
Write-Host "CONSOLIDATION COMPLETED SAFELY" -ForegroundColor Green
Write-Host "Correct source: $SourceRoot" -ForegroundColor White
Write-Host "Clean master folder: $MasterRoot" -ForegroundColor White
Write-Host "Deployable ZIP: $MasterZip" -ForegroundColor White
Write-Host "Safety backup: $BackupZip" -ForegroundColor White
Write-Host "Report: $ReportPath" -ForegroundColor White
Write-Host ""
Write-Host "The original repository was not altered." -ForegroundColor Green

try {
    Start-Process explorer.exe -ArgumentList $RunRoot
} catch {
    # The output path is printed above if Explorer cannot be opened.
}
