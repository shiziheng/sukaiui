@echo off
REM ===========================================================================
REM  SUKAI UI Demo - One-click dev server stop
REM
REM  Stops the dev server started by start-dev.cmd. First tries the PID saved
REM  in dev-server.pid, then falls back to killing whatever is listening on
REM  port 5173.
REM ===========================================================================
setlocal

set "ROOT=%~dp0"
set "PID=%ROOT%dev-server.pid"
set "PORT=5173"

echo Stopping SUKAI dev server ...

REM --- 1) Kill by PID file if present ----------------------------------------
if exist "%PID%" (
  for /f "usebackq delims=" %%p in ("%PID%") do (
    taskkill /PID %%p /T /F >nul 2>&1 && echo Stopped PID %%p
  )
  del /f /q "%PID%" >nul 2>&1
) else (
  echo No PID file found (dev-server.pid) - trying port lookup.
)

REM --- 2) Fallback: kill whatever is listening on the port --------------------
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$port=%PORT%; $conns = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue;" ^
  "if ($conns) { $conns | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue; Write-Host ('Killed process on port ' + $port) } } else { Write-Host ('No process listening on port ' + $port) }"

echo Done.
endlocal
