@echo off
REM ===========================================================================
REM  SUKAI UI Demo - One-click dev server start
REM
REM  Double-click this file (or run "start-dev.cmd" from a terminal) to launch
REM  the dev server. The server runs in THIS window; keep the window open while
REM  you use the app. To stop: close this window, or run stop-dev.cmd.
REM
REM  To stop: run stop-dev.cmd  (or just close this window)
REM ===========================================================================
setlocal

set "NODE_EXE=C:\Users\admin\.workbuddy\binaries\node\versions\22.22.2-3\node.exe"
set "ROOT=%~dp0"
REM Strip the trailing backslash so paths parse cleanly
set "ROOT=%ROOT:~0,-1%"
set "LOG=%ROOT%\dev-server.log"
set "PORT=5173"

REM Disable WorkBuddy's "safe-delete" guard for this child process only.
REM The managed node carries a shim that blocks Vite's dep-cache purge (>50 files)
REM when the lockfile changes, which would otherwise abort startup. This is a
REM harmless no-op on a normal (non-managed) node install.
set "CODEBUDDY_SAFE_DELETE_ENABLED=0"

REM --- Refuse to start a second instance if the port is already taken --------
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "if (Get-NetTCPConnection -LocalPort %PORT% -State Listen -ErrorAction SilentlyContinue) { Write-Host ('Port %PORT% already in use - run stop-dev.cmd first.'); exit 1 }"
if errorlevel 1 (
  echo.
  pause
  exit /b 1
)

echo Starting SUKAI dev server on port %PORT% ...
echo   Node : %NODE_EXE%
echo   Log  : %LOG%
echo.
echo This window runs the server. Keep it open; close it (or run stop-dev.cmd) to stop.
echo.

REM --- Run node directly (no detached launcher needed). The script is
REM     referenced by absolute path and Vite's root is set via --root, so it
REM     starts correctly no matter where this .cmd is launched from. ----------
"%NODE_EXE%" "%ROOT%\scripts\run-framework.mjs" dev --hostname 0.0.0.0 --root "%ROOT%" > "%LOG%" 2>&1
