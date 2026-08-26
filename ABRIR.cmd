@echo off
rem Abre Vera: levanta el servidor local y abre el navegador.
rem La camara y el microfono necesitan localhost; por eso no basta
rem con abrir el index.html directamente.
cd /d "%~dp0"
start "Servidor Vera" cmd /c "node servidor.js"
timeout /t 2 >nul
start "" "http://localhost:8240"
