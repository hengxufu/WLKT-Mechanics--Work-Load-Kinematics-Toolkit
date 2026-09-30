param(
  [string]$VoiceName = 'Microsoft Huihui Desktop',
  [int]$SpeechRate = 1
)

$ErrorActionPreference = 'Stop'
$projectDirectory = Split-Path -Parent $PSScriptRoot
$outputDirectory = Join-Path $projectDirectory 'output\playwright\teaching-demo'
$inputVideo = Join-Path $outputDirectory '拉压弯扭大师-2D-3D全流程教学演示.mp4'
$outputVideo = Join-Path $outputDirectory '拉压弯扭大师-2D-3D全流程教学演示-普通话配音版.mp4'
$narrationDirectory = Join-Path $outputDirectory 'narration-temp'
$ffmpegPath = Join-Path $projectDirectory 'node_modules\@ffmpeg-installer\win32-x64\ffmpeg.exe'

if (-not (Test-Path -LiteralPath $inputVideo)) {
  throw "Input video not found: $inputVideo"
}
if (-not (Test-Path -LiteralPath $ffmpegPath)) {
  throw 'FFmpeg is missing. Run npm install before generating the voice-over.'
}

New-Item -ItemType Directory -Force -Path $narrationDirectory | Out-Null

$segments = @(
  [pscustomobject]@{
    StartMilliseconds = 400
    Text = '欢迎使用拉压弯扭大师。下面演示二维、三维、字母计算和复杂结构求解。'
  },
  [pscustomobject]@{
    StartMilliseconds = 9000
    Text = '首先载入二维简支梁。模型包含节点、梁、材料、截面、支座和跨中集中力。'
  },
  [pscustomobject]@{
    StartMilliseconds = 22000
    Text = '后处理依次显示变形、轴力、剪力和弯矩。轴力判断拉伸或压缩，剪力反映荷载变化，弯矩用于定位危险截面。'
  },
  [pscustomobject]@{
    StartMilliseconds = 45000
    Text = '进入字母计算。悬臂梁端部挠度等于，F乘L的三次方，除以三E I。结果随参数自动更新。'
  },
  [pscustomobject]@{
    StartMilliseconds = 57000
    Text = '自定义公式支持括号、乘方和平方根。这里计算拉弯扭共同作用下的冯米塞斯等效应力。'
  },
  [pscustomobject]@{
    StartMilliseconds = 67000
    Text = '组合案例输入轴力、弯矩、扭矩、截面和材料参数，一次得到应力、变形、曲率、扭转角和安全系数。'
  },
  [pscustomobject]@{
    StartMilliseconds = 79000
    Text = '随后切换到门式刚架。水平力与竖向力共同作用，程序自动组装整体刚度矩阵并恢复构件内力。'
  },
  [pscustomobject]@{
    StartMilliseconds = 90000
    Text = '第二部分是三维空间刚架。自由端承受三向力和扭矩，标准视图用于检查空间拓扑和载荷位置。'
  },
  [pscustomobject]@{
    StartMilliseconds = 108000
    Text = '三维空间梁采用十二自由度单元，计算轴向、双向弯曲、扭转、节点位移、支座反力和构件端力。'
  },
  [pscustomobject]@{
    StartMilliseconds = 126000
    Text = '结果图层可切换变形、轴力、剪力和弯矩；结果表列出位移、转角、支座反力和构件端力。'
  },
  [pscustomobject]@{
    StartMilliseconds = 141000
    Text = '演示完成。所有计算均在本机执行。'
  }
)

Add-Type -AssemblyName System.Speech
$synthesizer = New-Object System.Speech.Synthesis.SpeechSynthesizer
$installedVoiceNames = @($synthesizer.GetInstalledVoices() | ForEach-Object { $_.VoiceInfo.Name })
if ($installedVoiceNames -contains $VoiceName) {
  $synthesizer.SelectVoice($VoiceName)
} else {
  $fallbackVoice = $synthesizer.GetInstalledVoices() |
    Where-Object { $_.VoiceInfo.Culture.Name -eq 'zh-CN' } |
    Select-Object -First 1
  if (-not $fallbackVoice) {
    throw 'No Simplified Chinese speech voice is installed.'
  }
  $VoiceName = $fallbackVoice.VoiceInfo.Name
  $synthesizer.SelectVoice($VoiceName)
}
$synthesizer.Rate = $SpeechRate
$synthesizer.Volume = 100

$segmentFiles = @()
for ($index = 0; $index -lt $segments.Count; $index += 1) {
  $segmentPath = Join-Path $narrationDirectory ('segment-{0:D2}.wav' -f ($index + 1))
  $synthesizer.SetOutputToWaveFile($segmentPath)
  $synthesizer.Speak($segments[$index].Text)
  $synthesizer.SetOutputToNull()
  $segmentFiles += $segmentPath
}
$synthesizer.Dispose()

$ffmpegArguments = @('-y', '-i', $inputVideo)
foreach ($segmentFile in $segmentFiles) {
  $ffmpegArguments += @('-i', $segmentFile)
}

$filterParts = @()
$mixInputs = @()
for ($index = 0; $index -lt $segments.Count; $index += 1) {
  $inputIndex = $index + 1
  $label = "voice$inputIndex"
  $delay = $segments[$index].StartMilliseconds
  $filterParts += "[$inputIndex`:a]adelay=$delay,volume=1.15[$label]"
  $mixInputs += "[$label]"
}
$filterParts += (($mixInputs -join '') + "amix=inputs=$($segments.Count):duration=longest:dropout_transition=0,volume=$($segments.Count),highpass=f=80,lowpass=f=10000,alimiter=limit=0.95,apad[narration]")
$filterGraph = $filterParts -join ';'

$ffmpegArguments += @(
  '-filter_complex', $filterGraph,
  '-map', '0:v:0',
  '-map', '[narration]',
  '-c:v', 'copy',
  '-c:a', 'aac',
  '-b:a', '192k',
  '-ar', '48000',
  '-ac', '2',
  '-metadata:s:a:0', 'language=chi',
  '-metadata:s:a:0', 'title=普通话教学配音',
  '-movflags', '+faststart',
  '-shortest',
  $outputVideo
)

& $ffmpegPath @ffmpegArguments
if ($LASTEXITCODE -ne 0) {
  throw "FFmpeg failed with exit code $LASTEXITCODE"
}

foreach ($segmentFile in $segmentFiles) {
  Remove-Item -LiteralPath $segmentFile -Force
}
Remove-Item -LiteralPath $narrationDirectory -Force

Write-Output "Voice: $VoiceName"
Write-Output "Voice-over video exported: $outputVideo"
