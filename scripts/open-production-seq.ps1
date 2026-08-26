<#
.SYNOPSIS
Opens an SSH tunnel to the production Seq UI.

.DESCRIPTION
Seq is bound to localhost on the VPS. This script forwards local port 5341 to
the VPS so http://localhost:5341 opens production Seq from this machine.
#>

param(
    [string]$VpsHost = $env:DAILY_NAGGER_DEPLOY_HOST,
    [string]$VpsUser = "root",
    [string]$SshKeyPath = "E:\Secrets\DailyNagger\ssh\dailynagger_hetzner",
    [string]$KnownHostsPath = "E:\Secrets\DailyNagger\ssh\known_hosts",
    [int]$LocalPort = 5341
)

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($VpsHost)) {
    $VpsHost = "46.225.130.77"
}

if (!(Test-Path $SshKeyPath)) {
    throw "SSH key not found: $SshKeyPath"
}

if (!(Test-Path $KnownHostsPath)) {
    throw "known_hosts file not found: $KnownHostsPath"
}

$destination = "${VpsUser}@${VpsHost}"
$seqUrl = "http://localhost:$LocalPort"

Write-Host "Opening DailyNagger production Seq tunnel..."
Write-Host "VPS: $destination"
Write-Host "Local Seq URL: $seqUrl"
Write-Host "Keep this terminal open while using Seq."

Start-Process $seqUrl

& ssh `
    -i $SshKeyPath `
    -o "UserKnownHostsFile=$KnownHostsPath" `
    -L "${LocalPort}:127.0.0.1:5341" `
    $destination
