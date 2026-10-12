param([Parameter(Mandatory=$true)][string]$InputDeck,[Parameter(Mandatory=$true)][string]$RenderDirectory,[string]$Pdf)
$ErrorActionPreference='Stop'
$ppt=New-Object -ComObject PowerPoint.Application
try {
 $deck=$ppt.Presentations.Open($InputDeck,-1,0,0)
 try { $deck.Export($RenderDirectory,'PNG',1600,900); if($Pdf){$deck.SaveAs($Pdf,32)} } finally {$deck.Close()}
} finally {$ppt.Quit()}
