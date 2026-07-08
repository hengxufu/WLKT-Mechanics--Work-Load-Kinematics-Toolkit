param(
  [string]$ReleaseDir = ".",
  [string]$ChecksumFile = ""
)

$ErrorActionPreference = "Stop"

$resolvedReleaseDir = Resolve-Path -LiteralPath $ReleaseDir
if ([string]::IsNullOrWhiteSpace($ChecksumFile)) {
  $ChecksumFile = Join-Path $resolvedReleaseDir.Path "SHA256SUMS.txt"
}

if (-not (Test-Path -LiteralPath $ChecksumFile)) {
  Write-Error "Checksum file not found: $ChecksumFile"
}

$failed = $false
$lines = Get-Content -LiteralPath $ChecksumFile

foreach ($line in $lines) {
  if ([string]::IsNullOrWhiteSpace($line)) {
    continue
  }

  if ($line -notmatch "^([a-fA-F0-9]{64})\s+\*?(.+)$") {
    Write-Warning "Skipping invalid checksum line: $line"
    continue
  }

  $expectedHash = $Matches[1].ToLowerInvariant()
  $fileName = $Matches[2].Trim()
  $filePath = Join-Path $resolvedReleaseDir.Path $fileName

  if (-not (Test-Path -LiteralPath $filePath)) {
    Write-Host "MISSING $fileName"
    $failed = $true
    continue
  }

  $actualHash = (Get-FileHash -LiteralPath $filePath -Algorithm SHA256).Hash.ToLowerInvariant()
  if ($actualHash -eq $expectedHash) {
    Write-Host "OK      $fileName"
  } else {
    Write-Host "FAILED  $fileName"
    Write-Host "        expected: $expectedHash"
    Write-Host "        actual:   $actualHash"
    $failed = $true
  }
}

if ($failed) {
  exit 1
}

Write-Host "All checksums matched."
