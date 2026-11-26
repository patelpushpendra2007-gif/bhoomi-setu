@echo off
title BHOOMI-SETU (v3.0) - National Digital Land Acquisition Ecosystem
cd /d "%~dp0"
echo Starting BHOOMI-SETU Full-Stack Server...
echo Portal URL: http://localhost:3050/login
start "" http://localhost:3050/login
node server/index.js
pause
