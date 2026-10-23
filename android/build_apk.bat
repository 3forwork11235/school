@echo off
rem Собирает APK «Школьный забег» из файлов игры этой папки
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0build.ps1"
pause
