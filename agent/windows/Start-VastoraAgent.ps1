# Vastora work-from-home agent. The window stays open.
# Counts mouse clicks and key presses. Does not send which keys were typed.

$ErrorActionPreference = 'Stop'
$api = if ($env:VASTORA_API) { $env:VASTORA_API.TrimEnd('/') } else { 'http://localhost:5000' }
$token = $env:VASTORA_TOKEN
if (-not $token) {
  Write-Host 'Set VASTORA_TOKEN to the employee access token, then run this again.'
  exit 1
}
Add-Type @"
using System;
using System.Runtime.InteropServices;
using System.Text;
public static class VastoraWin {
  [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll")] public static extern int GetWindowText(IntPtr hWnd, StringBuilder text, int count);
  [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint processId);
  [DllImport("user32.dll")] public static extern short GetAsyncKeyState(int vKey);
  [StructLayout(LayoutKind.Sequential)] public struct LASTINPUTINFO {
    public uint cbSize;
    public uint dwTime;
  }
  [DllImport("user32.dll")] public static extern bool GetLastInputInfo(ref LASTINPUTINFO plii);
}
"@
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$global:vastoraFiles = New-Object System.Collections.Generic.List[string]
$watchers = @()
foreach ($folder in @([Environment]::GetFolderPath('Desktop')), ([Environment]::GetFolderPath('MyDocuments')), (Join-Path $env:USERPROFILE 'Downloads')) {
  if (-not (Test-Path $folder)) { continue }
  $watcher = New-Object System.IO.FileSystemWatcher $folder
  $watcher.IncludeSubdirectories = $true
  $watcher.EnableRaisingEvents = $true
  $watcher.NotifyFilter = [IO.NotifyFilters]'FileName, LastWrite'
  foreach ($eventName in @('Created', 'Changed', 'Deleted', 'Renamed')) {
    Register-ObjectEvent -InputObject $watcher -EventName $eventName -Action {
      $path = $Event.SourceEventArgs.FullPath
      if ($path -match '\\(node_modules|AppData|\.git)\\') { return }
      $action = switch ($Event.SourceEventArgs.ChangeType.ToString()) {
        'Created' { 'created' }
        'Deleted' { 'deleted' }
        'Renamed' { 'modified' }
        default { 'modified' }
      }
      $global:vastoraFiles.Add("$action|$([IO.Path]::GetFileName($path))")
    } | Out-Null
  }
  $watchers += $watcher
}

function Get-IdleSeconds {
  $info = New-Object VastoraWin+LASTINPUTINFO
  $info.cbSize = [System.Runtime.InteropServices.Marshal]::SizeOf($info)
  [void][VastoraWin]::GetLastInputInfo([ref]$info)
  $idle = [Environment]::TickCount - [int]$info.dwTime
  if ($idle -lt 0) { $idle += [uint32]::MaxValue }
  return [Math]::Round($idle / 1000)
}

function Get-Front {
  $hwnd = [VastoraWin]::GetForegroundWindow()
  $title = New-Object System.Text.StringBuilder 256
  [void][VastoraWin]::GetWindowText($hwnd, $title, $title.Capacity)
  $procId = 0
  [void][VastoraWin]::GetWindowThreadProcessId($hwnd, [ref]$procId)
  $name = 'unknown'
  try { $name = (Get-Process -Id $procId -ErrorAction Stop).ProcessName } catch {}
  return @{ App = $name; Window = $title.ToString() }
}

function Get-Project([string]$app, [string]$title) {
  if ($app -notmatch 'Code|Cursor|studio') { return '' }
  $parts = $title -split ' [-—|] '
  if ($parts.Count -ge 2) { return $parts[$parts.Count - 2].Trim() }
  return ''
}

function Get-Shot {
  $bounds = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
  $bmp = New-Object System.Drawing.Bitmap $bounds.Width, $bounds.Height
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.CopyFromScreen($bounds.Location, [System.Drawing.Point]::Empty, $bounds.Size)
  $height = [Math]::Max(1, [int](640 * $bounds.Height / $bounds.Width))
  $small = New-Object System.Drawing.Bitmap 640, $height
  $sg = [System.Drawing.Graphics]::FromImage($small)
  $sg.DrawImage($bmp, 0, 0, $small.Width, $small.Height)
  $ms = New-Object System.IO.MemoryStream
  $small.Save($ms, [System.Drawing.Imaging.ImageFormat]::Jpeg)
  $g.Dispose(); $sg.Dispose(); $bmp.Dispose(); $small.Dispose()
  return 'data:image/jpeg;base64,' + [Convert]::ToBase64String($ms.ToArray())
}

Write-Host 'Vastora agent is running. Close this window to stop.'
Write-Host 'Key names are not stored. Only click and key counts are sent.'
$lastShot = [DateTime]::MinValue
$held = @{}

while ($true) {
  $clicks = 0
  $keys = 0
  $steps = 60
  for ($i = 0; $i -lt $steps; $i++) {
    foreach ($vk in 1, 2) {
      $down = ([VastoraWin]::GetAsyncKeyState($vk) -band 0x8000) -ne 0
      if ($down -and -not $held[$vk]) { $clicks++ }
      $held[$vk] = $down
    }
    foreach ($vk in 8, 9, 13, 32, 46) {
      $down = ([VastoraWin]::GetAsyncKeyState($vk) -band 0x8000) -ne 0
      if ($down -and -not $held["k$vk"]) { $keys++ }
      $held["k$vk"] = $down
    }
    65..90 | ForEach-Object {
      $vk = $_
      $down = ([VastoraWin]::GetAsyncKeyState($vk) -band 0x8000) -ne 0
      if ($down -and -not $held["k$vk"]) { $keys++ }
      $held["k$vk"] = $down
    }
    Start-Sleep -Milliseconds 500
  }

  $front = Get-Front
  $status = 'working'
  if ($front.App -match 'zoom|teams|webex|skype') { $status = 'meeting' }
  $body = @{
    elapsed = [Math]::Max(1, [int]($steps / 2))
    idleSeconds = Get-IdleSeconds
    app = $front.App
    window = $front.Window
    project = (Get-Project $front.App $front.Window)
    status = $status
    clicks = $clicks
    keys = $keys
    files = @()
  }
  $pending = @($global:vastoraFiles)
  $global:vastoraFiles.Clear()
  foreach ($item in ($pending | Select-Object -First 20)) {
    $bits = $item -split '\|', 2
    if ($bits.Count -eq 2) { $body.files += @{ action = $bits[0]; name = $bits[1] } }
  }
  if (((Get-Date) - $lastShot).TotalMinutes -ge 10) {
    $body.screenshot = Get-Shot
    $lastShot = Get-Date
  }
  try {
    $json = $body | ConvertTo-Json -Compress -Depth 6
    $res = Invoke-RestMethod -Method Post -Uri "$api/api/wfh/agent" -Headers @{ Authorization = "Bearer $token" } -ContentType 'application/json' -Body $json
    Write-Host ("{0:HH:mm:ss} {1}  status={2}  clicks={3}  keys={4}  active={5}m" -f (Get-Date), $front.App, $res.status, $clicks, $keys, $res.activeMinutes)
  } catch {
    Write-Host ("{0:HH:mm:ss} send failed: {1}" -f (Get-Date), $_.Exception.Message)
  }
}
