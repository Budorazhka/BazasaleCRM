param(
    [Parameter(Mandatory = $true)]
    [int]$Port
)

$listenLines = netstat -ano | Select-String -Pattern "[:\.]$Port\s+.*LISTENING"

if (-not $listenLines) {
    Write-Host "Port $Port is free"
    exit 0
}

$procIds = @()
foreach ($line in $listenLines) {
    $parts = ($line.Line -replace "\s+", " ").Trim().Split(" ")
    if ($parts.Length -ge 5) {
        $pidValue = 0
        if ([int]::TryParse($parts[-1], [ref]$pidValue) -and $pidValue -gt 0) {
            $procIds += $pidValue
        }
    }
}

$procIds = $procIds | Sort-Object -Unique

if (-not $procIds) {
    Write-Host "Port $Port is free"
    exit 0
}

foreach ($procId in $procIds) {
    try {
        Stop-Process -Id $procId -Force -ErrorAction Stop
        Write-Host "Stopped PID $procId"
    }
    catch {
        Write-Host "Failed to stop PID ${procId}: $($_.Exception.Message)"
    }
}
