@echo off
echo ===================================================
echo   Stopping WeatherPulse Local Services (PG + Redis)
echo ===================================================

:: Stop PostgreSQL 17
echo Stopping PostgreSQL 17...
"C:\Users\DELL\tools\pgsql\bin\pg_ctl.exe" -D "C:\Users\DELL\tools\pgsql\data" stop

:: Stop Redis 8
echo Stopping Redis Server...
taskkill /F /IM redis-server.exe >nul 2>&1

echo Services stopped cleanly!
echo ===================================================
