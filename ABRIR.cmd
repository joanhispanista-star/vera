@echo off
rem Abre Vera: prende el servidor local (si hace falta) y abre el navegador.
rem La camara y el microfono necesitan localhost; por eso no basta con
rem abrir el index.html directamente ni con guardar el link en favoritos:
rem el link http://localhost:8240 solo responde mientras el servidor viva.
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo No se encontro Node en este computador.
  echo Instalalo desde nodejs.org y vuelve a hacer doble clic aqui.
  pause
  exit /b 1
)

rem Si el servidor ya esta prendido, solo abrimos el navegador.
netstat -ano | findstr ":8240" | findstr "LISTENING" >nul 2>nul
if not errorlevel 1 (
  start "" "http://localhost:8240"
  exit /b 0
)

start "Servidor Vera - NO cierres esta ventana mientras uses la app" cmd /k "node servidor.js"
timeout /t 2 >nul
start "" "http://localhost:8240"
