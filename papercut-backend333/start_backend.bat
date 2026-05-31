@echo off
cd /d %~dp0
echo Starting papercut backend on http://127.0.0.1:8001 ...
python -m uvicorn main:app --host 0.0.0.0 --port 8001
pause
