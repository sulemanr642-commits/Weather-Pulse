@echo off
echo ===================================================
echo   Starting WeatherPulse Local Services (PG + Redis)
echo ===================================================

:: Start PostgreSQL 17
echo Starting PostgreSQL 17...
"C:\Users\DELL\tools\pgsql\bin\pg_ctl.exe" -D "C:\Users\DELL\tools\pgsql\data" -l "C:\Users\DELL\tools\pgsql\logfile.txt" start

:: Start Redis 8
echo Starting Redis Server...
start "Redis Server" /B "C:\Users\DELL\AppData\Local\Microsoft\WinGet\Packages\taizod1024.redis-windows-fork_Microsoft.Winget.Source_8wekyb3d8bbwe\Redis-8.10.1-Windows-x64-msys2\redis-server.exe"

echo Services started successfully!
echo   - PostgreSQL: localhost:5432 (user: postgres)
echo   - Redis:      localhost:6379
echo ===================================================
