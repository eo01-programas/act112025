@echo off
rem Regenera las vistas JSX precompiladas (js\compiled\*.js).
rem EJECUTAR ESTE ARCHIVO CADA VEZ QUE SE EDITE js\trazabilidad_op.js,
rem de lo contrario la app seguira sirviendo la version anterior.
setlocal

set "CODE=%LocalAppData%\Programs\Microsoft VS Code\Code.exe"

where node >nul 2>nul
if %errorlevel%==0 (
    set "RUNNER=node"
) else if exist "%CODE%" (
    set "ELECTRON_RUN_AS_NODE=1"
    set "RUNNER=%CODE%"
) else (
    echo ERROR: no se encontro Node.js ni VS Code para ejecutar el compilador.
    exit /b 1
)

"%RUNNER%" "%~dp0compile_jsx.js" "%~dp0..\js\trazabilidad_op.js" "%~dp0..\js\compiled\trazabilidad_op.js"
if %errorlevel% neq 0 (
    echo ERROR al compilar trazabilidad_op.js
    exit /b 1
)

echo.
echo Listo. Vistas precompiladas actualizadas.
endlocal
