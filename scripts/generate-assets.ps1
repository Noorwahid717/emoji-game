param(
  [string]$ImageDir = "src/assets/images"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

function New-RoundedPath {
  param(
    [System.Drawing.Rectangle]$Rect,
    [int]$Radius
  )
  $path = [System.Drawing.Drawing2D.GraphicsPath]::new()
  $diameter = [Math]::Min($Radius * 2, [Math]::Min($Rect.Width, $Rect.Height))
  $path.AddArc($Rect.X, $Rect.Y, $diameter, $diameter, 180, 90)
  $path.AddArc($Rect.Right - $diameter, $Rect.Y, $diameter, $diameter, 270, 90)
  $path.AddArc($Rect.Right - $diameter, $Rect.Bottom - $diameter, $diameter, $diameter, 0, 90)
  $path.AddArc($Rect.X, $Rect.Bottom - $diameter, $diameter, $diameter, 90, 90)
  $path.CloseFigure()
  return $path
}

function Save-Png {
  param(
    [string]$Path,
    [int]$Width,
    [int]$Height,
    [ScriptBlock]$Draw
  )

  $bitmap = [System.Drawing.Bitmap]::new($Width, $Height)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit
  $graphics.Clear([System.Drawing.Color]::Transparent)

  & $Draw $graphics

  $graphics.Dispose()
  $bitmap.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
  $bitmap.Dispose()
}

if (-not (Test-Path $ImageDir)) {
  New-Item -ItemType Directory -Path $ImageDir -Force | Out-Null
}

Save-Png -Path (Join-Path $ImageDir 'background.png') -Width 1024 -Height 768 -Draw {
  param($g)
  $rect = [System.Drawing.Rectangle]::new(0, 0, 1024, 768)
  $brush = [System.Drawing.Drawing2D.LinearGradientBrush]::new(
    $rect,
    [System.Drawing.Color]::FromArgb(255, 15, 23, 42),
    [System.Drawing.Color]::FromArgb(255, 37, 99, 235),
    [System.Drawing.Drawing2D.LinearGradientMode]::ForwardDiagonal
  )
  $g.FillRectangle($brush, $rect)
  $brush.Dispose()
}

Save-Png -Path (Join-Path $ImageDir 'card-back.png') -Width 256 -Height 256 -Draw {
  param($g)
  $rect = [System.Drawing.Rectangle]::new(16, 16, 224, 224)
  $path = New-RoundedPath $rect 40
  $brush = [System.Drawing.Drawing2D.LinearGradientBrush]::new(
    $rect,
    [System.Drawing.Color]::FromArgb(255, 59, 130, 246),
    [System.Drawing.Color]::FromArgb(255, 14, 165, 233),
    [System.Drawing.Drawing2D.LinearGradientMode]::Vertical
  )
  $g.FillPath($brush, $path)
  $pen = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(255, 226, 232, 240), 6)
  $g.DrawPath($pen, $path)
  $brush.Dispose()
  $pen.Dispose()
  $path.Dispose()
}

Save-Png -Path (Join-Path $ImageDir 'card-front.png') -Width 256 -Height 256 -Draw {
  param($g)
  $rect = [System.Drawing.Rectangle]::new(16, 16, 224, 224)
  $path = New-RoundedPath $rect 36
  $brush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 255, 255, 255))
  $g.FillPath($brush, $path)
  $pen = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(255, 203, 213, 225), 6)
  $g.DrawPath($pen, $path)
  $brush.Dispose()
  $pen.Dispose()
  $path.Dispose()
}

Save-Png -Path (Join-Path $ImageDir 'logo.png') -Width 480 -Height 180 -Draw {
  param($g)
  $rect = [System.Drawing.Rectangle]::new(0, 0, 480, 180)
  $path = New-RoundedPath $rect 28
  $brush = [System.Drawing.Drawing2D.LinearGradientBrush]::new(
    $rect,
    [System.Drawing.Color]::FromArgb(255, 56, 189, 248),
    [System.Drawing.Color]::FromArgb(255, 129, 140, 248),
    [System.Drawing.Drawing2D.LinearGradientMode]::Horizontal
  )
  $g.FillPath($brush, $path)
  $pen = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(255, 15, 23, 42), 4)
  $g.DrawPath($pen, $path)
  $font = [System.Drawing.Font]::new('Segoe UI Semibold', 48, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
  $emojiFont = [System.Drawing.Font]::new('Segoe UI Emoji', 60, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
  $format = [System.Drawing.StringFormat]::new()
  $format.Alignment = [System.Drawing.StringAlignment]::Center
  $format.LineAlignment = [System.Drawing.StringAlignment]::Center
  $titleRect = [System.Drawing.RectangleF]::new(0, 30, 480, 80)
  $emojiRect = [System.Drawing.RectangleF]::new(0, 100, 480, 60)
  $g.DrawString('Emoji Match', $font, [System.Drawing.Brushes]::White, $titleRect, $format)
  $g.DrawString('😀🎮', $emojiFont, [System.Drawing.Brushes]::White, $emojiRect, $format)
  $brush.Dispose(); $pen.Dispose(); $font.Dispose(); $emojiFont.Dispose(); $path.Dispose()
}

$emojiChars = @('😀','😃','😄','😁','😆','😅','😂','🤣','😊','😇','🙂','🙃','😉','😌','😍','🥳','🤖','🐱','🐶','🐼','🦊','🐸','🐙','🍕','🍩','⚽','🏀','🚀','⭐','🌈','🎧','🎲')
$cardSize = 192
$columns = [int][Math]::Ceiling([Math]::Sqrt($emojiChars.Count))
$rows = [int][Math]::Ceiling($emojiChars.Count / $columns)
$width = $columns * $cardSize
$height = $rows * $cardSize
$atlasBitmap = [System.Drawing.Bitmap]::new($width, $height)
$gAtlas = [System.Drawing.Graphics]::FromImage($atlasBitmap)
$gAtlas.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$gAtlas.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit
$tileBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 241, 245, 249))
$borderPen = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(255, 203, 213, 225), 6)
$emojiFont = [System.Drawing.Font]::new('Segoe UI Emoji', 96, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
$stringFormat = [System.Drawing.StringFormat]::new()
$stringFormat.Alignment = [System.Drawing.StringAlignment]::Center
$stringFormat.LineAlignment = [System.Drawing.StringAlignment]::Center
for ($i = 0; $i -lt $emojiChars.Count; $i++) {
  $col = $i % $columns
  $row = [int]($i / $columns)
  $x = $col * $cardSize
  $y = $row * $cardSize
  $innerRect = [System.Drawing.Rectangle]::new($x + 12, $y + 12, $cardSize - 24, $cardSize - 24)
  $path = New-RoundedPath $innerRect 32
  $gAtlas.FillPath($tileBrush, $path)
  $gAtlas.DrawPath($borderPen, $path)
  $emojiRect = [System.Drawing.RectangleF]::new($x, $y, $cardSize, $cardSize)
  $gAtlas.DrawString($emojiChars[$i], $emojiFont, [System.Drawing.Brushes]::Black, $emojiRect, $stringFormat)
  $path.Dispose()
}
$atlasBitmap.Save((Join-Path $ImageDir 'emoji-atlas.png'), [System.Drawing.Imaging.ImageFormat]::Png)
$gAtlas.Dispose(); $tileBrush.Dispose(); $borderPen.Dispose(); $emojiFont.Dispose();

$frames = @{}
for ($i = 0; $i -lt $emojiChars.Count; $i++) {
  $col = $i % $columns
  $row = [int]($i / $columns)
  $frames["emoji-$i"] = @{
    frame = @{ x = $col * $cardSize; y = $row * $cardSize; w = $cardSize; h = $cardSize }
    rotated = $false
    trimmed = $false
    spriteSourceSize = @{ x = 0; y = 0; w = $cardSize; h = $cardSize }
    sourceSize = @{ w = $cardSize; h = $cardSize }
  }
}
$meta = @{
  app = 'emoji-atlas-generator'
  version = '1.0'
  image = 'emoji-atlas.png'
  size = @{ w = $width; h = $height }
  scale = '1'
}
$atlas = @{ frames = $frames; meta = $meta }
$atlasJson = $atlas | ConvertTo-Json -Depth 6
[System.IO.File]::WriteAllText((Join-Path $ImageDir 'emoji-atlas.json'), $atlasJson, [System.Text.Encoding]::UTF8)