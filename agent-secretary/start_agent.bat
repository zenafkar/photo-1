@echo off
echo Starting Agent Secretary v1.5.0...
echo.

:: Set environment variables
set SECRETARY_WEBHOOK_URL=https://discord.com/api/webhooks/1534548715728011395/UiWxYK489xW1RCaKH-Onh26t0PH6ZYBYngBzTqewai5zTJCaZOauZ69DV_tXX7bRSdsp
set SECRETARY_AUTH_TOKEN=zen_secretary_2026

:: Start agent
python secretary_agent.py
pause
