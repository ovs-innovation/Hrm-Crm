# Vastora laptop agent. Tracks the foreground app, idle time, click and key counts,
# and file saves. It does not record which keys were typed, and it does not take screenshots.
# Leave it installed. It starts again at the next Windows sign-in.

$ErrorActionPreference = 'Stop'

$api = if ($env:VASTORA_API) { $env:VASTORA_API.TrimEnd('/') } else { 'https://hrm.vastoratech.com' }
$token = $env:VASTORA_TOKEN
if (-not $token) {
  Write-Host 'This agent file has no login. Download it again from Work from home.'
  exit 1
}

$createdNew = $false
$mutex = New-Object System.Threading.Mutex($false, 'Local\VastoraWfhAgent', [ref]$createdNew)
if (-not $mutex.WaitOne(0)) {
  Write-Host 'Vastora agent is already running.'
  exit 0
}

$logDir = Join-Path $env:LOCALAPPDATA 'Vastora'
New-Item -ItemType Directory -Force -Path $logDir | Out-Null
$logFile = Join-Path $logDir 'agent.log'

function Write-Log([string]$line) {
  $stamp = '{0:HH:mm:ss} {1}' -f (Get-Date), $line
  Write-Host $stamp
  try { Add-Content -Path $logFile -Value $stamp -ErrorAction SilentlyContinue } catch {}
}

Write-Log "Vastora agent started. Sending to $api"

if ($PSCommandPath) {
  $task = "powershell.exe -NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$PSCommandPath`""
  try {
    schtasks.exe /Create /F /TN "Vastora WFH" /SC ONLOGON /RL LIMITED /TR $task | Out-Null
  } catch {
    Write-Log 'Sign-in task was not created. The Startup folder copy will still launch it.'
  }
  try {
    $startup = [Environment]::GetFolderPath('Startup')
    $launcher = Join-Path $startup 'VastoraAgent.cmd'
    Set-Content -Path $launcher -Encoding ASCII -Value "@echo off`r`nstart `"`" powershell.exe -NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$PSCommandPath`"`r`n"
    Write-Log 'Installed for this Windows user. It starts again at the next sign-in on this PC.'
  } catch {
    Write-Log 'Could not add the Startup launcher. This window still tracks until you close it.'
  }
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
$fileQueue = [System.Collections.Concurrent.ConcurrentQueue[string]]::new()
foreach ($folder in @([Environment]::GetFolderPath('Desktop')), ([Environment]::GetFolderPath('MyDocuments')), (Join-Path $env:USERPROFILE 'Downloads')) {
  if (-not (Test-Path $folder)) { continue }
  $watcher = New-Object System.IO.FileSystemWatcher $folder
  $watcher.IncludeSubdirectories = $true
  $watcher.EnableRaisingEvents = $true
  $watcher.NotifyFilter = [IO.NotifyFilters]'FileName, LastWrite'
  foreach ($eventName in @('Created', 'Changed', 'Deleted', 'Renamed')) {
    Register-ObjectEvent -InputObject $watcher -EventName $eventName -MessageData $fileQueue -Action {
      $path = $Event.SourceEventArgs.FullPath
      if ($path -match '\\(node_modules|AppData|\.git)\\') { return }
      $action = switch ($Event.SourceEventArgs.ChangeType.ToString()) {
        'Created' { 'created' }
        'Deleted' { 'deleted' }
        default { 'modified' }
      }
      $Event.MessageData.Enqueue("$action|$([IO.Path]::GetFileName($path))")
    } | Out-Null
  }
}

function Get-IdleSeconds {
  $info = New-Object VastoraWin+LASTINPUTINFO
  $info.cbSize = [System.Runtime.InteropServices.Marshal]::SizeOf($info)
  [void][VastoraWin]::GetLastInputInfo([ref]$info)
  $idle = [Environment]::TickCount - [int]$info.dwTime
  if ($idle -lt 0) { $idle += [uint32]::MaxValue }
  return [Math]::Max(0, [Math]::Round($idle / 1000))
}

function Get-Front {
  $hwnd = [VastoraWin]::GetForegroundWindow()
  $title = New-Object System.Text.StringBuilder 512
  [void][VastoraWin]::GetWindowText($hwnd, $title, $title.Capacity)
  $procId = 0
  [void][VastoraWin]::GetWindowThreadProcessId($hwnd, [ref]$procId)
  $name = 'unknown'
  try { $name = (Get-Process -Id $procId -ErrorAction Stop).ProcessName } catch {}
  return @{ App = $name; Window = $title.ToString() }
}

function Get-Project([string]$app, [string]$title) {
  if ($app -notmatch 'Code|Cursor|studio|devenv') { return '' }
  $parts = $title -split ' [-—|] '
  if ($parts.Count -ge 2) { return $parts[$parts.Count - 2].Trim() }
  return ''
}

Write-Log 'Vastora agent is running. Close this window to stop this session. Sign-in will start it again.'
$held = @{}

while ($true) {
  $started = Get-Date
  $clicks = 0
  $keys = 0
  while (((Get-Date) - $started).TotalSeconds -lt 30) {
    foreach ($vk in 1, 2) {
      $down = ([VastoraWin]::GetAsyncKeyState($vk) -band 0x8000) -ne 0
      if ($down -and -not $held[$vk]) { $clicks++ }
      $held[$vk] = $down
    }
    foreach ($vk in 8, 9, 13, 16, 17, 18, 20, 27, 32, 33, 34, 35, 36, 37, 38, 39, 40, 45, 46) {
      $down = ([VastoraWin]::GetAsyncKeyState($vk) -band 0x8000) -ne 0
      if ($down -and -not $held["k$vk"]) { $keys++ }
      $held["k$vk"] = $down
    }
    48..90 | ForEach-Object {
      $vk = $_
      $down = ([VastoraWin]::GetAsyncKeyState($vk) -band 0x8000) -ne 0
      if ($down -and -not $held["k$vk"]) { $keys++ }
      $held["k$vk"] = $down
    }
    96..107 | ForEach-Object {
      $vk = $_
      $down = ([VastoraWin]::GetAsyncKeyState($vk) -band 0x8000) -ne 0
      if ($down -and -not $held["k$vk"]) { $keys++ }
      $held["k$vk"] = $down
    }
    186..222 | ForEach-Object {
      $vk = $_
      $down = ([VastoraWin]::GetAsyncKeyState($vk) -band 0x8000) -ne 0
      if ($down -and -not $held["k$vk"]) { $keys++ }
      $held["k$vk"] = $down
    }
    Start-Sleep -Milliseconds 200
  }

  try {
    $elapsed = [Math]::Max(1, [int]((Get-Date) - $started).TotalSeconds)
    $front = Get-Front
    $status = 'working'
    if ($front.App -match 'zoom|teams|webex|skype') { $status = 'meeting' }
    $body = @{
      elapsed = [Math]::Min(60, $elapsed)
      idleSeconds = Get-IdleSeconds
      app = $front.App
      window = $front.Window
      project = (Get-Project $front.App $front.Window)
      status = $status
      clicks = $clicks
      keys = $keys
      files = @()
    }
    $item = $null
    $taken = 0
    while ($taken -lt 20 -and $fileQueue.TryDequeue([ref]$item)) {
      $bits = $item -split '\|', 2
      if ($bits.Count -eq 2) { $body.files += @{ action = $bits[0]; name = $bits[1] } }
      $taken++
    }
    $json = $body | ConvertTo-Json -Compress -Depth 6
    $res = Invoke-RestMethod -Method Post -Uri "$api/api/wfh/agent" -Headers @{ Authorization = "Bearer $token" } -ContentType 'application/json; charset=utf-8' -Body $json -TimeoutSec 25
    Write-Log ("{0}  status={1}  clicks={2}  keys={3}  active={4}m" -f $front.App, $res.status, $clicks, $keys, $res.activeMinutes)
  } catch {
    Write-Log ("send failed, retrying: {0}" -f $_.Exception.Message)
    Start-Sleep -Seconds 10
  }
}
