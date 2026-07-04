@echo off
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\run-bridge.ps1" %*
