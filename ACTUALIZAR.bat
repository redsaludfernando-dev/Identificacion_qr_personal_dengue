@echo off
setlocal EnableDelayedExpansion
chcp 65001 >nul 2>&1
cd /d "%~dp0"
title Actualizar fotochecks QR - Personal Dengue

set "REPO_URL=https://redsaludfernando-dev.github.io/Identificacion_qr_personal_dengue"
set "RAMA=main"

echo.
echo ============================================================
echo   ACTUALIZAR FOTOCHECKS QR - PERSONAL DENGUE
echo   UNGET Rioja - Vigilancia y Control Vectorial
echo ============================================================
echo.

REM ----------------------------------------------------------------
REM  PASO 0 - Comprobar que las herramientas esten instaladas
REM ----------------------------------------------------------------
echo [0/7] Comprobando herramientas...

where git >nul 2>&1
if errorlevel 1 (
    echo.
    echo   ERROR: No se encontro Git en este equipo.
    echo   Instalalo desde https://git-scm.com/ y vuelve a intentar.
    goto :fin_error
)

where node >nul 2>&1
if errorlevel 1 (
    echo.
    echo   ERROR: No se encontro Node.js en este equipo.
    echo   Instalalo desde https://nodejs.org/ y vuelve a intentar.
    goto :fin_error
)

git rev-parse --is-inside-work-tree >nul 2>&1
if errorlevel 1 (
    echo.
    echo   ERROR: Esta carpeta no es un repositorio Git.
    echo   Carpeta actual: %CD%
    goto :fin_error
)

if exist ".git\rebase-merge" goto :rebase_pendiente
if exist ".git\rebase-apply" goto :rebase_pendiente
if exist ".git\MERGE_HEAD"   goto :rebase_pendiente

if not exist "node_modules\" (
    echo   Faltan las dependencias. Instalando ^(esto puede tardar un minuto^)...
    call npm install
    if errorlevel 1 (
        echo.
        echo   ERROR: Fallo "npm install".
        goto :fin_error
    )
)
echo   OK - Git y Node.js listos.
echo.

REM ----------------------------------------------------------------
REM  PASO 1 - Regenerar datos.json y los QR que falten
REM ----------------------------------------------------------------
echo [1/7] Regenerando datos.json y codigos QR...
echo.
call node generar.js
if errorlevel 1 (
    echo.
    echo   ERROR: Fallo la generacion. Revisa el mensaje de arriba.
    echo   Lo mas comun: el archivo CSV esta abierto en Excel. Cierralo.
    goto :fin_error
)
echo.

REM ----------------------------------------------------------------
REM  PASO 2 - Verificar que todo este coherente (freno de seguridad)
REM ----------------------------------------------------------------
echo [2/7] Verificando que todo este correcto...
echo.
call node verificar.js
if errorlevel 1 (
    echo.
    echo ============================================================
    echo   SE DETUVO: hay ERRORES en los datos.
    echo   NO se subio nada. Corrige lo que aparece en rojo
    echo   arriba y vuelve a ejecutar este archivo.
    echo ============================================================
    goto :fin_error
)
echo.

REM ----------------------------------------------------------------
REM  PASO 3 - Confirmar los cambios (commit)
REM ----------------------------------------------------------------
echo [3/7] Preparando los cambios...

for /f "delims=" %%c in ('git status --porcelain') do set "HAY_CAMBIOS=1"

if not defined HAY_CAMBIOS (
    for /f "delims=" %%a in ('git rev-list --count origin/%RAMA%..%RAMA% 2^>nul') do set "PENDIENTES=%%a"
    if "!PENDIENTES!"=="0" (
        echo   No hay nada nuevo que subir.
        echo   Igual reviso GitHub para que tu copia no se quede vieja.
        set "SIN_CAMBIOS=1"
    ) else (
        echo   No hay archivos modificados, pero hay !PENDIENTES! commit^(s^) sin subir.
    )
    echo.
    goto :paso_pull
)

echo.
echo   Archivos que se van a subir:
git status --short
echo.

for /f "delims=" %%d in ('powershell -NoProfile -Command "Get-Date -Format \"yyyy-MM-dd HH:mm\""') do set "FECHA=%%d"
set "POR_DEFECTO=Actualizar datos del personal - !FECHA!"

set "MENSAJE=%~1"
if not defined MENSAJE (
    echo   Escribe una descripcion del cambio y pulsa ENTER.
    echo   ^(Si lo dejas vacio se usara: "!POR_DEFECTO!"^)
    echo.
    set /p "MENSAJE=  Descripcion: "
)

REM  Si quedo vacio o es demasiado corto para significar algo, usamos el texto por defecto.
if not defined MENSAJE set "MENSAJE=!POR_DEFECTO!"
set "PRUEBA=!MENSAJE:~4!"
if not defined PRUEBA (
    echo   ^(Descripcion demasiado corta, se usara la de por defecto.^)
    set "MENSAJE=!POR_DEFECTO!"
)

git add -A
if errorlevel 1 (
    echo.
    echo   ERROR: Fallo "git add".
    goto :fin_error
)

git commit -m "!MENSAJE!" >nul
if errorlevel 1 (
    echo.
    echo   ERROR: Fallo "git commit".
    goto :fin_error
)
echo.
echo   OK - Cambios confirmados localmente.
echo.

REM ----------------------------------------------------------------
REM  PASO 4 - Traer lo que haya en GitHub antes de subir
REM ----------------------------------------------------------------
:paso_pull
echo [4/7] Trayendo cambios desde GitHub...
git pull --rebase origin %RAMA%
if not errorlevel 1 goto :paso_push

REM  El pull fallo. Si no hay rebase a medias, fue un problema de red.
if not exist ".git\rebase-merge" (
    echo.
    echo   ERROR: No se pudo conectar con GitHub.
    echo   Revisa tu conexion a internet y vuelve a intentar.
    echo   No se subio nada; tus cambios quedaron guardados localmente.
    goto :fin_error
)

REM  Hay conflicto. Vemos que archivos chocaron.
echo.
echo   Se detecto un CONFLICTO. Analizando...
set "CONF_TOTAL=0"
set "CONF_OTROS=0"
for /f "delims=" %%f in ('git diff --name-only --diff-filter=U') do (
    set /a CONF_TOTAL+=1
    if /i not "%%f"=="datos.json" (
        set /a CONF_OTROS+=1
        echo     - %%f
    )
)

if !CONF_OTROS! GTR 0 goto :conflicto_manual

REM  Solo choco datos.json, que es un archivo generado: se puede rehacer.
echo   Solo choco datos.json, que se genera automaticamente.
echo   Lo regenero desde el CSV y continuo...
call node generar.js >nul
if errorlevel 1 goto :conflicto_manual
git add datos.json
set "GIT_EDITOR=true"
git rebase --continue >nul 2>&1
if errorlevel 1 goto :conflicto_manual
echo   OK - Conflicto resuelto automaticamente.

:paso_push
echo.

REM ----------------------------------------------------------------
REM  PASO 5 - Volver a revisar DESPUES de combinar con GitHub
REM
REM  Importante: git puede combinar datos.json linea por linea sin
REM  avisar de conflicto, y dejarlo diciendo algo distinto al CSV.
REM  Por eso se regenera y se vuelve a verificar antes de subir.
REM ----------------------------------------------------------------
echo [5/7] Revisando de nuevo tras combinar con GitHub...
call node generar.js >nul
if errorlevel 1 (
    echo.
    echo   ERROR: Fallo la regeneracion despues del pull.
    goto :fin_error
)

set "REGENERADO="
for /f "delims=" %%c in ('git status --porcelain') do set "REGENERADO=1"
if defined REGENERADO (
    echo   Los cambios de GitHub obligaron a rehacer datos.json. Lo confirmo.
    git add -A
    git commit -m "Regenerar datos.json tras combinar con los cambios de GitHub" >nul
)

call node verificar.js
if errorlevel 1 (
    echo.
    echo ============================================================
    echo   SE DETUVO ANTES DE SUBIR.
    echo.
    echo   Al combinar tus cambios con los de GitHub quedaron datos
    echo   inconsistentes. NO se subio nada, para no publicar un
    echo   fotocheck equivocado.
    echo.
    echo   Corrige lo que aparece en rojo y vuelve a ejecutar.
    echo ============================================================
    goto :fin_error
)
echo.

REM ----------------------------------------------------------------
REM  PASO 6 - Subir a GitHub
REM ----------------------------------------------------------------
echo [6/7] Subiendo a GitHub...
git push origin %RAMA%
if errorlevel 1 (
    echo.
    echo   ERROR: No se pudo subir.
    echo   Tus cambios estan guardados localmente, no se perdio nada.
    echo   Vuelve a ejecutar este archivo; si sigue fallando, avisa.
    goto :fin_error
)
echo.

REM ----------------------------------------------------------------
REM  PASO 7 - Listo
REM ----------------------------------------------------------------
echo [7/7] Listo.
echo.
if defined SIN_CAMBIOS (
    echo ============================================================
    echo   TODO YA ESTABA AL DIA
    echo.
    echo   No habia nada nuevo que subir, y tu copia local quedo
    echo   sincronizada con GitHub.
    echo ============================================================
    echo.
    goto :fin
)
echo ============================================================
echo   ACTUALIZACION COMPLETADA
echo.
echo   Espera alrededor de 1 minuto y la web ya mostrara
echo   los datos nuevos al escanear cualquier QR:
echo   %REPO_URL%/perfil.html?id=1
echo.
echo   Los QR impresos NO necesitan reemplazarse.
echo ============================================================
echo.
choice /c SN /n /d N /t 15 /m "  Quieres abrir la pagina para revisarla? (S/N): " 2>nul
if errorlevel 255 goto :fin
if not errorlevel 2 start "" "%REPO_URL%/perfil.html?id=1"
goto :fin

REM ================================================================
REM  Salidas
REM ================================================================

:rebase_pendiente
echo.
echo ============================================================
echo   ATENCION: hay una actualizacion a medio terminar.
echo.
echo   Esto pasa si una subida anterior se interrumpio.
echo   Para cancelarla y volver a como estabas, abre Git Bash
echo   en esta carpeta y ejecuta:
echo.
echo       git rebase --abort
echo.
echo   Despues vuelve a ejecutar este archivo.
echo ============================================================
goto :fin_error

:conflicto_manual
set "GIT_EDITOR=true"
git rebase --abort >nul 2>&1
echo.
echo ============================================================
echo   SE DETUVO: conflicto que necesita tu decision.
echo.
echo   Los archivos de arriba se editaron en dos lados a la vez
echo   ^(en esta PC y directamente en la web de GitHub^), y hay
echo   que decidir con cual version quedarse. Eso no lo puedo
echo   decidir solo sin arriesgar tus datos.
echo.
echo   TUS CAMBIOS NO SE PERDIERON. Deje el repositorio limpio,
echo   tal como estaba antes de intentar subir, con tu commit
echo   intacto. No hay nada a medio terminar.
echo.
echo   Para resolverlo, mira la seccion "Si aparece un conflicto"
echo   del README, o pide ayuda antes de tocar nada.
echo ============================================================
goto :fin_error

:fin_error
echo.
pause
exit /b 1

:fin
echo.
pause
exit /b 0
