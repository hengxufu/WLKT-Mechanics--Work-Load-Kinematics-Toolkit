param([string]$Python='python',[string]$Node='node',[string]$Name=('rebuild-'+(Get-Date -Format 'yyyyMMdd-HHmmss')))
$ErrorActionPreference='Stop'
Push-Location (Split-Path $PSScriptRoot -Parent)
try {
  New-Item -ItemType Directory -Force build | Out-Null
  & $Node src/build.cjs
  if($LASTEXITCODE){throw 'Native build failed'}
  & $Python -X utf8 src/finalize_assets.py
  if($LASTEXITCODE){throw 'Asset placement failed'}
  & $Python -X utf8 src/toolchain/compose_elements.py --pptx build/deck-native-clean.pptx --manifest assets/asset_manifest.json --out "build/$Name-composed.pptx" --report "build/$Name-composition.json"
  if($LASTEXITCODE){throw 'Composition failed'}
  & $Python -X utf8 src/toolchain/typography_check.py "build/$Name-composed.pptx" --normalize-to "build/$Name.pptx" --out "build/$Name-fonts.json"
  if($LASTEXITCODE){throw 'Font normalization failed'}
  Write-Host "Rebuilt: build/$Name.pptx. Render and review after edits; existing QA applies only to the delivered hash."
} finally {Pop-Location}
