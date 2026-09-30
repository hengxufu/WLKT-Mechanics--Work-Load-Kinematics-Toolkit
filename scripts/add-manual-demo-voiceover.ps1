param(
  [string]$VoiceName = 'Microsoft Huihui Desktop',
  [int]$SpeechRate = 1
)

$ErrorActionPreference = 'Stop'
$projectDirectory = Split-Path -Parent $PSScriptRoot
$outputDirectory = Join-Path $projectDirectory 'output\playwright\manual-workflow-demo'
$inputVideo = Join-Path $outputDirectory '拉压弯扭大师-2D-3D逐点击建模操作演示.mp4'
$outputVideo = Join-Path $outputDirectory '拉压弯扭大师-2D-3D逐点击建模操作演示-普通话配音版.mp4'
$narrationDirectory = Join-Path $outputDirectory 'narration-temp'
$ffmpegPath = Join-Path $projectDirectory 'node_modules\@ffmpeg-installer\win32-x64\ffmpeg.exe'

if (-not (Test-Path -LiteralPath $inputVideo)) { throw "Input video not found: $inputVideo" }
if (-not (Test-Path -LiteralPath $ffmpegPath)) { throw 'FFmpeg is missing. Run npm install first.' }
New-Item -ItemType Directory -Force -Path $narrationDirectory | Out-Null

$segments = @(
  [pscustomobject]@{ StartMilliseconds=700; Text='欢迎观看拉压弯扭大师逐点击操作版。本片从空白模型开始，完整演示二维与三维建模。' },
  [pscustomobject]@{ StartMilliseconds=17000; Text='首先进入二维工作区。打开文件菜单，单击清空当前模型，并勾选删除材料与删除截面。' },
  [pscustomobject]@{ StartMilliseconds=42000; Text='打开建模菜单，选择定义材料。每个输入框都先单击，再输入弹性模量、剪切模量、密度和线膨胀系数。' },
  [pscustomobject]@{ StartMilliseconds=78000; Text='随后定义截面，依次设置面积、惯性矩、截面高度和剪切系数，最后单击添加截面。' },
  [pscustomobject]@{ StartMilliseconds=112000; Text='现在创建节点一。输入 X 与 Z 坐标，并勾选 Dx、Dz、Ry，形成二维固定端。' },
  [pscustomobject]@{ StartMilliseconds=140000; Text='节点二和节点三同样通过坐标框精确摆放。节点编号由程序自动生成。' },
  [pscustomobject]@{ StartMilliseconds=174000; Text='单击适应窗口，检查三个节点的位置。接着创建第一根梁，选择起点一、终点二、材料一和截面一。' },
  [pscustomobject]@{ StartMilliseconds=212000; Text='第二根梁连接节点二与节点三。每个下拉框都需要单击展开，再单击具体选项。' },
  [pscustomobject]@{ StartMilliseconds=246000; Text='二维节点支持直接拖动。把鼠标移到节点二，按住左键移动，松开后梁单元实时更新。' },
  [pscustomobject]@{ StartMilliseconds=262000; Text='打开载荷菜单，选择集中力与力矩。先选择作用节点三，再输入 Fx、Fz 和 My。' },
  [pscustomobject]@{ StartMilliseconds=292000; Text='载荷分量的绝对值决定大小，正负号决定全局方向。输入负值时，箭头方向会相应反转。' },
  [pscustomobject]@{ StartMilliseconds=309000; Text='单击求解，再打开弯矩图层，完成二维模型的边界条件检查与后处理。' },
  [pscustomobject]@{ StartMilliseconds=326000; Text='下面切换到三维空间刚架求解器，并清空默认空间模型。' },
  [pscustomobject]@{ StartMilliseconds=342000; Text='三维材料与截面同时定义。这里输入 Q 三五五钢材的 E、G、屈服强度，以及箱形截面的面积、双向惯性矩和扭转常数。' },
  [pscustomobject]@{ StartMilliseconds=384000; Text='开始摆放空间节点。三维节点不在画布中自由拖动，而是用 X、Y、Z 三个坐标精确定位。' },
  [pscustomobject]@{ StartMilliseconds=402000; Text='节点 N 一位于原点。依次勾选 Ux、Uy、Uz、Rx、Ry、Rz，形成六自由度固定端。' },
  [pscustomobject]@{ StartMilliseconds=430000; Text='注意，节点表单会保留上一次的约束状态。添加 N 二前，要逐项取消六个约束，再继续添加 N 三和 N 四。' },
  [pscustomobject]@{ StartMilliseconds=475000; Text='创建杆件 M 一。输入编号，选择起点 N 一、终点 N 二，再选择材料与截面。' },
  [pscustomobject]@{ StartMilliseconds=503000; Text='杆件 M 二连接 N 二与 N 三，杆件 M 三连接 N 三与 N 四。每根杆件都独立确认。' },
  [pscustomobject]@{ StartMilliseconds=535000; Text='创建载荷 L 一，作用在 N 四。分别输入三向力和三向力矩，数值单位显示在字段标签中。' },
  [pscustomobject]@{ StartMilliseconds=557000; Text='要改变载荷位置，先删除原载荷，再重新创建。这里把作用点从 N 四改到 N 三。' },
  [pscustomobject]@{ StartMilliseconds=568000; Text='同时修改 Fx、Fy、Fz 和 Mz 的数值。正负号的变化清楚展示了载荷方向如何调整。' },
  [pscustomobject]@{ StartMilliseconds=579000; Text='最后在三维画布中按住左键拖动，旋转相机观察模型。这个操作只改变视角，不改变节点坐标。' },
  [pscustomobject]@{ StartMilliseconds=590000; Text='切换标准视图并求解。演示完成。' }
)

Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$voices = @($synth.GetInstalledVoices() | ForEach-Object { $_.VoiceInfo.Name })
if ($voices -contains $VoiceName) { $synth.SelectVoice($VoiceName) } else {
  $fallback = $synth.GetInstalledVoices() | Where-Object { $_.VoiceInfo.Culture.Name -eq 'zh-CN' } | Select-Object -First 1
  if (-not $fallback) { throw 'No Simplified Chinese speech voice is installed.' }
  $VoiceName = $fallback.VoiceInfo.Name; $synth.SelectVoice($VoiceName)
}
$synth.Rate = $SpeechRate; $synth.Volume = 100
$segmentFiles = @()
for ($i=0; $i -lt $segments.Count; $i+=1) {
  $file = Join-Path $narrationDirectory ('segment-{0:D2}.wav' -f ($i+1))
  $synth.SetOutputToWaveFile($file); $synth.Speak($segments[$i].Text); $synth.SetOutputToNull(); $segmentFiles += $file
}
$synth.Dispose()

$args = @('-y','-i',$inputVideo)
foreach ($file in $segmentFiles) { $args += @('-i',$file) }
$parts=@(); $mix=@()
for ($i=0; $i -lt $segments.Count; $i+=1) {
  $inputIndex=$i+1; $label="voice$inputIndex"; $delay=$segments[$i].StartMilliseconds
  $parts += "[$inputIndex`:a]adelay=$delay,volume=1.15[$label]"; $mix += "[$label]"
}
$parts += (($mix -join '') + "amix=inputs=$($segments.Count):duration=longest:dropout_transition=0,volume=$($segments.Count),highpass=f=80,lowpass=f=10000,alimiter=limit=0.95,apad[narration]")
$args += @('-filter_complex',($parts -join ';'),'-map','0:v:0','-map','[narration]','-c:v','copy','-c:a','aac','-b:a','192k','-ar','48000','-ac','2','-metadata:s:a:0','language=chi','-metadata:s:a:0','title=普通话逐点击教学配音','-movflags','+faststart','-shortest',$outputVideo)
& $ffmpegPath @args
if ($LASTEXITCODE -ne 0) { throw "FFmpeg failed with exit code $LASTEXITCODE" }
foreach ($file in $segmentFiles) { Remove-Item -LiteralPath $file -Force }
Remove-Item -LiteralPath $narrationDirectory -Force
Write-Output "Voice: $VoiceName"
Write-Output "Voice-over video exported: $outputVideo"
