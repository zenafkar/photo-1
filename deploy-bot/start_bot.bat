@echo off
rem ==========================================
rem Start Deploy Bot ZenDev (Telegram)
rem ==========================================
cd /d "%~dp0"

rem Aktifkan virtual env jika ada
if exist .venv\Scripts\activate.bat call .venv\Scripts\activate.bat

python bot.py
echo.
echo Bot berhenti. Tekan tombol apa pun untuk menutup.
pause >nul
