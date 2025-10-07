param(
  [string]$AudioDir = "src/assets/audio"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

if (-not (Test-Path $AudioDir)) {
  New-Item -ItemType Directory -Path $AudioDir -Force | Out-Null
}

function Write-ToneSequence {
  param(
    [string]$Path,
    [array]$Tones
  )

  $sampleRate = 44100
  $channels = 1
  $bytesPerSample = 2
  $blockAlign = $channels * $bytesPerSample
  $data = New-Object 'System.Collections.Generic.List[Int16]'

  foreach ($tone in $Tones) {
    $frequency = [double]$tone.frequency
    $duration = [double]$tone.duration
    $volume = if ($tone.ContainsKey('volume')) { [double]$tone.volume } else { 0.3 }
    $samples = [int]([Math]::Max(1, [Math]::Round($duration * $sampleRate)))
    $attackSamples = [int]([Math]::Round([Math]::Max(1, $samples * 0.05)))
    for ($i = 0; $i -lt $samples; $i++) {
      $phase = 2 * [Math]::PI * $frequency * ($i / $sampleRate)
      $amplitude = [Math]::Sin($phase)
      $envelopeIn = [Math]::Min(1.0, $i / [Math]::Max(1, $attackSamples))
      $envelopeOut = [Math]::Min(1.0, ($samples - $i - 1) / [Math]::Max(1, $attackSamples))
      $envelope = [Math]::Min($envelopeIn, $envelopeOut)
      $value = [int]([Math]::Round(32767 * $volume * $amplitude * $envelope))
      if ($value -gt 32767) { $value = 32767 }
      if ($value -lt -32768) { $value = -32768 }
      $data.Add([Int16]$value) | Out-Null
    }
  }

  $dataSize = $data.Count * $blockAlign
  $riffChunkSize = 36 + $dataSize
  $fileStream = [System.IO.File]::Create($Path)
  $writer = New-Object System.IO.BinaryWriter($fileStream, [System.Text.Encoding]::ASCII)

  $writer.Write([System.Text.Encoding]::ASCII.GetBytes('RIFF'))
  $writer.Write([int]$riffChunkSize)
  $writer.Write([System.Text.Encoding]::ASCII.GetBytes('WAVE'))
  $writer.Write([System.Text.Encoding]::ASCII.GetBytes('fmt '))
  $writer.Write([int]16)
  $writer.Write([int16]1)
  $writer.Write([int16]$channels)
  $writer.Write([int]$sampleRate)
  $writer.Write([int]($sampleRate * $blockAlign))
  $writer.Write([int16]$blockAlign)
  $writer.Write([int16](8 * $bytesPerSample))
  $writer.Write([System.Text.Encoding]::ASCII.GetBytes('data'))
  $writer.Write([int]$dataSize)

  foreach ($sample in $data) {
    $writer.Write([Int16]$sample)
  }

  $writer.Dispose()
  $fileStream.Dispose()
}

Write-ToneSequence -Path (Join-Path $AudioDir 'match.wav') -Tones @(
  @{ frequency = 660; duration = 0.18; volume = 0.35 }
)

Write-ToneSequence -Path (Join-Path $AudioDir 'mismatch.wav') -Tones @(
  @{ frequency = 330; duration = 0.16; volume = 0.28 }
  @{ frequency = 210; duration = 0.22; volume = 0.24 }
)

Write-ToneSequence -Path (Join-Path $AudioDir 'success.wav') -Tones @(
  @{ frequency = 440; duration = 0.12; volume = 0.3 }
  @{ frequency = 560; duration = 0.12; volume = 0.32 }
  @{ frequency = 720; duration = 0.18; volume = 0.34 }
)

Write-ToneSequence -Path (Join-Path $AudioDir 'countdown.wav') -Tones @(
  @{ frequency = 220; duration = 0.3; volume = 0.3 }
)
