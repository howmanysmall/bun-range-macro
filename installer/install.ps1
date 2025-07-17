#!/usr/bin/env pwsh

$ScriptName = "__setup-plugin__.ts"

if (-not (Get-Command bun -ErrorAction SilentlyContinue)) {
    Write-Host "Bun is not installed. Please install Bun to use this script."
    exit 1
}

# Cleanup on any exit
$cleanup = {
    if (Test-Path $ScriptName) {
        Remove-Item $ScriptName -Force
    }
}
Register-EngineEvent PowerShell.Exiting -Action $cleanup | Out-Null

bun add bun-range-macro
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/howmanysmall/bun-range-macro/refs/heads/main/scripts/setup-plugin.ts" -OutFile $ScriptName -UseBasicParsing
bun run $ScriptName

if (Test-Path $ScriptName) {
    Remove-Item $ScriptName -Force
}
