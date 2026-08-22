@echo off
setlocal
dotnet run --project tools/configure -- configure .
if errorlevel 1 exit /b %errorlevel%
if exist tools rmdir /s /q tools
if exist configure-template.cmd del /q configure-template.cmd
if exist configure-template.sh del /q configure-template.sh
exit /b 0
