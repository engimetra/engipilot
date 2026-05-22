@echo off
REM ═══════════════════════════════════════════════════════
REM  ENGIPILOT — Démarrage backend Spring Boot (Java 17)
REM  Usage : double-clic ou : scripts\start-backend.cmd
REM ═══════════════════════════════════════════════════════

set JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-17.0.18.8-hotspot
set PATH=%JAVA_HOME%\bin;%PATH%

echo.
echo  ══════════════════════════════════════════
echo   ENGIPILOT Backend — Spring Boot 3.5.1
echo   Java : %JAVA_HOME%
echo   Port : 8080
echo  ══════════════════════════════════════════
echo.

cd /d "%~dp0..\backend"
call mvnw.cmd spring-boot:run -Dspring-boot.run.jvmArguments="-Xms256m -Xmx512m"
