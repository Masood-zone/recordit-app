param(
    [switch]$NoBuild
)

$ErrorActionPreference = "Stop"

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$bridgeDir = Join-Path $root "recordit-fingerprint-bridge"
$solution = Join-Path $bridgeDir "RecordIT.FingerprintBridge.sln"
$exe = Join-Path $bridgeDir "bin\x86\Debug\RecordIT.FingerprintBridge.exe"
$port = 5050

function Test-PortListening {
    param([int]$Port)
    $connection = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue |
        Where-Object { $_.OwningProcess -ne 0 } |
        Select-Object -First 1
    return $null -ne $connection
}

if (Test-PortListening -Port $port) {
    Write-Host "RecordIT fingerprint bridge is already listening on http://localhost:$port"
    exit 0
}

if (-not $NoBuild) {
    $msbuild = "C:\Windows\Microsoft.NET\Framework\v4.0.30319\MSBuild.exe"
    if (-not (Test-Path $msbuild)) {
        throw "MSBuild for .NET Framework was not found at $msbuild. Install Visual Studio Build Tools or run the prebuilt EXE manually."
    }

    Write-Host "Building RecordIT fingerprint bridge..."
    & $msbuild $solution /p:Platform=x86 /p:Configuration=Debug
    if ($LASTEXITCODE -ne 0) {
        throw "Bridge build failed."
    }
}

if (-not (Test-Path $exe)) {
    throw "Bridge executable was not found at $exe"
}

Write-Host "Starting RecordIT fingerprint bridge..."
Start-Process -FilePath $exe -WorkingDirectory (Split-Path $exe)

for ($i = 0; $i -lt 15; $i++) {
    Start-Sleep -Milliseconds 500
    if (Test-PortListening -Port $port) {
        Write-Host "Bridge is running at http://localhost:$port"
        exit 0
    }
}

Write-Host "Bridge process was started, but port $port did not respond yet. Check the WinForms window for SDK or device errors."
